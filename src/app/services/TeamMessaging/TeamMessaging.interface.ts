import type TMChatInfo from '@rc-ex/core/lib/definitions/TMChatInfo';
import type TMPersonInfo from '@rc-ex/core/lib/definitions/TMPersonInfo';
import type TMPostInfo from '@rc-ex/core/lib/definitions/TMPostInfo';
import type TMNoteWithBodyInfo from '@rc-ex/core/lib/definitions/TMNoteWithBodyInfo';
import type TMTaskInfo from '@rc-ex/core/lib/definitions/TMTaskInfo';

/** A chat as kept in the chat list, normalized from the REST API or an event. */
export type TeamMessagingChat = TMChatInfo;

export type TeamMessagingChatType = NonNullable<TMChatInfo['type']>;

export type TeamMessagingPerson = TMPersonInfo;

/** A post that is being sent, or failed to send, is only kept locally. */
export type TeamMessagingPostSendStatus = 'sending' | 'failed';

export interface TeamMessagingPost extends TMPostInfo {
  sendStatus?: TeamMessagingPostSendStatus;
  /** Fetched posts name their chat `chatId`; post events use `groupId`. */
  chatId?: string;
  /** The thread a parent or reply belongs to. */
  threadId?: string;
  /** Set on a reply: the post it replies to. */
  parentPostId?: string;
  /** Set on the first post of a thread. */
  isParent?: boolean;
}

/** A chat member with the person's details, when they are loaded. */
export interface TeamMessagingMember extends TMPersonInfo {
  id: string;
  isMe: boolean;
}

/** A post with its creator's details, for rendering. */
export interface TeamMessagingPostItem extends TeamMessagingPost {
  creator?: TeamMessagingMember;
  sentByMe: boolean;
}

/**
 * The strongest mention among a chat's unread posts: the user, the whole
 * team ("@Team"), or none.
 */
export type TeamMessagingUnreadMention = 'me' | 'team' | null;

/** A chat with everything the chat list renders. */
export interface TeamMessagingChatItem {
  id: string;
  type?: TeamMessagingChatType;
  name?: string;
  members: TeamMessagingMember[];
  latestPost?: TeamMessagingPostItem;
  unreadCount: number;
  unreadMention: TeamMessagingUnreadMention;
  isFavorite: boolean;
  /** Time of the latest post, or of the last chat change. */
  updatedTime: number;
}

export type TeamMessagingTask = TMTaskInfo;

/** A note; its HTML `body` is only known once the note is loaded. */
export type TeamMessagingNote = TMNoteWithBodyInfo;

/** The tasks drawer lists open (pending or in progress) or completed tasks. */
export type TeamMessagingTaskFilter = 'Open' | 'Completed';

/** The chat list's read status filter, as in the SMS list. */
export type TeamMessagingReadStatusFilter = 'All' | 'Unread';

/** The legacy Glip group, read only for its member ids. */
export interface LegacyGlipGroup {
  id: string;
  members?: string[];
}

export type TeamMessagingChatEventType =
  | 'GroupJoined'
  | 'GroupLeft'
  | 'GroupRenamed'
  | 'GroupChanged';

/** The body of a `/team-messaging/v1/chats` event. */
export interface TeamMessagingChatEvent {
  id: string;
  name?: string | null;
  description?: string | null;
  type?: TeamMessagingChatType;
  status?: TMChatInfo['status'];
  /** Member ids. The REST chat uses `[{ id }]` instead. */
  members?: string[];
  isPublic?: boolean | null;
  creationTime?: string;
  lastModifiedTime?: string;
  eventType: TeamMessagingChatEventType;
}

export type TeamMessagingPostEventType =
  | 'PostAdded'
  | 'PostChanged'
  | 'PostRemoved';

/** The body of a `/team-messaging/v1/posts` event. */
export interface TeamMessagingPostEvent extends TMPostInfo {
  eventType: TeamMessagingPostEventType;
}

/**
 * The outcome of a delegated action. Errors thrown on the server port never
 * reach a client, so failures are returned as values.
 */
export interface TeamMessagingResult {
  ok: boolean;
  /** The chat or post the action created or opened. */
  id?: string;
}

/** A file to upload with a post. */
export interface TeamMessagingFileUpload {
  name: string;
  /** The file content as a base64 data URL, so it can cross ports. */
  base64Url: string;
}

export interface SendTeamMessagingPostParams {
  chatId: string;
  /** Mentions are written as `![:Person](id)`. Optional with files. */
  text?: string;
  files?: TeamMessagingFileUpload[];
  /** Reply in this thread. */
  threadId?: string;
  /** Reply to this post, starting its thread when it has none. */
  parentPostId?: string;
}

export interface CreateTeamParams {
  name: string;
  emails: string[];
}

export interface TeamMessagingOptions {
  /** Chats whose posts are preloaded after the chat list loads. */
  preloadChatCount?: number;
  /** Pause between two preloaded chats, in milliseconds. */
  preloadPostsDelay?: number;
  /** Posts loaded per page. */
  postsPerPage?: number;
  /** How long loaded chats and posts stay fresh, in milliseconds. */
  ttl?: number;
}
