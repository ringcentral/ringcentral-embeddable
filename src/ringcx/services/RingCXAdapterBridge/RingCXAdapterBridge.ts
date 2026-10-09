import {
  ActivityMatcher,
  ContactMatcher,
} from '@ringcentral-integration/micro-contacts/src/app/services';
import { Toast } from '@ringcentral-integration/micro-core/src/app/services';
import {
  inject,
  injectable,
  optional,
  PortManager,
  RcModule,
  RouterPlugin,
  watch,
} from '@ringcentral-integration/next-core';

import { Adapter } from '../../../app/services/Adapter/Adapter';
import type {
  RingCXCallControlOptions,
  RingCXCommandBridge,
} from '../../../app/services/Adapter/RingCXCommandBridge';
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
import { hasLoggedCallActivity } from '../../../app/views/CallHistoryView/CallHistoryLogAction';
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
import type { CxLeadEvent, Lead } from '../CxLeads';
import { CxPresence } from '../CxPresence';
import { CxWorkingState } from '../CxWorkingState';
import { shouldShowDispositionSubmitStep } from '../../utils/shouldShowDispositionSubmitStep';
import type { DispositionStepOptions } from '../../utils/shouldShowDispositionSubmitStep';

type CallLogContact = Parameters<CallLogger['logCall']>[0]['contact'];

interface LogCallInput {
  call: unknown;
  /** Contact to log against. Defaults to the only contact match, if any. */
  contact?: CallLogContact;
  note?: string;
  summary?: string;
  triggerType: string;
  redirect?: boolean;
}

interface DisposedExtra {
  dispositionId?: string | null;
  dispositionName?: string;
  notes?: string;
  summary?: string;
}

