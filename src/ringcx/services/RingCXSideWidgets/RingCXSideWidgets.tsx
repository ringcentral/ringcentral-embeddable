import {
  delegate,
  injectable,
  PortManager,
  RcModule,
  useConnector,
  watch,
} from '@ringcentral-integration/next-core';
import React, { useRef } from 'react';

import {
  SideWidgetView,
  type SideWidgetCloseTabOptions,
  type SideWidgetContentHandle,
  type SideWidgetContentViewProps,
} from '../../../app/views/SideWidgetView';
import { AgentAssistantPanel } from '../../components/AgentAssistantPanel';
import { t as tAssistant } from '../../components/AgentAssistantPanel/i18n';
import { AgentScriptPanel } from '../../components/AgentScriptPanel';
import { t as tScript } from '../../components/AgentScriptPanel/i18n';
import { t as tLead } from '../../components/LeadInfoPanel/i18n';
import { t as tPass } from '../../components/ManualPassForm/i18n';
import { CxAgentAssistant } from '../CxAgentAssistant';
import { CxAgentScript } from '../CxAgentScript';
import { CxCall } from '../CxCall';
import type { CxBaseCall } from '../CxClient/interfaces';
import { CxLeadInfo } from '../CxLeadInfo';
import type { CxLeadInfoTarget } from '../CxLeadInfo';
import { CxLeadInfoView } from '../../views/CxLeadInfoView';
import { CxLeadUpdateView } from '../../views/CxLeadUpdateView';
import { CxManualPassView } from '../../views/CxManualPassView';
import { CxPresence } from '../CxPresence';

export const RINGCX_AGENT_SCRIPT_WIDGET_ID = 'ringcx-agent-script';
export const RINGCX_AGENT_ASSISTANT_WIDGET_ID = 'ringcx-agent-assistant';
export const RINGCX_LEAD_INFO_WIDGET_ID = 'ringcx-lead-info';
export const RINGCX_MANUAL_PASS_WIDGET_ID = 'ringcx-manual-pass';
export const RINGCX_LEAD_UPDATE_WIDGET_ID = 'ringcx-lead-update';

type RingCXWidgetId =
  | typeof RINGCX_AGENT_SCRIPT_WIDGET_ID
  | typeof RINGCX_LEAD_INFO_WIDGET_ID
  | typeof RINGCX_AGENT_ASSISTANT_WIDGET_ID;

/**
 * Panel width both widgets were built for in the standalone RingCX app; the
 * Agent Script renderer lays out its GridStack desktop geometry for it.
 */
export const RINGCX_SIDE_WIDGET_WIDTH = 360;

/**
 * The call, not the agent, closes the widgets, so a drawer they leave empty
 * folds instead of staying as a blank column.
 */
const APP_CLOSE: SideWidgetCloseTabOptions = { collapseWhenLast: true };

/**
 * Shows the RingCX Agent Script, Lead and Agent Assistant in the host side
 * widget.
 *
 * Each widget is a pure function of its service's availability for the call
 * being worked on: it opens when that turns on and closes when it turns off,
 * so answering, disposition and logout are all covered by one rule. An agent
 * who closes a tab keeps it closed until the availability changes again or the
 * call screen's toggle brings it back.
 *
 * Both tabs are `global`, so contact-scoped host tabs, such as the Apps tab a
 * RingEX call opens, never evict them mid-call. While a CX call is up they
 * also keep focus when the call opens its Apps tab, which happens right after
 * the script loads on an outbound or auto-answered call.
 *
 * Both are kept mounted while another tab is active: each hosts an iframe that
 * would otherwise reload, losing the script progress or re-running the
 * assistant's single-use auth handshake, on every tab switch.
 *
 * The Lead tab opens with each answered call that has a lead, and the agent
 * can also open it from the Leads tab or the call screen's toggle;
 * `CxLeadInfo` decides what it shows. It is the active tab only when the
 * call has no script, as the script comes first.
 */
