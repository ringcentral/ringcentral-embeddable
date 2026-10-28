import {
  Badge,
  ListItem,
  ListItemText,
  Text,
} from '@ringcentral/spring-ui';
import React from 'react';

import type { TeamMessagingChatItem } from '../../../services/TeamMessaging';
import { getPostAbstract, type EmojiLookup } from '../formatPostText';
import { getUnreadBadgeColor } from '../getUnreadBadgeColor';
import { ChatAvatar } from './ChatAvatar';
import { FavoriteButton } from './FavoriteButton';

const GROUP_MEMBER_COUNT = 2;

/**
 * The latest post's summary. In a group, other people's posts start with the
 * sender's first name, as in the legacy app.
 */
function getPreview(
  chat: TeamMessagingChatItem,
  emojiLookup?: EmojiLookup,
): string {
  const post = chat.latestPost;
  if (!post) {
    return '';
  }
  const abstract = getPostAbstract({
    post,
    members: chat.members,
    emojiLookup,
  });
  const firstName = post.creator?.firstName;
  const isGroup = chat.members.length > GROUP_MEMBER_COUNT;
  return isGroup && firstName && post.type === 'TextMessage'
    ? `${firstName}: ${abstract}`
    : abstract;
}

export function ChatListItem({
  chat,
  selected,
  emojiLookup,
  onSelect,
  onToggleFavorite,
  formatTime,
}: {
  chat: TeamMessagingChatItem;
  selected: boolean;
  emojiLookup?: EmojiLookup;
  onSelect: (chatId: string) => void;
  onToggleFavorite: (chatId: string) => void;
  formatTime: (utcTimestamp: number) => string;
}): React.ReactElement {
  const preview = getPreview(chat, emojiLookup);
  const time = chat.latestPost ? formatTime(chat.updatedTime) : '';
  const hasUnread = chat.unreadCount > 0;
  return (
    <ListItem
      data-sign="chatItem"
      divider
      hoverable
      clickable
      selected={selected}
      size="small"
      hoverActions={
        <FavoriteButton
          isFavorite={chat.isFavorite}
          onToggle={() => onToggleFavorite(chat.id)}
        />
      }
      onClick={() => onSelect(chat.id)}
    >
      <ChatAvatar chat={chat} />
      <ListItemText
        primary={chat.name}
        secondary={preview}
        classes={{ primary: hasUnread ? 'typography-subtitleBold' : '' }}
      />
      <div className="flex flex-none flex-col items-end gap-1 pl-2">
        {time ? (
          <Text className="typography-descriptor text-neutral-b2" title={time}>
            {time}
          </Text>
        ) : null}
        {hasUnread ? (
          <Badge
            count={chat.unreadCount}
            max={99}
            color={getUnreadBadgeColor(chat.unreadMention)}
            data-sign="chatUnreadCount"
          />
        ) : null}
      </div>
    </ListItem>
  );
}
