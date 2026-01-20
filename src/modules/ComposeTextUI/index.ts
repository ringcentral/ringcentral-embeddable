import { Module } from '@ringcentral-integration/commons/lib/di';
import {
  ComposeTextUI as ComposeTextUIBase,
} from '@ringcentral-integration/widgets/modules/ComposeTextUI';
import { getConversationPhoneNumber } from '../../lib/conversationHelper';

type ComposeContact = {
  name?: string;
  phoneNumber: string;
}

const COMPOSE_TYPING_KEY = 'compose';

@Module({
  name: 'ComposeTextUI',
  deps: [
    'ThirdPartyService',
    'RouterInteraction',
    'SmsTemplates',
    'SideDrawerUI',
    'Analytics',
    'SmsTypingTimeTracker',
  ]
})
export class ComposeTextUI extends ComposeTextUIBase {
  constructor(deps) {
    super(deps);
    this._ignoreModuleReadiness(deps.smsTemplates);
    this._ignoreModuleReadiness(deps.thirdPartyService);
  }

  getUIProps(props) {
    const baseProps = super.getUIProps(props);
    const {
      thirdPartyService,
      appFeatures,
      smsTemplates,
      smsTypingTimeTracker,
    } = this._deps;
    // Get typing duration props using simple 'compose' key
    const typingStartTime = smsTypingTimeTracker._typingStartTimes?.[COMPOSE_TYPING_KEY] || null;
    const accumulatedTypingTime = smsTypingTimeTracker.accumulatedTypingTimes?.[COMPOSE_TYPING_KEY] || 0;
    return {
      ...baseProps,
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

  getUIFunctions(props) {
    const baseFuncs = super.getUIFunctions(props);
    const {
      thirdPartyService,
      smsTemplates,
      routerInteraction,
      composeText,
      messageStore,
      conversations,
      sideDrawerUI,
      smsTypingTimeTracker,
    } = this._deps;

    return {
      ...baseFuncs,
      updateMessageText: (text: string) => {
        // Reset accumulated time if user returned and clears text for first time
        if (
          text === '' &&
          composeText.messageText !== '' &&
          (!!smsTypingTimeTracker.accumulatedTypingTimes?.[COMPOSE_TYPING_KEY])
        ) {
          smsTypingTimeTracker.clearTyping(COMPOSE_TYPING_KEY);
        }
        // Start typing tracking when there's text
        if (text) {
          smsTypingTimeTracker.startTyping(COMPOSE_TYPING_KEY);
        }
        composeText.updateMessageText(text);
      },
      send: async (text, attachments) => {
        // Pause typing before sending - so if send fails, time won't keep accumulating
        smsTypingTimeTracker.pauseTyping(COMPOSE_TYPING_KEY);
        try {
          const responses = await composeText.send(
            text,
            attachments,
          );
          if (!responses || responses.length === 0) {
            return;
          }
          // Save typing time for each sent message
          responses.forEach((response) => {
            if (response && response.id) {
              smsTypingTimeTracker.stopTyping(COMPOSE_TYPING_KEY, String(response.id));
            }
          });
          messageStore.pushMessages(responses);
          if (responses.length === 1) {
            const conversationId =
              responses[0] &&
              responses[0].conversation &&
              responses[0].conversation.id;
            if (!conversationId) {
              return;
            }
            const phoneNumber = getConversationPhoneNumber(responses[0]);
            sideDrawerUI.gotoConversation(conversationId, { phoneNumber });
          } else {
            routerInteraction.push('/messages');
          }
          conversations.relateCorrespondentEntity(responses);
          composeText.clean();
          return;
        } catch (err) {
          console.log(err);
        }
      },
      onClickAdditionalToolbarButton: (buttonId) => {
        thirdPartyService.onClickAdditionalButton(buttonId);
      },
      goBack: () => {
        // Clear if no text, pause if text exists (preserve accumulated time)
        if (composeText.messageText) {
          smsTypingTimeTracker.pauseTyping(COMPOSE_TYPING_KEY);
        } else {
          smsTypingTimeTracker.clearTyping(COMPOSE_TYPING_KEY);
        }
        if (props.goBack) {
          props.goBack();
        } else {
          routerInteraction.goBack();
        }
      },
      onClose: props.onClose ? () => {
        // Clear if no text, pause if text exists (preserve accumulated time)
        if (composeText.messageText) {
          smsTypingTimeTracker.pauseTyping(COMPOSE_TYPING_KEY);
        } else {
          smsTypingTimeTracker.clearTyping(COMPOSE_TYPING_KEY);
        }
        props.onClose();
      } : undefined,
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
    };
  }

  gotoComposeText(contact: ComposeContact | undefined = undefined, isDummyContact = false) {
    const {
      composeText,
      contactSearch,
      sideDrawerUI,
    } = this._deps;
    sideDrawerUI.openWidget({
      widget: {
        id: 'composeText',
        name: 'Compose text',
      },
      contact,
    });
    if (!contact) {
      this._deps.analytics.trackRouter('/composeText');
      return;
    }
    // if contact autocomplete, if no match fill the number only
    if (contact.name && contact.phoneNumber && isDummyContact) {
      composeText.updateTypingToNumber(contact.name);
      contactSearch.search({ searchString: contact.name });
    } else {
      composeText.addToNumber(contact);
      if (
        composeText.typingToNumber === contact.phoneNumber
      ) {
        composeText.cleanTypingToNumber();
      }
    }
    this._deps.analytics.trackRouter('/composeText');
  }
}
