const AGENT_PREFIX = '/agent';
const AGENT_SETTINGS_PREFIX = '/settings/agent';

/**
 * RingCX is one tab of the host app, so its pages only own the router while the
 * user is looking at them.
 */
export function isCxAgentPath(path?: string): boolean {
  return path === AGENT_PREFIX || !!path?.startsWith(`${AGENT_PREFIX}/`);
}

/**
 * Ids go into the path exactly as the platform issued them.
 *
 * A call or history id is a `${uii}$${sessionId}` pair, and React Router v5
 * hands route params back without decoding them, so percent-encoding the `$`
 * here would leave the pages looking up calls by a `%24` id that no call
 * mapping holds. These ids carry none of `/`, `?` or `#`, which are the only
 * characters a single path segment cannot hold.
 */
export const cxPath = {
  agent: (): string => AGENT_PREFIX,
  chooseAccount: (): string => `${AGENT_PREFIX}/chooseAccount`,
  sessionConfig: (): string => `${AGENT_PREFIX}/sessionConfig`,
  sessionUpdate: (): string => `${AGENT_PREFIX}/sessionUpdate`,
  home: (tabId = 'dialer'): string => `${AGENT_PREFIX}/home/${tabId}`,
  historyDetail: (id: string): string => `${AGENT_PREFIX}/history/${id}`,
  historyCallLog: (id: string, method: string): string =>
    `${AGENT_PREFIX}/history/${id}/log/${method}`,
  call: (id: string): string => `${AGENT_PREFIX}/calls/${id}`,
  disposition: (id: string): string => `${AGENT_PREFIX}/calls/${id}/disposition`,
  transfer: (id: string): string => `${AGENT_PREFIX}/calls/${id}/transfer`,
  participants: (id: string): string =>
    `${AGENT_PREFIX}/calls/${id}/participants`,
  settings: (): string => AGENT_SETTINGS_PREFIX,
  manualDial: (): string => `${AGENT_SETTINGS_PREFIX}/manualDial`,
} as const;
