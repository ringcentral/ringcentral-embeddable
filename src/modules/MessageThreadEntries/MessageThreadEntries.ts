import { EventEmitter } from 'events';
import { computed, watch, state, action, storage } from '@ringcentral-integration/core';
import { Module } from '@ringcentral-integration/commons/lib/di';
import { DataFetcherV2Consumer, DataSource } from '@ringcentral-integration/commons/modules/DataFetcherV2';
import debounce from '@ringcentral-integration/commons/lib/debounce';

import type {
  Deps,
  MessageThreadEntriesData,
  MessageThreadEntriesSubscriptionMessage,
  MessageThreadEntry,
  MessageThreadEntriesStore,
  MessageThreadEntriesStoreData,
  DeletedMessage,
  AliveMessage,
  AliveNote,
  EntityHandler,
} from './MessageThreadEntries.interface';

@Module({
  name: 'MessageThreadEntries',
  deps: [
    'Client',
    'DataFetcherV2',
    'AppFeatures',
    'Auth',
    'TabManager',
    'Storage',
    'GrantExtensions',
    { dep: 'Subscription', optional: true },
    { dep: 'MessageThreadEntriesOptions', optional: true },
  ],
})
export class MessageThreadEntries extends DataFetcherV2Consumer<
  Deps,
  MessageThreadEntriesStoreData
