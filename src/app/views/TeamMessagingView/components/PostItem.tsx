import { ReplyMd } from '@ringcentral/spring-icon';
import { IconButton, Text } from '@ringcentral/spring-ui';
import React, { type ReactNode } from 'react';

import {
  getTaskActivity,
  type TeamMessagingNote,
  type TeamMessagingPostItem,
  type TeamMessagingTask,
} from '../../../services/TeamMessaging';
import {
  type EmojiLookup,
  replaceAtTeamText,
  replaceEmojiText,
} from '../formatPostText';
import { t } from '../i18n';
import type {
  ChatPanelProps,
  MentionType,
  NoteActions,
  TaskActions,
  ThreadInfo,
} from '../TeamMessaging.view.interface';
import { PersonAvatar } from './ChatAvatar';
import { FileAttachment } from './FileAttachment';
import { PostMarkdown } from './PostMarkdown';
import { NoteCard } from './notes/NoteCard';
import { TaskActivityLine } from './tasks/TaskActivityLine';
import { TaskCard } from './tasks/TaskCard';

type PostItemActions = Pick<
  ChatPanelProps,
  'openPerson' | 'openChat' | 'formatTime' | 'getMentionName' | 'getMemberName'
>;

export interface PostItemProps extends PostItemActions {
  post: TeamMessagingPostItem;
  /** Consecutive posts by the same person hide the avatar and name. */
  showCreator: boolean;
  emojiLookup?: EmojiLookup;
  /** The post's replies, shown under a thread parent in the chat. */
  thread?: ThreadInfo;
  /** Open the post's thread; not set on a thread page. */
  onOpenThread?: () => void;
  /** Shows and acts on tasks; without it a task shows as unsupported. */
  taskActions?: TaskActions;
  /** Shows notes; without it a note shows as unsupported. */
  noteActions?: NoteActions;
}

type MentionRenderer = (type: MentionType, id: string) => ReactNode;

/** Renders a post's mentions, naming them from the post or the chat. */
function createMentionRenderer({
  post,
  openPerson,
  openChat,
  getMentionName,
}: { post: TeamMessagingPostItem } & Pick<
  PostItemActions,
  'openPerson' | 'openChat' | 'getMentionName'
>): MentionRenderer {
  return (mentionType, id) => {
    // A Team mention with the id -1 is "@Team", the whole chat.
    const type = mentionType === 'Team' && id === '-1' ? 'All' : mentionType;
    const mentioned = post.mentions?.find((mention) => mention.id === id);
    const name =
      type === 'All'
        ? id === '-1'
          ? t('atTeam')
          : id
        : mentioned?.name || getMentionName(type, id);
    return (
      <Mention
        type={type}
        id={id}
        name={name}
        openPerson={openPerson}
        openChat={openChat}
      />
    );
  };
}

/** A reply shown in full under its parent, in a compact layout. */
function InlineReply({
  reply,
  emojiLookup,
  taskActions,
  noteActions,
  ...actions
}: {
  reply: TeamMessagingPostItem;
  emojiLookup?: EmojiLookup;
  taskActions?: TaskActions;
  noteActions?: NoteActions;
} & PostItemActions): React.ReactElement {
  const creatorId = reply.creatorId;
  const openCreator = creatorId ? () => actions.openPerson(creatorId) : undefined;
  return (
    <div className="flex gap-2" data-sign="inlineReply">
      <PersonAvatar member={reply.creator} size="xsmall" onClick={openCreator} />
      <div className="min-w-0 flex-auto">
        <div className="flex items-baseline gap-2">
          <button
            type="button"
            className="typography-descriptorMiniSemiBold min-w-0 truncate text-neutral-b0 hover:underline"
            onClick={openCreator}
          >
            {actions.getMemberName(reply.creator)}
          </button>
          <Text className="typography-label flex-none text-neutral-b2">
            {reply.creationTime
              ? actions.formatTime(new Date(reply.creationTime).getTime())
              : ''}
          </Text>
        </div>
        <PostBody
          post={reply}
          emojiLookup={emojiLookup}
          renderMention={createMentionRenderer({ post: reply, ...actions })}
          taskActions={taskActions}
          noteActions={noteActions}
          formatTime={actions.formatTime}
        />
        <SendStatus status={reply.sendStatus} />
      </div>
    </div>
  );
}

/**
 * A thread parent's latest replies in full, so they are not missed, with
 * links to the earlier replies and to reply.
 */
