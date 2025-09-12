import { filter, find } from 'ramda';
import {
  action,
  computed,
  state,
  track,
  watch,
} from '@ringcentral-integration/core';
import type { ObjectMapKey } from '@ringcentral-integration/core/lib/ObjectMap';
import { sleep } from '@ringcentral-integration/utils';

import callDirections from '@ringcentral-integration/commons/enums/callDirections';
import { extendedControlStatus } from '@ringcentral-integration/commons/enums/extendedControlStatus';
import type {
  NormalizedSession,
} from '@ringcentral-integration/commons/interfaces/Webphone.interface';
import { Module } from '@ringcentral-integration/commons/lib/di';
import { proxify } from '@ringcentral-integration/commons/lib/proxy/proxify';
import { validateNumbers } from '@ringcentral-integration/commons/lib/validateNumbers';
import { trackEvents } from '@ringcentral-integration/commons/enums/trackEvents';
import { callErrors } from '@ringcentral-integration/commons/modules/Call/callErrors';
import { NumberValidError } from '@ringcentral-integration/commons/modules/Webphone/numberValidError';
import { recordStatus } from '@ringcentral-integration/commons/modules/Webphone/recordStatus';
import { sessionStatus } from '@ringcentral-integration/commons/modules/Webphone/sessionStatus';
import type {
  BeforeCallEndHandler,
  BeforeCallResumeHandler,
  CallEndHandler,
  CallHoldHandler,
  CallInitHandler,
  CallResumeHandler,
  CallRingHandler,
  CallStartHandler,
  Deps,
  OffEventHandler,
  SessionReplyOptions,
  SwitchCallActiveCallParams,
  TPickupInboundCall,
} from '@ringcentral-integration/commons/modules/Webphone/Webphone.interface';
import { webphoneErrors } from '@ringcentral-integration/commons/modules/Webphone/webphoneErrors';
import { webphoneMessages } from '@ringcentral-integration/commons/modules/Webphone/webphoneMessages';
import {
  isOnHold,
  isRing,
  sortByLastActiveTimeDesc,
  normalizeSession,
  rejectSession,
  replyWithMessage,
} from './webphoneHelper';
import { EVENTS } from './events';
import type { WebphoneSession } from './Webphone.interface';
import { WebphoneBase } from './WebphoneBase';

type InviteOptions = {
  extraHeaders?: Record<string, string>;
  homeCountryId?: string;
  fromNumber: string;
};
/**
 * @constructor
 * @description Web phone module to handle phone interaction with WebRTC.
 */
@Module({
  name: 'Webphone',
  deps: [],
})
export class Webphone extends WebphoneBase {
  protected _activeWebphoneActiveCallKey: string;
  protected _permissionCheck: boolean;
  protected _enableSharedState: boolean = false;

  constructor(deps: Deps) {
    super(deps);
    this._activeWebphoneActiveCallKey = `${deps.prefix}-active-webphone-active-call-key`;
    this._permissionCheck = this._deps.webphoneOptions?.permissionCheck ?? true;

    if (typeof deps.webphoneOptions?.onCallEnd === 'function') {
      this._eventEmitter.on(EVENTS.callEnd, deps.webphoneOptions?.onCallEnd);
    }
    if (typeof deps.webphoneOptions?.onCallRing === 'function') {
      this._eventEmitter.on(EVENTS.callRing, deps.webphoneOptions?.onCallRing);
    }
    if (typeof deps.webphoneOptions?.onCallStart === 'function') {
      this._eventEmitter.on(
        EVENTS.callStart,
        deps.webphoneOptions?.onCallStart,
      );
    }
    if (typeof deps.webphoneOptions?.onCallResume === 'function') {
      this._eventEmitter.on(
        EVENTS.callResume,
        deps.webphoneOptions?.onCallResume,
      );
    }
    if (typeof deps.webphoneOptions?.onCallHold === 'function') {
      this._eventEmitter.on(EVENTS.callHold, deps.webphoneOptions?.onCallHold);
    }
    if (typeof deps.webphoneOptions?.onCallInit === 'function') {
      this._eventEmitter.on(EVENTS.callInit, deps.webphoneOptions?.onCallInit);
    }
    if (typeof deps.webphoneOptions?.onBeforeCallResume === 'function') {
      this._eventEmitter.on(
        EVENTS.beforeCallResume,
        deps.webphoneOptions?.onBeforeCallResume,
      );
    }
    if (typeof deps.webphoneOptions?.onBeforeCallEnd === 'function') {
      this._eventEmitter.on(
        EVENTS.beforeCallEnd,
        deps.webphoneOptions?.onBeforeCallEnd,
      );
    }

    this._reconnectAfterSessionEnd = null;
    this._disconnectInactiveAfterSessionEnd = false;

    const enableContactMatchWhenNewCall =
      this._deps.webphoneOptions?.enableContactMatchWhenNewCall ?? true;
    if (enableContactMatchWhenNewCall && this._deps.contactMatcher) {
      this._deps.contactMatcher.addQuerySource({
        getQueriesFn: () => this.sessionPhoneNumbers,
        readyCheckFn: () => this.ready,
      });
    }

    if (this._deps.availabilityMonitor && this._deps.tabManager) {
      watch(
        this,
        () => this.sessions?.length,
        () => {
          const key = `sip-${this._deps.tabManager!.id}`;
          this._deps.availabilityMonitor!.setSharedState(key, {
            hasCallSession: this.webphoneSessions.length > 0,
          });
        },
      );
    }
  }

