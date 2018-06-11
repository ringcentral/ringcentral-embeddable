import { createSelector } from 'reselect';

import { Module } from 'ringcentral-integration/lib/di';
import Pollable from 'ringcentral-integration/lib/Pollable';
import ensureExist from 'ringcentral-integration/lib/ensureExist';
import getter from 'ringcentral-integration/lib/getter';
import sleep from 'ringcentral-integration/lib/sleep';
import proxify from 'ringcentral-integration/lib/proxy/proxify';
import moduleStatuses from 'ringcentral-integration/enums/moduleStatuses';
import syncTypes from 'ringcentral-integration/enums/syncTypes';
import * as messageHelper from 'ringcentral-integration/lib/messageHelper';
import { batchPutApi } from 'ringcentral-integration/lib/batchApiHelper';

import { messageIsUnread } from '../../lib/messageHelper';

import actionTypes from './actionTypes';
import getReducer from './getReducer';
import getDataReducer from './getDataReducer';
import messageStoreErrors from './errors';

const DEFAULT_CONVERSATIONS_LOAD_LENGTH = 10;
const DEFAULT_CONVERSATION_LOAD_LENGTH = 15;
const DEFAULT_TTL = 30 * 60 * 1000;
const DEFAULT_RETRY = 62 * 1000;
const DEFAULT_DAYSPAN = 90;

function getSyncParams({ recordCount, conversationLoadLength, dateFrom, dateTo, syncToken }) {
  if (syncToken) {
    return {
      syncToken,
      syncType: syncTypes.iSync,
    };
  }
  const params = {
    recordCountPerConversation: conversationLoadLength,
    syncType: syncTypes.fSync,
  };
  if (recordCount) {
    params.recordCount = recordCount;
  }
  if (dateFrom) {
    params.dateFrom = dateFrom.toISOString();
  }
  if (dateTo) {
    params.dateTo = dateTo.toISOString();
  }
  return params;
}

/**
 * @class

 * @description Messages data managing module
 * fetch conversations
 * handle new message subscription
 */
@Module({
  deps: [
    'Alert',
    'Client',
    'Auth',
    'Subscription',
    'ConnectivityMonitor',
    'RolesAndPermissions',
    { dep: 'TabManager', optional: true },
    { dep: 'Storage', optional: true },
    { dep: 'ConversationsOptions', optional: true }
  ]
})
export default class MessageStore extends Pollable {
  constructor({
    auth,
    client,
    subscription,
    storage,
    tabManager,
    rolesAndPermissions,
    connectivityMonitor,
    ttl = DEFAULT_TTL,
    polling = false,
    disableCache = false,
    timeToRetry = DEFAULT_RETRY,
    daySpan = DEFAULT_DAYSPAN,
    conversationsLoadLength = DEFAULT_CONVERSATIONS_LOAD_LENGTH,
    conversationLoadLength = DEFAULT_CONVERSATION_LOAD_LENGTH,
    ...options
  }) {
    super({
      ...options,
      actionTypes,
    });
    this._auth = this::ensureExist(auth, 'auth');
    this._client = this::ensureExist(client, 'client');
    this._subscription = this::ensureExist(subscription, 'subscription');
    this._rolesAndPermissions =
      this::ensureExist(rolesAndPermissions, 'rolesAndPermissions');

    if (!disableCache) {
      this._storage = storage;
    }

    this._dataStorageKey = 'messageStoreData';

    this._tabManager = tabManager;
    this._connectivityMonitor = connectivityMonitor;
    this._ttl = ttl;
    this._timeToRetry = timeToRetry;
    this._polling = polling;
    this._conversationsLoadLength = conversationsLoadLength;
    this._conversationLoadLength = conversationLoadLength;

    this._daySpan = daySpan;

    if (this._storage) {
      this._reducer = getReducer(this.actionTypes);
      this._storage.registerReducer({
        key: this._dataStorageKey,
        reducer: getDataReducer(this.actionTypes),
      });
    } else {
      this._reducer = getReducer(this.actionTypes, {
        data: getDataReducer(this.actionTypes, false),
      });
    }

    this._promise = null;
    this._lastSubscriptionMessage = null;
    // setting up event handlers for message
    this._newMessageNotificationHandlers = [];
    this._dispatchedMessageIds = [];
  }

