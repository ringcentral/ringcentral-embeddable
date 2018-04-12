import { createSelector } from 'reselect';

import { Module } from 'ringcentral-integration/lib/di';
import Pollable from 'ringcentral-integration/lib/Pollable';
import ensureExist from 'ringcentral-integration/lib/ensureExist';
import getter from 'ringcentral-integration/lib/getter';
import sleep from 'ringcentral-integration/lib/sleep';
import proxify from 'ringcentral-integration/lib/proxy/proxify';
import moduleStatuses from 'ringcentral-integration/enums/moduleStatuses';
import syncTypes from 'ringcentral-integration/enums/syncTypes';

import actionTypes from './actionTypes';
import getReducer from './getReducer';
import getDataReducer from './getDataReducer';

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

function getSyncParams({ recordCount, conversationPerPage, dateFrom, dateTo, syncToken }) {
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
export default class NewMessageStore extends Pollable {
  constructor({
    auth,
    client,
    subscription,
    storage,
    tabManager,
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

    if (!disableCache) {
      this._storage = storage;
    }

    this._dataStorageKey = 'newMessageStoreData';

    this._tabManager = tabManager;
    this._storage = storage;

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
  }

  initialize() {
    this.store.subscribe(() => this._onStateChange());
  }

  async _onStateChange() {
    if (this._shouldInit()) {
      this.store.dispatch({
        type: this.actionTypes.init,
      });
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
    }
  }

  _shouldInit() {
    return !!(
      this._auth.loggedIn &&
      (!this._storage || this._storage.ready) &&
      (!this._tabManager || this._tabManager.ready) &&
      this.pending
    );
  }

  _shouldReset() {
    return !!(
      (
        !this._auth.loggedIn ||
        (this._storage && !this._storage.ready) ||
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
  }

  _shouldFetch() {
    return (
      !this._tabManager || this._tabManager.active
    );
  }

  async _syncFunction({
    recordCount,
    conversationPerPage,
    dateFrom,
    dateTo,
    syncToken,
    receivedRecordsLength = 0
  }) {
    const params = getSyncParams({
      recordCount,
      conversationPerPage,
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
      });
      if (this._auth.ownerId === ownerId) {
        const actionType = this.getSyncActionType({ dateTo, syncToken });
        this.store.dispatch({
          type: actionType,
          recordCount,
          data,
          timestamp: Date.now(),
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
  async fetchNextPage() {
    if (!this.hasOlderData) {
      return;
    }
    if (this._fetchingNextPage) {
      return;
    }
    this._fetchingNextPage = true;
    try {
      await this._syncData({
        dateTo: this.earliestTime,
        conversationPerPage: 1,
      });
      this._fetchingNextPage = false;
    } catch (error) {
      this._fetchingNextPage = false;
      throw error;
    }
  }

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
        data: { records },
      });
    } catch (e) {
      this.store.dispatch({
        type: this.actionTypes.conversationSyncError,
      });
    }
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

  @getter
  allConversations = createSelector(
    () => this.data.conversationList,
    () => this.data.conversationStore,
    (conversationList, conversationStore) =>
      conversationList.map(conversationItem => conversationStore[conversationItem.id][0])
  )

  @getter
  earliestTime = createSelector(
    () => this.allConversations || [],
    getEarliestTime,
  )
}