  override onInitOnce() {
    super.onInitOnce();
    if (this._enableSharedState) {
      watch(
        this,
        () => [
          this.activeSessionId,
          this.ringSessionId,
          this.lastEndedSessions,
          this.sessions,
        ],
        () => {
          if (!this._sharedSipClient?.active) {
            return;
          }
          this._sharedSipClient?.setSharedState({
            activeSessionId: this.activeSessionId,
            ringSessionId: this.ringSessionId,
            lastEndedSessions: this.lastEndedSessions,
            sessions: this.sessions,
          });
        },
        {
          multiple: true,
        },
      );
    }
  }

  @state
  activeSessionId?: string | null = null;

  @state
  ringSessionId?: string | null = null;

  @state
  lastEndedSessions: NormalizedSession[] = [];

  @state
  sessions: NormalizedSession[] = [];

  @action
  _updateSessionsState(sessions: NormalizedSession[]) {
    const cachedSessions = this.sessions.filter((x) => x.cached);
    cachedSessions.forEach((cachedSession) => {
      const session = sessions.find((x) => x.callId === cachedSession.callId);
      if (session) {
        session.cached = true;
      } else {
        cachedSession.removed = true;
        sessions.push(cachedSession);
      }
    });
    this.sessions = sessions.sort(sortByLastActiveTimeDesc);
  }

  @action
  _setActiveSessionId(sessionId: string) {
    this.activeSessionId = sessionId;
  }

  @action
  _setStateOnCallRing(session: NormalizedSession) {
    this.ringSessionId = session.callId;
  }

  @action
  _setStateOnCallStart(session: NormalizedSession) {
    this.activeSessionId = session.callId;
    if (this.ringSessionId === session.callId) {
      const ringSessions = this.sessions.filter((x) => isRing(x));
      this.ringSessionId = (ringSessions[0] && ringSessions[0].callId) || null;
    }
  }

  @action
  _setStateOnCallEnd(session: NormalizedSession) {
    if (this.activeSessionId === session.callId) {
      const activeSessions = this.sessions.filter((x) => !isRing(x));
      activeSessions.sort(sortByLastActiveTimeDesc);
      this.activeSessionId =
        (activeSessions[0] && activeSessions[0].callId) || null;
    }
    if (this.ringSessionId === session.callId) {
      const ringSessions = this.sessions.filter((x) => isRing(x));
      this.ringSessionId = (ringSessions[0] && ringSessions[0].callId) || null;
    }
    if (
      /**
       * don't add incoming call that isn't relied by current app
       *   to end sessions. this call can be answered by other apps
       */
      !session.startTime &&
      !session.isToVoicemail &&
      !session.isForwarded &&
      !session.isReplied
    ) {
      return;
    }
    const lastSessions = [session].concat(
      this.lastEndedSessions.filter((x) => x.callId !== session.callId),
    );
    this.lastEndedSessions = lastSessions.slice(0, 5);
  }

  @action
  _setSessionCaching(cachingSessionIds: string[]) {
    cachingSessionIds.forEach((sessionId) => {
      const session = this.sessions.find((x) => x.callId === sessionId);
      if (session) {
        session.cached = true;
      }
    });
  }

  @action
  _clearSessionCaching(sessions: NormalizedSession[]) {
    let needUpdate = false;
    this.sessions.forEach((session) => {
      if (session.cached) {
        session.cached = false;
        needUpdate = true;
      }
    });
    if (needUpdate) {
      this.sessions = this.sessions.filter((x) => !x.removed);
    }
    const activeSessions = sessions.filter((x) => !x.cached && !isRing(x));
    activeSessions.sort(sortByLastActiveTimeDesc);
    this.activeSessionId = (activeSessions[0] && activeSessions[0].callId) || null;
  }

  @action
  _onHoldCachedSession() {
    this.sessions.forEach((session) => {
      if (session.cached) {
        session.callStatus = sessionStatus.onHold;
        session.isOnHold = true;
      }
    });
  }

  @action
  _saveNewState(data) {
    if (typeof data.activeSessionId !== 'undefined') {
    this.activeSessionId = data.activeSessionId;
    }
    if (typeof data.ringSessionId !== 'undefined') {
      this.ringSessionId = data.ringSessionId;
    }
    if (typeof data.lastEndedSessions !== 'undefined') {
      this.lastEndedSessions = data.lastEndedSessions;
    }
    if (typeof data.sessions !== 'undefined') {
      this.sessions = data.sessions;
    }
  }

  override async _syncSharedState() {
    if (!this._enableSharedState) {
      return;
    }
    try {
      const sharedState = await this._sharedSipClient?.syncSharedState();
      this._saveNewState(sharedState);
    } catch (e) {
      this._logger.error('syncSharedState error', e);
    }
  }