  initialize() {
    this.store.subscribe(() => this._onStateChange());
  }

  async _onStateChange() {
    if (this._shouldInit()) {
      this.store.dispatch({
        type: this.actionTypes.init,
      });
      if (this._connectivityMonitor) {
        this._connectivity = this._connectivityMonitor.connectivity;
      }
      await this._init();
    } else if (this._isDataReady()) {
      this.store.dispatch({
        type: this.actionTypes.initSuccess,
      });
      //
    } else if (this._shouldReset()) {
      this._clearTimeout();
      this._promise = null;
      this.store.dispatch({
        type: this.actionTypes.resetSuccess,
      });
    } else if (this.ready) {
      this._subscriptionHandler();
      this._checkConnectivity();
    }
  }

  _shouldInit() {
    return !!(
      this._auth.loggedIn &&
      (!this._storage || this._storage.ready) &&
      (!this._tabManager || this._tabManager.ready) &&
      (!this._connectivityMonitor || this._connectivityMonitor.ready) &&
      this._subscription.ready &&
      this._rolesAndPermissions.ready &&
      this.pending
    );
  }

  _shouldReset() {
    return !!(
      (
        !this._auth.loggedIn ||
        (this._storage && !this._storage.ready) ||
        !this._subscription.ready ||
        (!!this._connectivityMonitor && !this._connectivityMonitor.ready) ||
        !this._rolesAndPermissions.ready ||
        (this._tabManager && !this._tabManager.ready)
      ) &&
      this.ready
    );
  }

  _isDataReady() {
    return this.status === moduleStatuses.initializing &&
      this.syncInfo !== null;
  }

  async _init() {
    if (!this._hasPermission) return;
    if (this._shouldFetch()) {
      try {
        await this.fetchData();
      } catch (e) {
        console.error('fetchData error:', e);
        this._retry();
      }
    } else if (this._polling) {
      this._startPolling();
    } else {
      this._retry();
    }
    this._subscription.subscribe('/account/~/extension/~/message-store');
  }

  _shouldFetch() {
    return (
      !this._tabManager || this._tabManager.active
    );
  }

  _subscriptionHandler() {
    if (this._storage && this._tabManager && !this._tabManager.active) {
      return;
    }
    const accountExtesionEndPoint = /\/message-store$/;
    const { message } = this._subscription;
    if (
      message &&
      message !== this._lastSubscriptionMessage &&
      accountExtesionEndPoint.test(message.event) &&
      message.body &&
      message.body.changes
    ) {
      this._lastSubscriptionMessage = this._subscription.message;
      this.fetchData({ passive: true });
    }
  }

  _checkConnectivity() {
    if (
      this._connectivityMonitor &&
      this._connectivityMonitor.ready &&
      this._connectivity !== this._connectivityMonitor.connectivity
    ) {
      this._connectivity = this._connectivityMonitor.connectivity;
      if (this._connectivity) {
        this.fetchData();
      }
    }
  }

  async _syncFunction({
    recordCount,
    conversationLoadLength,
    dateFrom,
    dateTo,
    syncToken,
    receivedRecordsLength = 0
  }) {
    const params = getSyncParams({
      recordCount,
      conversationLoadLength,
      dateFrom,
      dateTo,
      syncToken,
    });
    const {
      records,
      syncInfo,
    } = await this._client.account().extension().messageSync().list(params);
    receivedRecordsLength += records.length;
    if (!syncInfo.olderRecordsExist || receivedRecordsLength >= recordCount) {
      return { records, syncInfo };
    }
    await sleep(500);
    const olderDateTo = new Date(records[records.length - 1].creationTime);
    const olderRecordResult = await this._syncFunction({
      conversationLoadLength,
      dateFrom,
      dateTo: olderDateTo,
    });
    return {
      records: records.concat(olderRecordResult.records),
      syncInfo,
    };
  }

