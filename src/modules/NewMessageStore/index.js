import { createSelector } from 'reselect';

import { Module } from 'ringcentral-integration/lib/di';
import Pollable from 'ringcentral-integration/lib/Pollable';
import ensureExist from 'ringcentral-integration/lib/ensureExist';
import getter from 'ringcentral-integration/lib/getter';
import sleep from 'ringcentral-integration/lib/sleep';
import proxify from 'ringcentral-integration/lib/proxy/proxify';
import moduleStatuses from 'ringcentral-integration/enums/moduleStatuses';
import syncTypes from 'ringcentral-integration/enums/syncTypes';
import messageTypes from 'ringcentral-integration/enums/messageTypes';
import * as messageHelper from 'ringcentral-integration/lib/messageHelper';
import { batchPutApi } from 'ringcentral-integration/lib/batchApiHelper';

import actionTypes from './actionTypes';
import getReducer from './getReducer';
import getDataReducer from './getDataReducer';
import messageStoreErrors from './errors';

const DEFAULT_PER_PAGE = 20;
const DEFAULT_CONVERSATION_PER_PAGE = 10;
const DEFAULT_TTL = 30 * 60 * 1000;
const DEFAULT_RETRY = 62 * 1000;
const DEFAULT_DAYSPAN = 90;

function getEarliestTime(records) {
  let newTime = Date.now();
  records.forEach((record) => {
    const creationTime = (new Date(record.creationTime)).getTime();
    if (creationTime < newTime) {
      newTime = creationTime;
    }
  });
  return (new Date(newTime));
}

