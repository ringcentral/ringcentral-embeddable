import { computed, action, state } from '@ringcentral-integration/core';
import { Module } from '@ringcentral-integration/commons/lib/di';
import { ConversationsUI as BaseConversationsUI } from '@ringcentral-integration/widgets/modules/ConversationsUI';
import messageTypes from '@ringcentral-integration/commons/enums/messageTypes';

@Module({
  name: 'ConversationsUI',
})
export class ConversationsUI extends BaseConversationsUI {
  getUIProps({
    type = 'text',
    ...props
  }) {
    const baseProps = super.getUIProps(props);
    const {
      conversationLogger,
      conversations,
    } = this._deps;
    return {
      ...baseProps,
      typeFilter: messageTypes[type],
      showLogButton: conversationLogger.loggerSourceReady,
      logButtonTitle: conversationLogger.logButtonTitle,
      searchFilter: conversations.searchFilter,
      conversations: conversations.pagingConversations,
    };
  }

  getUIFunctions(
    options,
  ) {
    const { conversationLogger, contactMatcher, conversations } = this._deps;
    return {
      ...super.getUIFunctions(options),
      onLogConversation: async ({ redirect = true, ...options }) => {
        await conversationLogger.logConversation({
          ...options,
          redirect,
          triggerType: 'manual'
        });
      },
      onRefreshContact: ({ phoneNumber }) => {
        contactMatcher.forceMatchNumber({ phoneNumber })
      },
      onSearchFilterChange: (value) => {
        conversations.updateSearchFilter(value);
      }
    }
  }
}
