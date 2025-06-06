import { Module } from '@ringcentral-integration/commons/lib/di';
import { Conversations as ConversationsBase } from '@ringcentral-integration/commons/modules/Conversations';
import { conversationsStatus } from '@ringcentral-integration/commons/modules/Conversations/conversationsStatus';
import { messageTypes } from '@ringcentral-integration/commons/enums/messageTypes';

import { action, state, computed } from '@ringcentral-integration/core';
import type GetMessageList from '@rc-ex/core/lib/definitions/GetMessageList';
import type ListMessagesParameters from '@rc-ex/core/lib/definitions/ListMessagesParameters';

@Module({
  name: 'NewConversations',
  deps: []
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
  ownerFilter = 'Personal'; // Personal, Shared

  @action
  setOwnerFilter(filter) {
    this.ownerFilter = filter;
  }

  updateOwnerFilter(filter) {
    this.ownerFilter = filter;
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
  ])
  get pagingConversations() {
    const pageNumber = this.currentPage;
    const lastIndex = pageNumber * this._perPage;
    let searchFiltered = this.filteredConversations;
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
    if (
      this.typeFilter === messageTypes.text &&
      this._deps.messageStore.sharedSmsConversations.length > 0 &&
      this.ownerFilter
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

  async fetchOldConversations() {
    if (!this._olderDataExisted) {
      return;
    }
    if (this.loadingOldConversations) {
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
    if (typeFilter === messageTypes.text && this._deps.messageStore.sharedSmsConversations.length > 0) {
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
}
