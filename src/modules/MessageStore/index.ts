import { Module } from '@ringcentral-integration/commons/lib/di';
import {
  action,
  state,
  computed,
  watch,
} from '@ringcentral-integration/core';
import {
  MessageStore as MessageStoreBase,
} from '@ringcentral-integration/commons/modules/MessageStore';
import messageTypes from '@ringcentral-integration/commons/enums/messageTypes';
import messageDirection from '@ringcentral-integration/commons/enums/messageDirection';
import { sleep } from '@ringcentral-integration/utils';
import { syncTypes } from '@ringcentral-integration/commons/enums/syncTypes';
import { subscriptionFilters } from '@ringcentral-integration/commons/enums/subscriptionFilters';

import type {
  MessageSyncList,
} from '@ringcentral-integration/commons/interfaces/MessageStore.model';
import type {
  SyncFunctionOptions,
} from '@ringcentral-integration/commons/modules/MessageStore/MessageStore.interface';

// reference: https://developers.ringcentral.com/api-reference/Message-Store/syncMessages
const INVALID_TOKEN_ERROR_CODES = ['CMN-101', 'MSG-333', 'MSG-411'];

type GetSyncParamsOptions = Pick<
  SyncFunctionOptions,
  Exclude<keyof SyncFunctionOptions, 'receivedRecordsLength'>
>;

interface SyncParams {
  syncToken?: string;
  syncType: string;
  recordCountPerConversation?: GetSyncParamsOptions['conversationLoadLength'];
  recordCount?: GetSyncParamsOptions['recordCount'];
  dateFrom?: string;
  dateTo?: string;
  owner?: 'Any' | 'Personal' | 'Shared';
}

const getSyncParams = ({
  recordCount,
  conversationLoadLength,
  dateFrom,
  dateTo,
  syncToken,
  hasSharedAccess,
}: GetSyncParamsOptions) => {
  if (syncToken) {
    return {
      syncToken,
      syncType: syncTypes.iSync,
    } as SyncParams;
  }
  const params: SyncParams = {
    recordCountPerConversation: conversationLoadLength,
    syncType: syncTypes.fSync,
  };
  if (hasSharedAccess) {
    params.owner = 'Any';
  }
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
};

@Module({
  name: 'MessageStore',
  deps: [],
})
export class MessageStore extends MessageStoreBase {
  get hasSharedAccess() {
    return this._deps.appFeatures.hasSharedMessageStorePermission;
  }

  get syncOwner() {
    return this.syncInfo?.owner;
  }

  override onInit() {
    if (this._hasPermission) {
      const filters = [subscriptionFilters.messageStore];
      if (this._deps.appFeatures.hasCallQueueSmsRecipientPermission) {
        filters.push('/restapi/v1.0/account/~/extension/~/shared-sms');
      }
      this._deps.subscription.subscribe(filters);
    }
  }

  override onInitOnce() {
    if (this._deps.connectivityMonitor) {
      watch(
        this,
        () => this._deps.connectivityMonitor.connectivity,
        (newValue) => {
          if (this.ready && this._deps.connectivityMonitor.ready && newValue) {
            this._deps.dataFetcherV2.fetchData(this._source);
          }
        },
      );
    }
    watch(
      this,
      () => this._deps.subscription.message,
      (newValue) => {
        if (
          !this.ready ||
          (this._deps.tabManager && !this._deps.tabManager.active)
        ) {
          return;
        }
        const accountExtensionEndPoint = /\/message-store$/;
        if (
          newValue &&
          accountExtensionEndPoint.test(newValue.event) &&
          newValue.body?.changes
        ) {
          this.fetchData({ passive: true });
        } else if (
          newValue &&
          newValue.event.indexOf('/shared-sms') !== -1 &&
          newValue.body
        ) {
          this.pushMessages([{
            ...newValue.body,
            id: Number.parseInt(newValue.body.id, 10), // Fix different id type in shared sms notification
          }]);
          this.fetchData({ passive: true });
        }
      },
    );
  }

