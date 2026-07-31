import type { BrandConfig as BaseBrandConfig } from '@ringcentral-integration/commons/modules/Brand';
import type { SDKConfig } from '@ringcentral-integration/commons/lib/createSdkConfig';
import {
  Auth,
  OAuth,
  AccountInfo,
  Analytics,
  AppFeatures,
  AvailabilityMonitor,
  type AvailabilityMonitorOptions,
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
  ActivityMatcher,
} from '@ringcentral-integration/micro-contacts/src/app/services';
import {
  ContactDetailsView,
  ContactListView,
} from '@ringcentral-integration/micro-contacts/src/app/views';
import { IntegrationConfigOptions } from '@ringcentral-integration/micro-setting/src/app/services';
import {
  BlockPlugin,
  SpringThemePlugin,
  ThemePlugin,
} from '@ringcentral-integration/micro-core/src/app/plugins';
import type {
  BrandConfig,
  BrowserLoggerOptions,
  LocaleOptions,
  LogOptions as LoggerLogOptions,
} from '@ringcentral-integration/micro-core/src/app/services';
import {
  Brand,
  Locale,
  SleepDetector,
  Theme,
  Toast,
} from '@ringcentral-integration/micro-core/src/app/services';
import {
  ModalView,
  ModalViewOptions,
} from '@ringcentral-integration/micro-core/src/app/views';
import {
  ComposeText,
  FaxSender,
  ConversationLogger,
  type ConversationLoggerOptions,
  ConversationMatcher,
  MessageThread,
  type MessageThreadOptions,
  SmsConversationsOptions,
  SmsOptOut,
  MessageStore,
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
  type CallLoggerOptions,
} from '@ringcentral-integration/micro-phone/src/app/services';
import {
  GenericMeeting,
  RcVideo,
  type RcVideoOptions,
} from '@ringcentral-integration/micro-meeting/src/app/services';
import type { HeaderNavViewSpringOptions } from '@ringcentral-integration/micro-core/src/app/views';
import { PersonalMeetingSettingsViewSpring } from '@ringcentral-integration/micro-meeting/src/app/views';
import type { SettingsViewOptions } from '@ringcentral-integration/micro-setting/src/app/views/SettingsView';
import {
  AppFeatures as AppFeaturesV2,
  Authentication,
  EmbeddableAnalytics,
  EmbeddableAuth,
  EmbeddableCallLogger,
  EmbeddableOAuth,
  getAnalyticsOptions,
  getAuthenticationConfig,
  GenericMeeting as GenericMeetingV2,
  RcVideo as RcVideoV2,
  TabManager,
  type TabManagerOptions,
  SmartNotes,
  ThirdParty,
} from './services';
import { AccountContacts as AccountContactsV2 } from './services/AccountContacts';
import { CallAction as CallActionV2 } from './services/CallAction';
import { SmsOptOut as SmsOptOutV2 } from './services/SmsOptOut';
import { MeetingView, MeetingInviteView } from './views/MeetingView';
import { ContactListView as ContactListViewV2 } from './views/ContactListView/ContactList.view';
import { ContactDetailsView as ContactDetailsViewV2 } from './views/ContactDetailsView/ContactDetails.view';
import {
  CallView as MicroPhoneCallView,
  DialerPadView,
  DialerView,
} from '@ringcentral-integration/micro-phone/src/app/views';
import { DialerPadView as DialerPadViewV2 } from './views/DialerPadView';
import { CallHUDView } from './views/CallHUDView';
import { ExpandedRouteView } from './views/ExpandedRouteView';
import { ExpandedView } from './views/ExpandedView';
import {
  SideWidgetView,
  type SideWidgetOptions,
} from './views/SideWidgetView';
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
  render,
  RouterOptions,
  RouterPlugin,
  StoragePlugin,
} from '@ringcentral-integration/next-core';
import {
  MessageThreadsView,
  SharedConversationView,
  SmsOptOutView,
} from '@ringcentral-integration/micro-message/src/app/views';
import { CallViewState } from '@ringcentral-integration/micro-phone/src/app/views/CallView/services';
import {
  Webphone as WebphoneV2,
  NoiseReduction,
  VoicemailDrop,
  ActiveCallControl as ActiveCallControlV2,
  CallMonitor as CallMonitorV2,
  WebSocketSubscription,
  RingCentralExtensions as RingCentralExtensionsV2,
  Adapter,
  MonitoredExtensions,
  CallQueues as CallQueuesV2,
} from './services';
import { ParkView } from './views/CallView/ParkView';
import { CallControlView as CallControlViewV2 } from './views/CallView/CallControlView/CallControl.view';
import { CallView as CallViewV2 } from './views/CallView/Call.view';
import { EMBEDDABLE_CALL_ACTION_OPTIONS } from './views/CallView/Call.view.options';
import { GenericMeetingView } from './views/MeetingView/GenericMeetingView';
import { AppView } from './AppView';
import type { EmbeddableFeatureConfiguration } from './services/AppFeatures';
import { ThirdPartyBannerView } from './views/ThirdPartyBannerView';
import { VoicemailDropSettingsView } from './views/VoicemailDropSettingsView';
import { VoicemailDropView } from './views/VoicemailDropView';
import { createSettingsPanel } from './views/SettingsView/createSettingsPanel';

