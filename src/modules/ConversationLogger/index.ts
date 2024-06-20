import { Module } from '@ringcentral-integration/commons/lib/di';
import {
  ConversationLogger as ConversationLoggerBase,
} from '@ringcentral-integration/commons/modules/ConversationLogger';
import { computed } from '@ringcentral-integration/core';
import type { Correspondent } from '@ringcentral-integration/commons/lib/messageHelper';

const getCurrentDateTimeStamp = () => {
  let today = new Date();
  let dd = today.getDate();
  let mm = today.getMonth() + 1;
  const yyyy = today.getFullYear();
  let ddString = dd.toString();
  let mmString = mm.toString();
  if (dd < 10) {
    ddString = `0${dd}`;
  }
  if (mm < 10) {
    mmString = `0${mm}`;
  }
  const todayString = `${mmString}/${ddString}/${yyyy}`;
  return new Date(todayString).getTime();
};

@Module({
  deps: [
    'ThirdPartyService'
  ],
})
export class ConversationLogger extends ConversationLoggerBase {
  constructor(deps) {
    super(deps);
    if (this._deps.conversationLoggerOptions.autoLog) {
      this._autoLog = true;
    }
    this._logFunction = async (data) => {
      await this._doLog(data);
    };
    this._accordWithLogRequirement = (conversation) => {
      const { date } = conversation;
      const dateTimeStamp = new Date(date).getTime();
      const currentDateTimeStamp = getCurrentDateTimeStamp();
      return currentDateTimeStamp === dateTimeStamp;
    };
  }

  async _doLog(conversation) {
    this._deps.thirdPartyService.logConversation(conversation);
  }

  get logButtonTitle() {
    return this._deps.thirdPartyService.messageLoggerTitle;
  }

  get loggerSourceReady() {
    return this._deps.thirdPartyService.messageLoggerRegistered;
  }

  // overwrite super to support voicemail and fax
  async _processConversationLog({
    conversation,
  }) {
    // await this._deps.conversationMatcher.triggerMatch();
    await this._deps.conversationMatcher.match({
      queries: [conversation.conversationLogId],
    });
    if (
      this._isAutoUpdate &&
      this._deps.conversationMatcher.dataMapping[
        conversation.conversationLogId
      ] &&
      this._deps.conversationMatcher.dataMapping[conversation.conversationLogId]
        .length
    ) {
      // update conversation
      await this._autoLogConversation({
        conversation,
      });
    } else if (this.autoLog) { // override here for voicemail and fax support
      // new entry
      const numbers: string[] = [];
      const numberMap: Record<string, boolean> = {};
      /* eslint { "no-inner-declarations": 0 } */
      function addIfNotExist(contact) {
        if (!contact) {
          return;
        }
        const number = contact.phoneNumber || contact.extensionNumber;
        if (number && !numberMap[number]) {
          numbers.push(number);
          numberMap[number] = true;
        }
      }
      addIfNotExist(conversation.self!);
      conversation.correspondents!.forEach(addIfNotExist);
      await this._deps.contactMatcher.match({ queries: numbers });
      const selfNumber =
        conversation.self &&
        (conversation.self.phoneNumber || conversation.self.extensionNumber);
      const selfMatches =
        (selfNumber && this._deps.contactMatcher.dataMapping[selfNumber]) || [];
      const correspondentMatches = this._getCorrespondentMatches(conversation);

      const selfEntity =
        (selfMatches && selfMatches.length === 1 && selfMatches[0]) || null;

      let correspondentEntity =
        this.getLastMatchedCorrespondentEntity(conversation);

      correspondentEntity =
        correspondentEntity ||
        (correspondentMatches &&
          correspondentMatches.length === 1 &&
          correspondentMatches[0]) ||
        null;
      await this._autoLogConversation({
        conversation,
        selfEntity,
        correspondentEntity,
      });
    }
  }

  async _autoLogConversation({ conversation, selfEntity = null, correspondentEntity = null }) {
    await this.log({
      conversation,
      selfEntity,
      correspondentEntity,
      triggerType: 'auto',
    });
  }

  async logConversation({
    triggerType = 'auto',
    ...options
  } = {}) {
    super.logConversation({ ...options, triggerType });
  }

  // @selector
  // conversationLogMap = [
  //   () => this._messageStore.conversationStore,
  //   () => this._extensionInfo.extensionNumber,
  //   () => this._conversationMatcher.dataMapping,
  //   (conversationStore, extensionNumber, conversationLogMapping = {}) => {
  //     const messages = Object.values(conversationStore)
  //       .reduce((allMessages, messages) => [...allMessages, ...messages], []);
  //     const mapping = {};
  //     messages.slice().sort(sortByDate)
  //       .forEach((message) => {
  //         const { conversationId } = message;
  //         const date = this._formatDateTime({
  //           type: 'date',
  //           utcTimestamp: message.creationTime,
  //         });
  //         if (!mapping[conversationId]) {
  //           mapping[conversationId] = {};
  //         }
  //         if (!mapping[conversationId][date]) {
  //           const conversationLogId = getLogId({ conversationId, date });
  //           mapping[conversationId][date] = {
  //             conversationLogId,
  //             conversationId,
  //             creationTime: message.creationTime, // for sorting
  //             date,
  //             type: message.type,
  //             messages: [],
  //             conversationLogMatches: conversationLogMapping[conversationLogId] || [],
  //             ...getNumbersFromMessage({ extensionNumber, message }),
  //           };
  //         }
  //         mapping[conversationId][date].messages.push(message);
  //       });
  //     return mapping;
  //   },
  // ]

  // getConversationLogId(message) {
  //   if (!message) {
  //     return;
  //   }
  //   if (!message.creationTime) {
  //     return null;
  //   }
  //   const { conversationId } = message;
  //   let date = null;
  //   try {
  //     date = this._formatDateTime({
  //       type: 'date',
  //       utcTimestamp: message.creationTime,
  //     });
  //   } catch (e) {
  //     // ignore error
  //   }
  //   return getLogId({
  //     conversationId,
  //     date,
  //   });
  // }

  @computed((that: ConversationLogger) => [that.conversationLogMap])
  get uniqueNumbers() {
    const output: string[] = [];
    const numberMap: Record<string, boolean> = {};
    function addIfNotExist(contact: Correspondent = {}) {
      if (!contact) {
        return;
      }
      const number = contact.phoneNumber || contact.extensionNumber;
      if (number && !numberMap[number]) {
        output.push(number);
        numberMap[number] = true;
      }
    }
    Object.keys(this.conversationLogMap).forEach((conversationId) => {
      Object.keys(this.conversationLogMap[conversationId]).forEach((date) => {
        const conversation = this.conversationLogMap[conversationId][date];
        addIfNotExist(conversation.self);
        conversation.correspondents!.forEach(addIfNotExist);
      });
    });
    return output;
  }
}
