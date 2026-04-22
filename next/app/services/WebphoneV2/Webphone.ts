/* eslint-disable no-console */
import callDirections from '@ringcentral-integration/commons/enums/callDirections';
import { extendedControlStatus } from '@ringcentral-integration/commons/enums/extendedControlStatus';
import { trackEvents } from '@ringcentral-integration/commons/enums/trackEvents';
import type { NormalizedSession } from '@ringcentral-integration/commons/interfaces/Webphone.interface';
import { validateNumbers } from '@ringcentral-integration/commons/lib/validateNumbers';
import {
  AppFeatures,
  Auth,
  AvailabilityMonitor,
  Client,
  ExtensionDevice,
  ExtensionFeatures,
  RingCentralExtensions,
  RegionSettings,
  track,
  WebSocketSubscription as Subscription,
} from '@ringcentral-integration/micro-auth/src/app/services';
import {
  ContactMatcher,
  NumberValidate,
} from '@ringcentral-integration/micro-contacts/src/app/services';
import {
  Brand,
  Toast,
} from '@ringcentral-integration/micro-core/src/app/services';
import {
  action,
  applyMethod,
  computed,
  delegate,
  fromWatchValue,
  getRef,
  Initiator,
  injectable,
  optional,
  PortManager,
  state,
  StoragePlugin,
  watch,
} from '@ringcentral-integration/next-core';
import { sleep } from '@ringcentral-integration/utils';
import { find } from 'ramda';
import {
  filter,
  firstValueFrom,
  map,
  merge,
  of,
  race,
  share,
  Subject,
  switchMap,
  timer,
} from 'rxjs';

import { AudioSettings } from '@ringcentral-integration/micro-phone/src/app/services/AudioSettings';

import type {
  ActiveWebphoneChangedHandler,
  BeforeCallEndHandler,
  BeforeCallResumeHandler,
  CallEndHandler,
  CallHoldHandler,
  CallInitHandler,
  CallResumeHandler,
  CallRingHandler,
  CallStartHandler,
  CallVoicemailDroppedHandler,
  IncomingRequest,
  OffEventHandler,
  SessionReplyOptions,
  SwitchCallActiveCallParams,
  TPickupInboundCall,
  WebphoneOptions,
  WebphoneSession,
} from './Webphone.interface';
import { NoiseReduction } from '../NoiseReduction';
import { VoicemailDrop } from '../VoicemailDrop';
import { WebphoneBase } from './WebphoneBase';
import { EVENTS } from './events';
import { t } from './i18n';
import { recordStatus } from './recordStatus';
import { sessionStatus } from './sessionStatus';
import { voicemailDropStatus } from './voicemailDropStatus';
import {
  extractHeadersData,
  isOnHold,
  isDroppingVoicemail,
  isPickupReason,
  isRing,
  normalizeSession,
  rejectSession,
  replyWithMessage,
  sortByLastActiveTimeDesc,
} from './webphoneHelper';

export const INCOMING_CALL_INVALID_STATE_ERROR_CODE = 2;
const webphoneHandleTimeoutName = 'webphoneHandleTimeoutName';
const WEBPHONE_ACTIVE_CLIENT_CHANNEL = 'webphoneActiveClient';

export class NumberValidError extends Error {
  constructor() {
    super('validate phone numbers fail');
  }
}

@injectable({
  name: 'Webphone',
})
export class Webphone extends WebphoneBase {
  private get _permissionCheck() {
    return this._webphoneOptions?.permissionCheck ?? true;
  }

  readonly invite$ = new Subject<WebphoneSession>();

  private readonly _end$ = new Subject<
    [WebphoneSession, IncomingRequest | undefined]
  >();
  /**
   * # this event only work in main tab
   */
  readonly end$ = this._end$.pipe(
    // when have p-rc-reason, that means that call be switch to other device, should not emit the event
    filter(([_, e]) => !isPickupReason(e)),
    map(([session]) => session),
    share(),
  );

  private _ignore$ = new Subject<string>();

  get ignore$() {
    if (
      process.env.NODE_ENV !== 'production' &&
      this._portManager.shared &&
      !this._portManager.isServer
    ) {
      throw new Error(
        "ignore$ can't be used in client, should always call in server",
      );
    }

    return this._ignore$;
  }

