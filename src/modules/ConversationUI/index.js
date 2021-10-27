import React from 'react';
import { Module } from '@ringcentral-integration/commons/lib/di';
import { ConversationUI as BaseConversationUI } from '@ringcentral-integration/widgets/modules/ConversationUI';

import MessagesLogIcon from '../../components/MessagesLogIcon';

@Module({
  name: 'ConversationUI',
})
export class ConversationUI extends BaseConversationUI {
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