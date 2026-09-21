import { Toast } from '@ringcentral-integration/micro-core/src/app/services';
import {
  action,
  computed,
  injectable,
  optional,
  RcModule,
  state,
  storage,
  StoragePlugin,
  PortManager,
  delegate,
  ModuleRef,
} from '@ringcentral-integration/next-core';
import { EventEmitter } from 'events';
import { Beforeunload } from '@ringcentral-integration/micro-core/src/app/services';
import type { DialoutStatusesType } from '../../enums';
import { callStatus, dialoutStatuses, messageTypes } from '../../enums';
import { t } from './i18n';
import { CxCallbackTypes } from '../CxClient/enums';
import type {
  CxAddSessionNotification,
  CxBaseCall,
  CxDropSessionNotification,
  CxEndedCall,
  CxHoldResponse,
  CxOffhookInitResponse,
  CxOffhookTermResponse,
  CxEarlyUiiResponse,
} from '../CxClient/interfaces';
import { CxClient } from '../CxClient';
import { CxSubscription } from '../CxSubscription';
import { CxCallDataSource } from '../CxCallDataSource';
import type { CxPresenceOptions, CxAgentRecording } from './CxPresence.interface';
import { track } from '../Analytics/track';
import { trackEvents } from '../../lib/trackEvents';
import { CxAgentSession } from '../CxAgentSession';
import { resolveEndedCallSessions } from '../../utils/resolveEndedCallSessions';

/**
 * CxPresence module - Call presence and offhook state management
 * Handles call tracking, offhook state, dialout status, and call events.
 * Delegates call data storage and mutations to CxCallDataSource.
 */
@injectable({
  name: 'CxPresence',
})
class CxPresence extends RcModule {
  beforeunloadHandler = () => {
    if (this.portManager.isMainTab) {
      return false;
    }
    return true;
  };
  evPresenceEvents = new EventEmitter();
  showOffHookInitError = true;
  private _oldCalls: CxBaseCall[] = [];

  /**
   * Calls whose end has already been announced.
   *
   * `callsMapping` keeps a call after it ends, so a late END-CALL for it still
   * resolves to a known call, and the ended-call fallback can name a call that
   * was reported earlier. Announcing the same end twice sends the agent back to
   * a disposition page they already left.
   */
  private _endedCallIds = new Set<string>();

  constructor(
    private cxClient: CxClient,
    private cxSubscription: CxSubscription,
    private cxCallDataSource: CxCallDataSource,
    private toast: Toast,
    private beforeunload: Beforeunload,
    private storagePlugin: StoragePlugin,
    private portManager: PortManager,
    private moduleRef: ModuleRef,
    @optional('CxPresenceOptions') private evPresenceOptions?: CxPresenceOptions,
  ) {
    super();
    this.storagePlugin.enable(this);
    if (this.portManager.shared) {
      this.portManager.onServer(() => {
        this.initialize();
      });
    } else {
      this.initialize();
    }
  }

  // --- Persisted offhook / dialout state ---

  @storage
  @state
  currentCallUii = '';

  @storage
  @state
  isOffhook = false;

  @storage
  @state
  isManualOffhook = false;

  @storage
  @state
  isOffhooking = false;

  @storage
  @state
  dialoutStatus: DialoutStatusesType = dialoutStatuses.idle;

  // --- Delegated call data accessors (from CxCallDataSource) ---

  /** Current agent ongoing session call IDs */
  get callIds(): string[] {
    return this.cxCallDataSource.callIds;
  }

  /** Other agent ongoing session call IDs */
  get otherCallIds(): string[] {
    return this.cxCallDataSource.otherCallIds;
  }

  /** Ended call log IDs */
  get callLogsIds(): string[] {
    return this.cxCallDataSource.callLogsIds;
  }

  /** Call data mapping (keyed by encoded UII) */
  get callsMapping(): Record<string, CxBaseCall> {
    return this.cxCallDataSource.callsMapping;
  }

  /** Raw call data mapping without session info (keyed by raw UII) */
  get rawCallsMapping(): Record<string, CxBaseCall> {
    return this.cxCallDataSource.rawCallsMapping;
  }

  // --- Computed call lists ---

  /**
   * Check if agent is currently on a call
   */
  get isOnCall(): boolean {
    return this.calls.length > 0;
  }

