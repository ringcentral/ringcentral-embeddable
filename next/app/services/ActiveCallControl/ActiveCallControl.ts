import { callDirection } from '@ringcentral-integration/commons/enums/callDirections';
import { trackEvents } from '@ringcentral-integration/commons/enums/trackEvents';
import type {
  NormalizedSession,
  PartyData,
} from '@ringcentral-integration/commons/interfaces/Webphone.interface';
import {
  ActiveCallControl as ActiveCallControlBase,
  normalizeToActiveCallControlSession,
} from '@ringcentral-integration/micro-phone/src/app/services/ActiveCallControl';
import type {
  ActiveCallControlOptions,
  ActiveCallControlSessionData,
} from '@ringcentral-integration/micro-phone/src/app/services/ActiveCallControl/ActiveCallControl.interface';
import {
  computed,
  delegate,
  injectable,
  inject,
  optional,
  PortManager,
  RouterPlugin,
} from '@ringcentral-integration/next-core';
import type { WebSocketSubscription as Subscription } from '@ringcentral-integration/micro-auth/src/app/services';
import {
  AccountInfo,
  Analytics,
  AppFeatures,
  Auth,
  AvailabilityMonitor,
  Client,
  ConnectivityMonitor,
  ExtensionInfo,
  Presence,
  RegionSettings,
  track,
} from '@ringcentral-integration/micro-auth/src/app/services';
import {
  NumberValidate,
} from '@ringcentral-integration/micro-contacts/src/app/services';
import {
  Brand,
  Locale,
  Toast,
} from '@ringcentral-integration/micro-core/src/app/services';
import {
  ModalView,
} from '@ringcentral-integration/micro-core/src/app/views';
import { CallingSettings, PreinsertCall, Webphone } from '@ringcentral-integration/micro-phone/src/app/services';
import { PartyStatusCode, type ReplyWithTextParams } from 'ringcentral-call-control/lib/Session';

import { recordStatus } from '../WebphoneV2/recordStatus';
import { sessionStatus } from '../WebphoneV2/sessionStatus';
import type {
  Webphone as WebphoneV2,
} from '../WebphoneV2';

@injectable({
  name: 'ActiveCallControl',
})
export class ActiveCallControl extends ActiveCallControlBase {
  constructor(
    _preInsertCall: PreinsertCall,
    _portManager: PortManager,
    _auth: Auth,
    _toast: Toast,
    _brand: Brand,
    _client: Client,
    _presence: Presence,
    _accountInfo: AccountInfo,
    @inject('Subscription') _subscription: Subscription,
    _extensionInfo: ExtensionInfo,
    _numberValidate: NumberValidate,
    _regionSettings: RegionSettings,
    _connectivityMonitor: ConnectivityMonitor,
    _appFeatures: AppFeatures,
    _modalView: ModalView,
    _locale: Locale,
    _webphone: Webphone,
    _callingSettings: CallingSettings,
    @optional('Prefix') _prefix?: string,
    @optional() _analytics?: Analytics,
    @optional()
    _availabilityMonitor?: AvailabilityMonitor,
    @optional('ActiveCallControlOptions')
    _activeCallControlOptions?: ActiveCallControlOptions,
    @optional() _router?: RouterPlugin,
  ) {
    super(
      _preInsertCall,
      _portManager,
      _auth,
      _toast,
      _brand,
      _client,
      _presence,
      _accountInfo,
      _subscription,
      _extensionInfo,
      _numberValidate,
      _regionSettings,
      _connectivityMonitor,
      _appFeatures,
      _modalView,
      _locale,
      _webphone,
      _callingSettings,
      _prefix,
      _analytics,
      _availabilityMonitor,
      _activeCallControlOptions,
      _router,
    );
  }

  private get _webphoneV2(): WebphoneV2 {
    return this._webphone as unknown as WebphoneV2;
  }

  private _getRealSessionByTelephonySessionId(telephonySessionId: string) {
    return this.data.sessions.find(
      (session) =>
        session.telephonySessionId === telephonySessionId ||
        session.id === telephonySessionId,
    );
  }

