import React, { useRef, useEffect, useState } from 'react';
import {
  action,
  autobind,
  computed,
  injectable,
  optional,
  RcViewModule,
  RouterPlugin,
  state,
  storage,
  StoragePlugin,
  useConnector,
  useParams,
  PortManager,
  watch,
  delegate,
  type UIProps,
  type UIFunctions,
} from '@ringcentral-integration/next-core';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import { AppAnnouncement, AppFooterNav, AppHeaderNav } from '@ringcentral-integration/micro-core/src/app/components';
import { PageHeader } from '@ringcentral-integration/next-widgets/components';
import { Toast } from '@ringcentral-integration/micro-core/src/app/services';
import {
  Announcement,
  Button,
  CircularProgressIndicator,
  Icon,
  IconButton,
} from '@ringcentral/spring-ui';
import { CheckMd, ContactsMd } from '@ringcentral/spring-icon';

import { CxPresence } from '../../services/CxPresence';
import { CxAuth } from '../../services/CxAuth';
import { CxCall } from '../../services/CxCall';
import { CxCallMonitor } from '../../services/CxCallMonitor';
import { CxCallDisposition } from '../../services/CxCallDisposition';
import { CxWorkingState } from '../../services/CxWorkingState';
import { CxActiveCallControl } from '../../services/CxActiveCallControl';
import { CxAgentScript } from '../../services/CxAgentScript';
import { CxVoicemailDrop } from '../../services/CxVoicemailDrop';
import { CxClient } from '../../services/CxClient';
import type { ActivityLog } from '../../services/CxClient/interfaces';
import { CxCallHistory } from '../../services/CxCallHistory';
import { CxWrapUpLog } from '../../services/CxWrapUpLog';
import type { CxWrapUpLogMode } from '../../services/CxWrapUpLog';
import { parseHistoryCallId } from '../../services/CxCallHistory/formatHistoryCall';
import { dialoutStatuses } from '../../enums';
import { cxPath } from '../../routes';
import { formatPhoneNumber } from '../../lib/FormatPhoneNumber/formatPhoneNumber';
import { getClockByTimestamp } from '../../lib/getClockByTimestamp';
import type { RingCXAdapterBridge } from '../../interfaces/RingCXAdapterBridge.interface';
import { getCallAni, getCallDnis } from '../../lib/getCxCallNumbers';
import { ringCXLogId } from '../../lib/formatRingCXCall';
import { getCxCallResolvedContact } from '../../lib/getCxCallResolvedContact';
import { getCxCallSelectionKey } from '../../lib/getCxCallSelectionKey';
import type {
  CxCallDispositionData,
} from '../../services/CxCallDisposition/CxCallDisposition.interface';

import { DispositionForm } from '../../components/DispositionForm';
import { WrapUpPanel } from './WrapUpPanel';
import type { WrapUpUIProps } from './WrapUpPanel.interface';
import { RingCXSideWidgets } from '../../services/RingCXSideWidgets';
import { getCallInfos } from '../../utils/getCallInfos';
import { shouldShowCallLogSummary } from '../../utils/shouldShowCallLogSummary';
import { shouldShowDispositionSubmitStep } from '../../utils/shouldShowDispositionSubmitStep';
import { hasNewCallTakenOver } from '../../utils/hasNewCallTakenOver';
import { resolveLiveActivityCallId } from '../../utils/resolveLiveActivityCallId';
import { MatchedContactSelection } from '../../../app/services/MatchedContactSelection';
import type { CompatibleCall } from '../../../app/services/CallLogger';
import {
  callLogSourceRegistry,
  RINGCX_CALL_LOG_SOURCE,
} from '../../../app/services/CallLogger/CallLogSourceRegistry';
import type { UnknownRecord } from '../../../app/services/ThirdParty';
import { useSideWidgetTabsShown } from '../../../app/views/SideWidgetView';
import type {
  CxDispositionViewProps,
  CxDispositionViewUIProps,
  CxDispositionViewUIFunctions,
} from './CxDispositionView.interface';
import i18n, { t as translate } from './i18n';

/**
 * Stands in for a disposition id on a history row, whose recorded disposition
 * is displayed but not selectable.
 */
const RECORDED_DISPOSITION_ID = '__recorded__';

/**
 * Save status enum
 */
export enum SaveStatus {
  SUBMIT = 'submit',
  SAVING = 'saving',
  SAVED = 'saved',
}

/**
 * Disposition Item
 */
interface DispositionItem {
  dispositionId: string;
  disposition: string;
  label: string;
  requireNote?: boolean;
}

/**
 * What the page does once a submitted disposition has been shown as saved.
 */
interface SubmitNavigationContext {
  readonly callId: string;
  readonly viewCallId: string;
  readonly path: string;
  /** The call is logged on its wrap-up page once the call is over. */
  readonly openedLogPage: boolean;
  readonly shouldGoToDialer: boolean;
}

/**
 * CxDispositionView module - Disposition form and call log submission
 */
@injectable({
  name: 'CxDispositionView',
})
class CxDispositionView extends RcViewModule {
  /**
   * Agent home to go back to after the disposition: Leads for a call dialed
   * from a lead, otherwise the Dialer.
   */
  private get homePath(): string {
    return cxPath.home(this.cxCall.homeTabAfterCall);
  }

  constructor(
    private cxPresence: CxPresence,
    private cxAuth: CxAuth,
    private cxCall: CxCall,
    private cxCallMonitor: CxCallMonitor,
    private cxCallDisposition: CxCallDisposition,
    private cxWorkingState: CxWorkingState,
    private cxActiveCallControl: CxActiveCallControl,
    private cxClient: CxClient,
    private cxCallHistory: CxCallHistory,
    private router: RouterPlugin,
    private toast: Toast,
    private storagePlugin: StoragePlugin,
    private portManager: PortManager,
    private matchedContactSelection: MatchedContactSelection,
    private cxWrapUpLog: CxWrapUpLog,
    @optional()
    private cxAgentScript?: CxAgentScript,
    @optional('RingCXAdapterBridge')
    private ringCXAdapterBridge?: RingCXAdapterBridge,
    @optional()
    private ringCXSideWidgets?: RingCXSideWidgets,
    @optional()
    private cxVoicemailDrop?: CxVoicemailDrop,
  ) {
    super();
    this.storagePlugin.enable(this);
    watch(
      this,
      () => this.router.currentPath,
      (path) => {
        const pending = this._submitNavigation;
        if (!pending || path === pending.context.path) {
          return;
        }
        this._cancelSubmitNavigation();
        this._finishSubmit(pending.context, false);
      },
    );
    // Rule A: a RingCX log page for a call being wrapped up shows its form
    // on the wrap-up page instead.
    callLogSourceRegistry.registerLogPageHandler(
      RINGCX_CALL_LOG_SOURCE,
      (id) => this._openWrapUpLogPage(id),
    );
  }

  /**
   * The call loaded for the wrap-up page's default call log form, which is
   * built from the call as the log page builds it.
   */
  @state
  wrapUpLogCall: { id: string; call: CompatibleCall | null } | null = null;

