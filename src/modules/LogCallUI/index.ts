import { Module } from '@ringcentral-integration/commons/lib/di';
import { RcUIModuleV2, state, action } from '@ringcentral-integration/core';
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
    'SideDrawerUI',
  ],
})
export class LogCallUI extends RcUIModuleV2 {
  constructor(deps) {
    super({
      deps,
    });
  }

  @state
  currentCall = null;

  @action
  setCurrentCall(call) {
    this.currentCall = call;
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
    const currentCall = this.currentCall;
    const loggingMap = callLogger.loggingMap || {};
    const noteText = currentCall ? smartNotes.smartNoteTextMapping[currentCall.telephonySessionId] : '';
    return {
      sessionId: params.callSessionId,
      currentCall,
      currentLocale: locale.currentLocale,
      customizedPage: thirdPartyService.customizedLogCallPage,
      isLogging: !!loggingMap[params.callSessionId],
      smartNote: noteText || '',
    };
  }

  getUIFunctions({
    onBackButtonClick,
  }) {
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
      sideDrawerUI,
    } = this._deps;

    return {
      onBackButtonClick: onBackButtonClick ? onBackButtonClick : () => {
        routerInteraction.goBack();
      },
      onViewCall: (sessionId) => {
        const currentCall = callLogger.allCallMapping[sessionId];
        if (!currentCall) {
          sideDrawerUI.closeWidget('logCall');
          return;
        }
        this.setCurrentCall(currentCall);
      },
      async onSave({ call, note, formData }) {
        await callLogger.logCall({
          call,
          triggerType: 'logForm',
          note,
          formData,
          redirect: true,
        });
        if (sideDrawerUI.hasWidget('logCall')) {
          sideDrawerUI.closeWidget('logCall');
        } else {
          routerInteraction.goBack();
        }
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
