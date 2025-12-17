import { computed, watch } from '@ringcentral-integration/core';
import { Module } from '@ringcentral-integration/commons/lib/di';
import { DataFetcherV2Consumer, DataSource } from '@ringcentral-integration/commons/modules/DataFetcherV2';

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
} from './MessageThreadEntries.interface';

@Module({
  name: 'MessageThreadEntries',
  deps: [
    'Client',
    'DataFetcherV2',
    'AppFeatures',
    'Auth',
    'TabManager',
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

  constructor(deps: Deps) {
    super({
      deps,
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

  async _syncData() {
    const { ownerId } = this._deps.auth;
    try {
      const syncToken = this.syncInfo?.syncToken;
      let data;
      try {
        data = await this._syncFunction(syncToken);
      } catch (e: any) {
        if (syncToken && e.response?.status === 400) {
          data = await this._syncFunction(null);
        }
        throw e;
      }
      if (this._deps.auth.ownerId === ownerId) {
        return {
          store: this._mergeIntoStoreData(data.records, !syncToken),
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
    const data = await this._syncData();
    this._updateData(data);
  }

  async sync() {
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
    return this._deps.appFeatures.hasMessageThreadsPermission;
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
}
