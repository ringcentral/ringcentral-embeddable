import { createSelector } from 'reselect';

import RcModule from 'ringcentral-integration/lib/RcModule';
import { Module } from 'ringcentral-integration/lib/di';
import getter from 'ringcentral-integration/lib/getter';
import ensureExist from 'ringcentral-integration/lib/ensureExist';
import proxify from 'ringcentral-integration/lib/proxy/proxify';
import messageTypes from 'ringcentral-integration/enums/messageTypes';
import cleanNumber from 'ringcentral-integration/lib/cleanNumber';
import messageSenderMessages from 'ringcentral-integration/modules/MessageSender/messageSenderMessages';

import {
  getNumbersFromMessage,
  sortSearchResults,
  messageIsTextMessage,
  messageIsVoicemail,
  getVoicemailAttachment,
  getFaxAttachment,
  messageIsFax,
  getMyNumberFromMessage,
  getRecipientNumbersFromMessage,
} from 'ringcentral-integration/lib/messageHelper';

import actionTypes from './actionTypes';
import getReducer from './getReducer';
import status from './status';

function getEarliestTime(messages) {
  let newTime = Date.now();
  messages.forEach((message) => {
    const creationTime = (new Date(message.creationTime)).getTime();
    if (creationTime < newTime) {
      newTime = creationTime;
    }
  });
  return newTime;
}

const DEFAULT_PER_PAGE = 20;
const DEFAULT_DAY_SPAN = 90;

@Module({
  deps: [
    'Alert',
    'Auth',
    'Client',
    'MessageSender',
    'ExtensionInfo',
    'NewMessageStore',
    'RolesAndPermissions',
    { dep: 'ContactMatcher', optional: true },
    { dep: 'ConversationLogger', optional: true },
    { dep: 'ConversationsOptions', optional: true }
  ],
})
export default class Conversations extends RcModule {
  constructor({
    alert,
    auth,
    client,
    messageSender,
    extensionInfo,
    newMessageStore,
    rolesAndPermissions,
    contactMatcher,
    conversationLogger,
    perPage = DEFAULT_PER_PAGE,
    daySpan = DEFAULT_DAY_SPAN,
    ...options
  }) {
    super({
      ...options,
      actionTypes,
    });
    this._auth = this::ensureExist(auth, 'auth');
    this._alert = this::ensureExist(alert, 'alert');
    this._client = this::ensureExist(client, 'client');
    this._messageSender = this::ensureExist(messageSender, 'messageSender');
    this._extensionInfo = this::ensureExist(extensionInfo, 'extensionInfo');
    this._messageStore = this::ensureExist(newMessageStore, 'messageStore');
    this._rolesAndPermissions =
      this::ensureExist(rolesAndPermissions, 'rolesAndPermissions');
    this._contactMatcher = contactMatcher;
    this._conversationLogger = conversationLogger;

    this._reducer = getReducer(this.actionTypes);

    this._promise = null;
    this._lastProcessedNumbers = null;
    this._perPage = perPage;
    this._daySpan = daySpan;
    this._olderDataExsited = true;
    this._olderMessagesExsited = true;

    if (this._contactMatcher) {
      this._contactMatcher.addQuerySource({
        getQueriesFn: () => this.uniqueNumbers,
        readyCheckFn: () => (
          this._messageStore.ready
        ),
      });
    }
  }

  initialize() {
    this.store.subscribe(() => this._onStateChange());
  }

  _onStateChange() {
    if (this._shouldInit()) {
      this._init();
    } else if (this._shouldReset()) {
      this._reset();
    }
  }

  _shouldInit() {
    return (
      this._auth.loggedIn &&
      this._extensionInfo.ready &&
      this._messageSender.ready &&
      this._messageStore.ready &&
      this._rolesAndPermissions.ready &&
      (!this._contactMatcher || this._contactMatcher.ready) &&
      (!this._conversationLogger || this._conversationLogger.ready) &&
      this.pending
    );
  }

  _shouldReset() {
    return (
      (
        !this._auth.loggedIn ||
        !this._extensionInfo.ready ||
        !this._messageSender.ready ||
        !this._rolesAndPermissions ||
        !this._messageStore.ready ||
        (this._contactMatcher && !this._contactMatcher.ready) ||
        (this._conversationLogger && !this._conversationLogger.ready)
      ) &&
      this.ready
    );
  }

  _init() {
    this.store.dispatch({
      type: this.actionTypes.init,
    });
    if (this._contactMatcher) {
      this._contactMatcher.triggerMatch();
    }
    this.store.dispatch({
      type: this.actionTypes.initSuccess,
    });
    if (this.allConversations.length <= this._perPage) {
      this.fetchOldConversations();
    }
  }

