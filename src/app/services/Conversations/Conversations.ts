import type GetMessageInfoResponse from '@rc-ex/core/lib/definitions/GetMessageInfoResponse';
import type ListMessagesParameters from '@rc-ex/core/lib/definitions/ListMessagesParameters';
import { messageTypes } from '@ringcentral-integration/commons/enums/messageTypes';
import {
  AppFeatures,
  Auth,
  Client,
  ExtensionInfo,
  RegionSettings,
} from '@ringcentral-integration/micro-auth/src/app/services';
import { ContactMatcher } from '@ringcentral-integration/micro-contacts/src/app/services';
import { Toast } from '@ringcentral-integration/micro-core/src/app/services';
import {
  type Attachment,
  ConversationLogger,
  Conversations as BaseConversations,
  type ConversationsOptions,
  conversationsStatus,
  MessageSender,
  MessageStore,
  SmsOptOut,
} from '@ringcentral-integration/micro-message/src/app/services';
import {
  action,
  delegate,
  injectable,
  optional,
  state,
  watch,
} from '@ringcentral-integration/next-core';

import { SmsTypingTimeTracker } from '../SmsTypingTimeTracker';

/**
 * A conversations list tab that pages older items on its own.
 */
export type ConversationTab = 'Text' | 'VoiceMail' | 'Fax';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

/**
 * How long, in milliseconds, a tab waits after a failed fetch before loading
 * older conversations again.
 */
const RETRY_INTERVAL = 30 * 1000;

/**
 * Returns the earliest creation time among the messages, or `fallback` when
 * none is earlier.
 */
function getEarliestCreationTime(
  messages: ReadonlyArray<{ creationTime?: string | number }>,
  fallback: number,
): number {
  return messages.reduce((earliest, message) => {
    const creationTime = new Date(message.creationTime ?? NaN).getTime();
    return creationTime < earliest ? creationTime : earliest;
  }, fallback);
}

/**
 * Saves the SMS typing time against the reply sent from a conversation, and
 * loads older conversations for each list tab.
 */
@injectable({
  name: 'Conversations',
})
export class Conversations extends BaseConversations {
  constructor(
    protected override _toast: Toast,
    protected override _auth: Auth,
    protected override _client: Client,
    protected override _messageSender: MessageSender,
    protected override _extensionInfo: ExtensionInfo,
    protected override _messageStore: MessageStore,
    protected override _appFeatures: AppFeatures,
    protected override _regionSettings: RegionSettings,
    @optional() protected override _contactMatcher?: ContactMatcher,
    @optional() protected override _conversationLogger?: ConversationLogger,
    @optional('ConversationsOptions')
    protected override _conversationsOptions?: ConversationsOptions,
    @optional() protected override _smsOptOut?: SmsOptOut,
    @optional()
    private readonly _smsTypingTimeTracker?: SmsTypingTimeTracker,
  ) {
    super(
      _toast,
      _auth,
      _client,
      _messageSender,
      _extensionInfo,
      _messageStore,
      _appFeatures,
      _regionSettings,
      _contactMatcher,
      _conversationLogger,
      _conversationsOptions,
      _smsOptOut,
    );
  }

  /**
   * Keyed by `${tab}-${readStatus}`; `false` once the server has no older
   * conversations for that tab and read filter.
   */
  private _olderConversationsExisted: Record<string, boolean> = {};

  /**
   * Keyed like `_olderConversationsExisted`; the creation time of the oldest
   * record fetched so far, so the next page always moves further back even
   * when a whole page only repeats conversations already listed.
   */
  private _olderConversationsCursor: Record<string, number> = {};

  /**
   * Keyed like `_olderConversationsExisted`; when the last failed fetch
   * happened, so the list does not retry in a tight loop.
   */
  private _olderConversationsFailedAt: Record<string, number> = {};

  /**
   * Keyed by conversation id; when the last failed older-messages fetch
   * happened, so an open thread does not retry in a tight loop.
   */
  private _olderMessagesFailedAt: Record<string, number> = {};

  private _resetOlderConversationsPaging(): void {
    this._olderConversationsExisted = {};
    this._olderConversationsCursor = {};
    this._olderConversationsFailedAt = {};
  }

  @state
  olderConversationsLoading: Partial<Record<ConversationTab, boolean>> = {};

  @action
  private _setOlderConversationsLoading(
    tab: ConversationTab,
    loading: boolean,
  ): void {
    this.olderConversationsLoading[tab] = loading;
  }

  @action
  private _resetOlderConversationsLoading(): void {
    this.olderConversationsLoading = {};
  }

  override onInitOnce(): void {
    super.onInitOnce();
    // The base module drops the fetched older conversations when the message
    // store shrinks, so they can be fetched again.
    watch(
      this,
      () => this.oldConversations,
      (newValue = [], oldValue = []) => {
        if (newValue.length < oldValue.length) {
          this._resetOlderConversationsPaging();
        }
      },
    );
  }

  override onReset(): void {
    super.onReset();
    this._resetOlderConversationsPaging();
    this._olderMessagesFailedAt = {};
    this._resetOlderConversationsLoading();
  }