  private _getFallbackWebphoneSessionId(telephonySessionId: string) {
    if (this._getRealSessionByTelephonySessionId(telephonySessionId)) {
      return null;
    }
    return this.currentDeviceCallsMap[telephonySessionId] ?? null;
  }

  private _getWarmTransferFallbackWebphoneSessionId(telephonySessionId: string) {
    const direct = this._getFallbackWebphoneSessionId(telephonySessionId);
    if (direct) {
      return direct;
    }
    const relatedTelephonySessionId =
      this.transferCallMapping[telephonySessionId]?.relatedTelephonySessionId;
    if (!relatedTelephonySessionId) {
      return null;
    }
    return this._getFallbackWebphoneSessionId(relatedTelephonySessionId);
  }

  private _mapWebphoneCallStatus(callStatus?: string) {
    switch (callStatus) {
      case sessionStatus.onHold:
        return PartyStatusCode.hold;
      case sessionStatus.connected:
        return PartyStatusCode.answered;
      case sessionStatus.setup:
      case sessionStatus.connecting:
        return PartyStatusCode.proceeding;
      case sessionStatus.finished:
      default:
        return PartyStatusCode.disconnected;
    }
  }

  private _trimQueueName(callQueueName?: string | null) {
    if (!callQueueName) {
      return undefined;
    }
    return callQueueName.replace(/\s*-\s*$/, '').trim() || undefined;
  }

  private _buildFallbackSession(
    webphoneSession: NormalizedSession,
  ): ActiveCallControlSessionData | null {
    const partyData = webphoneSession.partyData as PartyData | null | undefined;
    const telephonySessionId = partyData?.sessionId;

    if (!telephonySessionId || webphoneSession.callStatus === sessionStatus.finished) {
      return null;
    }

    const sessionId = telephonySessionId;
    const creationTimeValue =
      webphoneSession.creationTime ?? webphoneSession.startTime ?? Date.now();
    const creationTime = new Date(creationTimeValue).toISOString();
    const direction =
      webphoneSession.direction === callDirection.inbound
        ? callDirection.inbound
        : callDirection.outbound;
    const queueName = this._trimQueueName(webphoneSession.callQueueName);
    const statusCode = this._mapWebphoneCallStatus(webphoneSession.callStatus);
    const recordings =
      webphoneSession.recordStatus === recordStatus.recording
        ? ([{ active: true }] as any[])
        : ([] as any[]);
    const party = {
      id: partyData?.partyId ?? telephonySessionId,
      direction,
      from: {
        phoneNumber: webphoneSession.from,
        name: webphoneSession.fromUserName ?? '',
      },
      to: {
        phoneNumber: webphoneSession.to,
        name: webphoneSession.toUserName ?? '',
      },
      muted: Boolean(webphoneSession.isOnMute),
      recordings,
      status: {
        code: statusCode,
      },
      uiCallInfo: queueName
        ? {
            primary: {
              type: 'QueueName',
              value: queueName,
            },
            additional: {
              type: 'QueueName',
              value: queueName,
            },
          }
        : undefined,
    };
    const telephonySession = {
      id: telephonySessionId,
      sessionId,
      creationTime,
      data: {
        sessionId,
        creationTime,
      },
      party,
      parties: [party],
      otherParties: [],
      recordings,
      origin: {},
    } as any;

    return {
      ...normalizeToActiveCallControlSession(
        telephonySession,
        [],
        this._numberValidate.getPartyExtensionNumber,
      ),
      activeCallId: webphoneSession.callId,
    } as ActiveCallControlSessionData;
  }

  private _getFallbackSessions(): ActiveCallControlSessionData[] {
    const realTelephonySessionIds = new Set(
      this.data.sessions.map((session) => session.telephonySessionId ?? session.id),
    );

    return this._webphone.sessions.reduce<ActiveCallControlSessionData[]>(
      (sessions, webphoneSession) => {
        const session = this._buildFallbackSession(webphoneSession);
        if (
          session &&
          !realTelephonySessionIds.has(session.telephonySessionId)
        ) {
          sessions.push(session);
        }
        return sessions;
      },
      [],
    );
  }

