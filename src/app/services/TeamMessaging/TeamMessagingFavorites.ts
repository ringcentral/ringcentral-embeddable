import type TMChatListWithoutNavigation from '@rc-ex/core/lib/definitions/TMChatListWithoutNavigation';
import {
  AppFeatures,
  Client,
} from '@ringcentral-integration/micro-auth/src/app/services';
import {
  action,
  computed,
  delegate,
  injectable,
  RcModule,
  state,
  storage,
  StoragePlugin,
} from '@ringcentral-integration/next-core';

import {
  FAVORITE_CHATS_RECORD_COUNT,
  TEAM_MESSAGING_API_PATH,
} from './TeamMessaging.constants';
import type {
  TeamMessagingChat,
  TeamMessagingResult,
} from './TeamMessaging.interface';

/**
 * The user's favorite chats. The API sends no favorite events, so the list
 * is reloaded with the chat list, and changed here when the user stars or
 * unstars a chat.
 */
@injectable({
  name: 'TeamMessagingFavorites',
})
export class TeamMessagingFavorites extends RcModule {
  constructor(
    protected _client: Client,
    protected _appFeatures: AppFeatures,
    protected _storage: StoragePlugin,
  ) {
    super();
    this._storage.enable(this);
  }

  @storage
  @state
  favoriteChats: TeamMessagingChat[] = [];

  @action
  private _setFavoriteChats(chats: TeamMessagingChat[]): void {
    this.favoriteChats = chats;
  }

  @action
  private _addFavoriteChat(chat: TeamMessagingChat): void {
    if (!this.favoriteChats.some((item) => item.id === chat.id)) {
      this.favoriteChats.unshift(chat);
    }
  }

  @action
  private _removeFavoriteChat(chatId: string): void {
    this.favoriteChats = this.favoriteChats.filter(
      (item) => item.id !== chatId,
    );
  }

  @computed((that: TeamMessagingFavorites) => [that.favoriteChats])
  get favoriteChatIds(): Set<string> {
    return new Set(
      this.favoriteChats.map((chat) => chat.id).filter(Boolean) as string[],
    );
  }

  isFavorite(chatId: string): boolean {
    return this.favoriteChatIds.has(chatId);
  }

  @delegate('server')
  async fetchFavorites(): Promise<void> {
    if (!this._appFeatures.hasGlipPermission) {
      return;
    }
    try {
      const response = await this._client.service
        .platform()
        .get(`${TEAM_MESSAGING_API_PATH}/favorites`, {
          recordCount: FAVORITE_CHATS_RECORD_COUNT,
        });
      const { records = [] } =
        (await response.json()) as TMChatListWithoutNavigation;
      this._setFavoriteChats(records);
    } catch (error) {
      this.logger.error('load favorite chats failed', error);
    }
  }

  /**
   * Add a chat to favorites or remove it. The list changes at once and is
   * restored when the request fails.
   */
  @delegate('server')
  async setFavorite({
    chat,
    favorite,
  }: {
    chat: TeamMessagingChat;
    favorite: boolean;
  }): Promise<TeamMessagingResult> {
    const chatId = chat.id;
    if (!chatId) {
      return { ok: false };
    }
    const previous = this.favoriteChats;
    if (favorite) {
      this._addFavoriteChat(chat);
    } else {
      this._removeFavoriteChat(chatId);
    }
    try {
      await this._client.service
        .platform()
        .post(
          `${TEAM_MESSAGING_API_PATH}/chats/${chatId}/${
            favorite ? 'favorite' : 'unfavorite'
          }`,
        );
      return { ok: true, id: chatId };
    } catch (error) {
      this.logger.error('update favorite chat failed', error);
      this._setFavoriteChats(previous);
      return { ok: false };
    }
  }
}
