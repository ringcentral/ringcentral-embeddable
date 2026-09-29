import {
  action,
  delegate,
  injectable,
  optional,
  PortManager,
  RcModule,
  state,
} from '@ringcentral-integration/next-core';

import { CxActiveCallControl } from '../CxActiveCallControl';
import { CxAuth } from '../CxAuth';
import { CxCall } from '../CxCall';
import { CxCallDisposition } from '../CxCallDisposition';
import { CxClient } from '../CxClient';
import type {
  CxAgentScriptData,
  CxAgentScriptResult,
  CxBaseCall,
  CxCallDispositionItem,
} from '../CxClient/interfaces';
import { CxPresence } from '../CxPresence';
import type {
  CxAgentScriptFlags,
  CxAgentScriptOptions,
  CxCallScriptErrorMapping,
  CxCallScriptLoadingMapping,
  CxCallScriptMapping,
  CxCallScriptResultMapping,
} from './CxAgentScript.interface';
import {
  formatAgentScriptModel,
  type CxAgentScriptModel,
} from './formatAgentScriptModel';
import { formatAgentScriptResult } from './formatAgentScriptResult';

/**
 * Server-authoritative Agent Script lifecycle.
 *
 * Loads the script of an answered call, keeps the agent's answers until the
 * disposition saves them, and serves the renderer frame's requests. The frame
 * itself is a separately hosted page (Decision D9) shown by
 * `RingCXSideWidgets`; browser-only Engage SDK calls are delegated by
 * `CxClient` to the main client.
 */
@injectable({
  name: 'CxAgentScript',
})
class CxAgentScript extends RcModule {
  constructor(
    private cxClient: CxClient,
    private cxAuth: CxAuth,
    private cxCall: CxCall,
    private cxPresence: CxPresence,
    private cxCallDisposition: CxCallDisposition,
    private cxActiveCallControl: CxActiveCallControl,
    private portManager: PortManager,
    @optional('CxAgentScriptOptions')
    private cxAgentScriptOptions?: CxAgentScriptOptions,
  ) {
    super();
    if (this.portManager.shared) {
      this.portManager.onServer(() => this.initialize());
    } else {
      this.initialize();
    }
  }

  @state
  callScriptMapping: CxCallScriptMapping = {};

  @state
  callScriptLoadingMapping: CxCallScriptLoadingMapping = {};

  @state
  callScriptErrorMapping: CxCallScriptErrorMapping = {};

  /**
   * The latest answers per call. Shared state rather than a server field, so
   * a renderer frame that remounts (the side widget only mounts its current
   * tab) reopens with what the agent already entered.
   */
  @state
  callScriptResultMapping: CxCallScriptResultMapping = {};

  get enabled(): boolean {
    return !!(
      this.cxAgentScriptOptions?.enabled && this.cxAgentScriptOptions.pageUrl
    );
  }

  get pageUrl(): string {
    return this.cxAgentScriptOptions?.pageUrl ?? '';
  }

  get currentCallScript(): CxAgentScriptData | null {
    return this.getScriptForCall(this.cxCall.activityCallId);
  }

  /**
   * Whether the Agent Script side widget should be on screen: there is a script,
   * a load in flight, or a load error for the call being worked on.
   */
  get hasVisibleScript(): boolean {
    if (!this.enabled) return false;
    const callId = this.cxCall.activityCallId;
    if (!callId) return false;
    return !!(
      this.callScriptMapping[callId] ||
      this.callScriptLoadingMapping[callId] ||
      this.callScriptErrorMapping[callId]
    );
  }

  @action
  private _setCallScript(callId: string, script: CxAgentScriptData) {
    this.callScriptMapping[callId] = script;
    this.callScriptLoadingMapping[callId] = false;
    this.callScriptErrorMapping[callId] = null;
  }

  @action
  private _setCallScriptLoading(callId: string, loading: boolean) {
    this.callScriptLoadingMapping[callId] = loading;
    if (loading) {
      this.callScriptErrorMapping[callId] = null;
    }
  }

  @action
  private _setCallScriptError(callId: string, error: string) {
    this.callScriptLoadingMapping[callId] = false;
    this.callScriptErrorMapping[callId] = error;
  }

  @action
  private _setCallScriptResult(callId: string, result: CxAgentScriptResult) {
    this.callScriptResultMapping[callId] = result;
  }

  @action
  private _removeCallScript(callId: string) {
    delete this.callScriptMapping[callId];
    delete this.callScriptLoadingMapping[callId];
    delete this.callScriptErrorMapping[callId];
    delete this.callScriptResultMapping[callId];
  }

  @action
  private _clearCallScripts() {
    this.callScriptMapping = {};
    this.callScriptLoadingMapping = {};
    this.callScriptErrorMapping = {};
    this.callScriptResultMapping = {};
  }