  @action
  private _setWrapUpLogCall(id: string, call: CompatibleCall | null) {
    this.wrapUpLogCall = { id, call };
  }

  /** Calls whose `prepareLogForm` request is in flight. */
  private readonly _preparingLogForms = new Set<string>();

  /**
   * The delayed hand-over after a successful submit. It belongs to the
   * disposition page it was started on, so it is cancelled as soon as the
   * agent leaves that page, for example to the call log page opened by the
   * call logger.
   */
  private _submitNavigation?: {
    readonly context: SubmitNavigationContext;
    readonly timer: ReturnType<typeof setTimeout>;
  };

  /**
   * Deliberately not persisted: this is the outcome of one submit, not
   * something the next call inherits. Storing it meant a session that ended on
   * `SAVED` - the agent navigates away, or the worker restarts, before the
   * delay below hands over to `reset` - came back with the submit button
   * already showing success for a disposition nobody had filled in.
   */
  @state
  saveStatus: SaveStatus = SaveStatus.SUBMIT;

  @storage
  @state
  validated = {
    dispositionId: true,
    notes: true,
  };

  @storage
  @state
  required = {
    notes: false,
  };

  @state
  viewCallId = '';

  /**
   * The RingCX activity behind a history row.
   *
   * History rows carry no live session, so for a call this browser never
   * handled the activity record is the only source of what was dispositioned.
   */
  @state
  historyActivity: ActivityLog | null = null;

  /**
   * The history row id (`segmentId$$uii`) whose activity is currently loaded.
   * Compared to the route id so the UI can show a spinner before the fetch
   * effect runs, instead of flashing "No active call".
   */
  @state
  historyActivityRowId = '';

  @state
  isHistoryActivityLoading = false;

  /**
   * True after GET /activities succeeded for this history row. False when
   * the agent lacks contact-management permission, the token refresh fails,
   * or the request errors — summary is hidden in those cases.
   */
  @state
  isActivitiesAccessible = false;

  /**
   * Guards overlapping history-activity loads when the agent switches rows
   * before the previous request settles.
   */
  private _historyActivityRequestId = 0;

  /**
   * Edits to a server-only history row.
   *
   * Held separately from `CxCallDisposition`, which is keyed by the local call
   * id these rows do not have.
   */
  @state
  historyActivityDraft: { agentNotes: string; agentSummary: string } = {
    agentNotes: '',
    agentSummary: '',
  };

  @action
  setSaveStatus(status: SaveStatus) {
    this.saveStatus = status;
  }

  @action
  setValidated(validated: Partial<typeof this.validated>) {
    this.validated = { ...this.validated, ...validated };
  }

  @action
  setRequired(required: Partial<typeof this.required>) {
    this.required = { ...this.required, ...required };
  }

  @action
  _setViewCallId(id: string) {
    this.viewCallId = id;
  }

  @delegate('server')
  async setViewCallId(id: string) {
    this._setViewCallId(id);
    // The wrap-up starts as the page opens, during the call too, so the
    // host's call log form can be filled before the call ends.
    const call = id && !this.isHistoryMode ? this.cxPresence.callsMapping[id] : null;
    if (call) {
      this.cxWrapUpLog.open(
        id,
        shouldShowDispositionSubmitStep(call) &&
          !this.cxCallDisposition.isDisposed(id),
      );
    }
  }

  @action
  private _setHistoryActivity({
    activity,
    isAccessible,
  }: {
    activity: ActivityLog | null;
    isAccessible: boolean;
  }) {
    this.historyActivity = activity;
    this.isActivitiesAccessible = isAccessible;
    this.historyActivityDraft = {
      agentNotes: activity?.agentNotes || '',
      agentSummary: activity?.agentSummary || activity?.autoSummary || '',
    };
  }

  @action
  private _setHistoryActivityLoadState({
    rowId,
    isLoading,
  }: {
    rowId?: string;
    isLoading: boolean;
  }) {
    this.isHistoryActivityLoading = isLoading;
    if (rowId !== undefined) {
      this.historyActivityRowId = rowId;
    }
  }

  @action
  private _setHistoryActivityDraft(
    field: 'agentNotes' | 'agentSummary',
    value: string,
  ) {
    this.historyActivityDraft = { ...this.historyActivityDraft, [field]: value };
  }

  @delegate('server')
  async updateHistoryActivityDraft(
    field: 'agentNotes' | 'agentSummary',
    value: string,
  ): Promise<void> {
    this._setHistoryActivityDraft(field, value);
  }

  /**
   * Load the activity for a history row, keyed by its segment id.
   *
   * Requires `allowContactManagement` (same gate eag uses for CM / activities).
   * Runs for every history row, including ones with local data, so the form
   * always reflects what the server actually recorded. Always clears the
   * loading flag — including on 404 / permission miss / network errors — so
   * the call-log page does not spin forever.
   */
  @delegate('server')
  async loadHistoryActivity(rowId: string): Promise<void> {
    const requestId = ++this._historyActivityRequestId;
    this._setViewCallId(rowId);
    // Bind the row id immediately so pending UI keys off loading, not a stale
    // previous row, and so a failed request still settles this route.
    this._setHistoryActivityLoadState({ rowId, isLoading: true });
    this._setHistoryActivity({ activity: null, isAccessible: false });
    try {
      if (!this.cxAuth.agentPermissions?.allowContactManagement) {
        this._setHistoryActivity({ activity: null, isAccessible: false });
        return;
      }
      const { segmentId } = parseHistoryCallId(rowId);
      if (!segmentId) {
        this._setHistoryActivity({ activity: null, isAccessible: false });
        return;
      }
      const authorized = await this.cxAuth.refreshEvToken();
      if (requestId !== this._historyActivityRequestId) {
        return;
      }
      if (!authorized) {
        this._setHistoryActivity({ activity: null, isAccessible: false });
        return;
      }
      const activity = await this.cxClient.getActivityBySegmentId(segmentId);
      if (requestId !== this._historyActivityRequestId) {
        return;
      }
      this._setHistoryActivity({ activity, isAccessible: true });
    } catch (error) {
      this.logger.warn('loadHistoryActivity failed', error);
      if (requestId === this._historyActivityRequestId) {
        this._setHistoryActivity({ activity: null, isAccessible: false });
      }
    } finally {
      if (requestId === this._historyActivityRequestId) {
        this._setHistoryActivityLoadState({ rowId, isLoading: false });
      }
    }
  }

  @action
  private _reset() {
    this.saveStatus = SaveStatus.SUBMIT;
    this.validated = { dispositionId: true, notes: true };
    this.required = { notes: false };
  }

  /**
   * Delegated because this state is written by `disposeCall` on the server, so
   * the client cannot clear it on its own: a client-side action is replaced by
   * the server's copy on the next full-state sync, which left the view opening
   * on whatever the previous disposition ended with.
   */
  @delegate('server')
  async reset() {
    this._reset();
  }

  get isHistoryMode(): boolean {
    return this.router.currentPath?.startsWith('/agent/history/') ?? false;
  }

