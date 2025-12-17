import { computed, watch, state, action } from '@ringcentral-integration/core';
import { Module } from '@ringcentral-integration/commons/lib/di';
import { DataFetcherV2Consumer, DataSource } from '@ringcentral-integration/commons/modules/DataFetcherV2';

import type {
  Deps,
  MessageThreadsData,
  MessageThreadsSubscriptionMessage,
  MessageThreadsSavedData,
  MessageThreadSavedItem,
  MessageThread,
} from './MessageThreads.interface';

@Module({
  name: 'MessageThreads',
  deps: [
    'Client',
    'DataFetcherV2',
    'AppFeatures',
    'MessageThreadEntries',
    'Auth',
    'TabManager',
    { dep: 'Subscription', optional: true },
    { dep: 'MessageThreadsOptions', optional: true },
  ],
})
export class MessageThreads extends DataFetcherV2Consumer<
  Deps,
  MessageThreadsSavedData
> {
  private _stopWatching: any;
  private _source: DataSource<MessageThreadsSavedData>;

  constructor(deps: Deps) {
    super({
      deps,
    });
    this._source = new DataSource({
      ...deps.messageThreadsOptions,
      key: 'messageThreads',
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
        '/restapi/v1.0/account/~/message-threads/sync',
      ]);
      this._stopWatching = watch(
        this,
        () => this._deps.subscription!.message,
        (message) => this._handleSubscription(message),
      );
    }
  }

  _handleSubscription(message: MessageThreadsSubscriptionMessage) {
    if (!message || !message.event) {
      return;
    }
    if (message.event.indexOf('/message-threads/sync') !== -1) {
      this.sync();
    }
  }

  async _syncFunction(syncToken?: string): Promise<MessageThreadsData> {
    const syncType = syncToken ? 'ISync' : 'FSync';
    const params: {
      syncType: string;
      syncToken?: string;
    } = {
      syncType
    };
    if (syncToken) {
      params.syncToken = syncToken;
    }
    const response = await this._deps.client.service
      .platform()
      .get('/restapi/v1.0/account/~/message-threads/sync', params);
    return response.json();
  }

  _mergeData(records: MessageThread[], isFullSync = false) {
    const existingRecords: MessageThreadSavedItem[] = this.data?.records ?? [];
    let newRecords: MessageThreadSavedItem[] = [];
    if (!isFullSync) {
      if (records.length === 0) {
        return existingRecords;
      }
      newRecords = [].concat(existingRecords);
    }
    records.forEach((record) => {
      const oldRecordIndex = existingRecords.findIndex((existingRecord) => existingRecord.id === record.id);
      if (record.availability === 'Deleted') {
        if (oldRecordIndex !== -1) {
          newRecords.splice(oldRecordIndex, 1);
        }
        return;
      }
      const lastModifiedTime = new Date(record.lastModifiedTime).getTime();
      if (oldRecordIndex !== -1) {
        const oldRecord = newRecords[oldRecordIndex];
        if (lastModifiedTime > oldRecord.lastModifiedTime) {
          newRecords[oldRecordIndex] = {
            ...record,
            lastModifiedTime,
            creationTime: new Date(record.creationTime).getTime(),
          };
        }
      } else {
        newRecords.push({
          ...record,
          lastModifiedTime,
          creationTime: new Date(record.creationTime).getTime(),
        });
      }
    });
    return newRecords.sort((a, b) => a.creationTime - b.creationTime);
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
          records: this._mergeData(data.records, !syncToken),
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

  async sync() {
    if (!this.hasPermission) {
      return;
    }
    if (this._deps.tabManager && !this._deps.tabManager.active) {
      return;
    }
    await this.fetchData();
  }

  async _updateData(data: any, timestamp = Date.now()) {
    this._deps.dataFetcherV2.updateData(this._source, data, timestamp);
  }

  override async fetchData() {
    const data = await this._syncData();
    this._updateData(data);
  }

  override onReset() {
    this._stopWatching?.();
    this._stopWatching = null;
  }

  @computed((that: MessageThreads) => [
    that.data,
    that._deps.messageThreadEntries.store,
  ])
  get threads() {
    const list = this.data?.records ?? [];
    const store = this._deps.messageThreadEntries.store;
    return list.map((thread) => {
      return {
        ...thread,
        entries: store[thread.id] ?? [],
      };
    });
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
