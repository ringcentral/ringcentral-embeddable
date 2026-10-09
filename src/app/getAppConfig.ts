import type { BrandConfig as BaseBrandConfig } from '@ringcentral-integration/commons/modules/Brand';
import type { SDKConfig } from '@ringcentral-integration/commons/lib/createSdkConfig';
import type { LoginViewOptions } from '@ringcentral-integration/micro-auth/src/app/views/LoginView';
import {
  Auth,
  OAuth,
  AccountInfo,
  Analytics,
  AppFeatures,
  AvailabilityMonitor,
  type AvailabilityMonitorOptions,
  Client,
  ConnectivityMonitor,
  Environment,
  ExtensionInfo,
  ExtensionNumberAreaCode,
  Presence,
  RateLimiter,
  RegionSettings,
  RingCentralExtensions,
} from '@ringcentral-integration/micro-auth/src/app/services';
import {
  AccountContacts,
  AddressBook,
  CompanyContacts,
  ContactInitiator,
  Contacts,
  ContactSearch,
  ContactMatcher,
  type ContactMatcherOptions,
  ActivityMatcher,
} from '@ringcentral-integration/micro-contacts/src/app/services';
import {
  ContactDetailsView,
  ContactListView,
  ContactSearchView,
} from '@ringcentral-integration/micro-contacts/src/app/views';
import {
  BlockPlugin,
  SpringThemePlugin,
  ThemePlugin,
} from '@ringcentral-integration/micro-core/src/app/plugins';
import type { BeforeunloadOptions } from '@ringcentral-integration/micro-core/src/app/services/Beforeunload/Beforeunload.interface';
import type {
  BrandConfig,
  BrandConfigOptions,
  BrowserLoggerOptions,
  LocaleOptions,
} from '@ringcentral-integration/micro-core/src/app/services';
import {
  Brand,
  Beforeunload,
  DateTimeFormat,
  Locale,
  SleepDetector,
  Theme,
  Toast,
} from '@ringcentral-integration/micro-core/src/app/services';
import {
  ModalView,
  ModalViewOptions,
  SyncTabView as MicroCoreSyncTabView,
} from '@ringcentral-integration/micro-core/src/app/views';
import {
  ComposeText as MicroMessageComposeText,
  FaxSender,
  ConversationLogger as MicroMessageConversationLogger,
  ConversationMatcher,
  Conversations,
  type ConversationsOptions,
  QueueConversations,
  MessageThread,
  type MessageThreadOptions,
  SmsConsent,
  SmsConversationsOptions,
  SmsOptOut,
  MessageStore,
  type MessageStoreOptions,
  SmsTemplate,
} from '@ringcentral-integration/micro-message/src/app/services';
import type { WebphoneOptions } from '@ringcentral-integration/micro-phone/src/app/services';
import {
  ActiveCallControl,
  AudioSettings,
  Call,
  CallLog,
  CallAction,
  CallLogger,
  CallMonitor,
  CallerId,
  CallingSettings,
  RingtoneConfiguration,
  Softphone,
  VolumeInspector,
  Webphone,
  CallQueueManagement,
  CallQueues,
  Grant,
} from '@ringcentral-integration/micro-phone/src/app/services';
import {
  GenericMeeting,
  RcVideo,
  type RcVideoOptions,
} from '@ringcentral-integration/micro-meeting/src/app/services';
import type {
  HeaderNavViewSpringOptions,
  HeaderViewOptions,
} from '@ringcentral-integration/micro-core/src/app/views';
import { PersonalMeetingSettingsViewSpring } from '@ringcentral-integration/micro-meeting/src/app/views';
import { AudioSettingsView } from '@ringcentral-integration/micro-setting/src/app/views';
import {
  SettingsView as MicroSettingsView,
  type SettingsViewOptions,
} from '@ringcentral-integration/micro-setting/src/app/views/SettingsView';
import {
  AppFeatures as AppFeaturesV2,
  Authentication,
  EmbeddableAnalytics,
  EmbeddableAuth,
  EmbeddableTrackProps,
  EmbeddableCallLogger,
  EmbeddableOAuth,
  getAnalyticsOptions,
  getAuthenticationConfig,
  GenericMeeting as GenericMeetingV2,
  RcVideo as RcVideoV2,
  TabManager,
  type TabManagerOptions,
  PopupLayoutFit,
  SmartNotes,
  ThirdParty,
} from './services';
import { getAssetBaseUrl } from '../lib/getAssetBaseUrl';
import { createCallLoggerOptions } from './services/CallLogger/createCallLoggerOptions';
import type { AdapterOptions } from './services/Adapter/AdapterOptions';
import { AccountContacts as AccountContactsV2 } from './services/AccountContacts';
import { CallAction as CallActionV2 } from './services/CallAction';
import { ContactMatcher as ContactMatcherV2 } from './services/ContactMatcher';
import { SmsOptOut as SmsOptOutV2 } from './services/SmsOptOut';
import { MeetingView, MeetingInviteView } from './views/MeetingView';
import { LogCallView } from './views/LogCallView';
import { LogMessageView } from './views/LogMessageView';
import { ContactListView as ContactListViewV2 } from './views/ContactListView/ContactList.view';
import { ContactDetailsView as ContactDetailsViewV2 } from './views/ContactDetailsView/ContactDetails.view';
import { ContactSearchView as ContactSearchViewV2 } from './views/ContactSearchView';
import {
  CallDetailView as MicroPhoneCallDetailView,
  CallView as MicroPhoneCallView,
  CallsListViewSpring as MicroPhoneCallsListView,
  ConnectingView as MicroPhoneConnectingView,
  DialerPadView,
  DialerView as MicroPhoneDialerView,
} from '@ringcentral-integration/micro-phone/src/app/views';
import { DialerPadView as DialerPadViewV2 } from './views/DialerPadView';
import { AudioSettingsView as AudioSettingsViewV2 } from './views/AudioSettingsView';
import { DialerView as DialerViewV2 } from './views/DialerView';
import { ConnectingView as ConnectingViewV2 } from './views/ConnectingView';
import {
  CallDetailView as CallDetailViewV2,
  CallsListView as CallsListViewV2,
} from './views/CallHistoryView';
import { HistoryActiveCallsView } from './views/CallHistoryView/HistoryActiveCalls.view';
import { CallHUDView } from './views/CallHUDView';
import { ExpandedView } from './views/ExpandedView';
import { FaxDetailsView } from './views/FaxDetailsView';
import { RoutedSideWidgetView } from './views/RoutedSideWidgetView';
import { SmartNotesView } from './views/SmartNotesView';
import { SideWidgetView, type SideWidgetOptions } from './views/SideWidgetView';
import { ModalView as ModalViewV2 } from './views/ModalView';
import { SyncTabView as SyncTabViewV2 } from './views/SyncTabView';
import { CallControlView as MicroPhoneCallControlView } from '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/CallControlViewSpring';
import {
  QuickAccess,
  UserGuide,
} from '@ringcentral-integration/micro-setting/src/app/services';
import type { CallQueueManagementViewOptions } from '@ringcentral-integration/micro-setting/src/app/views';
import type {
  InitiatorOptions,
  IRouterOptions,
  ISharedAppOptions,
  PortManagerOptions,
  RootOptions,
} from '@ringcentral-integration/next-core';
import {
  createMemoryHistory,
  createSharedApp,
  ModuleRef,
  render,
  RouterOptions,
  RouterPlugin,
  StoragePlugin,
} from '@ringcentral-integration/next-core';
import {
  type ComposeTextViewSpringOptions,
  ConversationsViewSpring as MicroMessageConversationsView,
  type ConversationViewSpringOptions,
  MessageThreadsView,
  SharedConversationView,
  SmsConsentDialogView,
  SmsConsentManagementView,
  SmsOptOutView,
} from '@ringcentral-integration/micro-message/src/app/views';
import { CallViewState } from '@ringcentral-integration/micro-phone/src/app/views/CallView/services';
import {
  Webphone as WebphoneV2,
  ClientInteraction,
  WebphoneMedia,
  WebphoneAlerting,
  AudioInit,
  NoiseReduction,
  VoicemailDrop,
  ActiveCallControl as ActiveCallControlV2,
  Call as CallV2,
  CallMonitor as CallMonitorV2,
  WebSocketSubscription,
  RingCentralExtensions as RingCentralExtensionsV2,
  RingCX,
  Adapter,
  MonitoredExtensions,
  CallQueueManagement as CallQueueManagementV2,
  CallQueues as CallQueuesV2,
  CallViewState as CallViewStateV2,
  MatchedContactSelection,
  createContactRendererOptions,
} from './services';
import { CallLog as CallLogV2 } from './services/CallLog';
import { ComposeText as ComposeTextV2 } from './services/ComposeText';
import { Conversations as ConversationsV2 } from './services/Conversations';
import { DoNotContact } from './services/DoNotContact';
import { ParkView } from './views/CallView/ParkView';
import { CallControlView as CallControlViewV2 } from './views/CallView/CallControlView/CallControl.view';
import { CallView as CallViewV2 } from './views/CallView/Call.view';
import { ConversationsView as ConversationsViewV2 } from './views/ConversationsView';
import { createConversationPanel } from './views/ConversationView/createConversationPanel';
import { createComposeTextPanel } from './views/ComposeTextView/createComposeTextPanel';
import { EMBEDDABLE_CALL_ACTION_OPTIONS } from './views/CallView/Call.view.options';
import { GenericMeetingView } from './views/MeetingView/GenericMeetingView';
import { AppView } from './AppView';
import type { EmbeddableFeatureConfiguration } from './services/AppFeatures';
import type { CxHostIntegration } from './services/RingCX/RingCX.interface';
import { ThirdPartyBannerView } from './views/ThirdPartyBannerView';
import { createThirdPartyIntegrationConfig } from './services/ThirdParty/ThirdParty.integrationConfig';
import { CustomizedPageView } from './views/CustomizedPageView';
import { ApplicationLogsView } from './views/ApplicationLogsView';
import { HeaderPanel } from './views/HeaderView/HeaderPanel';
import { VoicemailDropSettingsView } from './views/VoicemailDropSettingsView';
import {
  ThirdPartySettingSectionView,
} from './views/ThirdPartySettingSectionView';
import { VoicemailDropView } from './views/VoicemailDropView';
import { createSettingsPanel } from './views/SettingsView/createSettingsPanel';
import { SettingsView as SettingsViewV2 } from './views/SettingsView/Settings.view';
import { CxAgentSettingsView } from './views/CxAgentSettingsView';
import { CxAgentTabView } from './views/CxAgentTabView';
import { AudioInitView } from './views/AudioInitView';
import { ConnectivityView } from './views/ConnectivityView';
import { LoginPanel } from './views/LoginView/LoginPanel';
import {
  ConversationLogger as EmbeddableConversationLogger,
  createConversationLoggerOptions,
} from './services/ConversationLogger';
import {
  SmsTypingTimeTracker,
  type SmsTypingTimeTrackerOptions,
} from './services/SmsTypingTimeTracker';
import {
  DynamicBrand,
  type DynamicBrandOptions,
} from './services/DynamicBrand';

