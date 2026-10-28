import { AppHeaderNav } from '@ringcentral-integration/micro-core/src/app/components';
import { PageHeader } from '@ringcentral-integration/next-widgets/components';
import { EmptyState } from '@ringcentral/spring-ui';
import { MessagesMd } from '@ringcentral/spring-icon';
import React from 'react';

import { t } from '../i18n';
import type { ChatPanelProps } from '../TeamMessaging.view.interface';
import { useEmojiLookup } from '../useEmojiLookup';
import { ChatComposer } from './ChatComposer';
import { FavoriteButton } from './FavoriteButton';
import { PostList } from './PostList';

const GROUP_MEMBER_COUNT = 2;

/** The chat name; a group shows its member count, as in the legacy app. */
function getTitle(chat: ChatPanelProps['chat']): string {
  if (!chat) {
    return '';
  }
  const count = chat.members.length;
  return count > GROUP_MEMBER_COUNT ? `${chat.name} (${count})` : chat.name;
}

/** A chat page: its posts and the composer. */
export function ChatPanel({
  chat,
  posts,
  isLoading,
  hasOlderPosts,
  draft,
  goBack,
  loadOlderPosts,
  sendText,
  sendFile,
  saveDraft,
  openPerson,
  openChat,
  formatTime,
  getMentionName,
  getMemberName,
  toggleFavorite,
}: ChatPanelProps): React.ReactElement {
  const emojiLookup = useEmojiLookup();
  const title = getTitle(chat);
  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden"
      data-sign="chatPanel"
    >
      <AppHeaderNav override>
        <PageHeader
          onBackClick={goBack}
          endAdornment={
            chat ? (
              <FavoriteButton
                size="medium"
                isFavorite={chat.isFavorite}
                onToggle={toggleFavorite}
              />
            ) : undefined
          }
        >
          <span className="truncate" title={title} data-sign="chatTitle">
            {title}
          </span>
        </PageHeader>
      </AppHeaderNav>
      {chat || isLoading || posts.length > 0 ? (
        <>
          <PostList
            posts={posts}
            isLoading={isLoading}
            hasOlderPosts={hasOlderPosts}
            loadOlderPosts={loadOlderPosts}
            emojiLookup={emojiLookup}
            openPerson={openPerson}
            openChat={openChat}
            formatTime={formatTime}
            getMentionName={getMentionName}
            getMemberName={getMemberName}
          />
          <ChatComposer
            members={chat?.members ?? []}
            draft={draft}
            saveDraft={saveDraft}
            sendText={sendText}
            sendFile={sendFile}
          />
        </>
      ) : (
        <EmptyState icon={MessagesMd} title={t('chatNotFound')} />
      )}
    </div>
  );
}
