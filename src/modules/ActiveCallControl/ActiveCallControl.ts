import { filter, forEach } from 'ramda';
import { RingCentralCallControl } from 'ringcentral-call-control';
import type { ReplyWithTextParams } from 'ringcentral-call-control/lib/Session';
import {
  PartyStatusCode,
  ReplyWithPattern,
  type Party,
  type Session as TelephonySession,
} from 'ringcentral-call-control/lib/Session';
import type ExtensionTelephonySessionsEvent from '@rc-ex/core/lib/definitions/ExtensionTelephonySessionsEvent';
import {
  action,
  computed,
  RcModuleV2,
  state,
  storage,
  track,
  watch,
} from '@ringcentral-integration/core';
import { sleep } from '@ringcentral-integration/utils';
import { callDirection } from '@ringcentral-integration/commons/enums/callDirections';
// eslint-disable-next-line import/no-named-as-default
import subscriptionFilters from '@ringcentral-integration/commons/enums/subscriptionFilters';
import { trackEvents } from '@ringcentral-integration/commons/enums/trackEvents';
import { Module } from '@ringcentral-integration/commons/lib/di';
import { proxify } from '@ringcentral-integration/commons/lib/proxy/proxify';
import { validateNumbers } from '@ringcentral-integration/commons/lib/validateNumbers';
// TODO: should move that callErrors to enums
import { callErrors } from '@ringcentral-integration/commons/modules/Call/callErrors';
import type { MessageBase } from '@ringcentral-integration/commons/modules/Subscription';
import { webphoneErrors } from '@ringcentral-integration/commons/modules/Webphone/webphoneErrors';

import type {
  ActiveCallControlSessionData,
  ActiveSession,
  Deps,
  ICurrentDeviceCallsMap,
  ITransferCallSessionMapping,
  ModuleMakeCallParams,
  IPickUpCallDataMap,
  IPickUpCallParams,
} from '@ringcentral-integration/commons/modules/ActiveCallControl/ActiveCallControl.interface';
import { callControlError } from '@ringcentral-integration/commons/modules/ActiveCallControl/callControlError';
import type { WebphoneSession } from '../WebphoneV2/Webphone.interface';
import { CallControlEvents } from './callControlEvents';
import {
  conflictError,
  findConferenceParticipants,
  getWebphoneReplyMessageOption,
  isConnectedCall,
  isProceeding,
  isRecording,
  normalizeSession,
  normalizeToActiveCallControlSession,
} from './helpers';

const DEFAULT_TTL = 30 * 60 * 1000;
const DEFAULT_TIME_TO_RETRY = 62 * 1000;
const DEFAULT_BUSY_TIMEOUT = 3 * 1000;

const telephonySessionsEndPoint = /\/telephony\/sessions$/;
const subscribeEvent = subscriptionFilters.telephonySessions;

@Module({
  name: 'ActiveCallControl',
  deps: [
    'Auth',
    'Alert',
    'Brand',
    'Client',
    'Presence',
    'AccountInfo',
    'Subscription',
    'ExtensionInfo',
    'NumberValidate',
    'RegionSettings',
    'ConnectivityMonitor',
    'AppFeatures',
    { dep: 'Prefix', optional: true },
    { dep: 'Storage', optional: true },
    { dep: 'Webphone', optional: true },
    { dep: 'TabManager', optional: true },
    { dep: 'AudioSettings', optional: true },
    { dep: 'AvailabilityMonitor', optional: true },
    { dep: 'ActiveCallControlOptions', optional: true },
    { dep: 'RouterInteraction', optional: true },
  ],
})
export class ActiveCallControl extends RcModuleV2<Deps> {
  private _onCallEndFunc?: () => void;
  private _onCallSwitchedFunc?: (sessionId: string) => void;
  onCallIgnoreFunc?: (partyId: string) => void;
  private _connectivity = false;
  private _timeoutId: ReturnType<typeof setTimeout> | null = null;
  private _lastSubscriptionMessage: MessageBase | null = null;

  private _ttl = this._deps.activeCallControlOptions?.ttl ?? DEFAULT_TTL;
  private _timeToRetry = this._deps.activeCallControlOptions?.timeToRetry ?? DEFAULT_TIME_TO_RETRY;
  private _polling = this._deps.activeCallControlOptions?.polling ?? false;
  private _promise: Promise<void> | null = null;
  private _rcCallControl: RingCentralCallControl | null = null;
  private _permissionCheck = this._deps.activeCallControlOptions?.permissionCheck ?? true;

  @state
  pickUpCallDataMap: IPickUpCallDataMap = {};

  constructor(deps: Deps) {
    super({
      deps,
      enableCache: deps.activeCallControlOptions?.enableCache ?? true,
      storageKey: 'activeCallControl',
    });
  }

  override async onStateChange() {
    if (this.ready && this.hasPermission) {
      this._subscriptionHandler();
      this._checkConnectivity();
    }
  }

  @storage
  @state
  transferCallMapping: ITransferCallSessionMapping = {};

  @storage
  @state
  data: {
    activeSessionId: string | null;
    busyTimestamp: number;
    timestamp: number;
    sessions: ActiveCallControlSessionData[];
    ringSessionId: string | null;
  } = {
    activeSessionId: null,
    busyTimestamp: 0,
    timestamp: 0,
    sessions: [],
    ringSessionId: null,
  };