const DEFAULT_CONTACT_MATCH_TTL = 120 * 60 * 1000;
const DEFAULT_CONTACT_NO_MATCH_TTL = 5 * 60 * 1000;

/**
 * `Beforeunload` reads the bare `window` global when no origin window is
 * provided, which throws on the shared worker port. The worker global carries
 * the same `addEventListener` surface the module uses.
 */
const getBeforeunloadWindow = (): Window =>
  typeof window === 'undefined' ? (globalThis as unknown as Window) : window;

interface CreateAppEntryOptions<T extends typeof createSharedApp> {
  appVersion: string;
  prefix?: string;
  brandConfig: BaseBrandConfig;
  brandConfigs?: DynamicBrandOptions['brandConfigs'];
  sdkConfig: SDKConfig;
  modules: Parameters<T>[0]['modules'];
  share: ISharedAppOptions;
  analyticsKey: string;
  authorizationCode?: string;
  authorizationCodeVerifier?: string;
  authProxy?: boolean;
  disableLoginPopup?: boolean;
  externalAuthId?: string;
  redirectUri?: string;
  jwt?: string;
  proxyUri?: string;
  fromPopup?: boolean;
  mainTab?: boolean;
  enableSideWidget?: boolean;
  showSignUpButton?: boolean;
  enableVoicemailDrop?: boolean;
  disableNoiseReduction?: boolean;
  enableSmartNote?: boolean;
  enableAnalytics?: boolean;
  userAgent?: string;
  defaultAutoLogCallEnabled?: boolean;
  defaultAutoLogMessageEnabled?: boolean;
  disableInactiveTabCallEvent?: boolean;
  enableFromNumberSetting?: boolean;
  enableRingoutCallerId?: boolean;
  enableSmsSettingEvent?: boolean;
  enableTypingTimeTracking?: boolean;
  showMyLocationNumbers?: boolean;
  enableRingCX?: boolean;
  evServer?: string;
  enableAgentScript?: boolean;
  enableAudioInitPrompt?: boolean;
  enableLoadMoreCalls?: boolean;
  hideCallNote?: boolean;
}