@injectable({
  name: 'RingCXSideWidgets',
})
export class RingCXSideWidgets extends RcModule {
  constructor(
    private readonly _sideWidgetView: SideWidgetView,
    private readonly _cxAgentScript: CxAgentScript,
    private readonly _cxAgentAssistant: CxAgentAssistant,
    private readonly _cxCall: CxCall,
    private readonly _cxPresence: CxPresence,
    private readonly _cxLeadInfo: CxLeadInfo,
    private readonly _cxLeadInfoView: CxLeadInfoView,
    private readonly _cxManualPassView: CxManualPassView,
    private readonly _cxLeadUpdateView: CxLeadUpdateView,
    private readonly _portManager: PortManager,
  ) {
    super();
    // `onInit` binds the widgets' auto-open; the Lead, Manual pass and Update
    // lead tabs' views only render there, so their dependencies must not
    // hold that back.
    this._ignoreModuleReadiness(this._cxLeadInfoView);
    this._ignoreModuleReadiness(this._cxManualPassView);
    this._ignoreModuleReadiness(this._cxLeadUpdateView);
  }

  private _stopWatchers: Array<() => void> = [];

  private readonly _onScriptResultChange = (
    callId: string,
    result: Parameters<CxAgentScript['updateScriptResult']>[1],
  ) => this._cxAgentScript.updateScriptResult(callId, result);

  private readonly _onScriptDisposition = (
    callId: string,
    disposition: Parameters<CxAgentScript['updateDisposition']>[1],
  ) => this._cxAgentScript.updateDisposition(callId, disposition);

  private readonly _getKnowledgeBaseArticles = (
    callId: string,
    groupIds: number[],
  ) => this._cxAgentScript.getKnowledgeBaseArticles(callId, groupIds);

  private readonly _getScriptModel = (call: CxBaseCall | null) =>
    this._cxAgentScript.getScriptModel(call);

  private readonly _getAssistantParams = (callId: string) =>
    this._cxAgentAssistant.getFrameParams(callId);

  private readonly _AgentScriptContent = () => {
    const props = useConnector(() => {
      const callId = this._cxCall.activityCallId;
      const call = this._cxPresence.callsMapping[callId] ?? null;
      const flags = this._cxAgentScript.getScriptFlags(call);
      return {
        callId,
        call,
        pageUrl: this._cxAgentScript.pageUrl,
        script: this._cxAgentScript.getScriptForCall(callId),
        loading: this._cxAgentScript.getScriptLoading(callId),
        error: this._cxAgentScript.getScriptError(callId),
        isOnHold: flags.isOnHold,
        isRecording: flags.isRecording,
      };
    });
    const { isOnHold, isRecording, ...panelProps } = props;
    // The frame closes its port whenever these change identity.
    const { current: uiFunctions } = useRef({
      onResultChange: this._onScriptResultChange,
      onDisposition: this._onScriptDisposition,
      getKnowledgeBaseArticles: this._getKnowledgeBaseArticles,
      getScriptModel: this._getScriptModel,
    });
    return (
      <AgentScriptPanel
        {...panelProps}
        {...uiFunctions}
        flags={{ isOnHold, isRecording }}
      />
    );
  };

  private readonly _AgentAssistantContent = () => {
    const { callId } = useConnector(() => ({
      callId: this._cxCall.activityCallId,
    }));
    return (
      <AgentAssistantPanel
        callId={callId}
        getParams={this._getAssistantParams}
      />
    );
  };

  private readonly _onCloseLeadInfo = () => {
    void this.closeLeadInfo();
  };

  private readonly _LeadInfoContent = ({
    showCloseButton,
  }: SideWidgetContentViewProps) => {
    const LeadInfoView = this._cxLeadInfoView.component;
    return (
      <LeadInfoView
        showCloseButton={showCloseButton}
        onClose={this._onCloseLeadInfo}
        onOpenManualPass={this._onOpenManualPass}
        onOpenLeadUpdate={this._onOpenLeadUpdate}
      />
    );
  };

  private readonly _onOpenLeadUpdate = () => {
    void this.openLeadUpdate();
  };

  private readonly _onCloseLeadUpdate = () => {
    void this.closeLeadUpdate();
  };

  private readonly _LeadUpdateContent = ({
    showCloseButton,
  }: SideWidgetContentViewProps) => {
    const LeadUpdateView = this._cxLeadUpdateView.component;
    return (
      <LeadUpdateView
        showCloseButton={showCloseButton}
        onClose={this._onCloseLeadUpdate}
      />
    );
  };

  private readonly _onOpenManualPass = (requestId: string) => {
    void this.openManualPass(requestId);
  };

  private readonly _onCloseManualPass = () => {
    void this.closeManualPass();
  };

