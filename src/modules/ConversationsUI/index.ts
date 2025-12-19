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
    'PhoneNumberFormat',
    'AppFeatures',
    'MessageThreads',
  ],
})
export class ConversationsUI extends BaseConversationsUI {
  @computed((that: ConversationsUI) => [
    that._deps.conversations.typeFilter,
    that._deps.conversations.hasSharedSmsAccess,
    that._deps.messageStore.personalTextUnreadCounts,
    that._deps.messageStore.sharedTextUnreadCounts,
    that._deps.appFeatures.hasMessageThreadsPermission,
    that._deps.messageThreads.unreadCounts,
  ])
  get ownerTabs() {
    if (
      this._deps.conversations.typeFilter !== messageTypes.text ||
      (
        !this._deps.conversations.hasSharedSmsAccess &&
        !this._deps.appFeatures.hasMessageThreadsPermission
      )
    ) {
      return [];
    }
    const tabs = [{
      label: 'Direct',
      value: 'Personal',
      unreadCounts: this._deps.messageStore.personalTextUnreadCounts,
    }];
    if (this._deps.appFeatures.hasSharedSmsAccess) {
      tabs.push({
        label: 'Call queue',
        value: 'Shared',
        unreadCounts: this._deps.messageStore.sharedTextUnreadCounts,
      });
    }
    if (this._deps.appFeatures.hasMessageThreadsPermission) {
      tabs.push({
        label: 'Shared',
        value: 'Threads',
        unreadCounts: this._deps.messageThreads.unreadCounts,
      });
    }
    return tabs;
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
      regionSettings,
      accountInfo,
      extensionInfo,
      phoneNumberFormat,
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
        let type = 'conversation';
        if (conversation) {
          const phoneNumber = getConversationPhoneNumber(conversation);
          contact = { phoneNumber };
          type = 'conversation';
        } else {
          const messageThread = conversations.formattedMessageThreads.find((mt) => mt.id === conversationId);
          if (messageThread) {
            contact = { phoneNumber: messageThread.guestParty?.phoneNumber ?? '' };
            type = 'thread';
          }
        }
        sideDrawerUI.gotoConversation(conversationId, contact, type);
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
      formatPhone: (phoneNumber: string) =>
        phoneNumberFormat.format({
          phoneNumber,
          areaCode: regionSettings.areaCode,
          countryCode: regionSettings.countryCode,
          maxExtensionLength: accountInfo.maxExtensionNumberLength,
          isMultipleSiteEnabled: extensionInfo.isMultipleSiteEnabled,
          siteCode: extensionInfo.site?.code,
        }),
    }
  }
}