  override _onSharedStateUpdated(state: Record<string, any>) {
    this._saveNewState(state);
  }

  override async _canBeActiveTabs() {
    const tabActive = this._deps.tabManager?.active;
    const noSessionsInOthers = this.webphoneSessions.length === this.sessions.length;
    return tabActive && noSessionsInOthers;
  }

  override _onStorageChangeEvent(e: StorageEvent) {
    super._onStorageChangeEvent(e);
    // unhold active calls in current tab
    if (e.key === this._activeWebphoneActiveCallKey) {
      this._holdOtherSession(e.newValue);
    }
  }

  _bindSessionEvents(session: WebphoneSession) {
    session.on('answered', () => {
      this._logger.log('answered');
      session.startTime = new Date();
      this._onCallStart(session);
      if (
        session.__rc_extendedControls &&
        session.__rc_extendedControlStatus === extendedControlStatus.pending
      ) {
        this._playExtendedControls(session);
      }
      this._ringtoneHelper?.stop();
      session.emit('accepted'); // For Conference Call back-compat
    });
    session.on('ringing', () => {
      this._logger.log('Call ringing...');
      this._updateSessions();
    });
    session.on('failed', (message) => {
      this._logger.log('Call failed', message);
    });
    session.on('disposed', () => {
      this._logger.log('Call: disposed');
      this._ringtoneHelper?.stop();
      this._onCallEnd(session);
      session.emit('terminated'); // For Conference Call back-compat
    });
    // TODO: get media stream error handler
  }

  override _onInvite(session: WebphoneSession) {
    super._onInvite(session);
    session.__rc_creationTime = Date.now();
    session.__rc_lastActiveTime = Date.now();
    if (!session.id) {
      session.id = session.callId;
    }
    this._bindSessionEvents(session);
    this._onCallRing(session);
    if (
      this.isWebphoneActiveTab &&
      this._ringtoneHelper &&
      (
        !this.activeSession ||
        isOnHold(this.activeSession)
      )
    ) {
      this._ringtoneHelper.play();
    }
  }

  async _playExtendedControls(session: WebphoneSession) {
    session.__rc_extendedControlStatus = extendedControlStatus.playing;
    const controls = session.__rc_extendedControls!.slice();
    for (let i = 0, len = controls.length; i < len; i += 1) {
      if (
        session.__rc_extendedControlStatus === extendedControlStatus.playing
      ) {
        if (controls[i] === ',') {
          await sleep(2000);
        } else {
          await this._sendDTMF(controls[i], session);
        }
      } else {
        return;
      }
    }
    session.__rc_extendedControlStatus = extendedControlStatus.stopped;
  }

  @track(trackEvents.inboundWebRTCCallConnected)
  _trackCallAnswer() {
    //
  }

  @proxify
  async answer(sessionId: string) {
    const session = this.sessions.find((session) => session.callId === sessionId);
    if (!session || !isRing(session)) {
      return;
    }
    const sipSession = this.originalSessions[sessionId];
    try {
      await this._holdOtherSession(sessionId);
      await sipSession.answer();
      this._trackCallAnswer();
    } catch (e) {
      this._logger.log('Accept failed');
      this._logger.error(e);
    }
  }

  @proxify
  async reject(sessionId: string) {
    const session = this.originalSessions[sessionId];
    if (!session || session.state === 'disposed') {
      return;
    }
    await rejectSession(session);
  }

  @proxify
  async ignore(sessionId: string) {
    const session = this.originalSessions[sessionId];
    if (!session || session.state === 'disposed') {
      return;
    }
    try {
      await session.decline();
    } catch (e) {
      this._logger.error(e);
      this._onCallEnd(session);
    }
  }

  @proxify
  async resume(sessionId: string) {
    await this.unhold(sessionId);
  }

  @proxify
  async startReply(sessionId: string) {
    const session = this.originalSessions[sessionId];
    if (!session) {
      return;
    }
    if (session.__rc_isStartedReply) {
      return;
    }
    try {
      session.__rc_isStartedReply = true;
      await session.startReply();
    } catch (e) {
      this._logger.error(e);
    }
  }

  @proxify
  async setForwardFlag(sessionId) {
    const session = this.originalSessions[sessionId];
    if (!session) {
      return false;
    }
    session.__rc_isForwarded = true;
    this._updateSessions();
  }