  @computed((that: ActiveCallControl) => [that._deps.webphone?.sessions])
  get currentDeviceCallsMap(): ICurrentDeviceCallsMap {
    if (!this._deps.webphone) {
      return {};
    }
    const newCurrentDeviceCallsMap = {} as ICurrentDeviceCallsMap;
    this._deps.webphone.sessions.forEach((session) => {
      const telephonySessionId = session.partyData?.sessionId!;
      newCurrentDeviceCallsMap[telephonySessionId] = session.id;
    });
    return newCurrentDeviceCallsMap;
  }

  @state
  lastEndedSessionIds: string[] = [];

  // TODO: conference call using
  @state
  cachedSessions: object[] = [];

  override async onInit() {
    if (!this.hasPermission) return;

    await this._deps.subscription.subscribe([subscribeEvent]);
    this._rcCallControl = this._initRcCallControl();

    if (this._shouldFetch()) {
      try {
        await this.fetchData();
      } catch (e: any /** TODO: confirm with instanceof */) {
        this._retry();
      }
    } else if (this._polling) {
      this._startPolling();
    } else {
      this._retry();
    }
  }

  protected _initRcCallControl() {
    const rcCallControl = new RingCentralCallControl({
      sdk: this._deps.client.service,
      preloadDevices: false,
      preloadSessions: false,
      extensionInfo: {
        ...this._deps.extensionInfo.info,
        // TODO: add info type in 'AccountInfo'
        // @ts-ignore
        account: this._deps.accountInfo.info,
      },
    });
    rcCallControl.on('new', (session: TelephonySession) => {
      this._newSessionHandler(session);
    });
    return rcCallControl;
  }

  override onReset() {
    this.resetState();
  }

  @action
  resetState() {
    this.data.activeSessionId = null;
    this.data.busyTimestamp = 0;
    this.data.timestamp = 0;
    this.data.sessions = [];
  }

  _shouldFetch() {
    return !this._deps.tabManager || this._deps.tabManager.active;
  }

  @proxify
  async fetchData() {
    if (!this._promise) {
      this._promise = this._fetchData();
    }
    await this._promise;
  }

  _clearTimeout() {
    if (this._timeoutId) clearTimeout(this._timeoutId);
  }

  _subscriptionHandler() {
    let { message } = this._deps.subscription;
    if (
      message &&
      // FIXME: is that object compare is fine, should confirm that?
      message !== this._lastSubscriptionMessage &&
      message.event &&
      telephonySessionsEndPoint.test(message.event) &&
      message.body
    ) {
      message = this._checkRingOutCallDirection(message);
      this._lastSubscriptionMessage = message;
      if (this._rcCallControl) {
        this._rcCallControl.onNotificationEvent(message);
      }
    }
  }

  // TODO: workaround of PLA bug: PLA-52742, remove these code after PLA
  // fixed this bug
  private _checkRingOutCallDirection(message: ExtensionTelephonySessionsEvent) {
    const { body } = message;
    const originType = body?.origin?.type;

    if (body && originType === 'RingOut') {
      const { parties } = body;
      if (Array.isArray(parties) && parties.length) {
        forEach((party: any) => {
          if (
            party.ringOutRole &&
            party.ringOutRole === 'Initiator' &&
            party.direction === 'Inbound'
          ) {
            const tempFrom = { ...party.from };
            party.direction = 'Outbound';
            party.from = party.to;
            party.to = tempFrom;
          }
        }, parties);
      }
    }
    return message;
  }

  private _retry(t = this.timeToRetry) {
    this._clearTimeout();
    this._timeoutId = setTimeout(() => {
      this._timeoutId = null;
      if (!this.timestamp || Date.now() - this.timestamp > this.ttl) {
        if (!this._deps.tabManager || this._deps.tabManager.active) {
          this.fetchData();
        } else {
          // continue retry checks in case tab becomes main tab
          this._retry();
        }
      }
    }, t);
  }

  @proxify
  async _fetchData() {
    try {
      await this._syncData();
      if (this._polling) {
        this._startPolling();
      }
      this._promise = null;
    } catch (error: any /** TODO: confirm with instanceof */) {
      this._promise = null;
      if (this._polling) {
        this._startPolling(this.timeToRetry);
      } else {
        this._retry();
      }
      throw error;
    }
  }

  private _startPolling(t = this.timestamp + this.ttl + 10 - Date.now()) {
    this._clearTimeout();
    this._timeoutId = setTimeout(() => {
      this._timeoutId = null;
      if (!this._deps.tabManager || this._deps.tabManager?.active) {
        if (!this.timestamp || Date.now() - this.timestamp > this.ttl) {
          this.fetchData();
        } else {
          this._startPolling();
        }
      } else if (this.timestamp && Date.now() - this.timestamp < this.ttl) {
        this._startPolling();
      } else {
        this._startPolling(this.timeToRetry);
      }
    }, t);
  }

