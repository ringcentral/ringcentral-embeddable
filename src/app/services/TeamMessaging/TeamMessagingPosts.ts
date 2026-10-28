import type TMAddFile from '@rc-ex/core/lib/definitions/TMAddFile';
import type TMCreatePostRequest from '@rc-ex/core/lib/definitions/TMCreatePostRequest';
import type TMPostsList from '@rc-ex/core/lib/definitions/TMPostsList';
import {
  AppFeatures,
  Auth,
  Client,
  ExtensionFeatures,
  type WebSocketSubscription as Subscription,
} from '@ringcentral-integration/micro-auth/src/app/services';
import {
  action,
  delegate,
  injectable,
  optional,
  RcModule,
  state,
  storage,
  StoragePlugin,
  takeUntilAppDestroy,
} from '@ringcentral-integration/next-core';
import { base64ToBlob } from '@ringcentral-integration/utils';
import { Subject } from 'rxjs';
import { filter, tap } from 'rxjs/operators';

import {
  LOCAL_POST_ID_PREFIX,
  POSTS_PER_PAGE,
  TEAM_MESSAGING_API_PATH,
  TEAM_MESSAGING_POSTS_EVENT_FILTER,
  TEAM_MESSAGING_TTL_MS,
} from './TeamMessaging.constants';
import {
  bindEventFilter,
  getPostTime,
  isLocalPost,
  upsertPosts,
} from './TeamMessaging.helper';
import type {
  SendTeamMessagingFileParams,
  TeamMessagingOptions,
  TeamMessagingPost,
  TeamMessagingPostEvent,
  TeamMessagingResult,
} from './TeamMessaging.interface';
import { TeamMessagingPersons } from './TeamMessagingPersons';

const POSTS_EVENT_PATTERN = /\/team-messaging\/v1\/posts$/;

/**
 * Posts of each chat, kept in memory, plus the time each chat was last read,
 * kept in storage. Posts update live from `/team-messaging/v1/posts` events
 * when the extension has the `TeamMessaging` feature.
 */
@injectable({
  name: 'TeamMessagingPosts',
})
export class TeamMessagingPosts extends RcModule {
  private _fetchPromises = new Map<string, Promise<void>>();

  private _localPostCount = 0;

  /** Emits each post another person adds. */
  readonly newPost$ = new Subject<TeamMessagingPost>();

  constructor(
    protected _auth: Auth,
    protected _client: Client,
    protected _appFeatures: AppFeatures,
    protected _extensionFeatures: ExtensionFeatures,
    protected _teamMessagingPersons: TeamMessagingPersons,
    protected _storage: StoragePlugin,
    @optional('Subscription') protected _subscription?: Subscription,
    @optional('TeamMessagingOptions')
    protected _options?: TeamMessagingOptions,
  ) {
    super();
    this._storage.enable(this);
  }

  /** Posts of each chat, newest first. */
  @state
  postsMap: Record<string, TeamMessagingPost[]> = {};

  /** Token of the next older page of each chat, or `null` at the first post. */
  @state
  olderPageTokens: Record<string, string | null> = {};

  @state
  fetchTimes: Record<string, number> = {};

  @state
  loadingChatIds: Record<string, boolean> = {};

  /** The time each chat was last read. */
  @storage
  @state
  readTimeMap: Record<string, number> = {};

  get hasPermission(): boolean {
    return this._appFeatures.hasGlipPermission;
  }

  /** Live events need the extension's `TeamMessaging` feature. */
  get hasEventPermission(): boolean {
    return (
      this.hasPermission &&
      !!this._extensionFeatures.features?.TeamMessaging?.available
    );
  }

  override onInitOnce(): void {
    if (!this._subscription) {
      return;
    }
    bindEventFilter({
      module: this,
      subscription: this._subscription,
      filter: TEAM_MESSAGING_POSTS_EVENT_FILTER,
      isEnabled: () => this.hasEventPermission,
    });
    this._subscription
      .fromMessage$<TeamMessagingPostEvent>(POSTS_EVENT_PATTERN)
      .pipe(
        filter(() => this.ready && this.hasEventPermission),
        tap((event) => this._handlePostEvent(event)),
        takeUntilAppDestroy,
      )
      .subscribe();
  }

