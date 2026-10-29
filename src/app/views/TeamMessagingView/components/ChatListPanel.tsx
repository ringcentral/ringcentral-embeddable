import { AppHeaderNav } from '@ringcentral-integration/micro-core/src/app/components';
import { Filter } from '@ringcentral-integration/micro-message/src/app/views/ConversationsViewSpring/ConversationsPage/Filter';
import { MessagesMd, PlusMd } from '@ringcentral/spring-icon';
import {
  CircularProgressIndicator,
  EmptyState,
  IconButton,
  Menu,
  MenuItem,
  VirtualizedList,
} from '@ringcentral/spring-ui';
import React, { type ChangeEvent, useRef, useState } from 'react';

import type { ChatTabId } from '../chatTabs';
import type { EmojiLookup } from '../formatPostText';
import { getChatTabLabel } from '../getChatTabLabel';
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
  'tabs' | 'onCreateConversation' | 'onCreateTeam' | 'renderTabs'
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

/** The header's "+" menu: start a conversation or create a team. */
function NewChatMenu({
  onCreateConversation,
  onCreateTeam,
}: Pick<
  ChatListPanelProps,
  'onCreateConversation' | 'onCreateTeam'
>): React.ReactElement {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const pick = (handler: () => void) => () => {
    setOpen(false);
    handler();
  };
  return (
    <>
      <IconButton
        ref={anchorRef}
        variant="contained"
        color="secondary"
        size="small"
        symbol={PlusMd}
        data-sign="newChatButton"
        TooltipProps={{ title: t('newChat') }}
        onClick={() => setOpen(true)}
      />
      <Menu
        open={open}
        anchorEl={anchorRef.current}
        onClose={() => setOpen(false)}
      >
        <MenuItem
          data-sign="newConversationMenuItem"
          onClick={pick(onCreateConversation)}
        >
          {t('newConversation')}
        </MenuItem>
        <MenuItem data-sign="createTeamMenuItem" onClick={pick(onCreateTeam)}>
          {t('createTeam')}
        </MenuItem>
      </Menu>
    </>
  );
}

/**
 * The Chat tab: "Chat" with the "+" menu in the header, then the All, Direct,
 * Team and Favorites sub tabs, laid out like the SMS list.
 */
export function ChatListPanel({
  tabs,
  onCreateConversation,
  onCreateTeam,
  renderTabs,
  ...listProps
}: ChatListPanelProps): React.ReactElement {
  const emojiLookup = useEmojiLookup();
  const syncTabs: ChatSyncTab[] = tabs.map((tab) => ({
    id: tab.id,
    // The count is in the label; sub tabs show no badge.
    label: getChatTabLabel(t(TAB_LABEL_KEYS[tab.id]), tab.unreadCount),
    component: <ChatList {...listProps} tab={tab} emojiLookup={emojiLookup} />,
  }));
  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden"
      data-sign="chatListPanel"
    >
      <AppHeaderNav title={t('chat')}>
        <NewChatMenu
          onCreateConversation={onCreateConversation}
          onCreateTeam={onCreateTeam}
        />
      </AppHeaderNav>
      {renderTabs(syncTabs)}
    </div>
  );
}
