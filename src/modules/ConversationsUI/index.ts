import { Module } from '@ringcentral-integration/commons/lib/di';
import { ConversationsUI as BaseConversationsUI } from '@ringcentral-integration/widgets/modules/ConversationsUI';
import messageTypes from '@ringcentral-integration/commons/enums/messageTypes';
import { getConversationPhoneNumber } from '../../lib/conversationHelper';

@Module({
  name: 'ConversationsUI',
  deps: [
    'SideDrawerUI',
    'ComposeTextUI',
    'ConversationUI',
  ],
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
    const {
      conversationLogger,
      contactMatcher,
      conversations,
      composeTextUI,
      appFeatures,
      messageStore,
      sideDrawerUI,
      conversationUI,
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
      onRefreshContact: ({ phoneNumber }) => {
        contactMatcher.forceMatchNumber({ phoneNumber })
      },
      onSearchFilterChange: (value) => {
        conversations.updateSearchFilter(value);
      },
      onSearchInputChange: (value) => {
        conversations.updateSearchInput(value);
      },
      openMessageDetails: (id) => {
        const conversation = conversations.allConversations.find((c) => c.id === id);
        let contact = null;
        if (conversation) {
          const phoneNumber = getConversationPhoneNumber(conversation);
          contact = { phoneNumber };
        }
        sideDrawerUI.gotoMessageDetails({
          id,
          type: conversation && conversation.type,
        }, contact);
      },
      goToComposeText: () => {
        composeTextUI.gotoComposeText();
      },
      showConversationDetail: (conversationId) => {
        const conversation = conversations.allConversations.find((c) => c.conversationId === conversationId);
        let contact = null;
        if (conversation) {
          const phoneNumber = getConversationPhoneNumber(conversation);
          contact = { phoneNumber };
        }
        sideDrawerUI.gotoConversation(conversationId, contact);
      },
      onClickToSms: appFeatures.hasComposeTextPermission
        ? (contact, isDummyContact = false) => {
            composeTextUI.gotoComposeText(contact, isDummyContact);
            // for track
            messageStore.onClickToSMS();
          }
        : undefined,
    }
  }
}
