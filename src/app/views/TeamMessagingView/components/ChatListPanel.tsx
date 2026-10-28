import { AppHeaderNav } from '@ringcentral-integration/micro-core/src/app/components';
import { Filter } from '@ringcentral-integration/micro-message/src/app/views/ConversationsViewSpring/ConversationsPage/Filter';
import { AddTeamMd, MessagesMd } from '@ringcentral/spring-icon';
import {
  CircularProgressIndicator,
  EmptyState,
  IconButton,
  VirtualizedList,
} from '@ringcentral/spring-ui';
import React, { type ChangeEvent } from 'react';

import type { ChatTabId } from '../chatTabs';
import type { EmojiLookup } from '../formatPostText';
import { getUnreadBadgeColor } from '../getUnreadBadgeColor';
import { t } from '../i18n';
import type {
  ChatListPanelProps,
  ChatSyncTab,
  ChatTab,
} from '../TeamMessaging.view.interface';
import { useEmojiLookup } from '../useEmojiLookup';
import { ChatListItem } from './ChatListItem';

const TAB_LABEL_KEYS = {
  All: 'all',
  Direct: 'direct',
  Team: 'team',
  Favorites: 'favorites',
} as const satisfies Record<ChatTabId, string>;

type ChatListProps = Omit<
  ChatListPanelProps,
  'tabs' | 'onCreateTeam' | 'renderTabs'
> & {
  tab: ChatTab;
  emojiLookup?: EmojiLookup;
};

function getEmptyTitle({
  tabId,
  hasChats,
  readStatusFilter,
}: {
  tabId: ChatTabId;
  hasChats: boolean;
  readStatusFilter: ChatListProps['readStatusFilter'];
}): string {
  if (!hasChats) {
    return tabId === 'Favorites' ? t('noFavoriteChats') : t('noChats');
  }
  return readStatusFilter === 'Unread' ? t('noUnreadChats') : t('noMatchedChats');
}

/** One sub tab: the search and read filter, then the chats. */
function ChatList({
  tab,
  searchFilter,
  readStatusFilter,
  isLoading,
  currentChatId,
  emojiLookup,
  onSearchChange,
  onReadStatusFilterChange,
  onSelectChat,
  onToggleFavorite,
  formatTime,
}: ChatListProps): React.ReactElement {
  const { chats, hasChats } = tab;
  const renderContent = (): React.ReactNode => {
    if (isLoading && chats.length === 0) {
      return (
        <div className="flex h-full items-center justify-center">
          <CircularProgressIndicator size="large" color="primary" />
        </div>
      );
    }
    if (chats.length === 0) {
      return (
        <EmptyState
          icon={MessagesMd}
          title={getEmptyTitle({ tabId: tab.id, hasChats, readStatusFilter })}
        />
      );
    }
    return (
      <VirtualizedList
        className="flex-auto overflow-auto"
        data={chats}
        data-sign="chatList"
        key={`${tab.id}-${readStatusFilter}`}
      >
        {(index: number) => {
          const chat = chats[index];
          return chat ? (
            <ChatListItem
              chat={chat}
              selected={chat.id === currentChatId}
              emojiLookup={emojiLookup}
              onSelect={onSelectChat}
              onToggleFavorite={onToggleFavorite}
              formatTime={formatTime}
            />
          ) : null;
        }}
      </VirtualizedList>
    );
  };
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <Filter
        inputPlaceholder={t('searchChats')}
        searchInput={searchFilter}
        readStatusFilter={readStatusFilter}
        onSearchInputChange={(event: ChangeEvent<HTMLInputElement>) =>
          onSearchChange(event.target.value)
        }
        updateReadStatusFilter={(status) =>
          onReadStatusFilterChange(status === 'Unread' ? 'Unread' : 'All')
        }
      />
      <div className="relative flex flex-auto flex-col overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
}

/**
 * The Chat tab: "Chat" with "Create team" in the header, then the All,
 * Direct and Team sub tabs, laid out like the SMS list.
 */
export function ChatListPanel({
  tabs,
  onCreateTeam,
  renderTabs,
  ...listProps
}: ChatListPanelProps): React.ReactElement {
  const emojiLookup = useEmojiLookup();
  const syncTabs: ChatSyncTab[] = tabs.map((tab) => ({
    id: tab.id,
    label: t(TAB_LABEL_KEYS[tab.id]),
    BadgeProps: {
      count: tab.unreadCount,
      color: getUnreadBadgeColor(tab.unreadMention),
    },
    component: <ChatList {...listProps} tab={tab} emojiLookup={emojiLookup} />,
  }));
  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden"
      data-sign="chatListPanel"
    >
      <AppHeaderNav title={t('chat')}>
        <IconButton
          variant="contained"
          color="secondary"
          size="small"
          symbol={AddTeamMd}
          data-sign="createTeamButton"
          TooltipProps={{ title: t('createTeam') }}
          onClick={onCreateTeam}
        />
      </AppHeaderNav>
      {renderTabs(syncTabs)}
    </div>
  );
}
