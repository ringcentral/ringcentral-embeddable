import type TMPostsList from '@rc-ex/core/lib/definitions/TMPostsList';
import {
  AppFeatures,
  Client,
} from '@ringcentral-integration/micro-auth/src/app/services';
import {
  action,
  delegate,
  injectable,
  RcModule,
  state,
} from '@ringcentral-integration/next-core';

import { POSTS_PER_PAGE, TEAM_MESSAGING_API_PATH } from './TeamMessaging.constants';
import { upsertPosts } from './TeamMessaging.helper';
import type {
  TeamMessagingPost,
  TeamMessagingPostSendStatus,
} from './TeamMessaging.interface';
import { TeamMessagingPersons } from './TeamMessagingPersons';

/**
 * Thread replies, by thread id, kept in memory. The chat's own post list
 * holds replies too, but a thread page also needs replies to a parent that
 * is older than the loaded posts, so each open thread loads its own.
 */
@injectable({
  name: 'TeamMessagingThreads',
})
export class TeamMessagingThreads extends RcModule {
  constructor(
    protected _client: Client,
    protected _appFeatures: AppFeatures,
    protected _teamMessagingPersons: TeamMessagingPersons,
  ) {
    super();
  }

  /** Replies of each thread, newest first. */
  @state
  repliesMap: Record<string, TeamMessagingPost[]> = {};

  /** Token of the next older page of each thread, or `null` at its start. */
  @state
  olderPageTokens: Record<string, string | null> = {};

  @state
  loadingThreadIds: Record<string, boolean> = {};

  /** Thread parents fetched by id, when they are not in the loaded posts. */
  @state
  parentsMap: Record<string, TeamMessagingPost> = {};

  @action
  upsertReplies(threadId: string, posts: TeamMessagingPost[]): void {
    this.repliesMap[threadId] = upsertPosts(
      this.repliesMap[threadId] ?? [],
      posts,
    );
  }

  @action
  removeReply(threadId: string, postId: string): void {
    const replies = this.repliesMap[threadId];
    if (replies) {
      this.repliesMap[threadId] = replies.filter(({ id }) => id !== postId);
    }
  }

  /** Remove a reply from whichever thread loaded it, such as a deleted one. */
  @action
  removePost(postId: string): void {
    Object.keys(this.repliesMap).forEach((threadId) => {
      const replies = this.repliesMap[threadId];
      if (replies.some(({ id }) => id === postId)) {
        this.repliesMap[threadId] = replies.filter(({ id }) => id !== postId);
      }
    });
  }

  @action
  setReplySendStatus(
    threadId: string,
    postId: string,
    sendStatus: TeamMessagingPostSendStatus,
  ): void {
    const reply = this.repliesMap[threadId]?.find(({ id }) => id === postId);
    if (reply) {
      reply.sendStatus = sendStatus;
    }
  }

  /** Update a parent fetched by id, such as when its first reply starts it. */
  @action
  updateParent(postId: string, changes: Partial<TeamMessagingPost>): void {
    const parent = this.parentsMap[postId];
    if (parent) {
      this.parentsMap[postId] = { ...parent, ...changes };
    }
  }

  @action
  private _saveParent(post: TeamMessagingPost): void {
    if (post.id) {
      this.parentsMap[post.id] = post;
    }
  }

  @action
  private _setLoading(threadId: string, loading: boolean): void {
    this.loadingThreadIds[threadId] = loading;
  }

  @action
  private _setOlderPageToken(threadId: string, token: string | null): void {
    this.olderPageTokens[threadId] = token;
  }

  @action
  private _reset(): void {
    this.repliesMap = {};
    this.olderPageTokens = {};
    this.loadingThreadIds = {};
    this.parentsMap = {};
  }

  override onReset(): void {
    this._reset();
  }

  /** Load a thread's newest replies. */
  @delegate('server')
  async loadThread(chatId: string, threadId: string): Promise<void> {
    await this._fetchReplies(chatId, threadId);
  }

  /** Load the next page of older replies. Resolves `false` when there is none. */
  @delegate('server')
  async loadOlderReplies(chatId: string, threadId: string): Promise<boolean> {
    const pageToken = this.olderPageTokens[threadId];
    if (!pageToken) {
      return false;
    }
    await this._fetchReplies(chatId, threadId, pageToken);
    return true;
  }

  /** Load a thread's parent post that is not among the loaded posts. */
  @delegate('server')
  async loadParent(chatId: string, postId: string): Promise<void> {
    if (!this._appFeatures.hasGlipPermission || this.parentsMap[postId]) {
      return;
    }
    try {
      const response = await this._client.service
        .platform()
        .get(`${TEAM_MESSAGING_API_PATH}/chats/${chatId}/posts/${postId}`);
      const post = (await response.json()) as TeamMessagingPost;
      this._saveParent(post);
      if (post.creatorId) {
        void this._teamMessagingPersons.loadPersons([post.creatorId]);
      }
    } catch (error) {
      this.logger.error('load thread parent failed', error);
    }
  }

  private async _fetchReplies(
    chatId: string,
    threadId: string,
    pageToken?: string,
  ): Promise<void> {
    if (!this._appFeatures.hasGlipPermission) {
      return;
    }
    this._setLoading(threadId, true);
    try {
      const response = await this._client.service
        .platform()
        .get(
          `${TEAM_MESSAGING_API_PATH}/chats/${chatId}/threads/${threadId}/posts`,
          { recordCount: POSTS_PER_PAGE, ...(pageToken ? { pageToken } : {}) },
        );
      const { records = [], navigation } =
        (await response.json()) as TMPostsList;
      this.upsertReplies(threadId, records);
      // As in the chat's posts, the previous page holds older posts.
      this._setOlderPageToken(threadId, navigation?.prevPageToken ?? null);
      void this._teamMessagingPersons.loadPersons(
        records.map(({ creatorId }) => creatorId).filter(Boolean),
      );
    } catch (error) {
      this.logger.error('load thread replies failed', error);
    } finally {
      this._setLoading(threadId, false);
    }
  }
}