function ThreadReplies({
  thread,
  emojiLookup,
  onOpenThread,
  taskActions,
  noteActions,
  ...actions
}: {
  thread: ThreadInfo;
  emojiLookup?: EmojiLookup;
  onOpenThread: () => void;
  taskActions?: TaskActions;
  noteActions?: NoteActions;
} & PostItemActions): React.ReactElement {
  const hiddenCount = thread.replyCount - thread.recentReplies.length;
  return (
    <div
      className="mt-1 flex flex-col gap-2 border-l-2 border-neutral-b4 pl-2"
      data-sign="postThreadReplies"
    >
      {hiddenCount > 0 ? (
        <button
          type="button"
          className="typography-descriptor self-start text-primary-f hover:underline"
          data-sign="viewEarlierReplies"
          onClick={onOpenThread}
        >
          {hiddenCount === 1
            ? t('viewOneEarlierReply')
            : t('viewEarlierReplies', { count: hiddenCount })}
        </button>
      ) : null}
      {thread.recentReplies.map((reply) => (
        <InlineReply
          key={reply.id}
          reply={reply}
          emojiLookup={emojiLookup}
          taskActions={taskActions}
          noteActions={noteActions}
          {...actions}
        />
      ))}
      <button
        type="button"
        className="typography-descriptor self-start text-primary-f hover:underline"
        data-sign="replyInThreadLink"
        onClick={onOpenThread}
      >
        {t('reply')}
      </button>
    </div>
  );
}

function Mention({
  type,
  id,
  name,
  openPerson,
  openChat,
}: {
  type: MentionType;
  id: string;
  name: string;
} & Pick<PostItemActions, 'openPerson' | 'openChat'>): React.ReactElement {
  if (type === 'All') {
    return <span className="text-primary-f">@{name}</span>;
  }
  const onClick = (): void =>
    type === 'Person' ? openPerson(id) : openChat(id);
  return (
    <button
      type="button"
      className="text-primary-f hover:underline"
      data-sign="postMention"
      onClick={onClick}
    >
      @{name}
    </button>
  );
}

function SendStatus({
  status,
}: {
  status: TeamMessagingPostItem['sendStatus'];
}): React.ReactElement | null {
  if (!status) {
    return null;
  }
  return (
    <Text
      className={
        status === 'failed'
          ? 'typography-descriptor text-danger'
          : 'typography-descriptor text-neutral-b2'
      }
      data-sign="postSendStatus"
    >
      {status === 'failed' ? t('sendFailed') : t('sending')}
    </Text>
  );
}

type BodyTaskProps = {
  taskActions?: TaskActions;
  noteActions?: NoteActions;
  formatTime: PostItemActions['formatTime'];
};

/** A note post's card, showing the note as it is now. */
function PostNote({
  attachment,
  noteActions,
}: {
  attachment: TeamMessagingNote;
  noteActions: NoteActions;
}): React.ReactElement {
  const noteId = attachment.id!;
  return (
    <NoteCard
      note={noteActions.getNote(noteId) ?? attachment}
      onOpen={() => noteActions.openNote(noteId)}
    />
  );
}

/** A task post's card, showing the task as it is now. */
function PostTask({
  attachment,
  taskActions,
  formatTime,
}: {
  attachment: TeamMessagingTask;
  taskActions: TaskActions;
  formatTime: PostItemActions['formatTime'];
}): React.ReactElement {
  const taskId = attachment.id!;
  const task = taskActions.getTask(taskId) ?? attachment;
  return (
    <TaskCard
      task={task}
      assignees={taskActions.getMembers(
        (task.assignees ?? []).map(({ id }) => id),
      )}
      formatTime={formatTime}
      onToggle={(completed) => taskActions.toggleTask(taskId, completed)}
      onOpen={() => taskActions.openTask(taskId)}
    />
  );
}

function Attachments({
  post,
  taskActions,
  noteActions,
  formatTime,
}: {
  post: TeamMessagingPostItem;
} & BodyTaskProps): React.ReactElement | null {
  const attachments = post.attachments ?? [];
  if (attachments.length === 0) {
    return null;
  }
  return (
    <div className="mt-1 flex flex-col gap-1">
      {attachments.map((attachment, index) =>
        attachment.type === 'File' ? (
          <FileAttachment
            key={attachment.id ?? index}
            contentUri={attachment.contentUri}
            name={attachment.name}
          />
        ) : attachment.type === 'Task' && attachment.id && taskActions ? (
          <PostTask
            key={attachment.id}
            attachment={attachment as unknown as TeamMessagingTask}
            taskActions={taskActions}
            formatTime={formatTime}
          />
        ) : attachment.type === 'Note' && attachment.id && noteActions ? (
          <PostNote
            key={attachment.id}
            attachment={attachment as unknown as TeamMessagingNote}
            noteActions={noteActions}
          />
        ) : (
          <Text
            key={attachment.id ?? index}
            className="typography-mainText text-neutral-b2"
          >
            {t('unsupportedMessage')}
          </Text>
        ),
      )}
    </div>
  );
}