  async _syncData() {
    try {
      const activeCalls = this._deps.presence.calls;
      await this._rcCallControl.loadSessions(activeCalls);
      this.updateActiveSessions();
      this._rcCallControl.sessions.forEach((session) => {
        this._newSessionHandler(session as TelephonySession);
      });
    } catch (error: any /** TODO: confirm with instanceof */) {
      console.log('sync data error:', error);
      throw error;
    }
  }

  private _updateSessionsStatusHandler = ({
    party,
  }: {
    party: Party;
  }) => {
    this.updateActiveSessions();

    if (party.status.code === PartyStatusCode.answered) {
      const telephonySession = this.sessions.find(
        (x) => x.party.id === party.id,
      );
      if (
        telephonySession &&
        telephonySession.telephonySessionId !== this.activeSessionId
      ) {
        this.setActiveSessionId(telephonySession.telephonySessionId);
      }
    }
  };

  private _updateSessionsHandler = () => {
    this.updateActiveSessions();
  };

  updateActiveSessions() {
    const sessions = this._rcCallControl.sessions || [];
    const callControlSessions = sessions
      .filter((session) => isConnectedCall(session))
      .map((session) => {
        const conferenceSessions = findConferenceParticipants(
          session,
          sessions,
          this._deps.extensionInfo.info,
        );

        return normalizeToActiveCallControlSession(
          session,
          conferenceSessions,
        );
      })
      .filter((session) =>
        this.skipConferenceCall ? !session.isConferenceCall : true,
      );
    this._updateActiveSessions(JSON.parse(JSON.stringify(callControlSessions)));
  }

  get skipConferenceCall() {
    return this._deps.ActiveCallControlOptions?.skipConferenceCall;
  }

  @action
  private _updateActiveSessions(
    callControlSessions: ActiveCallControlSessionData[],
  ) {
    this.data.timestamp = Date.now();
    this.data.sessions = callControlSessions || [];
  }

  private _newSessionHandler(session: TelephonySession) {
    session.removeListener(
      CallControlEvents.status,
      this._updateSessionsStatusHandler,
    );
    session.removeListener(CallControlEvents.muted, this._updateSessionsHandler);
    session.removeListener(CallControlEvents.recordings, this._updateSessionsHandler);
    session.on(CallControlEvents.status, this._updateSessionsStatusHandler);
    session.on(CallControlEvents.muted, this._updateSessionsHandler);
    session.on(CallControlEvents.recordings, this._updateSessionsHandler);
    // Handle the session update at the end of function to reduce the probability of empty rc call
    // sessions
    this._updateSessionsHandler();
  }

  @action
  removeActiveSession() {
    this.data.activeSessionId = null;
  }

  // count it as load (should only call on container init step)
  @action
  setActiveSessionId(telephonySessionId: string) {
    if (!telephonySessionId) return;
    this.data.activeSessionId = telephonySessionId;
  }

  private _checkConnectivity() {
    if (
      this._deps.connectivityMonitor &&
      this._deps.connectivityMonitor.ready &&
      this._connectivity !== this._deps.connectivityMonitor.connectivity
    ) {
      this._connectivity = this._deps.connectivityMonitor.connectivity;

      if (this._connectivity) {
        this.fetchData();
      }
    }
  }

  private _getTrackEventName(name: string) {
    // TODO: refactor to remove `this.parentModule`.
    const currentPath = this._deps.routerInteraction?.currentPath;
    const showCallLog = (this.parentModule as any).callLogSection?.show;
    const showNotification = (this.parentModule as any).callLogSection
      ?.showNotification;
    if (showNotification) {
      return `${name}/Call notification page`;
    }
    if (showCallLog) {
      return `${name}/Call log page`;
    }
    if (currentPath === '/calls') {
      return `${name}/All calls page`;
    }
    if (currentPath.includes('/simplifycallctrl')) {
      return `${name}/Small call control`;
    }
    return name;
  }

  @action
  setCallControlBusyTimestamp() {
    this.data.busyTimestamp = Date.now();
  }

  @action
  clearCallControlBusyTimestamp() {
    this.data.busyTimestamp = 0;
  }

  @track((that: ActiveCallControl) => [
    that._getTrackEventName(trackEvents.mute),
  ])
  @proxify
  async mute(telephonySessionId: string) {
    try {
      this.setCallControlBusyTimestamp();
      const session = this._getSessionById(telephonySessionId);
      await session.mute();
      this.clearCallControlBusyTimestamp();
    } catch (error: any) {
      // TODO: fix error handling with instanceof
      if (error.response && !error.response._text) {
        error.response._text = await error.response.clone().text();
      }
      if (conflictError(error)) {
        this._deps.alert.warning({
          message: callControlError.muteConflictError,
        });
      } else if (
        !(await this._deps.availabilityMonitor?.checkIfHAError(error))
      ) {
        this._deps.alert.warning({ message: callControlError.generalError });
      }
      this.clearCallControlBusyTimestamp();
    }
  }

