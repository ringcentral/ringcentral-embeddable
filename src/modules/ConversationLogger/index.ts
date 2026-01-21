import { Module } from '@ringcentral-integration/commons/lib/di';
import {
  ConversationLogger as ConversationLoggerBase,
} from '@ringcentral-integration/commons/modules/ConversationLogger';
import type {
  ConversationLogMap,
} from '@ringcentral-integration/commons/modules/ConversationLogger/ConversationLogger.interface';
import { computed } from '@ringcentral-integration/core';
import { sortByDate, getNumbersFromMessage } from '@ringcentral-integration/commons/lib/messageHelper';
import type { Correspondent } from '@ringcentral-integration/commons/lib/messageHelper';

@Module({
  deps: [
    'ThirdPartyService',
    'MessageThreads',
    'MessageThreadEntries',
    'SmsTypingTimeTracker',
  ],
})
export class ConversationLogger extends ConversationLoggerBase {
  protected _threadUpdatedTimeout: NodeJS.Timeout | null = null;
  protected _lastProcessedConversations: ConversationLogMap | null = null;

  constructor(deps) {
    super(deps);
    if (this._deps.conversationLoggerOptions.autoLog) {
      this._autoLog = true;
    }
    this._logFunction = async (data) => {
      await this._doLog(data);
    };
    this._accordWithLogRequirement = (conversation) => {
      if (conversation.type === 'Thread') {
        // thread only have a date, so it should be logged every time
        return true;
      }
      const today = this._formatDateTime({
        type: 'date',
        utcTimestamp: new Date(),
      });
      return today === conversation.date;
    };

    this._deps.messageThreadEntries.onEntityUpdated((entity) => {
      if (this._threadUpdatedTimeout) {
        clearTimeout(this._threadUpdatedTimeout);
      }
      this._threadUpdatedTimeout = setTimeout(() => {
        this._processConversationLogMap();
      }, 2000);
    });
    this._deps.messageThreads.onThreadUpdated((thread) => {
      if (this._threadUpdatedTimeout) {
        clearTimeout(this._threadUpdatedTimeout);
      }
      this._threadUpdatedTimeout = setTimeout(() => {
        this._processConversationLogMap();
      }, 2000);
    });
  }

  override async onInit() {
    if (super.onInit) {
      await super.onInit();
    }
    if (
      this.autoLogReadOnly &&
      this._deps.thirdPartyService.messageLoggerAutoSettingReadOnlyValue !== null &&
      this._deps.thirdPartyService.messageLoggerAutoSettingReadOnlyValue !== this._autoLog
    ) {
      this._setAutoLog(this._deps.thirdPartyService.messageLoggerAutoSettingReadOnlyValue);
    }
  }

  async _doLog(conversation) {
    return this._deps.thirdPartyService.logConversation(conversation);
  }

  get logButtonTitle() {
    return this._deps.thirdPartyService.messageLoggerTitle;
  }

  get loggerSourceReady() {
    return this._deps.thirdPartyService.messageLoggerRegistered;
  }

  override _processConversationLogMap() {
    if (this.ready && this._lastAutoLog !== this.autoLog) {
      this._lastAutoLog = this.autoLog;
      if (this.autoLog) {
        // force conversation log checking when switch auto log to on
        this._lastProcessedConversations = null;
      }
    }
    if (
      this.ready &&
      this._lastProcessedConversations !== this.conversationLogMap
    ) {
      this._deps.conversationMatcher.triggerMatch();
      this._deps.contactMatcher.triggerMatch();
      const oldMap = this._lastProcessedConversations || {};
      this._lastProcessedConversations = this.conversationLogMap;
      if (!this._deps.tabManager || this._deps.tabManager.active) {
        Object.keys(this._lastProcessedConversations).forEach(
          (conversationId) => {
            Object.keys(
              this._lastProcessedConversations![conversationId],
            ).forEach((date) => {
              const conversation =
                this._lastProcessedConversations![conversationId][date];
              if (
                !oldMap[conversationId] ||
                !oldMap[conversationId][date] ||
                conversation.messages[0].id !==
                  oldMap[conversationId][date].messages[0].id ||
                (conversation.type === 'Thread' && (
                  conversation.lastModifiedTime > oldMap[conversationId][date].lastModifiedTime ||
                  conversation.entities.length !== oldMap[conversationId][date].entities.length ||
                  conversation.entities[conversation.entities.length -1]?.lastModifiedTime > oldMap[conversationId][date].entities[oldMap[conversationId][date].entities[length -1]]?.lastModifiedTime
                ))
              ) {
                if (this.accordWithProcessLogRequirement(conversation)) {
                  this._queueAutoLogConversation({
                    conversation,
                  });
                }
              }
            });
          },
        );
      }
    }
  }