  @computed((that: CxPresence) => [that.cxCallDataSource.data])
  get calls(): CxBaseCall[] {
    return this.callIds
      .map((id) => this.callsMapping[id])
      .filter((call) => !!call);
  }

  @computed((that: CxPresence) => [that.cxCallDataSource.data])
  get otherCalls(): CxBaseCall[] {
    return this.otherCallIds.map((id) => this.callsMapping[id]);
  }

  @computed((that: CxPresence) => [that.cxCallDataSource.data])
  get callLogs(): CxBaseCall[] {
    return this.callLogsIds.map((id) => this.callsMapping[id]);
  }

  get isCallConnected(): boolean {
    return this.dialoutStatus === dialoutStatuses.callConnected;
  }

  // --- Offhook / dialout actions ---

  @action
  setCurrentCallUii(uii: string) {
    this.currentCallUii = uii;
  }

  @action
  setDialoutStatus(status: DialoutStatusesType) {
    if (this.dialoutStatus !== status) {
      this.dialoutStatus = status;
    }
  }

  @action
  _setOffhookInit() {
    this.isOffhooking = false;
    this.isOffhook = true;
  }

  @delegate('server')
  async setOffhookInit() {
    this._setOffhookInit();
  }

  @action
  _setOffhookTerm() {
    this.isOffhooking = false;
    this.isOffhook = false;
    this.isManualOffhook = false;
  }

  @delegate('server')
  async setOffhookTerm() {
    this._setOffhookTerm();
  }

  @action
  _setIsManualOffhook(isManualOffhook: boolean) {
    this.isManualOffhook = isManualOffhook;
  }

  @delegate('server')
  async setIsManualOffhook(isManualOffhook: boolean) {
    this._setIsManualOffhook(isManualOffhook);
  }

  @action
  _setOffhook(status: boolean) {
    this.isOffhook = status;
    this._checkBeforeunload();
  }

  @delegate('server')
  async setOffhook(status: boolean) {
    this._setOffhook(status);
  }

  @action
  _setOffhooking(offhooking: boolean) {
    this.isOffhooking = offhooking;
  }

  @delegate('server')
  async setOffhooking(offhooking: boolean) {
    this._setOffhooking(offhooking);
  }

  // --- Delegated call data mutations (to CxCallDataSource) ---

  /**
   * Store raw call data (enriched with timestamp, gate, agentRecording).
   * Call is added to callIds/callsMapping when ADD_SESSION arrives.
   */
  @track((that: CxPresence, call: CxBaseCall) => [
    call.callType === 'INBOUND'
      ? trackEvents.callInboundCallConnected
      : trackEvents.outboundCallConnected,
    {
      recordingSetting: that.getRecordingSettings(call.agentRecording as unknown as CxAgentRecording),
      voiceConnection: that.moduleRef.get(CxAgentSession)?.loginType,
      isOffhook: that.isOffhook,
      isOffhooking: that.isOffhooking,
    },
  ])
  async addNewCall(call: CxBaseCall) {
    await this.cxCallDataSource.addNewCall(call);
  }

  /**
   * Add session, separating current agent vs other sessions.
   * Merges raw call data with session info into callsMapping.
   */
  async addNewSession(session: CxAddSessionNotification) {
    this._endedCallIds.delete(this.cxClient.encodeUii(session));
    await this.cxCallDataSource.addNewSession(session);
  }

  /**
   * Drop a session from otherCallIds (other agents' sessions).
   */
  async dropSession(dropSession: CxDropSessionNotification) {
    await this.cxCallDataSource.dropSession(dropSession);
  }

  /**
   * Remove ended call from callIds/otherCallIds, move to callLogsIds,
   * and store endedCall data on callsMapping entry.
   */
  async removeEndedCall(endedCall: CxEndedCall) {
    await this.cxCallDataSource.removeEndedCall(endedCall);
  }

  /**
   * Set call hold status (isHold) on callsMapping entry.
   */
  async setCallHoldStatus(res: CxHoldResponse) {
    await this.cxCallDataSource.setCallHoldStatus(res);
  }

  /**
   * Clear active call IDs (callIds and otherCallIds).
   * Preserves callsMapping for call log data.
   */
  async clearCalls() {
    this._oldCalls = [];
    this._endedCallIds.clear();
    await this.cxCallDataSource.clearCalls();
  }

