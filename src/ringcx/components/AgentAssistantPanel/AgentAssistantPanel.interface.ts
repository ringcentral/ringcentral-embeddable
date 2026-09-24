import type { CxAgentAssistantFrameParams } from '../../services/CxAgentAssistant';

export interface AgentAssistantPanelProps {
  callId: string;
  getParams: (callId: string) => Promise<CxAgentAssistantFrameParams | null>;
}

export interface AgentAssistantFrameProps {
  params: CxAgentAssistantFrameParams;
}
