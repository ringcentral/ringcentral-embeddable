import {
  ActivityMatcher,
  ContactMatcher,
} from '@ringcentral-integration/micro-contacts/src/app/services';
import { Toast } from '@ringcentral-integration/micro-core/src/app/services';
import {
  inject,
  injectable,
  optional,
  RcModule,
  RouterPlugin,
  watch,
} from '@ringcentral-integration/next-core';

import { Adapter } from '../../../app/services/Adapter/Adapter';
import type { RingCXCommandBridge } from '../../../app/services/Adapter/RingCXCommandBridge';
import {
  HostCallLogger,
  type CallLogger,
  type CompatibleCall,
} from '../../../app/services/CallLogger';
import {
  callLogSourceRegistry,
  RINGCX_CALL_LOG_SOURCE,
} from '../../../app/services/CallLogger/CallLogSourceRegistry';
import { RingCX } from '../../../app/services/RingCX';
import { t } from '../../../app/services/RingCX/i18n';
import { ThirdParty } from '../../../app/services/ThirdParty';
import type { RingCXAdapterBridge as RingCXAdapterBridgeContract } from '../../interfaces/RingCXAdapterBridge.interface';
import {
  formatRingCXCall,
  isRingCXHistoryId,
  ringCXContactPhone,
  ringCXLiveCallId,
  ringCXLogId,
} from '../../lib/formatRingCXCall';
import type {
  FormatRingCXCallInput,
  RingCXNormalizedCall,
} from '../../lib/formatRingCXCall';
import { CxActiveCallControl } from '../CxActiveCallControl';
import { CxAgentSession } from '../CxAgentSession';
import { CxAuth } from '../CxAuth';
import { CxCall } from '../CxCall';
import { CxCallDisposition } from '../CxCallDisposition';
import { CxCallHistory } from '../CxCallHistory';
import { parseHistoryCallId } from '../CxCallHistory/formatHistoryCall';
import type { FormattedCall } from '../CxCallHistory/CxCallHistory.interface';
import { CxCallMonitor } from '../CxCallMonitor';
import { CxClient } from '../CxClient';
import { CxIntegratedSoftphone } from '../CxIntegratedSoftphone';
import { CxLeads } from '../CxLeads';
import type { Lead } from '../CxLeads';
import { CxPresence } from '../CxPresence';
import { CxWorkingState } from '../CxWorkingState';
import { shouldShowDispositionSubmitStep } from '../../utils/shouldShowDispositionSubmitStep';
import type { DispositionStepOptions } from '../../utils/shouldShowDispositionSubmitStep';

interface LogCallInput {
  call: unknown;
  note?: string;
  triggerType: string;
  redirect?: boolean;
}

interface DisposedExtra {
  dispositionId?: string | null;
  dispositionName?: string;
  notes?: string;
}

const HISTORY_LOG_SOURCE = 'ringcx';

/**
 * Translates the RingCX call lifecycle into the host Adapter / ThirdParty
 * protocol. This is the only CX module that talks to those host services.
 */
