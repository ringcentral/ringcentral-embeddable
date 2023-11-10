import React from 'react';

import { Module } from '@ringcentral-integration/commons/lib/di';
import {
  ConversationUI as BaseConversationUI,
} from '@ringcentral-integration/widgets/modules/ConversationUI';

import MessagesLogIcon from '../../components/MessagesLogIcon';

@Module({
  name: 'ConversationUI',
  deps: ['ThirdPartyService'],
})
export class ConversationUI extends BaseConversationUI {
  getUIProps(props) {
    const baseProps = super.getUIProps(props);
    const {
      thirdPartyService,
    } = this._deps;
    return {
      ...baseProps,
      additionalToolbarButtons: thirdPartyService.additionalSMSToolbarButtons,
    };
  }

  getUIFunctions(
    options,
  ) {
    const {
      locale,
      conversationLogger,
      connectivityMonitor,
      thirdPartyService,
    } = this._deps;
    return {
      ...super.getUIFunctions(options),
      onLogConversation: async ({ redirect = true, ...options }) => {
        await this._deps.conversationLogger.logConversation({
          ...options,
          redirect,
          triggerType: 'manual'
        });
      },
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
      onClickAdditionalToolbarButton: (buttonId) => {
        thirdPartyService.onClickAdditionalButton(buttonId);
      },
    }
  }
}