  constructor(
    protected _initiator: Initiator,
    protected _regionSettings: RegionSettings,
    protected override _numberValidate: NumberValidate,
    protected override _auth: Auth,
    protected override _toast: Toast,
    protected override _client: Client,
    protected override _appFeatures: AppFeatures,
    protected override _extensionFeatures: ExtensionFeatures,
    protected override _brand: Brand,
    protected override _audioSettings: AudioSettings,
    protected override _storage: StoragePlugin,
    protected override _portManager: PortManager,
    protected override _extensionDevice: ExtensionDevice,
    protected override _ringCentralExtensions: RingCentralExtensions,
    @optional('WebphoneOptions')
    protected override _webphoneOptions: WebphoneOptions,
    @optional('Subscription')
    protected override _subscription?: Subscription,
    @optional()
    protected _contactMatcher?: ContactMatcher,
    @optional()
    protected _availabilityMonitor?: AvailabilityMonitor,
    @optional()
    protected _noiseReduction?: NoiseReduction,
    @optional()
    protected _voicemailDrop?: VoicemailDrop,
    @optional('Prefix') protected override _prefix?: string,
  ) {
    super(
      _brand,
      _auth,
      _toast,
      _client,
      _numberValidate,
      _appFeatures,
      _extensionFeatures,
      _extensionDevice,
      _audioSettings,
      _storage,
      _portManager,
      _ringCentralExtensions,
      _webphoneOptions,
      _subscription,
      _prefix,
    );
    globalThis.externalClearTimeout = clearTimeout;
    globalThis.externalSetTimeout = setTimeout;

    const enableContactMatchWhenNewCall =
      this._webphoneOptions?.enableContactMatchWhenNewCall ?? true;
    if (enableContactMatchWhenNewCall && this._contactMatcher) {
      this._contactMatcher.addQuerySource({
        getQueriesFn: () => this.sessionPhoneNumbers,
        readyCheckFn: () => this.ready,
      });
    }

    if (this._portManager.shared) {
      this._portManager.checkMainTabMapping.set(
        this,
        () => this._isAuthoritativeWebphoneClient(),
      );
      this._portManager.customClientDelegateNameMapping.set(
        this,
        WEBPHONE_ACTIVE_CLIENT_CHANNEL,
      );
      this._setupActiveWebphoneTransportListeners();
      watch(
        this,
        () => [this.ready, this._portManager.activeTabId, this.sessions.length],
        () => {
          if (this.ready && this._portManager.isActiveTab) {
            void this._onTabActive();
          }
          this._emitActiveWebphoneChangedEvent();
        },
        {
          multiple: true,
        },
      );
    }

    if (this._portManager.shared) {
      this._portManager.onMainTab(() => {
        let reloadResolve: (() => void) | null = null;
        return watch(
          this,
          () => this.hasCallSessions,
          () => {
            if (this.hasCallSessions) {
              this._initiator.reloadPromise = new Promise((resolve) => {
                reloadResolve = resolve;
              });
            } else {
              reloadResolve?.();
              reloadResolve = null;
              this._initiator.reloadPromise = null;
            }
          },
        );
      });
      if (this._portManager.isWorkerMode) {
        this._portManager.onClient((transport) => {
          let timeoutId = 0;
          const timeoutMap = new Map<number, () => void>();
          globalThis.externalSetTimeout = ((
            callback: (args: void) => void,
            timeout?: number,
          ): number => {
            timeoutId += 1;
            const currentTimeoutId = timeoutId;
            timeoutMap.set(currentTimeoutId, callback);
            transport
              .emit(
                {
                  name: 'webphoneHandleTimeoutName' as any,
                  // The transport response timeout should be longer than the external timer duration.
                  timeout: timeout! + 5 * 60 * 1000,
                },
                timeout,
              )
              .then(() => {
                const callback = timeoutMap.get(currentTimeoutId);
                if (callback) {
                  timeoutMap.delete(currentTimeoutId);
                  callback();
                }
              });
            return timeoutId;
          }) as typeof setTimeout;
          globalThis.externalClearTimeout = ((timeoutId: number) => {
            timeoutMap.delete(timeoutId);
          }) as typeof clearTimeout;
        });
        this._portManager.onServer((transport) => {
          // @ts-ignore
          transport.listen(webphoneHandleTimeoutName, async (timeout) => {
            // SIP.js issue: https://github.com/onsip/SIP.js/issues/1071
            // Workaround:
            // Heavy throttling of chained JS timers beginning in Chrome 88
            // Need to execute timer in shared worker
            // https://developer.chrome.com/blog/timer-throttling-in-chrome-88
            await sleep(timeout);
          });
        });
      }
    }
  }

  protected override initialize(): void {
    super.initialize();
    if (typeof this._webphoneOptions?.onCallEnd === 'function') {
      this._eventEmitter.on(EVENTS.callEnd, this._webphoneOptions?.onCallEnd);
    }
    if (typeof this._webphoneOptions?.onCallRing === 'function') {
      this._eventEmitter.on(EVENTS.callRing, this._webphoneOptions?.onCallRing);
    }
    if (typeof this._webphoneOptions?.onCallStart === 'function') {
      this._eventEmitter.on(
        EVENTS.callStart,
        this._webphoneOptions?.onCallStart,
      );
    }
    if (typeof this._webphoneOptions?.onCallResume === 'function') {
      this._eventEmitter.on(
        EVENTS.callResume,
        this._webphoneOptions?.onCallResume,
      );
    }
    if (typeof this._webphoneOptions?.onCallHold === 'function') {
      this._eventEmitter.on(EVENTS.callHold, this._webphoneOptions?.onCallHold);
    }
    if (typeof this._webphoneOptions?.onCallInit === 'function') {
      this._eventEmitter.on(EVENTS.callInit, this._webphoneOptions?.onCallInit);
    }
    if (typeof this._webphoneOptions?.onBeforeCallResume === 'function') {
      this._eventEmitter.on(
        EVENTS.beforeCallResume,
        this._webphoneOptions?.onBeforeCallResume,
      );
    }
    if (typeof this._webphoneOptions?.onBeforeCallEnd === 'function') {
      this._eventEmitter.on(
        EVENTS.beforeCallEnd,
        this._webphoneOptions?.onBeforeCallEnd,
      );
    }

    this._reconnectAfterSessionEnd = null;
  }

  protected override async _canBeActiveTabs() {
    const tabActive = this._portManager.isActiveTab;
    const noSessionsInOthers = this.webphoneSessions.length === this.sessions.length;
    return tabActive && noSessionsInOthers;
  }

  protected override _onActiveTabIdChanged() {
    this.logger.log('onActiveTabIdChanged', this._portManager.isActiveTab);
    if (this._portManager.isActiveTab) {
      void this._onTabActive();
    }
    this._emitActiveWebphoneChangedEvent();
  }

