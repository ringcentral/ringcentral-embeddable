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
  SMSRecipient,
} from './MessageThreads.interface';
import type { AliveMessage } from '../MessageThreadEntries/MessageThreadEntries.interface';
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
  private _syncPromise: Promise<MessageThreadsSavedData> | null = null;

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
    return newRecords.sort((a, b) => b.creationTime - a.creationTime);
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
    if (this._syncPromise) {
      return this._syncPromise;
    }
    this._syncPromise = this._syncData();
    const data = await this._syncPromise;
    this._syncPromise = null;
    this._updateData(data);
    return data;
  }

  override onReset() {
    this._stopWatching?.();
    this._stopWatching = null;
  }

  @computed((that: MessageThreads) => [
    that.data,
    that._deps.messageThreadEntries.store,
    that._deps.messageThreadEntries.lastReadTimeMap,
  ])
  get threads() {
    // format threads to similar format as normal SMS conversations
    const list = this.data?.records ?? [];
    const store = this._deps.messageThreadEntries.store;
    return list.map((thread) => {
      const entries = store[thread.id] ?? [];
      let latestEntry;
      const isAssignedToMe = thread.assignee?.extensionId === this._deps.auth.ownerId;
      const lastReadTime = this._deps.messageThreadEntries.lastReadTimeMap[thread.id] ?? 0;
      let unreadCounts = 0;
      entries.forEach((entry) => {
        if (
          entry.recordType === 'AliveMessage' &&
          (!latestEntry || entry.creationTime > latestEntry.creationTime)
        ) {
          latestEntry = entry;
        }
        if (entry.creationTime > lastReadTime && entry.direction === 'Inbound') {
          unreadCounts++;
        }
      });
      const direction = latestEntry?.direction || 'Outbound';
      const from = direction === 'Inbound' ?
        thread.guestParty :
        {
          ...thread.owner,
          ...thread.ownerParty,
        };
      const to = direction === 'Inbound' ?
        [{
          ...thread.owner,
          ...thread.ownerParty,
        }] :
        [thread.guestParty];
      if (thread.status !== 'Open' || (thread.assignee && !isAssignedToMe)) {
        unreadCounts = 0;
      }
      return {
        ...thread,
        messages: entries.map((entry) => {
          if (entry.recordType === 'AliveMessage') {
            return {
              ...entry,
              subject: entry.text,
              direction: entry.direction,
              from: entry.author,
              to: entry.direction === 'Inbound' ?
                [thread.ownerParty] :
                [entry.guestParty],
            };
          }
          return entry;
        }),
        unreadCounts,
        subject: thread.label || (latestEntry?.text ?? ''),
        direction,
        from,
        to,
        isAssignedToMe,
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

  @computed((that: MessageThreads) => [
    that.threads,
  ])
  get unreadCounts() {
    if (!this.hasPermission) {
      return 0;
    }
    return this.threads.reduce((a, b) => a + b.unreadCounts, 0);
  }

  async getSMSRecipients(threadOwner: MessageThread['owner']): Promise<SMSRecipient[]> {
    const response = await this._deps.client.service
      .platform()
      .get(`/restapi/v1.0/account/~/extension/${threadOwner.extensionId}/sms-recipients`);
    const result = await response.json();
    return result.smsRecipients;
  }

  async assign(threadId, assignee: {
    extensionId: string;
  } | null) {
    // for unassign, assignee is null
    const response = await this._deps.client.service
      .platform()
      .post(`/restapi/v1.0/account/~/message-threads/${threadId}/assign`, {
        assignee,
      });
    return response.json();
  }

  async resolve(threadId: string) {
    const response = await this._deps.client.service
      .platform()
      .post(`/restapi/v1.0/account/~/message-threads/${threadId}/resolve`);
    return response.json();
  }

  async sendMessage({
    threadId,
    text,
    from,
    to,
  }: {
    threadId?: string;
    text: string;
    from: {
      phoneNumber: string;
    };
    to: {
      phoneNumber: string;
    }[];
  }): Promise<AliveMessage> {
    const body: {
      text: string;
      from: {
        phoneNumber: string;
      };
      to: {
        phoneNumber: string;
      }[];
      threadId?: string;
    } = {
      text,
      from,
      to,
    };
    if (threadId) {
      const thread = this.data?.records.find((record) => record.id === threadId);
      if (thread && thread.status === 'Open') {
        body.threadId = thread.id;
      }
    }
    const response = await this._deps.client.service
      .platform()
      .post(`/restapi/v1.0/account/~/message-threads/messages`, body);
    const newEntry = await response.json();
    const newMessage = {
      ...newEntry,
      recordType: 'AliveMessage',
    };
    return newMessage;
  }

  async loadThread(threadId: string): Promise<MessageThreadSavedItem | null> {
    const thread = this.data?.records.find((record) => record.id === threadId);
    if (thread) {
      return thread;
    }
    try {
      const response = await this._deps.client.service
        .platform()
        .get(`/restapi/v1.0/account/~/message-threads/${threadId}`);
      const threadRecord = await response.json();
      const newRecords = this._mergeData([threadRecord], false);
      await this._deps.dataFetcherV2.updateData(this._source, {
        ...(this.data ?? {}),
        records: newRecords,
      });
      return newRecords.find((record) => record.id === threadId) ?? null;
    } catch (e) {
      console.error(e);
      return null;
    }
  }
}