  private readonly _ManualPassContent = ({
    showCloseButton,
  }: SideWidgetContentViewProps) => {
    const ManualPassView = this._cxManualPassView.component;
    return (
      <ManualPassView
        showCloseButton={showCloseButton}
        onClose={this._onCloseManualPass}
      />
    );
  };

  /**
   * The CX tabs stay in front of a call's apps only while a CX call is up,
   * such as when the CX call's own audio leg opens the Apps tab. After the
   * call ended, during its disposition, a RingEX call's apps take focus.
   */
  private readonly _isCxCallUp = (): boolean =>
    this._cxPresence.callIds.length > 0 || this._cxCall.isDialing;

  private readonly _agentScriptHandle =
    this._sideWidgetView.createOrUpdateContent({
      id: RINGCX_AGENT_SCRIPT_WIDGET_ID,
      name: tScript('agentScript'),
      getName: () => tScript('agentScript'),
      scope: 'global',
      keepActiveOnCallApps: this._isCxCallUp,
      keepMounted: true,
      minExpandedWidth: RINGCX_SIDE_WIDGET_WIDTH,
      view: this._AgentScriptContent,
    });

  private readonly _agentAssistantHandle =
    this._sideWidgetView.createOrUpdateContent({
      id: RINGCX_AGENT_ASSISTANT_WIDGET_ID,
      name: tAssistant('agentAssistant'),
      getName: () => tAssistant('agentAssistant'),
      scope: 'global',
      keepActiveOnCallApps: this._isCxCallUp,
      keepMounted: true,
      minExpandedWidth: RINGCX_SIDE_WIDGET_WIDTH,
      view: this._AgentAssistantContent,
    });

  private readonly _leadInfoHandle = this._sideWidgetView.createOrUpdateContent(
    {
      id: RINGCX_LEAD_INFO_WIDGET_ID,
      name: tLead('lead'),
      getName: () => tLead('lead'),
      scope: 'global',
      keepActiveOnCallApps: this._isCxCallUp,
      minExpandedWidth: RINGCX_SIDE_WIDGET_WIDTH,
      view: this._LeadInfoContent,
      // Runs on the port that owns the tabs, however the tab was closed.
      onClose: () => this._cxLeadInfo.setTarget(null),
    },
  );

  private readonly _manualPassHandle =
    this._sideWidgetView.createOrUpdateContent({
      id: RINGCX_MANUAL_PASS_WIDGET_ID,
      name: tPass('manualPass'),
      getName: () => tPass('manualPass'),
      scope: 'global',
      keepActiveOnCallApps: this._isCxCallUp,
      minExpandedWidth: RINGCX_SIDE_WIDGET_WIDTH,
      view: this._ManualPassContent,
      onClose: () => this._cxManualPassView.setRequestId(null),
    });

  private readonly _leadUpdateHandle =
    this._sideWidgetView.createOrUpdateContent({
      id: RINGCX_LEAD_UPDATE_WIDGET_ID,
      name: tLead('updateLead'),
      getName: () => tLead('updateLead'),
      scope: 'global',
      keepActiveOnCallApps: this._isCxCallUp,
      // Keeps the draft while the agent looks at the script or the lead.
      keepMounted: true,
      minExpandedWidth: RINGCX_SIDE_WIDGET_WIDTH,
      view: this._LeadUpdateContent,
      onClose: () => this._cxLeadUpdateView.setTarget(null),
    });

  get hasScript(): boolean {
    return this._cxAgentScript.hasVisibleScript;
  }

  get hasAssistant(): boolean {
    return this._cxAgentAssistant.hasVisibleAssistant;
  }

  /** Whether the call being worked on has a lead the Lead tab can show. */
  get hasLeadInfo(): boolean {
    return this._cxLeadInfo.canViewCallLead(this._cxCall.activityCallId);
  }

  /** Names of the widgets available for the call being worked on. */
  get availableWidgetNames(): string[] {
    return this._availableWidgetIds.map((id) => this._getWidgetName(id));
  }

  /**
   * Whether every widget available for the call is on screen, so the call
   * screen's toggle puts them away rather than bringing the missing ones in.
   */
  get visible(): boolean {
    const ids = this._availableWidgetIds;
    return (
      this._sideWidgetView.isOpen &&
      ids.length > 0 &&
      ids.every((id) => this._isWidgetOpen(id))
    );
  }