  /**
   * Registers transport listeners on both client and server for the custom
   * webphone active client channel used by `@delegate('mainClient')` with
   * `customClientDelegateNameMapping`.
   */
  private _setupActiveWebphoneTransportListeners() {
    const channelName = WEBPHONE_ACTIVE_CLIENT_CHANNEL;
    const resolveActiveClientId = () => this.activeWebphoneId;
    this._portManager.onClient((transport: any) => {
      transport.listen(channelName, async (params: any) => {
        const activeClientId = resolveActiveClientId();
        const isTarget =
          activeClientId === this._portManager.clientId ||
          (!activeClientId && this._portManager.isActiveTab);
        if (!isTarget) {
          return new Promise(() => {
            // not the target tab -- hang so the server picks the next transport
          });
        }
        const module = getRef(this as any).modules![params.module];
        return applyMethod(module, params);
      });
    });
    this._portManager.onServer((transport: any) => {
      transport.listen(channelName, async (params: any) => {
        if (!this._portManager.isWorkerMode) {
          const activeClientId = resolveActiveClientId();
          const isTarget =
            activeClientId === this._portManager.clientId ||
            (!activeClientId && this._portManager.isActiveTab);
          if (isTarget) {
            const module = getRef(this as any).modules![params.module];
            return applyMethod(module, params);
          }
        }
        if (
          !this._portManager.activeTabId &&
          !this._portManager.mainClientId
        ) {
          await this._portManager.promiseMainTabClient;
        }
        const targetClientId =
          resolveActiveClientId() ??
          this._portManager.activeTabId ??
          this._portManager.mainClientId;
        if (!targetClientId) {
          return new Promise(() => {
            // no active client available
          });
        }
        return transport.emit(
          { name: channelName, clientIds: [targetClientId] },
          params,
        );
      });
    });
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
  private _updateSessionsState(sessions: NormalizedSession[]) {
    this.sessions.splice(
      0,
      this.sessions.length,
      ...sessions.sort(sortByLastActiveTimeDesc),
    );
  }

  @delegate('server')
  async updateSessionsState(sessions: NormalizedSession[]) {
    this._updateSessionsState(sessions);
  }

  @action
  _setActiveSessionId(sessionId: string) {
    this.activeSessionId = sessionId;
  }

  @delegate('server')
  async setActiveSessionId(sessionId: string) {
    this._setActiveSessionId(sessionId);
  }

  @action
  _setStateOnCallRing(session: NormalizedSession) {
    this.ringSessionId = session.id;
  }

  @delegate('server')
  async setStateOnCallRing(session: NormalizedSession) {
    this._setStateOnCallRing(session);
  }

  @action
  _setStateOnCallStart(session: NormalizedSession) {
    this.activeSessionId = session.id;
    if (this.ringSessionId === session.id) {
      const ringSessions = this.sessions.filter((x) => isRing(x));
      this.ringSessionId = (ringSessions[0] && ringSessions[0].id) || null;
    }
  }

  @delegate('server')
  async setStateOnCallStart(session: NormalizedSession) {
    this._setStateOnCallStart(session);
  }

  @action
  private _setStateOnCallEnd(session: NormalizedSession) {
    if (this.activeSessionId === session.id) {
      const activeSessions = this.sessions.filter((x) => !isRing(x));
      activeSessions.sort(sortByLastActiveTimeDesc);
      this.activeSessionId =
        (activeSessions[0] && activeSessions[0].id) || null;
    }
    if (this.ringSessionId === session.id) {
      const ringSessions = this.sessions.filter((x) => isRing(x));
      this.ringSessionId = (ringSessions[0] && ringSessions[0].id) || null;
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
      this.lastEndedSessions.filter((x) => x.id !== session.id),
    );
    this.lastEndedSessions = lastSessions.slice(0, 5);
  }

  @delegate('server')
  async setStateOnCallEnd(session: NormalizedSession) {
    this._setStateOnCallEnd(session);
  }

  /**
   * the process when accept the call, both for inbound and outbound call
   */
  private _onAccepted(session: WebphoneSession) {
    if ((session as WebphoneSession & { __rc_eventsBound?: boolean }).__rc_eventsBound) {
      return;
    }
    (session as WebphoneSession & { __rc_eventsBound?: boolean }).__rc_eventsBound =
      true;
    this._prepareSession(session);
    // Session is non-serializable data, how to log?
    this.logger.log('initWebphoneSessionEvents', session.id || session.callId);

    session.on('answered', async () => {
      if (session.__rc_callStatus === sessionStatus.finished) {
        return;
      }
      this.logger.log('accepted');
      session.startTime = new Date();
      session.__rc_callStatus = sessionStatus.connected;
      extractHeadersData(session, session.sipMessage?.headers);
      await this._onCallStart(session);
      if (
        session.__rc_extendedControls &&
        session.__rc_extendedControlStatus === extendedControlStatus.pending
      ) {
        this._playExtendedControls(session);
      }
      this.stopRingtone();
    });
    session.on('ringing', async () => {
      this.logger.log('progress...');
      session.__rc_callStatus = sessionStatus.connecting;
      extractHeadersData(session, session.sipMessage?.headers);
      this.invite$.next(session);
      await this._updateSessions();
    });
    session.on('failed', async (message) => {
      this.logger.log('Failed', message);
      session.__rc_callStatus = sessionStatus.finished;
      await this._onCallEnd(session);
    });
    session.on('disposed', async () => {
      this.logger.log('Terminated');
      this._end$.next([session, undefined]);
      session.__rc_callStatus = sessionStatus.finished;
      this.stopRingtone();
      await this._onCallEnd(session);
    });
    session.on('mediaStreamSet', (stream) => {
      this._noiseReduction?.denoiser(session.callId, stream);
    });
    session.on('disposed', () => {
      this._noiseReduction?.reset(session.callId);
    });
  }

  override async _onInvite(session: WebphoneSession) {
    this._prepareSession(session);
    this._onAccepted(session);
    this.invite$.next(session);
    session.__rc_creationTime = Date.now();
    session.__rc_lastActiveTime = Date.now();
    session.__rc_direction = callDirections.inbound;
    session.__rc_callStatus = sessionStatus.connecting;
    extractHeadersData(session, session.sipMessage?.headers);
    await this._onCallRing(session);
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
          await this.sendDTMF(controls[i], session.callId);
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

  @delegate('mainClient')
  async answer(sessionId: string) {
    const sipSession = this.originalSessions[sessionId];
    const session = this.sessions.find((session) => session.id === sessionId);
    if (!session || !isRing(session)) {
      return;
    }
    try {
      await this._holdOtherSession(sessionId);
      await sipSession.answer();
      this._trackCallAnswer();
    } catch (e: any) {
      this.logger.log('Accept failed', e);
      if (e.code !== INCOMING_CALL_INVALID_STATE_ERROR_CODE) {
        // FIXME:
        // 2 means the call is answered
        await this._onCallEnd(sipSession);
      }
    }
  }

  @delegate('mainClient')
  async reject(sessionId: string) {
    const session = this.originalSessions[sessionId];
    const activeSession = this._getNormalizedSession(session);
    const isCallQueueCall = activeSession?.callQueueName;

    if (!session || session.__rc_callStatus === sessionStatus.finished) {
      return;
    }
    try {
      if (isCallQueueCall) {
        await session.decline();
        await this.emitIgnoreEvent(sessionId);
        return;
      }
      await rejectSession(session);
      this.emitIgnoreEvent(sessionId);
    } catch (e) {
      this.logger.log('reject fail', e);
      await this._onCallEnd(session);
    }
  }

  // ignore not have socket event, because that be current device behaviors, so emit ignore event for outside know that
  @delegate('server')
  private async emitIgnoreEvent(sessionId: string) {
    this._ignore$.next(sessionId);
  }

  @delegate('mainClient')
  async resume(sessionId: string) {
    await this.unhold(sessionId);
  }

  @delegate('mainClient')
  async forward(sessionId: string, forwardNumber: string) {
    const session = this.originalSessions[sessionId];
    if (!session) {
      return false;
    }
    try {
      let validatedResult;
      let validPhoneNumber;
      if (!this._permissionCheck) {
        validatedResult = validateNumbers({
          allowRegionSettings: !!this._brand.brandConfig.allowRegionSettings,
          areaCode: this._regionSettings.areaCode,
          countryCode: this._regionSettings.countryCode,
          phoneNumbers: [forwardNumber],
        });
        validPhoneNumber = validatedResult[0];
      } else {
        const isEDPEnabled = this._appFeatures.isEDPEnabled;
        validatedResult = isEDPEnabled
          ? this._numberValidate.validate([forwardNumber])
          : await this._numberValidate.validateNumbers([forwardNumber]);

        if (!validatedResult.result) {
          this._numberValidate.handleValidateToasts(validatedResult);
          return false;
        }
        if (isEDPEnabled) {
          const parsedNumbers = await this._numberValidate.parseNumbers([
            forwardNumber,
          ]);
          if (parsedNumbers) {
            validPhoneNumber =
              parsedNumbers[0].availableExtension ??
              parsedNumbers[0].parsedNumber;
          }
        } else {
          // TODO: fix type
          // @ts-ignore
          validPhoneNumber = validatedResult.numbers?.[0]?.e164;
        }
      }
      session.__rc_isForwarded = true;
      await session.forward(validPhoneNumber);
      this.logger.log('Forwarded successfully');
      await this._onCallEnd(session);
      this._addTrackAfterForward();
      return true;
    } catch (e) {
      this.logger.error(`forward fail`, e);
      this._toast.warning({
        message: t('failWithoutStatusCode', {
          brandName: this._brand.name,
        }),
      });
      this._addTrackAfterForward();
      return false;
    }
  }

  _addTrackAfterForward() {
    if (this.activeSession && !this.activeSession.isOnHold) {
      const rawActiveSession = this.originalSessions[this.activeSession.id];
      this._addTrack(rawActiveSession);
    }
  }

  async mute(
    sessionId: string,
    errorHandler?: (error: any) => void | Promise<void>,
  ) {
    try {
      return await this._delegateMute(sessionId);
    } catch (e) {
      this.logger.error(`mute fail`, e);
      if (errorHandler) {
        errorHandler(e);
      } else {
        this._toast.warning({
          message: t('muteError'),
        });
      }
      return false;
    }
  }

  @delegate('mainClient')
  private async _delegateMute(sessionId: string) {
    this._sessionHandleWithId(sessionId, async (session: WebphoneSession) => {
      session.__rc_isOnMute = true;
      session.mute();
      await this._updateSessions();
    });
    return true;
  }

  @delegate('mainClient')
  async unmute(sessionId: string) {
    this._sessionHandleWithId(sessionId, async (session: WebphoneSession) => {
      session.__rc_isOnMute = false;
      session.unmute();
      await this._updateSessions();
    });
  }

  async hold(
    sessionId: string,
    errorHandler?: (error: any) => void | Promise<void>,
  ) {
    try {
      return await this._delegateHold(sessionId);
    } catch (e) {
      this.logger.error(`hold error:`, e);
      if (errorHandler) {
        errorHandler(e);
      } else {
        this._toast.warning({
          message: t('holdError'),
        });
      }
      return false;
    }
  }

  @delegate('mainClient')
  private async _delegateHold(sessionId: string) {
    const session = this.originalSessions[sessionId];
    if (!session) {
      return false;
    }
    if (session.localHold) {
      return true;
    }
    await session.hold();
    session.__rc_localHold = true;
    session.__rc_callStatus = sessionStatus.onHold;
    await this._updateSessions();
    this._onCallHold(session);
    return true;
  }

  async _holdOtherSession(currentSessionId: string | null) {
    await Promise.all(
      Object.values(this.originalSessions).map(
        async (session: WebphoneSession) => {
          if (currentSessionId === session.id) {
            return;
          }
          if (session.localHold) {
            return;
          }
          if (session.__rc_callStatus === sessionStatus.connecting) {
            return;
          }

          await session.hold();
          session.__rc_localHold = true;
          session.__rc_callStatus = sessionStatus.onHold;
          this._onCallHold(session);
        },
      ),
    );
    await this._updateSessions();
  }

  async unhold(
    sessionId: string,
    errorHandler?: (error: any) => Promise<void> | void,
  ) {
    try {
      await this._delegateUnhold(sessionId);
    } catch (e) {
      this.logger.log(`unhold fail`, e);
      errorHandler?.(e);
    }
  }

  @delegate('mainClient')
  private async _delegateUnhold(sessionId: string) {
    const session = this.originalSessions[sessionId];
    if (!session) {
      return;
    }
    if (session.localHold) {
      await this._holdOtherSession(session.id);
      this._onBeforeCallResume(session);
      await session.unhold();
      session.__rc_localHold = false;
      session.__rc_callStatus = sessionStatus.connected;
      await this._updateSessions();
      await this._onCallResume(session);
    }
  }

  @delegate('mainClient')
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
      await this._updateSessions();
      await session.startRecording();
      session.__rc_recordStatus = recordStatus.recording;
      await this._updateSessions();
    } catch (e: any) {
      this.logger.error(`start record fail`, e);
      session.__rc_recordStatus = recordStatus.idle;
      await this._updateSessions();
      // Recording has been disabled
      if (e && e.code === -5) {
        this._toast.danger({
          message: t('recordDisabled'),
        });
        // Disabled phone recording
        session.__rc_recordStatus = recordStatus.noAccess;
        await this._updateSessions();
        return;
      }
      this._toast.danger({
        message: t('recordError', {
          errorCode: e.code,
        }),
      });
    }
  }