  private initialize(): void {
    this.cxPresence.onCallAnswered((call) => {
      if (!this.getIsAgentScript(call)) return;
      const callId = this.getCallId(call);
      if (!callId) return;
      void this.loadScript(callId, call!.scriptId, call!.scriptVersion);
    });

    this.cxAuth.beforeAgentLogout(() => {
      this._clearCallScripts();
    });
  }

  getCallId(call?: CxBaseCall | null): string {
    if (!call?.uii || !call.session?.sessionId) return '';
    return this.cxClient.encodeUii({
      uii: call.uii,
      sessionId: call.session.sessionId,
    });
  }

  getIsAgentScript(call?: CxBaseCall | null): boolean {
    return !!(this.enabled && call?.scriptId);
  }

  getScriptForCall(callId: string): CxAgentScriptData | null {
    return this.callScriptMapping[callId] ?? null;
  }

  getScriptLoading(callId: string): boolean {
    return this.callScriptLoadingMapping[callId] ?? false;
  }

  getScriptError(callId: string): string | null {
    return this.callScriptErrorMapping[callId] ?? null;
  }

  /**
   * Build the object the renderer interpolates `{{model.*}}` tags against.
   *
   * Built here rather than inside the renderer frame so that only the agent
   * fields the script contract exposes cross the frame boundary.
   */
  getScriptModel(call?: CxBaseCall | null): CxAgentScriptModel {
    const callId = this.getCallId(call);
    return formatAgentScriptModel(
      call,
      this.cxAuth.agentSettings,
      this.callScriptResultMapping[callId]?.model,
    );
  }

  /**
   * Hold and recording state for the renderer's `isOnHold` / `isRecording`
   * callbacks.
   */
  getScriptFlags(call?: CxBaseCall | null): CxAgentScriptFlags {
    const callWithHold = call as (CxBaseCall & { isHold?: boolean }) | null;
    const isRecording =
      this.cxActiveCallControl.isRecording ??
      call?.agentRecording?.agentRecording;
    return {
      isOnHold: !!(callWithHold?.isHold ?? callWithHold?.hold),
      isRecording: !!isRecording,
    };
  }

  @delegate('server')
  async loadScript(
    callId: string,
    scriptId: string,
    version: string | null = null,
  ): Promise<CxAgentScriptData | null> {
    if (!callId || !scriptId) return null;
    if (this.callScriptMapping[callId]?.scriptId === scriptId) {
      return this.callScriptMapping[callId];
    }

    this._setCallScriptLoading(callId, true);
    try {
      const response = await this.cxClient.getScript(scriptId, version ?? '');
      const result: CxAgentScriptData = {
        scriptId: response.scriptId,
        groupId: '',
        accountId: '',
        name: response.scriptName ?? '',
        description: '',
        created: '',
        updated: '',
        isActive: true,
        data: JSON.parse(response.json),
      };
      this._setCallScript(callId, result);
      return result;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to load Agent Script';
      this._setCallScriptError(callId, message);
      this.logger.error('Failed to load Agent Script', error);
      return null;
    }
  }

  @delegate('server')
  async updateScriptResult(
    callId: string,
    data: CxAgentScriptResult,
  ): Promise<void> {
    if (!callId || !this.callScriptMapping[callId]) return;
    this._setCallScriptResult(callId, data);
  }

  @delegate('server')
  async updateDisposition(
    callId: string,
    data: CxCallDispositionItem,
  ): Promise<void> {
    if (!callId) return;
    const current = this.cxCallDisposition.getDisposition(callId);
    this.cxCallDisposition.setDisposition(callId, {
      dispositionId: data.dispositionId,
      notes: data.notes ?? current?.notes ?? '',
      summary: current?.summary ?? '',
    });
  }

  @delegate('server')
  async getKnowledgeBaseArticles(
    callId: string,
    knowledgeBaseGroupIds: number[],
  ): Promise<unknown> {
    if (!callId || !this.callScriptMapping[callId]) return null;
    const authorized = await this.cxAuth.refreshEvToken();
    if (!authorized) throw new Error('Unable to refresh Engage access token');
    return this.cxClient.getKnowledgeBaseGroups(knowledgeBaseGroupIds);
  }

  /**
   * Save the answers with the disposition and drop the call's script, which
   * also takes the side widget down.
   */
  @delegate('server')
  async saveScriptResult(call: CxBaseCall): Promise<void> {
    const callId = this.getCallId(call);
    if (!callId) return;
    const scriptResult = this.callScriptResultMapping[callId];
    if (!scriptResult || !call.scriptId) {
      this._removeCallScript(callId);
      return;
    }

    const result = formatAgentScriptResult(scriptResult);
    await this.cxClient.saveScriptResult(call.uii, call.scriptId, result);
    this._removeCallScript(callId);
  }
}

export { CxAgentScript };
