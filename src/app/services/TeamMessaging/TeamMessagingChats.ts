import type TMChatListWithoutNavigation from '@rc-ex/core/lib/definitions/TMChatListWithoutNavigation';
import type TMConversationInfo from '@rc-ex/core/lib/definitions/TMConversationInfo';
import type TMCreateTeamRequest from '@rc-ex/core/lib/definitions/TMCreateTeamRequest';
import {
  AppFeatures,
  Auth,
  Client,
  ConnectivityMonitor,
  DataFetcher,
  DataFetcherConsumer,
  DataSource,
  ExtensionFeatures,
  type WebSocketSubscription as Subscription,
} from '@ringcentral-integration/micro-auth/src/app/services';
import {
  action,
  computed,
  delegate,
  injectable,
  optional,
  state,
  takeUntilAppDestroy,
  watch,
} from '@ringcentral-integration/next-core';
import { filter, tap } from 'rxjs/operators';

import {
  INITIAL_READ_TIME_OFFSET_MS,
  LEGACY_GLIP_GROUPS_PATH,
  MAX_MEMBER_PROFILES,
  PRELOAD_CHAT_COUNT,
  PRELOAD_POSTS_DELAY_MS,
  RECENT_CHATS_RECORD_COUNT,
  TEAM_MESSAGING_API_PATH,
  TEAM_MESSAGING_CHATS_EVENT_FILTER,
  TEAM_MESSAGING_TTL_MS,
} from './TeamMessaging.constants';
import {
  bindEventFilter,
  isCompanyNotFoundError,
  normalizeChatEvent,
  sleep,
  upsertChat,
} from './TeamMessaging.helper';
import type {
  CreateTeamParams,
  LegacyGlipGroup,
  TeamMessagingChat,
  TeamMessagingChatEvent,
  TeamMessagingChatItem,
  TeamMessagingOptions,
  TeamMessagingPost,
  TeamMessagingReadStatusFilter,
  TeamMessagingResult,
} from './TeamMessaging.interface';
import { getChatItems, matchChatItem } from './getChatItems';
import { TeamMessagingFavorites } from './TeamMessagingFavorites';
import { TeamMessagingPersons } from './TeamMessagingPersons';
import { TeamMessagingPosts } from './TeamMessagingPosts';

const CHATS_EVENT_PATTERN = /\/team-messaging\/v1\/chats$/;

/** Chat types whose members are loaded with the list, as in the legacy app. */
const MEMBER_PRELOAD_CHAT_TYPES = new Set(['Direct', 'Group', 'Personal']);

/**
 * The user's recent chats, their unread counts and the chat being viewed.
 * The list updates live from `/team-messaging/v1/chats` events when the
 * extension has the `TeamMessaging` feature.
 */
@injectable({
  name: 'TeamMessagingChats',
})
export class TeamMessagingChats extends DataFetcherConsumer<
  TeamMessagingChat[]