  /**
   * Check if calls are limited
   */
  get callsLimited(): boolean {
    return this.cxCallDataSource.callsLimited;
  }

  /**
   * Limit the number of call logs (max 250, 7-day retention)
   */
  async limitCalls() {
    await this.cxCallDataSource.limitCalls();
  }

  /**
   * Resolve the local call id for a server-side segment id, so server call
   * history rows can be joined to locally tracked calls.
   */
  getCallIdBySegmentId(segmentId: string): string | undefined {
    return this.cxCallDataSource.getCallIdBySegmentId(segmentId);
  }

  // --- Recording settings ---

  getRecordingSettings(record: CxAgentRecording): string {
    let recordingSetting = '';
    if (record.agentRecording) {
      if (record.default === 'ON') {
        if (record.pause) {
          recordingSetting = 'Yes - Record Call (Agent Pause)';
        } else {
          recordingSetting = 'Agent Triggered (Default: Record)';
        }
      } else {
        recordingSetting = "Agent Triggered (Default: Don't Record)";
      }
    } else if (!record.agentRecording) {
      if (record.default === 'ON') {
        recordingSetting = 'Yes - Record Full Call';
      } else {
        recordingSetting = "No - Don't Record Call";
      }
    }
    return recordingSetting;
  }

  // --- Initialization and subscriptions ---

  initialize() {
    this._bindSubscription();
  }

  private _bindSubscription() {
    this.cxSubscription
      .subscribe(
        CxCallbackTypes.OFFHOOK_INIT,
        async (data: CxOffhookInitResponse) => {
          this.logger.info('OFFHOOK_INIT~~', data);
          this.evPresenceEvents.emit(CxCallbackTypes.OFFHOOK_INIT, data);
          if (data.status === 'OK') {
            await this.setOffhookInit();
            this._checkBeforeunload();
          } else {
            if (this.showOffHookInitError) {
              this.toast.danger({
                message: t(messageTypes.OFFHOOK_INIT_ERROR),
              });
            }
            await this.setOffhookTerm();
            this._checkBeforeunload();
            this.showOffHookInitError = true;
          }
        },
      )
      .subscribe(CxCallbackTypes.EARLY_UII, (data: CxEarlyUiiResponse) => {
        if (data.status === 'OK') {
          this.setCurrentCallUii(data.uii);
        }
      })
      .subscribe(
        CxCallbackTypes.OFFHOOK_TERM,
        async (data: CxOffhookTermResponse) => {
          // Fix: also handle 'Offhook terminated' message on logout
          if (data.status === 'OK' || data.message === 'Offhook terminated') {
            await this.setOffhookTerm();
            this._checkBeforeunload();
          } else {
            this.toast.danger({
              message: t(messageTypes.OFFHOOK_TERM_ERROR),
            });
            console.error(data);
          }
        },
      )
      .subscribe(CxCallbackTypes.ADD_SESSION, async (data: CxAddSessionNotification) => {
        this.logger.info('ADD_SESSION~~', data.status);
        if (data.status === 'OK') {
          await this.addNewSession(data);
          // Emit RINGING on evPresenceEvents for the public event API
          this.evPresenceEvents.emit(callStatus.RINGING, data);
          await this._checkCallStateChange();
        } else {
          this.toast.danger({
            message: t(messageTypes.ADD_SESSION_ERROR),
          });
        }
      })
      .subscribe(CxCallbackTypes.DROP_SESSION, async (data: any) => {
        if (data.status === 'OK') {
          await this.dropSession(data);
        } else {
          this.toast.danger({
            message: t(messageTypes.DROP_SESSION_ERROR),
          });
        }
      })
      .subscribe(CxCallbackTypes.HOLD, async (data: any) => {
        if (data.status === 'OK') {
          await this.setCallHoldStatus(data);
        } else {
          this.toast.danger({
            message: t(messageTypes.HOLD_ERROR),
          });
        }
      })
      .subscribe(CxCallbackTypes.NEW_CALL, async (data: CxBaseCall) => {
        await this.addNewCall(data);
      })
      .subscribe(CxCallbackTypes.END_CALL, async (data: CxEndedCall) => {
        // A reconnect that finds the server off the call makes the SDK
        // synthesise an END-CALL carrying only the uii, so the sessions it
        // ends have to be recovered from the calls actually held.
        const endedCalls = resolveEndedCallSessions({
          endedCall: data,
          callIds: this.callIds,
        })
          .map((sessionId) => ({ ...data, sessionId }))
          .filter((call) => !!this.callsMapping[this.cxClient.encodeUii(call)]);
        if (!endedCalls.length) return;
        if (!this.isManualOffhook) {
          this.cxClient.offhookTerm();
        }
        for (const endedCall of endedCalls) {
          const id = this.cxClient.encodeUii(endedCall);
          await this.removeEndedCall(endedCall);
          await this._checkCallStateChange(this.callsMapping[id]);
        }
      });
  }

