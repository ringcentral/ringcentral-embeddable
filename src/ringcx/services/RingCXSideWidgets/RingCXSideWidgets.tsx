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
  type SideWidgetContentHandle,
} from '../../../app/views/SideWidgetView';
import { AgentAssistantPanel } from '../../components/AgentAssistantPanel';
import { t as tAssistant } from '../../components/AgentAssistantPanel/i18n';
import { AgentScriptPanel } from '../../components/AgentScriptPanel';
import { t as tScript } from '../../components/AgentScriptPanel/i18n';
import { CxAgentAssistant } from '../CxAgentAssistant';
import { CxAgentScript } from '../CxAgentScript';
import { CxCall } from '../CxCall';
import type { CxBaseCall } from '../CxClient/interfaces';
import { CxPresence } from '../CxPresence';

export const RINGCX_AGENT_SCRIPT_WIDGET_ID = 'ringcx-agent-script';
export const RINGCX_AGENT_ASSISTANT_WIDGET_ID = 'ringcx-agent-assistant';

/**
 * Shows the RingCX Agent Script and Agent Assistant in the host side widget.
 *
 * Each widget is a pure function of its service's availability for the call
 * being worked on: it opens when that turns on and closes when it turns off,
 * so answering, disposition and logout are all covered by one rule. An agent
 * who closes a tab keeps it closed until the availability changes again or the
 * call screen's toggle brings it back.
 *
 * Both tabs are `global`, so contact-scoped host tabs, such as the Apps tab a
 * RingEX call opens, never evict them mid-call. They also keep focus when the
 * call opens its Apps tab, which happens right after the script loads on an
 * outbound or auto-answered call.
 *
 * Both are kept mounted while another tab is active: each hosts an iframe that
 * would otherwise reload, losing the script progress or re-running the
 * assistant's single-use auth handshake, on every tab switch.
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
    private readonly _portManager: PortManager,
  ) {
    super();
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

  private readonly _agentScriptHandle =
    this._sideWidgetView.createOrUpdateContent({
      id: RINGCX_AGENT_SCRIPT_WIDGET_ID,
      name: tScript('agentScript'),
      scope: 'global',
      keepActiveOnCallApps: true,
      keepMounted: true,
      view: this._AgentScriptContent,
    });

  private readonly _agentAssistantHandle =
    this._sideWidgetView.createOrUpdateContent({
      id: RINGCX_AGENT_ASSISTANT_WIDGET_ID,
      name: tAssistant('agentAssistant'),
      scope: 'global',
      keepActiveOnCallApps: true,
      keepMounted: true,
      view: this._AgentAssistantContent,
    });

  get hasScript(): boolean {
    return this._cxAgentScript.hasVisibleScript;
  }

  get hasAssistant(): boolean {
    return this._cxAgentAssistant.hasVisibleAssistant;
  }

  /** Names of the widgets available for the call being worked on. */
  get availableWidgetNames(): string[] {
    return [
      ...(this.hasScript ? [tScript('agentScript')] : []),
      ...(this.hasAssistant ? [tAssistant('agentAssistant')] : []),
    ];
  }

  /** Whether one of the RingCX widgets is on screen. */
  get visible(): boolean {
    return (
      this._sideWidgetView.isOpen &&
      this._sideWidgetView.tabs.some(
        ({ id }) =>
          id === RINGCX_AGENT_SCRIPT_WIDGET_ID ||
          id === RINGCX_AGENT_ASSISTANT_WIDGET_ID,
      )
    );
  }

  /**
   * Bound once the store slice exists, on the port that owns the side widget
   * tabs. The panels run on the clients, but the tabs are server state.
   */
  override onInit(): void {
    if (this._portManager.shared && !this._portManager.isServer) return;
    this._syncScript(this.hasScript);
    this._syncAssistant(this.hasAssistant);
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
    ];
  }

  override onReset(): void {
    this._stopWatchers.forEach((stop) => stop());
    this._stopWatchers = [];
    this._closeWidgets();
  }

  /** Show the available widgets, or put them away when one is on screen. */
  @delegate('server')
  async toggle(): Promise<void> {
    if (this.visible) {
      this._closeWidgets();
      return;
    }
    // Opened in reverse so the script ends up as the first, active tab.
    if (this.hasAssistant) {
      this._openWidget(this._agentAssistantHandle, !this.hasScript);
    }
    if (this.hasScript) {
      this._openWidget(this._agentScriptHandle, true);
    }
  }

  private _syncScript(visible: boolean): void {
    if (visible) {
      this._openWidget(this._agentScriptHandle, true);
    } else {
      this._sideWidgetView.closeContent(this._agentScriptHandle);
    }
  }

  private _syncAssistant(visible: boolean): void {
    if (visible) {
      // The script comes first, as it did in the standalone RingCX app; the
      // assistant joins it as a background tab.
      this._openWidget(this._agentAssistantHandle, !this.hasScript);
    } else {
      this._sideWidgetView.closeContent(this._agentAssistantHandle);
    }
  }

  private _openWidget(
    handle: SideWidgetContentHandle,
    activate: boolean,
  ): void {
    // Tab names are copied into the tab when it opens, so the current locale
    // is applied here rather than when the chunk loaded.
    const name =
      handle === this._agentScriptHandle
        ? tScript('agentScript')
        : tAssistant('agentAssistant');
    this._sideWidgetView.updateContent(handle, { ...handle.options, name });
    this._sideWidgetView.openContent(handle, { activate, expand: true });
  }

  private _closeWidgets(): void {
    this._sideWidgetView.closeContent(this._agentScriptHandle);
    this._sideWidgetView.closeContent(this._agentAssistantHandle);
  }
}
