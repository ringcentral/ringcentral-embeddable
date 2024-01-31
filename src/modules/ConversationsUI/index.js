import { Module } from '@ringcentral-integration/commons/lib/di';
import { ConversationsUI as BaseConversationsUI } from '@ringcentral-integration/widgets/modules/ConversationsUI';

@Module({
  name: 'ConversationsUI',
})
export class ConversationsUI extends BaseConversationsUI {
  getUIProps(props) {
    const baseProps = super.getUIProps(props);
    const {
      conversationLogger,
    } = this._deps;
    return {
      ...baseProps,
      showLogButton: conversationLogger.loggerSourceReady,
      logButtonTitle: conversationLogger.logButtonTitle,
    };
  }

  getUIFunctions(
    options,
  ) {
    const { conversationLogger } = this._deps;
    return {
      ...super.getUIFunctions(options),
      onLogConversation: async ({ redirect = true, ...options }) => {
        await conversationLogger.logConversation({
          ...options,
          redirect,
          triggerType: 'manual'
        });
      },
    }
  }
}