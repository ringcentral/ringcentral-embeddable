import { Module } from '@ringcentral-integration/commons/lib/di';
import {
  ConversationUI as BaseConversationUI,
} from '@ringcentral-integration/widgets/modules/ConversationUI';

@Module({
  name: 'ConversationUI',
  deps: [
    'ModalUI',
    'ThirdPartyService',
    'SmsTemplates',
    'SideDrawerUI',
    'PhoneNumberFormat',
    'ExtensionInfo',
    'MessageThreads',
    'MessageThreadEntries',
  ],
})
export class ConversationUI extends BaseConversationUI {
  protected _alertModalId = null;

  getUIProps(props) {
    const baseProps = super.getUIProps(props);
    const {
      thirdPartyService,
      conversationLogger,
      appFeatures,
      smsTemplates,
      conversations,
      extensionInfo,
    } = this._deps;
    if (props.params.type === 'thread' && conversations.currentMessageThread) {
      baseProps.conversation = conversations.currentMessageThread;
      baseProps.messages = conversations.currentMessageThread.messages;
      baseProps.recipients = conversations.currentMessageThread.recipients;
    }
    return {
      ...baseProps,
      showLogButton: conversationLogger.loggerSourceReady,
      logButtonTitle: conversationLogger.logButtonTitle,
      additionalToolbarButtons: thirdPartyService.additionalSMSToolbarButtons,
      showTemplate: appFeatures.showSmsTemplate,
      templates: smsTemplates.templates,
      showTemplateManagement: appFeatures.showSmsTemplateManage,
      myExtensionId: String(extensionInfo.id),
    };
  }

  smsVerify = async (correspondents, selectedContact) => {
    if (!this._deps.thirdPartyService.doNotContactRegistered) {
      return true;
    }
    const recipients = correspondents.map((c) => ({
      phoneNumber: c.phoneNumber,
    }));
    if (selectedContact) {
      const recipient = recipients.find((r) => {
        return (selectedContact.phoneNumbers || []).find((p) => p.phoneNumber === r.phoneNumber);
      });
      if (recipient) {
        const number = selectedContact.phoneNumbers.find((p) => p.phoneNumber === recipient.phoneNumber);
        recipient.name = selectedContact.name;
        recipient.contactId = selectedContact.id;
        recipient.contactType = selectedContact.type;
        recipient.entityType = selectedContact.entityType;
        recipient.phoneType = number.phoneType;
      }
    }
    try {
      const doNotContact = await this._deps.thirdPartyService.checkDoNotContact({
        recipients,
        actionType: 'sms',
      });
      if (!doNotContact || !doNotContact.result) {
        return true;
      }
      if (this._alertModalId) {
        this._deps.modalUI.close(this._alertModalId);
        this._alertModalId = null;
      }
      if (doNotContact.mode === 'restrict') {
        this._alertModalId = this._deps.modalUI.alert({
          title: 'Do Not Contact',
          content: doNotContact.message || 'The number is on the Do Not Contact list.',
        });
        return false;
      }
      const confirmed = await this._deps.modalUI.confirm({
        title: 'Do Not Contact',
        content: doNotContact.message || 'The number is on the Do Not Contact list. Do you still want to send message?',
        confirmButtonText: 'Send',
      }, true);
      return confirmed;
    } catch (error) {
      console.error(error);
      return true;
    }
  };

  getUIFunctions(
    options,
  ) {
    const {
      conversationLogger,
      thirdPartyService,
      smsTemplates,
      routerInteraction,
      phoneNumberFormat,
      regionSettings,
      accountInfo,
      extensionInfo,
      conversations,
      messageThreads,
      messageStore,
      messageThreadEntries,
    } = this._deps;
    return {
      ...super.getUIFunctions(options),
      goBack: options.goBack ? options.goBack : () => {
        routerInteraction.push(options.conversationsPath || '/messages');
      },
      replyToReceivers: async (text, attachments, selectedContact) => {
        const continueSMS = await this.smsVerify(
          conversations.currentConversation.correspondents,
          selectedContact,
        );
        if (!continueSMS) {
          return;
        }
        return conversations.replyToReceivers(text, attachments, selectedContact);
      },
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
      loadTemplates: () => {
        return smsTemplates.sync();
      },
      deleteTemplate: (templateId) => {
        return smsTemplates.deleteTemplate(templateId);
      },
      createOrUpdateTemplate: (template) => {
        return smsTemplates.createOrUpdateTemplate(template);
      },
      sortTemplates: (templateIds) => {
        return smsTemplates.sort(templateIds);
      },
      formatPhone: (phoneNumber) =>
        phoneNumberFormat.format({
          phoneNumber,
          areaCode: regionSettings.areaCode,
          countryCode: regionSettings.countryCode,
          maxExtensionLength: accountInfo.maxExtensionNumberLength,
          isMultipleSiteEnabled: extensionInfo.isMultipleSiteEnabled,
          siteCode: extensionInfo.site?.code,
        }),
      readMessages: (id) => {
        if (options.params.type === 'thread') {
          messageThreadEntries.markThreadAsRead(id);
          return;
        }
        messageStore.readMessages(id);
      },
      onAssign: async (assignee) => {
        return messageThreads.assign(conversations.currentMessageThread.id, assignee);
      },
      getSMSRecipients: () => {
        return messageThreads.getSMSRecipients(conversations.currentMessageThread.owner);
      },
      onReplyThread: async () => {
        const conversation = conversations.currentMessageThread;
        if (conversation.status === 'Resolved') {
          await messageThreads.reopen(conversation.id);
          return;
        }
        if (!conversation.assignee) {
          await messageThreads.assign(conversation.id, { extensionId: String(extensionInfo.id) });
        }
      },
      onResolveThread: async () => {
        const conversation = conversations.currentMessageThread;
        if (conversation.status === 'Open') {
          await messageThreads.resolve(conversation.id);
        }
      },
    }
  }
}
