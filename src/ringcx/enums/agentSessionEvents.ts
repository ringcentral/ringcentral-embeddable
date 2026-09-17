import { ObjectMap } from '@ringcentral-integration/core/lib/ObjectMap';

export const agentSessionEvents = ObjectMap.prefixKeys(
  ['CONFIG_SUCCESS', 'TRIGGER_CONFIG', 'RECONFIG_FAIL'],
  'agentSession',
);

export type AgentSessionEvents = keyof typeof agentSessionEvents;
