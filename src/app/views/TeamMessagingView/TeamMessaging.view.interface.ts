import type { ReactNode } from 'react';

import type {
  TeamMessagingChatItem,
  TeamMessagingMember,
  TeamMessagingPostItem,
  TeamMessagingReadStatusFilter,
  TeamMessagingResult,
  TeamMessagingUnreadMention,
} from '../../services/TeamMessaging';
import type { ChatTabId } from './chatTabs';
import type { UnreadBadgeColor } from './getUnreadBadgeColor';

/** Mention types rendered in posts. `All` is "@Team". */
export type MentionType = 'Person' | 'Team' | 'All';

export interface ChatTab {
  id: ChatTabId;
  /** The tab's chats, filtered by the search text and read status. */
  chats: TeamMessagingChatItem[];
  /** The tab has chats, so an empty list means nothing matched the filters. */
  hasChats: boolean;
  /** Unread posts of all the tab's chats, for the tab badge. */
  unreadCount: number;
  /** The strongest mention in the tab's unread posts, for the badge color. */
  unreadMention: TeamMessagingUnreadMention;
}

/** A sub tab as the sync tab view renders it. */
export interface ChatSyncTab {
  id: ChatTabId;
  label: string;
  BadgeProps: { count: number; color: UnreadBadgeColor };
  component: ReactNode;
}

export interface ChatListPanelProps {
  tabs: ChatTab[];
  searchFilter: string;
  readStatusFilter: TeamMessagingReadStatusFilter;
  isLoading: boolean;
  currentChatId: string | null;
  onSearchChange: (searchFilter: string) => void;
  onReadStatusFilterChange: (
    readStatusFilter: TeamMessagingReadStatusFilter,
  ) => void;
  onSelectChat: (chatId: string) => void;
  onToggleFavorite: (chatId: string) => void;
  onCreateTeam: () => void;
  formatTime: (utcTimestamp: number) => string;
  /** Renders the sub tabs, kept in step across windows. */
  renderTabs: (tabs: ChatSyncTab[]) => ReactNode;
}

export interface CreateTeamContact {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface CreateTeamContentProps {
  searchContacts: (searchText: string) => CreateTeamContact[];
  onCreate: (params: {
    name: string;
    emails: string[];
  }) => Promise<TeamMessagingResult>;
  onCancel: () => void;
}

export interface ChatPanelProps {
  chat?: TeamMessagingChatItem;
  /** Posts, oldest first. */
  posts: TeamMessagingPostItem[];
  isLoading: boolean;
  hasOlderPosts: boolean;
  /** The text typed but not sent yet. */
  draft: string;
  goBack: () => void;
  loadOlderPosts: () => Promise<boolean>;
  /** Resolves `false` when the post was not sent. */
  sendText: (text: string) => Promise<boolean>;
  sendFile: (file: File) => Promise<void>;
  saveDraft: (text: string) => void;
  openPerson: (personId: string) => void;
  openChat: (chatId: string) => void;
  formatTime: (utcTimestamp: number) => string;
  getMentionName: (type: MentionType, id: string) => string;
  getMemberName: (member?: TeamMessagingMember) => string;
  toggleFavorite: () => void;
}