  @proxify
  async forward(sessionId: string, forwardNumber: string) {
    const session = this.originalSessions[sessionId];
    if (!session) {
      return false;
    }
    // only support PSTN number
    try {
      let validatedResult;
      let validPhoneNumber;
      if (!this._permissionCheck) {
        validatedResult = validateNumbers({
          allowRegionSettings:
            !!this._deps.brand.brandConfig.allowRegionSettings,
          areaCode: this._deps.regionSettings.areaCode,
          countryCode: this._deps.regionSettings.countryCode,
          phoneNumbers: [forwardNumber],
        });
        validPhoneNumber = validatedResult[0];
      } else {
        const isEDPEnabled = this._deps.appFeatures?.isEDPEnabled;
        validatedResult = isEDPEnabled
          ? this._deps.numberValidate.validate([forwardNumber])
          : await this._deps.numberValidate.validateNumbers([forwardNumber]);
        if (!validatedResult.result) {
          validatedResult.errors.forEach((error) => {
            this._deps.alert.warning({
              message:
                callErrors[error.type as ObjectMapKey<typeof callErrors>],
              payload: {
                phoneNumber: error.phoneNumber,
              },
            });
          });
          return false;
        }
        if (isEDPEnabled) {
          const parsedNumbers = await this._deps.numberValidate.parseNumbers([
            forwardNumber,
          ]);
          if (parsedNumbers) {
            validPhoneNumber =
              parsedNumbers[0].availableExtension ??
              parsedNumbers[0].parsedNumber;
          }
        } else {
          // @ts-expect-error
          validPhoneNumber = validatedResult.numbers?.[0]?.e164;
        }
      }
      session.__rc_isForwarded = true
      await session.forward(validPhoneNumber);
      this._logger.log('Forwarded');
      this._onCallEnd(session);
      this._addTrackAfterForward();
      return true;
    } catch (e) {
      this._logger.error(e);
      this._deps.alert.warning({
        message: webphoneErrors.forwardError,
      });
      this._addTrackAfterForward();
      return false;
    }
  }

  _addTrackAfterForward() {
    if (this.activeSession && !this.activeSession.isOnHold) {
      const rawActiveSession = this.originalSessions[this.activeSession.callId];
      this._addTrack(rawActiveSession);
    }
  }

  @proxify
  async mute(sessionId: string) {
    try {
      this._sessionHandleWithId(sessionId, (session: WebphoneSession) => {
        session.__rc_isOnMute = true;
        session.mute();
        this._updateSessions();
      });
      return true;
    } catch (e) {
      this._logger.error(e);
      this._deps.alert.warning({
        message: webphoneErrors.muteError,
      });
      return false;
    }
  }

  @proxify
  async unmute(sessionId: string) {
    this._sessionHandleWithId(sessionId, (session: WebphoneSession) => {
      session.__rc_isOnMute = false;
      session.unmute();
      this._updateSessions();
    });
  }

  @proxify
  async hold(sessionId: string) {
    const session = this.originalSessions[sessionId];
    if (!session) {
      return false;
    }
    if (session.__rc_localHold) {
      return true;
    }
    try {
      await session.hold();
      session.__rc_localHold = true;
      this._updateSessions();
      this._onCallHold(session);
      return true;
    } catch (e) {
      this._logger.error('hold error:', e);
      this._deps.alert.warning({
        message: webphoneErrors.holdError,
      });
      return false;
    }
  }

  async _holdOtherSession(currentSessionId: string | null) {
    await Promise.all(
      this.webphoneSessions.map(
        async (session: WebphoneSession) => {
          if (currentSessionId === session.callId) {
            return;
          }
          if (session.__rc_localHold) {
            return;
          }
          if (session.state === 'ringing') {
            return;
          }
          try {
            await session.hold();
            session.__rc_localHold = true;
          } catch (e) {
            this._logger.error('Hold call fail');
            throw e;
          }
          this._onCallHold(session);
        },
      ),
    );
    this._updateSessions();
    // update cached sessions
    this._onHoldCachedSession();
  }

  @proxify
  async unhold(sessionId: string) {
    const session = this.originalSessions[sessionId];
    if (!session) {
      return;
    }
    try {
      if (session.__rc_localHold) {
        await this._holdOtherSession(session.callId);
        this._onBeforeCallResume(session);
        await session.unhold();
        session.__rc_callStatus = sessionStatus.connected;
        session.__rc_localHold = false;
        this._updateSessions();
        this._onCallResume(session);
      }
    } catch (e) {
      this._logger.error(e);
    }
  }

  @proxify
  async startRecord(sessionId: string) {
    const session = this.originalSessions[sessionId];
    if (!session) {
      return;
    }
    // If the status of current session is not connected,
    // the recording process can not be started.
    if (session.__rc_callStatus === sessionStatus.connecting) {
      return;
    }
    try {
      session.__rc_recordStatus = recordStatus.pending;
      this._updateSessions();
      await session.startRecording();
      session.__rc_recordStatus = recordStatus.recording;
      this._updateSessions();
    } catch (e: any) {
      this._logger.error(e);
      session.__rc_recordStatus = recordStatus.idle;
      this._updateSessions();
      // Recording has been disabled
      if (e && e.code === -5) {
        this._deps.alert.danger({
          message: webphoneErrors.recordDisabled,
        });
        // Disabled phone recording
        session.__rc_recordStatus = recordStatus.noAccess;
        this._updateSessions();
        return;
      }
      this._deps.alert.danger({
        message: webphoneErrors.recordError,
        payload: {
          errorCode: e.code,
        },
      });
    }
  }