  /**
   * History routes carry the server row id (`<segmentId>$$<uii>`), which is a
   * different id space from the local `<uii>$<sessionId>` keys that
   * `CxCallDisposition`, `CxPresence` and the `rc-ev-logCall` adapter contract
   * all use. Resolve it back to the local id so none of them need to change;
   * it is empty for a call this browser never handled.
   */
  get callId(): string {
    if (this.isHistoryMode && this.viewCallId) {
      const { segmentId } = parseHistoryCallId(this.viewCallId);
      return this.cxPresence.getCallIdBySegmentId(segmentId) || '';
    }
    return this.viewCallId || this.cxCall.activityCallId;
  }

  /** A history row that only exists server-side, with no local call data. */
  get isServerOnlyHistoryCall(): boolean {
    return this.isHistoryMode && !this.callId;
  }

  /**
   * Server history row for the open call-log route.
   *
   * Used when the activities API is unavailable or returns nothing, so the
   * form can still show the disposition recorded on the history page.
   */
  get historyCall() {
    if (!this.isHistoryMode || !this.viewCallId) {
      return undefined;
    }
    return this.cxCallHistory.getCallById(this.viewCallId);
  }

  /**
   * Disposition label for a server-only history call-log form.
   *
   * Prefers the activity record when present; otherwise the history row's
   * disposition field.
   */
  get historyDispositionName(): string {
    return (
      this.historyActivity?.dispositionName ||
      this.historyCall?.disposition ||
      ''
    );
  }

  get hasCurrentCall(): boolean {
    return !!this.currentCall;
  }

  get currentCall() {
    const id = this.callId;
    if (!id) return null;
    const call = this.cxPresence.callsMapping[id];
    if (!call) return null;
    const monitorCallId = this.cxCallMonitor.getCallId(call.session || {});
    return this.cxCallMonitor.callsMapping[monitorCallId] || call;
  }

  @computed((that: CxDispositionView) => [that.currentCall, that.isHistoryMode])
  get callStatus(): 'active' | 'callEnd' {
    if (this.currentCall?.endedCall || this.isHistoryMode) {
      return 'callEnd';
    }
    return 'active';
  }

  @computed((that: CxDispositionView) => [that.currentCall])
  get dispositionPickList(): DispositionItem[] {
    const dispositions = this.currentCall?.outdialDispositions?.dispositions || [];
    return dispositions.map((item: any) => ({
      ...item,
      label: item.disposition,
      value: item.dispositionId,
    }));
  }

  /**
   * Whether to show the submit/disposition step
   */
  get showSubmitStep(): boolean {
    return shouldShowDispositionSubmitStep(this.currentCall);
  }

  @computed((that: CxDispositionView) => [
    that.currentCall,
    that.matchedContactSelection.selectionList,
  ])
  get basicInfo() {
    const call = this.currentCall as any;
    if (!call) return null;
    const isInbound = call.callType === 'INBOUND';
    const contactMatches: any[] = call.contactMatches || [];
    // The contact the call control page resolved to — the logged contact,
    // else the agent's pick — so the name does not change on the way here.
    const name = (
      getCxCallResolvedContact(this.matchedContactSelection, {
        uii: getCxCallSelectionKey(call),
        matches: contactMatches,
        activityMatches: call.activityMatches,
      }) ?? contactMatches[0]
    )?.name;
    const ani = getCallAni(call);
    const dnis = getCallDnis(call);
    const fromNumber = isInbound ? ani : dnis;
    const toNumber = isInbound ? dnis : ani;
    const fromMatchName = name || fromNumber;
    const toMatchName = name || toNumber;
    const phoneNumber = isInbound ? fromNumber : toNumber;
    const formattedNumber = formatPhoneNumber({ phoneNumber: phoneNumber || '' });
    return {
      subject: isInbound ? fromMatchName : toMatchName,
      followInfos: [
        formattedNumber,
        ...(call.queue?.name ? [call.queue.name] : []),
      ],
      callInfos: getCallInfos(call),
    };
  }

  get isInbound(): boolean {
    return this.currentCall?.callType === 'INBOUND';
  }

  get showSummary(): boolean {
    return shouldShowCallLogSummary({
      isHistoryMode: this.isHistoryMode,
      isActivitiesAccessible: this.isActivitiesAccessible,
      hasHistoryActivity: !!this.historyActivity,
      isServerOnlyHistoryCall: this.isServerOnlyHistoryCall,
      isSessionSummaryEnabled: this.isSummaryEnabled(this.currentCall),
    });
  }

  private getSummarySegmentId(call?: {
    session?: { segmentId?: string };
    segmentContext?: { segmentId?: string };
  } | null): string {
    if (!call) {
      return '';
    }
    return call.session?.segmentId || call.segmentContext?.segmentId || '';
  }

  // `summary` arrives from the agent library as a coerced flag: a real boolean
  // when the wire value is TRUE/FALSE, and '' when the field is absent.
  private isSummaryEnabled(
    call?: { session?: { summary?: boolean | string } } | null,
  ): boolean {
    if (!call) {
      return false;
    }
    return !!call.session?.summary;
  }

  getContactName(call: any): string {
    if (!call) return '';
    const ani = getCallAni(call);
    const contactMatches = call.contactMatches || [];
    if (contactMatches.length > 0) {
      return contactMatches[0].name || ani;
    }
    return ani;
  }

  @delegate('server')
  async goBack() {
    if (this.isHistoryMode) {
      this._setViewCallId('');
      this.router.goBack();
      this._reset();
      return;
    }
    const isEnded = this.callStatus === 'callEnd' || !this.hasCurrentCall;
    if (!isEnded) {
      this.router.goBack();
      this._reset();
      return;
    }
    this.leaveEndedDisposition();
  }

  /**
   * Leave a finished disposition without dropping a live call that answered
   * while this page was still on the stack.
   */
  private leaveEndedDisposition(): void {
    const submittedCallId: string = this.callId;
    const takenOver: boolean = hasNewCallTakenOver({
      submittedCallId,
      activityCallId: this.cxCall.activityCallId,
      callIds: this.cxCallMonitor.callIds,
    });
    this._setViewCallId('');
    this.router.replace(this.homePath);
    this._reset();
    if (takenOver) {
      this.restoreTakenOverCall(submittedCallId);
      return;
    }
    this.cxCall.setDialoutStatus(dialoutStatuses.idle);
    this.cxCall.setActivityCallId('');
  }

  /**
   * Point the banner at the call that replaced the one just dispositioned.
   */
  private restoreTakenOverCall(submittedCallId: string): void {
    const liveCallId: string = resolveLiveActivityCallId({
      activityCallId: this.cxCall.activityCallId,
      callIds: this.cxCallMonitor.callIds,
      excludeCallId: submittedCallId,
    });
    if (liveCallId && liveCallId !== this.cxCall.activityCallId) {
      this.cxCall.setActivityCallId(liveCallId);
    }
  }

