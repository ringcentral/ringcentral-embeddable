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
    'PhoneNumberFormat',
    'RegionSettings',
    'AccountInfo',
    'ExtensionInfo',
    'MessageThreadEntries',
    'MessageThreads',
    'Alert',
    'SmsTypingTimeTracker',
  ]
})
export class ComposeTextUI extends ComposeTextUIBase {
  private _presetSenderNumber: string;

  constructor(deps) {
    super(deps);
    this._ignoreModuleReadiness(deps.smsTemplates);
    this._ignoreModuleReadiness(deps.thirdPartyService);
    this._presetSenderNumber = '';
  }

  getUIProps(props) {
    const baseProps = super.getUIProps(props);
    const {
      thirdPartyService,
      appFeatures,
      smsTemplates,
      composeText,
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
      groupSMS: composeText.groupSMS,
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
      phoneNumberFormat,
      regionSettings,
      accountInfo,
      extensionInfo,
      messageThreadEntries,
      messageThreads,
      messageSender,
      alert,
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
          let isThread = false;
          if (
            messageThreads.hasPermission &&
            (
              (
                composeText.toNumbers.length === 1 && 
                !composeText.typingToNumber
              ) ||
              (
                composeText.toNumbers.length === 0 &&
                composeText.typingToNumber
              )
            ) &&
            attachments.length === 0
          ) {
            const sender = messageSender.senderNumbersList.find(
              (number) => number.phoneNumber === composeText.senderNumber
            );
            if (sender && sender.extension) {
              isThread = true;
            }
          }
          if (isThread) {
            // check if thread exists
            const toNumber = composeText.typingToNumber || composeText.toNumbers[0].phoneNumber;
            const formattedToNumber = phoneNumberFormat.formatWithType({
              phoneNumber: toNumber,
              areaCode: regionSettings.areaCode,
              countryCode: regionSettings.countryCode,
              maxExtensionLength: accountInfo.maxExtensionNumberLength,
              isMultipleSiteEnabled: extensionInfo.isMultipleSiteEnabled,
              siteCode: extensionInfo.site?.code,
            }, 'e164');
            const thread = messageThreads.threads.find((thread) => {
              return (
                thread.guestParty?.phoneNumber === formattedToNumber &&
                thread.ownerParty?.phoneNumber === composeText.senderNumber
              );
            });
            if (thread && thread.status === 'Open') {
              // Go to thread page, and send
              conversations.loadConversation(thread.id);
              conversations.updateMessageText(text ?? '');
              // TODO: copy attachments to thread after thread support MMS
              sideDrawerUI.gotoConversation(thread.id, { phoneNumber: thread.guestParty?.phoneNumber ?? '' }, 'thread');
              sideDrawerUI.closeWidget('composeText');
              composeText.clean();
              if (
                !thread.assignee ||
                String(thread.assignee.extensionId) !== String(extensionInfo.id)
              ) {
                alert.warning({
                  message: 'threadIsAssignedToOtherExtension',
                  ttl: 0,
                });
                return;
              }
              if (
                text && text.length > 0
              ) {
                // TODO: Save typing time for reply to thread
                conversations.replyToThread(text);
              }
              return;
            }
          }
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
      onLoad: () => {
        if (this._presetSenderNumber) {
          if (this._presetSenderNumber !== composeText.senderNumber) {
            composeText.updateSenderNumber(this._presetSenderNumber);
          }
          this._presetSenderNumber = '';
          return;
        }
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

  gotoComposeText(contact: ComposeContact | undefined = undefined, isDummyContact = false, presetSenderNumber = '') {
    const {
      composeText,
      contactSearch,
      sideDrawerUI,
    } = this._deps;
    this._presetSenderNumber = presetSenderNumber;
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
