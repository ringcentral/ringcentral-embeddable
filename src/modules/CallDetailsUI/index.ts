import { Module } from '@ringcentral-integration/commons/lib/di';
import { RcUIModuleV2, state, action, watch } from '@ringcentral-integration/core';
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
    'ComposeTextUI',
    'RegionSettings',
    'Call',
    'ThirdPartyService',
    'SideDrawerUI',
  ],
})
export class CallDetailsUI extends RcUIModuleV2 {
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

  onInitOnce() {
    watch(
      this,
      () => this._deps.callHistory.latestCalls,
      (latestCalls) => {
        if (this.currentCall) {
          const newCall = latestCalls.find(
            (call) => call.sessionId === this.currentCall.sessionId,
          );
          if (newCall) {
            this.setCurrentCall(newCall);
          } else {
            this._deps.sideDrawerUI.closeWidget('callDetails');
          }
        }
      },
    );
  }

  getUIProps({
    params,
    showContactDisplayPlaceholder = false,
    enableContactFallback = false,
  }) {
    const {
      locale,
      brand,
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
    const loggingMap  = callLogger && callLogger.loggingMap || {};
    const currentCall = this.currentCall;
    return {
      telephonySessionId: params.telephonySessionId,
      call: currentCall,
      recording: currentCall && currentCall.recording ? {
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
      aiNoted: smartNotes.aiNotedCallMapping[params.telephonySessionId],
      brand: brand.name,
      showContactDisplayPlaceholder,
      enableContactFallback,
      autoLog: !!(callLogger && callLogger.autoLog),
      isLogging: !!loggingMap[currentCall && currentCall.sessionId],
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
      smartNotes,
      thirdPartyService,
      sideDrawerUI,
      composeTextUI,
    } = this._deps;

    return {
      onViewCall: (telephonySessionId) => {
        const currentCall = callHistory.latestCalls.find((call) => call.telephonySessionId === telephonySessionId);
        if (!currentCall) {
          sideDrawerUI.closeWidget('callDetails');
          return;
        }
        this.setCurrentCall(currentCall || null);
      },
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
          sideDrawerUI.gotoLogCall(call.sessionId);
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
          sideDrawerUI.gotoContactDetails({ type, id });
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
          composeTextUI.gotoComposeText(contact, isDummyContact);
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