  // overwrite super to support voicemail and fax
  override async _processConversationLog({
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

  override async logConversation({
    triggerType = 'auto',
    ...options
  } = {}) {
    return super.logConversation({ ...options, triggerType });
  }

  override async log({
    conversation,
    ...options
  }) {
    if (!this.ready) {
      throw new Error(`${this.constructor.name}.log: module is not ready.`);
    }
    if (!conversation) {
      throw new Error(
        `${this.constructor.name}.log: options.conversation is undefined.`,
      );
    }
    await this._log({ item: conversation, ...options });
  }

  @computed((that: ConversationLogger) => [
    that._deps.messageStore.conversationStore,
    that._deps.extensionInfo.extensionNumber,
    that._deps.conversationMatcher.dataMapping,
    that._deps.messageThreads.threads,
  ])
  get conversationLogMap() {
    const { conversationStore } = this._deps.messageStore;
    const extensionNumber = this._deps.extensionInfo.extensionNumber!;
    const conversationLogMapping =
      this._deps.conversationMatcher.dataMapping ?? {};
    const messages = Object.values(conversationStore).reduce(
      (allMessages, messages) => [...allMessages, ...messages],
      [],
    );
    const mapping: ConversationLogMap = {};
    messages
      .slice()
      .sort(sortByDate)
      .forEach((message) => {
        const conversationId = message.conversationId!;
        const date = this._formatDateTime({
          type: 'date',
          utcTimestamp: message.creationTime,
        })!;

        if (!mapping[conversationId]) {
          mapping[conversationId] = {};
        }

        if (!mapping[conversationId][date]) {
          const conversationLogId = this.getConversationLogId(message)!;

          mapping[conversationId][date] = {
            conversationLogId,
            conversationId,
            creationTime: message.creationTime!, // for sorting
            date,
            type: message.type,
            messages: [],
            conversationLogMatches:
              conversationLogMapping[conversationLogId] || [],
            // The reason for passing extensionNumber here is to filter the correspondence in the group conversation(type paper, and Only it has extensionNumber) that contains its own information.
            ...getNumbersFromMessage({ extensionNumber, message }),
          };
        }
        const typingTime = this._deps.smsTypingTimeTracker.getTypingTime(message.id);
        let messageWithTypingTime = message;
        if (typeof typingTime === 'number') {
          messageWithTypingTime = {
            ...message,
            typingDurationMs: typingTime,
          };
        }
        mapping[conversationId][date].messages.push(messageWithTypingTime);
      });
    this._deps.messageThreads.threads.forEach((thread) => {
      const conversationId = thread.id;
      if (!mapping[conversationId]) {
        mapping[conversationId] = {};
      }
      const date = this._formatDateTime({
        type: 'date',
        utcTimestamp: thread.creationTime,
      });
      thread.messages.forEach((message) => {
        if (!mapping[conversationId][date]) {
          const conversationLogId = this.getMessageThreadLogId(thread);
          mapping[conversationId][date] = {
            conversationLogId,
            conversationId,
            creationTime: thread.creationTime,
            date,
            type: 'Thread',
            messages: [],
            entities: [],
            conversationLogMatches:
              conversationLogMapping[conversationLogId] || [],
            self: thread.ownerParty,
            correspondents: [thread.guestParty],
            status: thread.status,
            statusReason: thread.statusReason,
            assignee: thread.assignee,
            owner: thread.owner,
            guestParty: thread.guestParty,
            ownerParty: thread.ownerParty,
            lastModifiedTime: thread.lastModifiedTime,
            isAssignedToMe: thread.isAssignedToMe,
            label: thread.label,
          };
        }
        const typingTime = this._deps.smsTypingTimeTracker.getTypingTime(message.id);
        let messageWithTypingTime = message;
        if (typeof typingTime === 'number') {
          messageWithTypingTime = {
            ...message,
            typingDurationMs: typingTime,
          };
        }
        mapping[conversationId][date].entities.push(messageWithTypingTime);
        if (message.recordType === 'AliveMessage') {
          mapping[conversationId][date].messages.push(messageWithTypingTime);
        }
      });
    });
    return mapping;
  }

  getMessageThreadLogId(thread) {
    if (!thread) {
      return;
    }
    return thread.id;
  }

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

  get autoLogReadOnly() {
    return this._deps.thirdPartyService.messageLoggerAutoSettingReadOnly;
  }

  get autoLogReadOnlyReason() {
    return this._deps.thirdPartyService.messageLoggerAutoSettingReadOnlyReason;
  }
}
