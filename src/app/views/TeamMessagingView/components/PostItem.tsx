import { DownloadMd } from '@ringcentral/spring-icon';
import { Icon, Text } from '@ringcentral/spring-ui';
import React, { type ReactNode } from 'react';

import type { TeamMessagingPostItem } from '../../../services/TeamMessaging';
import {
  type EmojiLookup,
  replaceAtTeamText,
  replaceEmojiText,
} from '../formatPostText';
import { t } from '../i18n';
import type {
  ChatPanelProps,
  MentionType,
} from '../TeamMessaging.view.interface';
import { PersonAvatar } from './ChatAvatar';
import { PostMarkdown } from './PostMarkdown';

type PostItemActions = Pick<
  ChatPanelProps,
  'openPerson' | 'openChat' | 'formatTime' | 'getMentionName' | 'getMemberName'
>;

export interface PostItemProps extends PostItemActions {
  post: TeamMessagingPostItem;
  /** Consecutive posts by the same person hide the avatar and name. */
  showCreator: boolean;
  emojiLookup?: EmojiLookup;
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

function Attachments({
  post,
}: {
  post: TeamMessagingPostItem;
}): React.ReactElement | null {
  const attachments = post.attachments ?? [];
  if (attachments.length === 0) {
    return null;
  }
  return (
    <div className="mt-1 flex flex-col gap-1">
      {attachments.map((attachment, index) =>
        attachment.type === 'File' ? (
          <a
            key={attachment.id ?? index}
            href={attachment.contentUri}
            target="_blank"
            rel="noopener noreferrer"
            className="typography-mainText flex min-w-0 items-center gap-1 text-primary-f"
            data-sign="postFile"
          >
            <Icon symbol={DownloadMd} size="small" />
            <span className="truncate">{attachment.name}</span>
          </a>
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
}: {
  post: TeamMessagingPostItem;
  emojiLookup?: EmojiLookup;
  renderMention: (type: MentionType, id: string) => ReactNode;
}): React.ReactElement {
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
      <Attachments post={post} />
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
}: PostItemProps): React.ReactElement {
  const creatorId = post.creatorId;
  const creatorName = getMemberName(post.creator);
  const openCreator = creatorId ? () => openPerson(creatorId) : undefined;
  const renderMention = (mentionType: MentionType, id: string): ReactNode => {
    // A Team mention with the id -1 is "@Team", the whole chat.
    const type = mentionType === 'Team' && id === '-1' ? 'All' : mentionType;
    const mentioned = post.mentions?.find((mention) => mention.id === id);
    const name =
      type === 'All'
        ? (id === '-1' ? t('atTeam') : id)
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
  return (
    <div
      className={showCreator ? 'flex gap-2 px-3 pt-3' : 'flex gap-2 px-3 pt-1'}
      data-sign="postItem"
    >
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
        />
        <SendStatus status={post.sendStatus} />
      </div>
    </div>
  );
}
