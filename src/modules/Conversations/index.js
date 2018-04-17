import { createSelector } from 'reselect';

import RcModule from 'ringcentral-integration/lib/RcModule';
import { Module } from 'ringcentral-integration/lib/di';
import getter from 'ringcentral-integration/lib/getter';
import ensureExist from 'ringcentral-integration/lib/ensureExist';
import proxify from 'ringcentral-integration/lib/proxy/proxify';
import messageTypes from 'ringcentral-integration/enums/messageTypes';
import cleanNumber from 'ringcentral-integration/lib/cleanNumber';

import {
  getNumbersFromMessage,
  sortSearchResults,
  messageIsTextMessage,
  messageIsVoicemail,
  getVoicemailAttachment,
  getFaxAttachment,
  messageIsFax,
} from 'ringcentral-integration/lib/messageHelper';

import actionTypes from './actionTypes';
import getReducer from './getReducer';

@Module({
  deps: [
    'Alert',
    'Auth',
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
    messageSender,
    extensionInfo,
    newMessageStore,
    rolesAndPermissions,
    contactMatcher,
    conversationLogger,
    ...options
  }) {
    super({
      ...options,
      actionTypes,
    });
    this._auth = this::ensureExist(auth, 'auth');
    this._alert = this::ensureExist(alert, 'alert');
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
      !this.pending
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
  }

  _reset() {
    this._lastProcessedNumbers = null;
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
    this.store.dispatch({
      type: this.actionTypes.updateTypeFilter,
      typeFilter: type,
    });
  }

  @getter
  uniqueNumbers = createSelector(
    () => this._messageStore.allConversations,
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
    () => this._messageStore.allConversations,
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

  get status() {
    return this.state.status;
  }

  get searchInput() {
    return this.state.searchInput;
  }

  get typeFilter() {
    return this.state.typeFilter;
  }
}
