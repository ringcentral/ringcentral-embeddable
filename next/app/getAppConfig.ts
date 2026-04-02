import type { BrandConfig as BaseBrandConfig } from '@ringcentral-integration/commons/modules/Brand';
import type { SDKConfig } from '@ringcentral-integration/commons/lib/createSdkConfig';
import {
  Auth,
  OAuth,
  AuthOptions,
  AccountInfo,
  Analytics,
  AnalyticsOptions,
  AvailabilityMonitor,
  type AvailabilityMonitorOptions,
  ConnectivityMonitor,
  Environment,
  ExtensionInfo,
  ExtensionNumberAreaCode,
  Presence,
  RateLimiter,
  WebSocketSubscription,
  OAuthOptions,
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
import { ContactDetailsView } from '@ringcentral-integration/micro-contacts/src/app/views';
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
} from '@ringcentral-integration/micro-message/src/app/services';
import type { WebphoneOptions } from '@ringcentral-integration/micro-phone/src/app/services';
import {
  ActiveCallControl,
  AudioSettings,
  Call,
  CallerId,
  CallingSettings,
  CallMonitor,
  RingtoneConfiguration,
  Softphone,
  VolumeInspector,
  Webphone,
  CallQueueManagement,
} from '@ringcentral-integration/micro-phone/src/app/services';
import { DialerView } from '@ringcentral-integration/micro-phone/src/app/views';
import {
  QuickAccess,
  UserGuide,
} from '@ringcentral-integration/micro-setting/src/app/services';
import type {
  InitiatorOptions,
  IRouterOptions,
  ISharedAppOptions,
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
    enableDiscovery: sdkConfig.enableDiscovery ?? true,
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
      Webphone,
      CallingSettings,
      Presence,
      QuickAccess,
      UserGuide,
      Contacts,
      CompanyContacts,
      AccountContacts,
      AddressBook,
      AccountInfo,
      ExtensionInfo,
      ExtensionNumberAreaCode,
      ConnectivityMonitor,
      Brand,
      Locale,
      Softphone,
      CallMonitor,
      Call,
      SleepDetector,
      AudioSettings,
      RingtoneConfiguration,
      VolumeInspector,
      ContactSearch,
      RateLimiter,
      ActiveCallControl,
      ComposeText,
      FaxSender,
      Environment,
      ContactInitiator,
      ContactMatcher,
      // views
      ContactDetailsView,
      DialerView,
      ModalView,
      SmsOptOut,
      SmsOptOutView,
      MessageThread,
      MessageThreadsView,
      SharedConversationView,
      ConversationLogger,
      ConversationMatcher,
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
      ...modules,
    ],
    main: AppView,
    render,
    share,
  };
};