  /**
   * Widgets the call being worked on has, in tab order: the script first, as
   * in the standalone RingCX app, then the lead, then the assistant.
   */
  private get _availableWidgetIds(): RingCXWidgetId[] {
    return [
      ...(this.hasScript ? [RINGCX_AGENT_SCRIPT_WIDGET_ID] : []),
      ...(this.hasLeadInfo ? [RINGCX_LEAD_INFO_WIDGET_ID] : []),
      ...(this.hasAssistant ? [RINGCX_AGENT_ASSISTANT_WIDGET_ID] : []),
    ] as RingCXWidgetId[];
  }

  /**
   * Bound once the store slice exists, on the port that owns the side widget
   * tabs. The panels run on the clients, but the tabs are server state.
   */
  override onInit(): void {
    if (this._portManager.shared && !this._portManager.isServer) return;
    // Opened in reverse, as new tabs go first: Script, Lead, Assistant.
    this._syncAssistant(this.hasAssistant);
    this._openCallLeadInfo(
      this.hasLeadInfo ? this._cxCall.activityCallId : '',
    );
    this._syncScript(this.hasScript);
    this._stopWatchers = [
      watch(
        this,
        () => this.hasScript,
        (visible) => this._syncScript(visible),
      ),
      watch(
        this,
        () => this.hasAssistant,
        (visible) => this._syncAssistant(visible),
      ),
      watch(
        this,
        () => this._cxCall.activityCallId,
        (callId) => this._cxLeadInfo.followActivityCall(callId),
      ),
      watch(
        this,
        () => (this.hasLeadInfo ? this._cxCall.activityCallId : ''),
        (callId) => this._openCallLeadInfo(callId),
      ),
      watch(
        this,
        () => !!this._cxLeadInfo.info,
        (resolved) => this._syncLeadInfo(resolved),
      ),
      watch(
        this,
        () => !!this._cxManualPassView.lead,
        (hasLead) => this._syncManualPass(hasLead),
      ),
      watch(
        this,
        () => this._isCxCallUp(),
        (isCallUp) => this._closeManualPassOnCall(isCallUp),
      ),
    ];
  }

  override onReset(): void {
    this._stopWatchers.forEach((stop) => stop());
    this._stopWatchers = [];
    this._closeWidgets(APP_CLOSE);
    this._sideWidgetView.closeContent(this._manualPassHandle, APP_CLOSE);
    this._sideWidgetView.closeContent(this._leadUpdateHandle, APP_CLOSE);
  }

  /**
   * Put the available widgets away when all are on screen; otherwise bring in
   * the missing ones, the first of them active.
   */
  @delegate('server')
  async toggle(): Promise<void> {
    if (this.visible) {
      this._closeWidgets();
      return;
    }
    const missingIds = this._availableWidgetIds.filter(
      (id) => !this._isWidgetOpen(id),
    );
    // Opened in reverse so the tabs keep their order and the first missing
    // one ends up active.
    missingIds
      .reverse()
      .forEach((id, index, ids) =>
        this._openWidgetById(id, index === ids.length - 1),
      );
  }

  /**
   * Opens the Lead tab on a preview lead or a call's lead, active.
   */
  @delegate('server')
  async viewLeadInfo(target: CxLeadInfoTarget): Promise<void> {
    this._openLeadInfo(target, true);
  }

  private _syncScript(visible: boolean): void {
    if (visible) {
      this._openWidget(this._agentScriptHandle, true);
    } else {
      this._sideWidgetView.closeContent(this._agentScriptHandle, APP_CLOSE);
    }
  }

  private _syncAssistant(visible: boolean): void {
    if (visible) {
      // The script comes first, as it did in the standalone RingCX app; the
      // assistant joins it as a background tab.
      this._openWidget(
        this._agentAssistantHandle,
        !this.hasScript && !this.hasLeadInfo,
      );
    } else {
      this._sideWidgetView.closeContent(this._agentAssistantHandle, APP_CLOSE);
    }
  }

  /**
   * Closes the Lead tab from its own header, when no tab bar shows it.
   */
  /**
   * Opens the Manual pass tab on a fetched lead, active. A lead that is no
   * longer fetched opens nothing.
   */
  @delegate('server')
  async openManualPass(requestId: string): Promise<void> {
    this._cxManualPassView.setRequestId(requestId);
    if (!this._cxManualPassView.lead) {
      this._cxManualPassView.setRequestId(null);
      return;
    }
    this._openWidget(this._manualPassHandle, true);
  }

