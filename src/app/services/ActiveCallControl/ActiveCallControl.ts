import { filter, take } from 'rxjs';
import { callDirection } from '@ringcentral-integration/commons/enums/callDirections';
import { trackEvents } from '@ringcentral-integration/commons/enums/trackEvents';
import { validateNumbers } from '@ringcentral-integration/commons/lib/validateNumbers';
import { webphoneErrors } from '@ringcentral-integration/commons/modules/Webphone/webphoneErrors';
import type {
  NormalizedSession,
  PartyData,
} from '@ringcentral-integration/commons/interfaces/Webphone.interface';
import {
  ActiveCallControl as ActiveCallControlBase,
  checkIfConferenceCall as isConferenceTelephonySession,
  isConnectedCall,
  normalizeToActiveCallControlSession,
} from '@ringcentral-integration/micro-phone/src/app/services/ActiveCallControl';
import { t as activeCallControlT } from '@ringcentral-integration/micro-phone/src/app/services/ActiveCallControl/i18n';
import type {
  ActiveCallControlOptions,
  ActiveCallControlSessionData,
} from '@ringcentral-integration/micro-phone/src/app/services/ActiveCallControl/ActiveCallControl.interface';
import {
  action,
  computed,
  delegate,
  injectable,
  inject,
  optional,
  PortManager,
  RouterPlugin,
  state,
  watch,
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
  SleepDetector,
  Toast,
} from '@ringcentral-integration/micro-core/src/app/services';
import {
  ModalView,
} from '@ringcentral-integration/micro-core/src/app/views';
import { CallingSettings, PreinsertCall, Webphone } from '@ringcentral-integration/micro-phone/src/app/services';
import {
  PartyStatusCode,
  type ReplyWithTextParams,
  type Session as TelephonySession,
} from 'ringcentral-call-control/lib/Session';

import { recordStatus } from '../WebphoneV2/recordStatus';
import { sessionStatus } from '../WebphoneV2/sessionStatus';
import type { Webphone as WebphoneV2 } from '../WebphoneV2';
import { RingCX } from '../RingCX';
import { findConferenceParticipants } from './find-conference-participants';
import { isCxRcExtExBridgeCall } from './is-cx-rc-ext-ex-bridge-call';

type WebphoneWithCxOffhook = {
  readonly cxOffhookTelephonySessionIds: readonly string[];
};

const STOP_RECORD_DISABLED_MESSAGE =
  'Sorry, stopping recording is not supported for this call. Please contact your account administrator to enable "Allow mute in auto recording".';

const CALL_SWITCH_REASON = 'CallSwitch';

const CONNECTED_PARTY_STATUS_CODES = [
  PartyStatusCode.answered,
  PartyStatusCode.hold,
];

type PartyWithStatusReason = {
  id?: string;
  status?: {
    code?: PartyStatusCode;
    reason?: string;
  };
};

/** Tells whether one of the session parties was dropped by a call switch. */
function hasSwitchedAwayParty(
  session: ActiveCallControlSessionData,
): boolean {
  const otherParties: PartyWithStatusReason[] = session.otherParties ?? [];
  return otherParties.some(
    (party) =>
      party.status?.code === PartyStatusCode.disconnected &&
      party.status?.reason === CALL_SWITCH_REASON,
  );
}

function hasResponseStatus(error: unknown, status: number): boolean {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return false;
  }
  const response = (error as { response?: unknown }).response;
  return (
    typeof response === 'object' &&
    response !== null &&
    'status' in response &&
    response.status === status
  );
}

const CONFERENCE_ACCEPT_TIMEOUT = 5 * 1000;

@injectable({
  name: 'ActiveCallControl',
})

export class ActiveCallControl extends ActiveCallControlBase {
  private _stopRecordError: unknown | null = null;
  private _rawCallControl?: {
    on(eventName: 'new', listener: (session: TelephonySession) => void): void;
    removeListener(
      eventName: 'new',
      listener: (session: TelephonySession) => void,
    ): void;
    sessions: TelephonySession[];
  };
  private readonly _telephonySessionListeners = new Map<
    TelephonySession,
    () => void
  >();
  private readonly _preinsertCall: PreinsertCall;
  private _stopWatchingMissingPresenceCalls?: () => void;
  private _stopWatchingSwitchedCalls?: () => void;
  private _stopWatchingCxExBridgeFilter?: () => void;