  @track((that: ActiveCallControl) => [
    that._getTrackEventName(trackEvents.unmute),
  ])
  @proxify
  async unmute(telephonySessionId: string) {
    try {
      this.setCallControlBusyTimestamp();
      const session = this._getSessionById(telephonySessionId);
      await session.unmute();
      this.clearCallControlBusyTimestamp();
    } catch (error: any) {
      // TODO: fix error handling with instanceof
      if (error.response && !error.response._text) {
        error.response._text = await error.response.clone().text();
      }
      if (conflictError(error)) {
        this._deps.alert.warning({
          message: callControlError.unMuteConflictError,
        });
      } else if (
        !(await this._deps.availabilityMonitor?.checkIfHAError(error))
      ) {
        this._deps.alert.warning({ message: callControlError.generalError });
      }
      this.clearCallControlBusyTimestamp();
    }
  }

  async transferUnmuteHandler(telephonySessionId: string) {
    try {
      const session = this._getSessionById(telephonySessionId);
      if (session?.party?.muted) {
        await session.unmute();
      }
    } catch (error: any /** TODO: confirm with instanceof */) {
      // https://jira_domain/browse/NTP-1308
      // Unmute before transfer due to we can not sync the mute status after transfer.
    }
  }

  getRecordingId(session: TelephonySession) {
    const recording = session.recordings[0];
    const recodingId = recording && recording.id;
    return recodingId;
  }

  @track((that: ActiveCallControl) => [
    that._getTrackEventName(trackEvents.record),
  ])
  @proxify
  async startRecord(telephonySessionId: string) {
    try {
      this.setCallControlBusyTimestamp();
      const session = this._getSessionById(telephonySessionId);
      const recordingId = this.getRecordingId(session);
      if (!recordingId) {
        await session.createRecord();
      } else {
        await session.resumeRecord(recordingId);
      }
      this.clearCallControlBusyTimestamp();
      return true;
    } catch (error: any) {
      // TODO: fix error handling with instanceof
      this.clearCallControlBusyTimestamp();
      const { errors = [] } = (await error.response.clone().json()) || {};
      if (errors.length) {
        for (const error of errors) {
          console.error('record fail:', error);
        }
        this._deps.alert.danger({
          message: webphoneErrors.recordError,
          payload: {
            errorCode: errors[0].errorCode,
          },
        });
      }
    }
  }

  @track((that: ActiveCallControl) => [
    that._getTrackEventName(trackEvents.stopRecord),
  ])
  @proxify
  async stopRecord(telephonySessionId: string) {
    try {
      this.setCallControlBusyTimestamp();
      const session = this._getSessionById(telephonySessionId);
      const recordingId = this.getRecordingId(session);
      await session.pauseRecord(recordingId);
      this.clearCallControlBusyTimestamp();
    } catch (error: any /** TODO: confirm with instanceof */) {
      console.log('stop record error:', error);

      this._deps.alert.danger({
        message: webphoneErrors.pauseRecordError,
      });

      this.clearCallControlBusyTimestamp();
    }
  }

  @track((that: ActiveCallControl) => [
    that._getTrackEventName(trackEvents.hangup),
  ])
  @proxify
  async hangUp(telephonySessionId: string) {
    try {
      this.setCallControlBusyTimestamp();
      const session = this._getSessionById(telephonySessionId);
      await session.drop();

      this._onCallEndFunc?.();
      // TODO: find way to fix that 800ms
      // avoid hung up sync slow and user click multiple times.
      await sleep(800);
      this.clearCallControlBusyTimestamp();
    } catch (error: any) {
      // TODO: fix error handling with instanceof
      console.error('hangup error', error);
      if (!(await this._deps.availabilityMonitor?.checkIfHAError(error))) {
        this._deps.alert.warning({ message: callControlError.generalError });
      }
      this.clearCallControlBusyTimestamp();
    }
  }

  @track((that: ActiveCallControl) => [
    that._getTrackEventName(trackEvents.voicemail),
  ])
  @proxify
  async reject(telephonySessionId: string) {
    try {
      this.setCallControlBusyTimestamp();
      const session = this._getSessionById(telephonySessionId);

      // !If is a queue call, ignore is performed
      if (session.party.queueCall) {
        return await this.ignore(telephonySessionId);
      }

      await session.toVoicemail();
      this.clearCallControlBusyTimestamp();
    } catch (error: any) {
      // TODO: fix error handling with instanceof
      if (!(await this._deps.availabilityMonitor?.checkIfHAError(error))) {
        this._deps.alert.warning({ message: callControlError.generalError });
      }
      this.clearCallControlBusyTimestamp();
    }
  }

  @track((that: ActiveCallControl) => [
    that._getTrackEventName(trackEvents.confirmSwitch),
  ])
  @proxify
  async switch(telephonySessionId: string) {
    try {
      this.setCallControlBusyTimestamp();
      await this.transferUnmuteHandler(telephonySessionId);
      const activeCall = this._deps.presence.calls.find(
        (call) => call.telephonySessionId === telephonySessionId,
      )!;
      const switchedSession = await this._deps.webphone.switchCall(
        activeCall as any,
        this._deps.regionSettings.homeCountryId,
      );
      this.clearCallControlBusyTimestamp();
      this._onCallSwitchedFunc?.(switchedSession.id);
    } catch (error: any) {
      // TODO: fix error handling with instanceof
      if (!(await this._deps.availabilityMonitor?.checkIfHAError(error))) {
        this._deps.alert.warning({ message: callControlError.generalError });
      }
      this.clearCallControlBusyTimestamp();
    }
  }