  @delegate('server')
  async onUpdateCallLog(field: string, value: string) {
    const callId = this.callId;
    const currentData = this.cxCallDisposition.getDisposition(callId) || {
      dispositionId: null,
      notes: '',
      summary: '',
    };
    if (field === 'dispositionId') {
      const currentDisposition = this.dispositionPickList.find(
        (item) => item.dispositionId === value,
      );
      const noteRequired = currentDisposition?.requireNote ?? false;
      this.setRequired({ notes: noteRequired });
      this.setValidated({
        dispositionId: !!value,
        notes: !noteRequired || !!currentData.notes,
      });
    }
    if (field === 'notes' && this.required.notes) {
      this.setValidated({ notes: !!value });
    } else if (field === 'notes') {
      this.setValidated({ notes: true });
    }
    const updatedData: CxCallDispositionData = {
      dispositionId: currentData.dispositionId,
      notes: currentData.notes,
      summary: currentData.summary,
      [field]: value,
    };
    this.cxCallDisposition.setDisposition(callId, updatedData);
  };

  @delegate('server')
  async onUpdateSummary(value: string) {
    this.cxCallDisposition.setSummary(this.callId, value);
  }

  @delegate('server')
  async requestConversationSummary(callId: string, callStatus: 'active' | 'callEnd') {
    const call = this.cxPresence.callsMapping[callId];
    this.logger.info('requestConversationSummary~~', callId, callStatus);
    if (!this.isSummaryEnabled(call)) {
      this.logger.info('requestConversationSummary~~ not enabled', callId, callStatus);
      return;
    }
    const segmentId = this.getSummarySegmentId(call);
    const sessionId = call.session?.sessionId;
    if (!segmentId || !sessionId) {
      return;
    }
    const summaryState = this.cxCallDisposition.getSummaryState(callId);
    if (summaryState) {
      if (!summaryState.isFinal) {
        this.logger.info('requestConversationSummary~~ not final', callId, callStatus);
        return;
      }
      // if the summary is edited after the final, we don't need to request again
      if (summaryState.isEditedAfterFinal) {
        this.logger.info('requestConversationSummary~~ not edited after final', callId, callStatus);
        return;
      }
    }
    this.logger.info('requestConversationSummary~~ start request', callId, callStatus);
    const uii = this.cxClient.decodeUii(call.uii);
    this.cxCallDisposition.startSummaryRequest(callId, segmentId);
    try {
      await this.cxClient.requestCallSummary(uii, sessionId, segmentId);
    } catch (error) {
      this.cxCallDisposition.setSummaryRequestError(callId, segmentId);
      this.logger.error('requestConversationSummary failed', error);
    }
  }

  private get pendingDispositionCallId(): string {
    return this.cxWorkingState.pendingDispositionCallId || this.cxCall.activityCallId;
  }

  /**
   * Whether the agent is already looking at the pending disposition, where
   * the banner leading to it has nothing left to offer.
   */
  private get isOnPendingDispositionPage(): boolean {
    const callId = this.pendingDispositionCallId;
    return !!callId && this.router.currentPath === cxPath.disposition(callId);
  }

  /**
   * A disposition that was submitted for a call that is over. Its route can
   * only be reached again through history, for example Back from the call log
   * page, where the form would ask for a disposition that is already saved.
   */
  isFinishedDisposition(callId: string): boolean {
    return (
      !!callId &&
      this.cxCallDisposition.isDisposed(callId) &&
      !this.cxCallMonitor.callIds.includes(callId) &&
      !this.isWrapUpLogOpen(callId)
    );
  }

  /**
   * Where the wrap-up page of a call gets its call log form. A host that
   * opened its own log page for the call gets its form shown there too.
   */
  getWrapUpLogMode(callId: string): CxWrapUpLogMode {
    const mode = this.ringCXAdapterBridge?.wrapUpLogMode ?? 'none';
    if (mode !== 'none') {
      return mode;
    }
    return this.cxWrapUpLog.get(callId)?.hostOpened ? 'page' : 'none';
  }

  /** The call is left to be logged on its wrap-up page. */
  isWrapUpLogOpen(callId: string): boolean {
    return (
      this.getWrapUpLogMode(callId) !== 'none' &&
      this.cxWrapUpLog.isLogOpen(callId)
    );
  }

  /**
   * The side widget tab name: Disposition while the page has a disposition
   * to submit when it opened, Log call when it only logs the call.
   */
  getTabNameKey(callId?: string): 'disposition' | 'logCall' {
    if (!callId) {
      return 'disposition';
    }
    const entry = this.cxWrapUpLog.get(callId);
    if (entry) {
      return entry.hasDispositionStep ? 'disposition' : 'logCall';
    }
    const call = this.cxPresence.callsMapping[callId];
    return !call || shouldShowDispositionSubmitStep(call) ? 'disposition' : 'logCall';
  }

  /**
   * Rule A: the host navigates to `/log/call/<id>?source=ringcx` for a call
   * whose wrap-up page is open, or was left with its call log not saved. The
   * wrap-up page shows the host's form instead of a separate log page, and
   * opens in a side widget tab when the agent already left it.
   */
  private async _openWrapUpLogPage(id: string): Promise<boolean> {
    const callId = this._findWrapUpCallId(id);
    if (!callId) {
      return false;
    }
    if ((this.ringCXAdapterBridge?.wrapUpLogMode ?? 'none') === 'none') {
      this.cxWrapUpLog.update(callId, { hostOpened: true });
    }
    // A submit that would leave the page now stays for the call log.
    if (this._submitNavigation?.context.callId === callId) {
      this._cancelSubmitNavigation();
      this.setSaveStatus(SaveStatus.SUBMIT);
    }
    const path = cxPath.disposition(callId);
    if (this.router.currentPath !== path) {
      await this.router.push(path);
    }
    return true;
  }

  private _findWrapUpCallId(id: string): string | undefined {
    const logId = ringCXLogId({ id });
    if (!logId) {
      return undefined;
    }
    const callIds = Object.keys(this.cxWrapUpLog.entries).filter(
      (callId) =>
        this.cxWrapUpLog.isLogOpen(callId) &&
        ringCXLogId({ id: callId }) === logId,
    );
    return callIds.includes(this.cxWrapUpLog.lastCallId)
      ? this.cxWrapUpLog.lastCallId
      : callIds[callIds.length - 1];
  }

  /**
   * Asks an opted-in host for the call log form of a call, once per call,
   * and again when another call's form replaced it. Sent while the call is
   * still up too; the form is saved with the final call when it ends.
   */
  @delegate('server')
  async prepareWrapUpLogForm(callId: string): Promise<void> {
    const entry = this.cxWrapUpLog.get(callId);
    const bridge = this.ringCXAdapterBridge;
    if (
      !entry ||
      !bridge?.prepareLogForm ||
      this.getWrapUpLogMode(callId) !== 'prepare' ||
      !this.cxWrapUpLog.isLogOpen(callId) ||
      this._preparingLogForms.has(callId)
    ) {
      return;
    }
    const isCurrentForm =
      entry.formStatus === 'ready' && bridge.logCallPageOwnerId === callId;
    if (isCurrentForm || entry.formStatus === 'none') {
      return;
    }
    this._preparingLogForms.add(callId);
    this.cxWrapUpLog.update(callId, {
      formStatus: 'loading',
      noLogFormReason: undefined,
    });
    try {
      const result = await bridge.prepareLogForm(callId);
      this.cxWrapUpLog.update(callId, {
        formStatus: result.status === 'ready' ? 'ready' : 'none',
        noLogFormReason:
          result.reason ||
          (result.status === 'failed'
            ? translate('logFormUnavailable', { host: this.hostName })
            : undefined),
      });
    } finally {
      this._preparingLogForms.delete(callId);
    }
  }