  getSyncActionType({ dateTo, syncToken }) {
    if (syncToken) {
      return this.actionTypes.conversationsISyncSuccess;
    }
    return this.actionTypes.conversationsFSyncSuccess;
  }

  async _syncData({
    dateTo,
    conversationsLoadLength = this._conversationsLoadLength,
    conversationLoadLength = this._conversationLoadLength,
    passive = false,
  } = {}) {
    this.store.dispatch({
      type: this.actionTypes.conversationsSync,
    });
    const { ownerId } = this._auth;
    try {
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - this._daySpan);
      const syncToken = dateTo ? null : this.syncInfo && this.syncInfo.syncToken;
      const recordCount = conversationsLoadLength * conversationLoadLength;
      const data = await this._syncFunction({
        recordCount,
        conversationLoadLength,
        dateFrom,
        syncToken,
        dateTo,
      });
      if (this._auth.ownerId === ownerId) {
        const actionType = this.getSyncActionType({ dateTo, syncToken });
        this.store.dispatch({
          type: actionType,
          recordCount,
          records: data.records,
          syncInfo: data.syncInfo,
          timestamp: Date.now(),
          conversationStore: this.conversationStore,
        });
        // this is only executed in passive sync mode (aka. invoked by subscription)
        if (passive) {
          this._dispatchMessageHandlers(data.records);
        }
      }
    } catch (error) {
      if (this._auth.ownerId === ownerId) {
        console.error(error);
        this.store.dispatch({
          type: this.actionTypes.conversationsSyncError,
          error,
        });
        throw error;
      }
    }
  }

  async _fetchData({
    dateTo,
    conversationsLoadLength,
    conversationLoadLength,
    passive = false,
  } = {}) {
    try {
      await this._syncData({
        dateTo,
        conversationsLoadLength,
        conversationLoadLength,
        passive,
      });
      if (this._polling) {
        this._startPolling();
      }
      this._promise = null;
    } catch (error) {
      this._promise = null;
      if (this._polling) {
        this._startPolling(this.timeToRetry);
      } else {
        this._retry();
      }
      throw error;
    }
  }

  _startPolling(t = (this.timestamp + this.ttl + 10) - Date.now()) {
    this._clearTimeout();
    this._timeoutId = setTimeout(() => {
      this._timeoutId = null;
      if ((!this._tabManager || this._tabManager.active) && this.pageNumber === 1) {
        if (!this.timestamp || Date.now() - this.timestamp > this.ttl) {
          this.fetchData();
        } else {
          this._startPolling();
        }
      } else if (this.timestamp && Date.now() - this.timestamp < this.ttl) {
        this._startPolling();
      } else {
        this._startPolling(this.timeToRetry);
      }
    }, t);
  }

  @proxify
  async fetchData({ passive = false } = {}) {
    if (!this._promise) {
      this._promise = this._fetchData({ passive });
    }
    await this._promise;
  }

  onNewInboundMessage(handler) {
    if (typeof handler === 'function') {
      this._newMessageNotificationHandlers.push(handler);
    }
  }

  /**
   * Dispatch events to different handlers
   */
  _dispatchMessageHandlers(records) {
    // Sort all records by creation time
    records = records.slice().sort((a, b) =>
      (new Date(a.creationTime)).getTime() - (new Date(b.creationTime)).getTime()
    );
    for (const record of records) {
      const {
        direction,
        availability,
        messageStatus,
        readStatus,
      } = record || {};
      // Notify when new message incoming
      if (
        direction === 'Inbound' &&
        readStatus === 'Unread' &&
        messageStatus === 'Received' &&
        availability === 'Alive' &&
        // To present sync same record twice
        !this._messageDispatched(record)
      ) {
        // mark last 10 messages that dispatched
        this._dispatchedMessageIds = [record.id].concat(this._dispatchedMessageIds).slice(0, 10);
        this._newMessageNotificationHandlers.forEach(handler => handler(record));
      }
    }
  }

  _messageDispatched(message) {
    return this._dispatchedMessageIds.some(id => id === message.id);
  }

  @proxify
  async pushMessages(records) {
    this.store.dispatch({
      type: this.actionTypes.updateMessages,
      records,
    });
  }

  pushMessage(record) {
    this.pushMessages([record]);
  }

  async _updateMessageApi(messageId, status) {
    const body = {
      readStatus: status,
    };
    const updateRequest = await this._client.account()
      .extension()
      .messageStore(messageId)
      .put(body);
    return updateRequest;
  }

  async deleteMessageApi(messageId) {
    const response = await this._client.account()
      .extension()
      .messageStore(messageId)
      .delete();
    return response;
  }

  async _batchUpdateMessagesApi(messageIds, body) {
    const ids = decodeURIComponent(messageIds.join(','));
    const platform = this._client.service.platform();
    const responses = await batchPutApi({
      platform,
      url: `/account/~/extension/~/message-store/${ids}`,
      body,
    });
    return responses;
  }

  async _updateMessagesApi(messageIds, status) {
    if (messageIds.length === 1) {
      const result = await this._updateMessageApi(messageIds[0], status);
      return [result];
    }
    const UPDATE_MESSAGE_ONCE_COUNT = 20;
    const leftIds = messageIds.slice(0, UPDATE_MESSAGE_ONCE_COUNT);
    const rightIds = messageIds.slice(UPDATE_MESSAGE_ONCE_COUNT);
    const body = leftIds.map(() => (
      { body: { readStatus: status } }
    ));
    const responses = await this._batchUpdateMessagesApi(leftIds, body);
    const results = [];
    responses.forEach((res) => {
      if (res.response().status === 200) {
        results.push(res.json());
      }
    });
    if (rightIds.length > 0) {
      const rightResults = await this._updateMessagesApi(rightIds, status);
      if (rightResults.length > 0) {
        results.concat(rightResults);
      }
    }
    return results;
  }

  @proxify
  async readMessages(conversationId) {
    const messageList = this.conversationStore[conversationId];
    if (!messageList || messageList.length === 0) {
      return null;
    }
    const unreadMessageIds = messageList.filter(messageIsUnread).map(m => m.id);
    if (unreadMessageIds.length === 0) {
      return null;
    }
    try {
      const updatedMessages = await this._updateMessagesApi(unreadMessageIds, 'Read');
      this.store.dispatch({
        type: this.actionTypes.updateMessages,
        records: updatedMessages,
      });
    } catch (error) {
      console.error(error);
      this._alert.warning({
        message: messageStoreErrors.readFailed,
      });
    }
    return null;
  }

  @proxify
  async unreadMessage(messageId) {
    //  for track mark message
    this.store.dispatch({
      type: this.actionTypes.markMessages,
    });
    try {
      const message = await this._updateMessageApi(messageId, 'Unread');
      this.store.dispatch({
        type: this.actionTypes.updateMessages,
        records: [message],
      });
    } catch (error) {
      console.error(error);
      this._alert.warning({
        message: messageStoreErrors.unreadFailed,
      });
    }
  }

  @proxify
  async onUnmarkMessages() {
    this.store.dispatch({
      type: this.actionTypes.markMessages,
    });
  }

  @proxify
  async deleteConversationMessages(conversationId) {
    if (!conversationId) {
      return;
    }
    const messageList = this.conversationStore[conversationId];
    if (!messageList || messageList.length === 0) {
      return;
    }
    const messageId = messageList.map(m => m.id).join(',');
    try {
      await this.deleteMessageApi(messageId);
      this.store.dispatch({
        type: this.actionTypes.deleteConversation,
        conversationId,
      });
    } catch (error) {
      console.error(error);
      this._alert.warning({
        message: messageStoreErrors.deleteFailed,
      });
    }
  }

  @proxify
  async deleteConversation(conversationId) {
    if (!conversationId) {
      return;
    }
    try {
      await this._client.account()
        .extension()
        .messageStore()
        .delete({
          conversationId
        });
      this.store.dispatch({
        type: this.actionTypes.deleteConversation,
        conversationId,
      });
    } catch (error) {
      console.error(error);
      this._alert.warning({
        message: messageStoreErrors.deleteFailed,
      });
    }
  }

  // for track click to sms in message list
  @proxify
  onClickToSMS() {
    this.store.dispatch({
      type: this.actionTypes.clickToSMS
    });
  }

  // for track click to call in message list
  @proxify
  onClickToCall({ fromType = '' }) {
    this.store.dispatch({
      type: this.actionTypes.clickToCall,
      fromType
    });
  }

  get status() {
    return this.state.status;
  }

  get data() {
    return this._storage ?
      this._storage.getItem(this._dataStorageKey) :
      this.state.data;
  }

  get timestamp() {
    return this.data.timestamp;
  }

  get timeToRetry() {
    return this._timeToRetry;
  }

  get ttl() {
    return this._ttl;
  }

  get syncInfo() {
    return this.data.syncInfo;
  }

  get conversationStore() {
    return this.data.conversationStore;
  }

  get _hasPermission() {
    return this._rolesAndPermissions.hasReadMessagesPermission;
  }

  @getter
  allConversations = createSelector(
    () => this.data.conversationList,
    () => this.data.conversationStore,
    (conversationList, conversationStore) =>
      conversationList.map(
        (conversationItem) => {
          const messageList = conversationStore[conversationItem.id] || [];
          return {
            ...messageList[0],
            unreadCounts: messageList.filter(messageIsUnread).length,
          };
        }
      )
  )

  @getter
  textConversations = createSelector(
    () => this.allConversations,
    conversations =>
      conversations.filter(
        conversation => messageHelper.messageIsTextMessage(conversation)
      )
  )

  @getter
  textUnreadCounts = createSelector(
    () => this.textConversations,
    conversations =>
      conversations.reduce((a, b) => a + b.unreadCounts, 0)
  )

  @getter
  faxMessages = createSelector(
    () => this.allConversations,
    conversations =>
      conversations.filter(
        conversation => messageHelper.messageIsFax(conversation)
      )
  )

  @getter
  faxUnreadCounts = createSelector(
    () => this.faxMessages,
    conversations =>
      conversations.reduce((a, b) => a + b.unreadCounts, 0)
  )

  @getter
  voicemailMessages = createSelector(
    () => this.allConversations,
    conversations =>
      conversations.filter(
        conversation => messageHelper.messageIsVoicemail(conversation)
      )
  )

  @getter
  voiceUnreadCounts = createSelector(
    () => this.voicemailMessages,
    conversations =>
      conversations.reduce((a, b) => a + b.unreadCounts, 0)
  )

  @getter
  unreadCounts = createSelector(
    () => this.voiceUnreadCounts,
    () => this.textUnreadCounts,
    () => this.faxUnreadCounts,
    (voiceUnreadCounts, textUnreadCounts, faxUnreadCounts) => {
      let unreadCounts = 0;
      if (this._rolesAndPermissions.readTextPermissions) {
        unreadCounts += textUnreadCounts;
      }
      if (this._rolesAndPermissions.voicemailPermissions) {
        unreadCounts += voiceUnreadCounts;
      }
      if (this._rolesAndPermissions.readFaxPermissions) {
        unreadCounts += faxUnreadCounts;
      }
      return unreadCounts;
    }
  )
}
