/** Base path of the Team Messaging v1 REST API. */
export const TEAM_MESSAGING_API_PATH = '/team-messaging/v1';

/** Event filter for post events (`PostAdded`, `PostChanged`, `PostRemoved`). */
export const TEAM_MESSAGING_POSTS_EVENT_FILTER = '/team-messaging/v1/posts';

/** Event filter for chat events (`GroupJoined`, `GroupLeft`, ...). */
export const TEAM_MESSAGING_CHATS_EVENT_FILTER = '/team-messaging/v1/chats';

/** The legacy app loaded one page of up to 250 chats; the API has no paging. */
export const RECENT_CHATS_RECORD_COUNT = 250;

/** The API keeps at most 250 favorite chats and has no paging. */
export const FAVORITE_CHATS_RECORD_COUNT = 250;

/**
 * The v1 API returns no members for Team and Everyone chats. Only the legacy
 * Glip groups API does, so it is used for that alone.
 */
export const LEGACY_GLIP_GROUPS_PATH = '/restapi/v1.0/glip/groups';

/**
 * Member profiles loaded when a chat opens, for mention suggestions. An
 * Everyone chat can have thousands of members.
 */
export const MAX_MEMBER_PROFILES = 300;

/**
 * People a new conversation can include besides the user. The API takes at
 * most 15 member ids, the user's own included.
 */
export const MAX_CONVERSATION_PEOPLE = 14;

/** Posts loaded per page, as in the legacy app. */
export const POSTS_PER_PAGE = 20;

/** The persons API accepts at most 30 ids per batch request. */
export const PERSONS_BATCH_SIZE = 30;

/** Pause between persons batch requests, as in the legacy app. */
export const PERSONS_BATCH_DELAY_MS = 1000;

/** Chats whose posts are preloaded after the chat list loads. */
export const PRELOAD_CHAT_COUNT = 20;

/** Pause between two preloaded chats; the posts API is in the Medium rate group. */
export const PRELOAD_POSTS_DELAY_MS = 800;

/** How long loaded chats and posts stay fresh. */
export const TEAM_MESSAGING_TTL_MS = 30 * 60 * 1000;

/**
 * A chat seen for the first time is treated as read up to two hours ago, so
 * its recent posts count as unread, as in the legacy app.
 */
export const INITIAL_READ_TIME_OFFSET_MS = 2 * 60 * 60 * 1000;

/** Error returned when the RingCentral account has no team messaging company. */
export const COMPANY_NOT_FOUND_MESSAGE =
  'Company associated with RC account is not found';

/** Id prefix of a post that is still being sent. */
export const LOCAL_POST_ID_PREFIX = 'local-';
