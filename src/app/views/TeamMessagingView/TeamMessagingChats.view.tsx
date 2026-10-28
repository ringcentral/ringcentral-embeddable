import { CompanyContacts } from '@ringcentral-integration/micro-contacts/src/app/services';
import {
  DateTimeFormat,
  Toast,
} from '@ringcentral-integration/micro-core/src/app/services';
import {
  ModalView,
  SyncTabView,
} from '@ringcentral-integration/micro-core/src/app/views';
import {
  action,
  computed,
  delegate,
  injectable,
  portal,
  RcViewModule,
  RouterPlugin,
  state,
  storage,
  StoragePlugin,
  useConnector,
} from '@ringcentral-integration/next-core';
import React, { useRef } from 'react';

import {
  TeamMessagingChats,
  type TeamMessagingResult,
} from '../../services/TeamMessaging';
import {
  CHAT_TAB_IDS,
  CHAT_TABS_ID,
  type ChatTabId,
  isChatInTab,
} from './chatTabs';
import { ChatListPanel } from './components/ChatListPanel';
import { getStrongestMention } from './getUnreadBadgeColor';
import { CreateTeamContent } from './components/CreateTeamContent';
import { t } from './i18n';
import { getChatPath } from './getChatPath';
import type {
  ChatListPanelProps,
  ChatSyncTab,
  ChatTab,
  CreateTeamContact,
} from './TeamMessaging.view.interface';

/** People suggested in "Create team", as in the legacy app. */
const MAX_CONTACT_SUGGESTIONS = 10;

type CompanyContactData = {
  id?: string | number;
  type?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  profileImageUrl?: string;
};

function toCreateTeamContact(
  contact: CompanyContactData,
): CreateTeamContact | null {
  if (!contact.email || contact.id === undefined) {
    return null;
  }
  const name =
    contact.name ||
    [contact.firstName, contact.lastName].filter(Boolean).join(' ') ||
    contact.email;
  return {
    id: String(contact.id),
    name,
    email: contact.email,
    avatarUrl: contact.profileImageUrl,
  };
}

/**
 * The Chat tab (`/glip`): the recent chats, search, and "Create team".
 */
@injectable({
  name: 'TeamMessagingChatsView',
})
export class TeamMessagingChatsView extends RcViewModule {
  constructor(
    private _teamMessagingChats: TeamMessagingChats,
    private _companyContacts: CompanyContacts,
    private _dateTimeFormat: DateTimeFormat,
    private _modalView: ModalView,
    private _router: RouterPlugin,
    private _toast: Toast,
    private _syncTabView: SyncTabView,
    private _storage: StoragePlugin,
  ) {
    super();
    this._storage.enable(this);
    // The chat list is fetched on demand; a failed fetch must not keep this
    // view, and the app view that renders it, from initializing.
    const readiness = this as unknown as {
      _ignoreModuleReadiness(dep: object): void;
    };
    readiness._ignoreModuleReadiness(_teamMessagingChats);
  }

  /** The last sub tab, restored when the Chat tab opens again. */
  @storage
  @state
  selectedChatTab: ChatTabId = 'All';

  @action
  private _setSelectedChatTab(tabId: ChatTabId): void {
    this.selectedChatTab = tabId;
  }

  @delegate('server')
  async setSelectedChatTab(tabId: ChatTabId): Promise<void> {
    this._setSelectedChatTab(tabId);
  }

  /** Each sub tab's filtered chats, and its unread count before filtering. */
  @computed((that: TeamMessagingChatsView) => [
    that._teamMessagingChats.chatItems,
    that._teamMessagingChats.filteredChatItems,
  ])
  get tabs(): ChatTab[] {
    const { chatItems, filteredChatItems } = this._teamMessagingChats;
    return CHAT_TAB_IDS.map((id) => {
      const tabChats = chatItems.filter((chat) => isChatInTab(chat, id));
      return {
        id,
        chats: filteredChatItems.filter((chat) => isChatInTab(chat, id)),
        hasChats: tabChats.length > 0,
        unreadCount: tabChats.reduce(
          (sum, chat) => sum + chat.unreadCount,
          0,
        ),
        unreadMention: getStrongestMention(
          tabChats.map((chat) => chat.unreadMention),
        ),
      };
    });
  }