  @proxify
  async stopRecord(sessionId: string) {
    const session = this.originalSessions[sessionId];
    if (!session) {
      return;
    }
    try {
      session.__rc_recordStatus = recordStatus.pending;
      this._updateSessions();
      await session.stopRecording();
      session.__rc_recordStatus = recordStatus.idle;
      this._updateSessions();
    } catch (e) {
      this._logger.error(e);
      session.__rc_recordStatus = recordStatus.recording;
      this._updateSessions();
    }
  }

  @proxify
  async park(sessionId: string) {
    const session = this.originalSessions[sessionId];
    if (!session) {
      return;
    }
    try {
      const result = await session.park();
      this._logger.log('Parked');
      if (result['park extension']) {
        this._deps.alert.success({
          message: webphoneMessages.parked,
          payload: {
            parkedNumber: `*${result['park extension']}`,
          },
          ttl: 0,
        });
      }
    } catch (e) {
      this._logger.error(e);
    }
  }

  @proxify
  async transfer(transferNumber: string, sessionId: string) {
    const session = this.originalSessions[sessionId];
    if (!session) {
      return;
    }
    try {
      session.__rc_isOnTransfer = true;
      this._updateSessions();
      let numberResult;
      let validPhoneNumber;
      if (!this._permissionCheck) {
        try {
          numberResult = validateNumbers({
            allowRegionSettings:
              !!this._deps.brand.brandConfig.allowRegionSettings,
            areaCode: this._deps.regionSettings.areaCode,
            countryCode: this._deps.regionSettings.countryCode,
            phoneNumbers: [transferNumber],
          });
        } catch (error: any) {
          throw new NumberValidError([error]);
        }

        validPhoneNumber = numberResult && numberResult[0];
      } else {
        const isEDPEnabled = this._deps.appFeatures?.isEDPEnabled;
        const numberResult = isEDPEnabled
          ? this._deps.numberValidate.validate([transferNumber])
          : await this._deps.numberValidate.validateNumbers([transferNumber]);

        if (!numberResult.result) {
          throw new NumberValidError(numberResult.errors);
        }
        if (isEDPEnabled) {
          const parsedNumbers = await this._deps.numberValidate.parseNumbers([
            transferNumber,
          ]);
          validPhoneNumber =
            parsedNumbers?.[0].availableExtension ??
            parsedNumbers?.[0].parsedNumber;
        } else {
          // @ts-expect-error
          validPhoneNumber = numberResult.numbers?.[0]?.e164;
        }
      }
      await session.transfer(validPhoneNumber);
      session.__rc_isOnTransfer = false;
      this._updateSessions();
      this._onCallEnd(session);
    } catch (e: any) {
      session.__rc_isOnTransfer = false;
      this._updateSessions();

      if (e instanceof NumberValidError) {
        e.errors.forEach((error) => {
          this._deps.alert.warning({
            message: callErrors[error.type as ObjectMapKey<typeof callErrors>],
            payload: {
              phoneNumber: error.phoneNumber,
            },
          });
        });

        return;
      }

      this._deps.alert.danger({
        message: webphoneErrors.transferError,
      });
    }
  }

  @proxify
  async startWarmTransfer(transferNumber: string, sessionId: string) {
    const session = this.originalSessions[sessionId];
    if (!session) {
      return;
    }
    try {
      session.__rc_isOnTransfer = true;
      this._updateSessions();
      const numberResult = validateNumbers({
        allowRegionSettings: !!this._deps.brand.brandConfig.allowRegionSettings,
        areaCode: this._deps.regionSettings.areaCode,
        countryCode: this._deps.regionSettings.countryCode,
        phoneNumbers: [transferNumber],
      });
      const validPhoneNumber = numberResult && numberResult[0];
      const fromNumber =
        session.direction === 'outbound'
          ? session.remoteNumber
          : session.localNumber;
      await this.makeCall({
        toNumber: validPhoneNumber,
        fromNumber,
        homeCountryId: this._deps.regionSettings.homeCountryId,
        // TODO: should check that type issue
        // @ts-expect-error
        extendedControls: '',
        transferSessionId: sessionId,
      });
    } catch (e) {
      this._logger.error(e);
      session.__rc_isOnTransfer = false;
      this._updateSessions();
      this._deps.alert.danger({
        message: webphoneErrors.transferError,
      });
    }
  }

  @proxify
  async completeWarmTransfer(newSessionId: string) {
    const newSession = this.originalSessions[newSessionId];
    if (!newSession) {
      return;
    }
    const oldSessionId = newSession.__rc_transferSessionId;
    const oldSession = this.originalSessions[oldSessionId];
    if (!oldSession) {
      return;
    }
    newSession.__rc_isOnTransfer = true;
    this._updateSessions();
    try {
      await oldSession.completeWarmTransfer(newSession);
    } catch (e) {
      this._logger.error(e);
      newSession.__rc_isOnTransfer = false;
      this._updateSessions();
      this._deps.alert.danger({
        message: webphoneErrors.transferError,
      });
    }
  }

