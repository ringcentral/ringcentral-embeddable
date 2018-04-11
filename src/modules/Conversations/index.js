import { createSelector } from 'reselect';

import { Module } from 'ringcentral-integration/lib/di';
import Pollable from 'ringcentral-integration/lib/Pollable';
import ensureExist from 'ringcentral-integration/lib/ensureExist';
import getter from 'ringcentral-integration/lib/getter';
import proxify from 'ringcentral-integration/lib/proxy/proxify';
import moduleStatuses from 'ringcentral-integration/enums/moduleStatuses';
import syncTypes from 'ringcentral-integration/enums/syncTypes';

import actionTypes from './actionTypes';
import getReducer from './getReducer';
import getDataReducer from './getDataReducer';

const DEFAULT_PER_PAGE = 20;
const DEFAULT_PER_CONVERSATION_PAGE = 10;
const DEFAULT_TTL = 30 * 60 * 1000;
const DEFAULT_RETRY = 62 * 1000;
const DEFAULT_DAYSPAN = 90;


function getSyncParams({ recordCount, perConversationPage, dateFrom, dateTo, syncToken }) {
  if (syncToken) {
    return {
      syncToken,
      syncType: syncTypes.iSync,
    };
  }
  const params = {
    recordCount,
    recordCountPerConversation: perConversationPage,
    syncType: syncTypes.fSync,
  };
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

 * @description Conversations data managing module
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
export default class Conversations extends Pollable {
  constructor({
    auth,
    client,
    subscription,
    storage,
    tabManager,
    perPage = DEFAULT_PER_PAGE,
    ttl = DEFAULT_TTL,
    polling = false,
    disableCache = false,
    timeToRetry = DEFAULT_RETRY,
    daySpan = DEFAULT_DAYSPAN,
    perConversationPage = DEFAULT_PER_CONVERSATION_PAGE,
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

    this._dataStorageKey = 'conversationsData';

    this._tabManager = tabManager;
    this._storage = storage;

    this._ttl = ttl;
    this._timeToRetry = timeToRetry;
    this._polling = polling;
    this._perPage = perPage;
    this._perConversationPage = perConversationPage;

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

  async _syncFunction({ recordCount, perConversationPage, dateFrom, dateTo, syncToken }) {
    const params = getSyncParams({
      recordCount,
      perConversationPage,
      dateFrom,
      dateTo,
      syncToken
    });
    const result =
      await this._client.account().extension().messageSync().list(params);
    if (!result.syncInfo.olderRecordsExist) {
      return result;
    }
    const olderDateTo = new Date(result.records[result.records.length - 1].creationTime);
    const olderRecordResult = await this._syncFunction({
      perConversationPage,
      dateFrom,
      dateTo: olderDateTo,
    });
    return {
      records: result.records.concat(olderRecordResult.records),
      syncInfo: result.syncInfo,
    };
  }

  async _fetchData({
    perPage = this._perPage,
    perConversationPage = this._perConversationPage
  } = {}) {
    this.store.dispatch({
      type: this.actionTypes.conversationsSync,
    });
    const { ownerId } = this._auth;
    try {
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - this._daySpan);
      const syncToken = this.syncInfo && this.syncInfo.syncToken;
      const data = await this._syncFunction({
        recordCount: perPage * perConversationPage,
        perConversationPage,
        dateFrom,
        syncToken,
      });
      if (this._auth.ownerId === ownerId) {
        const actionType = syncToken ?
          this.actionTypes.conversationsISyncSuccess :
          this.actionTypes.conversationsFSyncSuccess;
        this.store.dispatch({
          type: actionType,
          recordCount: perPage,
          data,
          timestamp: Date.now(),
        });
        if (this._polling) {
          this._startPolling();
        }
        this._promise = null;
      }
    } catch (error) {
      if (this._auth.ownerId === ownerId) {
        this._promise = null;
        console.error(error);
        this.store.dispatch({
          type: this.actionTypes.syncError,
          error,
        });
        if (this._polling) {
          this._startPolling(this.timeToRetry);
        } else {
          this._retry();
        }
        throw error;
      }
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
    if (!this.hasNextPage) {
      return;
    }
    if (!this._promise) {
      this._promise = this._fetchData({ page: this.pageNumber + 1 });
    }
    await this._promise;
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

  get hasNextPage() {
    if (this.paging.totalPages && this.paging.totalPages <= this.pageNumber) {
      return false;
    }
    return true;
  }

  get syncInfo() {
    return this.data.syncInfo;
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
    (records) => {
      let newTime = Date.now();
      records.forEach((record) => {
        const creationTime = (new Date(record.creationTime)).getTime();
        if (creationTime < newTime) {
          newTime = creationTime;
        }
      });
      return (new Date(newTime)).toISOString();
    }
  )
}