  override onReset(): void {
    this._fetchPromises.clear();
    this._resetPosts();
  }

  @action
  private _resetPosts(): void {
    this.postsMap = {};
    this.olderPageTokens = {};
    this.fetchTimes = {};
    this.loadingChatIds = {};
  }

  private get _postsPerPage(): number {
    return this._options?.postsPerPage ?? POSTS_PER_PAGE;
  }

  private get _ttl(): number {
    return this._options?.ttl ?? TEAM_MESSAGING_TTL_MS;
  }

  /** Load a chat's newest posts unless they were loaded recently. */
  @delegate('server')
  async loadPosts(chatId: string): Promise<void> {
    const fetchTime = this.fetchTimes[chatId];
    if (fetchTime && Date.now() - fetchTime < this._ttl) {
      return;
    }
    await this.fetchPosts(chatId);
  }

  /** Load the next page of older posts. Resolves `false` when there is none. */
  @delegate('server')
  async loadOlderPosts(chatId: string): Promise<boolean> {
    const pageToken = this.olderPageTokens[chatId];
    if (!pageToken) {
      return false;
    }
    await this.fetchPosts(chatId, pageToken);
    return true;
  }

  /** Fetch one page of posts. Concurrent fetches of a chat share one request. */
  fetchPosts(chatId: string, pageToken?: string): Promise<void> {
    const pending = this._fetchPromises.get(chatId);
    if (pending) {
      return pending;
    }
    const promise = this._fetchPosts(chatId, pageToken).finally(() => {
      this._fetchPromises.delete(chatId);
    });
    this._fetchPromises.set(chatId, promise);
    return promise;
  }

  private async _fetchPosts(chatId: string, pageToken?: string): Promise<void> {
    if (!this.hasPermission) {
      return;
    }
    this._setLoading(chatId, true);
    try {
      const response = await this._client.service
        .platform()
        .get(`${TEAM_MESSAGING_API_PATH}/chats/${chatId}/posts`, {
          recordCount: this._postsPerPage,
          ...(pageToken ? { pageToken } : {}),
        });
      const { records = [], navigation } =
        (await response.json()) as TMPostsList;
      this._savePage({
        chatId,
        posts: records,
        olderPageToken: navigation?.prevPageToken ?? null,
        isFirstPage: !pageToken,
      });
      void this._loadCreators(records);
    } catch (error) {
      this.logger.error('load team messaging posts failed', error);
    } finally {
      this._setLoading(chatId, false);
    }
  }

  @action
  private _setLoading(chatId: string, loading: boolean): void {
    this.loadingChatIds[chatId] = loading;
  }

  @action
  private _savePage({
    chatId,
    posts,
    olderPageToken,
    isFirstPage,
  }: {
    chatId: string;
    posts: TeamMessagingPost[];
    olderPageToken: string | null;
    isFirstPage: boolean;
  }): void {
    const existing = this.postsMap[chatId] ?? [];
    // A first page replaces what was loaded, except posts still being sent.
    const kept = isFirstPage ? existing.filter(isLocalPost) : existing;
    this.postsMap[chatId] = upsertPosts(kept, posts);
    this.olderPageTokens[chatId] = olderPageToken;
    if (isFirstPage) {
      this.fetchTimes[chatId] = Date.now();
    }
  }

  @action
  private _upsertPosts(chatId: string, posts: TeamMessagingPost[]): void {
    this.postsMap[chatId] = upsertPosts(this.postsMap[chatId] ?? [], posts);
  }

  @action
  private _removePost(chatId: string, postId: string): void {
    const posts = this.postsMap[chatId];
    if (posts) {
      this.postsMap[chatId] = posts.filter((post) => post.id !== postId);
    }
  }

  @action
  private _setSendStatus(
    chatId: string,
    postId: string,
    sendStatus: TeamMessagingPost['sendStatus'],
  ): void {
    const post = this.postsMap[chatId]?.find((item) => item.id === postId);
    if (post) {
      post.sendStatus = sendStatus;
    }
  }

  @action
  private _setReadTime(chatId: string, time: number): void {
    this.readTimeMap[chatId] = time;
  }

  /** Mark a chat as read now. */
  @delegate('server')
  async markRead(chatId: string): Promise<void> {
    this._setReadTime(chatId, Date.now());
  }

