import { Module } from '@ringcentral-integration/commons/lib/di';
import { RcUIModuleV2, state, action, watch } from '@ringcentral-integration/core';
import { formatNumber } from '@ringcentral-integration/commons/lib/formatNumber';

@Module({
  name: 'MessageDetailsUI',
  deps: [
    'Brand',
    'Locale',
    'Conversations',
    'DateTimeFormat',
    'RegionSettings',
    'AppFeatures',
    'ConnectivityMonitor',
    'RateLimiter',
    'MessageStore',
    'ConnectivityManager',
    'ExtensionInfo',
    'RouterInteraction',
    'ComposeText',
    'ContactSearch',
    'AccountInfo',
    'SideDrawerUI',
    'ComposeTextUI',
    'ThirdPartyService',
    { dep: 'Call', optional: true },
    { dep: 'DialerUI', optional: true },
    { dep: 'ContactDetailsUI', optional: true },
    { dep: 'ContactMatcher', optional: true },
    { dep: 'ConversationLogger', optional: true },
    { dep: 'ConversationsUIOptions', optional: true },
  ],
})
export class MessageDetailsUI extends RcUIModuleV2 {
  constructor(deps) {
    super({
      deps,
    });
  }

  @state
  message = null;

  @action
  setMessage(message) {
    this.message = message;
  }

  onInitOnce() {
    watch(
      this,
      () => this._deps.conversations.formattedConversations,
      (messages) => {
        if (this.message) {
          const newMessage = messages.find(
            (message) => message.id === this.message.id,
          );
          if (newMessage) {
            this.setMessage(newMessage);
          } else {
            this._deps.sideDrawerUI.closeWidget('messageDetails');
          }
        }
      },
    );
  }

  getUIProps({
    enableContactFallback = false,
    params,
  }) {
    const {
      conversationLogger,
      conversations,
      brand,
      locale,
      extensionInfo,
      accountInfo,
      regionSettings,
      connectivityManager,
      rateLimiter,
      call,
      appFeatures,
      contactMatcher,
      dateTimeFormat,
      connectivityMonitor,
    } = this._deps;
    return {
      messageId: params.messageId,
      message: this.message,
      showLogButton: conversationLogger.loggerSourceReady,
      logButtonTitle: conversationLogger.logButtonTitle,
      enableContactFallback,
      brand: brand.name,
      currentLocale: locale.currentLocale,
      currentSiteCode: extensionInfo?.site?.code ?? '',
      isMultipleSiteEnabled: extensionInfo?.isMultipleSiteEnabled ?? false,
      areaCode: regionSettings.areaCode,
      countryCode: regionSettings.countryCode,
      disableLinks:
        connectivityManager.isOfflineMode ||
        connectivityManager.isVoipOnlyMode ||
        rateLimiter.throttling,
      disableCallButton:
        connectivityManager.isOfflineMode ||
        connectivityManager.isWebphoneUnavailableMode ||
        connectivityManager.isWebphoneInitializing ||
        rateLimiter.throttling,
      disableClickToDial: !(call && call.isIdle),
      outboundSmsPermission: appFeatures.hasOutboundSMSPermission,
      internalSmsPermission: appFeatures.hasInternalSMSPermission,
      composeTextPermission: appFeatures.hasComposeTextPermission,
      showSpinner: !(
        locale.ready &&
        conversations.ready &&
        (!contactMatcher || contactMatcher.ready) &&
        dateTimeFormat.ready &&
        regionSettings.ready &&
        appFeatures.ready &&
        connectivityMonitor.ready &&
        rateLimiter.ready &&
        (!call || call.ready) &&
        (!conversationLogger || conversationLogger.ready)
      ),
      autoLog: !!(
        conversationLogger && conversationLogger.autoLog
      ),
      enableCDC: appFeatures.isCDCEnabled,
      maxExtensionNumberLength: accountInfo.maxExtensionNumberLength,
    };
  }

  getUIFunctions({
    dateTimeFormatter,
    onCreateContact,
    dialerRoute = '/dialer',
    composeTextRoute = '/composeText',
    previewFaxMessages,
    onFaxDownload,
  }) {
    const {
      conversations,
      sideDrawerUI,
      regionSettings,
      extensionInfo,
      accountInfo,
      dateTimeFormat,
      thirdPartyService,
      contactMatcher,
      dialerUI,
      appFeatures,
      call,
      routerInteraction,
      messageStore,
      composeText,
      contactSearch,
      conversationLogger,
      composeTextUI,
    } = this._deps;
    return {
      onViewMessage: (messageId) => {
        const message = conversations.formattedConversations.find(m => m.id === messageId);
        if (!message) {
          sideDrawerUI.closeWidget('messageDetails');
        }
        this.setMessage(message);
      },
      formatPhone: (phoneNumber: string) =>
        formatNumber({
          phoneNumber,
          areaCode: regionSettings.areaCode,
          countryCode: regionSettings.countryCode,
          maxExtensionLength: accountInfo.maxExtensionNumberLength,
          isMultipleSiteEnabled: extensionInfo.isMultipleSiteEnabled,
          siteCode: extensionInfo.site?.code,
        }),
      dateTimeFormatter:
        dateTimeFormatter ??
        ((...args) =>dateTimeFormat.formatDateTime(...args)),
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
      onCreateContact: onCreateContact
        ? async ({ phoneNumber, name, entityType }) => {
            const hasMatchNumber =
              await contactMatcher.hasMatchNumber({
                phoneNumber,
                ignoreCache: true,
              });
            // console.debug('confirm hasMatchNumber:', hasMatchNumber);
            if (!hasMatchNumber) {
              await onCreateContact({ phoneNumber, name, entityType });
              await contactMatcher.forceMatchNumber({ phoneNumber });
            }
          }
        : undefined,
      onClickToDial: dialerUI && appFeatures.isCallingEnabled
        ? (recipient) => {
            if (call.isIdle) {
              routerInteraction.push(dialerRoute);
              // for track router
              messageStore.onClickToCall({
                fromType: recipient.fromType,
              });
              dialerUI.call({
                recipient,
              });
            }
          }
        : undefined,
      onClickToSms: appFeatures.hasComposeTextPermission
        ? (contact, isDummyContact = false) => {
            composeTextUI.gotoComposeText(contact, isDummyContact);
            // for track
            messageStore.onClickToSMS();
          }
        : undefined,
      onLogConversation: async ({ redirect = true, ...options }) => {
          await conversationLogger.logConversation({
            ...options,
            redirect,
            triggerType: 'manual'
          });
        },
      onRefreshContact: ({ phoneNumber }) => {
          contactMatcher.forceMatchNumber({ phoneNumber })
        },
      markMessage: (conversationId) => {
        messageStore.unreadMessage(conversationId);
      },
      unmarkMessage: (conversationId) => {
        messageStore.readMessages(conversationId);
        messageStore.onUnmarkMessages();
      },
      deleteMessage: (conversationId) => {
        conversations.deleteConversation(conversationId);
      },
      readMessage: (conversationId) => {
        messageStore.readMessages(conversationId);
      },
      previewFaxMessages: (uri, conversationId) => {
        if (!previewFaxMessages) {
          window.open(uri);
        } else {
          previewFaxMessages(uri);
        }
        messageStore.readMessages(conversationId);
      },
      onFaxDownload,
    };
  }
}
