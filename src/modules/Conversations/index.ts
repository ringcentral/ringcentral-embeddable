import { Module } from '@ringcentral-integration/commons/lib/di';
import { Conversations as ConversationsBase } from '@ringcentral-integration/commons/modules/Conversations';
import { conversationsStatus } from '@ringcentral-integration/commons/modules/Conversations/conversationsStatus';
import { messageTypes } from '@ringcentral-integration/commons/enums/messageTypes';
import { sortSearchResults } from '@ringcentral-integration/commons/lib/messageHelper';
import { action, state, computed } from '@ringcentral-integration/core';
import type GetMessageList from '@rc-ex/core/lib/definitions/GetMessageList';
import type ListMessagesParameters from '@rc-ex/core/lib/definitions/ListMessagesParameters';
import cleanNumber from '@ringcentral-integration/commons/lib/cleanNumber';

@Module({
  name: 'NewConversations',
  deps: [
    'MessageThreads',
    'MessageThreadEntries',
  ]
})
export class Conversations extends ConversationsBase {
  override async updateTypeFilter(type) {
    if (this.typeFilter === type) {
      return;
    }
    this._updateTypeFilter(type);
    this._setSearchFilter('All');
    this._updateFetchConversationsStatus(conversationsStatus.idle); // Fix keep loading issue
    this._olderDataExisted = true;
    this._olderMessagesExisted = true;
    if (this.pagingConversations.length <= this._perPage) {
      this.loadNextPage();
    }
  }

  override async unloadConversation() {
    await super.unloadConversation();
    this._updateFetchMessagesStatus(conversationsStatus.idle);
  }

  @action
  _setTypeFilter(type) {
    this.typeFilter = type;
  }

  setTypeFilterToAll() {
    this._setTypeFilter(messageTypes.all);
  }

  @state
  ownerFilter = 'Personal'; // Personal, Shared, Threads

  @action
  _setOwnerFilter(filter) {
    this.ownerFilter = filter;
    this.currentPage = 1;
  }

  updateOwnerFilter(filter) {
    if (filter === this.ownerFilter) {
      return;
    }
    this._setOwnerFilter(filter);
    if (filter === 'Threads') {
      this._deps.messageThreads.sync();
      this._deps.messageThreadEntries.sync();
    }
  }

  @state
  searchFilter = 'All';

  @action
  _setSearchFilter(type) {
    this.searchFilter = type;
  }

  updateSearchFilter(type) {
    const oldFilter = this.searchFilter;
    if (this.searchFilter === type) {
      return;
    }
    this._setSearchFilter(type);
    if (oldFilter === 'All' && type === 'UnLogged') {
      return;
    }
    // load more old data
    this._updateFetchConversationsStatus(conversationsStatus.idle); // Fix keep loading issue
    this._olderDataExisted = true;
    this._olderMessagesExisted = true;
    if (this.pagingConversations.length <= this._perPage) {
      this.loadNextPage();
    }
  }

  @computed((that: Conversations) => [
    that.filteredConversations,
    that.currentPage,
    that.searchFilter,
    that.ownerFilter,
    that.typeFilter,
    that.formattedMessageThreads,
  ])
  get pagingConversations() {
    const pageNumber = this.currentPage;
    const lastIndex = pageNumber * this._perPage;
    const isThreads = this.ownerFilter === 'Threads' && this.typeFilter === messageTypes.text;
    let searchFiltered = isThreads ? this.filteredMessageThreads : this.filteredConversations;
    if (this.searchFilter !== 'All') {
      searchFiltered = searchFiltered.filter((conversation) => {
        if (this.searchFilter === 'Unread') {
          return conversation.unreadCounts > 0;
        }
        if (this.searchFilter === 'UnLogged') {
          return (
            !conversation.conversationMatches ||
            conversation.conversationMatches.length === 0
          );
        }
        return true;
      });
    }
    if (isThreads) {
      searchFiltered = searchFiltered.filter((conversation) => {
        return conversation.status === 'Open';
      });
    }
    if (
      this.typeFilter === messageTypes.text &&
      this.hasSharedSmsAccess &&
      this.ownerFilter &&
      this.ownerFilter !== 'Threads'
    ) {
      searchFiltered = searchFiltered.filter((conversation) => {
        if (this.ownerFilter === 'Personal') {
          return !conversation.owner;
        }
        return !!conversation.owner;
      });
    }
    return searchFiltered.slice(0, lastIndex);
  }

  get hasSharedSmsAccess() {
    return this._deps.messageStore.hasSharedAccess && this._deps.messageStore.sharedSmsConversations.length > 0;
  }

  get hasMessageThreadsPermission() {
    return this._deps.messageThreads.hasPermission;
  }