  @proxify
  async flip(flipValue: string, sessionId: string) {
    const session = this.originalSessions[sessionId];
    if (!session) {
      return;
    }
    try {
      await session.flip(flipValue);
      // this._onCallEnd(session);
      session.__rc_isOnFlip = true;
      this._logger.log('Flipped');
    } catch (e) {
      session.__rc_isOnFlip = false;
      this._deps.alert.warning({
        message: webphoneErrors.flipError,
      });
      this._logger.error(e);
    }
    this._updateSessions();
  }

  @proxify
  async _sendDTMF(dtmfValue: string, session: WebphoneSession) {
    try {
      await session.sendDtmf(dtmfValue, 100);
    } catch (e) {
      this._logger.error(e);
    }
  }

  @proxify
  async sendDTMF(dtmfValue: string, sessionId: string) {
    const session = this.originalSessions[sessionId];
    if (session) {
      await this._sendDTMF(dtmfValue, session);
    }
  }

  @proxify
  async hangup(sessionId: string) {
    const session = this.originalSessions[sessionId];
    if (!session) {
      return;
    }
    try {
      this._onBeforeCallEnd(session);
      await session.hangup();
    } catch (e) {
      this._logger.error(e);
      this._onCallEnd(session);
    }
  }

  @proxify
  async toVoiceMail(sessionId: string) {
    const session = this.originalSessions[sessionId];
    if (!session) {
      return;
    }
    try {
      session.__rc_isToVoicemail = true;
      await session.toVoicemail();
    } catch (e) {
      this._logger.error(e);
      this._onCallEnd(session);
      this._deps.alert.warning({
        message: webphoneErrors.toVoiceMailError,
      });
    }
  }

  @proxify
  async replyWithMessage(sessionId: string, replyOptions: SessionReplyOptions) {
    const session = this.originalSessions[sessionId];
    if (!session) {
      return;
    }
    try {
      session.__rc_isReplied = true;
      await replyWithMessage(session, replyOptions);
    } catch (e) {
      this._logger.error(e);
      this._onCallEnd(session);
    }
  }

  _addTrack(rawSession: WebphoneSession) {
    if (rawSession) {
      // TODO: check audio element max count
      // rawSession.addTrack(this._remoteVideo, this._localVideo);
    }
  }

  _sessionHandleWithId(
    sessionId: string,
    func: (session: WebphoneSession) => void,
  ) {
    const session = this.originalSessions[sessionId];
    if (!session) {
      return null;
    }
    return func(session);
  }

  async _invite(
    toNumber: string,
    {
      inviteOptions,
      extendedControls,
      transferSessionId,
    }: {
      inviteOptions: InviteOptions;
      extendedControls?: string[];
      transferSessionId?: string;
    },
  ) {
    if (!this._webphone) {
      this._deps.alert.warning({
        message: this.errorCode!, // TODO: error code
      });
      return null;
    }

    if (
      toNumber.length > 6 &&
      (!this._deps.availabilityMonitor ||
        !this._deps.availabilityMonitor.isVoIPOnlyMode)
    ) {
      const phoneLines = await this._fetchDL();
      if (phoneLines.length === 0) {
        this._deps.alert.warning({
          message: webphoneErrors.noOutboundCallWithoutDL,
        });
        return null;
      }
    }
    await this._holdOtherSession(null);
    let headers = {
      'Client-id': this._deps.webphoneOptions.appKey,
    };
    if (inviteOptions.extraHeaders) {
      headers = {
        ...inviteOptions.extraHeaders,
      };
    }
    if (inviteOptions.homeCountryId) {
      headers['P-rc-country-id'] = inviteOptions.homeCountryId;
    }
    this._webphone.call(
      toNumber,
      inviteOptions.fromNumber,
      {
        headers,
      },
    );
    const session = this._webphone.callSessions[this._webphone.callSessions.length - 1] as WebphoneSession;
    session.__rc_creationTime = Date.now();
    session.__rc_lastActiveTime = Date.now();
    session.__rc_fromNumber = inviteOptions.fromNumber!;
    session.__rc_extendedControls = extendedControls;
    session.__rc_extendedControlStatus = extendedControlStatus.pending;
    session.__rc_transferSessionId = transferSessionId!;
    this._bindSessionEvents(session);
    this._onCallInit(session);
    if (!session.id) {
      session.id = session.callId;
    }
    return session;
  }

  /**
   * start an outbound call.
   * @param {toNumber} recipient number
   * @param {fromNumber} call Id
   * @param {homeCountryId} homeCountry Id
   */
  @proxify
  async makeCall({
    toNumber,
    fromNumber,
    homeCountryId,
    extendedControls,
    transferSessionId,
  }: {
    toNumber: string;
    fromNumber: string;
    homeCountryId: string;
    extendedControls?: string[];
    transferSessionId?: string;
  }) {
    const inviteOptions = {
      sessionDescriptionHandlerOptions:
        this.acceptOptions.sessionDescriptionHandlerOptions,
      fromNumber,
      homeCountryId,
    };
    const result = await this._invite(toNumber, {
      inviteOptions,
      extendedControls,
      transferSessionId,
    });
    return result;
  }

