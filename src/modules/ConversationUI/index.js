import { Module } from '@ringcentral-integration/commons/lib/di';
import {
  ConversationUI as BaseConversationUI,
} from '@ringcentral-integration/widgets/modules/ConversationUI';

@Module({
  name: 'ConversationUI',
  deps: ['ThirdPartyService'],
})
export class ConversationUI extends BaseConversationUI {
  getUIProps(props) {
    const baseProps = super.getUIProps(props);
    const {
      thirdPartyService,
      conversationLogger,
    } = this._deps;
    return {
      ...baseProps,
      showLogButton: conversationLogger.loggerSourceReady,
      logButtonTitle: conversationLogger.logButtonTitle,
      additionalToolbarButtons: thirdPartyService.additionalSMSToolbarButtons,
    };
  }

  getUIFunctions(
    options,
  ) {
    const {
      conversationLogger,
      thirdPartyService,
    } = this._deps;
    return {
      ...super.getUIFunctions(options),
      onLogConversation: async ({ redirect = true, ...options }) => {
        await conversationLogger.logConversation({
          ...options,
          redirect,
          triggerType: 'manual'
        });
      },
      onClickAdditionalToolbarButton: (buttonId) => {
        thirdPartyService.onClickAdditionalButton(buttonId);
      },
    }
  }
}