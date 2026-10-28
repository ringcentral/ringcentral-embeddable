import { getPostTime } from './TeamMessaging.helper';
import type {
  TeamMessagingChat,
  TeamMessagingChatItem,
  TeamMessagingMember,
  TeamMessagingPerson,
  TeamMessagingPost,
  TeamMessagingPostItem,
  TeamMessagingUnreadMention,
} from './TeamMessaging.interface';

type PersonsMap = Record<string, TeamMessagingPerson>;

/** A person's display name: full name, then email, then id. */
export function getPersonName(person?: TeamMessagingPerson): string {
  if (!person) {
    return '';
  }
  const fullName = [person.firstName, person.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();
  return fullName || person.email || person.id || '';
}

export function getMember({
  id,
  personsMap,
  myId,
}: {
  id: string;
  personsMap: PersonsMap;
  myId?: string;
}): TeamMessagingMember {
  return { ...personsMap[id], id, isMe: id === myId };
}

/**
 * A chat's name: its own name for teams, otherwise the names of the members
 * other than me, as in the legacy app.
 */
export function getChatName(
  chat: TeamMessagingChat,
  members: readonly TeamMessagingMember[],
): string {
  if (chat.name) {
    return chat.name;
  }
  const others = members.filter((member) => !member.isMe);
  const named = others.length > 0 ? others : members;
  return named.map((member) => getPersonName(member)).join(', ');
}

export function toPostItem({
  post,
  personsMap,
  myId,
}: {
  post: TeamMessagingPost;
  personsMap: PersonsMap;
  myId?: string;
}): TeamMessagingPostItem {
  const creatorId = post.creatorId;
  return {
    ...post,
    creator: creatorId
      ? getMember({ id: creatorId, personsMap, myId })
      : undefined,
    sentByMe: !!creatorId && creatorId === myId,
  };
}

/** The RingCentral app writes "@Team" as this anchor in the post text. */
const AT_TEAM_ANCHOR = "class='at_mention_compose'";

/** Posts by others, created after the chat was last read and already sent. */
function getUnreadPosts({
  posts,
  readTime,
  myId,
}: {
  posts: readonly TeamMessagingPost[];
  readTime?: number;
  myId?: string;
}): TeamMessagingPost[] {
  if (!readTime) {
    return [];
  }
  return posts.filter(
    (post) =>
      !post.sendStatus &&
      post.creatorId !== myId &&
      getPostTime(post) > readTime,
  );
}

function isMentioningMe(post: TeamMessagingPost, myId?: string): boolean {
  return (
    !!myId &&
    (!!post.mentions?.some(
      (mention) => mention.type === 'Person' && mention.id === myId,
    ) ||
      !!post.text?.includes(`![:Person](${myId})`))
  );
}

function isMentioningTeam(post: TeamMessagingPost, chatId: string): boolean {
  return (
    !!post.text?.includes(AT_TEAM_ANCHOR) ||
    !!post.text?.includes('![:All](') ||
    !!post.text?.includes('![:Team](-1)') ||
    !!post.mentions?.some(
      (mention) => mention.type === 'Team' && mention.id === chatId,
    )
  );
}

/** Whether unread posts mention the user, or the whole team ("@Team"). */
function getUnreadMention({
  unreadPosts,
  chatId,
  myId,
}: {
  unreadPosts: readonly TeamMessagingPost[];
  chatId: string;
  myId?: string;
}): TeamMessagingUnreadMention {
  if (unreadPosts.some((post) => isMentioningMe(post, myId))) {
    return 'me';
  }
  if (unreadPosts.some((post) => isMentioningTeam(post, chatId))) {
    return 'team';
  }
  return null;
}

/**
 * Recent chats, then favorite chats that are not recent. A favorite can be
 * older than the recent chats the API returns.
 */
function mergeChats(
  chats: readonly TeamMessagingChat[],
  favoriteChats: readonly TeamMessagingChat[],
): TeamMessagingChat[] {
  const ids = new Set(chats.map((chat) => chat.id));
  return [...chats, ...favoriteChats.filter((chat) => !ids.has(chat.id))];
}

/** Build the chat list, newest activity first. */
export function getChatItems({
  chats,
  favoriteChats = [],
  personsMap,
  postsMap,
  readTimeMap,
  myId,
}: {
  chats: readonly TeamMessagingChat[];
  favoriteChats?: readonly TeamMessagingChat[];
  personsMap: PersonsMap;
  postsMap: Record<string, TeamMessagingPost[]>;
  readTimeMap: Record<string, number>;
  myId?: string;
}): TeamMessagingChatItem[] {
  const favoriteIds = new Set(favoriteChats.map((chat) => chat.id));
  return mergeChats(chats, favoriteChats)
    .filter((chat) => !!chat.id)
    .map((chat) => {
      const members = (chat.members ?? []).map(({ id }) =>
        getMember({ id, personsMap, myId }),
      );
      const posts = postsMap[chat.id] ?? [];
      const latestPost = posts[0]
        ? toPostItem({ post: posts[0], personsMap, myId })
        : undefined;
      const unreadPosts = getUnreadPosts({
        posts,
        readTime: readTimeMap[chat.id],
        myId,
      });
      const chatTime = chat.lastModifiedTime
        ? new Date(chat.lastModifiedTime).getTime()
        : 0;
      return {
        id: chat.id,
        type: chat.type,
        name: getChatName(chat, members),
        members,
        latestPost,
        unreadCount: unreadPosts.length,
        unreadMention: getUnreadMention({
          unreadPosts,
          chatId: chat.id,
          myId,
        }),
        isFavorite: favoriteIds.has(chat.id),
        updatedTime: latestPost ? getPostTime(latestPost) : chatTime,
      };
    })
    .sort((first, second) => second.updatedTime - first.updatedTime);
}

/**
 * Whether a chat matches the search text: its name, or a loaded post's text
 * or mentioned names, as in the legacy app.
 */
export function matchChatItem({
  item,
  posts,
  searchText,
}: {
  item: TeamMessagingChatItem;
  posts: readonly TeamMessagingPost[];
  searchText: string;
}): boolean {
  if (item.name?.toLowerCase().includes(searchText)) {
    return true;
  }
  return posts.some(
    (post) =>
      !!post.text?.toLowerCase().includes(searchText) ||
      !!post.mentions?.some((mention) =>
        mention.name?.toLowerCase().includes(searchText),
      ),
  );
}
