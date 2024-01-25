import { Module } from '@ringcentral-integration/commons/lib/di';
import { Conversations as ConversationsBase } from '@ringcentral-integration/commons/modules/Conversations';
import { conversationsStatus } from '@ringcentral-integration/commons/modules/Conversations/conversationsStatus';

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
    this._updateFetchConversationsStatus(conversationsStatus.idle); // Fix keep loading issue
    this._olderDataExisted = true;
    this._olderMessagesExisted = true;
    if (this.pagingConversations.length <= this._perPage) {
      this.loadNextPage();
    }
  }
}