@injectable({
  name: 'RingCXAdapterBridge',
})
export class RingCXAdapterBridge
  extends RcModule
  implements RingCXAdapterBridgeContract, RingCXCommandBridge
{
  private _unregisterLeadEvents?: () => void;

  constructor(
    private readonly _adapter: Adapter,
    private readonly _thirdParty: ThirdParty,
    @inject(HostCallLogger) private readonly _callLogger: CallLogger,
    private readonly _router: RouterPlugin,
    private readonly _toast: Toast,
    private readonly _ringCX: RingCX,
    private readonly _cxAuth: CxAuth,
    private readonly _cxAgentSession: CxAgentSession,
    private readonly _cxCall: CxCall,
    private readonly _cxCallMonitor: CxCallMonitor,
    private readonly _cxCallDisposition: CxCallDisposition,
    private readonly _cxCallHistory: CxCallHistory,
    private readonly _cxClient: CxClient,
    private readonly _cxPresence: CxPresence,
    private readonly _cxWorkingState: CxWorkingState,
    private readonly _cxLeads: CxLeads,
    private readonly _cxActiveCallControl: CxActiveCallControl,
    private readonly _cxIntegratedSoftphone: CxIntegratedSoftphone,
    @optional() private readonly _contactMatcher?: ContactMatcher,
    @optional() private readonly _activityMatcher?: ActivityMatcher,
    @optional('CxDispositionViewOptions')
    private readonly _dispositionOptions?: DispositionStepOptions,
  ) {
    super();
    this._registerCallLogSource();
  }

  private _registerCallLogSource(): void {
    callLogSourceRegistry.register({
      source: RINGCX_CALL_LOG_SOURCE,
      getCallForLog: (id) => this.getCallForLog(id),
    });
  }

  override onInit(): void {
    this._registerCallLogSource();
  }

  override onInitOnce(): void {
    watch(
      this,
      () => this._ringCX.stage,
      () => {
        this._adapter.notifyRingCXAgentSession(this.getAgentSessionSnapshot());
      },
    );
    watch(
      this,
      () =>
        [
          this._cxWorkingState.workingState.agentState,
          this._cxWorkingState.isPendingDisposition,
        ] as const,
      ([state, pendingDisposition]) => {
        this._adapter.notifyRingCXAgentState({
          state,
          pendingDisposition,
        });
      },
    );
    this._unregisterLeadEvents = this._cxLeads.onLeadEvent((event) => {
      this._adapter.notifyRingCXLead(event);
    });
    this._adapter.notifyRingCXAgentSession(this.getAgentSessionSnapshot());
  }

  override async onReset(): Promise<void> {
    this._unregisterLeadEvents?.();
    this._unregisterLeadEvents = undefined;
    callLogSourceRegistry.unregister(RINGCX_CALL_LOG_SOURCE);
  }

  onRingCall(call: unknown): void {
    const formatted = this._format(call);
    if (!formatted) {
      return;
    }
    this._adapter.notifyRingCXCall('ring', formatted.call);
  }

  onNewCall(call: unknown): void {
    const formatted = this._format(call);
    if (!formatted) {
      return;
    }
    this._adapter.notifyRingCXCall('start', formatted.call);
  }

  onEndCall(call: unknown): void {
    const formatted = this._format(call);
    if (!formatted) {
      return;
    }
    this._adapter.notifyRingCXCall('end', formatted.call);
  }

  onSoftphoneStatus(status: string): void {
    this._adapter.notifyRingCXSoftphoneStatus(status);
  }

  onDisposed(call: unknown, extra?: DisposedExtra): void {
    const formatted = this._format(call, extra);
    if (!formatted) {
      return;
    }
    this._adapter.notifyRingCXCall('disposed', formatted.call);
  }

  /**
   * Log a call that ended without a disposition step.
   * Returns true when the caller should open the host log page.
   */
  async logEndedCall(call: unknown): Promise<boolean> {
    if (shouldShowDispositionSubmitStep(
      call as { callType?: string; outdialDispositions?: { dispositions?: unknown[] } },
      this._dispositionOptions,
    )) {
      return false;
    }
    const formatted = this._format(call);
    if (!formatted || !this._callLogger.ready) {
      return false;
    }
    if (this.shouldOpenLogPage) {
      return true;
    }
    if (!this._callLogger.autoLog) {
      return false;
    }
    await this.logCall({
      call: formatted.call,
      note: formatted.call.ringcx.notes,
      triggerType: 'callDisposition',
      redirect: false,
    });
    return false;
  }

  /**
   * Disposition has already succeeded. A log failure must not undo that.
   * Returns true when the host log page was opened.
   */
  async logAfterDisposition(input: {
    call: unknown;
    note?: string;
    callId: string;
    extra?: DisposedExtra;
  }): Promise<boolean> {
    this.onDisposed(input.call, {
      ...input.extra,
      notes: input.note ?? input.extra?.notes,
    });
    if (!this._callLogger.ready) {
      return false;
    }
    if (this.shouldOpenLogPage) {
      return true;
    }
    await this.logCall({
      call: input.call,
      note: input.note,
      triggerType: 'callDisposition',
      redirect: false,
    });
    return false;
  }

  get shouldOpenLogPage(): boolean {
    return this._thirdParty.callLoggerRegistered && this._thirdParty.showLogModal;
  }

  get leadViewerRegistered(): boolean {
    return this._thirdParty.leadViewerRegistered;
  }

  async openLogPage(callId: string): Promise<void> {
    await this._router.push(`/log/call/${callId}?source=${HISTORY_LOG_SOURCE}`);
  }

  async logCall({
    call,
    note,
    triggerType,
    redirect = false,
  }: LogCallInput): Promise<void> {
    const formatted = this._format(call, { notes: note });
    if (!formatted) {
      return;
    }
    if (note) {
      formatted.call.ringcx.notes = note;
    }
    try {
      await this._callLogger.logCall({
        call: this._toLoggerCall(formatted),
        contact: undefined,
        note,
        redirect,
        triggerType,
      });
    } catch (error) {
      this.logger.error('RingCX call log failed', error);
      this._toast.danger({ message: t('callLogFailed') });
    }
  }

  async logFromHistory(
    call: FormattedCall,
    actionType: string,
  ): Promise<void> {
    const id = call.localCallId || call.id;
    const compatible = await this.getCallForLog(id);
    if (!compatible) {
      return;
    }
    if (this.shouldOpenLogPage && actionType !== 'viewLog') {
      await this.openLogPage(compatible.sessionId || id);
      return;
    }
    const logged = Boolean(
      call.activityMatches?.some(
        (activity) => activity.type && activity.type !== 'status',
      ),
    );
    await this.logCall({
      call: compatible,
      note: compatible.ringcx?.notes,
      redirect: true,
      triggerType:
        actionType === 'viewLog' ? 'viewLog' : logged ? 'editLog' : 'createLog',
    });
  }

  async getCallForLog(id: string): Promise<CompatibleCall | null> {
    console.log('[RingCXAdapterBridge] getCallForLog:', id);
    const raw = this._findRawCall(id);
    if (!raw) {
      console.warn('[RingCXAdapterBridge] getCallForLog: _findRawCall returned undefined for', id);
      return null;
    }
    const formatted = this._format(raw);
    if (!formatted) {
      console.warn('[RingCXAdapterBridge] getCallForLog: _format returned null for', raw);
      return null;
    }
    const pageCall = this._toPageCall(formatted, id);
    console.log('[RingCXAdapterBridge] getCallForLog resolved:', { id, pageCall });
    return pageCall;
  }

  async viewLead(lead: Lead | unknown): Promise<void> {
    await this._thirdParty.viewLead({
      lead,
      agentId: this._cxAuth.agentId,
    });
  }

  async dialout(phoneNumber: string, callerId?: string): Promise<void> {
    if (callerId) {
      await this._cxCall.setFormGroup({ dialoutCallerId: callerId });
      await this._cxCall.saveForm();
    }
    await this._cxCall.dialout(phoneNumber);
  }

  async controlCall(action: string, callId?: string): Promise<void> {
    const sessionId = sessionIdFromCallId(callId);
    switch (action) {
      case 'answer':
        await this._cxIntegratedSoftphone.sipAnswer();
        break;
      case 'reject':
        await this._cxActiveCallControl.reject();
        if (sessionId) {
          await this._cxActiveCallControl.hangUp(sessionId);
        }
        break;
      case 'hangup':
        await this._cxActiveCallControl.hangUp(sessionId || '1');
        break;
      case 'hold':
        await this._cxActiveCallControl.hold();
        break;
      case 'unhold':
        await this._cxActiveCallControl.unhold();
        break;
      case 'mute':
        await this._cxActiveCallControl.mute();
        break;
      case 'unmute':
        await this._cxActiveCallControl.unmute();
        break;
      case 'record':
        await this._cxActiveCallControl.record();
        break;
      case 'stopRecord':
        await this._cxActiveCallControl.stopRecord();
        break;
      default:
        this.logger.warn('Unsupported RingCX call action', action);
    }
  }

  async setAgentState(state: string): Promise<void> {
    this._cxWorkingState.changeWorkingState({
      agentState: state,
      agentAuxState: '',
    });
  }

  async dialLead(lead: unknown, destination?: string): Promise<void> {
    if (!destination) {
      return;
    }
    await this._cxLeads.dialLead(lead as Lead, destination);
  }

  getAgentSessionSnapshot() {
    const agents = this._cxAuth.authenticateResponse?.agents || [];
    const agent = agents.find((item) => item.agentId === this._cxAuth.agentId);
    return {
      status: this._ringCX.stage,
      agent: agent
        ? {
            agentId: agent.agentId,
            username: agent.username,
            firstName: agent.firstName,
            lastName: agent.lastName,
          }
        : this._cxAuth.agentId
          ? { agentId: this._cxAuth.agentId }
          : undefined,
      session: {
        loginType: String(this._cxAgentSession.loginType),
        dialGroupId: this._cxAgentSession.dialGroupId,
        skillProfileId: this._cxAgentSession.selectedSkillProfileId,
        inboundQueueIds: this._cxAgentSession.selectedInboundQueueIds,
        autoAnswer: this._cxAgentSession.autoAnswer,
      },
      permissions: {
        allowLoginUpdates: agent?.allowLoginUpdates,
      },
    };
  }

  getDispositions(callId?: string) {
    const id = callId || this._cxCall.activityCallId;
    const raw = id ? this._findRawCall(id) : undefined;
    const formatted = raw ? this._format(raw) : null;
    return {
      callId: id || undefined,
      dispositions: formatted?.call.ringcx.dispositions || [],
    };
  }

  private _format(
    call: unknown,
    extra?: DisposedExtra,
  ): { call: RingCXNormalizedCall; startTimeMs?: number } | null {
    if (!call || typeof call !== 'object') {
      return null;
    }
    const input = call as FormatRingCXCallInput;
    const sessionId = input.session?.sessionId || input.sessionId;
    const id = ringCXLogId({
      id: input.id,
      localCallId: input.localCallId,
      uii: input.uii,
      sessionId,
    });
    const phone = ringCXContactPhone(input);
    const contactMatches =
      input.contactMatches ||
      (phone
        ? (this._contactMatcher?.dataMapping?.[phone] as FormatRingCXCallInput['contactMatches'])
        : undefined);
    const saved = id
      ? this._cxCallDisposition.getDisposition(id)
      : undefined;
    return formatRingCXCall({
      ...input,
      contactMatches,
      notes: extra?.notes || saved?.notes || input.notes,
      disposition:
        extra?.dispositionId || extra?.dispositionName
          ? {
              id: extra.dispositionId || extra.dispositionName || '',
              name: extra.dispositionName || extra.dispositionId || '',
            }
          : input.disposition,
      dialGroup: input.dialGroup || this._dialGroup(),
      skillProfileId:
        input.skillProfileId || this._cxAgentSession.selectedSkillProfileId,
      agentId: input.agentId || this._cxAuth.agentId,
    });
  }

  private _dialGroup(): { id: string; name: string } | undefined {
    const id = this._cxAgentSession.dialGroupId;
    if (!id) {
      return undefined;
    }
    const group = this._cxAgentSession.dialGroups.find(
      (item) => item.groupId === id,
    );
    return { id, name: group?.groupName || id };
  }

  private _findRawCall(id: string): FormatRingCXCallInput | undefined {
    console.log('[RingCXAdapterBridge] _findRawCall looking for id:', id);
    const mapped = this._cxCallMonitor.callsMapping[id] as unknown as
      | FormatRingCXCallInput
      | undefined;
    if (mapped) {
      console.log('[RingCXAdapterBridge] _findRawCall found in callsMapping:', id);
      return {
        ...mapped,
        id: mapped.session
          ? this._cxClient.encodeUii(mapped.session)
          : id,
        localCallId: mapped.session
          ? this._cxClient.encodeUii(mapped.session)
          : id,
      };
    }
    const historySegmentId = isRingCXHistoryId(id)
      ? parseHistoryCallId(id).segmentId
      : undefined;
    const history = this._cxCallHistory.formattedCalls.find(
      (call) =>
        call.id === id ||
        call.localCallId === id ||
        call.sessionId === id ||
        call.segmentId === id ||
        (historySegmentId &&
          (call.segmentId === historySegmentId ||
            call.sessionId === historySegmentId)),
    );
    if (history) {
      console.log('[RingCXAdapterBridge] _findRawCall found in history:', { id, historyId: history.id });
      return historyCallInput(history);
    }
    if (isRingCXHistoryId(id)) {
      const { segmentId, uii } = parseHistoryCallId(id);
      console.log('[RingCXAdapterBridge] _findRawCall constructed from history id:', { id, segmentId, uii });
      return {
        id,
        segmentId,
        sessionId: segmentId,
        uii,
        localCallId: id,
        agentId: this._cxAuth.agentId,
      };
    }
    if (!isRingCXHistoryId(id) && id.includes('$')) {
      const [uii, sessionId] = id.split('$');
      console.log('[RingCXAdapterBridge] _findRawCall constructed from live id:', { id, uii, sessionId });
      return {
        id,
        uii,
        sessionId,
        localCallId: ringCXLiveCallId(uii, sessionId),
        agentId: this._cxAuth.agentId,
      };
    }
    console.warn('[RingCXAdapterBridge] _findRawCall could not resolve id:', id);
    return undefined;
  }

  private _toLoggerCall(
    formatted: { call: RingCXNormalizedCall; startTimeMs?: number },
  ): CompatibleCall {
    return this._toPageCall(formatted, formatted.call.id);
  }

  private _toPageCall(
    formatted: { call: RingCXNormalizedCall; startTimeMs?: number },
    id: string,
  ): CompatibleCall {
    const phone =
      formatted.call.direction === 'Outbound'
        ? formatted.call.to.phoneNumber
        : formatted.call.from.phoneNumber;
    const contactMatches =
      (phone
        ? this._contactMatcher?.dataMapping?.[phone]
        : undefined) || formatted.call.contactMatches || [];
    const activityMatches =
      (this._activityMatcher?.dataMapping?.[id] as unknown as CompatibleCall['activityMatches']) ||
      [];
    const recordingUrl = formatted.call.ringcx.recordingUrl;
    const outbound = formatted.call.direction === 'Outbound';
    return {
      ...formatted.call,
      startTime: formatted.startTimeMs || Date.parse(formatted.call.startTime),
      fromMatches: outbound ? [] : contactMatches,
      toMatches: outbound ? contactMatches : [],
      activityMatches,
      recording: recordingUrl
        ? {
            contentUri: recordingUrl,
            uri: recordingUrl,
            link: recordingUrl,
          }
        : null,
    } as unknown as CompatibleCall;
  }
}

function sessionIdFromCallId(callId?: string): string {
  if (!callId || isRingCXHistoryId(callId)) {
    return '';
  }
  const separator = callId.indexOf('$');
  if (separator < 0) {
    return '';
  }
  return callId.slice(separator + 1);
}

function historyCallInput(call: FormattedCall): FormatRingCXCallInput {
  const outbound = call.direction === 'Outbound';
  return {
    id: call.id,
    localCallId: call.localCallId,
    uii: call.uii,
    sessionId: call.sessionId,
    segmentId: call.segmentId,
    direction: call.direction,
    callType: outbound ? 'OUTBOUND' : 'INBOUND',
    agentId: undefined,
    from: call.from,
    to: call.to,
    fromName: call.fromName,
    toName: call.toName,
    startTime: call.startTime,
    durationMs: call.durationMs,
    recordingUrl: call.recordingUrl,
    result: call.result,
    termReason: call.termReason,
    disposition: call.disposition,
    queueName: call.queueName,
    contactMatches: outbound ? call.toMatches : call.fromMatches,
    ani: outbound ? call.to.phoneNumber : call.from.phoneNumber,
    dnis: outbound ? call.from.phoneNumber : call.to.phoneNumber,
  };
}
