import { Module } from '@ringcentral-integration/commons/lib/di';
import { ConversationsUI as BaseConversationsUI } from '@ringcentral-integration/widgets/modules/ConversationsUI';
import messageTypes from '@ringcentral-integration/commons/enums/messageTypes';
import { computed } from '@ringcentral-integration/core';
import { getConversationPhoneNumber } from '../../lib/conversationHelper';

@Module({
  name: 'ConversationsUI',
  deps: [
    'SideDrawerUI',
    'ComposeTextUI',
    'ConversationUI',
    'Auth',
    'ThirdPartyService',
  ],
})
export class ConversationsUI extends BaseConversationsUI {
  @computed((that: ConversationsUI) => [
    that._deps.conversations.typeFilter,
    that._deps.conversations.hasSharedSmsAccess,
    that._deps.messageStore.personalTextUnreadCounts,
    that._deps.messageStore.sharedTextUnreadCounts,
  ])
  get ownerTabs() {
    if (
      this._deps.conversations.typeFilter !== messageTypes.text ||
      !this._deps.conversations.hasSharedSmsAccess
    ) {
      return [];
    }
    return [
      {
        label: 'Direct',
        value: 'Personal',
        unreadCounts: this._deps.messageStore.personalTextUnreadCounts,
      },
      {
        label: 'Call queue',
        value: 'Shared',
        unreadCounts: this._deps.messageStore.sharedTextUnreadCounts,
      },
    ];
  }

  getUIProps({
    type = 'text',
    ...props
  }) {
    const baseProps = super.getUIProps(props);
    const {
      conversationLogger,
      conversations,
      auth,
      thirdPartyService,
    } = this._deps;
    return {
      ...baseProps,
      typeFilter: messageTypes[type],
      showLogButton: conversationLogger.loggerSourceReady,
      logButtonTitle: conversationLogger.logButtonTitle,
      searchFilter: conversations.searchFilter,
      conversations: conversations.pagingConversations,
      rcAccessToken: auth.accessToken,
      ownerFilter: conversations.ownerFilter,
      ownerTabs: this.ownerTabs,
      additionalActions: thirdPartyService.additionalMessageActions,
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
      onRefreshContact: ({ phoneNumber }) => {
        contactMatcher.setManualRefreshNumber(phoneNumber);
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
      onOwnerFilterChange: (filter) => {
        conversations.updateOwnerFilter(filter);
      },
      onClickAdditionalAction: (buttonId, conversation) => {
        thirdPartyService.onClickAdditionalButton(buttonId, conversation);
      },
    }
  }
}