  @computed((that: ActiveCallControl) => [that.data.sessions, that._webphone.sessions])
  get sessions(): ActiveCallControlSessionData[] {
    return [...this.data.sessions, ...this._getFallbackSessions()];
  }

  @computed((that: ActiveCallControl) => [that._presence.calls, that.sessions])
  get sessionIdToTelephonySessionIdMapping() {
    const mapping = this._presence.calls.reduce((accumulator, call) => {
      const { telephonySessionId, sessionId } = call;
      accumulator[sessionId!] = telephonySessionId!;
      return accumulator;
    }, {} as Record<string, string>);

    this.sessions.forEach((session) => {
      const sessionId = session.sessionId || session.id;
      if (!mapping[sessionId]) {
        mapping[sessionId] = session.telephonySessionId;
      }
    });

    return mapping;
  }

  @track((that: ActiveCallControl) => [
    (that as any)._getTrackEventName(trackEvents.mute),
  ])
  @delegate('server')
  async mute(telephonySessionId: string) {
    const webphoneSessionId =
      this._getFallbackWebphoneSessionId(telephonySessionId);
    if (!webphoneSessionId) {
      return super.mute(telephonySessionId);
    }
    try {
      this.setCallControlBusyTimestamp();
      await this.muteWithWebphone(webphoneSessionId);
    } finally {
      this.clearCallControlBusyTimestamp();
    }
  }

  @track((that: ActiveCallControl) => [
    (that as any)._getTrackEventName(trackEvents.unmute),
  ])
  @delegate('server')
  async unmute(telephonySessionId: string) {
    const webphoneSessionId =
      this._getFallbackWebphoneSessionId(telephonySessionId);
    if (!webphoneSessionId) {
      return super.unmute(telephonySessionId);
    }
    try {
      this.setCallControlBusyTimestamp();
      await this._webphone.unmute(webphoneSessionId);
    } catch (error) {
      await (this as any)._showGeneralError?.(error);
    } finally {
      this.clearCallControlBusyTimestamp();
    }
  }

  @track((that: ActiveCallControl) => [
    (that as any)._getTrackEventName(trackEvents.record),
  ])
  @delegate('server')
  async startRecord(telephonySessionId: string) {
    const webphoneSessionId =
      this._getFallbackWebphoneSessionId(telephonySessionId);
    if (!webphoneSessionId) {
      return super.startRecord(telephonySessionId);
    }
    try {
      this.setCallControlBusyTimestamp();
      await this._webphone.startRecord(webphoneSessionId);
      return true;
    } finally {
      this.clearCallControlBusyTimestamp();
    }
  }

  @track((that: ActiveCallControl) => [
    (that as any)._getTrackEventName(trackEvents.stopRecord),
  ])
  @delegate('server')
  async stopRecord(telephonySessionId: string) {
    const webphoneSessionId =
      this._getFallbackWebphoneSessionId(telephonySessionId);
    if (!webphoneSessionId) {
      return super.stopRecord(telephonySessionId);
    }
    try {
      this.setCallControlBusyTimestamp();
      await this.stopRecordWithWebphone(webphoneSessionId);
    } finally {
      this.clearCallControlBusyTimestamp();
    }
  }

  @delegate('server')
  async checkIfConferenceCall(telephonySessionId: string) {
    if (!this._getRealSessionByTelephonySessionId(telephonySessionId)) {
      return false;
    }
    return super.checkIfConferenceCall(telephonySessionId);
  }

  @track((that: ActiveCallControl) => [
    (that as any)._getTrackEventName(trackEvents.hangup),
  ])
  @delegate('server')
  async hangUp(telephonySessionId: string, hangupOnlyHost?: boolean) {
    const webphoneSessionId =
      this._getFallbackWebphoneSessionId(telephonySessionId);
    if (!webphoneSessionId) {
      return super.hangUp(telephonySessionId, hangupOnlyHost);
    }
    return this.endCall(telephonySessionId, hangupOnlyHost);
  }

