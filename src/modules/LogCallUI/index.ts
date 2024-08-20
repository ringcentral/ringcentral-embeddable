import { Module } from '@ringcentral-integration/commons/lib/di';
import { RcUIModuleV2 } from '@ringcentral-integration/core';
import { formatNumber } from '@ringcentral-integration/commons/lib/formatNumber';

@Module({
  name: 'LogCallUI',
  deps: [
    'Locale',
    'CallLogger',
    'DateTimeFormat',
    'ActivityMatcher',
    'RegionSettings',
    'AccountInfo',
    'ExtensionInfo',
    'ThirdPartyService',
    'RouterInteraction',
    'SmartNotes',
  ],
})
export class LogCallUI extends RcUIModuleV2 {
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
      callLogger,
      thirdPartyService,
      smartNotes,
    } = this._deps;
    let currentCall = null;
    if (params.callSessionId) {
      currentCall = callLogger.allCallMapping[params.callSessionId];
    }
    const loggingMap = callLogger.loggingMap || {};
    const noteText = currentCall ? smartNotes.smartNoteTextMapping[currentCall.telephonySessionId] : '';
    return {
      currentCall,
      currentLocale: locale.currentLocale,
      customizedPage: thirdPartyService.customizedLogCallPage,
      isLogging: !!loggingMap[params.callSessionId],
      smartNote: noteText || '',
    };
  }

  getUIFunctions() {
    const {
      activityMatcher,
      regionSettings,
      accountInfo,
      extensionInfo,
      dateTimeFormat,
      thirdPartyService,
      routerInteraction,
      callLogger,
      smartNotes,
    } = this._deps;

    return {
      onBackButtonClick() {
        routerInteraction.goBack();
      },
      async onSave({ call, note, formData }) {
        await callLogger.logCall({
          call,
          triggerType: 'logForm',
          note,
          formData,
          redirect: true,
        });
        routerInteraction.goBack();
      },
      onLoadData(call) {
        activityMatcher.match({
          queries: [call.sessionId],
          ignoreCache: true
        });
        smartNotes.fetchSmartNoteText(call.telephonySessionId);
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
      onCustomizedFieldChange: (call, formData, keys) => {
        thirdPartyService.onCustomizedLogCallPageInputChanged({
          call,
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
