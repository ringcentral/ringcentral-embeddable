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
    'PhoneNumberFormat',
    'RegionSettings',
    'AccountInfo',
    'ExtensionInfo',
    'MessageThreadEntries',
    'MessageThreads',
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
      composeText,
    } = this._deps;
    return {
      ...baseProps,
      additionalToolbarButtons: thirdPartyService.additionalSMSToolbarButtons,
      showTemplate: appFeatures.showSmsTemplate,
      templates: smsTemplates.templates,
      showTemplateManagement: appFeatures.showSmsTemplateManage,
      groupSMS: composeText.groupSMS,
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
      phoneNumberFormat,
      regionSettings,
      accountInfo,
      extensionInfo,
      messageThreadEntries,
      messageThreads,
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
          const threadMessages = responses.filter((response) => response.threadId);
          if (threadMessages.length > 0) {
            messageThreadEntries.saveNewMessages(threadMessages);
          }
          const normalMessages = responses.filter((response) => !response.threadId);
          if (normalMessages.length > 0) {
            messageStore.pushMessages(normalMessages);
          }
          if (responses.length === 1) {
            const threadId = responses[0]?.threadId;
            if (threadId) {
              const thread = await messageThreads.loadThread(threadId);
              console.log('thread', thread);
              if (thread) {
                const phoneNumber = thread.guestParty?.phoneNumber ?? '';
                sideDrawerUI.gotoConversation(threadId, { phoneNumber }, 'thread');
                sideDrawerUI.closeWidget('composeText');
              } else {
                routerInteraction.push('/messages');
              }
            } else {
              const conversationId =
                responses[0] &&
                responses[0].conversation &&
                responses[0].conversation.id;
              if (!conversationId) {
                return;
              }
              const phoneNumber = getConversationPhoneNumber(responses[0]);
              sideDrawerUI.gotoConversation(conversationId, { phoneNumber });
              sideDrawerUI.closeWidget('composeText');
            }
          } else {
            if (threadMessages.length > 0) {
              conversations.updateOwnerFilter('Threads');
            }
            routerInteraction.push('/messages');
            sideDrawerUI.closeWidget('composeText');
          }
          // TODO: relate correspondent entity for thread messages
          if (normalMessages.length > 0) {
            conversations.relateCorrespondentEntity(normalMessages);
          }
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
      formatContactPhone: (phoneNumber) =>
        phoneNumberFormat.format({
          phoneNumber,
          areaCode: regionSettings.areaCode,
          countryCode: regionSettings.countryCode,
          maxExtensionLength: accountInfo.maxExtensionNumberLength,
          isMultipleSiteEnabled: extensionInfo.isMultipleSiteEnabled,
          siteCode: extensionInfo.site?.code,
        }),
      setGroupSMS: (checked: boolean) => {
        composeText.setGroupSMS(checked);
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