/**
 * create app entry config
 */
export const getAppConfig = <T extends typeof createSharedApp>({
  appVersion,
  prefix,
  brandConfig,
  brandConfigs,
  sdkConfig,
  modules = [],
  share,
  analyticsKey,
  authorizationCode,
  authorizationCodeVerifier,
  authProxy = false,
  disableLoginPopup = false,
  externalAuthId,
  redirectUri,
  jwt,
  proxyUri,
  fromPopup = false,
  mainTab,
  enableSideWidget = false,
  showSignUpButton = false,
  enableVoicemailDrop = false,
  disableNoiseReduction = false,
  enableSmartNote = false,
  enableAnalytics = false,
  userAgent,
  defaultAutoLogCallEnabled = false,
  defaultAutoLogMessageEnabled = false,
  disableInactiveTabCallEvent = false,
  enableFromNumberSetting = false,
  enableRingoutCallerId = false,
  enableSmsSettingEvent = false,
  enableTypingTimeTracking = false,
  showMyLocationNumbers = false,
  enableRingCX = false,
  evServer,
  enableAgentScript = false,
  enableAudioInitPrompt = false,
  enableLoadMoreCalls = false,
  hideCallNote = false,
}: CreateAppEntryOptions<T>) => {
  const { defaultLocale } = brandConfig;

  const authenticationConfig = getAuthenticationConfig({
    prefix,
    sdkConfig,
    authorizationCode,
    authorizationCodeVerifier,
    authProxy,
    disableLoginPopup,
    externalAuthId,
    jwt,
    proxyUri,
    redirectUri, // 'http://localhost:8080/redirect.html',
  });

  if (process.env.NODE_ENV !== 'production') {
    if (!prefix) {
      throw new Error('prefix is required');
    }
  }

  const sdkParameter: SDKConfig = {
    ...sdkConfig,
    clientId: sdkConfig.clientId,
    clientSecret: sdkConfig.clientSecret,
    appVersion,
    appName: brandConfig.appName as string,
    ...authenticationConfig.sdkOptions,
    clearCacheOnRefreshError: false,
    discoveryServer: sdkConfig.discoveryServer,
    // enableDiscovery: false, // RCV's discovery server is not available for third party clients
  };

  return {
    modules: [
      // plugin
      SpringThemePlugin,
      StoragePlugin,
      RouterPlugin,
      ThemePlugin,
      BlockPlugin,
      // services
      {
        provide: Analytics,
        useClass: EmbeddableAnalytics,
      },
      EmbeddableTrackProps,
      Client,
      {
        provide: Auth,
        useClass: EmbeddableAuth,
      },
      Authentication,
      {
        provide: OAuth,
        useClass: EmbeddableOAuth,
      },
      CallerId,
      AvailabilityMonitor,
      {
        provide: RingCentralExtensions,
        useClass: RingCentralExtensionsV2,
      },
      Adapter,
      // Tracks the tab the user last interacted with, so the SharedWorker-hosted
      // webphone can target call media and ringtone at a real, focused tab.
      ClientInteraction,
      // Owns WebRTC, the microphone and the call audio element in one browser
      // tab, so the WebPhone instance itself can live in the SharedWorker.
      WebphoneMedia,
      {
        provide: Webphone,
        useClass: WebphoneV2,
      },
      // Routes the incoming ringtone to a tab that has had a user gesture, so
      // the autoplay policy cannot silence it.
      WebphoneAlerting,
      AudioInit,
      NoiseReduction,
      VoicemailDrop,
      CallingSettings,
      RegionSettings,
      Presence,
      QuickAccess,
      UserGuide,
      Contacts,
      CompanyContacts,
      {
        provide: AccountContacts,
        useClass: AccountContactsV2,
      },
      AddressBook,
      AccountInfo,
      ExtensionInfo,
      ExtensionNumberAreaCode,
      ConnectivityMonitor,
      Brand,
      Locale,
      Theme,
      Toast,
      Beforeunload,
      {
        provide: 'BeforeunloadOptions',
        useValue: {
          originWindow: getBeforeunloadWindow(),
        } satisfies BeforeunloadOptions,
      },
      Softphone,
      {
        provide: Call,
        useClass: CallV2,
      },
      SleepDetector,
      AudioSettings,
      RingtoneConfiguration,
      VolumeInspector,
      ContactSearch,
      RateLimiter,
      {
        provide: ActiveCallControl,
        useClass: ActiveCallControlV2,
      },
      {
        provide: CallLog,
        useClass: CallLogV2,
      },
      {
        provide: CallLogger,
        useClass: EmbeddableCallLogger,
      },
      {
        provide: CallAction,
        useClass: CallActionV2,
      },
      {
        provide: CallViewState,
        useClass: CallViewStateV2,
      },
      MatchedContactSelection,
      {
        provide: MicroPhoneCallControlView,
        useClass: CallControlViewV2,
      },
      {
        provide: MicroPhoneConnectingView,
        useClass: ConnectingViewV2,
      },
      {
        provide: MicroPhoneCallView,
        useClass: CallViewV2,
      },
      {
        provide: CallMonitor,
        useClass: CallMonitorV2,
      },
      {
        provide: AppFeatures,
        useClass: AppFeaturesV2,
      },
      {
        provide: MicroMessageComposeText,
        useClass: ComposeTextV2,
      },
      FaxSender,
      Environment,
      ContactInitiator,
      {
        provide: ContactMatcher,
        useClass: ContactMatcherV2,
      },
      ActivityMatcher,
      TabManager,
      PopupLayoutFit,
      DynamicBrand,
      SmartNotes,
      ThirdParty,
      RingCX,
      DoNotContact,
      // views
      {
        provide: 'LoginViewOptions',
        useFactory: (appFeatures: AppFeaturesV2): LoginViewOptions => ({
          component: LoginPanel,
          get showSignUp(): boolean {
            return appFeatures.showSignUpButton;
          },
        }),
        deps: [AppFeatures],
      },
      {
        provide: MicroCoreSyncTabView,
        useClass: SyncTabViewV2,
      },
      {
        provide: ContactDetailsView,
        useClass: ContactDetailsViewV2,
      },
      {
        provide: ContactListView,
        useClass: ContactListViewV2,
      },
      {
        provide: ContactSearchView,
        useClass: ContactSearchViewV2,
      },
      {
        provide: DialerPadView,
        useClass: DialerPadViewV2,
      },
      {
        provide: AudioSettingsView,
        useClass: AudioSettingsViewV2,
      },
      {
        provide: MicroPhoneCallsListView,
        useClass: CallsListViewV2,
      },
      {
        provide: MicroPhoneCallDetailView,
        useClass: CallDetailViewV2,
      },
      {
        provide: MicroPhoneDialerView,
        useClass: DialerViewV2,
      },
      {
        provide: ModalView,
        useClass: ModalViewV2,
      },
      MessageStore,
      {
        // Sync the same 90 days of messages as the legacy app; the default 7
        // days can leave a tab with only a few conversations to start from.
        provide: 'MessageStoreOptions',
        useValue: {
          daySpan: 90,
        } satisfies MessageStoreOptions,
      },
      {
        provide: Conversations,
        useClass: ConversationsV2,
      },
      {
        provide: 'ConversationsOptions',
        useValue: {
          enableLoadOldMessages: true,
        } satisfies ConversationsOptions,
      },
      QueueConversations,
      SmsTypingTimeTracker,
      SmsTemplate,
      {
        provide: MicroMessageConversationsView,
        useClass: ConversationsViewV2,
      },
      {
        provide: 'ConversationViewOptions',
        useFactory: (
          router: RouterPlugin,
          smsTypingTimeTracker: SmsTypingTimeTracker,
          doNotContact: DoNotContact,
          // Resolved through the `Conversations` token below, which this app
          // binds to its own subclass.
          conversations: ConversationsV2,
          messageThread: MessageThread,
          queueConversations: QueueConversations,
          connectivityMonitor: ConnectivityMonitor,
          rateLimiter: RateLimiter,
          thirdParty: ThirdParty,
          conversationLogger: EmbeddableConversationLogger,
        ) =>
          ({
            component: createConversationPanel(
              router,
              smsTypingTimeTracker,
              doNotContact,
              {
                conversations,
                messageThread,
                queueConversations,
                connectivityMonitor,
                rateLimiter,
                thirdParty,
                conversationLogger,
              },
            ),
          } satisfies ConversationViewSpringOptions),
        deps: [
          RouterPlugin,
          SmsTypingTimeTracker,
          DoNotContact,
          Conversations,
          MessageThread,
          QueueConversations,
          ConnectivityMonitor,
          RateLimiter,
          ThirdParty,
          MicroMessageConversationLogger,
        ],
      },
      {
        provide: 'ComposeTextViewSpringOptions',
        useFactory: (smsTypingTimeTracker: SmsTypingTimeTracker) =>
          ({
            component: createComposeTextPanel(smsTypingTimeTracker),
          } satisfies Partial<ComposeTextViewSpringOptions>),
        deps: [SmsTypingTimeTracker],
      },
      {
        provide: MicroSettingsView,
        useClass: SettingsViewV2,
      },
      {
        provide: SmsOptOut,
        useClass: SmsOptOutV2,
      },
      SmsOptOutView,
      SmsConsent,
      SmsConsentDialogView,
      SmsConsentManagementView,
      MessageThread,
      MessageThreadsView,
      SharedConversationView,
      {
        provide: MicroMessageConversationLogger,
        useClass: EmbeddableConversationLogger,
      },
      ConversationMatcher,
      {
        provide: GenericMeeting,
        useClass: GenericMeetingV2,
      },
      {
        provide: RcVideo,
        useClass: RcVideoV2,
      },
      GenericMeetingView,
      PersonalMeetingSettingsViewSpring,
      MeetingView,
      MeetingInviteView,
      LogCallView,
      LogMessageView,
      {
        provide: 'MeetingOptions',
        useValue: {
          enablePersonalMeeting: true,
          enableServiceWebSettings: true,
        },
      },
      {
        provide: 'RcVideoOptions',
        useValue: {
          enablePersonalMeeting: true,
          enableWaitingRoom: true,
          enableV2Api: true,
        } satisfies RcVideoOptions,
      },
      {
        provide: CallQueueManagement,
        useClass: CallQueueManagementV2,
      },
      {
        provide: CallQueues,
        useClass: CallQueuesV2,
      },
      Grant,
      MonitoredExtensions,
      ParkView,
      ApplicationLogsView,
      CustomizedPageView,
      ExpandedView,
      FaxDetailsView,
      RoutedSideWidgetView,
      SmartNotesView,
      SideWidgetView,
      ThirdPartyBannerView,
      ThirdPartySettingSectionView,
      AudioInitView,
      ConnectivityView,
      CxAgentTabView,
      CxAgentSettingsView,
      VoicemailDropView,
      VoicemailDropSettingsView,
      CallHUDView,
      {
        provide: 'HistoryActiveCallsView',
        useClass: HistoryActiveCallsView,
      },
      {
        provide: 'MessageThreadOptions',
        useValue: {
          enable: true,
        } satisfies MessageThreadOptions,
      },
      // options
      {
        provide: 'Version',
        useValue: appVersion,
      },
      {
        provide: 'WebphoneOptions',
        useFactory: (brandConfig_2: BrandConfig, sdkConfig_1: SDKConfig) =>
          ({
            // enableContactMatchWhenNewCall: true,
            appKey: sdkConfig_1.clientId!,
            appName: brandConfig_2.appName as string,
            appVersion,
          } satisfies WebphoneOptions),
        deps: ['BrandConfig', 'SdkConfig'],
      },
      {
        // When the tab carrying call media closes, `recover` moves the media to
        // a surviving tab and re-INVITEs every live call from there, the RingCX
        // offhook leg included. `end` would hang those calls up instead.
        provide: 'WebphoneV2Options',
        useValue: { mediaOwnerLossPolicy: 'recover' },
      },
      { provide: 'Subscription', useClass: WebSocketSubscription },
      {
        provide: RouterOptions,
        useValue: {
          createHistory: () => createMemoryHistory(),
        } satisfies IRouterOptions,
      },
      {
        provide: 'LocaleOptions',
        useValue: {
          defaultLocale,
        } satisfies LocaleOptions,
      },
      {
        provide: 'Prefix',
        useValue: prefix,
      },
      {
        provide: 'PortManagerOptions',
        useValue: {
          disableAutoPickMainTab: true,
        } satisfies PortManagerOptions,
      },
      {
        provide: 'TabManagerOptions',
        useValue: {
          fromPopup,
          autoMainTab: typeof mainTab === 'undefined',
          isMainTab: mainTab === true,
        } satisfies TabManagerOptions,
      },
      {
        provide: 'SdkConfig',
        useValue: {
          ...sdkParameter,
        } satisfies SDKConfig,
      },
      {
        provide: 'AuthOptions',
        useValue: authenticationConfig.authOptions,
      },
      {
        provide: 'OAuthOptions',
        useValue: authenticationConfig.oAuthOptions,
      },
      {
        provide: 'AvailabilityMonitorOptions',
        useValue: {
          enabled: true,
        } satisfies AvailabilityMonitorOptions,
      },
      {
        provide: 'BrandConfig',
        useValue: { ...brandConfig },
      },
      {
        // Brand assets are declared as root relative paths, so they must be
        // resolved against the folder hosting the app instead of the origin.
        provide: 'BrandConfigOptions',
        useValue: {
          assetOrigin: getAssetBaseUrl(),
        } satisfies BrandConfigOptions,
      },
      {
        provide: 'DynamicBrandOptions',
        useValue: {
          brandConfigs,
        } satisfies DynamicBrandOptions,
      },
      {
        provide: 'BrowserLoggerOptions',
        useValue: {
          worker: share.worker,
        } satisfies BrowserLoggerOptions,
      },
      {
        provide: 'InitiatorOptions',
        useFactory: (locale: Locale) =>
          ({
            enableNewHostDetection: true,
            getCurrentLocale: () => locale.currentLocale,
          } satisfies InitiatorOptions),
        deps: [Locale],
      },
      {
        provide: 'ModalViewOptions',
        useValue: {
          isCompact: true,
        } satisfies ModalViewOptions,
      },
      {
        provide: 'AnalyticsOptions',
        useValue: getAnalyticsOptions({
          appName: brandConfig.appName as string,
          appVersion,
          analyticsKey,
          enableAnalytics,
          userAgent,
          clientId: sdkConfig.clientId,
        }),
      },
      {
        provide: 'ContactSources',
        deps: [AccountContacts, AddressBook],
        useFactory: (
          accountContacts: AccountContacts,
          addressBook: AddressBook
        ) => [accountContacts, addressBook],
      },
      {
        provide: 'ContactMatcherOptions',
        useValue: {
          ttl: DEFAULT_CONTACT_MATCH_TTL,
          noMatchTtl: DEFAULT_CONTACT_NO_MATCH_TTL,
        } satisfies ContactMatcherOptions,
      },
      {
        provide: 'CallLoggerOptions',
        useFactory: (thirdParty: ThirdParty) =>
          createCallLoggerOptions({
            autoLog: defaultAutoLogCallEnabled,
            thirdParty,
          }),
        deps: [ThirdParty],
      },
      {
        provide: 'CallActionOptions',
        useValue: EMBEDDABLE_CALL_ACTION_OPTIONS,
      },
      {
        provide: 'ConversationLoggerOptions',
        useFactory: (thirdParty: ThirdParty, dateTimeFormat: DateTimeFormat) =>
          createConversationLoggerOptions({
            autoLog: defaultAutoLogMessageEnabled,
            dateTimeFormat,
            thirdParty,
          }),
        deps: [ThirdParty, DateTimeFormat],
      },
      {
        provide: 'SmsTypingTimeTrackerOptions',
        useValue: {
          enableTypingTimeTracking,
        } satisfies SmsTypingTimeTrackerOptions,
      },
      {
        provide: 'AdapterOptions',
        useValue: {
          disableInactiveTabCallEvent,
          enableFromNumberSetting,
          enableRingoutCallerId,
          enableSmsSettingEvent,
          showMyLocationNumbers,
        } satisfies AdapterOptions,
      },
      {
        provide: 'ThirdPartyOptions',
        useValue: {
          recordingLink: process.env.RECORDING_LINK,
        },
      },
      {
        provide: 'SideWidgetOptions',
        useValue: {
          enableSideWidget,
        } satisfies SideWidgetOptions,
      },
      {
        provide: 'FeatureConfiguration',
        useValue: {
          SignUpButton: showSignUpButton,
          NoiseReduction: !disableNoiseReduction,
          AudioInitPrompt: enableAudioInitPrompt,
          LoadMoreCalls: enableLoadMoreCalls,
          RingCX: enableRingCX,
          SmartNote: enableSmartNote,
          VoicemailDrop: enableVoicemailDrop,
        } satisfies EmbeddableFeatureConfiguration,
      },
      {
        provide: 'SettingsViewOptions',
        useFactory: (
          voicemailDrop: VoicemailDrop,
          ringCX: RingCX,
          router: RouterPlugin,
          thirdParty: ThirdParty,
          smartNotes: SmartNotes,
        ) =>
          ({
            component: createSettingsPanel({
              thirdParty,
              smartNotes,
              ringCX,
              voicemailDrop,
              onAgentSessionInfoClick: () => router.push('/settings/agent'),
              onManualDialSettingsClick: () =>
                router.push('/settings/agent/manualDial'),
              onThirdPartySectionClick: (sectionId) =>
                router.push(`/settings/thirdParty/${sectionId}`),
              onVoicemailDropSettingsLinkClick: () =>
                router.push('/settings/voicemailDrop'),
            }),
          } satisfies SettingsViewOptions),
        deps: [VoicemailDrop, RingCX, RouterPlugin, ThirdParty, SmartNotes],
      },
      {
        provide: 'RingCXOptions',
        useValue: {
          enableAgentScript,
          evServer,
          hideCallNote,
        },
      },
      // The RingCX chunk reaches the host through this token, so it does not
      // have to import the host classes into its own bundle.
      {
        provide: 'CxHostIntegration',
        useFactory: (adapter: Adapter, call: Call, ringCX: RingCX): CxHostIntegration => ({
          get isCallIdle() {
            return call.isIdle;
          },
          showClientWindow: () => adapter.showClientWindow(),
          registerExBridgeDestination: (destination, directory) => {
            ringCX.registerExBridgeDestination(destination, directory);
          },
          clearExBridgeDestination: (destination: string) => {
            ringCX.clearExBridgeDestination(destination);
          },
          dismissExCallUiForCxCall: () => {
            adapter.dismissExCallUiForCxCall();
          },
        }),
        deps: [Adapter, Call, RingCX],
      },
      {
        provide: 'SmsConversationsOptions',
        useValue: {
          // disable sms log for demo app
          supportCRMLogMessageTypes: [],
        } satisfies SmsConversationsOptions,
      },
      {
        provide: 'IntegrationConfigOptions',
        useFactory: (thirdParty: ThirdParty, moduleRef: ModuleRef) =>
          createThirdPartyIntegrationConfig(
            thirdParty,
            (contact) => {
              const contactDetailsView = moduleRef.get(
                ContactDetailsView,
              ) as ContactDetailsViewV2;
              return contactDetailsView.showContactDetails({
                ...contact,
                returnPath: moduleRef.get(RouterPlugin).currentPath,
              });
            },
          ),
        deps: [ThirdParty, ModuleRef],
      },
      {
        provide: 'ContactRendererOptions',
        useFactory: (
          matchedContactSelection: MatchedContactSelection,
          thirdParty: ThirdParty,
          conversations: Conversations,
          queueConversations: QueueConversations,
          messageThread: MessageThread,
        ) =>
          createContactRendererOptions(matchedContactSelection, thirdParty, {
            conversations,
            queueConversations,
            messageThread,
          }),
        deps: [
          MatchedContactSelection,
          ThirdParty,
          Conversations,
          QueueConversations,
          MessageThread,
        ],
      },
      {
        provide: 'HeaderNavViewOptions',
        useValue: {
          enableVideoTab: true,
        } satisfies HeaderNavViewSpringOptions,
      },
      {
        provide: 'HeaderViewOptions',
        useValue: {
          component: HeaderPanel,
        } satisfies HeaderViewOptions,
      },
      {
        provide: 'RootOptions',
        deps: [],
        useFactory: () =>
          ({
            onExpand: (expand) => {
              console.log('onExpand expand:', expand);
            },
            // The popup window is resizable. Folded, the main column fills
            // it; expanded, the main column keeps a phone-like width and the
            // side widget takes the rest, rather than splitting the window in
            // half. The column is still followed by the expanded content in
            // `SpringAppRootView` while `Root.expanded` is on.
            expandedLayoutMainClass: fromPopup
              ? 'min-w-[300px] flex-auto [&:has(~[data-sign=expandedContent])]:flex-none [&:has(~[data-sign=expandedContent])]:w-[clamp(300px,32%,400px)]'
              : 'w-[300px] min-w-[300px] max-w-[300px] flex-none',
          } satisfies RootOptions),
      },
      {
        provide: 'CallQueueManagementViewOptions',
        useValue: {
          enableCallQueueManagement: true,
        } satisfies CallQueueManagementViewOptions,
      },
      ...modules,
    ],
    main: AppView,
    render,
    share,
  };
};