  /** Loads the call a default call log form is built from. */
  @delegate('server')
  async loadWrapUpLogCall(callId: string): Promise<void> {
    const call = (await this.ringCXAdapterBridge?.getCallForLog?.(callId)) ?? null;
    this._setWrapUpLogCall(callId, call);
  }

  /** The host's name on the wrap-up page, "Call log" when it has none. */
  get hostName(): string {
    return this.ringCXAdapterBridge?.hostName || translate('callLog');
  }

  @delegate('server')
  async onWrapUpLogFormChange(
    formData: UnknownRecord,
    keys: string[],
  ): Promise<void> {
    await this.ringCXAdapterBridge?.onLogFormInputChanged?.({
      callId: this.callId,
      formData,
      keys,
    });
  }

  @delegate('server')
  async onWrapUpLogFormButtonClick(
    buttonId: string,
    formData: UnknownRecord,
  ): Promise<void> {
    await this.ringCXAdapterBridge?.onLogFormButtonClick?.(buttonId, formData);
  }

  /**
   * Leaves the wrap-up page without logging the call, which stays Unlogged
   * in history.
   */
  @delegate('server')
  async logLater(): Promise<void> {
    this.cxWrapUpLog.update(this.callId, { logStatus: 'skipped' });
    this.leaveEndedDisposition();
  }

  /**
   * One Submit for the wrap-up page: the disposition first, as today, then
   * the host's call log form. A failed or slow log never undoes or holds the
   * disposition; the page stays with Retry and Log later instead.
   *
   * @param formData - The call log form to save, or null while it is not
   * shown.
   * @param skipLog - Submit without logging, when only the call log form
   * blocks the submit.
   */
  @delegate('server')
  async submitWrapUp({
    formData = null,
    skipLog = false,
  }: {
    formData?: UnknownRecord | null;
    skipLog?: boolean;
  } = {}): Promise<void> {
    if (this.isHistoryMode) {
      await this.disposeCall();
      return;
    }
    if (this.saveStatus === SaveStatus.SAVED) {
      this.goBack();
      return;
    }
    const callId = this.callId;
    if (
      this.saveStatus === SaveStatus.SAVING ||
      this.cxWrapUpLog.get(callId)?.logStatus === 'saving'
    ) {
      return;
    }
    const needsDisposition =
      this.showSubmitStep && !this.cxCallDisposition.isDisposed(callId);
    if (needsDisposition && !this._validateDisposition()) {
      return;
    }
    const callEndedBefore =
      this.callStatus === 'callEnd' || !this.hasCurrentCall;
    const submittedPath = this.router.currentPath;
    const viewCallId = this.viewCallId;
    let logsOnWrapUp = this.getWrapUpLogMode(callId) !== 'none';
    this.setSaveStatus(SaveStatus.SAVING);
    if (needsDisposition) {
      try {
        logsOnWrapUp = await this._saveDisposition();
      } catch (e) {
        console.error(e);
        this.setSaveStatus(SaveStatus.SUBMIT);
        this.toast.danger({
          message: translate('callDispositionFailed'),
          ttl: 0,
        });
        return;
      }
    }
    // Read again: the call can end while the disposition is sent, a "Hangup
    // on Disp" campaign ends it then, and the host can open its own log page
    // for the call meanwhile, see `_openWrapUpLogPage`.
    const callEnded = callEndedBefore || !this.cxCallMonitor.callIds.includes(callId);
    const entry = this.cxWrapUpLog.get(callId);
    if (
      !callEnded &&
      !formData &&
      !skipLog &&
      entry?.hostOpened &&
      entry.logStatus === 'pending'
    ) {
      // The host opened its log form for the call: the page stays for it.
      this.setSaveStatus(SaveStatus.SUBMIT);
      return;
    }
    if (!callEnded && this.isWrapUpLogOpen(callId) && (formData || skipLog)) {
      // Saved with the final call when it ends, see `CxRouteCoordinator`.
      this.cxWrapUpLog.update(
        callId,
        skipLog
          ? { logStatus: 'skipped', queuedFormData: undefined }
          : { logStatus: 'queued', queuedFormData: formData ?? undefined },
      );
    } else if (callEnded && this.isWrapUpLogOpen(callId)) {
      if (skipLog) {
        this.cxWrapUpLog.update(callId, { logStatus: 'skipped' });
      } else if (formData) {
        const saved = await this._saveWrapUpLog(callId, formData);
        if (!saved) {
          this.setSaveStatus(SaveStatus.SUBMIT);
          return;
        }
      } else {
        // The call log form is not shown yet: the page stays for it.
        this.setSaveStatus(SaveStatus.SUBMIT);
        return;
      }
    } else if (callEnded && this.cxWrapUpLog.get(callId)) {
      // The host logs the call on its own, after `callDisposition`.
      this.cxWrapUpLog.update(callId, { logStatus: 'saved' });
    }
    this.setSaveStatus(SaveStatus.SAVED);
    this._scheduleSubmitNavigation({
      callId,
      viewCallId,
      path: submittedPath,
      openedLogPage: !callEnded && logsOnWrapUp,
      shouldGoToDialer: callEnded,
    });
  }

  private async _saveWrapUpLog(
    callId: string,
    formData: UnknownRecord,
  ): Promise<boolean> {
    this.cxWrapUpLog.update(callId, {
      logStatus: 'saving',
      logError: undefined,
    });
    const result = (await this.ringCXAdapterBridge?.saveLogForm?.({
      callId,
      formData,
    })) ?? { error: translate('logFailed', { host: this.hostName }) };
    if (result.error) {
      this.cxWrapUpLog.update(callId, {
        logStatus: 'failed',
        logError: result.error,
      });
      return false;
    }
    this.cxWrapUpLog.update(callId, {
      logStatus: 'saved',
      queuedFormData: undefined,
    });
    return true;
  }

  @delegate('server')
  async leaveFinishedDisposition(callId: string) {
    if (
      this._submitNavigation ||
      !this.isFinishedDisposition(callId) ||
      this.router.currentPath !== cxPath.disposition(callId)
    ) {
      return;
    }
    if (this.viewCallId === callId) {
      this._setViewCallId('');
    }
    this._reset();
    this.router.replace(this.homePath);
  }

  @delegate('server')
  async goToPendingDisposition() {
    const callId = this.pendingDispositionCallId;
    if (!callId) {
      this.logger.warn('goToPendingDisposition~~ without a call id');
      return;
    }
    const call = this.cxPresence.callsMapping[callId];
    if (!call || !shouldShowDispositionSubmitStep(call)) {
      await this.cxWorkingState.setIsPendingDisposition(false);
      this.router.replace(this.homePath);
      return;
    }
    this.router.push(cxPath.disposition(callId));
  }

