import { Module } from '@ringcentral-integration/commons/lib/di';
import {
  action,
  state,
  computed,
} from '@ringcentral-integration/core';
import {
  MessageStore as MessageStoreBase,
} from '@ringcentral-integration/commons/modules/MessageStore';
import messageTypes from '@ringcentral-integration/commons/enums/messageTypes';
import messageDirection from '@ringcentral-integration/commons/enums/messageDirection';

// reference: https://developers.ringcentral.com/api-reference/Message-Store/syncMessages
const INVALID_TOKEN_ERROR_CODES = ['CMN-101', 'MSG-333'];

@Module({
  name: 'MessageStore',
  deps: [],
})
export class MessageStore extends MessageStoreBase {
  // TODO: fix sync token error issue
  override async _syncData({ dateTo = null as Date, passive = false } = {}) {
    const conversationsLoadLength = this._conversationsLoadLength;
    const conversationLoadLength = this._conversationLoadLength;
    const { ownerId } = this._deps.auth;
    try {
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - this._daySpan);
      let syncToken = dateTo ? null : this.syncInfo?.syncToken;
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
