import { AppHeaderNav } from '@ringcentral-integration/micro-core/src/app/components';
import {
  PageHeader,
  PageHeaderBackButton,
} from '@ringcentral-integration/next-widgets/components';
import { EmptyState, IconButton } from '@ringcentral/spring-ui';
import { AddStickyNoteMd, MessagesMd, TasksMd } from '@ringcentral/spring-icon';
import React, { useRef } from 'react';

import { t } from '../i18n';
import type { ChatPanelProps } from '../TeamMessaging.view.interface';
import { useEmojiLookup } from '../useEmojiLookup';
import { ChatComposer } from './ChatComposer';
import { ChatHeaderMenu } from './ChatHeaderMenu';
import { HeaderMoreMenu } from './HeaderMoreMenu';
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
  sendMessage,
  canAttach,
  saveDraft,
  openPerson,
  openChat,
  formatTime,
  getMentionName,
  getMemberName,
  toggleFavorite,
  getThreadInfo,
  openThread,
  renderThread,
  renderTasks,
  taskActions,
  createTask,
  openTasks,
  noteActions,
  renderNotes,
  createNote,
  openNotes,
  drawerHeader,
}: ChatPanelProps): React.ReactElement {
  const emojiLookup = useEmojiLookup();
  const rootRef = useRef<HTMLDivElement>(null);
  const title = getTitle(chat);
  return (
    <div
      ref={rootRef}
      // The transform contains the thread drawer's fixed layer in this panel.
      className="relative flex h-full w-full flex-col overflow-hidden [transform:translateZ(0)]"
      data-sign="chatPanel"
    >
      <AppHeaderNav override>
        {drawerHeader ? (
          // One header: while a drawer covers the chat, it serves the drawer.
          // Its back is not the page's `backButton`, which the side widget
          // turns into closing the tab, and hides while showing its tab bar.
          <PageHeader
            startAdornment={
              <PageHeaderBackButton
                data-sign="drawerBackButton"
                onClick={drawerHeader.onBack}
              />
            }
            endAdornment={
              drawerHeader.actions?.length ? (
                <HeaderMoreMenu
                  actions={drawerHeader.actions}
                  dataSign="drawerHeader"
                />
              ) : undefined
            }
          >
            <span
              className="flex min-w-0 flex-col items-center"
              data-sign={drawerHeader.dataSign}
            >
              <span className="max-w-full truncate">{drawerHeader.title}</span>
              {chat?.name ? (
                <span
                  className="typography-descriptor max-w-full truncate text-neutral-b2"
                  title={chat.name}
                >
                  {chat.name}
                </span>
              ) : null}
            </span>
          </PageHeader>
        ) : (
          <PageHeader
            onBackClick={goBack}
            endAdornment={
              chat ? (
                <ChatHeaderMenu
                  isFavorite={chat.isFavorite}
                  onToggleFavorite={toggleFavorite}
                  onOpenTasks={openTasks}
                  onOpenNotes={openNotes}
                />
              ) : undefined
            }
          >
            <span className="truncate" title={title} data-sign="chatTitle">
              {title}
            </span>
          </PageHeader>
        )}
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
            getThreadInfo={getThreadInfo}
            openThread={openThread}
            taskActions={taskActions}
            noteActions={noteActions}
          />
          <ChatComposer
            members={chat?.members ?? []}
            draft={draft}
            saveDraft={saveDraft}
            sendMessage={sendMessage}
            canAttach={canAttach}
            toolbar={
              <>
                {createTask ? (
                  <IconButton
                    variant="icon"
                    size="large"
                    color="secondary"
                    // Gray like the input's own attach and emoji buttons.
                    className="text-neutral-b2"
                    symbol={TasksMd}
                    data-sign="createTaskButton"
                    TooltipProps={{ title: t('createTask') }}
                    onClick={createTask}
                  />
                ) : null}
                {createNote ? (
                  <IconButton
                    variant="icon"
                    size="large"
                    color="secondary"
                    className="text-neutral-b2"
                    symbol={AddStickyNoteMd}
                    data-sign="createNoteButton"
                    TooltipProps={{ title: t('createNote') }}
                    onClick={createNote}
                  />
                ) : null}
              </>
            }
          />
        </>
      ) : (
        <EmptyState icon={MessagesMd} title={t('chatNotFound')} />
      )}
      {renderThread?.(() => rootRef.current)}
      {renderTasks?.(() => rootRef.current)}
      {renderNotes?.(() => rootRef.current)}
    </div>
  );
}
