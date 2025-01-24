import { Module } from '@ringcentral-integration/commons/lib/di';
import { RcUIModuleV2 } from '@ringcentral-integration/core';
import { formatNumber } from '@ringcentral-integration/commons/lib/formatNumber';

@Module({
  name: 'LogMessagesUI',
  deps: [
    'Locale',
    'ConversationLogger',
    'DateTimeFormat',
    'ConversationMatcher',
    'ContactMatcher',
    'RegionSettings',
    'AccountInfo',
    'ExtensionInfo',
    'ThirdPartyService',
    'RouterInteraction',
    'SideDrawerUI',
  ],
})
export class LogMessagesUI extends RcUIModuleV2 {
  constructor(deps) {
    super({
      deps,
    });
  }

  getUIProps({
    params,
  }) {
    const {
      locale,
      thirdPartyService,
      conversationLogger,
      contactMatcher
    } = this._deps;
    const conversationLog = conversationLogger.conversationLogMap[params.conversationId];
    const logKeys = Object.keys(conversationLog);
    let correspondentMatches = [];
    let lastMatchedCorrespondentEntity = null;
    let conversationLogId = '';
    const contactMapping = contactMatcher.dataMapping || [];
    if (logKeys.length > 0) {
      const conversation = conversationLog[logKeys[0]];
      if (conversation) {
        const correspondents = conversation.correspondents;
        correspondentMatches = correspondents.reduce(
          (matches, contact) => {
            const number =
              contact && (contact.phoneNumber || contact.extensionNumber);
            return number &&
              contactMapping[number] &&
              contactMapping[number].length
              ? matches.concat(contactMapping[number])
              : matches;
          },
          [],
        );
        lastMatchedCorrespondentEntity = conversationLogger.getLastMatchedCorrespondentEntity(conversation);
        conversationLogId = conversation.conversationLogId;
      }
    }
    const loggingMap = conversationLogger.loggingMap || {};
    return {
      currentLocale: locale.currentLocale,
      customizedPage: thirdPartyService.customizedLogMessagesPage,
      conversationLog,
      correspondentMatches,
      lastMatchedCorrespondentEntity,
      isLogging: !!loggingMap[conversationLogId],
    };
  }

  getUIFunctions({
    onBackButtonClick
  }) {
    const {
      regionSettings,
      accountInfo,
      extensionInfo,
      dateTimeFormat,
      thirdPartyService,
      routerInteraction,
      conversationLogger,
      sideDrawerUI,
    } = this._deps;

    return {
      onBackButtonClick: onBackButtonClick ? onBackButtonClick : () => {
        routerInteraction.goBack();
      },
      async onSaveLog({ conversationId, formData }) {
        await conversationLogger.logConversation({
          triggerType: 'logForm',
          conversationId,
          formData,
          redirect: true,
        });
        if (sideDrawerUI.hasWidget('logConversation')) {
          sideDrawerUI.closeWidget('logConversation');
        } else {
          routerInteraction.goBack();
        }
      },
      formatPhone: (phoneNumber) =>
        formatNumber({
          phoneNumber,
          areaCode: regionSettings.areaCode,
          countryCode: regionSettings.countryCode,
          maxExtensionLength: accountInfo.maxExtensionNumberLength,
          isMultipleSiteEnabled: extensionInfo.isMultipleSiteEnabled,
          siteCode: extensionInfo.site?.code,
        }),
      dateTimeFormatter: (({ utcTimestamp }) =>
        dateTimeFormat.formatDateTime({
          utcTimestamp,
        })),
      onCustomizedFieldChange: (conversation, formData, keys) => {
        thirdPartyService.onCustomizedLogMessagesPageInputChanged({
          conversation,
          formData,
          keys,
        });
      },
      onFormPageButtonClick(id, formData) {
        thirdPartyService.onClickButtonInCustomizedPage(id, 'button', formData);
      }
    };
  }
}