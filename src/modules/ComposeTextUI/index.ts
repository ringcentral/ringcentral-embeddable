import { Module } from '@ringcentral-integration/commons/lib/di';
import {
  ComposeTextUI as ComposeTextUIBase,
} from '@ringcentral-integration/widgets/modules/ComposeTextUI';
import { getConversationPhoneNumber } from '../../lib/conversationHelper';

type ComposeContact = {
  name?: string;
  phoneNumber: string;
}

@Module({
  name: 'ComposeTextUI',
  deps: [
    'ThirdPartyService',
    'RouterInteraction',
    'SmsTemplates',
    'SideDrawerUI',
    'Analytics',
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
    } = this._deps;
    return {
      ...baseProps,
      additionalToolbarButtons: thirdPartyService.additionalSMSToolbarButtons,
      showTemplate: appFeatures.showSmsTemplate,
      templates: smsTemplates.templates,
      showTemplateManagement: appFeatures.showSmsTemplateManage,
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
    } = this._deps;
    return {
      ...baseFuncs,
      send: async (text, attachments) => {
        try {
          const responses = await composeText.send(
            text,
            attachments,
          );
          if (!responses || responses.length === 0) {
            return;
          }
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
      goBack: props.goBack ? props.goBack : () => {
        routerInteraction.goBack();
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
      onLoad: () => {
        if (
          composeText.defaultTextId &&
          composeText.defaultTextId !== composeText.senderNumber
        ) {
          composeText.updateSenderNumber(composeText.defaultTextId);
        }
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
