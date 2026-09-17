const AGENT_PREFIX = '/agent';
const AGENT_SETTINGS_PREFIX = '/settings/agent';

function encodePathSegment(value: string): string {
  return encodeURIComponent(value);
}

/**
 * RingCX is one tab of the host app, so its pages only own the router while the
 * user is looking at them.
 */
export function isCxAgentPath(path?: string): boolean {
  return path === AGENT_PREFIX || !!path?.startsWith(`${AGENT_PREFIX}/`);
}

export const cxPath = {
  agent: (): string => AGENT_PREFIX,
  chooseAccount: (): string => `${AGENT_PREFIX}/chooseAccount`,
  sessionConfig: (): string => `${AGENT_PREFIX}/sessionConfig`,
  sessionUpdate: (): string => `${AGENT_PREFIX}/sessionUpdate`,
  home: (tabId = 'dialer'): string =>
    `${AGENT_PREFIX}/home/${encodePathSegment(tabId)}`,
  historyDetail: (id: string): string =>
    `${AGENT_PREFIX}/history/${encodePathSegment(id)}`,
  historyCallLog: (id: string, method: string): string =>
    `${AGENT_PREFIX}/history/${encodePathSegment(id)}/log/${encodePathSegment(
      method,
    )}`,
  settings: (): string => AGENT_SETTINGS_PREFIX,
} as const;