  /**
   * switch a active call into web phone session.
   */
  @proxify
  async switchCall(
    { id, from, direction, to, sipData }: SwitchCallActiveCallParams,
    homeCountryId: string,
  ) {
    const extraHeaders = {
      'Replaces': `${id};to-tag=${sipData.fromTag};from-tag=${sipData.toTag}`,
      'RC-call-type': 'replace',
    };
    const toNumber =
      direction === callDirections.outbound ? to.phoneNumber : from.phoneNumber;
    const fromNumber =
      direction === callDirections.outbound ? from.phoneNumber : to.phoneNumber;
    const inviteOptions = {
      fromNumber,
      homeCountryId,
      extraHeaders,
    };
    const session = await this._invite(toNumber, {
      inviteOptions,
    });
    return session;
  }

  async pickupInboundCall({
    sessionId,
    toNumber,
    fromNumber,
    serverId,
  }: TPickupInboundCall) {
    const extraHeaders = {
      'RC-call-type': `inbound-pickup; session-id: ${sessionId}; server-id: ${serverId}`,
    };
    const inviteOptions = {
      sessionDescriptionHandlerOptions:
        this.acceptOptions.sessionDescriptionHandlerOptions,
      fromNumber,
      extraHeaders,
    };
    const session = await this._invite(toNumber, {
      inviteOptions,
    });
    return session;
  }

  @proxify
  async updateSessionMatchedContact(
    sessionId: string,
    contact: { id: string },
  ) {
    this._sessionHandleWithId(sessionId, (session) => {
      session.__rc_contactMatch = contact;
      this._updateSessions();
    });
  }

  @proxify
  async setSessionCaching(sessionIds: string[]) {
    this._setSessionCaching(sessionIds);
  }

  @proxify
  async clearSessionCaching() {
    this._clearSessionCaching(
      this.webphoneSessions.map(normalizeSession),
    );
  }

  @track((that: Webphone) =>
    that.isOnTransfer ? [trackEvents.coldTransferCall] : null,
  )
  _updateSessions() {
    // sync with webphone sessions
    this._updateSessionsState(
      this.webphoneSessions.map(normalizeSession),
    );
  }

  @proxify
  async toggleMinimized(sessionId: string) {
    this._sessionHandleWithId(sessionId, (session: WebphoneSession) => {
      session.__rc_minimized = !session.__rc_minimized;
      this._updateSessions();
    });
  }

  _onCallInit(session: WebphoneSession) {
    this._updateSessions();
    const normalizedSession = this._getNormalizedSession(session);
    this._setActiveSessionId(normalizedSession!.callId);

    if (
      this._deps.contactMatcher &&
      (!this._deps.tabManager || this._deps.tabManager.active)
    ) {
      this._deps.contactMatcher.triggerMatch();
    }
    this._eventEmitter.emit(
      EVENTS.callInit,
      normalizedSession,
      this.activeSession,
    );
  }

  _onCallStart(session: WebphoneSession) {
    this._updateSessions();
    const normalizedSession = this._getNormalizedSession(session);

    this._setStateOnCallStart(normalizedSession!);

    this._eventEmitter.emit(
      EVENTS.callStart,
      normalizedSession,
      this.activeSession,
    );
  }

  _onCallRing(session: WebphoneSession) {
    this._updateSessions();
    const normalizedSession = this._getNormalizedSession(session);
    this._setStateOnCallRing(normalizedSession!);

    if (
      this._deps.contactMatcher &&
      (!this._deps.tabManager || this._deps.tabManager.active)
    ) {
      this._deps.contactMatcher.triggerMatch();
    }
    if (this.activeSession && !isOnHold(this.activeSession)) {
      // TODO: play incoming sound
      // this._webphone!.userAgent.audioHelper.playIncoming(false);
    }
    this._eventEmitter.emit(
      EVENTS.callRing,
      normalizedSession,
      this.ringSession,
    );
  }

  _onBeforeCallEnd(session: WebphoneSession) {
    const normalizedSession = this._getNormalizedSession(session);
    this._eventEmitter.emit(
      EVENTS.beforeCallEnd,
      normalizedSession,
      this.activeSession,
    );
  }

  _releaseVideoElementsOnSessionsEmpty() {
    // TODO: check if this is needed
    // if (this._remoteVideo && this._localVideo && this.sessions.length === 0) {
    //   // Pause video elements to release system Video Wake Lock RCINT-15582
    //   if (!this._remoteVideo.paused) {
    //     this._remoteVideo.pause();
    //     this._remoteVideo.srcObject = null;
    //   }
    //   if (!this._localVideo.paused) {
    //     this._localVideo.pause();
    //   }
    // }
  }

  _onCallEnd(session: WebphoneSession) {
    session.__rc_extendedControlStatus = extendedControlStatus.stopped;
    const normalizedSession = this._getNormalizedSession(session);
    if (!normalizedSession) {
      return;
    }
    if (session.__rc_transferSessionId) {
      const transferSession =
        this.originalSessions[session.__rc_transferSessionId];
      if (transferSession) {
        transferSession.__rc_isOnTransfer = false;
      }
    }
    this._updateSessions();
    this._setStateOnCallEnd(normalizedSession);
    this._eventEmitter.emit(
      EVENTS.callEnd,
      normalizedSession,
      this.activeSession,
      this.ringSession,
    );
    this._releaseVideoElementsOnSessionsEmpty();
    this._setActive();
  }