  @delegate('server')
  async endCall(telephonySessionId: string, hangupOnlyHost?: boolean) {
    const webphoneSessionId =
      this._getFallbackWebphoneSessionId(telephonySessionId);
    if (!webphoneSessionId) {
      return super.endCall(telephonySessionId, hangupOnlyHost);
    }
    try {
      this.setCallControlBusyTimestamp();
      await this._hangupWithWebphone(webphoneSessionId);
      (this as any)._onCallEndFunc?.();
    } finally {
      this.clearCallControlBusyTimestamp();
    }
  }

  @track((that: ActiveCallControl) => [
    (that as any)._getTrackEventName(trackEvents.hold),
  ])
  @delegate('server')
  async hold(telephonySessionId: string) {
    const webphoneSessionId =
      this._getFallbackWebphoneSessionId(telephonySessionId);
    if (!webphoneSessionId) {
      return super.hold(telephonySessionId);
    }
    try {
      this.setCallControlBusyTimestamp();
      await this.holdWithWebphone(webphoneSessionId);
    } finally {
      this.clearCallControlBusyTimestamp();
    }
  }

  @track((that: ActiveCallControl) => [
    (that as any)._getTrackEventName(trackEvents.unhold),
  ])
  @delegate('server')
  async unhold(telephonySessionId: string) {
    const webphoneSessionId =
      this._getFallbackWebphoneSessionId(telephonySessionId);
    if (!webphoneSessionId) {
      return super.unhold(telephonySessionId);
    }
    try {
      this.setCallControlBusyTimestamp();
      await this._unholdWithWebphone(webphoneSessionId);
    } finally {
      this.clearCallControlBusyTimestamp();
    }
  }

  @track((that: ActiveCallControl) => [
    (that as any)._getTrackEventName(trackEvents.voicemail),
  ])
  @delegate('server')
  async reject(telephonySessionId: string) {
    const webphoneSessionId =
      this._getFallbackWebphoneSessionId(telephonySessionId);
    if (!webphoneSessionId) {
      return super.reject(telephonySessionId);
    }
    try {
      this.setCallControlBusyTimestamp();
      await this._webphone.reject(webphoneSessionId);
    } finally {
      this.clearCallControlBusyTimestamp();
    }
  }

  @track((that: ActiveCallControl) => [
    (that as any)._getTrackEventName(trackEvents.ignore),
  ])
  @delegate('server')
  async ignore(telephonySessionId: string) {
    const webphoneSessionId =
      this._getFallbackWebphoneSessionId(telephonySessionId);
    if (!webphoneSessionId) {
      return super.ignore(telephonySessionId);
    }
    try {
      this.setCallControlBusyTimestamp();
      await this._webphone.reject(webphoneSessionId);
      this.onCallIgnoreFunc?.(
        this.getSession(telephonySessionId)?.party?.id ?? telephonySessionId,
      );
    } finally {
      this.clearCallControlBusyTimestamp();
    }
  }

  @track((_, params: ReplyWithTextParams) => [
    trackEvents.executionReplyWithMessage,
    {
      'message type': params.replyWithPattern ? 'Pattern' : 'Custom',
    },
  ])
  @delegate('server')
  async replyWithMessage(
    params: ReplyWithTextParams,
    telephonySessionId: string,
  ) {
    const webphoneSessionId =
      this._getFallbackWebphoneSessionId(telephonySessionId);
    if (!webphoneSessionId) {
      return super.replyWithMessage(params, telephonySessionId);
    }
    try {
      this.setCallControlBusyTimestamp();
      await (this as any)._replyWithMessage(params, webphoneSessionId);
    } finally {
      this.clearCallControlBusyTimestamp();
    }
  }

  @delegate('server')
  async toVoicemail(voicemailId: string, telephonySessionId: string) {
    const webphoneSessionId =
      this._getFallbackWebphoneSessionId(telephonySessionId);
    if (!webphoneSessionId) {
      return super.toVoicemail(voicemailId, telephonySessionId);
    }
    try {
      this.setCallControlBusyTimestamp();
      await this._webphoneV2.toVoiceMail(webphoneSessionId);
    } finally {
      this.clearCallControlBusyTimestamp();
    }
  }

