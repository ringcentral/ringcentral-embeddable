import type { BrandConfig as BaseBrandConfig } from '@ringcentral-integration/commons/modules/Brand';
import type { SDKConfig } from '@ringcentral-integration/commons/lib/createSdkConfig';
import {
  Auth,
  OAuth,
  AuthOptions,
  AccountInfo,
  Analytics,
  AnalyticsOptions,
  AppFeatures,
  AvailabilityMonitor,
  type AvailabilityMonitorOptions,
  ConnectivityMonitor,
  Environment,
  ExtensionInfo,
  ExtensionNumberAreaCode,
  Presence,
  RateLimiter,
  OAuthOptions,
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
  type CallLoggerOptions,
  type CallActionOptions,
} from '@ringcentral-integration/micro-phone/src/app/services';
import {
  GenericMeeting,
  RcVideo,
  type RcVideoOptions,
} from '@ringcentral-integration/micro-meeting/src/app/services';
import type { HeaderNavViewSpringOptions } from '@ringcentral-integration/micro-core/src/app/views';
import {
  PersonalMeetingSettingsViewSpring,
} from '@ringcentral-integration/micro-meeting/src/app/views';
import {
  AppFeatures as AppFeaturesV2,
  GenericMeeting as GenericMeetingV2,
  RcVideo as RcVideoV2,
} from './services';
import { AccountContacts as AccountContactsV2 } from './services/AccountContacts';
import { SmsOptOutV2 } from './services/SmsOptOut';
import {
  MeetingView,
  MeetingInviteView,
} from './views/MeetingView';
import { ContactListView as ContactListViewV2 } from './views/ContactListView/ContactList.view';
import { ContactDetailsView as ContactDetailsViewV2 } from './views/ContactDetailsView/ContactDetails.view';
import { DialerView } from '@ringcentral-integration/micro-phone/src/app/views';
import {
  QuickAccess,
  UserGuide,
} from '@ringcentral-integration/micro-setting/src/app/services';
import type {
  InitiatorOptions,
  IRouterOptions,
  ISharedAppOptions,
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
} from './services';
import { GenericMeetingView } from './views/MeetingView/GenericMeetingView';
import { AppView } from './AppView';

interface CreateAppEntryOptions<
  T extends typeof createSharedApp,
> {
  appVersion: string;
  prefix?: string;
  brandConfig: BaseBrandConfig;
  sdkConfig: SDKConfig;
  modules: Parameters<T>[0]['modules'];
  share: ISharedAppOptions;
  analyticsKey: string;
}

/**
 * create app entry config
 */
export const getAppConfig = <
  T extends typeof createSharedApp,
>({
  appVersion,
  prefix,
  brandConfig,
  sdkConfig,
  modules = [],
  share,
  analyticsKey,
}: CreateAppEntryOptions<T>) => {
  const { defaultLocale } = brandConfig;

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
    cachePrefix: `sdk-${prefix}`,
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
      Analytics,
      Auth,
      OAuth,
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
      CallLogger,
      CallAction,
      CallViewState,
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
      // views
      {
        provide: ContactDetailsView,
        useClass: ContactDetailsViewV2,
      },
      {
        provide: ContactListView,
        useClass: ContactListViewV2,
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
        provide: 'SdkConfig',
        useValue: {
          ...sdkParameter,
        } satisfies SDKConfig,
      },
      {
        provide: 'AuthOptions',
        useValue: { usePKCE: true } satisfies AuthOptions,
      },
      {
        provide: 'OAuthOptions',
        useValue: {
          // use redirect.html directly for we host in sub path of the app
          redirectUri: './redirect.html',
        } satisfies OAuthOptions,
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
        useValue: {
          appName: brandConfig.appName as string,
          appVersion,
          analyticsKey: analyticsKey,
        } satisfies AnalyticsOptions,
      },
      {
        provide: 'ContactSources',
        deps: [AccountContacts, AddressBook],
        useFactory: (
          accountContacts: AccountContacts,
          addressBook: AddressBook,
        ) => [accountContacts, addressBook],
      },
      {
        provide: 'CallLoggerOptions',
        useValue: {
          logFunction: async () => {
            // TODO: implement log function
          },
          readyCheckFunction: () => true,
        } satisfies CallLoggerOptions,
      },
      {
        provide: 'CallActionOptions',
        useValue: {
          expandedAbility: true,
        },
      },
      {
        provide: 'ConversationLoggerOptions',
        useValue: {
          async logFunction(e) {
            console.log('🐞 ~ logFunction e:', e);
          },
          readyCheckFunction() {
            return true;
          },
          isLoggedContact(conversation, lastActivity, item) {
            console.log('🐞 ~ isLoggedContact:', {
              conversation,
              lastActivity,
              item,
            });
            return lastActivity && item && lastActivity.id === item.id;
          },
          accordWithLogRequirement(conversation) {
            console.log('🐞 ~ conversation:', conversation);
            return true;
          },
        } satisfies ConversationLoggerOptions,
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
        useValue:
          ({
            key: 'thirdParty',
            onViewEntity: (entity) => {
              console.log('🐞 ~ onViewEntity entity:', entity);
            },
            onCreateEntity: (entity) => {
              console.log('🐞 ~ onCreateEntity entity:', entity);
            },
          } satisfies IntegrationConfigOptions)
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
          } satisfies RootOptions),
      },
      ...modules,
    ],
    main: AppView,
    render,
    share,
  };
};