  @track((that: ActiveCallControl) => [
    that._getTrackEventName(trackEvents.hold),
  ])
  @proxify
  async hold(telephonySessionId: string) {
    try {
      this.setCallControlBusyTimestamp();
      const session = this._getSessionById(telephonySessionId);
      await session.hold();
      this.clearCallControlBusyTimestamp();
    } catch (error: any) {
      // TODO: fix error handling with instanceof
      if (error.response && !error.response._text) {
        error.response._text = await error.response.clone().text();
      }
      if (conflictError(error)) {
        this._deps.alert.warning({
          message: callControlError.holdConflictError,
        });
      } else if (
        !(await this._deps.availabilityMonitor?.checkIfHAError(error))
      ) {
        this._deps.alert.warning({ message: callControlError.generalError });
      }
      this.clearCallControlBusyTimestamp();
    }
  }

  @track((that: ActiveCallControl) => [
    that._getTrackEventName(trackEvents.unhold),
  ])
  @proxify
  async unhold(telephonySessionId: string) {
    try {
      this.setCallControlBusyTimestamp();
      const session = this._getSessionById(telephonySessionId);
      await session.unhold();
      this.setActiveSessionId(telephonySessionId);
      this.clearCallControlBusyTimestamp();
    } catch (error: any) {
      // TODO: fix error handling with instanceof
      if (error.response && !error.response._text) {
        error.response._text = await error.response.clone().text();
      }
      if (conflictError(error)) {
        this._deps.alert.warning({
          message: callControlError.unHoldConflictError,
        });
      } else if (
        !(await this._deps.availabilityMonitor?.checkIfHAError(error))
      ) {
        this._deps.alert.warning({
          message: callControlError.generalError,
        });
      }
      this.clearCallControlBusyTimestamp();
    }
  }

  @track((_, params: ReplyWithTextParams) => {
    let messageType = 'End-User Custom Message';
    if (params.replyWithPattern) {
      const pattern = params.replyWithPattern?.pattern;
      if (
        pattern === ReplyWithPattern.inAMeeting ||
        pattern === ReplyWithPattern.onMyWay
      ) {
        messageType = 'Default Static Message';
      } else {
        messageType = 'Default Dynamic Message';
      }
    }
    return [
      trackEvents.executionReplyWithMessage,
      {
        'Message Type': messageType,
      },
    ];
  })
  @proxify
  async replyWithMessage(
    params: ReplyWithTextParams,
    telephonySessionId: string,
  ) {
    try {
      this.setCallControlBusyTimestamp();
      const session = this._getSessionById(telephonySessionId);
      if (!session) {
        return false;
      }
      const webphoneSession = this._deps.webphone.sessions.find(
        (s) => s.partyData?.sessionId === session.id,
      );
      const webphoneReplyOption = getWebphoneReplyMessageOption(params) as any;
      await this._deps.webphone.replyWithMessage(webphoneSession.id, webphoneReplyOption);
      this.clearCallControlBusyTimestamp();
      this._deps.alert.success({ message: callControlError.replyCompleted });
    } catch (error: any /** TODO: confirm with instanceof */) {
      console.error('replyWithMessage error', error);
      this._deps.alert.warning({ message: callControlError.generalError });
      this.clearCallControlBusyTimestamp();
    }
  }

  @proxify
  async toVoicemail(voicemailId: string, telephonySessionId: string) {
    try {
      this.setCallControlBusyTimestamp();
      const session = this._getSessionById(telephonySessionId);
      if (!session) {
        return false;
      }
      await session.transfer({ voicemail: voicemailId });
      this.clearCallControlBusyTimestamp();
      this._deps.alert.success({ message: callControlError.transferCompleted });
    } catch (error: any /** TODO: confirm with instanceof */) {
      console.error('toVoicemail error', error);
      this._deps.alert.warning({ message: webphoneErrors.toVoiceMailError });
      this.clearCallControlBusyTimestamp();
    }
  }

  @proxify
  async completeWarmTransfer(telephonySession: string) {
    try {
      this.setCallControlBusyTimestamp();

      const { isOriginal, relatedTelephonySessionId } =
        this.transferCallMapping[telephonySession];

      const session = this._getSessionById(
        isOriginal ? telephonySession : relatedTelephonySessionId,
      );
      const transferSession = this._getSessionById(
        isOriginal ? relatedTelephonySessionId : telephonySession,
      );

      if (!transferSession) {
        return false;
      }
      await session.bridge({
        telephonySessionId: transferSession.id,
        partyId: transferSession.party.id,
      });
      this.clearCallControlBusyTimestamp();
      this._deps.alert.success({ message: callControlError.transferCompleted });
    } catch (error: any /** TODO: confirm with instanceof */) {
      console.error('warmTransfer error', error);
      this._deps.alert.warning({ message: callControlError.generalError });
      this.clearCallControlBusyTimestamp();
    }
  }