const HISTORY_LOG_SOURCE = 'ringcx';
const MAIN_SESSION_ID = '1';

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
  private _unbindHostNotifications?: () => void;

  /**
   * Calls (by decoded uii) that already posted ring or start. RingCX adds a
   * session per leg, and each one reports ringing, so this keeps
   * `rc-call-ring-notify` to one per call and never after it started.
   */
  private readonly _announcedRingUiis = new Set<string>();

  constructor(
    private readonly _adapter: Adapter,
    private readonly _thirdParty: ThirdParty,
    @inject(HostCallLogger) private readonly _callLogger: CallLogger,
    private readonly _router: RouterPlugin,
    private readonly _portManager: PortManager,
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
    // Bound from the constructor, as the other RingCX modules do, rather than
    // from a lifecycle hook: this module waits on many dependencies before it
    // turns ready, and the host must not miss state changes in the meantime.
    if (this._portManager.shared) {
      this._portManager.onServer(() => this._bindHostNotifications());
    } else {
      this._bindHostNotifications();
    }
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

  /**
   * Watches the RingCX state the host is told about. Runs on the server port
   * only, like the RingCX call watchers, so each change is posted once; the
   * Adapter relays it to the client ports. Returns the teardown `onServer`
   * runs when this port stops being the server.
   */
  private _bindHostNotifications(): () => void {
    this._unbindHostNotifications?.();
    const unwatchSession = watch(
      this,
      () => this._agentSessionInputs(),
      () => {
        this._adapter.notifyRingCXAgentSession(this.getAgentSessionSnapshot());
      },
      { multiple: true },
    );
    const unwatchState = watch(
      this,
      () =>
        [
          this._ringCX.stage === 'ready',
          this._cxWorkingState.agentState.agentState,
          this._cxWorkingState.workingState.agentAuxState,
          this._cxWorkingState.isPendingDisposition,
        ] as const,
      ([ready, state, auxState, pendingDisposition]) => {
        if (!ready) {
          return;
        }
        this._adapter.notifyRingCXAgentState({
          state,
          auxState,
          pendingDisposition,
        });
      },
      { multiple: true },
    );
    const unregisterLeadEvents = this._cxLeads.onLeadEvent((event) => {
      this._adapter.notifyRingCXLead(formatRingCXLeadEvent(event));
    });
    this._adapter.notifyRingCXAgentSession(this.getAgentSessionSnapshot());
    this._unbindHostNotifications = () => {
      unwatchSession();
      unwatchState();
      unregisterLeadEvents();
      this._unbindHostNotifications = undefined;
    };
    return this._unbindHostNotifications;
  }

  /**
   * Values in the agent session snapshot. A change to any of them is a new
   * `rc-ringcx-agent-session-notify`, including a session update that keeps
   * the stage at `ready`.
   */
  private _agentSessionInputs(): readonly unknown[] {
    return [
      this._ringCX.stage,
      this._cxAuth.agentId,
      this._cxAuth.authenticateResponse,
      this._cxAgentSession.loginType,
      this._cxAgentSession.dialGroupId,
      this._cxAgentSession.selectedSkillProfileId,
      this._cxAgentSession.selectedInboundQueueIds,
      this._cxAgentSession.autoAnswer,
    ];
  }

  override async onReset(): Promise<void> {
    this._announcedRingUiis.clear();
    callLogSourceRegistry.unregister(RINGCX_CALL_LOG_SOURCE);
  }

  onRingCall(call: unknown): void {
    const formatted = this._format(call);
    if (!formatted) {
      return;
    }
    const uii = formatted.call.ringcx.uii;
    if (!uii || this._announcedRingUiis.has(uii)) {
      return;
    }
    this._announcedRingUiis.add(uii);
    this._adapter.notifyRingCXCall('ring', formatted.call);
  }

  onNewCall(call: unknown): void {
    const formatted = this._format(call);
    if (!formatted) {
      return;
    }
    const uii = formatted.call.ringcx.uii;
    // An auto-answered inbound call (or one that reached an agent already
    // offhook) is answered by the same ADD_SESSION that reports it ringing,
    // and the answer can be handled first. Announce the ring before the start,
    // as a RingEX call answered automatically still rings first.
    if (
      uii &&
      !this._announcedRingUiis.has(uii) &&
      formatted.call.ringcx.callType === 'INBOUND'
    ) {
      this._adapter.notifyRingCXCall('ring', formatted.call);
    }
    if (uii) {
      this._announcedRingUiis.add(uii);
    }
    this._adapter.notifyRingCXCall('start', formatted.call);
  }

  onEndCall(call: unknown): void {
    const formatted = this._format(call);
    if (!formatted) {
      return;
    }
    this._announcedRingUiis.delete(formatted.call.ringcx.uii);
    this._adapter.notifyRingCXCall('end', formatted.call);
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
      redirect: true,
    });
    return false;
  }

  /**
   * Disposition has already succeeded. A log failure must not undo that.
   * Returns true when the call is to be logged on the host log page, which
   * the caller opens once the call is over.
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
      summary: input.extra?.summary,
      triggerType: 'callDisposition',
      redirect: true,
    });
    return false;
  }

  /**
   * Whether a call disposed while it was still up opens the host log page
   * when it ends, as `logAfterDisposition` answered for it.
   */
  shouldOpenLogPageAfterDisposition(): boolean {
    return this._callLogger.ready && this.shouldOpenLogPage;
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
    contact,
    note,
    summary,
    triggerType,
    redirect = false,
  }: LogCallInput): Promise<void> {
    const formatted = this._format(call, { notes: note, summary });
    if (!formatted) {
      return;
    }
    if (note) {
      formatted.call.ringcx.notes = note;
    }
    const loggerCall = this._toLoggerCall(formatted);
    try {
      await this._callLogger.logCall({
        call: loggerCall,
        contact: contact ?? singleContactMatch(loggerCall),
        note,
        aiNote: formatted.call.aiNote,
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
    contact?: CallLogContact,
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
    const logged = hasLoggedCallActivity(call);
    await this.logCall({
      call: compatible,
      contact,
      note: compatible.ringcx?.notes,
      redirect: true,
      triggerType:
        actionType === 'viewLog' ? 'viewLog' : logged ? 'editLog' : 'createLog',
    });
  }

  /**
   * The host receives the row in the same shape as the RingCX call events, so
   * a `callAction` handler reads `call.source` and `call.ringcx` as it does
   * for `rc-call-end-notify`.
   */
  async onClickCallAction(
    buttonId: string,
    call: FormattedCall,
  ): Promise<void> {
    const formatted = this._format(historyCallInput(call));
    if (!formatted) {
      return;
    }
    await this._thirdParty.onClickAdditionalButton(buttonId, formatted.call);
  }

  async getCallForLog(id: string): Promise<CompatibleCall | null> {
    const raw = this._findRawCall(id);
    if (!raw) {
      return null;
    }
    const formatted = this._format(raw);
    if (!formatted) {
      return null;
    }
    return this._toPageCall(formatted);
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

  /**
   * Runs a host `rc-adapter-control-call` action on the current RingCX call.
   * `callId` selects the leg only for `hangup`; the other actions apply to the
   * current call, as the Agent tab controls do.
   */
  async controlCall(
    action: string,
    callId?: string,
    options: RingCXCallControlOptions = {},
  ): Promise<void> {
    switch (action) {
      case 'answer':
        await this._cxIntegratedSoftphone.sipAnswer();
        return;
      case 'reject':
        await this._cxIntegratedSoftphone.sipReject();
        return;
      case 'hangup':
        if (!this._requireCallPermission(this._currentMainCall?.allowHangup)) {
          return;
        }
        await this._cxActiveCallControl.hangUp(
          sessionIdFromCallId(callId) || MAIN_SESSION_ID,
        );
        return;
      case 'hold':
      case 'unhold':
        if (!this._requireCallPermission(this._currentMainCall?.allowHold)) {
          return;
        }
        await (action === 'hold'
          ? this._cxActiveCallControl.hold()
          : this._cxActiveCallControl.unhold());
        return;
      case 'mute':
      case 'unmute':
        if (!this._requireCallPermission(this._isIntegratedSoftphone)) {
          return;
        }
        await (action === 'mute'
          ? this._cxActiveCallControl.mute()
          : this._cxActiveCallControl.unmute());
        return;
      case 'record':
      case 'startRecord':
      case 'stopRecord':
        if (
          !this._requireCallPermission(
            this._currentMainCall?.agentRecording?.agentRecording === true,
          )
        ) {
          return;
        }
        await (action === 'stopRecord'
          ? this._cxActiveCallControl.stopRecord()
          : this._cxActiveCallControl.record());
        return;
      case 'dtmf':
        if (
          !options.dtmf ||
          !this._requireCallPermission(this._isIntegratedSoftphone)
        ) {
          return;
        }
        await this._cxActiveCallControl.onKeypadClick(options.dtmf);
        return;
      default:
        this.logger.warn('Unsupported RingCX call action', action);
        this._toast.warning({ message: t('callControlUnsupported') });
    }
  }

  private get _currentMainCall() {
    const call = this._cxCall.currentCall;
    return call ? this._cxActiveCallControl.getMainCall(call.uii) : undefined;
  }

  private get _isIntegratedSoftphone(): boolean {
    return this._cxAgentSession.isIntegratedSoftphone;
  }

  private _requireCallPermission(allowed: boolean | undefined): boolean {
    if (allowed === false) {
      this._toast.warning({ message: t('callControlNotAllowed') });
      return false;
    }
    return true;
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
    const localCallId = localCallIdOf(input);
    const phone = ringCXContactPhone(input);
    const contactMatches =
      input.contactMatches ||
      (phone
        ? (this._contactMatcher?.dataMapping?.[phone] as FormatRingCXCallInput['contactMatches'])
        : undefined);
    const saved = localCallId
      ? this._cxCallDisposition.getDisposition(localCallId)
      : undefined;
    return formatRingCXCall({
      ...input,
      contactMatches,
      notes: extra?.notes || saved?.notes || input.notes,
      summary: extra?.summary || saved?.summary || input.summary,
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

  /**
   * Resolves a live `uii$sessionId`, a history row id or a plain uii (the
   * call-log id) to the raw call.
   */
  private _findRawCall(id: string): FormatRingCXCallInput | undefined {
    const mapped = (this._cxCallMonitor.callsMapping[id] ??
      this._findAgentCallByUii(id)) as unknown as
      | FormatRingCXCallInput
      | undefined;
    if (mapped) {
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
        call.uii === id ||
        call.localCallId === id ||
        call.sessionId === id ||
        call.segmentId === id ||
        (historySegmentId &&
          (call.segmentId === historySegmentId ||
            call.sessionId === historySegmentId)),
    );
    if (history) {
      return historyCallInput(history);
    }
    if (isRingCXHistoryId(id)) {
      const { segmentId, uii } = parseHistoryCallId(id);
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
      return {
        id,
        uii,
        sessionId,
        localCallId: ringCXLiveCallId(uii, sessionId),
        agentId: this._cxAuth.agentId,
      };
    }
    return undefined;
  }

  /** The agent's own leg of a live or ended call, newest first. */
  private _findAgentCallByUii(uii: string) {
    if (uii.includes('$')) {
      return undefined;
    }
    const callId = [
      ...this._cxPresence.callIds,
      ...this._cxPresence.callLogsIds,
    ].find((item) => ringCXLogId({ id: item }) === uii);
    return callId ? this._cxCallMonitor.callsMapping[callId] : undefined;
  }

  private _toLoggerCall(
    formatted: { call: RingCXNormalizedCall; startTimeMs?: number },
  ): CompatibleCall {
    return this._toPageCall(formatted);
  }

  private _toPageCall(
    formatted: { call: RingCXNormalizedCall; startTimeMs?: number },
  ): CompatibleCall {
    const id = formatted.call.id;
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

/**
 * The remote party's contact when it has exactly one match, as the RingEX
 * auto log picks it. Several matches are left for the host to resolve.
 */
function singleContactMatch(call: CompatibleCall): CallLogContact {
  const matches =
    call.direction === 'Outbound' ? call.toMatches : call.fromMatches;
  return matches?.length === 1 ? (matches[0] as CallLogContact) : undefined;
}

/**
 * The local `uii$sessionId` of a call this browser handled; disposition state
 * is keyed by it. Undefined for server-only history rows.
 */
function localCallIdOf(input: FormatRingCXCallInput): string | undefined {
  if (input.localCallId) {
    return input.localCallId;
  }
  if (input.id && isRingCXHistoryId(input.id)) {
    return undefined;
  }
  const sessionId = input.session?.sessionId || input.sessionId;
  return input.uii && sessionId
    ? ringCXLiveCallId(input.uii, sessionId)
    : undefined;
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

/**
 * Host-facing lead: the documented fields, plus the raw RingCX lead in `raw`
 * for hosts that read fields not listed in the contract.
 */
function formatRingCXLead(lead: Lead) {
  return {
    leadId: lead.leadId,
    externId: lead.externId,
    campaignId: lead.campaignId,
    firstName: lead.firstName,
    lastName: lead.lastName,
    destination: lead.destination,
    raw: lead,
  };
}

function formatRingCXLeadEvent(event: CxLeadEvent) {
  return {
    action: event.action,
    leads: event.leads?.map(formatRingCXLead),
    lead: event.lead ? formatRingCXLead(event.lead) : undefined,
    destination: event.destination,
  };
}
