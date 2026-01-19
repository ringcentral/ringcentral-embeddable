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
    'SmsTypingTimeTracker',
  ],
})
export class ConversationUI extends BaseConversationUI {
  _alertModalId = null;

  getUIProps(props) {
    const baseProps = super.getUIProps(props);
    const {
      thirdPartyService,
      conversationLogger,
      appFeatures,
      smsTemplates,
      smsTypingTimeTracker,
      conversations,
    } = this._deps;
    // Get typing duration props for current conversation
    const conversationId = conversations.currentConversationId;
    const typingStartTime = conversationId ? (smsTypingTimeTracker._typingStartTimes?.[conversationId] || null) : null;
    const accumulatedTypingTime = conversationId ? (smsTypingTimeTracker.accumulatedTypingTimes?.[conversationId] || 0) : 0;
    return {
      ...baseProps,
      showLogButton: conversationLogger.loggerSourceReady,
      logButtonTitle: conversationLogger.logButtonTitle,
      additionalToolbarButtons: thirdPartyService.additionalSMSToolbarButtons,
      showTemplate: appFeatures.showSmsTemplate,
      templates: smsTemplates.templates,
      showTemplateManagement: appFeatures.showSmsTemplateManage,
      // Typing duration tracking
      showTypingDuration: smsTypingTimeTracker.enabled,
      typingStartTime,
      accumulatedTypingTime,
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
      conversations,
      smsTypingTimeTracker,
    } = this._deps;

    const baseFuncs = super.getUIFunctions(options);

    return {
      ...baseFuncs,
      updateMessageText: (text) => {
        const conversationId = conversations.currentConversationId;
        // Start typing tracking when there's text (startTyping handles duplicate calls internally)
        if (conversationId && text) {
          smsTypingTimeTracker.startTyping(conversationId);
        }
        conversations.updateMessageText(text);
      },
      goBack: options.goBack ? options.goBack : () => {
        routerInteraction.push(options.conversationsPath || '/messages');
      },
      unloadConversation: () => {
        // Clear if no text, pause if text exists (preserve accumulated time)
        const conversationId = conversations.currentConversationId;
        if (conversationId) {
          if (conversations.messageText) {
            smsTypingTimeTracker.pauseTyping(conversationId);
          } else {
            smsTypingTimeTracker.clearTyping(conversationId);
          }
        }
        conversations.unloadConversation();
      },
      replyToReceivers: async (text, attachments, selectedContact) => {
        const continueSMS = await this.smsVerify(
          conversations.currentConversation.correspondents,
          selectedContact,
        );
        if (!continueSMS) {
          return;
        }
        const conversationId = conversations.currentConversationId;
        // Pause typing before sending - so if send fails, time won't keep accumulating
        if (conversationId) {
          smsTypingTimeTracker.pauseTyping(conversationId);
        }
        const response = await conversations.replyToReceivers(text, attachments, selectedContact);
        // Save typing time after successful send
        if (response && response.id && conversationId) {
          smsTypingTimeTracker.stopTyping(conversationId, String(response.id));
        }
        return response;
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
    }
  }
}