  @portal
  private _createTeamModal = this._modalView.create({
    view: () => (
      <CreateTeamContent
        searchContacts={(searchText) => this.searchContacts(searchText)}
        onCreate={(params) => this.createTeam(params)}
        onCancel={() => undefined}
      />
    ),
    props: () => ({
      header: t('createTeam'),
      'data-sign': 'createTeamModal',
    }),
  });

  /** Company contacts with an email that match the search text. */
  searchContacts(searchText: string): CreateTeamContact[] {
    const search = searchText.trim().toLowerCase();
    const contacts = (this._companyContacts.filteredContacts ??
      []) as CompanyContactData[];
    return contacts
      .map(toCreateTeamContact)
      .filter(
        (contact): contact is CreateTeamContact =>
          !!contact &&
          (contact.name.toLowerCase().includes(search) ||
            contact.email.toLowerCase().includes(search)),
      )
      .slice(0, MAX_CONTACT_SUGGESTIONS);
  }

  async createTeam(params: {
    name: string;
    emails: string[];
  }): Promise<TeamMessagingResult> {
    const result = await this._teamMessagingChats.createTeam(params);
    if (!result?.ok || !result.id) {
      this._toast.danger({ message: t('createTeamFailed') });
      return { ok: false };
    }
    this.openChat(result.id);
    return result;
  }

  async toggleFavorite(chatId: string): Promise<void> {
    const result = await this._teamMessagingChats.toggleFavorite(chatId);
    if (!result?.ok) {
      this._toast.danger({ message: t('favoriteFailed') });
    }
  }

  openCreateTeam(): void {
    this._modalView.open(this._createTeamModal);
  }

  openChat(chatId: string): void {
    void this._router.push(getChatPath(chatId));
  }

  formatTime(utcTimestamp: number): string {
    return (
      this._dateTimeFormat.formatDateTime({ utcTimestamp }) ?? ''
    ).toString();
  }

  private _renderTabs(tabs: ChatSyncTab[]): React.ReactNode {
    return (
      <this._syncTabView.component
        id={CHAT_TABS_ID}
        tabs={tabs}
        defaultValue={this.selectedChatTab}
        onActiveChange={(value) => {
          void this.setSelectedChatTab(value as ChatTabId);
        }}
        data-sign="chatTabs"
        // Four tabs in the 300px column: drop the 100px minimum and size each
        // tab to its label.
        className="[&_.sui-tab]:max-w-none [&_.sui-tab]:min-w-0 [&_.sui-tab]:flex-[1_1_auto] [&_.sui-tab]:px-1"
        variant="standard"
      />
    );
  }

  private _getUIProps(): Pick<
    ChatListPanelProps,
    | 'tabs'
    | 'searchFilter'
    | 'readStatusFilter'
    | 'isLoading'
    | 'currentChatId'
  > {
    const chats = this._teamMessagingChats;
    return {
      tabs: this.tabs,
      searchFilter: chats.searchFilter,
      readStatusFilter: chats.readStatusFilter,
      isLoading: chats.hasPermission && !chats.data,
      currentChatId: chats.currentChatId,
    };
  }

  private _getUIFunctions(): Pick<
    ChatListPanelProps,
    | 'onSearchChange'
    | 'onReadStatusFilterChange'
    | 'onSelectChat'
    | 'onToggleFavorite'
    | 'onCreateTeam'
    | 'formatTime'
    | 'renderTabs'
  > {
    return {
      onSearchChange: (searchFilter) =>
        this._teamMessagingChats.setSearchFilter(searchFilter),
      onReadStatusFilterChange: (readStatusFilter) =>
        this._teamMessagingChats.setReadStatusFilter(readStatusFilter),
      onSelectChat: (chatId) => this.openChat(chatId),
      onToggleFavorite: (chatId) => void this.toggleFavorite(chatId),
      onCreateTeam: () => this.openCreateTeam(),
      formatTime: (utcTimestamp) => this.formatTime(utcTimestamp),
      renderTabs: (tabs) => this._renderTabs(tabs),
    };
  }

  component(): React.ReactElement {
    const { current: uiFunctions } = useRef(this._getUIFunctions());
    const uiProps = useConnector(() => this._getUIProps());
    return <ChatListPanel {...uiProps} {...uiFunctions} />;
  }
}