  /** Seed the read time of a chat that has none yet. */
  seedReadTime(chatId: string, time: number): void {
    if (!this.readTimeMap[chatId]) {
      this._setReadTime(chatId, time);
    }
  }

  private _loadCreators(posts: TeamMessagingPost[]): Promise<void> {
    const ids = posts.flatMap((post) => [
      post.creatorId,
      ...(post.addedPersonIds ?? []),
    ]);
    return this._teamMessagingPersons.loadPersons(ids.filter(Boolean));
  }

  private _handlePostEvent(event: TeamMessagingPostEvent): void {
    const { eventType, ...post } = event;
    if (eventType === 'PostRemoved' || !post.groupId || !post.id) {
      return;
    }
    this._upsertPosts(post.groupId, [post]);
    void this._loadCreators([post]);
    if (eventType === 'PostAdded' && post.creatorId !== this._auth.ownerId) {
      // A chat that was never preloaded has no read time; its first new post
      // still counts as unread.
      this.seedReadTime(post.groupId, getPostTime(post) - 1);
      this.newPost$.next(post);
    }
  }

  private _createLocalPost(
    chatId: string,
    post: Partial<TeamMessagingPost>,
  ): TeamMessagingPost {
    this._localPostCount += 1;
    const now = new Date().toISOString();
    const localPost: TeamMessagingPost = {
      type: 'TextMessage',
      ...post,
      id: `${LOCAL_POST_ID_PREFIX}${Date.now()}-${this._localPostCount}`,
      groupId: chatId,
      creatorId: this._auth.ownerId,
      creationTime: now,
      lastModifiedTime: now,
      sendStatus: 'sending',
    };
    this._upsertPosts(chatId, [localPost]);
    return localPost;
  }

  /**
   * Send a post with an optimistic local copy. A failed post stays in the
   * list as "Send failed", as in the legacy app.
   */
  private async _sendPost(
    chatId: string,
    request: TMCreatePostRequest,
    localPost: TeamMessagingPost,
  ): Promise<TeamMessagingResult> {
    try {
      const response = await this._client.service
        .platform()
        .post(`${TEAM_MESSAGING_API_PATH}/chats/${chatId}/posts`, request);
      const post = (await response.json()) as TeamMessagingPost;
      this._removePost(chatId, localPost.id!);
      this._upsertPosts(chatId, [post]);
      this._setReadTime(chatId, Date.now());
      return { ok: true, id: post.id };
    } catch (error) {
      this.logger.error('send team messaging post failed', error);
      this._setSendStatus(chatId, localPost.id!, 'failed');
      return { ok: false };
    }
  }

  /** Send a text post. Mentions are written as `![:Person](id)`. */
  @delegate('server')
  async sendText({
    chatId,
    text,
  }: {
    chatId: string;
    text: string;
  }): Promise<TeamMessagingResult> {
    const localPost = this._createLocalPost(chatId, { text });
    return this._sendPost(chatId, { text }, localPost);
  }

  /**
   * Send a file as its own post. Uploading does not post the file, so the
   * uploaded file is attached to a new post.
   */
  @delegate('server')
  async sendFile({
    chatId,
    name,
    base64Url,
  }: SendTeamMessagingFileParams): Promise<TeamMessagingResult> {
    const localPost = this._createLocalPost(chatId, {
      attachments: [{ type: 'File', name }],
    });
    let file: TMAddFile;
    try {
      file = await this._uploadFile({ chatId, name, base64Url });
    } catch (error) {
      this.logger.error('upload team messaging file failed', error);
      this._setSendStatus(chatId, localPost.id!, 'failed');
      return { ok: false };
    }
    return this._sendPost(
      chatId,
      { attachments: [{ id: file.id, type: 'File' }] },
      localPost,
    );
  }

  private async _uploadFile({
    chatId,
    name,
    base64Url,
  }: SendTeamMessagingFileParams): Promise<TMAddFile> {
    const formData = new FormData();
    formData.append('body', base64ToBlob(base64Url), name);
    const response = await this._client.service
      .platform()
      .post(`${TEAM_MESSAGING_API_PATH}/files`, formData, {
        groupId: chatId,
        name,
      });
    return (await response.json()) as TMAddFile;
  }
}