  /**
   * Loads the page of conversations older than the earliest one shown in the
   * given tab, under the tab's read status filter.
   *
   * The Spring tabs never set `typeFilter`, so the base `loadNextPage` would
   * page across every message type at once.
   */
  @delegate('server')
  async fetchOlderConversations(tab: ConversationTab): Promise<void> {
    // The list can ask before this module finishes initializing; only the
    // session is needed to query the message store.
    if (
      !this._auth.loggedIn ||
      !this._enableLoadOldMessages ||
      !this._hasPermission
    ) {
      return;
    }
    if (this.effectiveSearchString !== '') {
      return;
    }
    if (this.olderConversationsLoading[tab]) {
      return;
    }
    const readStatus = this.readStatusFilterMap[tab];
    const pagingKey = `${tab}-${readStatus}`;
    if (this._olderConversationsExisted[pagingKey] === false) {
      return;
    }
    const failedAt = this._olderConversationsFailedAt[pagingKey];
    if (failedAt && Date.now() - failedAt < RETRY_INTERVAL) {
      return;
    }
    this._setOlderConversationsLoading(tab, true);
    try {
      const params = this._getOlderConversationsParams(tab, pagingKey);
      const result = await this._client
        .account()
        .extension()
        .messageStore()
        .list(params);
      const records = (result.records ?? []) as GetMessageInfoResponse[];
      this._olderConversationsExisted[pagingKey] =
        records.length >= this._perPage;
      delete this._olderConversationsFailedAt[pagingKey];
      if (records.length > 0) {
        this._olderConversationsCursor[pagingKey] = getEarliestCreationTime(
          records,
          new Date(params.dateTo!).getTime(),
        );
        this._fetchOldConversationsSuccess(records, false);
      }
    } catch (error) {
      this._olderConversationsFailedAt[pagingKey] = Date.now();
      console.error('[Conversations] fetch older conversations failed', error);
    } finally {
      this._setOlderConversationsLoading(tab, false);
    }
  }

  /**
   * Loads the page of messages older than the earliest one shown in the
   * current conversation.
   *
   * A conversation loaded from older list pages has nothing in the synced
   * message store, so unlike the base `fetchOldMessages`, an empty thread
   * pages back from the conversation's own latest message instead of from
   * now, which would miss a conversation older than the day span.
   */
  @delegate('server')
  async fetchOlderMessages(): Promise<void> {
    const conversationId = this.currentConversationId;
    if (
      !conversationId ||
      !this._auth.loggedIn ||
      !this._enableLoadOldMessages ||
      !this._hasPermission ||
      !this._olderMessagesExisted ||
      this.loadingOldMessages
    ) {
      return;
    }
    const failedAt = this._olderMessagesFailedAt[conversationId];
    if (failedAt && Date.now() - failedAt < RETRY_INTERVAL) {
      return;
    }
    const conversation = this.allConversationsMap.get(conversationId);
    if (!conversation) {
      return;
    }
    // Just after the latest message, so an empty thread fetches it too.
    const latestTime =
      new Date(conversation.creationTime ?? NaN).getTime() + 1000;
    const dateTo = getEarliestCreationTime(
      this.getMessages(conversationId, true),
      Number.isNaN(latestTime) ? Date.now() : latestTime,
    );
    const dateFrom = dateTo - this._daySpan * DAY_IN_MS;
    this._updateFetchMessagesStatus(conversationsStatus.fetching);
    try {
      const result = await this._client
        .account()
        .extension()
        .messageStore()
        .list({
          conversationId,
          perPage: this._perPage,
          dateFrom: new Date(dateFrom).toISOString(),
          dateTo: new Date(dateTo).toISOString(),
        });
      const records = (result.records ?? []) as GetMessageInfoResponse[];
      if (conversationId !== this.currentConversationId) {
        this._updateFetchMessagesStatus(conversationsStatus.idle);
        return;
      }
      this._olderMessagesExisted = records.length >= this._perPage;
      delete this._olderMessagesFailedAt[conversationId];
      this._fetchOldMessagesSuccess(records);
    } catch (error) {
      this._olderMessagesFailedAt[conversationId] = Date.now();
      console.error('[Conversations] fetch older messages failed', error);
      this._updateFetchMessagesStatus(conversationsStatus.idle);
    }
  }

  private _getOlderConversationsParams(
    tab: ConversationTab,
    pagingKey: string,
  ): ListMessagesParameters {
    const earliestTime = getEarliestCreationTime(
      this.typeFilteredConversationsMap[tab],
      this._olderConversationsCursor[pagingKey] ?? Date.now(),
    );
    let dateFrom = Date.now() - this._daySpan * DAY_IN_MS;
    if (earliestTime < dateFrom) {
      dateFrom = earliestTime - DAY_IN_MS;
    }
    const readStatus = this.readStatusFilterMap[tab];
    return {
      distinctConversations: true,
      perPage: this._perPage,
      dateFrom: new Date(dateFrom).toISOString(),
      dateTo: new Date(earliestTime).toISOString(),
      messageType:
        tab === messageTypes.text
          ? [messageTypes.sms, messageTypes.pager]
          : [tab],
      ...(readStatus === 'All' ? {} : { readStatus: [readStatus] }),
    };
  }

  override async replyToReceivers(
    text: string,
    attachments: Attachment[] = [],
  ): ReturnType<BaseConversations['replyToReceivers']> {
    const conversationId = this.currentConversationId;
    if (conversationId) {
      // Stop counting while sending, so a failed send stays paused.
      await this._smsTypingTimeTracker?.pauseTyping(conversationId);
    }
    const response = await super.replyToReceivers(text, attachments);
    const messageId = (response as { id?: string | number } | null)?.id;
    if (conversationId && messageId !== undefined && messageId !== null) {
      // Complete with the send response, as message store events may come
      // late or not carry the conversation id.
      await this._smsTypingTimeTracker?.stopTyping(
        conversationId,
        String(messageId),
      );
    }
    return response;
  }
}
