import {
  DateTimeFormat,
  Toast,
} from '@ringcentral-integration/micro-core/src/app/services';
import {
  action,
  injectable,
  RcViewModule,
  RouterPlugin,
  state,
  useConnector,
} from '@ringcentral-integration/next-core';
import { fileToBase64 } from '@ringcentral-integration/utils';
import React, { useEffect, useMemo } from 'react';

import {
  getPersonName,
  TeamMessagingChats,
  type TeamMessagingMember,
  TeamMessagingPersons,
  TeamMessagingPosts,
  type TeamMessagingPostItem,
  toPostItem,
} from '../../services/TeamMessaging';
import { ChatPanel } from './components/ChatPanel';
import { CHATS_PATH, getChatPath } from './getChatPath';
import { t } from './i18n';
import type {
  ChatPanelProps,
  MentionType,
} from './TeamMessaging.view.interface';

/** The Team Messaging API accepts files up to 30 MB. */
const MAX_FILE_SIZE = 30 * 1024 * 1024;

type ChatRouteProps = {
  match?: { params?: { groupId?: string } };
};

/**
 * A chat page (`/glip/groups/:groupId`), opened as a routed side widget.
 */
@injectable({
  name: 'TeamMessagingChatView',
})
export class TeamMessagingChatView extends RcViewModule {
  constructor(
    private _teamMessagingChats: TeamMessagingChats,
    private _teamMessagingPosts: TeamMessagingPosts,
    private _teamMessagingPersons: TeamMessagingPersons,
    private _dateTimeFormat: DateTimeFormat,
    private _router: RouterPlugin,
    private _toast: Toast,
  ) {
    super();
    // The chat list is fetched on demand; a failed fetch must not keep this
    // view, and the app view that renders it, from initializing.
    const readiness = this as unknown as {
      _ignoreModuleReadiness(dep: object): void;
    };
    readiness._ignoreModuleReadiness(_teamMessagingChats);
  }

  /** Text typed in each chat and not sent yet. */
  @state
  drafts: Record<string, string> = {};

  @action
  saveDraft(chatId: string, text: string): void {
    if (text) {
      this.drafts[chatId] = text;
    } else {
      delete this.drafts[chatId];
    }
  }

  goBack(): void {
    void this._router.push(CHATS_PATH);
  }

  openChat(chatId: string): void {
    void this._router.push(getChatPath(chatId));
  }

  /** Open the 1:1 chat with a person, as clicking a name did in legacy. */
  async openPerson(personId: string): Promise<void> {
    const result = await this._teamMessagingChats.openConversation(personId);
    if (!result?.ok || !result.id) {
      this._toast.danger({ message: t('openChatFailed') });
      return;
    }
    this.openChat(result.id);
  }

  async toggleFavorite(chatId: string): Promise<void> {
    const result = await this._teamMessagingChats.toggleFavorite(chatId);
    if (!result?.ok) {
      this._toast.danger({ message: t('favoriteFailed') });
    }
  }

  async sendText(chatId: string, text: string): Promise<boolean> {
    const result = await this._teamMessagingPosts.sendText({ chatId, text });
    return !!result?.ok;
  }

  async sendFile(chatId: string, file: File): Promise<void> {
    if (file.size > MAX_FILE_SIZE) {
      this._toast.danger({ message: t('sendFailed') });
      return;
    }
    const base64Url = (await fileToBase64(file)) as string;
    await this._teamMessagingPosts.sendFile({
      chatId,
      name: file.name,
      base64Url,
    });
  }

  formatTime(utcTimestamp: number): string {
    return (
      this._dateTimeFormat.formatDateTime({ utcTimestamp }) ?? ''
    ).toString();
  }

  getMemberName(member?: TeamMessagingMember): string {
    return getPersonName(member) || member?.id || '';
  }

  getMentionName(type: MentionType, id: string): string {
    if (type === 'Team') {
      return this._teamMessagingChats.getChatItem(id)?.name || id;
    }
    return (
      getPersonName(this._teamMessagingPersons.personsMap[id]) || id
    );
  }

  private _usePosts(chatId: string): TeamMessagingPostItem[] {
    const { posts, personsMap, myId } = useConnector(() => ({
      posts: this._teamMessagingPosts.postsMap[chatId],
      personsMap: this._teamMessagingPersons.personsMap,
      myId: this._teamMessagingChats.myId,
    }));
    return useMemo(
      () =>
        [...(posts ?? [])]
          .reverse()
          .map((post) => toPostItem({ post, personsMap, myId })),
      [posts, personsMap, myId],
    );
  }

  private _useFunctions(
    chatId: string,
  ): Omit<
    ChatPanelProps,
    'chat' | 'posts' | 'isLoading' | 'hasOlderPosts' | 'draft'
  > {
    return useMemo(
      () => ({
        goBack: () => this.goBack(),
        loadOlderPosts: () => this._teamMessagingPosts.loadOlderPosts(chatId),
        sendText: (text: string) => this.sendText(chatId, text),
        sendFile: (file: File) => this.sendFile(chatId, file),
        saveDraft: (text: string) => this.saveDraft(chatId, text),
        openPerson: (personId: string) => void this.openPerson(personId),
        openChat: (id: string) => this.openChat(id),
        formatTime: (utcTimestamp: number) => this.formatTime(utcTimestamp),
        getMentionName: (type: MentionType, id: string) =>
          this.getMentionName(type, id),
        getMemberName: (member?: TeamMessagingMember) =>
          this.getMemberName(member),
        toggleFavorite: () => void this.toggleFavorite(chatId),
      }),
      [chatId],
    );
  }

  /** Keeps the server's current chat in step with the open page. */
  private _useCurrentChat(chatId: string): void {
    useEffect(() => {
      void this._teamMessagingChats.setCurrentChat(chatId);
      return () => {
        void this._teamMessagingChats.setCurrentChat(null);
      };
    }, [chatId]);
  }

  component({ match }: ChatRouteProps): React.ReactElement {
    const chatId = decodeURIComponent(match?.params?.groupId ?? '');
    this._useCurrentChat(chatId);
    const posts = this._usePosts(chatId);
    const functions = this._useFunctions(chatId);
    const uiProps = useConnector(() => ({
      chat: this._teamMessagingChats.getChatItem(chatId),
      isLoading: !!this._teamMessagingPosts.loadingChatIds[chatId],
      hasOlderPosts: !!this._teamMessagingPosts.olderPageTokens[chatId],
    }));
    // The draft only seeds the composer when it mounts, keyed by chat.
    return (
      <ChatPanel
        key={chatId}
        {...uiProps}
        {...functions}
        posts={posts}
        draft={this.drafts[chatId] ?? ''}
      />
    );
  }
}
