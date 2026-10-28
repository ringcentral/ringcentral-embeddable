import { TeamMd } from '@ringcentral/spring-icon';
import { Avatar } from '@ringcentral/spring-ui';
import React from 'react';

import type {
  TeamMessagingChatItem,
  TeamMessagingMember,
} from '../../../services/TeamMessaging';
import { getPersonName } from '../../../services/TeamMessaging';

type AvatarSize = 'xsmall' | 'small' | 'medium' | 'large';

/** The member a 1:1 or personal chat shows, as in the legacy app. */
function getAvatarMember(
  chat: TeamMessagingChatItem,
): TeamMessagingMember | undefined {
  if (chat.type === 'Team' || chat.type === 'Everyone') {
    return undefined;
  }
  if (chat.members.length > 2) {
    return undefined;
  }
  return chat.members.find((member) => !member.isMe) ?? chat.members[0];
}

export function PersonAvatar({
  member,
  size = 'medium',
  onClick,
}: {
  member?: TeamMessagingMember;
  size?: AvatarSize;
  onClick?: () => void;
}): React.ReactElement {
  const name = getPersonName(member);
  return (
    <Avatar
      size={size}
      src={member?.avatar || undefined}
      alt={name}
      clickable={!!onClick}
      rootProps={onClick ? { onClick } : undefined}
    >
      {name ? name.charAt(0).toUpperCase() : undefined}
    </Avatar>
  );
}

/** A person's avatar for 1:1 chats, a team icon for teams and groups. */
export function ChatAvatar({
  chat,
  size = 'medium',
}: {
  chat: TeamMessagingChatItem;
  size?: AvatarSize;
}): React.ReactElement {
  const member = getAvatarMember(chat);
  if (member) {
    return <PersonAvatar member={member} size={size} />;
  }
  return <Avatar size={size} symbol={TeamMd} alt={chat.name} />;
}
