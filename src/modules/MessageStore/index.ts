import { Module } from '@ringcentral-integration/commons/lib/di';
import {
  MessageStore as MessageStoreBase,
} from '@ringcentral-integration/commons/modules/MessageStore';

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
}