interface CreateAppEntryOptions<T extends typeof createSharedApp> {
  appVersion: string;
  prefix?: string;
  brandConfig: BaseBrandConfig;
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
  enableVoicemailDrop?: boolean;
  disableNoiseReduction?: boolean;
  enableSmartNote?: boolean;
  enableAnalytics?: boolean;
}

/**
 * create app entry config
 */
export const getAppConfig = <T extends typeof createSharedApp>({
  appVersion,
  prefix,
  brandConfig,
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
  enableVoicemailDrop = false,
  disableNoiseReduction = false,
  enableSmartNote = false,
  enableAnalytics = false,
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
      {
        provide: Webphone,
        useClass: WebphoneV2,
      },
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
      Softphone,
      Call,
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
      CallLog,
      {
        provide: CallLogger,
        useClass: EmbeddableCallLogger,
      },
      {
        provide: CallAction,
        useClass: CallActionV2,
      },
      CallViewState,
      {
        provide: MicroPhoneCallControlView,
        useClass: CallControlViewV2,
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
      ComposeText,
      FaxSender,
      Environment,
      ContactInitiator,
      ContactMatcher,
      ActivityMatcher,
      TabManager,
      SmartNotes,
      ThirdParty,
      // views
      {
        provide: ContactDetailsView,
        useClass: ContactDetailsViewV2,
      },
      {
        provide: ContactListView,
        useClass: ContactListViewV2,
      },
      {
        provide: DialerPadView,
        useClass: DialerPadViewV2,
      },
      DialerView,
      ModalView,
      MessageStore,
      SmsTemplate,
      {
        provide: SmsOptOut,
        useClass: SmsOptOutV2,
      },
      SmsOptOutView,
      MessageThread,
      MessageThreadsView,
      SharedConversationView,
      ConversationLogger,
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
      CallQueueManagement,
      {
        provide: CallQueues,
        useClass: CallQueuesV2,
      },
      MonitoredExtensions,
      ParkView,
      ExpandedRouteView,
      ExpandedView,
      SideWidgetView,
      ThirdPartyBannerView,
      VoicemailDropView,
      VoicemailDropSettingsView,
      CallHUDView,
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
        provide: 'CallLoggerOptions',
        useFactory: (thirdParty: ThirdParty) =>
          ({
            async logFunction<P, S>({
              item,
              ...options
            }: LoggerLogOptions<P, S>) {
              if (!item) {
                return;
              }
              await thirdParty.logCall({
                ...(options as Record<string, unknown>),
                call: item as Parameters<ThirdParty['logCall']>[0]['call'],
              });
            },
            readyCheckFunction: () => thirdParty.callLoggerRegistered,
          } satisfies CallLoggerOptions),
        deps: [ThirdParty],
      },
      {
        provide: 'CallActionOptions',
        useValue: EMBEDDABLE_CALL_ACTION_OPTIONS,
      },
      {
        provide: 'ConversationLoggerOptions',
        useFactory: (thirdParty: ThirdParty) =>
          ({
            async logFunction<P, S>({
              item,
              ...options
            }: LoggerLogOptions<P, S>) {
              if (!item) {
                return;
              }
              await thirdParty.logConversation({
                ...(options as Record<string, unknown>),
                item: item as Parameters<
                  ThirdParty['logConversation']
                >[0]['item'],
              });
            },
            readyCheckFunction() {
              return thirdParty.messageLoggerRegistered;
            },
            isLoggedContact(conversation, lastActivity, item) {
              return lastActivity && item && lastActivity.id === item.id;
            },
            accordWithLogRequirement(conversation) {
              return true;
            },
          } satisfies ConversationLoggerOptions),
        deps: [ThirdParty],
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
          NoiseReduction: !disableNoiseReduction,
          SmartNote: enableSmartNote,
          VoicemailDrop: enableVoicemailDrop,
        } satisfies EmbeddableFeatureConfiguration,
      },
      {
        provide: 'SettingsViewOptions',
        useFactory: (
          voicemailDrop: VoicemailDrop,
          router: RouterPlugin,
          thirdParty: ThirdParty,
        ) =>
          ({
            component: createSettingsPanel({
              thirdParty,
              voicemailDrop,
              onVoicemailDropSettingsLinkClick: () =>
                router.push('/settings/voicemailDrop'),
            }),
          } satisfies SettingsViewOptions),
        deps: [VoicemailDrop, RouterPlugin, ThirdParty],
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
        useValue: {
          key: 'thirdParty',
          onViewEntity: (entity) => {
            console.log('🐞 ~ onViewEntity entity:', entity);
          },
          onCreateEntity: (entity) => {
            console.log('🐞 ~ onCreateEntity entity:', entity);
          },
        } satisfies IntegrationConfigOptions,
      },
      {
        provide: 'HeaderNavViewOptions',
        useValue: {
          enableVideoTab: true,
        } satisfies HeaderNavViewSpringOptions,
      },
      {
        provide: 'RootOptions',
        deps: [],
        useFactory: () =>
          ({
            onExpand: (expand) => {
              console.log('onExpand expand:', expand);
            },
            expandedLayoutMainClass:
              'w-[300px] min-w-[300px] max-w-[300px] flex-none',
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
