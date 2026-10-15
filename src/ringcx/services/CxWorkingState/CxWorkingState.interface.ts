/**
 * Agent state interface
 */
export interface AgentState {
  agentState: string;
  agentAuxState: string;
}

/**
 * Working state with additional properties
 */
export interface WorkingState extends AgentState {
  baseState?: string;
}