  async stopRecord(
    sessionId: string,
    errorHandler?: (error: any) => void | Promise<void>,
  ) {
    try {
      await this._delegateStopRecord(sessionId);
    } catch (e) {
      this.logger.error(`stop record fail`, e);
      errorHandler?.(e);
    }
  }

  @delegate('mainClient')
  private async _delegateStopRecord(sessionId: string) {
    const session = this.originalSessions[sessionId];
    if (!session) {
      return;
    }
    try {
      session.__rc_recordStatus = recordStatus.pending;
      await this._updateSessions();
      await session.stopRecording();
      session.__rc_recordStatus = recordStatus.idle;
      await this._updateSessions();
    } catch (e) {
      session.__rc_recordStatus = recordStatus.recording;
      await this._updateSessions();
      throw e;
    }
  }

  @delegate('mainClient')
  async park(sessionId: string) {
    const session = this.originalSessions[sessionId];
    if (!session) {
      return;
    }
    try {
      const result = await session.park();
      this.logger.log('Parked successfully', result);
      if (result['park extension']) {
        const parkedNumber = `*${result['park extension']}`;
        this._toast.success({
          message: t('parked', {
            parkedNumber,
          }),
          ttl: 0,
        });
        return parkedNumber;
      }
    } catch (e) {
      this.logger.log('park fail', e);
    }
  }

