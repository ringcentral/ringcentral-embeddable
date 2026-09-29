export const AGENT_TYPES = {
  AGENT: 'agent',
  SUPERVISOR: 'supervisor',
} as const;

export type OriginAgentTypesType = keyof typeof AGENT_TYPES;
export type AgentTypesType = (typeof AGENT_TYPES)[OriginAgentTypesType];