  @track(trackEvents.transfer)
  @proxify
  async transfer(transferNumber: string, telephonySessionId: string) {
    try {
      this.setCallControlBusyTimestamp();
      const session = this._getSessionById(telephonySessionId);
      const phoneNumber = await this.getValidPhoneNumber(transferNumber, true);
      if (phoneNumber) {
        const params: { phoneNumber?: string; extensionNumber?: string } = {};
        if (phoneNumber.startsWith('+')) {
          params.phoneNumber = phoneNumber;
        } else {
          params.extensionNumber = phoneNumber;
        }
        await session.transfer(params);
        this.clearCallControlBusyTimestamp();
        this._deps.alert.success({
          message: callControlError.transferCompleted,
        });
      }
    } catch (error: any) {
      // TODO: fix error handling with instanceof
      if (!(await this._deps.availabilityMonitor?.checkIfHAError(error))) {
        this._deps.alert.warning({ message: webphoneErrors.transferError });
      }
      this.clearCallControlBusyTimestamp();
    }
  }

  async getValidPhoneNumber(phoneNumber: string, withMainNumber?: boolean) {
    let validatedResult;
    let validPhoneNumber;
    if (!this._permissionCheck) {
      validatedResult = validateNumbers({
        allowRegionSettings: !!this._deps.brand.brandConfig.allowRegionSettings,
        areaCode: this._deps.regionSettings.areaCode,
        countryCode: this._deps.regionSettings.countryCode,
        phoneNumbers: [phoneNumber],
      });
      validPhoneNumber = validatedResult[0];
    } else {
      const isEDPEnabled = this._deps.appFeatures?.isEDPEnabled;
      validatedResult = isEDPEnabled
        ? this._deps.numberValidate.validate([phoneNumber])
        : await this._deps.numberValidate.validateNumbers([phoneNumber]);

      if (!validatedResult.result) {
        validatedResult.errors.forEach(async (error) => {
          const isHAError =
            // @ts-expect-error
            !!(await this._deps.availabilityMonitor?.checkIfHAError(error));
          if (!isHAError) {
            // TODO: fix `callErrors` type
            this._deps.alert.warning({
              message: (callErrors as any)[error.type],
              payload: {
                phoneNumber: error.phoneNumber,
              },
            });
          }
        });
        return;
      }
      if (isEDPEnabled) {
        const parsedNumbers = await this._deps.numberValidate.parseNumbers([
          phoneNumber,
        ]);
        validPhoneNumber =
          parsedNumbers?.[0].availableExtension ??
          parsedNumbers?.[0].parsedNumber;
      } else {
        // TODO: fix `validatedResult` type in `numberValidate` module.
        validPhoneNumber = (validatedResult as any).numbers?.[0]?.e164;
      }
    }

    let result = validPhoneNumber;
    if (withMainNumber && validPhoneNumber.indexOf('+') === -1) {
      result = [
        this._deps.accountInfo.mainCompanyNumber,
        validPhoneNumber,
      ].join('*');
    }

    return result;
  }

  // FIXME: Incomplete Implementation?
  @proxify
  async flip(flipValue: string, telephonySessionId: string) {
    try {
      this.setCallControlBusyTimestamp();
      const session = this._getSessionById(telephonySessionId);
      await session.flip({ callFlipId: flipValue });
      this.clearCallControlBusyTimestamp();
    } catch (error: any /** TODO: confirm with instanceof */) {
      console.error('flip error', error);
      this.clearCallControlBusyTimestamp();
      throw error;
    }
  }