  /**
   * Opens the Update lead tab, active, on the lead the Lead tab shows. Its
   * campaign must let the agent edit leads.
   */
  @delegate('server')
  async openLeadUpdate(): Promise<void> {
    const info = this._cxLeadInfo.info;
    if (!info) {
      return;
    }
    this._cxLeadUpdateView.setTarget({
      lead: info.lead,
      phoneNumbers: info.phoneNumbers,
      auxLabels: info.auxLabels,
    });
    this._openWidget(this._leadUpdateHandle, true);
  }

  /** Closes the Update lead tab, from its own back or after a save. */
  @delegate('server')
  async closeLeadUpdate(): Promise<void> {
    this._sideWidgetView.closeContent(this._leadUpdateHandle);
  }

  /** Closes the Manual pass tab, from its own back or after a pass. */
  @delegate('server')
  async closeManualPass(): Promise<void> {
    this._sideWidgetView.closeContent(this._manualPassHandle);
  }

  @delegate('server')
  async closeLeadInfo(): Promise<void> {
    this._sideWidgetView.closeContent(this._leadInfoHandle);
  }

  /**
   * Opens the Lead tab on each newly answered call with a lead, behind the
   * script when the call has one.
   */
  private _openCallLeadInfo(callId: string): void {
    if (callId) {
      this._openLeadInfo({ type: 'call', callId }, !this.hasScript);
    }
  }

  /**
   * A CX call starting, dialed or inbound, puts the Manual pass tab away:
   * leads cannot be passed during a call.
   */
  private _closeManualPassOnCall(isCallUp: boolean): void {
    if (isCallUp) {
      this._sideWidgetView.closeContent(this._manualPassHandle, APP_CLOSE);
    }
  }

  /**
   * The Manual pass tab closes once its lead is passed or no longer fetched.
   */
  private _syncManualPass(hasLead: boolean): void {
    if (!hasLead) {
      this._sideWidgetView.closeContent(this._manualPassHandle, APP_CLOSE);
    }
  }

  /**
   * The Lead tab closes once its lead is gone.
   */
  private _syncLeadInfo(resolved: boolean): void {
    if (!resolved) {
      this._sideWidgetView.closeContent(this._leadInfoHandle, APP_CLOSE);
    }
  }

  private _openLeadInfo(target: CxLeadInfoTarget, activate: boolean): void {
    this._cxLeadInfo.setTarget(target);
    if (!this._cxLeadInfo.info) {
      this._cxLeadInfo.setTarget(null);
      return;
    }
    this._openWidget(this._leadInfoHandle, activate);
  }

  private _openWidgetById(id: RingCXWidgetId, activate: boolean): void {
    if (id === RINGCX_LEAD_INFO_WIDGET_ID) {
      this._openLeadInfo(
        { type: 'call', callId: this._cxCall.activityCallId },
        activate,
      );
      return;
    }
    this._openWidget(
      id === RINGCX_AGENT_SCRIPT_WIDGET_ID
        ? this._agentScriptHandle
        : this._agentAssistantHandle,
      activate,
    );
  }

  /**
   * The Lead tab counts as open only while it shows the call's own lead.
   */
  private _isWidgetOpen(id: RingCXWidgetId): boolean {
    const isTabOpen = this._sideWidgetView.tabs.some((tab) => tab.id === id);
    if (!isTabOpen || id !== RINGCX_LEAD_INFO_WIDGET_ID) {
      return isTabOpen;
    }
    const target = this._cxLeadInfo.target;
    return (
      target?.type === 'call' && target.callId === this._cxCall.activityCallId
    );
  }

  private _getWidgetName(id: RingCXWidgetId): string {
    if (id === RINGCX_AGENT_SCRIPT_WIDGET_ID) {
      return tScript('agentScript');
    }
    if (id === RINGCX_LEAD_INFO_WIDGET_ID) {
      return tLead('lead');
    }
    return tAssistant('agentAssistant');
  }

  private _openWidget(
    handle: SideWidgetContentHandle,
    activate: boolean,
  ): void {
    this._sideWidgetView.openContent(handle, { activate, expand: true });
  }

  private _closeWidgets(options?: SideWidgetCloseTabOptions): void {
    this._sideWidgetView.closeContent(this._agentScriptHandle, options);
    this._sideWidgetView.closeContent(this._leadInfoHandle, options);
    this._sideWidgetView.closeContent(this._agentAssistantHandle, options);
  }
}
