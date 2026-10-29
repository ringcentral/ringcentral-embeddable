import type { TeamMessagingChatItem } from '../../services/TeamMessaging';

/** The sync tab group of the Chat tab. */
export const CHAT_TABS_ID = 'teamMessagingChatTabs';

export type ChatTabId = 'All' | 'Direct' | 'Team' | 'Favorites';

export const CHAT_TAB_IDS: readonly ChatTabId[] = [
  'All',
  'Direct',
  'Team',
  'Favorites',
];

/** Teams and the company-wide chat; every other chat is a direct one. */
const TEAM_CHAT_TYPES = new Set(['Team', 'Everyone']);

/** Whether a chat belongs to a sub tab. */
export function isChatInTab(
  chat: TeamMessagingChatItem,
  tabId: ChatTabId,
): boolean {
  if (tabId === 'All') {
    return true;
  }
  if (tabId === 'Favorites') {
    return chat.isFavorite;
  }
  const isTeam = TEAM_CHAT_TYPES.has(chat.type ?? '');
  return tabId === 'Team' ? isTeam : !isTeam;
}