  @state
  telephonySessionUpdate: {
    sequence: number;
    session: Record<string, unknown> | null;
  } = {
    sequence: 0,
    session: null,
  };

  /**
   * Telephony session ids that matched a CX directory ghost while hints were
   * live. Kept after CX hangup until the EX session itself disappears, so the
   * ghost cannot flash in Phone UI in that gap.
   */
  @state
  cxExBridgeHiddenTelephonySessionIds: string[] = [];

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
    @optional() _sleepDetector?: SleepDetector,
    @optional() private _ringCX?: RingCX,
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
      _sleepDetector,
    );
    this._preinsertCall = _preInsertCall;
  }

  private get _webphoneV2(): WebphoneV2 {
    return this._webphone as unknown as WebphoneV2;
  }

  override async onInit(): Promise<void> {
    await super.onInit();
    this._bindTelephonySessionUpdates();
    this._bindMissingPresenceCallRecovery();
    this._bindSwitchedCallRecovery();
    this._bindCxExBridgeHiddenSessionSync();
  }

  override onReset(): void {
    this._stopWatchingMissingPresenceCalls?.();
    this._stopWatchingMissingPresenceCalls = undefined;
    this._stopWatchingSwitchedCalls?.();
    this._stopWatchingSwitchedCalls = undefined;
    this._stopWatchingCxExBridgeFilter?.();
    this._stopWatchingCxExBridgeFilter = undefined;
    this._clearCxExBridgeHiddenTelephonySessionIds();
    this._unbindTelephonySessionUpdates();
    super.onReset();
  }

  /**
   * A call switched to another device hangs up the local web phone leg, which
   * marks the telephony session as ended for the preinsert call state and hides
   * it from the call list. The call is still running elsewhere, so the flag is
   * cleared to keep the call visible and controllable.
   */
  private _bindSwitchedCallRecovery(): void {
    this._stopWatchingSwitchedCalls?.();
    this._stopWatchingSwitchedCalls = watch(
      this,
      () => this.sessions,
      () => this._restoreCallsSwitchedToOtherDevice(),
    );
    this._restoreCallsSwitchedToOtherDevice();
  }

  private _restoreCallsSwitchedToOtherDevice(): void {
    if (this._portManager.shared && !this._portManager.isServer) {
      return;
    }
    this.sessions.forEach((session) => {
      const telephonySessionId = session.telephonySessionId ?? session.id;
      if (
        this._preinsertCall.preinsertStatusMap[telephonySessionId] !== 'end' ||
        !this._isCallRunningOnOtherDevice(session)
      ) {
        return;
      }
      this.logger.log('restore call switched to other device', {
        telephonySessionId,
      });
      void this._preinsertCall.removePreinsert(telephonySessionId);
    });
  }

  private _isCallRunningOnOtherDevice(
    session: ActiveCallControlSessionData,
  ): boolean {
    const party = session.party as PartyWithStatusReason | undefined;
    if (!CONNECTED_PARTY_STATUS_CODES.includes(party?.status?.code)) {
      return false;
    }
    if (this.getWebphoneSessionId(session.telephonySessionId)) {
      return false;
    }
    if (hasSwitchedAwayParty(session)) {
      return true;
    }
    const endedLocalPartyId = this._getEndedLocalPartyId(
      session.telephonySessionId,
    );
    return Boolean(endedLocalPartyId && party?.id !== endedLocalPartyId);
  }

  private _getEndedLocalPartyId(
    telephonySessionId: string,
  ): string | undefined {
    const endedSession = this._webphone.lastEndedSessions.find(
      (session) =>
        (session.partyData as PartyData | null | undefined)?.sessionId ===
        telephonySessionId,
    );
    return (endedSession?.partyData as PartyData | null | undefined)?.partyId;
  }

  private _bindMissingPresenceCallRecovery(): void {
    this._stopWatchingMissingPresenceCalls?.();
    this._stopWatchingMissingPresenceCalls = watch(
      this,
      () => this._missingPresenceCallSignature,
      () => void this._recoverMissingPresenceCalls(),
    );
    void this._recoverMissingPresenceCalls();
  }

  private get _missingPresenceCallSignature(): string {
    const presenceIds = this._presence.calls
      .map((call) => call.telephonySessionId)
      .filter(Boolean)
      .sort();
    const telephonyIds = this.data.sessions
      .map((session) => session.telephonySessionId ?? session.id)
      .filter(Boolean)
      .sort();
    const webphoneIds = this._webphone.sessions
      .map((session) => session.partyData?.sessionId)
      .filter(Boolean)
      .sort();
    return `${presenceIds.join(',')}|${telephonyIds.join(',')}|${webphoneIds.join(',')}`;
  }

  private async _recoverMissingPresenceCalls(): Promise<void> {
    const representedTelephonyIds = new Set([
      ...this.data.sessions.map(
        (session) => session.telephonySessionId ?? session.id,
      ),
      ...this._webphone.sessions.map(
        (session) => session.partyData?.sessionId,
      ),
    ]);
    const hasMissingCall = this._presence.calls.some(
      (call) =>
        call.telephonySessionId &&
        !representedTelephonyIds.has(call.telephonySessionId) &&
        !this._isCxRcExtExBridgePresenceCall(call),
    );
    if (hasMissingCall) {
      try {
        await this.fetchData();
      } catch (error) {
        this.logger.warn('Failed to recover a missing presence call', error);
      }
    }
  }

  @action
  private _setTelephonySessionUpdate(
    session: Record<string, unknown>,
  ): void {
    this.telephonySessionUpdate = {
      sequence: this.telephonySessionUpdate.sequence + 1,
      session,
    };
  }

  private _bindTelephonySessionUpdates(): void {
    const callControl = (
      this as unknown as {
        _rcCallControl?: ActiveCallControl['_rawCallControl'];
      }
    )._rcCallControl;
    if (!callControl || this._rawCallControl === callControl) {
      return;
    }
    this._unbindTelephonySessionUpdates();
    this._rawCallControl = callControl;
    callControl.on('new', this._onTelephonySessionCreated);
    callControl.sessions.forEach(this._onTelephonySessionCreated);
  }

  private _unbindTelephonySessionUpdates(): void {
    this._rawCallControl?.removeListener(
      'new',
      this._onTelephonySessionCreated,
    );
    this._rawCallControl = undefined;
    this._telephonySessionListeners.forEach((listener, session) => {
      this._removeTelephonySessionListener(session, listener);
    });
    this._telephonySessionListeners.clear();
  }

  private _onTelephonySessionCreated = (session: TelephonySession): void => {
    const previousListener = this._telephonySessionListeners.get(session);
    if (previousListener) {
      this._removeTelephonySessionListener(session, previousListener);
    }
    const updateListener = (): void => {
      this._publishTelephonySessionUpdate(session);
      const status = session.party?.status;
      if (
        status?.code === PartyStatusCode.disconnected &&
        status.reason !== 'Pickup' &&
        status.reason !== 'CallSwitch'
      ) {
        this._removeTelephonySessionListener(session, updateListener);
        this._telephonySessionListeners.delete(session);
      }
    };
    this._telephonySessionListeners.set(session, updateListener);
    session.on('status', updateListener);
    session.on('muted', updateListener);
    session.on('recordings', updateListener);
    this._publishTelephonySessionUpdate(session);
  };

  private _removeTelephonySessionListener(
    session: TelephonySession,
    listener: () => void,
  ): void {
    session.removeListener('status', listener);
    session.removeListener('muted', listener);
    session.removeListener('recordings', listener);
  }

  private _publishTelephonySessionUpdate(session: TelephonySession): void {
    const sessionData = JSON.parse(
      JSON.stringify(session.data ?? {}),
    ) as Record<string, unknown>;
    this._setTelephonySessionUpdate(sessionData);
  }

  private getWebphoneSessionId(telephonySessionId: string) {
    return this.currentDeviceCallsMap[telephonySessionId] ?? null;
  }

  private getWebphonePartyData(telephonySessionId: string): PartyData | null {
    const webphoneSessionId = this.getWebphoneSessionId(telephonySessionId);
    if (!webphoneSessionId) {
      return null;
    }
    const webphoneSession = this._webphone.sessions.find(
      (session) => session.id === webphoneSessionId,
    );
    const partyData = webphoneSession?.partyData as
      | PartyData
      | null
      | undefined;
    if (!partyData?.sessionId || !partyData.partyId) {
      return null;
    }
    return partyData;
  }

  /** Returns whether RingCentral Call Control supplied this session. */
  hasTelephonySession(telephonySessionId: string): boolean {
    return this.data.sessions.some(
      (session) =>
        (session.telephonySessionId ?? session.id) === telephonySessionId,
    );
  }

  private getWarmTransferWebphoneSessionId(telephonySessionId: string) {
    const direct = this.getWebphoneSessionId(telephonySessionId);
    if (direct) {
      return direct;
    }
    const relatedTelephonySessionId =
      this.transferCallMapping[telephonySessionId]?.relatedTelephonySessionId;
    if (!relatedTelephonySessionId) {
      return null;
    }
    return this.getWebphoneSessionId(relatedTelephonySessionId);
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

  @computed(
    (that: ActiveCallControl) => [
      that.data.sessions,
      that._webphone.sessions,
      (that._webphone as unknown as WebphoneWithCxOffhook)
        .cxOffhookTelephonySessionIds,
      that._ringCX?.exBridgeHints,
      that._presence.calls,
      that.cxExBridgeHiddenTelephonySessionIds,
    ],
  )
  get sessions(): ActiveCallControlSessionData[] {
    const hiddenTelephonyIds = new Set([
      ...((this._webphone as unknown as WebphoneWithCxOffhook)
        .cxOffhookTelephonySessionIds ?? []),
      ...this._listCxRcExtBridgeTelephonySessionIds(),
    ]);
    const telephonySessions = this.data.sessions.filter((session) => {
      const telephonySessionId = session.telephonySessionId ?? session.id;
      return !hiddenTelephonyIds.has(telephonySessionId);
    });
    const fallbackSessions = this._getFallbackSessions().filter((session) => {
      const telephonySessionId = session.telephonySessionId ?? session.id;
      return !hiddenTelephonyIds.has(telephonySessionId);
    });
    return [...telephonySessions, ...fallbackSessions];
  }

  private _listCxRcExtBridgeTelephonySessionIds(): string[] {
    const existingIds = this._listExistingExTelephonySessionIds();
    const matchingIds = this._listMatchingCxExBridgeTelephonySessionIds();
    const rememberedIds = this.cxExBridgeHiddenTelephonySessionIds.filter(
      (telephonySessionId) => existingIds.has(telephonySessionId),
    );
    return [...new Set([...matchingIds, ...rememberedIds])];
  }

  private _listMatchingCxExBridgeTelephonySessionIds(): string[] {
    const hints = this._ringCX?.exBridgeHints ?? [];
    if (hints.length === 0) {
      return [];
    }
    const sessionIds = this.data.sessions
      .filter((session) => isCxRcExtExBridgeCall({ call: session, hints }))
      .map((session) => session.telephonySessionId ?? session.id);
    const presenceIds = this._presence.calls
      .filter((call) => isCxRcExtExBridgeCall({ call, hints }))
      .map((call) => call.telephonySessionId)
      .filter((telephonySessionId): telephonySessionId is string =>
        Boolean(telephonySessionId),
      );
    return [...sessionIds, ...presenceIds];
  }

  private _listExistingExTelephonySessionIds(): Set<string> {
    const ids = [
      ...this.data.sessions.map(
        (session) => session.telephonySessionId ?? session.id,
      ),
      ...this._presence.calls.map((call) => call.telephonySessionId),
    ].filter((telephonySessionId): telephonySessionId is string =>
      Boolean(telephonySessionId),
    );
    return new Set(ids);
  }

  @action
  private _rememberCxExBridgeTelephonySessionIds(
    telephonySessionIds: string[],
  ): void {
    telephonySessionIds.forEach((telephonySessionId) => {
      if (
        this.cxExBridgeHiddenTelephonySessionIds.includes(telephonySessionId)
      ) {
        return;
      }
      this.cxExBridgeHiddenTelephonySessionIds.push(telephonySessionId);
    });
  }

  @action
  private _forgetEndedCxExBridgeTelephonySessionIds(
    existingIds: string[],
  ): void {
    const existing = new Set(existingIds);
    for (
      let index = this.cxExBridgeHiddenTelephonySessionIds.length - 1;
      index >= 0;
      index -= 1
    ) {
      if (existing.has(this.cxExBridgeHiddenTelephonySessionIds[index])) {
        continue;
      }
      this.cxExBridgeHiddenTelephonySessionIds.splice(index, 1);
    }
  }

  @action
  private _clearCxExBridgeHiddenTelephonySessionIds(): void {
    this.cxExBridgeHiddenTelephonySessionIds.splice(
      0,
      this.cxExBridgeHiddenTelephonySessionIds.length,
    );
  }

  private _isCxRcExtExBridgePresenceCall(call: {
    direction?: string;
    from?: string | {
      phoneNumber?: string;
      extensionNumber?: string;
      extensionId?: string | number;
      name?: string;
    };
    to?: string | {
      phoneNumber?: string;
      extensionNumber?: string;
      extensionId?: string | number;
      name?: string;
    };
    toName?: string;
    telephonySessionId?: string;
  }): boolean {
    if (
      call.telephonySessionId &&
      this.cxExBridgeHiddenTelephonySessionIds.includes(call.telephonySessionId)
    ) {
      return true;
    }
    const hints = this._ringCX?.exBridgeHints ?? [];
    return isCxRcExtExBridgeCall({ call, hints });
  }

  private _bindCxExBridgeHiddenSessionSync(): void {
    this._stopWatchingCxExBridgeFilter?.();
    this._stopWatchingCxExBridgeFilter = watch(
      this,
      () =>
        [
          this._ringCX?.exBridgeHints,
          this.data.sessions,
          this._presence.calls,
        ] as const,
      () => this._syncCxExBridgeHiddenTelephonySessionIds(),
      { multiple: true },
    );
  }

  private _syncCxExBridgeHiddenTelephonySessionIds(): void {
    this._rememberCxExBridgeTelephonySessionIds(
      this._listMatchingCxExBridgeTelephonySessionIds(),
    );
    this._forgetEndedCxExBridgeTelephonySessionIds([
      ...this._listExistingExTelephonySessionIds(),
    ]);
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
    const webphoneSessionId = this.getWebphoneSessionId(telephonySessionId);
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
    const webphoneSessionId = this.getWebphoneSessionId(telephonySessionId);
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
    if (this.hasTelephonySession(telephonySessionId)) {
      return super.startRecord(telephonySessionId);
    }
    const webphoneSessionId = this.getWebphoneSessionId(telephonySessionId);
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
    if (this.hasTelephonySession(telephonySessionId)) {
      return super.stopRecord(telephonySessionId);
    }
    const webphoneSessionId = this.getWebphoneSessionId(telephonySessionId);
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

  protected override stopRecordErrorHandle = async (
    error: unknown,
  ): Promise<void> => {
    this._stopRecordError = error;
    this._toast.danger({
      message: hasResponseStatus(error, 403)
        ? STOP_RECORD_DISABLED_MESSAGE
        : activeCallControlT('pauseRecordError'),
    });
  };

  /** Stops recording and reports whether the telephony request succeeded. */
  @delegate('server')
  async stopRecordForAdapter(telephonySessionId: string): Promise<boolean> {
    this._stopRecordError = null;
    await this.stopRecord(telephonySessionId);
    const succeeded = this._stopRecordError === null;
    this._stopRecordError = null;
    return succeeded;
  }

  /**
   * Rebuilds the active sessions with the local conference participant finder.
   *
   * Same as the base implementation, except that conference participants are
   * found by `findConferenceParticipants` from this folder, which also reads
   * the conference id from `peerId.sessionId`.
   */
  @delegate('server')
  override async updateActiveSessions(): Promise<void> {
    const base = this as unknown as {
      _rcCallControl: { sessions: TelephonySession[] } | null;
      _mergingConferenceSessionIds: Set<string>;
      _updateActiveSessions(sessions: ActiveCallControlSessionData[]): void;
    };
    const sessions = base._rcCallControl?.sessions ?? [];
    const callControlSessions = sessions
      .filter((session) => isConnectedCall(session))
      .map((session) =>
        normalizeToActiveCallControlSession(
          session,
          findConferenceParticipants(
            session,
            sessions,
            this._extensionInfo.info,
            (_, partyId) =>
              this._preinsertCall.checkParticipantStillExist(session, partyId),
          ),
          this._numberValidate.getPartyExtensionNumber,
        ),
      )
      .filter((session) =>
        this.skipConferenceCall ? !session.isConferenceCall : true,
      )
      .filter(
        (session) => !base._mergingConferenceSessionIds.has(session.id),
      );
    base._updateActiveSessions(
      JSON.parse(JSON.stringify(callControlSessions)),
    );
  }

  /**
   * Reads the conference flag from the raw telephony session.
   *
   * The base method is tracked as a hang up, so it is not called here. Web
   * phone sessions are covered too: the host's conference leg is always one.
   */
  @delegate('server')
  async checkIfConferenceCall(telephonySessionId: string) {
    const session = this._findRawTelephonySession(telephonySessionId);
    return Boolean(session && isConferenceTelephonySession(session));
  }

  private _findRawTelephonySession(
    telephonySessionId: string,
  ): TelephonySession | undefined {
    const callControl = (
      this as unknown as {
        _rcCallControl: { sessions: TelephonySession[] } | null;
      }
    )._rcCallControl;
    return callControl?.sessions.find(
      (session) => session.id === telephonySessionId,
    );
  }

  /**
   * Removes the host from a conference while keeping it alive for the other
   * participants. The server then ends the host's own call leg.
   */
  private async _leaveConferenceAsHost(
    telephonySessionId: string,
  ): Promise<void> {
    try {
      this.setCallControlBusyTimestamp();
      const session = this._findRawTelephonySession(telephonySessionId);
      if (!session) {
        throw new Error('conference session not found');
      }
      await session.removeParty(session.party.id, {
        keepConferenceAlive: true,
      });
    } catch (error) {
      await this._hangUpErrorHandle(error);
    } finally {
      this.clearCallControlBusyTimestamp();
    }
  }

  @track((that: ActiveCallControl) => [
    (that as any)._getTrackEventName(trackEvents.hangup),
  ])
  @delegate('server')
  async hangUp(telephonySessionId: string, hangupOnlyHost?: boolean) {
    const webphoneSessionId = this.getWebphoneSessionId(telephonySessionId);
    if (!webphoneSessionId) {
      return super.hangUp(telephonySessionId, hangupOnlyHost);
    }
    return this.endCall(telephonySessionId, hangupOnlyHost);
  }

  @delegate('server')
  async endCall(telephonySessionId: string, hangupOnlyHost?: boolean) {
    const webphoneSessionId = this.getWebphoneSessionId(telephonySessionId);
    if (!webphoneSessionId) {
      return super.endCall(telephonySessionId, hangupOnlyHost);
    }
    if (
      hangupOnlyHost &&
      (await this.checkIfConferenceCall(telephonySessionId))
    ) {
      return this._leaveConferenceAsHost(telephonySessionId);
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
    const webphoneSessionId = this.getWebphoneSessionId(telephonySessionId);
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

  /**
   * Waits for a conference leg to be answered using the runtime's own events.
   *
   * The base implementation listens for v1 SDK events on a raw session
   * (`accepted`, `cancel`, `rejected`, `terminated`). SDK 2.5 emits none of
   * those — only `answered`, `ringing`, `failed`, `disposed`, `mediaStreamSet` —
   * so the base version would wait forever.
   */
  override async _waitForWebphoneSessionAccepted(webphoneSessionId: string) {
    const exists = this._webphone.sessions.some(
      (session) => session.id === webphoneSessionId,
    );
    if (!exists) {
      throw new Error('conferencing session not found');
    }

    return new Promise<string>((resolve, reject) => {
      let settled = false;
      const settle = (error?: Error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        unsubscribeStart();
        unsubscribeEnd();
        if (error) reject(error);
        else resolve(webphoneSessionId);
      };

      // The runtime returns an unsubscribe function; the inherited Webphone
      // type still declares these as returning void.
      const registerEvent = this._webphone as unknown as {
        onCallStart: (h: (s: { id: string }) => void) => () => void;
        onCallEnd: (h: (s: { id: string }) => void) => () => void;
      };
      const unsubscribeStart = registerEvent.onCallStart((session) => {
        if (session.id === webphoneSessionId) settle();
      });
      const unsubscribeEnd = registerEvent.onCallEnd((session) => {
        if (session.id === webphoneSessionId) {
          settle(new Error('conferencing failed'));
        }
      });
      const timeoutId = setTimeout(
        () => settle(new Error('conferencing timeout')),
        CONFERENCE_ACCEPT_TIMEOUT,
      );
    });
  }

  /**
   * Decides whether to unhold from replicated session state.
   *
   * The base implementation reads `_webphone.originalSessions[id].localHold`,
   * but the webphone runtime now lives in the SharedWorker and exposes only
   * normalized, serializable sessions — so `originalSessions` is undefined and
   * the base check silently returns false, leaving the call held forever.
   */
  protected override async _unholdWithWebphone(webphoneSessionId: string) {
    const session = this._webphone.sessions.find(
      (item) => item.id === webphoneSessionId,
    );
    if (!session?.isOnHold) {
      return false;
    }
    await this._webphone.unhold(
      webphoneSessionId,
      (this as any).unholdErrorHandle,
    );
    return true;
  }

  @track((that: ActiveCallControl) => [
    (that as any)._getTrackEventName(trackEvents.unhold),
  ])
  @delegate('server')
  async unhold(telephonySessionId: string) {
    const webphoneSessionId = this.getWebphoneSessionId(telephonySessionId);
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
    const webphoneSessionId = this.getWebphoneSessionId(telephonySessionId);
    if (!webphoneSessionId) {
      return super.reject(telephonySessionId);
    }
    try {
      this.setCallControlBusyTimestamp();
      const webphoneSession = this._webphone.sessions.find(
        (session) => session.id === webphoneSessionId,
      );
      // A queue call cannot go to the user's voicemail, so it is ignored instead.
      if (webphoneSession?.callQueueName) {
        await this._webphone.reject(webphoneSessionId);
        return;
      }
      await this._webphone.toVoiceMail(webphoneSessionId);
    } finally {
      this.clearCallControlBusyTimestamp();
    }
  }

  @track((that: ActiveCallControl) => [
    (that as any)._getTrackEventName(trackEvents.ignore),
  ])
  @delegate('server')
  async ignore(telephonySessionId: string) {
    const webphoneSessionId = this.getWebphoneSessionId(telephonySessionId);
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
    const webphoneSessionId = this.getWebphoneSessionId(telephonySessionId);
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

  /**
   * Transfers an answered call to the selected extension voicemail.
   *
   * Uses the Call Control transfer API. WebPhone `toVoiceMail()` only rejects
   * a ringing inbound call and ignores the selected voicemail.
   */
  @delegate('server')
  async toVoicemail(voicemailId: string, telephonySessionId: string) {
    const partyData = this.getWebphonePartyData(telephonySessionId);
    if (!partyData) {
      return super.toVoicemail(voicemailId, telephonySessionId);
    }
    try {
      this.setCallControlBusyTimestamp();
      await this._client.service.platform().post(
        `/restapi/v1.0/account/~/telephony/sessions/${partyData.sessionId}/parties/${partyData.partyId}/transfer`,
        { voicemail: voicemailId },
      );
      this._toast.success({
        message: activeCallControlT('transferCompleted'),
      });
      return true;
    } catch (error: unknown) {
      this.logger.error('toVoicemail failed', error);
      this._toast.warning({
        message: activeCallControlT('toVoiceMailError'),
      });
      return false;
    } finally {
      this.clearCallControlBusyTimestamp();
    }
  }

  @track(trackEvents.transfer)
  @delegate('server')
  async transfer(transferNumber: string, telephonySessionId: string) {
    const webphoneSessionId = this.getWebphoneSessionId(telephonySessionId);
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
    const webphoneSessionId = this.getWebphoneSessionId(telephonySessionId);
    if (!webphoneSessionId) {
      return super.forward(forwardNumber, telephonySessionId);
    }
    const webphoneSession = this._webphone.sessions.find(
      (session) => session.id === webphoneSessionId,
    );
    const partyData = webphoneSession?.partyData as
      | PartyData
      | null
      | undefined;
    if (!partyData) {
      return this._webphone.forward(webphoneSessionId, forwardNumber);
    }
    const [validPhoneNumber] = validateNumbers({
      allowRegionSettings: Boolean(
        this._brand.brandConfig.allowRegionSettings,
      ),
      areaCode: this._regionSettings.areaCode,
      countryCode: this._regionSettings.countryCode,
      phoneNumbers: [forwardNumber],
    });
    if (!validPhoneNumber) {
      return false;
    }
    const maximumExtensionLength =
      this._accountInfo.maxExtensionNumberLength || 6;
    const requestBody: {
      extensionNumber?: string;
      phoneNumber?: string;
    } = {};
    if (
      !validPhoneNumber.includes('+') &&
      validPhoneNumber.length <= maximumExtensionLength
    ) {
      requestBody.extensionNumber = validPhoneNumber;
    } else {
      requestBody.phoneNumber = validPhoneNumber;
    }
    await this._webphoneV2.setForwardFlag(webphoneSessionId);
    try {
      this.setCallControlBusyTimestamp();
      await this._client.service.platform().post(
        `/restapi/v1.0/account/~/telephony/sessions/${partyData.sessionId}/parties/${partyData.partyId}/forward`,
        requestBody,
      );
      return true;
    } catch (error: unknown) {
      this.logger.error('forward failed', error);
      this._toast.warning({
        message: webphoneErrors.forwardError,
      });
      return false;
    } finally {
      this.clearCallControlBusyTimestamp();
    }
  }

  @delegate('server')
  async flip(flipValue: string, telephonySessionId: string) {
    const webphoneSessionId = this.getWebphoneSessionId(telephonySessionId);
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
    const webphoneSessionId = this.getWebphoneSessionId(telephonySessionId);
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
      this.getWarmTransferWebphoneSessionId(telephonySessionId);
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
    const webphoneSessionId = this.getWebphoneSessionId(telephonySessionId);
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

/**
 * Replaces the base `_initWebphoneSessionEvents`, which reads
 * `_webphone.originalSessions[id]` and listens for the v1 `progress` event.
 * Neither exists now the runtime lives in the SharedWorker and speaks SDK 2.5,
 * so party data is taken from the replicated session stream instead.
 *
 * Assigned on the prototype because the base member is `private`, which
 * TypeScript will not let a subclass redeclare.
 */
Object.defineProperty(
  ActiveCallControl.prototype,
  '_initWebphoneSessionEvents',
  {
    configurable: true,
    writable: true,
    value: async function watchWebphoneSessionPartyData(
      this: ActiveCallControl,
      webphoneSessionId: string,
      transferSessionId?: string,
    ) {
      const webphone = (this as any)._webphone;
      webphone.sessions$
        .pipe(
          filter((sessions: any[]) =>
            sessions.some(
              (session) =>
                session.id === webphoneSessionId &&
                Boolean(session.partyData?.sessionId),
            ),
          ),
          take(1),
        )
        .subscribe((sessions: any[]) => {
          const session = sessions.find(
            (item) => item.id === webphoneSessionId,
          );
          const telephonySessionId = session?.partyData?.sessionId;
          if (telephonySessionId) {
            void (this as any)._onWebphoneSessionProgress(
              telephonySessionId,
              transferSessionId,
            );
          }
        });
    },
  },
);