  @track((that: ActiveCallControl) => [
    that._getTrackEventName(trackEvents.confirmForward),
  ])
  @proxify
  async forward(forwardNumber: string, telephonySessionId: string) {
    const session = this._getSessionById(telephonySessionId);
    if (!session) {
      return false;
    }
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
              message: (callErrors as any)[error.type],
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
          validPhoneNumber = (validatedResult as any).numbers?.[0]?.e164;
        }
      }
      const params: { phoneNumber?: string; extensionNumber?: string } = {};
      if (forwardNumber.length > 5) {
        params.phoneNumber = forwardNumber;
      } else {
        params.extensionNumber = forwardNumber;
      }
      await session.forward(params);
      this._deps.alert.success({
        message: callControlError.forwardSuccess,
      });
      if (typeof this._onCallEndFunc === 'function') {
        this._onCallEndFunc();
      }
      return true;
    } catch (e: any /** TODO: confirm with instanceof */) {
      console.error(e);
      this._deps.alert.warning({
        message: webphoneErrors.forwardError,
      });
      return false;
    }
  }

  // DTMF handing by webphone session temporary, due to rc call session doesn't support currently
  @proxify
  async sendDTMF(dtmfValue: string, telephonySessionId: string) {
    try {
      const session = this._getSessionById(telephonySessionId);
      const webphoneSession = this._deps.webphone.sessions.find(
        (s) => s.partyData?.sessionId === session.id,
      );
      if (webphoneSession) {
        await this._deps.webphone.sendDTMF(dtmfValue, webphoneSession.id);
      }
    } catch (error: any /** TODO: confirm with instanceof */) {
      console.log('send dtmf error', error);
      throw error;
    }
  }

  @action
  setPickUpCallData(data: IPickUpCallDataMap) {
    this.pickUpCallDataMap = { ...data };
  }

  private _getCurrentDeviceCallsBySessionId(telephonySessionId: string) {
    return this.currentDeviceCallsMap[telephonySessionId];
  }

  @proxify
  private async _answer(telephonySessionId: string) {
    try {
      this.setCallControlBusyTimestamp();
      const currentDeviceWebphoneId = this._getCurrentDeviceCallsBySessionId(telephonySessionId);
      if (currentDeviceWebphoneId) {
        await this._deps.webphone.answer(currentDeviceWebphoneId);
      } else {
        await this.pickUpCall({
          ...this.pickUpCallDataMap[telephonySessionId],
        });
      }
      this._trackWebRTCCallAnswer();
    } finally {
      this.clearCallControlBusyTimestamp();
    }
  }

  public async pickUpCall(data: IPickUpCallParams) {
    // TODO: implement
    console.warn('pickUpCall is not implemented');
  }

  @track((that: ActiveCallControl) => [
    that._getTrackEventName(trackEvents.answer),
  ])
  @proxify
  async answer(telephonySessionId: string) {
    try {
      await this._answer(telephonySessionId);
    } catch (error: any /** TODO: confirm with instanceof */) {
      console.log('answer failed.');
    }
  }

  @track((that: ActiveCallControl) => [
    that._getTrackEventName(trackEvents.holdAndAnswer),
  ])
  @proxify
  async answerAndHold(telephonySessionId: string) {
    // currently, the logic is same as answer
    try {
      await this._answer(telephonySessionId);
    } catch (error: any /** TODO: confirm with instanceof */) {
      console.log('answer hold failed.', error);
    }
  }

  /**
   * ignore an incoming WebRTC call, after action executed, call will be ignored at current
   * device and move to "calls on other device" section. This call still can be answered at other
   * device
   * @param {string} telephonySessionId
   * @memberof ActiveCallControl
   */
  @track((that: ActiveCallControl) => [
    that._getTrackEventName(trackEvents.ignore),
  ])
  @proxify
  async ignore(telephonySessionId: string) {
    try {
      this.setCallControlBusyTimestamp();
      const session = this._getSessionById(telephonySessionId);
      const webphoneSession = this._deps.webphone.sessions.find((s) => s.partyData?.sessionId === telephonySessionId);
      if (!webphoneSession) {
        console.warn('Ignore call failed, call is not in current device');
        return;
      }
      await this._deps.webphone.ignore(webphoneSession.id);
      // hack for update sessions, then incoming call log page can re-render
      setTimeout(() => this.updateActiveSessions(), 0);
      this.clearCallControlBusyTimestamp();
      this.onCallIgnoreFunc?.(session.party.id);
    } catch (error: any /** TODO: confirm with instanceof */) {
      console.log('===ignore failed.', error);
    }
  }

  @track((that: ActiveCallControl) => [
    that._getTrackEventName(trackEvents.endAndAnswer),
  ])
  @proxify
  async answerAndEnd(telephonySessionId: string) {
    try {
      if (this.busy) return;
      this.setCallControlBusyTimestamp();
      const session = this._getSessionById(telephonySessionId);
      const currentActiveCalls = this._rcCallControl!.sessions.filter(
        (s) =>
          s.id !== telephonySessionId &&
          s.party?.status?.code === PartyStatusCode.answered ||
          (s.party?.direction === callDirection.outbound &&
              s.party?.status?.code === PartyStatusCode.proceeding),
      );
      for (const s of currentActiveCalls) {
        await s.drop();
      }
      const deviceId = this._deps.webphone?.device?.id;
      await session.answer({ deviceId });
      this._trackWebRTCCallAnswer();
      this.clearCallControlBusyTimestamp();
    } catch (error: any /** TODO: confirm with instanceof */) {
      console.log('answer and end fail.');
      console.error(error);
    }
  }

  async startWarmTransfer(transferNumber: string, telephonySessionId: string) {
    // todo handle error;
    const toNumber = await this.getValidPhoneNumber(transferNumber);
    return this.makeCall({
      toNumber,
      transferSessionId: telephonySessionId,
    });
  }

  @action
  setWarmTransferMapping(originalId: string, transferredId: string) {
    this.transferCallMapping = {
      ...this.transferCallMapping,
      [originalId]: {
        relatedTelephonySessionId: transferredId,
        isOriginal: true,
      },
      [transferredId]: {
        relatedTelephonySessionId: originalId,
        isOriginal: false,
      },
    };
  }

  @action
  cleanCurrentWarmTransferData() {
    const warmTransferSessionIds = Object.keys(this.transferCallMapping);
    const currentSessionIds = this.sessions.map(
      (session) => session.telephonySessionId,
    );
    const needRemovedIds = warmTransferSessionIds.filter(
      (telephonySessionId) => !currentSessionIds.includes(telephonySessionId),
    );

    if (needRemovedIds.length > 0) {
      const removeSessionSet = new Set(needRemovedIds);

      const filteredData = Object.fromEntries(
        Object.entries(this.transferCallMapping).filter(
          ([id, transferInfo]) =>
            !(
              removeSessionSet.has(id) ||
              removeSessionSet.has(transferInfo.relatedTelephonySessionId)
            ),
        ),
      );

      this.transferCallMapping = filteredData;
    }
  }

  @proxify
  async makeCall(params: ModuleMakeCallParams) {
    try {
      const result = await this._deps.webphone!.makeCall(params);
      if (result) {
        const webphoneSession = result as WebphoneSession;
        webphoneSession.on('progress', () => {
          if (
            webphoneSession.sessionId &&
            this.activeSessionId !== webphoneSession.sessionId
          ) {
            this.setActiveSessionId(webphoneSession.sessionId);
  
            const { transferSessionId } = params;
            if (transferSessionId) {
              this.setWarmTransferMapping(
                transferSessionId,
                webphoneSession.sessionId,
              );
            }
          }
        });
      }
      return result;
    } catch (error: any /** TODO: confirm with instanceof */) {
      console.log('make call fail.', error);
    }
  }

  getActiveSession(telephonySessionId: string | null) {
    if (!telephonySessionId) {
      return null;
    }
    return this.activeSessions[telephonySessionId];
  }

  getSession(telephonySessionId: string) {
    return this.sessions.find(
      (session) => session.telephonySessionId === telephonySessionId,
    );
  }

  public _findWebphoneSession(telephonySessionId: string) {
    return this._deps.webphone.sessions.find(
      (x) => x.partyData?.sessionId === telephonySessionId,
    );
  }

  @computed(({ activeSessionId, activeSessions }: ActiveCallControl) => [
    activeSessionId,
    activeSessions,
  ])
  get activeSession() {
    return this.getActiveSession(this.activeSessionId);
  }

  @computed(({ ringSessionId, activeSessions }: ActiveCallControl) => [
    ringSessionId,
    activeSessions,
  ])
  get ringSession() {
    return this.getActiveSession(this.ringSessionId);
  }

  @computed(({ sessions }: ActiveCallControl) => [sessions])
  get ringSessions() {
    if (!this.sessions) {
      return [];
    }
    return this.sessions.filter((session: ActiveCallControlSessionData) =>
      isProceeding(session),
    );
  }

  @computed((that: ActiveCallControl) => [that.sessions, that.timestamp])
  get activeSessions() {
    return this.sessions.reduce((accumulator, session) => {
      const { id } = session;
      const webphoneSession = this._findWebphoneSession(
        session.telephonySessionId,
      );
      accumulator[id!] = normalizeSession(session, webphoneSession);
      return accumulator;
    }, {} as Record<string, Partial<ActiveSession>>);
  }

  @computed((that: ActiveCallControl) => [that._deps.presence.calls])
  get sessionIdToTelephonySessionIdMapping() {
    return this._deps.presence.calls.reduce((accumulator, call) => {
      const { telephonySessionId, sessionId } = call;
      accumulator[sessionId!] = telephonySessionId!;
      return accumulator;
    }, {} as Record<string, string>);
  }

  /**
   * Mitigation strategy for avoiding 404/409 on call control endpoints.
   * This should gradually move towards per session controls rather than
   * a global busy timeout.
   */
  get busy() {
    return Date.now() - this.busyTimestamp < DEFAULT_BUSY_TIMEOUT;
  }

  // This should reflect on the app permissions setting in DWP
  get hasPermission() {
    return this._deps.appFeatures.hasCallControl;
  }

  get timeToRetry() {
    return this._timeToRetry;
  }

  get ttl() {
    return this._ttl;
  }

  get hasCallInRecording() {
    return this.sessions.some((session) => isRecording(session));
  }

  // TODO:refactor, use this.sessions instead
  get rcCallSessions() {
    return filter(
      (session) => isConnectedCall(session),
      this._rcCallControl?.sessions || [],
    );
  }

  get activeSessionId() {
    return this.data.activeSessionId;
  }

  get busyTimestamp() {
    return this.data.busyTimestamp;
  }

  get timestamp() {
    return this.data.timestamp;
  }

  get sessions() {
    return this.data.sessions;
  }

  get ringSessionId() {
    return this.data.ringSessionId;
  }

  @track(trackEvents.inboundWebRTCCallConnected)
  _trackWebRTCCallAnswer() {
    //
  }

  @track(trackEvents.dialpadOpen)
  dialpadOpenTrack() {
    //
  }

  @track(trackEvents.dialpadClose)
  dialpadCloseTrack() {
    //
  }

  @track((that: ActiveCallControl) => [
    that._getTrackEventName(trackEvents.clickTransfer),
  ])
  clickTransferTrack() {
    //
  }

  @track((that: ActiveCallControl) => [
    that._getTrackEventName(trackEvents.forward),
  ])
  clickForwardTrack() {
    //
  }

  @track((that: ActiveCallControl, path: string) => {
    return (analytics) => {
      // @ts-expect-error
      const target = analytics.getTrackTarget();
      return [
        trackEvents.openEntityDetailLink,
        { path: path || target.router },
      ];
    };
  })
  openEntityDetailLinkTrack(path: string) {
    //
  }

  @track((that: ActiveCallControl) => [
    that._getTrackEventName(trackEvents.switch),
  ])
  clickSwitchTrack() {
    //
  }

  private _getSessionById(sessionId: string) {
    const session = this._rcCallControl!.sessions.find((s) => s.id === sessionId);

    return session as TelephonySession;
  }
}