  // --- Beforeunload ---

  private _checkBeforeunload() {
    if (!this.portManager.isMainTab) {
      return;
    }
    if (this.isOffhook) {
      this.beforeunload.add(this.beforeunloadHandler);
    } else {
      this.beforeunload.remove(this.beforeunloadHandler);
    }
  }

  // --- Utility methods ---

  /**
   * Get main call by UII
   */
  getMainCall(uii: string): CxBaseCall | undefined {
    const id = this.cxClient.getMainId(uii);
    return this.callsMapping[id];
  }

  /**
   * Get call ID from session info
   */
  getCallId({ uii, sessionId }: { uii?: string; sessionId?: string }): string {
    return this.cxClient.encodeUii({ uii, sessionId });
  }

  /**
   * Get active call list for a given call ID
   */
  getActiveCallList(
    callIds: string[],
    otherCallIds: string[],
    callsMapping: Record<string, CxBaseCall>,
    id: string,
  ): CxBaseCall[] {
    const uii = this.cxClient.decodeUii(id);
    const mainUii = this.cxClient.getMainId(uii);
    if (!otherCallIds.includes(mainUii) || !callIds.includes(id)) return [];
    const currentOtherCallIds = otherCallIds.filter(
      (callId) => callId.includes(uii) && callId !== mainUii,
    );
    const currentCallIds = [mainUii, id, ...currentOtherCallIds];
    return currentCallIds.map((callId) => callsMapping[callId]).filter(Boolean);
  }

  // --- Event registration ---

  /**
   * Register callback for call ringing events
   */
  onCallRinging(callback: (session?: CxAddSessionNotification) => void): this {
    this.evPresenceEvents.on(callStatus.RINGING, callback);
    return this;
  }

  /**
   * Register callback for call answered events
   */
  onCallAnswered(callback: (currentCall?: CxBaseCall) => void): this {
    this.evPresenceEvents.on(callStatus.ANSWERED, callback);
    return this;
  }

  /**
   * Register callback for call ended events
   */
  onCallEnded(callback: (currentCall?: CxBaseCall) => void): this {
    this.evPresenceEvents.on(callStatus.ENDED, callback);
    return this;
  }

  /**
   * Check and emit call state change events (ANSWERED / ENDED)
   */
  private async _checkCallStateChange(endedCall?: CxBaseCall): Promise<void> {
    const currentCalls = this.calls;
    if (currentCalls.length > this._oldCalls.length) {
      const currentCall = currentCalls[0];
      const mainCall = this.getMainCall(currentCall.uii);
      if (currentCall && mainCall) {
        this._oldCalls = currentCalls;
        this.setDialoutStatus(dialoutStatuses.callConnected);
        this.evPresenceEvents.emit(callStatus.ANSWERED, currentCall);
      } else {
        await this.clearCalls();
      }
    } else if (currentCalls.length < this._oldCalls.length) {
      const call = endedCall ?? this._oldCalls[0];
      this._oldCalls = currentCalls;
      const endedCallId = call?.session
        ? this.cxClient.encodeUii(call.session)
        : '';
      if (endedCallId && this._endedCallIds.has(endedCallId)) {
        this.logger.info('call end already announced~~', endedCallId);
        return;
      }
      if (endedCallId) {
        this._endedCallIds.add(endedCallId);
      }
      this.evPresenceEvents.emit(callStatus.ENDED, call);
    }
  }

  /**
   * Bind beforeunload handler
   */
  bindBeforeunload(): void {
    this.beforeunload.add(this.beforeunloadHandler);
  }

  /**
   * Remove beforeunload handler
   */
  removeBeforeunload(): void {
    this.beforeunload.remove(this.beforeunloadHandler);
  }
}

export { CxPresence };
