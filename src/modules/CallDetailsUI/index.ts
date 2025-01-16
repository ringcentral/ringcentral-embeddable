import { Module } from '@ringcentral-integration/commons/lib/di';
import { RcUIModuleV2 } from '@ringcentral-integration/core';
import { formatNumber } from '@ringcentral-integration/commons/lib/formatNumber';

@Module({
  name: 'CallDetailsUI',
  deps: [
    'Auth',
    'Brand',
    'Locale',
    'RouterInteraction',
    'AppFeatures',
    'DateTimeFormat',
    'ExtensionInfo',
    'AccountInfo',
    'ContactMatcher',
    'ContactSearch',
    'ConnectivityMonitor',
    'ConnectivityManager',
    'Call',
    'CallLog',
    'CallHistory',
    'CallLogger',
    'SmartNotes',
    'RateLimiter',
    'DialerUI',
    'ComposeText',
    'RegionSettings',
    'Call',
    'ThirdPartyService',
  ],
})
export class CallDetailsUI extends RcUIModuleV2 {
  constructor(deps) {
    super({
      deps,
    });
  }

  getUIProps({
    params,
    showContactDisplayPlaceholder = false,
    enableContactFallback = false,
  }) {
    const {
      locale,
      brand,
      callHistory,
      call,
      extensionInfo,
      appFeatures,
      accountInfo,
      callLogger,
      rateLimiter,
      connectivityMonitor,
      connectivityManager,
      smartNotes,
      regionSettings,
      auth,
    } = this._deps;
    const currentCall = callHistory.latestCalls.find((call) => call.telephonySessionId === params.telephonySessionId) || {};
    const loggingMap  = callLogger && callLogger.loggingMap || {};
    return {
      call: currentCall,
      recording: currentCall.recording ? {
        ...currentCall.recording,
        contentUri: `${currentCall.recording.contentUri}?access_token=${auth.accessToken}`,
      } : null,
      currentLocale: locale.currentLocale,
      currentSiteCode: extensionInfo.site?.code ?? '',
      areaCode: regionSettings.areaCode,
      countryCode: regionSettings.countryCode,
      isMultipleSiteEnabled: extensionInfo.isMultipleSiteEnabled ?? false,
      maxExtensionLength: accountInfo.maxExtensionNumberLength,
      outboundSmsPermission: appFeatures.hasOutboundSMSPermission,
      internalSmsPermission: appFeatures.hasInternalSMSPermission,
      disableClickToDial:
        !(call && call.isIdle) || !appFeatures.isCallingEnabled,
      showLogButton: callLogger.ready,
      hideEditLogButton: callLogger.hideEditLogButton,
      logButtonTitle: callLogger.logButtonTitle,
      disableLinks:
        !connectivityMonitor.connectivity ||
        rateLimiter.throttling,
      disableCallButton:
        connectivityManager.isOfflineMode ||
        connectivityManager.isWebphoneUnavailableMode ||
        connectivityManager.isWebphoneInitializing ||
        rateLimiter.throttling,
      aiNoted: smartNotes.aiNotedCallMapping[currentCall.telephonySessionId],
      brand: brand.name,
      showContactDisplayPlaceholder,
      enableContactFallback,
      autoLog: !!(callLogger && callLogger.autoLog),
      isLogging: !!loggingMap[currentCall.sessionId],
      readTextPermission: appFeatures.hasReadTextPermission,
      enableCDC: appFeatures.isCDCEnabled,
    };
  }

  getUIFunctions({
    onCreateContact,
    dialerRoute = '/dialer',
    composeTextRoute = '/composeText',
  }) {
    const {
      regionSettings,
      accountInfo,
      extensionInfo,
      dateTimeFormat,
      routerInteraction,
      callLogger,
      contactMatcher,
      call,
      dialerUI,
      callHistory,
      composeText,
      contactSearch,
      smartNotes,
      thirdPartyService,
    } = this._deps;

    return {
      onClose() {
        routerInteraction.goBack();
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
      onCreateContact: onCreateContact
        ? async ({ phoneNumber, name, entityType }) => {
            const hasMatchNumber =
              await contactMatcher.hasMatchNumber({
                phoneNumber,
                ignoreCache: true,
              });
            if (!hasMatchNumber) {
              await onCreateContact({ phoneNumber, name, entityType });
              await contactMatcher.forceMatchNumber({ phoneNumber });
            }
          }
        : undefined,
      isLoggedContact(call, activity, contact) {
        return (
          activity &&
          contact &&
          activity.contact &&
          (
            activity.contact === contact.id ||
            activity.contactId === contact.id ||
            activity.contact.id === contact.id
          )
        );
      },
      onLogCall: (async ({ call, contact, triggerType, redirect }) => {
        if (callLogger.showLogModal && triggerType !== 'viewLog') {
          routerInteraction.push(`/log/call/${call.sessionId}`);
          return;
        }
        await callLogger.logCall({
          call,
          contact,
          triggerType,
          redirect,
        });
      }),
      onViewContact:({ contact }) => {
        const { type, id } = contact;
        if (
          !thirdPartyService.viewMatchedContactExternal ||
          type !== thirdPartyService.sourceName
        ) {
          routerInteraction.push(`/contacts/${type}/${id}?direct=true`);
          return;
        }
        thirdPartyService.onViewMatchedContactExternal(contact);
      },
      onRefreshContact: ({ phoneNumber }) => {
        contactMatcher.forceMatchNumber({ phoneNumber })
      },
      onClickToDial: dialerUI ?
        (recipient: any) => {
          if (call.isIdle) {
            routerInteraction.push(dialerRoute);
            dialerUI.call({
              recipient,
            });
            callHistory.onClickToCall();
          }
        }
        : undefined,
      onClickToSms: composeText ?
        async (
          contact,
          isDummyContact = false,
        ) => {
          if (routerInteraction) {
            routerInteraction.push(composeTextRoute);
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
          callHistory.onClickToSMS();
        }
        : undefined,
      onViewSmartNote: ({
        telephonySessionId,
        phoneNumber,
        contact,
        direction,
      }) => {
        smartNotes.setSession({
          id: telephonySessionId,
          status: 'Disconnected',
          phoneNumber: phoneNumber,
          contact,
          direction,
        });
      },
    };
  }
}