  @track(trackEvents.transfer)
  @delegate('server')
  async transfer(transferNumber: string, telephonySessionId: string) {
    const webphoneSessionId =
      this._getFallbackWebphoneSessionId(telephonySessionId);
    if (!webphoneSessionId) {
      return super.transfer(transferNumber, telephonySessionId);
    }
    try {
      this.setCallControlBusyTimestamp();
      await this._webphone.transfer(transferNumber, webphoneSessionId);
    } finally {
      this.clearCallControlBusyTimestamp();
    }
  }

  @track((that: ActiveCallControl) => [
    (that as any)._getTrackEventName(trackEvents.confirmForward),
  ])
  @delegate('server')
  async forward(forwardNumber: string, telephonySessionId: string) {
    const webphoneSessionId =
      this._getFallbackWebphoneSessionId(telephonySessionId);
    if (!webphoneSessionId) {
      return super.forward(forwardNumber, telephonySessionId);
    }
    try {
      this.setCallControlBusyTimestamp();
      await this._webphone.forward(webphoneSessionId, forwardNumber);
    } finally {
      this.clearCallControlBusyTimestamp();
    }
  }

  @delegate('server')
  async flip(flipValue: string, telephonySessionId: string) {
    const webphoneSessionId =
      this._getFallbackWebphoneSessionId(telephonySessionId);
    if (!webphoneSessionId) {
      return super.flip(flipValue, telephonySessionId);
    }
    try {
      this.setCallControlBusyTimestamp();
      await this._webphone.flip(flipValue, webphoneSessionId);
    } finally {
      this.clearCallControlBusyTimestamp();
    }
  }

  @track(trackEvents.transferAskFirst, process.env.THEME_SYSTEM === 'spring-ui')
  @delegate('server')
  async startWarmTransfer(transferNumber: string, telephonySessionId: string) {
    const webphoneSessionId =
      this._getFallbackWebphoneSessionId(telephonySessionId);
    if (!webphoneSessionId) {
      return super.startWarmTransfer(transferNumber, telephonySessionId);
    }
    try {
      this.setCallControlBusyTimestamp();
      await this._webphone.startWarmTransfer(
        transferNumber,
        webphoneSessionId,
      );
    } finally {
      this.clearCallControlBusyTimestamp();
    }
  }

  @delegate('server')
  async completeWarmTransfer(telephonySessionId: string) {
    const webphoneSessionId =
      this._getWarmTransferFallbackWebphoneSessionId(telephonySessionId);
    if (!webphoneSessionId) {
      return super.completeWarmTransfer(telephonySessionId);
    }
    try {
      this.setCallControlBusyTimestamp();
      await this._webphone.completeWarmTransfer(webphoneSessionId);
    } finally {
      this.clearCallControlBusyTimestamp();
    }
  }

  @track((that: ActiveCallControl) => [
    (that as any)._getTrackEventName(trackEvents.endAndAnswer),
  ])
  @delegate('server')
  async answerAndEnd(telephonySessionId: string, needPickupCall = false) {
    const webphoneSessionId =
      this._getFallbackWebphoneSessionId(telephonySessionId);
    if (!webphoneSessionId) {
      return super.answerAndEnd(telephonySessionId, needPickupCall);
    }
    try {
      if (this.busy) {
        return;
      }

      const currentActiveCalls = this._webphone.sessions.filter((session) => {
        const currentTelephonySessionId = session.partyData?.sessionId;
        return (
          currentTelephonySessionId &&
          currentTelephonySessionId !== telephonySessionId &&
          (session.callStatus === sessionStatus.connected ||
            (session.direction === callDirection.outbound &&
              (session.callStatus === sessionStatus.setup ||
                session.callStatus === sessionStatus.connecting)))
        );
      });

      for (const session of currentActiveCalls) {
        await this._webphone.hangup(session.id);
      }

      await (this as any)._answer(telephonySessionId, needPickupCall);
    } catch (error) {
      console.log('answer and end fail.', error);
    }
  }
}