  @delegate('mainClient')
  async parkToLocation(
    sessionId: string,
    extension: { id: string; name?: string; extensionNumber?: string },
  ) {
    const session = this.originalSessions[sessionId];
    if (!session) {
      return;
    }
    if (!extension?.id) {
      return;
    }
    try {
      await session.transfer(`prk${extension.id}`);
      this.logger.log('Parked to location', extension.id);
      const parkedNumber =
        extension.name || extension.extensionNumber || extension.id;
      this._toast.success({
        message: t('parked', {
          parkedNumber,
        }),
        ttl: 0,
      });
      return parkedNumber;
    } catch (e) {
      this.logger.log('parkToLocation fail', e);
    }
  }

  @delegate('mainClient')
  async pickParkLocation(
    extensionId: string,
    activeCall: {
      direction: string;
      from: string;
      to: string;
      fromName?: string;
      toName?: string;
      telephonySessionId: string;
      sipData?: { fromTag: string; toTag: string };
    },
    fromNumber: string,
  ) {
    return this._pickOtherExtensionCall({
      extensionId,
      fromNumber,
      pickPrefix: 'prk',
      activeCall,
      overrideLocal: false,
    });
  }

  @delegate('mainClient')
  async pickGroupCall(
    extensionId: string,
    activeCall: {
      direction: string;
      from: string;
      to: string;
      fromName?: string;
      toName?: string;
      telephonySessionId: string;
      sipData?: { fromTag: string; toTag: string };
    },
    fromNumber: string,
    pickPrefix = 'gcp',
  ) {
    return this._pickOtherExtensionCall({
      extensionId,
      fromNumber,
      pickPrefix,
      activeCall,
      overrideLocal: true,
    });
  }

  private async _pickOtherExtensionCall({
    extensionId,
    activeCall,
    fromNumber,
    pickPrefix,
    overrideLocal = false,
  }: {
    extensionId: string;
    activeCall: {
      direction: string;
      from: string;
      to: string;
      fromName?: string;
      toName?: string;
      telephonySessionId: string;
      sipData?: { fromTag: string; toTag: string };
    };
    fromNumber: string;
    pickPrefix: string;
    overrideLocal?: boolean;
  }) {
    const isInbound = activeCall.direction === callDirections.inbound;
    const extraHeaders = activeCall.sipData
      ? [
          `Replaces: ${activeCall.telephonySessionId};to-tag=${activeCall.sipData.fromTag};from-tag=${activeCall.sipData.toTag};early-only`,
        ]
      : [];
    const inviteOptions: {
      fromNumber: string;
      extraHeaders: string[];
    } = {
      fromNumber,
      extraHeaders,
    };
    const session = await this._invite(`${pickPrefix}${extensionId}`, {
      inviteOptions,
    });
    return session;
  }

  @delegate('mainClient')
  async transfer(transferNumber: string, sessionId: string) {
    const session = this.originalSessions[sessionId];
    if (!session) {
      return;
    }
    try {
      session.__rc_isOnTransfer = true;
      await this._updateSessions();
      let numberResult;
      let validPhoneNumber;
      if (!this._permissionCheck) {
        try {
          numberResult = validateNumbers({
            allowRegionSettings: !!this._brand.brandConfig.allowRegionSettings,
            areaCode: this._regionSettings.areaCode,
            countryCode: this._regionSettings.countryCode,
            phoneNumbers: [transferNumber],
          });
        } catch (error: any) {
          this._numberValidate.handleValidateToasts({
            result: false,
            errors: [error],
          });
          throw new NumberValidError();
        }

        validPhoneNumber = numberResult && numberResult[0];
      } else {
        const isEDPEnabled = this._appFeatures.isEDPEnabled;
        const numberResult = isEDPEnabled
          ? this._numberValidate.validate([transferNumber])
          : await this._numberValidate.validateNumbers([transferNumber]);

        if (!numberResult.result) {
          this._numberValidate.handleValidateToasts(numberResult);
          throw new NumberValidError();
        }
        if (isEDPEnabled) {
          const parsedNumbers = await this._numberValidate.parseNumbers([
            transferNumber,
          ]);
          validPhoneNumber =
            parsedNumbers?.[0].availableExtension ??
            parsedNumbers?.[0].parsedNumber;
        } else {
          // TODO: fix type
          // @ts-ignore
          validPhoneNumber = numberResult.numbers?.[0]?.e164;
        }
      }
      await session.transfer(validPhoneNumber);
      session.__rc_isOnTransfer = false;
      await this._updateSessions();
      await this._onCallEnd(session);
    } catch (e) {
      session.__rc_isOnTransfer = false;
      await this._updateSessions();

      if (e instanceof NumberValidError) {
        return;
      }

      this._showTransferError();
    }
  }

  private _showTransferError() {
    this._toast.danger({
      message: t('transferError'),
    });
  }

  @delegate('mainClient')
  async startWarmTransfer(transferNumber: string, sessionId: string) {
    const session = this.originalSessions[sessionId];
    if (!session) {
      return;
    }
    try {
      session.__rc_isOnTransfer = true;
      await this._updateSessions();
      const numberResult = validateNumbers({
        allowRegionSettings: !!this._brand.brandConfig.allowRegionSettings,
        areaCode: this._regionSettings.areaCode,
        countryCode: this._regionSettings.countryCode,
        phoneNumbers: [transferNumber],
      });
      const validPhoneNumber = numberResult && numberResult[0];
      const fromNumber =
        session.localNumber ||
        session.__rc_originalLocalNumber ||
        session.__rc_fromNumber;
      if (!fromNumber) {
        throw new Error('Cannot determine local number for warm transfer');
      }
      await this.makeCall({
        toNumber: validPhoneNumber,
        fromNumber,
        homeCountryId: this._regionSettings.homeCountryId,
        // TODO: should check that type issue
        // @ts-ignore
        extendedControls: '',
        transferSessionId: sessionId,
      });
    } catch (e) {
      this.logger.log('startWarmTransfer fail', e);
      session.__rc_isOnTransfer = false;
      await this._updateSessions();
      this._showTransferError();
    }
  }

