import { computed, watch } from '@ringcentral-integration/core';
import { Module } from '@ringcentral-integration/commons/lib/di';
import { DataFetcherV2Consumer, DataSource } from '@ringcentral-integration/commons/modules/DataFetcherV2';

import type {
  Deps,
  MessageThreadEntriesData,
  MessageThreadEntriesSubscriptionMessage,
} from './MessageThreadEntries.interface';

@Module({
  name: 'MessageThreadEntries',
  deps: [
    'Client',
    'DataFetcherV2',
    'AppFeatures',
    'Auth',
    { dep: 'Subscription', optional: true },
    { dep: 'MessageThreadEntriesOptions', optional: true },
  ],
})
export class MessageThreadEntries extends DataFetcherV2Consumer<
  Deps,
  MessageThreadEntriesData
> {
  private _stopWatching: any;
  private _source: DataSource<MessageThreadEntriesData>;

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

  async _syncFunction(syncToken?: string) {
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

  _mergeData(newData: MessageThreadEntriesData) {
    const { records, syncInfo } = newData;
    const existingRecords = this.data?.records ?? [];
    const oldRecords = existingRecords.filter((record) => {
      return !records.some((newRecord) => newRecord.id === record.id);
    });
    return {
      records: [...records, ...oldRecords].filter((record) => record.availability === 'Alive'),
      syncInfo,
    };
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
        return this._mergeData(data);
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
    await this.fetchData();
  }

  override onReset() {
    this._stopWatching?.();
    this._stopWatching = null;
  }

  @computed((that: MessageThreadEntries) => [that.data])
  get entries() {
    return this.data?.records ?? [];
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

