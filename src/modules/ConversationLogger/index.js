import { Module } from 'ringcentral-integration/lib/di';
import ConversationLoggerBase, { getLogId } from 'ringcentral-integration/modules/ConversationLogger';
import { selector } from 'ringcentral-integration/lib/selector';
import { getNumbersFromMessage, sortByDate } from 'ringcentral-integration/lib/messageHelper';

@Module({
  deps: [
    'ThirdPartyService'
  ],
})
export default class ConversationLogger extends ConversationLoggerBase {
  constructor({
    thirdPartyService,
    ...options
  }) {
    super({
      initialState: { autoLog: false },
      readyCheckFunction: () => true,
      logFunction: async (data) => { await this._doLog(data); },
      ...options,
    });
    this._thirdPartyService = thirdPartyService;
    this._formatDateTime = (...args) => {
      try {
        return this._dateTimeFormat.formatDateTime(...args);
      } catch (e) {
        console.error('format date error:');
        console.error('args');
        throw e;
      }
    };
  }

  async _doLog(conversation) {
    this._thirdPartyService.logConversation(conversation);
  }

  get logButtonTitle() {
    return this._thirdPartyService.messageLoggerTitle;
  }

  get loggerSourceReady() {
    return this._thirdPartyService.messageLoggerRegistered;
  }

  // overwrite super to support voicemail and fax
  async _processConversationLog({
    conversation,
  }) {
    // await this._conversationMatcher.triggerMatch();
    await this._conversationMatcher.match({ queries: [conversation.conversationLogId] });
    if (
      this._isAutoUpdate &&
      this._conversationMatcher.dataMapping[conversation.conversationLogId] &&
      this._conversationMatcher.dataMapping[conversation.conversationLogId].length
    ) {
      // update conversation
      await this._autoLogConversation({
        conversation,
      });
    } else if (this.autoLog) {
      // new entry
      const numbers = [];
      const numberMap = {};
      /* eslint { "no-inner-declarations": 0 } */
      function addIfNotExist(contact) {
        const number = contact.phoneNumber || contact.extensionNumber;
        if (number && !numberMap[number]) {
          numbers.push(number);
          numberMap[number] = true;
        }
      }
      addIfNotExist(conversation.self);
      conversation.correspondents.forEach(addIfNotExist);
      await this._contactMatcher.match({ queries: numbers });
      const selfNumber = conversation.self &&
        (conversation.self.phoneNumber || conversation.self.extensionNumber);
      const selfMatches = (selfNumber &&
        this._contactMatcher.dataMapping[conversation.self]) || [];
      const correspondentMatches = this._getCorrespondentMatches(conversation);

      const selfEntity = (selfMatches &&
        selfMatches.length === 1 &&
        selfMatches[0]) ||
        null;

      let correspondentEntity = this.getLastMatchedCorrespondentEntity(conversation);

      correspondentEntity = correspondentEntity ||
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

  async _autoLogConversation({ conversation, selfEntity, correspondentEntity }) {
    await this.log({
      conversation,
      selfEntity,
      correspondentEntity,
      triggerType: 'auto',
    });
  }

  async logConversation(options) {
    super.logConversation({ ...options, triggerType: 'manual' });
  }

  @selector
  conversationLogMap = [
    () => this._messageStore.conversationStore,
    () => this._extensionInfo.extensionNumber,
    () => this._conversationMatcher.dataMapping,
    (conversationStore, extensionNumber, conversationLogMapping = {}) => {
      const messages = Object.values(conversationStore)
        .reduce((allMessages, messages) => [...allMessages, ...messages], []);
      const mapping = {};
      messages.slice().sort(sortByDate)
        .forEach((message) => {
          const { conversationId } = message;
          const date = this._formatDateTime({
            type: 'date',
            utcTimestamp: message.creationTime,
          });
          if (!mapping[conversationId]) {
            mapping[conversationId] = {};
          }
          if (!mapping[conversationId][date]) {
            const conversationLogId = getLogId({ conversationId, date });
            mapping[conversationId][date] = {
              conversationLogId,
              conversationId,
              creationTime: message.creationTime, // for sorting
              date,
              type: message.type,
              messages: [],
              conversationLogMatches: conversationLogMapping[conversationLogId] || [],
              ...getNumbersFromMessage({ extensionNumber, message }),
            };
          }
          mapping[conversationId][date].messages.push(message);
        });
      return mapping;
    },
  ]

  getConversationLogId(message) {
    if (!message) {
      return;
    }
    if (!message.creationTime) {
      return null;
    }
    const { conversationId } = message;
    const date = this._formatDateTime({
      type: 'date',
      utcTimestamp: message.creationTime,
    });
    return getLogId({
      conversationId,
      date,
    });
  }
}