  @delegate('mainClient')
  async completeWarmTransfer(newSessionId: string) {
    const newSession = this.originalSessions[newSessionId];
    if (!newSession) {
      return;
    }
    const oldSessionId = newSession.__rc_transferSessionId;
    const oldSession = this.originalSessions[oldSessionId!];
    if (!oldSession) {
      return;
    }
    newSession.__rc_isOnTransfer = true;
    await this._updateSessions();
    try {
      await oldSession.completeWarmTransfer(newSession);
    } catch (e) {
      this.logger.log('completeWarmTransfer fail', e);
      newSession.__rc_isOnTransfer = false;
      await this._updateSessions();
      this._showTransferError();
    }
  }

  @delegate('mainClient')
  async flip(flipValue: string, sessionId: string) {
    const session = this.originalSessions[sessionId];
    if (!session) {
      return;
    }
    try {
      await session.flip(flipValue);
      // await this._onCallEnd(session);
      session.__rc_isOnFlip = true;
      this.logger.log('Flipped successfully');
    } catch (e) {
      this.logger.log('flip fail', e);
      session.__rc_isOnFlip = false;
      this._toast.warning({
        message: t('flipError'),
      });
    }
    await this._updateSessions();
  }

  private async _sendDTMF(dtmfValue: string, session: WebphoneSession) {
    try {
      session.sendDtmf(dtmfValue, 100);
    } catch (e) {
      this.logger.log('sendDTMF fail', e);
    }
  }

  @delegate('mainClient')
  async sendDTMF(dtmfValue: string, sessionId: string) {
    const session = this.originalSessions[sessionId];
    if (session) {
      await this._sendDTMF(dtmfValue, session);
    }
  }

  async hangup(
    sessionId: string,
    errorHandler?: (error: any) => void | Promise<void>,
  ) {
    try {
      await this._delegateHangup(sessionId);
    } catch (e) {
      this.logger.log('hangup fail', e);
      errorHandler?.(e);
    }
  }

  @delegate('mainClient')
  private async _delegateHangup(sessionId: string) {
    const session = this.originalSessions[sessionId];
    if (!session) {
      return;
    }
    try {
      this._onBeforeCallEnd(session);
      await session.hangup();
    } catch (e) {
      await this._onCallEnd(session);
      throw e;
    }
  }

  @delegate('mainClient')
  async toVoiceMail(sessionId: string) {
    const session = this.originalSessions[sessionId];
    if (!session) {
      return;
    }
    try {
      session.__rc_isToVoicemail = true;
      await session.toVoicemail();
    } catch (e) {
      this.logger.log('toVoiceMail fail', e);

      await this._onCallEnd(session);
      this._toast.warning({
        message: t('toVoiceMailError'),
      });
    }
  }

  async replyWithMessage(
    sessionId: string,
    replyOptions: SessionReplyOptions,
    errorHandler?: (error: any) => void | Promise<void>,
  ) {
    try {
      return await this._delegateReplyWithMessage(sessionId, replyOptions);
    } catch (e) {
      this.logger.log('replyWithMessage fail', e);
      errorHandler?.(e);
    }
  }

  @delegate('mainClient')
  private async _delegateReplyWithMessage(
    sessionId: string,
    replyOptions: SessionReplyOptions,
  ) {
    const session = this.originalSessions[sessionId];
    if (!session) {
      return;
    }
    try {
      session.__rc_isReplied = true;
      await replyWithMessage(session, replyOptions);
      return true;
    } catch (e) {
      await this._onCallEnd(session);
      throw e;
    }
  }

