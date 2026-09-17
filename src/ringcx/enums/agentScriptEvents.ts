import { ObjectMap } from '@ringcentral-integration/core/lib/ObjectMap';

export const EV_APP_PAGE_KEY = 'ev_app';
export const EV_AGENT_SCRIPT_PAGE_KEY = 'ev_agentScript';

export const EV_AGENT_SCRIPT_BROADCAST_KEY = 'agent_script_channel$$';

export const agentScriptEvents = ObjectMap.prefixKeys(
  [
    'INIT',
    'SET_SCRIPT_RESULT',
    'GET_KNOWLEDGE_BASE_ARTICLES',
    'UPDATE_DISPOSITION',
  ],
  'broadcast',
);

export type AgentScriptEvents = keyof typeof agentScriptEvents;