  _onBeforeCallResume(session: WebphoneSession) {
    const normalizedSession = this._getNormalizedSession(session);
    this._eventEmitter.emit(
      EVENTS.beforeCallResume,
      normalizedSession,
      this.activeSession,
    );
  }

  _onCallResume(session: WebphoneSession) {
    const normalizedSession = this._getNormalizedSession(session);
    this._setActiveSessionId(normalizedSession!.callId);

    this._eventEmitter.emit(
      EVENTS.callResume,
      normalizedSession,
      this.activeSession,
    );
  }

  _onCallHold(session: WebphoneSession) {
    const normalizedSession = this._getNormalizedSession(session);
    this._eventEmitter.emit(
      EVENTS.callHold,
      normalizedSession,
      this.activeSession,
    );
  }

  onCallStart(handler: CallStartHandler) {
    this._eventEmitter.on(EVENTS.callStart, handler);
  }

  onCallInit(handler: CallInitHandler) {
    this._eventEmitter.on(EVENTS.callInit, handler);
  }

  onCallRing(handler: CallRingHandler) {
    this._eventEmitter.on(EVENTS.callRing, handler);
  }

  onCallEnd(handler: CallEndHandler) {
    this._eventEmitter.on(EVENTS.callEnd, handler);
  }

  onBeforeCallResume(handler: BeforeCallResumeHandler) {
    this._eventEmitter.on(EVENTS.beforeCallResume, handler);
  }

  onCallResume(handler: CallResumeHandler) {
    this._eventEmitter.on(EVENTS.callResume, handler);
  }

  onCallHold(handler: CallHoldHandler) {
    this._eventEmitter.on(EVENTS.callHold, handler);
  }

  onBeforeCallEnd(handler: BeforeCallEndHandler) {
    this._eventEmitter.on(EVENTS.beforeCallEnd, handler);
  }

  onWebphoneRegistered(handler: () => void): OffEventHandler {
    this._eventEmitter.on(EVENTS.webphoneRegistered, handler);
    return () => {
      this._eventEmitter.off(EVENTS.webphoneRegistered, handler);
    };
  }

  onWebphoneUnregistered(handler: () => void): OffEventHandler {
    this._eventEmitter.on(EVENTS.webphoneUnregistered, handler);
    return () => {
      this._eventEmitter.off(EVENTS.webphoneUnregistered, handler);
    };
  }

  override async _disconnect(force = false) {
    await super._disconnect(force);
    this._updateSessions();
  }

  @computed(({ sessions }: Webphone) => [sessions])
  get sessionPhoneNumbers(): string[] {
    const outputs: string[] = [];
    this.sessions.forEach((session) => {
      outputs.push(session.to);
      outputs.push(session.from);
    });
    return outputs;
  }

  /**
   * Current active session(Outbound and InBound that answered)
   */
  @computed(({ activeSessionId, sessions }: Webphone) => [
    activeSessionId,
    sessions,
  ])
  get activeSession(): NormalizedSession | null | undefined {
    if (!this.activeSessionId) {
      return null;
    }
    const activeSession = find(
      (session) => session.callId === this.activeSessionId,
      this.sessions,
    );
    return activeSession;
  }

  /**
   * Current ring session(inbound)
   */
  @computed(({ ringSessionId, sessions }: Webphone) => [
    ringSessionId,
    sessions,
  ])
  get ringSession(): NormalizedSession | null | undefined {
    if (!this.ringSessionId) {
      return null;
    }
    const session = find(
      (session) => session.callId === this.ringSessionId,
      this.sessions,
    );
    return session;
  }

  @computed(({ sessions }: Webphone) => [sessions])
  get ringSessions(): NormalizedSession[] {
    return filter((session) => isRing(session), this.sessions);
  }

  @computed(({ sessions }: Webphone) => [sessions])
  get onHoldSessions(): NormalizedSession[] {
    return filter((session) => isOnHold(session), this.sessions);
  }

  @computed(({ sessions }: Webphone) => [sessions])
  get cachedSessions(): NormalizedSession[] {
    return filter((session) => session.cached, this.sessions);
  }

  get acceptOptions() {
    // TODO: change audio device id
    return {
      sessionDescriptionHandlerOptions: {
        constraints: {
          audio: {
            deviceId: this._deps.audioSettings.inputDeviceId as string,
          },
          video: false,
        },
      },
    };
  }

  get isOnTransfer() {
    return this.activeSession && this.activeSession.isOnTransfer;
  }

  @computed(({ ringSessions }: Webphone) => [ringSessions])
  get ringingCallOnView(): NormalizedSession | null | undefined {
    return find((session) => !session.minimized, this.ringSessions);
  }

  private _getNormalizedSession(session: WebphoneSession) {
    return find((x) => x.callId === session.callId, this.sessions);
  }
}
