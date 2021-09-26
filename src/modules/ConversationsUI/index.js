import React from 'react';
import { Module } from '@ringcentral-integration/commons/lib/di';
import { ConversationsUI as BaseConversationsUI } from '@ringcentral-integration/widgets/modules/ConversationsUI';

import MessagesLogIcon from '../../components/MessagesLogIcon';

@Module({
  name: 'ConversationsUI',
})
export class ConversationsUI extends BaseConversationsUI {
  getUIFunctions(
    options,
  ) {
    const { locale, conversationLogger, connectivityMonitor } = this._deps;
    return {
      ...super.getUIFunctions(options),
      renderExtraButton: (
        conversation = {},
        {
          logConversation,
          isLogging
        }
      ) => {
        if (!conversationLogger.loggerSourceReady) {
          return null;
        }
        return (
          <MessagesLogIcon
            title={conversationLogger.logButtonTitle}
            disabled={isLogging || !connectivityMonitor.connectivity}
            conversationId={conversation.id}
            currentLocale={locale.currentLocale}
            onClick={logConversation}
          />
        );
      },
    }
  }
}