function getSyncParams({ recordCount, conversationPerPage, dateFrom, dateTo, syncToken, type }) {
  if (syncToken) {
    return {
      syncToken,
      syncType: syncTypes.iSync,
    };
  }
  const params = {
    recordCountPerConversation: conversationPerPage,
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
  if (type && type !== messageTypes.all) {
    if (type === messageTypes.text) {
      params.messageType = [messageTypes.sms, messageTypes.pager];
    } else {
      params.messageType = type;
    }
  }
  return params;
}

function messageIsUnread(message) {
  return (
    message.direction === 'Inbound' &&
    message.readStatus !== 'Read' &&
    !(messageHelper.messageIsDeleted(message))
  );
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
export default class NewMessageStore extends Pollable {
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
    perPage = DEFAULT_PER_PAGE,
    conversationPerPage = DEFAULT_CONVERSATION_PER_PAGE,
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

    this._dataStorageKey = 'newMessageStoreData';

    this._tabManager = tabManager;
    this._connectivityMonitor = connectivityMonitor;
    this._ttl = ttl;
    this._timeToRetry = timeToRetry;
    this._polling = polling;
    this._perPage = perPage;
    this._conversationPerPage = conversationPerPage;

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
    this._fetchingNextPage = false;
    this._conversationPageInfos = {};
    this._hasOlderData = {
      [messageTypes.all]: true,
      [messageTypes.text]: true,
      [messageTypes.fax]: true,
      [messageTypes.voiceMail]: true,
    };
    this._lastSubscriptionMessage = null;
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
      this._fetchingNextPage = false;
      this._conversationPageInfos = {};
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
      this.fetchData();
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
    conversationPerPage,
    dateFrom,
    dateTo,
    syncToken,
    type,
    receivedRecordsLength = 0
  }) {
    const params = getSyncParams({
      recordCount,
      conversationPerPage,
      dateFrom,
      dateTo,
      syncToken,
      type,
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
      conversationPerPage,
      dateFrom,
      dateTo: olderDateTo,
    });
    return {
      records: records.concat(olderRecordResult.records),
      syncInfo,
    };
  }

  getSyncActionType({ dateTo, syncToken }) {
    if (dateTo) {
      return this.actionTypes.conversationsFSyncPageSuccess;
    }
    if (syncToken) {
      return this.actionTypes.conversationsISyncSuccess;
    }
    return this.actionTypes.conversationsFSyncSuccess;
  }

  async _syncData({
    dateTo,
    type,
    perPage = this._perPage,
    conversationPerPage = this._conversationPerPage
  } = {}) {
    this.store.dispatch({
      type: this.actionTypes.conversationsSync,
    });
    const { ownerId } = this._auth;
    try {
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - this._daySpan);
      const syncToken = dateTo ? null : this.syncInfo && this.syncInfo.syncToken;
      const recordCount = perPage * conversationPerPage;
      const data = await this._syncFunction({
        recordCount,
        conversationPerPage,
        dateFrom,
        syncToken,
        dateTo,
        type,
      });
      if (this._auth.ownerId === ownerId) {
        if (type) {
          this._hasOlderData[type] = (data.records.length >= recordCount);
        }
        const actionType = this.getSyncActionType({ dateTo, syncToken });
        this.store.dispatch({
          type: actionType,
          recordCount,
          records: data.records,
          syncInfo: data.syncInfo,
          timestamp: Date.now(),
          conversationStore: this.conversationStore,
        });
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
    perPage,
    conversationPerPage,
  } = {}) {
    try {
      await this._syncData({
        dateTo,
        perPage,
        conversationPerPage,
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
  async fetchData() {
    if (!this._promise) {
      this._promise = this._fetchData();
    }
    await this._promise;
  }

  @proxify
  async fetchNextPage(type = messageTypes.all) {
    if (!this._hasOlderData[type]) {
      return;
    }
    if (this._fetchingNextPage) {
      return;
    }
    this._fetchingNextPage = true;
    try {
      await this._syncData({
        dateTo: this.earliestTime[type],
        conversationPerPage: 1,
        type
      });
      this._fetchingNextPage = false;
    } catch (error) {
      this._fetchingNextPage = false;
      throw error;
    }
  }

  @proxify
  async fetchConversationNextPage({
    conversationId
  }) {
    if (!this._conversationPageInfos[conversationId]) {
      this._conversationPageInfos[conversationId] = {
        hasNextPage: true,
        fetching: false,
      };
    }
    if (this._conversationPageInfos[conversationId].fetching) {
      return;
    }
    if (!this._conversationPageInfos[conversationId].hasNextPage) {
      return;
    }
    this.store.dispatch({
      type: this.actionTypes.conversationSync,
    });
    const messages = this.conversationStore[conversationId] || [];
    const earliestTime = getEarliestTime(messages);
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - this._daySpan);
    try {
      const { records } = await this._client.account().extension().messageStore().list({
        conversationId,
        dateFrom: dateFrom.toISOString(),
        dateTo: earliestTime.toISOString(),
        perPage: this._conversationPerPage,
        page: 1,
      });
      this._conversationPageInfos[conversationId] = {
        fetching: false,
        hasNextPage: (records.length >= this._conversationPerPage),
      };
      this.store.dispatch({
        type: this.actionTypes.conversationSyncPageSuccess,
        records,
      });
    } catch (e) {
      this.store.dispatch({
        type: this.actionTypes.conversationSyncError,
      });
    }
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

  async _deleteMessageApi(messageId) {
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
  async deleteCoversation(conversationId) {
    if (!conversationId) {
      return;
    }
    const messageList = this.conversationStore[conversationId];
    if (!messageList || messageList.length === 0) {
      return;
    }
    const messageId = messageList.map(m => m.id).join(',');
    try {
      await this._deleteMessageApi(messageId);
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

  get paging() {
    return this.state.paging;
  }

  get pageNumber() {
    return this.paging.page || 1;
  }

  get hasOlderData() {
    return this.data.hasOlderData;
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
  earliestTime = createSelector(
    () => this.data.conversationList || [],
    (conversationList) => {
      const newTime = {
        [messageTypes.all]: Date.now(),
        [messageTypes.text]: Date.now(),
        [messageTypes.fax]: Date.now(),
        [messageTypes.voiceMail]: Date.now(),
      };
      conversationList.forEach((record) => {
        const creationTime = (new Date(record.creationTime)).getTime();
        if (creationTime < newTime[messageTypes.all]) {
          newTime[messageTypes.all] = creationTime;
        }
        if (messageHelper.messageIsTextMessage(record)) {
          if (creationTime < newTime[messageTypes.all]) {
            newTime[messageTypes.all] = creationTime;
          }
          return;
        }
        if (creationTime < newTime[record.type]) {
          newTime[record.type] = creationTime;
        }
      });
      return {
        [messageTypes.all]: new Date(newTime[messageTypes.all]),
        [messageTypes.text]: new Date(newTime[messageTypes.text]),
        [messageTypes.fax]: new Date(newTime[messageTypes.fax]),
        [messageTypes.voiceMail]: new Date(newTime[messageTypes.fax]),
      };
    },
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
