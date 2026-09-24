import type {
  CxAgentScriptFlags,
  CxAgentScriptModel,
} from '../../services/CxAgentScript';
import type {
  CxAgentScriptData,
  CxAgentScriptResult,
  CxBaseCall,
  CxCallDispositionItem,
} from '../../services/CxClient/interfaces';

export interface AgentScriptPanelProps {
  callId: string;
  call: CxBaseCall | null;
  /** The separately hosted renderer page. */
  pageUrl: string;
  script: CxAgentScriptData | null;
  loading: boolean;
  error: string | null;
  flags: CxAgentScriptFlags;
  onResultChange: (
    callId: string,
    result: CxAgentScriptResult,
  ) => Promise<void>;
  onDisposition: (
    callId: string,
    disposition: CxCallDispositionItem,
  ) => Promise<void>;
  getKnowledgeBaseArticles: (
    callId: string,
    groupIds: number[],
  ) => Promise<unknown>;
  /**
   * Build the `{{model.*}}` interpolation root for the renderer. A function
   * rather than a prop so the freshly built object never takes part in the
   * connector's shallow prop comparison.
   */
  getScriptModel: (call: CxBaseCall | null) => CxAgentScriptModel;
}