  /**
   * Announcement banner shown when agent is in Pending Disposition state.
   * Renders in AppView's AppAnnouncementRender area.
   */
  @autobind
  Announcement() {
    const { t } = useLocale(i18n);
    const { isOnPendingDispositionPage, isPendingDisposition, time } =
      useConnector(() => ({
        isOnPendingDispositionPage: this.isOnPendingDispositionPage,
        isPendingDisposition: this.cxWorkingState.isPendingDisposition,
        time: this.cxWorkingState.time,
      }));
    const [intervalTime, setIntervalTime] = useState(() => Date.now() - time);
    useEffect(() => {
      if (!isPendingDisposition) return;
      const updateTimer = () => {
        setIntervalTime(Date.now() - time);
      };
      updateTimer();
      const timerId = setInterval(updateTimer, 1000);
      return () => clearInterval(timerId);
    }, [isPendingDisposition, time]);
    if (!isPendingDisposition || isOnPendingDispositionPage) {
      return null;
    }
    const timerText = getClockByTimestamp(intervalTime);
    return (
      <AppAnnouncement>
        <Announcement
          severity="neutral"
          className="rounded-none cursor-pointer"
          classes={{ body: 'gap-2' }}
          data-sign="pendingDispositionAnnouncement"
          onClick={() => this.goToPendingDisposition()}
          action={
            <span className="typography-subtitleMini">{timerText}</span>
          }
        >
          {t('pendingDisposition')}
        </Announcement>
      </AppAnnouncement>
    );
  }

  /**
   * Update the RingCX activity for a history row. CRM logging is a separate
   * host action and is not posted from this page.
   */
  private async doUpdateHistoryActivity() {
    const activityId = this.historyActivity?.id;
    if (
      !activityId ||
      !this.cxAuth.agentPermissions?.allowContactManagement
    ) {
      return;
    }
    const authorized = await this.cxAuth.refreshEvToken();
    if (!authorized) {
      return;
    }
    await this.cxClient.updateActivity(activityId, {
      dispositionName: this.historyDispositionName,
      agentSummary: this.historyActivityDraft.agentSummary,
      agentNotes: this.historyActivityDraft.agentNotes,
    });
  }

  /**
   * Dispose first. Logging runs afterwards and cannot put the agent back into
   * Pending Disposition.
   */
  private async doDisposeCall(): Promise<boolean> {
    if (this.isServerOnlyHistoryCall || this.isHistoryMode) {
      await this.doUpdateHistoryActivity();
      return false;
    }
    const call = this.currentCall;
    const disposition = this.cxCallDisposition.getDisposition(this.callId);
    const dialogId = call?.session.dialogId;
    const dispositionId = disposition?.dispositionId;
    const dispositionItem = this.dispositionPickList.find(
      (item) => item.dispositionId === dispositionId,
    );
    await this.cxCallDisposition.disposeCall(this.callId);
    if (dialogId && this.summary && dispositionId) {
      const authorized = await this.cxAuth.refreshEvToken();
      if (authorized) {
        await this.cxClient.updateActivityDisposition({
          dialogId,
          params: {
            dispositionName: dispositionItem?.label || '',
            agentSummary: this.summary,
            agentNotes: disposition?.notes || '',
          },
        });
      }
    }
    if (call?.scriptId) {
      await this.cxAgentScript?.saveScriptResult(call);
    }
    return this.ringCXAdapterBridge?.logAfterDisposition?.({
      call,
      callId: this.callId,
      note: disposition?.notes,
      extra: {
        dispositionId,
        dispositionName: dispositionItem?.label,
        notes: disposition?.notes,
        summary: this.summary || undefined,
      },
    }) ?? false;
  }

  @delegate('server')
  async disposeCall() {
    if (this.saveStatus === SaveStatus.SAVED) {
      this.goBack();
      return;
    }
    const callId = this.callId;
    if (!this._validateDisposition()) {
      return;
    }
    const shouldGoToDialerAfterSubmit = this.callStatus === 'callEnd' || !this.hasCurrentCall;
    const submittedPath = this.router.currentPath;
    const viewCallId = this.viewCallId;
    try {
      this.setSaveStatus(SaveStatus.SAVING);
      const openedLogPage = await this._saveDisposition();
      this.setSaveStatus(SaveStatus.SAVED);
      this._scheduleSubmitNavigation({
        callId,
        viewCallId,
        path: submittedPath,
        openedLogPage,
        shouldGoToDialer: shouldGoToDialerAfterSubmit,
      });
    } catch (e) {
      console.error(e);
      this.setSaveStatus(SaveStatus.SUBMIT);
      this.toast.danger({
        message: translate('callDispositionFailed'),
        ttl: 0,
      });
    }
  };

  /** Shows the disposition's errors; returns whether it can be submitted. */
  private _validateDisposition(): boolean {
    const saveFields = this.cxCallDisposition.getDisposition(this.callId);
    this.setValidated({
      notes: !this.required.notes || (this.required.notes && !!saveFields?.notes),
    });
    return this.validated.dispositionId && this.validated.notes;
  }

  /**
   * Sends the disposition and its side effects, then leaves Pending
   * Disposition. Returns whether the call is logged on its wrap-up page.
   */
  private async _saveDisposition(): Promise<boolean> {
    const logsOnWrapUp = await this.doDisposeCall();
    if (!this.isHistoryMode) {
      void this.cxCallHistory.refresh();
    }
    this.toast.success({ message: translate('callDispositionSuccess') });
    await this.cxWorkingState.setIsPendingDisposition(false);
    return logsOnWrapUp;
  }

  private _scheduleSubmitNavigation(context: SubmitNavigationContext): void {
    this._cancelSubmitNavigation();
    if (this.router.currentPath !== context.path) {
      this._finishSubmit(context, false);
      return;
    }
    const timer = setTimeout(() => {
      this._submitNavigation = undefined;
      this._finishSubmit(context, this.router.currentPath === context.path);
    }, 1000);
    this._submitNavigation = { context, timer };
  }

  private _cancelSubmitNavigation(): void {
    if (!this._submitNavigation) {
      return;
    }
    clearTimeout(this._submitNavigation.timer);
    this._submitNavigation = undefined;
  }

  /**
   * Clean up after a submit. Routing only happens while the agent is still on
   * the submitted disposition page; otherwise the page they moved to is kept.
   */
  private _finishSubmit(
    context: SubmitNavigationContext,
    canNavigate: boolean,
  ): void {
    const takenOver = hasNewCallTakenOver({
      submittedCallId: context.callId,
      activityCallId: this.cxCall.activityCallId,
      callIds: this.cxCallMonitor.callIds,
    });
    // The log page only opens for a call that is over. A call still up when
    // its disposition was submitted keeps being worked on, and its log page
    // opens when it ends, see `CxRouteCoordinator`. The call can also end
    // while the submit is in flight.
    const isCallFinished =
      context.shouldGoToDialer ||
      (context.openedLogPage &&
        !this.cxCallMonitor.callIds.includes(context.callId));
    if (!canNavigate) {
      if (!takenOver && isCallFinished) {
        this.cxCall.setDialoutStatus(dialoutStatuses.idle);
        this.cxCall.setActivityCallId('');
      }
      if (this.viewCallId === context.viewCallId) {
        this._setViewCallId('');
        this._reset();
      }
      return;
    }
    if (takenOver) {
      // Only the form state belongs to the submitted call; the route and
      // the call pointer now belong to the call that was answered while
      // this submit was in flight.
      this._setViewCallId('');
      this._reset();
      return;
    }
    if (isCallFinished && context.openedLogPage && !context.shouldGoToDialer) {
      // The call ended while its disposition was sent: the page stays for
      // its call log.
      this.cxWrapUpLog.open(context.callId, false);
      this._reset();
      return;
    }
    if (isCallFinished) {
      this.cxCall.setDialoutStatus(dialoutStatuses.idle);
      this._setViewCallId('');
      this.router.replace(this.homePath);
      this._reset();
      this.cxCall.setActivityCallId('');
      return;
    }
    this.goBack();
  }