  _addTrack(rawSession: WebphoneSession) {
    return rawSession;
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
      inviteOptions: {
        extraHeaders?: string[];
        fromNumber?: string;
        homeCountryId?: string;
      };
      extendedControls?: string[];
      transferSessionId?: string;
    },
  ) {
    const errorCode = this.errorCode;
    if (errorCode) {
      this.logger.log(
        'webphone not able to make call, errorCode or not ready or not connected more than 30s',
        {
          ready: this.ready,
          connected: this.connected,
          errorCode: this.errorCode,
        },
      );
      this.showErrorToast({
        errorCode: errorCode,
      });

      return null;
    }

    if (
      toNumber.length > 6 &&
      (!this._availabilityMonitor || !this._availabilityMonitor.isVoIPOnlyMode)
    ) {
      // in new project, we don't need to check device lines every time when make call, only validate device lines use ExtensionDevice
      if (process.env.THEME_SYSTEM !== 'spring-ui') {
        await this._fetchDL();
      }

      // TODO: should add some update logic for device lines, not only base on re-login
      const pass = this.validateDeviceLines();
      if (!pass) return null;
    }

    // also ensure connected and ready state
    const webphone = await this.ensureAbleToMakeCall();

    if (!webphone) {
      this.logger.log(
        'webphone not able to make call, errorCode or not ready or not connected more than 30s',
        {
          ready: this.ready,
          connected: this.connected,
          errorCode: this.errorCode,
          webSocketReady: this._ringCentralExtensions?.isWebSocketReady,
          subscriptionReady: this._subscription?.subscriptionReady ?? false,
          subscriptionFilters: this._subscription?.filters.length ?? 0,
        },
      );

      return;
    }

    await this._holdOtherSession(null);
    const outboundSessionPromise = new Promise<WebphoneSession>((resolve) => {
      const handler = (session: WebphoneSession) => {
        webphone.off('outboundCall', handler);
        resolve(session);
      };
      webphone.on('outboundCall', handler);
    });
    const headers = (inviteOptions.extraHeaders ?? []).reduce(
      (currentHeaders, header) => {
        const dividerIndex = header.indexOf(':');
        if (dividerIndex === -1) {
          return currentHeaders;
        }
        currentHeaders[header.slice(0, dividerIndex)] = header
          .slice(dividerIndex + 1)
          .trim();
        return currentHeaders;
      },
      {} as Record<string, string>,
    );
    void webphone
      .call(toNumber, inviteOptions.fromNumber, {
        headers,
      })
      .catch((error) => {
        this.logger.error('make call fail', error);
      });
    const session = this._prepareSession(await outboundSessionPromise);
    session.__rc_direction = callDirections.outbound;
    session.__rc_callStatus = sessionStatus.setup;
    session.__rc_creationTime = Date.now();
    session.__rc_lastActiveTime = Date.now();
    session.__rc_fromNumber = inviteOptions.fromNumber!;
    session.__rc_extendedControls = extendedControls;
    session.__rc_extendedControlStatus = extendedControlStatus.pending;
    session.__rc_transferSessionId = transferSessionId!;
    this._onAccepted(session);
    await this._onCallInit(session);
    return session;
  }

  private ensureWebphoneInstance() {
    if (!this._webphone) {
      this.logger.log('webphone instance not exist, wait for it');

      return this.rcWebphoneInstance$.pipe(filter(Boolean));
    }

    return of(this._webphone);
  }

  private async ensureAbleToMakeCall() {
    const readyToMakCall$ = fromWatchValue(
      this,
      () => [this.ready, this.connected] as const,
      {
        multiple: true,
      },
    ).pipe(filter(([ready, connected]) => ready && connected));

    const notAble$ = merge(
      // when have error code, also means not able to make call, webphone not connected successfully
      fromWatchValue(this, () => this.errorCode).pipe(filter(Boolean)),
      timer(30 * 1000),
    ).pipe(map(() => null));

    const webphone = await firstValueFrom(
      race([
        readyToMakCall$.pipe(switchMap(() => this.ensureWebphoneInstance())),
        notAble$,
      ]),
    );

    if (!webphone) {
      return null;
    }

    const shouldRecover =
      !!this._ringCentralExtensions &&
      !this._ringCentralExtensions.isWebSocketReady;

    const realtimeReady = await this._awaitRealtimeRecovery({
      recover: shouldRecover,
    });

    if (!realtimeReady) {
      return null;
    }

    return webphone;
  }

  /**
   * start an outbound call.
   * @param {toNumber} recipient number
   * @param {fromNumber} call Id
   * @param {homeCountryId} homeCountry Id
   */
  @delegate('mainClient')
  async makeCall({
    toNumber,
    fromNumber,
    homeCountryId,
    extendedControls,
    transferSessionId,
  }: {
    toNumber: string;
    fromNumber?: string;
    homeCountryId: string;
    extendedControls?: string[];
    transferSessionId?: string;
  }) {
    const inviteOptions = {
      fromNumber,
      homeCountryId,
    };
    const result = await this._invite(toNumber, {
      inviteOptions,
      extendedControls,
      transferSessionId,
    });
    return result
      ? {
          id: result.id,
        }
      : null;
  }

  /**
   * switch a active call into web phone session.
   */
  @delegate('mainClient')
  async switchCall(
    { id, from, direction, to, sipData }: SwitchCallActiveCallParams,
    homeCountryId: string,
  ) {
    const extraHeaders = [];
    extraHeaders.push(
      `Replaces: ${id};to-tag=${sipData.fromTag};from-tag=${sipData.toTag}`,
    );
    extraHeaders.push('RC-call-type: replace');
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
    return session?.sessionId;
  }

  @delegate('mainClient')
  async pickupInboundCall({
    sessionId,
    toNumber,
    fromNumber,
    serverId,
  }: TPickupInboundCall) {
    const extraHeaders = [
      `RC-call-type: inbound-pickup; session-id: ${sessionId}; server-id: ${serverId}`,
    ];
    const inviteOptions = {
      fromNumber,
      extraHeaders,
    };
    const session = await this._invite(toNumber, {
      inviteOptions,
    });

    this._trackCallAnswer();

    return session;
  }

  @delegate('mainClient')
  async updateSessionMatchedContact(
    sessionId: string,
    contact: { id: string },
  ) {
    this._sessionHandleWithId(sessionId, async (session) => {
      session.__rc_contactMatch = contact;
      await this._updateSessions();
    });
  }

  @delegate('mainClient')
  async _updateSessions() {
    await this.updateSessionsState(
      [...Object.values(this.originalSessions)].map(
        normalizeSession,
      ) as NormalizedSession[],
    );
  }

  @delegate('mainClient')
  async toggleMinimized(sessionId: string) {
    this._sessionHandleWithId(sessionId, async (session: WebphoneSession) => {
      session.__rc_minimized = !session.__rc_minimized;
      await this._updateSessions();
    });
  }

  async _onCallInit(session: WebphoneSession) {
    await this._updateSessions();
    const normalizedSession = this._getNormalizedSession(session);
    await this.setActiveSessionId(normalizedSession!.id);

    this._contactMatcher?.triggerMatch();

    this._eventEmitter.emit(
      EVENTS.callInit,
      normalizedSession,
      this.activeSession,
    );
  }

  async _onCallStart(session: WebphoneSession) {
    await this._updateSessions();
    const normalizedSession = this._getNormalizedSession(session);

    await this.setStateOnCallStart(normalizedSession!);

    this._eventEmitter.emit(
      EVENTS.callStart,
      normalizedSession,
      this.activeSession,
    );
  }

  async _onCallRing(session: WebphoneSession) {
    await this._updateSessions();
    const normalizedSession = this._getNormalizedSession(session);
    await this.setStateOnCallRing(normalizedSession!);

    this._contactMatcher?.triggerMatch();

    const isActiveWebphoneClient =
      this.isWebphoneActiveTab ||
      (!this.activeWebphoneId && this._portManager.isActiveTab);
    if (isActiveWebphoneClient && (!this.activeSession || isOnHold(this.activeSession))) {
      this._ringtoneHelper?.play();
    } else {
      this.stopRingtone();
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
    return;
  }

  _reconnectWebphoneIfNecessaryOnSessionsEmpty() {
    if (this._reconnectAfterSessionEnd && this.sessions.length === 0) {
      const reason = this._reconnectAfterSessionEnd.reason;
      if (reason) {
        this._toast.warning({
          message: reason,
          allowDuplicates: false,
        });
      }
      this._reconnectAfterSessionEnd = null;
      this.connect({ skipConnectDelay: true, force: true, skipDLCheck: true });
    }
  }

  async _onCallEnd(session: WebphoneSession) {
    // should remove __rc_transferSessionId when the call is warm transfer call
    const transferSession = this.sessions.find((s) => {
      return s.warmTransferSessionId === session.id;
    });
    if (transferSession) {
      const originalTransferSession = this.originalSessions[transferSession.id];
      if (originalTransferSession) {
        delete originalTransferSession.__rc_transferSessionId;
      }
    }

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
    await this._updateSessions();
    await this.setStateOnCallEnd(normalizedSession);
    this._eventEmitter.emit(
      EVENTS.callEnd,
      normalizedSession,
      this.activeSession,
      this.ringSession,
    );
    this._releaseVideoElementsOnSessionsEmpty();
    this._reconnectWebphoneIfNecessaryOnSessionsEmpty();
  }

  _onBeforeCallResume(session: WebphoneSession) {
    const normalizedSession = this._getNormalizedSession(session);
    this._eventEmitter.emit(
      EVENTS.beforeCallResume,
      normalizedSession,
      this.activeSession,
    );
  }

  async _onCallResume(session: WebphoneSession) {
    const normalizedSession = this._getNormalizedSession(session);
    await this.setActiveSessionId(normalizedSession!.id);

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

  @delegate('mainClient')
  async updateRecordStatus(sessionId: string, status: string) {
    const session = this.originalSessions[sessionId];
    if (!session) {
      return;
    }
    session.__rc_recordStatus = status;
    void this._updateSessions();
  }

  onActiveWebphoneChanged(handler: ActiveWebphoneChangedHandler) {
    this._eventEmitter.on(EVENTS.activeWebphoneChanged, handler);
  }

  onCallVoicemailDropped(handler: CallVoicemailDroppedHandler) {
    this._eventEmitter.on(EVENTS.callVoicemailDropped, handler);
  }

  private _emitActiveWebphoneChangedEvent() {
    this._eventEmitter.emit(EVENTS.activeWebphoneChanged, {
      activeId: this.activeWebphoneId,
      currentActive: this.isWebphoneActiveTab,
    });
  }

  private _onCallVoicemailDropped(session: WebphoneSession) {
    const normalizedSession = this._getNormalizedSession(session);
    this._eventEmitter.emit(
      EVENTS.callVoicemailDropped,
      normalizedSession,
      this.activeSession,
    );
  }

  private _prepareSession(session: WebphoneSession) {
    this._ensureSessionCompatibility(session);
    session.__rc_callId = session.callId;
    session.__rc_recordStatus = session.__rc_recordStatus || recordStatus.idle;
    session.__rc_originalRemoteNumber =
      session.__rc_originalRemoteNumber || session.remoteNumber;
    session.__rc_originalLocalNumber =
      session.__rc_originalLocalNumber || session.localNumber;
    session.__rc_originalLocalName =
      session.__rc_originalLocalName ||
      session.localPeer?.match(/"(.*)"/)?.[1] ||
      '';
    return session;
  }

  private async _stopSessionAudio(session: WebphoneSession) {
    await this._noiseReduction?.reset(session.callId);
    const peerConnection = session.rtcPeerConnection;
    if (peerConnection.removeTrack && peerConnection.getSenders) {
      peerConnection.getSenders().forEach((sender: RTCRtpSender) => {
        sender.track?.stop();
      });
    } else {
      const localStream = (peerConnection as RTCPeerConnection & {
        getLocalStreams?: () => MediaStream[];
      }).getLocalStreams?.()[0];
      localStream?.getTracks().forEach((track) => {
        track.stop();
      });
    }
    const receiver = peerConnection
      .getReceivers()
      .find((r: RTCRtpReceiver) => r.track?.kind === 'audio');
    const outputTrack = receiver?.track;
    const outputElement = session.audioElement;
    if (!outputElement || !outputElement.srcObject || !outputTrack) {
      return;
    }
    const outputStream = outputElement.srcObject as MediaStream;
    const outputTracks = outputStream.getTracks();
    if (outputTracks.some((track) => track.id === outputTrack.id)) {
      outputElement.srcObject = null;
    }
  }

  @delegate('mainClient')
  async dropVoicemailMessage(sessionId: string, messageId: string) {
    const session = this.originalSessions[sessionId];
    if (
      !session ||
      !this._voicemailDrop ||
      session.__rc_callStatus === sessionStatus.finished
    ) {
      return false;
    }
    if (
      session.__rc_voicemailDropStatus ||
      session.__rc_localHold ||
      !session.rtcPeerConnection
    ) {
      return false;
    }
    try {
      const { audioBuffer, audioContext } =
        await this._voicemailDrop.prepareVoicemailDrop(session, messageId);
      await this._stopSessionAudio(session);
      session.__rc_voicemailDropStatus =
        voicemailDropStatus.waitingForGreetingEnd;
      session.__rc_localHold = true;
      await this._updateSessions();
      this._onCallVoicemailDropped(session);
      void this._voicemailDrop.dropVoicemailMessage({
        webphoneSession: session,
        audioBuffer,
        audioContext,
        endCall: () => this.hangup(session.callId),
        updateStatus: (status) => {
          session.__rc_voicemailDropStatus = status;
          void this._updateSessions();
          this._onCallVoicemailDropped(session);
        },
      });
      return true;
    } catch (error) {
      this.logger.error('dropVoicemailMessage fail', error);
      return false;
    }
  }

  override async _disconnect(force = false) {
    await super._disconnect(force);
    await this._updateSessions();
  }

  get hasCallSessions() {
    return this.sessions.length > 0;
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
      (session) => session.id === this.activeSessionId,
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
      (session) => session.id === this.ringSessionId,
      this.sessions,
    );
    return session;
  }

  @computed(({ sessions }: Webphone) => [sessions])
  get ringSessions(): NormalizedSession[] {
    return this.sessions.filter((session) => isRing(session));
  }

  @computed(({ sessions }: Webphone) => [sessions])
  get onHoldSessions(): NormalizedSession[] {
    return this.sessions.filter((session) => isOnHold(session));
  }

  @computed(({ sessions }: Webphone) => [sessions])
  get activeCallSessions(): NormalizedSession[] {
    return this.sessions.filter(
      (session) => !isRing(session) && !isDroppingVoicemail(session.voicemailDropStatus),
    );
  }

  async getAcceptOptions() {
    return {
      constraints: {
        audio: await this._audioSettings.getInputDeviceOptions(),
        video: false,
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
    return find((x) => x.id === session.callId, this.sessions);
  }

  // For backward compatibility from v1 module
  useWebphoneMainTab() {}
}