  async fetchOldConversations() {
    if (!this._olderDataExisted) {
      return;
    }
    if (this.loadingOldConversations) {
      return;
    }
    if (this.ownerFilter === 'Threads') {
      return;
    }
    this._updateFetchConversationsStatus(conversationsStatus.fetching);
    let dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - this._daySpan);
    const dateTo = new Date(this.earliestTime);
    if (dateTo.getTime() < dateFrom.getTime()) {
      dateFrom = new Date(dateTo.getTime() - 1000 * 3600 * 24);
    }
    const typeFilter = this.typeFilter;
    const currentPage = this.currentPage;
    const params: ListMessagesParameters = {
      distinctConversations: true,
      perPage: this._perPage,
      dateFrom: dateFrom.toISOString(),
      dateTo: dateTo.toISOString(),
    };
    if (typeFilter === messageTypes.text && this.hasSharedSmsAccess) {
      params.messageType = [messageTypes.sms, messageTypes.pager];
      if (this.ownerFilter === 'Shared') {
        params.owner = 'Shared';
      } else {
        params.owner = 'Personal';
      }
    } else if (typeFilter !== messageTypes.all) {
      params.messageType = [typeFilter];
    }
    if (this.searchFilter === 'Unread') {
      params.readStatus = ['Unread'];
    }
    try {
      const { records }: GetMessageList = await this._deps.client
        .account()
        .extension()
        .messageStore()
        .list(params);
      const recordsLength = records.length;
      this._olderDataExisted = recordsLength === this._perPage;
      if (typeFilter === this.typeFilter && currentPage === this.currentPage) {
        const isIncreaseCurrentPage =
          recordsLength &&
          this._perPage * this.currentPage <
            recordsLength + this.filteredConversations.length;
        this._fetchOldConversationsSuccess(records, isIncreaseCurrentPage);
      }
    } catch (e: any /** TODO: confirm with instanceof */) {
      if (typeFilter === this.typeFilter && currentPage === this.currentPage) {
        this._updateFetchConversationsStatus(conversationsStatus.idle);
      }
    }
  }

  @computed((that: Conversations) => [
    that._deps.messageThreads.threads,
    that._deps.contactMatcher?.dataMapping,
    that._deps.conversationLogger?.loggingMap,
  ])
  get formattedMessageThreads() {
    const messageThreads = this._deps.messageThreads.threads;
    const contactMapping = this._deps.contactMatcher?.dataMapping ?? {};
    const loggingMap = this._deps.conversationLogger?.loggingMap ?? {};
    const conversationLogMapping =
      (this._deps.conversationLogger &&
        this._deps.conversationLogger.dataMapping
      ) || {};
    return messageThreads.map((thread) => {
      const self = thread.ownerParty;
      const correspondents = [thread.guestParty];
      const selfNumber = self.phoneNumber;
      const selfMatches = (selfNumber && contactMapping[selfNumber]) || [];
      const correspondentMatches = correspondents.reduce((matches, correspondent) => {
        const number = correspondent.phoneNumber;
        if (number) {
          return matches.concat(contactMapping[number] || []);
        }
        return matches;
      }, []);
      const conversationLogId = this._deps.conversationLogger
        ? this._deps.conversationLogger.getMessageThreadLogId(thread)
        : null;
      const isLogging = !!(conversationLogId && loggingMap[conversationLogId]);
      const conversationLogMatches = conversationLogMapping[conversationLogId] || [];
      const formatted = {
        ...thread,
        correspondents,
        self,
        selfMatches,
        correspondentMatches,
        conversationLogId,
        isLogging,
        conversationLogMatches,
        conversationId: thread.id,
        type: 'Thread',
      };
      formatted.lastMatchedCorrespondentEntity = this._deps.conversationLogger?.getLastMatchedCorrespondentEntity(formatted);
      return formatted;
    });
  }

  @computed((that: Conversations) => [
    that.formattedMessageThreads,
    that.effectiveSearchString,
  ])
  get filteredMessageThreads() {
    const conversations = this.formattedMessageThreads;
    const effectiveSearchString = this.effectiveSearchString;
    if (effectiveSearchString === '') {
      return conversations;
    }
    const cleanRegex = /[^\d*+#\s]/g;
    const searchString = effectiveSearchString.toLowerCase();
    const searchNumber = effectiveSearchString.replace(cleanRegex, '');
    const cleanSearchNumber = cleanNumber(searchNumber);
    const searchResults = [];
    conversations.forEach((conversation) => {
      if (searchNumber === effectiveSearchString) {
        // only digital
        if (conversation.correspondents.some((correspondent) => correspondent.phoneNumber.includes(cleanSearchNumber))) {
          searchResults.push({
            ...conversation,
            matchOrder: 0,
          });
          return;
        }
      }
      if (conversation.correspondentMatches.length > 0) {
        conversation.correspondentMatches.forEach((match) => {
          const name = match.name || [match.firstName, match.lastName].filter(Boolean).join(' ');
          if (name && name.toLowerCase().includes(searchString)) {
            searchResults.push({
              ...conversation,
              matchOrder: 0,
            });
            return;
          }
        });
      } else if (
        conversation.correspondents.some(
          (correspondent) => correspondent.name && correspondent.name.toLowerCase().includes(searchString)
        )
      ) {
        searchResults.push({
          ...conversation,
          matchOrder: 0,
        });
        return;
      }
      if (conversation.subject && conversation.subject.toLowerCase().includes(searchString)) {
        searchResults.push({
          ...conversation,
          matchOrder: 1,
        });
        return;
      }
      const matchedMessage = conversation.messages.find((message) => {
        return message.subject && message.subject.toLowerCase().includes(searchString);
      });
      if (matchedMessage) {
        searchResults.push({
          ...conversation,
          matchOrder: 1,
          matchedMessage,
        });
      }
    });
    return searchResults.sort(sortSearchResults);
  }
}