  get summary() {
    return this.cxCallDisposition.getDisposition(this.callId)?.summary || '';
  }

  /** Whether the call has a lead the Lead tab can show. */
  get hasLeadInfo(): boolean {
    return this.ringCXSideWidgets?.hasLeadInfo ?? false;
  }

  getUIProps(): UIProps<CxDispositionViewUIProps> {
    const callId = this.callId;
    const summaryState = this.cxCallDisposition.getSummaryState(callId);
    const segmentId = this.getSummarySegmentId(this.currentCall);
    return {
      currentCall: this.currentCall,
      callStatus: this.callStatus,
      submitBlockedByVoicemailDrop:
        this.callStatus === 'active' &&
        Boolean(this.currentCall?.hangupOnDisposition) &&
        Boolean(this.cxVoicemailDrop?.getDropStatus(callId)),
      saveStatus: this.saveStatus,
      dispositionPickList: this.dispositionPickList,
      validated: this.validated,
      required: this.required,
      dispositionData: this.cxCallDisposition.getDisposition(callId),
      basicInfo: this.basicInfo,
      isInbound: this.isInbound,
      isDisposed: this.cxCallDisposition.isDisposed(callId),
      isHistoryMode: this.isHistoryMode,
      isServerOnlyHistoryCall: this.isServerOnlyHistoryCall,
      isHistoryActivityLoading: this.isHistoryActivityLoading,
      historyActivityRowId: this.historyActivityRowId,
      historyActivity: this.historyActivity,
      historyActivityDraft: this.historyActivityDraft,
      historyDispositionName: this.historyDispositionName,
      hasHistoryCall: !!this.historyCall,
      hasLeadInfo: this.hasLeadInfo,
      showSubmitStep: this.showSubmitStep,
      showSummary: this.showSummary,
      segmentId,
      summary: this.summary,
      isSummaryFinal: summaryState?.isFinal || false,
      isSummaryLoading: summaryState?.isLoading || false,
      isSummaryEdited: summaryState?.isEditedAfterFinal || false,
      viewCallId: this.viewCallId,
      wrapUp: this.getWrapUpUIProps(callId),
    };
  }

  getWrapUpUIProps(callId: string): WrapUpUIProps {
    const bridge = this.ringCXAdapterBridge;
    const loaded = this.wrapUpLogCall;
    return {
      logMode: this.getWrapUpLogMode(callId),
      entry: this.cxWrapUpLog.get(callId) ?? null,
      hostName: this.hostName,
      logCallPage: bridge?.logCallPage,
      logCall: loaded?.id === callId ? loaded.call : null,
      logButtonTitle: bridge?.callLoggerTitle ?? null,
      logCallPageOwnerId: bridge?.logCallPageOwnerId ?? null,
      wrapUpStartTime: this.cxWorkingState.isPendingDisposition
        ? this.cxWorkingState.time
        : null,
    };
  }

  getUIFunctions(): UIFunctions<CxDispositionViewUIFunctions> {
    return {
      setViewCallId: (id: string) => this.setViewCallId(id),
      loadHistoryActivity: (id: string) => this.loadHistoryActivity(id),
      onUpdateHistoryActivityDraft: (
        field: 'agentNotes' | 'agentSummary',
        value: string,
      ) => this.updateHistoryActivityDraft(field, value),
      onBack: () => this.goBack(),
      onUpdateCallLog: (field, value) => this.onUpdateCallLog(field, value),
      onUpdateSummary: (value) => this.onUpdateSummary(value),
      disposeCall: () => this.disposeCall(),
      submitWrapUp: (input) => this.submitWrapUp(input),
      logLater: () => this.logLater(),
      prepareLogForm: (callId) => this.prepareWrapUpLogForm(callId),
      loadLogCall: (callId) => this.loadWrapUpLogCall(callId),
      onLogFormChange: (formData, keys) =>
        this.onWrapUpLogFormChange(formData, keys),
      onLogFormButtonClick: (buttonId, formData) =>
        this.onWrapUpLogFormButtonClick(buttonId, formData),
      onViewLead: async () => {
        await this.ringCXSideWidgets?.viewLeadInfo({
          type: 'call',
          callId: this.cxCall.activityCallId,
        });
      },
    };
  }