  async _syncFunction({
    recordCount,
    conversationLoadLength,
    dateFrom,
    dateTo,
    syncToken,
    receivedRecordsLength = 0,
  }: SyncFunctionOptions): Promise<MessageSyncList> {
    const params = getSyncParams({
      recordCount,
      conversationLoadLength,
      dateFrom,
      dateTo,
      syncToken,
      hasSharedAccess: this.hasSharedAccess,
    });
    const owner = syncToken ? this.syncOwner : params.owner;
    const { records, syncInfo = {} }: MessageSyncList = await this._deps.client
      .account()
      .extension()
      .messageSync()
      .list(params);
    receivedRecordsLength += records.length;
    if (!syncInfo.olderRecordsExist || receivedRecordsLength >= recordCount) {
      return {
        records,
        syncInfo: {
          ...syncInfo,
          owner,
        },
      };
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
      syncInfo: {
        ...syncInfo,
        owner,
      },
    };
  }

  // TODO: fix sync token error issue
  override async _syncData({ dateTo = null as Date, passive = false } = {}) {
    const conversationsLoadLength = this._conversationsLoadLength;
    const conversationLoadLength = this._conversationLoadLength;
    const { ownerId } = this._deps.auth;
    try {
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - this._daySpan);
      let syncToken = dateTo ? null : this.syncInfo?.syncToken;
      if (this.syncOwner !== 'Any' && this.hasSharedAccess) {
        syncToken = null; // Force refresh when user get shared sms firstly
      }
      const recordCount = conversationsLoadLength * conversationLoadLength;
      let data;
      try {
        data = await this._syncFunction({
          recordCount,
          conversationLoadLength,
          dateFrom,
          // @ts-expect-error
          syncToken,
          dateTo,
        });
      } catch (e: unknown) {
        const error = e;
        if (
          error.response?.status === 400 &&
          (await error.response?.clone().json())?.errors?.some(
            ({ errorCode = '' } = {}) =>
              INVALID_TOKEN_ERROR_CODES.includes(errorCode),
          )
        ) {
          data = await this._syncFunction({
            recordCount,
            conversationLoadLength,
            dateFrom,
            // @ts-expect-error
            syncToken: null,
            dateTo,
          });
          syncToken = null;
        } else {
          throw error;
        }
      }
      if (this._deps.auth.ownerId === ownerId) {
        const records = this._messagesFilter(data.records);
        const isFSyncSuccess = !syncToken;
        // this is only executed in passive sync mode (aka. invoked by subscription)
        // if (passive) {
        //   this._handledRecord = records;
        // }
        // Override: only handle recent 30 minutes records
        this._handledRecord = (records || []).filter((record) => {
          const lastModifiedTime = new Date(record.lastModifiedTime);
          return Date.now() - lastModifiedTime.getTime() < 30 * 60 * 1000;
        });
        if (!passive && this._handledRecord && this._handledRecord.length > 0) {
          this._dispatchMessageHandlers(this._handledRecord);
          this._handledRecord = null;
        }
        return {
          conversationList: this._processRawConversationList({
            records,
            conversationStore: this.conversationStore,
            isFSyncSuccess,
          }),
          conversationStore: this._processRawConversationStore({
            records,
            isFSyncSuccess,
          }),
          syncInfo: data.syncInfo,
        };
      }
    } catch (error: any /** TODO: confirm with instanceof */) {
      if (this._deps.auth.ownerId === ownerId) {
        console.error(error);
        throw error;
      }
    }
  }

  override async pushMessages(records) {
    this._deps.dataFetcherV2.updateData(
      this._source,
      {
        ...this.data,
        conversationList: this._processRawConversationList({
          records,
          conversationStore: this.conversationStore,
        }),
        conversationStore: this._processRawConversationStore({
          records,
        }),
      },
      Date.now(), // Fix new message is not saved into DB
    );
    this._dispatchMessageHandlers(records); // Send message event immediately
  }

  // override to support unread Text conversation
  override async unreadMessage(conversationId: string) {
    let messageId = conversationId;
    const messageList = this.conversationStore[conversationId];
    if (!messageList || messageList.length === 0) {
      this._deps.alert.warning({ message: 'noUnreadForOldMessages' });
      return;
    }
    const firstMessage = messageList[0];
    if (
      firstMessage.type === messageTypes.sms ||
      firstMessage.type === messageTypes.text ||
      firstMessage.type === messageTypes.pager
    ) {
      const inboundMessage = messageList.find(
        (message) => message.direction === messageDirection.inbound,
      );
      if (!inboundMessage) {
        this._deps.alert.warning({ message: 'noUnreadForOutboundMessages' });
        return;
      }
      messageId = inboundMessage.id;
    }
    await super.unreadMessage(messageId);
  }

  @computed((that: MessageStore) => [that.textConversations])
  get sharedSmsConversations() {
    return this.textConversations.filter((conversation) => {
      return !!conversation.owner;
    });
  }

  @computed((that: MessageStore) => [that.textConversations])
  get personalTextUnreadCounts() {
    return this.textConversations.reduce((a, b) => {
      if (!b.owner) {
        return a + b.unreadCounts;
      }
      return a;
    }, 0);
  }

  @computed((that: MessageStore) => [that.textConversations])
  get sharedTextUnreadCounts() {
    return this.textConversations.reduce((a, b) => {
      if (b.owner) {
        return a + b.unreadCounts;
      }
      return a;
    }, 0);
  }

  @state
  voicemailTranscriptions = [];

  @action
  addVoicemailTranscription({ id, text, messageId }) {
    let newData = this.voicemailTranscriptions.filter((item) => item.messageId !== messageId);
    newData = [{
      id,
      text,
      messageId,
    }].concat(newData);
    if (newData.length > 20) {
      newData = newData.slice(0, 20);
    }
    this.voicemailTranscriptions = newData;
  }

  @computed((that: MessageStore) => [that.voicemailTranscriptions])
  get voicemailTranscriptionMap() {
    return this.voicemailTranscriptions.reduce((map, item) => {
      map[item.messageId] = item;
      return map;
    }, {});
  }

  async fetchVoicemailTranscription(message) {
    if (!message || message.type !== messageTypes.voiceMail) {
      return;
    }
    if (
      message.vmTranscriptionStatus === 'InProgress' ||
      message.vmTranscriptionStatus === 'CompletedPartially'
    ) {
      this.addVoicemailTranscription({
        text: 'In progress',
        id: null,
        messageId: message.id
      });
      return;
    }
    if (message.vmTranscriptionStatus !== 'Completed') {
      return;
    }
    const existingTranscription = this.voicemailTranscriptionMap[message.id];
    if (existingTranscription && existingTranscription.id) {
      return;
    }
    const attachment = message.attachments?.find(
      (attachment) => attachment.type === 'AudioTranscription'
    );
    if (!attachment) {
      return;
    }
    let uri = attachment.uri;
    if (
      uri.indexOf('https://media.ringcentral.com/') !== 0 &&
      uri.indexOf('https://media.ringcentral.biz/') !== 0
    ) {
      return;
    }
    try {
      this.addVoicemailTranscription({
        text: 'Fetching transcription',
        id: null,
        messageId: message.id
      });
      const platform = this._deps.client.service.platform();
      const response = await platform.get(uri);
      const transcription = await response.text();
      this.addVoicemailTranscription({
        text: transcription,
        id: attachment.id,
        messageId: message.id
      });
    } catch (e) {
      console.error(e);
      this.addVoicemailTranscription({
        text: 'Failed to fetch transcription',
        id: null,
        messageId: message.id
      });
    }
  }
}
