import type {
  CxAgentScriptData,
  CxAgentScriptResult,
  CxCallDispositionItem,
} from '../CxClient/interfaces';
import type { CxAgentScriptModel } from './formatAgentScriptModel';

export interface CxAgentScriptOptions {
  /**
   * Opt in to the Agent Script side widget. Off unless the host sets the
   * `enableAgentScript` parameter, so an embedding that never asked for the
   * feature keeps the panel hidden even though the call metadata still carries
   * a script id.
   */
  enabled?: boolean;
  /**
   * The separately hosted renderer page (Decision D9). The widget stays hidden
   * when it is empty.
   */
  pageUrl?: string;
}

export type CxCallScriptMapping = Record<string, CxAgentScriptData>;

export type CxCallScriptLoadingMapping = Record<string, boolean>;

export type CxCallScriptErrorMapping = Record<string, string | null>;

export type CxCallScriptResultMapping = Record<string, CxAgentScriptResult>;

/**
 * Call state the renderer callbacks (`isOnHold`, `isRecording`) report. Sent
 * explicitly because the live call object never crosses the frame boundary.
 */
export interface CxAgentScriptFlags {
  isOnHold: boolean;
  isRecording: boolean;
}

export interface CxAgentScriptInitializePayload {
  callId: string;
  config: CxAgentScriptData;
  /**
   * The root the renderer interpolates `{{model.*}}` tags against. Built host
   * side by `CxAgentScript.getScriptModel`, because the frame has no access to
   * the agent settings the `{{model.call.agent*}}` tags need.
   */
  model: CxAgentScriptModel;
  flags: CxAgentScriptFlags;
}

/**
 * Version of the host/renderer message contract. The renderer page is
 * released separately, so both sides announce the version they speak.
 */
export const AGENT_SCRIPT_PROTOCOL_VERSION = 1;

export const AGENT_SCRIPT_CONNECT_MESSAGE_TYPE = 'ev-agent-script-connect';

export interface AgentScriptConnectMessage {
  type: typeof AGENT_SCRIPT_CONNECT_MESSAGE_TYPE;
  protocolVersion: number;
}

export type AgentScriptHostMessage =
  | {
      type: 'initialize';
      payload: CxAgentScriptInitializePayload;
    }
  | {
      type: 'reset';
      callId: string;
    }
  | {
      type: 'knowledgeBaseResult';
      requestId: string;
      value: unknown;
      error?: string;
    };

export type AgentScriptRendererMessage =
  | { type: 'ready'; protocolVersion?: number; rendererVersion?: string }
  | {
      type: 'scriptResult';
      callId: string;
      value: CxAgentScriptResult;
    }
  | {
      type: 'updateDisposition';
      callId: string;
      value: CxCallDispositionItem;
    }
  | {
      type: 'getKnowledgeBaseArticles';
      callId: string;
      requestId: string;
      groupIds: number[];
    };