  component(_props?: CxDispositionViewProps) {
    const params = useParams<{ id?: string; method?: string }>();
    const { t } = useLocale(i18n);
    const { current: uiFunctions } = useRef(this.getUIFunctions());
    const tabsShown = useSideWidgetTabsShown();

    const uiProps = useConnector(() => this.getUIProps());

    const {
      currentCall,
      callStatus,
      submitBlockedByVoicemailDrop,
      saveStatus,
      dispositionPickList,
      validated,
      required,
      dispositionData,
      basicInfo,
      isInbound,
      isDisposed,
      isHistoryMode,
      showSubmitStep,
      showSummary,
      segmentId,
      summary,
      isSummaryFinal,
      isSummaryLoading,
      isSummaryEdited,
      isServerOnlyHistoryCall,
      isHistoryActivityLoading,
      historyActivityRowId,
      historyActivity,
      historyActivityDraft,
      historyDispositionName,
      hasHistoryCall,
      hasLeadInfo,
      wrapUp,
      viewCallId,
    } = uiProps;

    // Decided once per call id: the call becomes disposed and over while the
    // agent watches the submit succeed, which must not blank the page.
    const arrivalRef = useRef<{ id?: string; finished: boolean }>();
    if (!arrivalRef.current || arrivalRef.current.id !== params.id) {
      arrivalRef.current = {
        id: params.id,
        finished: !!params.id && this.isFinishedDisposition(params.id),
      };
    }
    const isFinishedOnArrival = arrivalRef.current.finished;

    useEffect(() => {
      if (!params.id) {
        return;
      }
      if (isFinishedOnArrival) {
        void this.leaveFinishedDisposition(params.id);
        return;
      }
      uiFunctions.setViewCallId(params.id);
    }, [params.id]);

    useEffect(() => {
      void this.reset();
    }, [params.id]);

    // A history row's recorded disposition lives on its activity record, which
    // is the only source for a call this browser never handled.
    useEffect(() => {
      if (isHistoryMode && params.id) {
        void uiFunctions.loadHistoryActivity(params.id);
      }
    }, [params.id, isHistoryMode]);

    useEffect(() => {
      const callId = params.id || this.callId;
      const canRequestSummary = !!callId &&
        !isHistoryMode &&
        showSummary &&
        !!segmentId &&
        (callStatus === 'active' || this.cxWorkingState.isPendingDisposition);
      if (!canRequestSummary) {
        return;
      }
      void this.requestConversationSummary(callId, callStatus);
    }, [params.id, callStatus, showSummary, segmentId, isHistoryMode]);

    if (isFinishedOnArrival) {
      return null;
    }

    const showCallEnded = callStatus === 'callEnd';
    // A campaign with "Hangup on Disp" makes the server end a live call on
    // submit, so the button says so, as in Agent One.
    const submitEndsCall =
      !showCallEnded && Boolean(currentCall?.hangupOnDisposition);
    const pageTitle = isHistoryMode
      ? (params.method === 'create' ? t('createCallLog') : t('updateCallLog'))
      : t('disposition');
    // The side widget tab already names the page and hides the back button.
    const header = tabsShown ? null : (
      <AppHeaderNav override resetImmediately>
        <PageHeader onBackClick={uiFunctions.onBack}>{pageTitle}</PageHeader>
      </AppHeaderNav>
    );
    // A Lead tab the agent closed after the call ended can be brought back
    // while the call is dispositioned, as Agent One keeps the lead on its
    // disposition screen. A history row's call log has no live call.
    const viewLeadButton =
      !isHistoryMode && hasLeadInfo ? (
        <IconButton
          symbol={ContactsMd}
          size="medium"
          variant="contained"
          color="secondary"
          onClick={() => void uiFunctions.onViewLead()}
          data-sign="dispositionViewLead"
          aria-label={t('viewLead')}
          TooltipProps={{ title: t('viewLead') }}
        />
      ) : undefined;
    const isHistoryActivityPending =
      isHistoryMode &&
      !!params.id &&
      (historyActivityRowId !== params.id || isHistoryActivityLoading);

    // A history row this browser never handled: there is no local call to
    // disposition, but the RingCX activity still holds what was recorded.
    if (!currentCall && (isServerOnlyHistoryCall || isHistoryActivityPending)) {
      return (
        <div className="flex flex-col h-full bg-neutral-base overflow-hidden">
          {header}
          {isHistoryActivityPending ? (
            <div
              className="flex-1 flex items-center justify-center"
              data-sign="historyActivityLoading"
            >
              <CircularProgressIndicator size="medium" />
            </div>
          ) : hasHistoryCall || historyActivity ? (
            <>
              <div className="flex-1 p-4 overflow-auto">
                <DispositionForm
                  // A single synthetic option renders the recorded disposition
                  // in the usual place. The real pick list only exists on a
                  // live call payload, so it stays disabled here. Falls back
                  // to the history row when activities are unavailable.
                  dispositionPickList={
                    historyDispositionName
                      ? [
                          {
                            dispositionId: RECORDED_DISPOSITION_ID,
                            disposition: historyDispositionName,
                          },
                        ]
                      : []
                  }
                  dispositionData={{
                    dispositionId: historyDispositionName
                      ? RECORDED_DISPOSITION_ID
                      : undefined,
                    notes: historyActivityDraft.agentNotes,
                  }}
                  validated={{ dispositionId: true, notes: true }}
                  required={{ notes: false }}
                  showSummary={showSummary}
                  summary={historyActivityDraft.agentSummary}
                  isSummaryFinal
                  isSummaryLoading={false}
                  disableDispositionSelect
                  onFieldChange={(field, value) => {
                    if (field === 'notes') {
                      uiFunctions.onUpdateHistoryActivityDraft(
                        'agentNotes',
                        value,
                      );
                    }
                  }}
                  onSummaryChange={(value) =>
                    uiFunctions.onUpdateHistoryActivityDraft(
                      'agentSummary',
                      value,
                    )
                  }
                  selectPlaceholder={t('pleaseSelect')}
                  dispositionErrorText={t('dispositionError')}
                  notesErrorText={t('notesRequired')}
                  dispositionLabel={t('disposition')}
                  notesLabel={t('notes')}
                  notesPlaceholder={t('enterNotes')}
                  summaryLabel={t('summary')}
                  summaryPlaceholder={t('summaryPlaceholder')}
                  summaryLoadingText={t('summaryLoading')}
                />
              </div>
              <div className="flex-shrink-0 p-4 border-t border-neutral-b4 shadow-[0_-2px_5px_0_rgba(0,0,0,0.15)]">
                <Button
                  data-sign="submitButton"
                  fullWidth
                  disabled={saveStatus === SaveStatus.SAVING}
                  onClick={() => void uiFunctions.disposeCall()}
                >
                  {saveStatus === SaveStatus.SAVED ? (
                    <Icon symbol={CheckMd} size="medium" />
                  ) : (
                    t('save')
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-neutral-b2">
              <p className="typography-mainText">{t('callLogNotFound')}</p>
            </div>
          )}
          <AppFooterNav />
        </div>
      );
    }

    // The route's call is set on the server just after the page mounts. Until
    // then the state is another call's, such as a call dispositioned during
    // the call before, which would start the page on its saved disposition.
    if (!isHistoryMode && params.id && viewCallId !== params.id) {
      return (
        <div className="flex flex-col h-full bg-neutral-base">
          {header}
          <div className="flex-1" />
          <AppFooterNav />
        </div>
      );
    }

    if (!currentCall) {
      return (
        <div className="flex flex-col h-full bg-neutral-base">
          {header}
          <div className="flex-1 flex items-center justify-center text-neutral-b2">
            <p className="typography-mainText">{t('noActiveCall')}</p>
          </div>
          <AppFooterNav />
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full bg-neutral-base overflow-hidden">
        {header}
        <WrapUpPanel
          // Each call's page starts afresh: Disposition first while it is to
          // be submitted, and no tab or form state from another call.
          key={params.id || this.callId}
          callId={params.id || this.callId}
          basicInfo={basicInfo}
          isInbound={isInbound}
          callEnded={showCallEnded}
          viewLeadButton={viewLeadButton}
          showSubmitStep={showSubmitStep}
          isDisposed={isDisposed}
          saveStatus={saveStatus}
          submitEndsCall={submitEndsCall}
          submitBlockedByVoicemailDrop={submitBlockedByVoicemailDrop}
          dispositionPickList={dispositionPickList}
          dispositionData={dispositionData}
          validated={validated}
          required={required}
          showSummary={showSummary}
          summary={summary}
          isSummaryFinal={isSummaryFinal}
          isSummaryLoading={isSummaryLoading}
          isSummaryEdited={isSummaryEdited}
          wrapUp={wrapUp}
          onUpdateCallLog={uiFunctions.onUpdateCallLog}
          onUpdateSummary={uiFunctions.onUpdateSummary}
          onSubmit={uiFunctions.submitWrapUp}
          onLogLater={uiFunctions.logLater}
          onPrepareLogForm={uiFunctions.prepareLogForm}
          onLoadLogCall={uiFunctions.loadLogCall}
          onLogFormChange={uiFunctions.onLogFormChange}
          onLogFormButtonClick={uiFunctions.onLogFormButtonClick}
        />
        <AppFooterNav />
      </div>
    );
  }
}

export { CxDispositionView };