function PostBody({
  post,
  emojiLookup,
  renderMention,
  taskActions,
  noteActions,
  formatTime,
}: {
  post: TeamMessagingPostItem;
  emojiLookup?: EmojiLookup;
  renderMention: MentionRenderer;
} & BodyTaskProps): React.ReactElement {
  const activity = taskActions ? getTaskActivity(post) : undefined;
  if (activity) {
    return (
      <TaskActivityLine
        activity={activity}
        subject={taskActions?.getTask(activity.taskId)?.subject}
        onOpenTask={taskActions?.openTask}
      />
    );
  }
  if (post.type === 'PersonJoined') {
    return (
      <Text className="typography-mainText text-neutral-b2">
        {t('joinedTheTeam')}
      </Text>
    );
  }
  if (post.type === 'PersonsAdded') {
    return (
      <Text className="typography-mainText text-neutral-b2">
        {t('added')}{' '}
        {(post.addedPersonIds ?? []).map((id) => (
          <React.Fragment key={id}>
            {renderMention('Person', id)}{' '}
          </React.Fragment>
        ))}
      </Text>
    );
  }
  const text = post.text
    ? replaceAtTeamText(replaceEmojiText(post.text, emojiLookup))
    : '';
  return (
    <>
      {text ? <PostMarkdown text={text} renderMention={renderMention} /> : null}
      <Attachments
        post={post}
        taskActions={taskActions}
        noteActions={noteActions}
        formatTime={formatTime}
      />
      {!text && !post.attachments?.length ? (
        <Text className="typography-mainText text-neutral-b2">
          {t('unsupportedMessage')}
        </Text>
      ) : null}
    </>
  );
}

/** One post: the sender, the time, the content and the send status. */
export function PostItem({
  post,
  showCreator,
  emojiLookup,
  openPerson,
  openChat,
  formatTime,
  getMentionName,
  getMemberName,
  thread,
  onOpenThread,
  taskActions,
  noteActions,
}: PostItemProps): React.ReactElement {
  const creatorId = post.creatorId;
  const creatorName = getMemberName(post.creator);
  const openCreator = creatorId ? () => openPerson(creatorId) : undefined;
  const actions: PostItemActions = {
    openPerson,
    openChat,
    formatTime,
    getMentionName,
    getMemberName,
  };
  const renderMention = createMentionRenderer({ post, ...actions });
  return (
    <div
      className={
        showCreator
          ? 'group relative flex gap-2 px-3 pt-3'
          : 'group relative flex gap-2 px-3 pt-1'
      }
      data-sign="postItem"
    >
      {onOpenThread && !post.sendStatus ? (
        <div className="absolute right-2 top-1 hidden rounded bg-neutral-base shadow group-hover:block">
          <IconButton
            variant="icon"
            color="secondary"
            size="small"
            symbol={ReplyMd}
            data-sign="replyInThreadButton"
            TooltipProps={{ title: t('reply') }}
            onClick={onOpenThread}
          />
        </div>
      ) : null}
      <div className="w-8 flex-none">
        {showCreator ? (
          <PersonAvatar member={post.creator} size="small" onClick={openCreator} />
        ) : null}
      </div>
      <div className="min-w-0 flex-auto">
        {showCreator ? (
          <div className="flex items-baseline gap-2">
            <button
              type="button"
              className="typography-subtitleMini min-w-0 truncate text-neutral-b0 hover:underline"
              title={creatorName}
              data-sign="postCreator"
              onClick={openCreator}
            >
              {creatorName}
            </button>
            <Text className="typography-descriptor flex-none text-neutral-b2">
              {post.creationTime
                ? formatTime(new Date(post.creationTime).getTime())
                : ''}
            </Text>
          </div>
        ) : null}
        <PostBody
          post={post}
          emojiLookup={emojiLookup}
          renderMention={renderMention}
          taskActions={taskActions}
          noteActions={noteActions}
          formatTime={formatTime}
        />
        {thread && onOpenThread ? (
          <ThreadReplies
            thread={thread}
            emojiLookup={emojiLookup}
            onOpenThread={onOpenThread}
            taskActions={taskActions}
            noteActions={noteActions}
            {...actions}
          />
        ) : null}
        <SendStatus status={post.sendStatus} />
      </div>
    </div>
  );
}
