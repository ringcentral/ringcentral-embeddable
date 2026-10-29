import { MessagesMd } from '@ringcentral/spring-icon';
import { Drawer, EmptyState } from '@ringcentral/spring-ui';
import React from 'react';

import { t } from '../i18n';
import type { ThreadDrawerProps } from '../TeamMessaging.view.interface';
import { useEmojiLookup } from '../useEmojiLookup';
import { ChatComposer } from './ChatComposer';
import { PostList } from './PostList';

/**
 * A thread in a drawer over its chat: the parent post, the replies, and a
 * composer that replies in the thread. The chat header serves as its header.
 */
export function ThreadDrawer({
  open,
  threadKey,
  container,
  onClose,
  members,
  isAvailable,
  posts,
  isLoading,
  hasOlderPosts,
  draft,
  loadOlderPosts,
  sendMessage,
  canAttach,
  saveDraft,
  openPerson,
  openChat,
  formatTime,
  getMentionName,
  getMemberName,
  taskActions,
  noteActions,
}: ThreadDrawerProps): React.ReactElement {
  const emojiLookup = useEmojiLookup();
  return (
    <Drawer
      open={open}
      anchor="right"
      container={container}
      onClose={onClose}
      // The emoji picker renders over the page, outside the drawer; keep
      // focus free so its search field works.
      disableEnforceFocus
      classes={{
        body: '!w-full !max-w-full',
        content: '!p-0 !overflow-hidden flex min-h-0 flex-1 flex-col',
      }}
      bodyProps={{ 'data-sign': 'threadDrawer' }}
    >
      <div className="flex h-full flex-col overflow-hidden">
        {isAvailable ? (
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
              taskActions={taskActions}
              noteActions={noteActions}
            />
            <ChatComposer
              key={threadKey}
              members={members}
              draft={draft}
              saveDraft={saveDraft}
              sendMessage={sendMessage}
              canAttach={canAttach}
            />
          </>
        ) : (
          <EmptyState icon={MessagesMd} title={t('threadNotFound')} />
        )}
      </div>
    </Drawer>
  );
}