> {
  /** Bumped by each load, so an older preload stops early. */
  private _preloadGeneration = 0;

  /** The next preload refetches posts even when they are fresh. */
  private _forcePreload = false;

  /** Members and posts were loaded for the current session. */
  private _loadedThisSession = false;

  constructor(
    protected _auth: Auth,
    protected _client: Client,
    protected override _dataFetcher: DataFetcher,
    protected _appFeatures: AppFeatures,
    protected _extensionFeatures: ExtensionFeatures,
    protected _teamMessagingPersons: TeamMessagingPersons,
    protected _teamMessagingPosts: TeamMessagingPosts,
    protected _teamMessagingFavorites: TeamMessagingFavorites,
    @optional() protected _connectivityMonitor?: ConnectivityMonitor,
    @optional('Subscription') protected _subscription?: Subscription,
    @optional('TeamMessagingOptions')
    protected _options?: TeamMessagingOptions,
  ) {
    super(_dataFetcher);
    this._source = new DataSource({
      key: 'teamMessagingChats',
      cleanOnReset: true,
      ttl: this._options?.ttl ?? TEAM_MESSAGING_TTL_MS,
      fetchFunction: () => this._fetchChats(),
      readyCheckFunction: () => this._appFeatures.ready,
      permissionCheckFunction: () => this.hasPermission,
    });
    this._dataFetcher.register(this._source);
  }

  @state
  searchFilter = '';

  /** The chat whose page is open. New posts in it are read at once. */
  @state
  currentChatId: string | null = null;

  @state
  readStatusFilter: TeamMessagingReadStatusFilter = 'All';

  @action
  setSearchFilter(searchFilter: string): void {
    this.searchFilter = searchFilter;
  }

  @action
  setReadStatusFilter(readStatusFilter: TeamMessagingReadStatusFilter): void {
    this.readStatusFilter = readStatusFilter;
  }

  @action
  private _setCurrentChatId(chatId: string | null): void {
    this.currentChatId = chatId;
  }

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

  get chats(): TeamMessagingChat[] {
    return this.data ?? [];
  }

  get myId(): string | undefined {
    return this._auth.ownerId ?? undefined;
  }

  @computed((that: TeamMessagingChats) => [
    that.data,
    that._teamMessagingFavorites.favoriteChats,
    that._teamMessagingPersons.personsMap,
    that._teamMessagingPosts.postsMap,
    that._teamMessagingPosts.readTimeMap,
    that._auth.ownerId,
  ])
  get chatItems(): TeamMessagingChatItem[] {
    return getChatItems({
      chats: this.chats,
      favoriteChats: this._teamMessagingFavorites.favoriteChats,
      personsMap: this._teamMessagingPersons.personsMap,
      postsMap: this._teamMessagingPosts.postsMap,
      readTimeMap: this._teamMessagingPosts.readTimeMap,
      myId: this.myId,
    });
  }

  /** Chats matching the search text and the read status filter. */
  @computed((that: TeamMessagingChats) => [
    that.chatItems,
    that.searchFilter,
    that.readStatusFilter,
    that._teamMessagingPosts.postsMap,
  ])
  get filteredChatItems(): TeamMessagingChatItem[] {
    const searchText = this.searchFilter.trim().toLowerCase();
    const unreadOnly = this.readStatusFilter === 'Unread';
    return this.chatItems.filter(
      (item) =>
        (!unreadOnly || item.unreadCount > 0) &&
        (!searchText ||
          matchChatItem({
            item,
            posts: this._teamMessagingPosts.postsMap[item.id] ?? [],
            searchText,
          })),
    );
  }

  @computed((that: TeamMessagingChats) => [that.chatItems])
  get totalUnreadCount(): number {
    return this.chatItems.reduce((sum, item) => sum + item.unreadCount, 0);
  }

  getChatItem(chatId: string): TeamMessagingChatItem | undefined {
    return this.chatItems.find((item) => item.id === chatId);
  }

  override onInitOnce(): void {
    super.onInitOnce();
    this._teamMessagingPosts.newPost$
      .pipe(
        tap((post) => this._handleNewPost(post)),
        takeUntilAppDestroy,
      )
      .subscribe();
    this._bindConnectivity();
    if (!this._subscription) {
      return;
    }
    bindEventFilter({
      module: this,
      subscription: this._subscription,
      filter: TEAM_MESSAGING_CHATS_EVENT_FILTER,
      isEnabled: () => this.hasEventPermission,
    });
    this._subscription
      .fromMessage$<TeamMessagingChatEvent>(CHATS_EVENT_PATTERN)
      .pipe(
        filter(() => this.ready && this.hasEventPermission),
        tap((event) => this._handleChatEvent(event)),
        takeUntilAppDestroy,
      )
      .subscribe();
  }

  override onInit(): void {
    // A list served from the cache was not fetched, so nothing loaded it yet.
    if (!this._loadedThisSession && this.hasPermission && this.data) {
      void this._onChatsLoaded(this.data);
    }
  }

  override onReset(): void {
    this._preloadGeneration += 1;
    this._loadedThisSession = false;
    this._setCurrentChatId(null);
  }

  private _bindConnectivity(): void {
    if (!this._connectivityMonitor) {
      return;
    }
    watch(
      this,
      () => this._connectivityMonitor!.connectivity,
      (connectivity) => {
        if (connectivity && this.ready && this.hasPermission) {
          void this.fetchChats({ forcePreload: true });
        }
      },
    );
  }

  private async _fetchChats(): Promise<TeamMessagingChat[]> {
    let chats: TeamMessagingChat[] = [];
    try {
      const response = await this._client.service
        .platform()
        .get(`${TEAM_MESSAGING_API_PATH}/recent/chats`, {
          recordCount: RECENT_CHATS_RECORD_COUNT,
        });
      const { records = [] } =
        (await response.json()) as TMChatListWithoutNavigation;
      chats = records;
    } catch (error) {
      if (!isCompanyNotFoundError(error)) {
        throw error;
      }
    }
    // The fetcher saves the list after this resolves.
    setTimeout(() => {
      void this._onChatsLoaded(chats);
    }, 0);
    return chats;
  }

  /** Reload the chat list, then preload the newest chats' posts. */
  @delegate('server')
  async fetchChats({
    forcePreload = false,
  }: { forcePreload?: boolean } = {}): Promise<void> {
    this._forcePreload = forcePreload;
    try {
      await this._dataFetcher.fetchData(this._source);
    } catch (error) {
      this.logger.error('load team messaging chats failed', error);
    }
  }

  private async _onChatsLoaded(chats: TeamMessagingChat[]): Promise<void> {
    const force = this._forcePreload;
    this._forcePreload = false;
    this._loadedThisSession = true;
    void this._teamMessagingFavorites.fetchFavorites();
    const memberIds = chats
      .filter((chat) => MEMBER_PRELOAD_CHAT_TYPES.has(chat.type ?? ''))
      .flatMap((chat) => (chat.members ?? []).map(({ id }) => id));
    await this._teamMessagingPersons.loadPersons(
      [this.myId, ...memberIds].filter(Boolean),
    );
    await this._preloadPosts(chats, force);
  }

  /**
   * Load the newest chats' posts one at a time, so the list can show their
   * latest post and unread count, as in the legacy app.
   */
  private async _preloadPosts(
    chats: TeamMessagingChat[],
    force: boolean,
  ): Promise<void> {
    this._preloadGeneration += 1;
    const generation = this._preloadGeneration;
    const count = this._options?.preloadChatCount ?? PRELOAD_CHAT_COUNT;
    const delay = this._options?.preloadPostsDelay ?? PRELOAD_POSTS_DELAY_MS;
    for (const chat of chats.slice(0, count)) {
      if (generation !== this._preloadGeneration || !chat.id) {
        return;
      }
      this._teamMessagingPosts.seedReadTime(
        chat.id,
        Date.now() - INITIAL_READ_TIME_OFFSET_MS,
      );
      await (force
        ? this._teamMessagingPosts.fetchPosts(chat.id)
        : this._teamMessagingPosts.loadPosts(chat.id));
      await sleep(delay);
    }
  }

  private _saveChat(chat: TeamMessagingChat): void {
    this.updateData(upsertChat(this.chats, chat));
  }

  private _removeChat(chatId: string): void {
    this.updateData(this.chats.filter((chat) => chat.id !== chatId));
  }

  private _handleChatEvent(event: TeamMessagingChatEvent): void {
    if (!event?.id) {
      return;
    }
    if (event.eventType === 'GroupLeft') {
      this._removeChat(event.id);
      return;
    }
    const chat = normalizeChatEvent(event);
    this._saveChat(chat);
    this._teamMessagingPosts.seedReadTime(
      event.id,
      Date.now() - INITIAL_READ_TIME_OFFSET_MS,
    );
    void this._teamMessagingPersons.loadPersons(event.members ?? []);
    void this._teamMessagingPosts.loadPosts(event.id);
  }

  private _handleNewPost(post: TeamMessagingPost): void {
    if (post.groupId && post.groupId === this.currentChatId) {
      void this._teamMessagingPosts.markRead(post.groupId);
    }
  }

  /**
   * Set the chat whose page is open, or `null` when it closes. Opening a chat
   * loads its members and posts and marks it read.
   */
  @delegate('server')
  async setCurrentChat(chatId: string | null): Promise<void> {
    this._setCurrentChatId(chatId);
    if (!chatId) {
      return;
    }
    await this._teamMessagingPosts.loadPosts(chatId);
    await this._teamMessagingPosts.markRead(chatId);
    // Members are loaded after the posts: a large team takes a while, 30
    // persons at a time.
    const members = await this._getMemberIds(chatId);
    void this._teamMessagingPersons.loadPersons(
      members.slice(0, MAX_MEMBER_PROFILES),
    );
  }

  /**
   * A chat's member ids. Team and Everyone chats come without members from
   * the v1 API, so they are read from the legacy Glip group and kept on the
   * chat until the list reloads.
   */
  private async _getMemberIds(chatId: string): Promise<string[]> {
    const chat =
      this.chats.find((item) => item.id === chatId) ??
      this._teamMessagingFavorites.favoriteChats.find(
        (item) => item.id === chatId,
      );
    if (chat?.members?.length) {
      return chat.members.map(({ id }) => id);
    }
    try {
      const response = await this._client.service
        .platform()
        .get(`${LEGACY_GLIP_GROUPS_PATH}/${chatId}`);
      const { members = [] } = (await response.json()) as LegacyGlipGroup;
      if (chat && members.length > 0) {
        this._saveChat({ ...chat, members: members.map((id) => ({ id })) });
      }
      return members;
    } catch (error) {
      this.logger.error('load team messaging chat members failed', error);
      return [];
    }
  }

  /**
   * Open the 1:1 chat with a person, creating it when needed. The API
   * returns the existing chat when there is one.
   */
  @delegate('server')
  async openConversation(personId: string): Promise<TeamMessagingResult> {
    try {
      const response = await this._client.service
        .platform()
        .post(`${TEAM_MESSAGING_API_PATH}/conversations`, {
          members: [{ id: personId }],
        });
      const conversation = (await response.json()) as TMConversationInfo;
      this._saveChat(conversation);
      void this._teamMessagingPersons.loadPersons(
        (conversation.members ?? []).map(({ id }) => id),
      );
      return { ok: true, id: conversation.id };
    } catch (error) {
      this.logger.error('open team messaging conversation failed', error);
      return { ok: false };
    }
  }

  /** Add a chat to favorites, or remove it when it is one. */
  @delegate('server')
  async toggleFavorite(chatId: string): Promise<TeamMessagingResult> {
    const favorites = this._teamMessagingFavorites;
    const chat =
      this.chats.find((item) => item.id === chatId) ??
      favorites.favoriteChats.find((item) => item.id === chatId) ??
      { id: chatId };
    return favorites.setFavorite({
      chat,
      favorite: !favorites.isFavorite(chatId),
    });
  }

  /** Create a public team with members added by email, as in the legacy app. */
  @delegate('server')
  async createTeam({
    name,
    emails,
  }: CreateTeamParams): Promise<TeamMessagingResult> {
    const request: TMCreateTeamRequest = {
      name,
      public: true,
      members: emails.map((email) => ({ email })),
    };
    try {
      const response = await this._client.service
        .platform()
        .post(`${TEAM_MESSAGING_API_PATH}/teams`, request);
      const team = (await response.json()) as TeamMessagingChat;
      this._saveChat(team);
      return { ok: true, id: team.id };
    } catch (error) {
      this.logger.error('create team failed', error);
      return { ok: false };
    }
  }
}