  _reset() {
    this._lastProcessedNumbers = null;
    this._olderDataExsited = true;
    this._olderMessagesExsited = true;
    this.store.dispatch({
      type: this.actionTypes.resetSuccess,
    });
  }

  @proxify
  async updateSearchInput(input) {
    this.store.dispatch({
      type: this.actionTypes.updateSearchInput,
      input,
    });
  }

  @proxify
  async updateTypeFilter(type) {
    if (this.typeFilter === type) {
      return;
    }
    this.store.dispatch({
      type: this.actionTypes.updateTypeFilter,
      typeFilter: type,
    });
    this._olderDataExsited = true;
    this._olderMessagesExsited = true;
    if (this.allConversations.length <= this._perPage) {
      this.fetchOldConversations();
    }
  }

  @proxify
  async fetchOldConversations() {
    if (!this._olderDataExsited) {
      return;
    }
    if (this.loadingOldConversations) {
      return;
    }
    this.store.dispatch({
      type: this.actionTypes.fetchOldConverstaions,
    });
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - this._daySpan);
    const dateTo = new Date(this.earliestTime);
    if (dateTo.getTime() < dateFrom.getTime()) {
      dateFrom.setDate(dateFrom.getDate() - 1);
    }
    const typeFilter = this.typeFilter;
    const currentPage = this.currentPage;
    const params = {
      distinctConversations: true,
      perPage: this._perPage,
      dateFrom: dateFrom.toISOString(),
      dateTo: dateTo.toISOString(),
    };
    if (typeFilter === messageTypes.text) {
      params.messageType = [messageTypes.sms, messageTypes.pager];
    } else if (typeFilter && typeFilter !== '' && typeFilter !== messageTypes.all) {
      params.messageType = typeFilter;
    }
    try {
      const { records } = await this._client
        .account()
        .extension()
        .messageStore()
        .list(params);
      this._olderDataExsited = records.length === this._perPage;
      if (typeFilter === this.typeFilter && currentPage === this.currentPage) {
        this.store.dispatch({
          type: this.actionTypes.fetchOldConverstaionsSuccess,
          records,
        });
      }
    } catch (e) {
      if (typeFilter === this.typeFilter && currentPage === this.currentPage) {
        this.store.dispatch({
          type: this.actionTypes.fetchOldConverstaionsError
        });
      }
    }
  }

  @proxify
  async loadConversation(conversationId) {
    if (conversationId === this.currentConversationId) {
      return;
    }
    this.store.dispatch({
      type: this.actionTypes.updateCurrentConversationId,
      conversationId,
    });
  }

  @proxify
  async unloadConversation() {
    this.store.dispatch({
      type: this.actionTypes.updateCurrentConversationId,
      conversationId: null,
    });
    this._olderMessagesExsited = true;
  }

  @proxify
  async fetchOldMessages(perPage = this._perPage) {
    if (!this._olderMessagesExsited) {
      return;
    }
    if (this.loadingOldMessages) {
      return;
    }
    if (!this.currentConversationId) {
      return;
    }
    this.store.dispatch({
      type: this.actionTypes.fetchOldMessages,
    });
    const conversationId = this.currentConversationId;
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - this._daySpan);
    const earliestTime = getEarliestTime(this.currentConversation.messages);
    const dateTo = new Date(earliestTime);
    if (dateTo.getTime() < dateFrom.getTime()) {
      dateFrom.setDate(dateFrom.getDate() - 1);
    }
    const params = {
      conversationId,
      perPage,
      dateFrom: dateFrom.toISOString(),
      dateTo: dateTo.toISOString(),
    };
    try {
      const { records } = await this._client
        .account()
        .extension()
        .messageStore()
        .list(params);
      this._olderMessagesExsited = records.length === perPage;
      if (conversationId === this.currentConversationId) {
        this.store.dispatch({
          type: this.actionTypes.fetchOldMessagesSuccess,
          records,
        });
      }
    } catch (e) {
      if (conversationId === this.currentConversationId) {
        this.store.dispatch({
          type: this.actionTypes.fetchOldMessagesError
        });
      }
    }
  }

  _alertWarning(message) {
    if (message) {
      const ttlConfig =
        message !== messageSenderMessages.noAreaCode ? { ttl: 0 } : null;
      this._alert.warning({
        message,
        ...ttlConfig,
      });
      return true;
    }
    return false;
  }

  @proxify
  async updateMessageText(text) {
    if (text.length > 1000) {
      return this._alertWarning(messageSenderMessages.textTooLong);
    }
    return this.store.dispatch({
      type: this.actionTypes.updateMessageText,
      text,
      conversationId: this.currentConversationId,
    });
  }

  @proxify
  async replyToReceivers(text) {
    this.store.dispatch({
      type: this.actionTypes.reply,
    });
    try {
      const responses = await this._messageSender.send({
        fromNumber: this._getFromNumber(),
        toNumbers: this._getToNumbers(),
        text,
        replyOnMessageId: this._getReplyOnMessageId(),
      });
      if (responses && responses[0]) {
        this._messageStore.pushMessage(responses[0]);
        this.store.dispatch({
          type: this.actionTypes.replySuccess,
        });
        this.store.dispatch({
          type: this.actionTypes.removeMessageText,
          conversationId: this.currentConversationId,
        });
        return responses[0];
      }
      this._onReplyError();
      return null;
    } catch (error) {
      this._onReplyError();
      throw error;
    }
  }

  _getReplyOnMessageId() {
    const messageList = this.currentConversation.messages;
    const lastMessage =
      messageList &&
      messageList.length > 0 &&
      messageList[messageList.length - 1];
    if (lastMessage && lastMessage.id) {
      return lastMessage.id;
    }
    return null;
  }

  _getFromNumber() {
    const senderNumber = this.currentConversation.senderNumber;
    if (!senderNumber) {
      return null;
    }
    return senderNumber.extensionNumber || senderNumber.phoneNumber;
  }

  _getToNumbers() {
    const recipients = this.currentConversation.recipients;
    return recipients.map(
      recipient => recipient.extensionNumber || recipient.phoneNumber,
    );
  }

  @getter
  allConversations = createSelector(
    () => this._messageStore.allConversations,
    () => this.oldConversations,
    (conversations, oldConversations) =>
      [].concat(conversations).concat(oldConversations)
  )

  @getter
  uniqueNumbers = createSelector(
    () => this.allConversations,
    (conversations) => {
      const output = [];
      const numberMap = {};
      function addIfNotExist(number) {
        if (number && !numberMap[number]) {
          output.push(number);
          numberMap[number] = true;
        }
      }
      conversations.forEach((message) => {
        if (message.from) {
          const fromNumber = message.from.phoneNumber || message.from.extensionNumber;
          addIfNotExist(fromNumber);
        }
        if (message.to && message.to.length > 0) {
          message.to.forEach((toNumber) => {
            if (!toNumber) {
              return;
            }
            const toPhoneNumber = toNumber.phoneNumber || toNumber.extensionNumber;
            addIfNotExist(toPhoneNumber);
          });
        }
      });
      return output;
    }
  )

  @getter
  effectiveSearchString = createSelector(
    () => this.state.searchInput,
    (input) => {
      if (input.length >= 3) return input;
      return '';
    }
  )

  @getter
  typeFilteredConversations = createSelector(
    () => this.allConversations,
    () => this.typeFilter,
    (allConversations, typeFilter) => {
      switch (typeFilter) {
        case messageTypes.text:
          return this._messageStore.textConversations;
        case messageTypes.voiceMail:
          return this._messageStore.voicemailMessages;
        case messageTypes.fax:
          return this._messageStore.faxMessages;
        default:
          return allConversations.filter(
            conversation => (
              (
                this._rolesAndPermissions.readTextPermissions ||
                !messageIsTextMessage(conversation)
              ) &&
              (
                this._rolesAndPermissions.voicemailPermissions ||
                !messageIsVoicemail(conversation)
              ) &&
              (
                this._rolesAndPermissions.readFaxPermissions ||
                !messageIsFax(conversation)
              )
            )
          );
      }
    }
  );

  @getter
  formatedConversations = createSelector(
    () => this.typeFilteredConversations,
    () => this._extensionInfo.extensionNumber,
    () => this._contactMatcher && this._contactMatcher.dataMapping,
    () => this._conversationLogger && this._conversationLogger.loggingMap,
    () => this._conversationLogger && this._conversationLogger.dataMapping,
    () => this._auth.accessToken,
    (
      conversations,
      extensionNumber,
      contactMapping = {},
      loggingMap = {},
      conversationLogMapping = {},
      accessToken,
    ) => (
      conversations.map((message) => {
        const {
          self,
          correspondents,
        } = getNumbersFromMessage({ extensionNumber, message });
        const selfNumber = self && (self.phoneNumber || self.extensionNumber);
        const selfMatches = (selfNumber && contactMapping[selfNumber]) || [];
        const correspondentMatches = correspondents.reduce((matches, contact) => {
          const number = contact && (contact.phoneNumber || contact.extensionNumber);
          return number && contactMapping[number] && contactMapping[number].length ?
            matches.concat(contactMapping[number]) :
            matches;
        }, []);
        const conversationLogId = this._conversationLogger ?
          this._conversationLogger.getConversationLogId(message) :
          null;
        const isLogging = !!(conversationLogId && loggingMap[conversationLogId]);
        const conversationMatches = conversationLogMapping[conversationLogId] || [];
        let voicemailAttachment = null;
        if (messageIsVoicemail(message)) {
          voicemailAttachment = getVoicemailAttachment(message, accessToken);
        }
        let faxAttachment = null;
        if (messageIsFax(message)) {
          faxAttachment = getFaxAttachment(message, accessToken);
        }
        return {
          ...message,
          self,
          selfMatches,
          correspondents,
          correspondentMatches,
          conversationLogId,
          isLogging,
          conversationMatches,
          voicemailAttachment,
          faxAttachment,
          lastMatchedCorrespondentEntity: (
            this._conversationLogger &&
              this._conversationLogger.getLastMatchedCorrespondentEntity(message)
          ) || null,
        };
      })
    ),
  )

  @getter
  filteredConversations = createSelector(
    () => this.formatedConversations,
    () => this.effectiveSearchString,
    (conversations, effectiveSearchString) => {
      if (effectiveSearchString === '') {
        return conversations;
      }
      const searchResults = [];
      const cleanRegex = /[^\d*+#\s]/g;
      const searchString = effectiveSearchString.toLowerCase();
      const searchNumber = effectiveSearchString.replace(cleanRegex, '');
      conversations.forEach((message) => {
        if (searchNumber === effectiveSearchString) {
          const cleanedNumber = cleanNumber(effectiveSearchString);
          if (
            message.correspondents.find(
              contact => (
                cleanNumber(contact.phoneNumber || contact.extensionNumber || '')
                  .indexOf(cleanedNumber) > -1
              )
            )
          ) {
            // match by phoneNumber or extensionNumber
            searchResults.push({
              ...message,
              matchOrder: 0,
            });
            return;
          }
        }
        if (message.correspondentMatches.length) {
          if (
            message.correspondentMatches.find(entity => (
              (entity.name || '').toLowerCase().indexOf(searchString) > -1
            ))
          ) {
            // match by entity's name
            searchResults.push({
              ...message,
              matchOrder: 0,
            });
            return;
          }
        } else if (message.correspondents.find(contact => (
          (contact.name || '').toLowerCase().indexOf(searchString) > -1
        ))) {
          searchResults.push({
            ...message,
            matchOrder: 0,
          });
          return;
        }

        // try match messages of the same conversation
        if ((message.subject || '').toLowerCase().indexOf(searchString) > -1) {
          searchResults.push({
            ...message,
            matchOrder: 1,
          });
          return;
        }
        const messageList = this._messageStore.conversationStore[message.conversationId] || [];
        const matchedMessage = messageList.find(item => (
          (item.subject || '').toLowerCase().indexOf(searchString) > -1
        ));
        if (matchedMessage) {
          searchResults.push({
            ...message,
            matchedMessage,
            matchOrder: 1,
          });
        }
      });
      return searchResults.sort(sortSearchResults);
    },
  )

  @getter
  earliestTime = createSelector(
    () => this.typeFilteredConversations,
    getEarliestTime,
  )

  @getter
  currentConversation = createSelector(
    () => this.currentConversationId,
    () => this.oldMessages,
    () => this._messageStore.conversationStore,
    () => this.formatedConversations,
    (conversationId, oldMessages, conversationStore, conversations) => {
      const conversation = conversations.find(
        c => c.conversationId === conversationId
      );
      const messages = [].concat(conversationStore[conversationId] || []);
      const currentConversation = {
        ...conversation
      };
      const allMessages = messages.concat(oldMessages).slice();
      currentConversation.messages = allMessages.reverse();
      currentConversation.senderNumber = getMyNumberFromMessage({
        message: conversation,
        myExtensionNumber: this._extensionInfo.extensionNumber,
      });
      currentConversation.recipients = getRecipientNumbersFromMessage({
        message: conversation,
        myNumber: currentConversation.senderNumber,
      });
      return currentConversation;
    }
  )

  @getter
  messageText = createSelector(
    () => this.state.messageTexts,
    () => this.currentConversationId,
    (messageTexts, conversationId) => {
      const res = messageTexts.find(
        msg => typeof msg === 'object' && msg.conversationId === conversationId,
      );
      return res ? res.text : '';
    },
  );

  get status() {
    return this.state.status;
  }

  get searchInput() {
    return this.state.searchInput;
  }

  get typeFilter() {
    return this.state.typeFilter;
  }

  get currentPage() {
    return this.state.currentPage;
  }

  get oldConversations() {
    return this.state.oldConversations;
  }

  get fetchConversationsStatus() {
    return this.state.fetchConversationsStatus;
  }

  get currentConversationId() {
    return this.state.currentConversationId;
  }

  get fetchMessagesStatus() {
    return this.state.fetchMessagesStatus;
  }

  get oldMessages() {
    return this.state.oldMessages;
  }

  get loadingOldConversations() {
    return this.fetchConversationsStatus === status.fetching;
  }

  get loadingOldMessages() {
    return this.fetchMessagesStatus === status.fetching;
  }

  get pushing() {
    return this.state.conversationStatus === status.pushing;
  }
}