> {
  private _stopWatching: any;
  private _source: DataSource<MessageThreadEntriesStoreData>;
  private _syncPromise: Promise<MessageThreadEntriesStoreData> | null = null;
  private _syncTimeout: NodeJS.Timeout | null = null;
  protected _eventEmitter = new EventEmitter();
  protected _handledRecords: MessageThreadEntry[] = [];

  constructor(deps: Deps) {
    super({
      deps,
      enableCache: true,
      storageKey: 'MessageThreadEntries',
    });
    this._source = new DataSource({
      ...deps.messageThreadEntriesOptions,
      key: 'messageThreadEntries',
      cleanOnReset: true,
      permissionCheckFunction: () => this.hasPermission,
      fetchFunction: async () => this._syncData(),
      readyCheckFunction: () => this._deps.appFeatures.ready,
    });
    this._deps.dataFetcherV2.register(this._source);
    this.sync = debounce(this._sync, 2000, false);
  }

  override onInit() {
    if (!this.hasPermission) {
      return;
    }
    if (this._deps.subscription) {
      this._deps.subscription.subscribe([
        '/restapi/v1.0/account/~/message-threads/entries/sync',
      ]);
      this._stopWatching = watch(
        this,
        () => this._deps.subscription!.message,
        (message) => this._handleSubscription(message),
      );
    }
  }

  _handleSubscription(message: MessageThreadEntriesSubscriptionMessage) {
    if (!message || !message.event) {
      return;
    }
    if (message.event.indexOf('/message-threads/entries/sync') !== -1) {
      this.sync();
    }
  }

  async _syncFunction(syncToken?: string): Promise<MessageThreadEntriesData> {
    const syncType = syncToken ? 'ISync' : 'FSync';
    const params: {
      syncType: string;
      syncToken?: string;
      recordCount?: number;
      messageType?: string;
      scope?: string;
    } = {
      syncType
    };
    if (syncToken) {
      params.syncToken = syncToken;
    } else {
      params.recordCount = 250;
      params.messageType = 'SMS';
      params.scope = 'Accessible';
    }
    const response = await this._deps.client.service
      .platform()
      .get('/restapi/v1.0/account/~/message-threads/entries/sync', params);
    return response.json();
  }

  _mergeIntoStoreData(records: MessageThreadEntry[] = [], isFullSync = false) {
    const oldStore: MessageThreadEntriesStore = this.data?.store ?? {};
    let newStore: MessageThreadEntriesStore = {};
    if (!isFullSync) {
      if (records.length === 0) {
        return oldStore;
      }
      newStore = { ...oldStore };
    }
    const updatedStoreKeys: Record<string, number> = {};
    records.forEach((record) => {
      const threadId = record.threadId;
      const lastModifiedTime = new Date(record.lastModifiedTime).getTime();
      const entries = newStore[threadId] ? [].concat(newStore[threadId]) : [];
      const oldIndex = entries.findIndex((entry) => entry.id === record.id);
      if ((record as DeletedMessage).availability === 'Deleted') {
        if (oldIndex !== -1) {
          newStore[threadId].splice(oldIndex, 1);
        }
        if (newStore[threadId].length === 0) {
          delete newStore[threadId];
        }
        return;
      }
      if (oldIndex !== -1) {
        const oldEntry = entries[oldIndex];
        if (lastModifiedTime > oldEntry.lastModifiedTime) {
          entries[oldIndex] = {
            ...record,
            lastModifiedTime,
            creationTime:
              (record as AliveMessage | AliveNote).creationTime ?
                new Date((record as AliveMessage | AliveNote).creationTime).getTime() :
                lastModifiedTime,
          };
        }
      } else {
        entries.push({
          ...record,
          lastModifiedTime,
          creationTime:
            (record as AliveMessage | AliveNote).creationTime ?
              new Date((record as AliveMessage | AliveNote).creationTime).getTime() :
              lastModifiedTime,
        });
      }
      newStore[threadId] = entries;
      updatedStoreKeys[threadId] = 1;
    });
    Object.keys(updatedStoreKeys).forEach((threadId) => {
      newStore[threadId] = newStore[threadId].sort((a, b) => a.creationTime - b.creationTime);
    });
    return newStore;
  }

  async _syncData({ passive = false }: { passive?: boolean } = {}) {
    const { ownerId } = this._deps.auth;
    try {
      const syncToken = this.syncInfo?.syncToken;
      let isFullSyncing = !syncToken;
      let data;
      try {
        data = await this._syncFunction(syncToken);
      } catch (e: any) {
        if (syncToken && e.response?.status === 400) {
          isFullSyncing = true;
          data = await this._syncFunction(null);
        }
        throw e;
      }
      if (this._deps.auth.ownerId === ownerId) {
        if (passive) {
          // only handle records that invoked by subscription
          this._handledRecords = data.records;
        }
        const store = this._mergeIntoStoreData(data.records, !syncToken);
        if (isFullSyncing) {
          this.clearReadTimeMap(Object.keys(store));
        }
        this.updateReadTimeMap(data.records);
        return {
          store,
          syncInfo: data.syncInfo,
        };
      }
    } catch (e) {
      if (this._deps.auth.ownerId === ownerId) {
        console.error(e);
        throw e;
      }
    }
  }

  async _updateData(data: any, timestamp = Date.now()) {
    this._deps.dataFetcherV2.updateData(this._source, data, timestamp);
  }

  override async fetchData() {
    if (this._syncPromise) {
      return this._syncPromise;
    }
    this._handledRecords = [];
    this._syncPromise = this._syncData({ passive: true });
    const data = await this._syncPromise;
    this._syncPromise = null;
    this._updateData(data);
    if (this._handledRecords && this._handledRecords.length > 0) {
      this._dispatchEntityHandlers(this._handledRecords);
      this._handledRecords = [];
    }
    return data;
  }

  async _sync() {
    if (!this.hasPermission) {
      return;
    }
    if (this._deps.tabManager && !this._deps.tabManager.active) {
      return;
    }
    await this.fetchData();
  }

  override onReset() {
    this._stopWatching?.();
    this._stopWatching = null;
  }

  @computed((that: MessageThreadEntries) => [that.data])
  get store() {
    return this.data?.store ?? {};
  }

  get hasPermission() {
    return (
      this._deps.appFeatures.hasMessageThreadsPermission &&
      this._deps.grantExtensions.callQueueSmsRecipients.length > 0
    );
  }

  override get data() {
    return this._deps.dataFetcherV2.getData(this._source);
  }

  get timestamp() {
    return this._deps.dataFetcherV2.getTimestamp(this._source);
  }

  get syncInfo() {
    return this.data?.syncInfo;
  }

  @storage
  @state
  lastReadTimeMap: Record<string, number> = {};

  @action
  updateReadTimeMap(entries: MessageThreadEntry[]) {
    const outboundEntries: AliveMessage[] = entries.filter((entry) => entry.recordType === 'AliveMessage' && entry.direction === 'Outbound') as AliveMessage[];
    outboundEntries.forEach((entry) => {
      const currentCreationTime = new Date(entry.creationTime).getTime();
      const lastReadTime = this.lastReadTimeMap[entry.threadId] ?? 0;
      if (currentCreationTime > lastReadTime) {
        // if replied, the last read time should be the creation time of the replied message
        this.lastReadTimeMap[entry.threadId] = currentCreationTime - 1;
      }
    });
  }

  @action
  clearReadTimeMap(currentThreadIds: string[]) {
    const threadIds = Object.keys(this.lastReadTimeMap);
    threadIds.forEach((threadId) => {
      if (!currentThreadIds.includes(threadId)) {
        delete this.lastReadTimeMap[threadId];
      }
    });
  }

  @action
  _markThreadAsRead(threadId: string) {
    this.lastReadTimeMap[threadId] = Date.now();
  }

  markThreadAsRead(threadId: string) {
    this._markThreadAsRead(threadId);
    this.triggerSyncWithTimeout();
  }

  triggerSyncWithTimeout() {
    if (this._syncTimeout) {
      clearTimeout(this._syncTimeout);
    }
    this._syncTimeout = setTimeout(() => {
      this.sync();
    }, 5000);
  }

  saveNewMessages(messages: AliveMessage[]) {
    const newStore = this._mergeIntoStoreData(messages, false);
    this._deps.dataFetcherV2.updateData(this._source, {
      ...(this.data ?? {}),
      store: newStore,
    });
    // this.triggerSyncWithTimeout();
  }

  async createNote(threadId: string, text: string): Promise<AliveNote> {
    const response = await this._deps.client.service
      .platform()
      .post(`/restapi/v1.0/account/~/message-threads/notes`, {
        text,
        threadId,
      });
    const note = await response.json();
    const newNote = {
      ...note,
      recordType: 'AliveNote',
    };
    const newStore = this._mergeIntoStoreData([newNote], false);
    this._deps.dataFetcherV2.updateData(this._source, {
      ...(this.data ?? {}),
      store: newStore,
    });
    return newNote;
  }

  async updateNote(noteId: string, text: string): Promise<AliveNote> {
    const response = await this._deps.client.service
      .platform()
      .patch(`/restapi/v1.0/account/~/message-threads/notes/${noteId}`, {
        text,
      });
    const note = await response.json();
    const newNote = {
      ...note,
      recordType: 'AliveNote',
    };
    const newStore = this._mergeIntoStoreData([newNote], false);
    this._deps.dataFetcherV2.updateData(this._source, {
      ...(this.data ?? {}),
      store: newStore,
    });
    return newNote;
  }

  async deleteNote(threadId: string, noteId: string): Promise<void> {
    await this._deps.client.service
      .platform()
      .send({
        url: `/restapi/v1.0/account/~/message-threads/notes`,
        method: 'DELETE',
        body: {
          ids: [noteId],
        },
      });
    // Update store to remove the deleted note immediately
    const currentStore = this.data?.store ?? {};
    const newStore = {
      ...currentStore,
      [threadId]: (currentStore[threadId] || []).filter((entry) => entry.id !== noteId),
    };
    this._deps.dataFetcherV2.updateData(this._source, {
      ...(this.data ?? {}),
      store: newStore,
    });
  }

  _dispatchEntityHandlers(entities: MessageThreadEntry[]) {
    entities.forEach((entity) => {
      this._eventEmitter.emit('entityUpdated', entity);
    });
  }

  onEntityUpdated(handler: EntityHandler) {
    if (typeof handler === 'function') {
      this._eventEmitter.on('entityUpdated', handler);
    }
  }
}
