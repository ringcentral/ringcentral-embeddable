import type { WebSocketSubscription as Subscription } from '@ringcentral-integration/micro-auth/src/app/services';
import { type RcModule, watch } from '@ringcentral-integration/next-core';

import {
  COMPANY_NOT_FOUND_MESSAGE,
  LOCAL_POST_ID_PREFIX,
} from './TeamMessaging.constants';
import type {
  TeamMessagingChat,
  TeamMessagingChatEvent,
  TeamMessagingPost,
} from './TeamMessaging.interface';

type ApiError = {
  message?: string;
  response?: { status?: number };
};

/**
 * Whether the error means the account has no team messaging company, which
 * the legacy app treated as "team messaging is not available".
 */
export function isCompanyNotFoundError(error: unknown): boolean {
  const apiError = error as ApiError | undefined;
  return !!apiError?.message?.includes(COMPANY_NOT_FOUND_MESSAGE);
}

/** Normalize a chat event body into the REST chat shape. */
export function normalizeChatEvent(
  event: TeamMessagingChatEvent,
): TeamMessagingChat {
  return {
    id: event.id,
    type: event.type,
    name: event.name ?? undefined,
    description: event.description ?? undefined,
    status: event.status,
    public: event.isPublic ?? undefined,
    creationTime: event.creationTime,
    lastModifiedTime: event.lastModifiedTime,
    members: (event.members ?? []).map((id) => ({ id })),
  };
}

/** Insert or replace a chat by id, keeping the newest changes first. */
export function upsertChat(
  chats: readonly TeamMessagingChat[],
  chat: TeamMessagingChat,
): TeamMessagingChat[] {
  const existing = chats.find((item) => item.id === chat.id);
  const merged = existing ? { ...existing, ...chat } : chat;
  return [merged, ...chats.filter((item) => item.id !== chat.id)];
}

/** Insert or replace posts by id, keeping the newest first. */
export function upsertPosts(
  posts: readonly TeamMessagingPost[],
  newPosts: readonly TeamMessagingPost[],
): TeamMessagingPost[] {
  const newIds = new Set(newPosts.map((post) => post.id));
  return [...newPosts, ...posts.filter((post) => !newIds.has(post.id))].sort(
    (first, second) => getPostTime(second) - getPostTime(first),
  );
}

export function getPostTime(post?: TeamMessagingPost): number {
  return post?.creationTime ? new Date(post.creationTime).getTime() : 0;
}

/** A post's chat: fetched posts have `chatId`, post events `groupId`. */
export function getPostChatId(post: TeamMessagingPost): string | undefined {
  return post.groupId ?? post.chatId;
}

/** A thread reply, which the chat's post list hides under its parent. */
export function isThreadReply(post: TeamMessagingPost): boolean {
  return !!post.parentPostId || (!!post.threadId && !post.isParent);
}

export function isLocalPost(post: TeamMessagingPost): boolean {
  return !!post.id?.startsWith(LOCAL_POST_ID_PREFIX);
}

/** Split ids into chunks of at most `size`. */
export function chunkIds(ids: readonly string[], size: number): string[][] {
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += size) {
    chunks.push(ids.slice(i, i + size));
  }
  return chunks;
}

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Keep an event filter subscribed only while `isEnabled` is true. Team
 * messaging events are only requested when the extension has the
 * `TeamMessaging` feature. Call it on the server port.
 */
export function bindEventFilter({
  module,
  subscription,
  filter,
  isEnabled,
}: {
  module: RcModule;
  subscription: Subscription;
  filter: string;
  isEnabled: () => boolean;
}): () => void {
  const update = (ready: boolean, enabled: boolean): void => {
    if (!ready) {
      return;
    }
    if (enabled) {
      void subscription.subscribe([filter]);
      return;
    }
    if (subscription.filters.includes(filter)) {
      void subscription.unsubscribe([filter]);
    }
  };
  update(subscription.ready, isEnabled());
  return watch(
    module,
    () => [subscription.ready, isEnabled()] as const,
    ([ready, enabled]) => update(ready, enabled),
    { multiple: true },
  );
}
