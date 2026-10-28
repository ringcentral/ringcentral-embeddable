import type { TeamMessagingUnreadMention } from '../../services/TeamMessaging';

export type UnreadBadgeColor = 'warning' | 'primary' | 'secondary';

/**
 * Unread badge color: a mention of the user stands out most, then "@Team";
 * other unread posts are gray.
 */
export function getUnreadBadgeColor(
  mention: TeamMessagingUnreadMention,
): UnreadBadgeColor {
  if (mention === 'me') {
    return 'warning';
  }
  return mention === 'team' ? 'primary' : 'secondary';
}

/** The strongest of several chats' unread mentions. */
export function getStrongestMention(
  mentions: readonly TeamMessagingUnreadMention[],
): TeamMessagingUnreadMention {
  if (mentions.includes('me')) {
    return 'me';
  }
  return mentions.includes('team') ? 'team' : null;
}
