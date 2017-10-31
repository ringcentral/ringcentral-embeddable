import 'whatwg-fetch';
import SDK from 'ringcentral';
import RingCentralClient from 'ringcentral-client';

import { ModuleFactory, Module } from 'ringcentral-integration/lib/di';
import RcModule from 'ringcentral-integration/lib/RcModule';

import AccountExtension from 'ringcentral-integration/modules/AccountExtension';
import AccountInfo from 'ringcentral-integration/modules/AccountInfo';
import AccountPhoneNumber from 'ringcentral-integration/modules/AccountPhoneNumber';
import ActivityMatcher from 'ringcentral-integration/modules/ActivityMatcher';
import AddressBook from 'ringcentral-integration/modules/AddressBook';
import Alert from 'ringcentral-integration/modules/Alert';
import BlockedNumber from 'ringcentral-integration/modules/BlockedNumber';
import Brand from 'ringcentral-integration/modules/Brand';
import Call from 'ringcentral-integration/modules/Call';
import CallHistory from 'ringcentral-integration/modules/CallHistory';
import CallingSettings from 'ringcentral-integration/modules/CallingSettings';
import CallLog from 'ringcentral-integration/modules/CallLog';
import CallMonitor from 'ringcentral-integration/modules/CallMonitor';
import ComposeText from 'ringcentral-integration/modules/ComposeText';
import Conference from 'ringcentral-integration/modules/Conference';
import ConnectivityMonitor from 'ringcentral-integration/modules/ConnectivityMonitor';
import ContactMatcher from 'ringcentral-integration/modules/ContactMatcher';
import Contacts from 'ringcentral-integration/modules/Contacts';
import ContactSearch from 'ringcentral-integration/modules/ContactSearch';
import Conversation from 'ringcentral-integration/modules/Conversation';
import ConversationMatcher from 'ringcentral-integration/modules/ConversationMatcher';
import DateTimeFormat from 'ringcentral-integration/modules/DateTimeFormat';
import Presence from 'ringcentral-integration/modules/Presence';
import DetailedPresence from 'ringcentral-integration/modules/DetailedPresence';
import DialingPlan from 'ringcentral-integration/modules/DialingPlan';
import ExtensionDevice from 'ringcentral-integration/modules/ExtensionDevice';
import ExtensionInfo from 'ringcentral-integration/modules/ExtensionInfo';
import ExtensionPhoneNumber from 'ringcentral-integration/modules/ExtensionPhoneNumber';
import ForwardingNumber from 'ringcentral-integration/modules/ForwardingNumber';
import GlobalStorage from 'ringcentral-integration/modules/GlobalStorage';
import Locale from 'ringcentral-integration/modules/Locale';
import Messages from 'ringcentral-integration/modules/Messages';
import MessageSender from 'ringcentral-integration/modules/MessageSender';
import MessageStore from 'ringcentral-integration/modules/MessageStore';
import NumberValidate from 'ringcentral-integration/modules/NumberValidate';
import RateLimiter from 'ringcentral-integration/modules/RateLimiter';
import RegionSettings from 'ringcentral-integration/modules/RegionSettings';
import Ringout from 'ringcentral-integration/modules/Ringout';
import RolesAndPermissions from 'ringcentral-integration/modules/RolesAndPermissions';
import Softphone from 'ringcentral-integration/modules/Softphone';
import Storage from 'ringcentral-integration/modules/Storage';
import Subscription from 'ringcentral-integration/modules/Subscription';
import TabManager from 'ringcentral-integration/modules/TabManager';
import Webphone from 'ringcentral-integration/modules/Webphone';

import RouterInteraction from 'ringcentral-widget/modules/RouterInteraction';

import Auth from '../Auth';
import Interaction from '../Interaction';
import Environment from '../Environment';

@Module({
  deps: [
    { dep: 'RouterOption', optional: true }
  ]
})
class Router extends RouterInteraction {}

@ModuleFactory({
  providers: [
    Alert,
    Brand,
    Locale,
    TabManager,
    GlobalStorage,
    ConnectivityMonitor,
    Auth,
    Storage,
    RateLimiter,
    ExtensionDevice,
    Softphone,
    Ringout,
    AccountInfo,
    ExtensionInfo,
    RolesAndPermissions,
    DialingPlan,
    ExtensionPhoneNumber,
    ForwardingNumber,
    BlockedNumber,
    ContactMatcher,
    Subscription,
    RegionSettings,
    AccountExtension,
    NumberValidate,
    Webphone,
    CallingSettings,
    Presence,
    DetailedPresence,
    CallLog,
    Call,
    MessageSender,
    ComposeText,
    CallMonitor,
    CallHistory,
    ActivityMatcher,
    ConversationMatcher,
    ContactSearch,
    MessageStore,
    Conversation,
    DateTimeFormat,
    Conference,
    AccountPhoneNumber,
    AddressBook,
    Contacts,
    Messages,
    Interaction,
    { provide: 'Router', useClass: Router },
    { provide: 'Auth', useClass: Auth },
    { provide: 'Environment', useClass: Environment },
    {
      provide: 'EnvironmentOptions',
      useFactory: ({ sdkConfig }) => sdkConfig,
      deps: [
        { dep: 'SdkConfig' },
      ],
    },
    {
      provide: 'Client',
      useFactory: ({ sdkConfig }) =>
        new RingCentralClient(new SDK(sdkConfig)),
      deps: [
        { dep: 'SdkConfig', useParam: true, },
      ],
    },
  ]
})
export default class BasePhone extends RcModule {
  constructor(options) {
    super(options);
    const {
      router,
      webphone,
      contactSearch,
      contacts,
      callMonitor,
      contactMatcher,
      appConfig,
      interaction,
    } = options;
    // Webphone configuration
    webphone._onCallEndFunc = (session) => {
      interaction.endCallNotify(session);
      if (router.currentPath !== '/calls/active') {
        return;
      }
      const currentSession = webphone.activeSession;
      if (currentSession && session.id !== currentSession.id) {
        return;
      }
      router.goBack();
    };
    webphone._onCallStartFunc = () => {
      if (router.currentPath === '/calls/active') {
        return;
      }
      router.push('/calls/active');
    };
    webphone._onCallRingFunc = (session) => {
      interaction.ringCallNotify(session);
      if (
        webphone.ringSessions.length > 1
      ) {
        if (router.currentPath !== '/calls') {
          router.push('/calls');
        }
        webphone.ringSessions.forEach((session) => {
          webphone.toggleMinimized(session.id);
        });
      }
    };

    // ContactMatcher configuration
    contactMatcher.addSearchProvider({
      name: 'contacts',
      searchFn: async ({ queries }) => this.contacts.matchContacts({ phoneNumbers: queries }),
      readyCheckFn: () => this.contacts.ready,
    });

    // ContactSearch configuration
    contactSearch.addSearchSource({
      sourceName: 'companyContacts',
      searchFn: ({ searchString }) => {
        const items = contacts.companyContacts;
        if (!searchString) {
          return items;
        }
        const searchText = searchString.toLowerCase();
        return items.filter((item) => {
          const name = `${item.firstName} ${item.lastName}`;
          if (
            name.toLowerCase().indexOf(searchText) >= 0 ||
            item.extensionNumber.indexOf(searchText) >= 0 ||
            item.phoneNumbers.find(x => x.phoneNumber.indexOf(searchText) >= 0)
          ) {
            return true;
          }
          return false;
        });
      },
      formatFn: entities => entities.map(entity => ({
        id: entity.id.toString(),
        type: entity.type,
        name: `${entity.firstName} ${entity.lastName}`,
        hasProfileImage: !!entity.hasProfileImage,
        phoneNumbers: entity.phoneNumbers,
        phoneNumber: entity.extensionNumber,
        phoneType: 'extension',
        entityType: 'companyContact',
      })),
      readyCheckFn: () => contacts.ready,
    });
    contactSearch.addSearchSource({
      sourceName: 'personalContacts',
      searchFn: ({ searchString }) => {
        const items = contacts.personalContacts;
        if (!searchString) {
          return items;
        }
        const searchText = searchString.toLowerCase();
        return items.filter((item) => {
          const name = `${item.firstName} ${item.lastName}`;
          if (
            name.toLowerCase().indexOf(searchText) >= 0 ||
            item.phoneNumbers.find(x => x.phoneNumber.indexOf(searchText) >= 0)
          ) {
            return true;
          }
          return false;
        });
      },
      formatFn: entities => entities.map(entity => ({
        id: entity.id.toString(),
        type: entity.type,
        name: `${entity.firstName} ${entity.lastName}`,
        hasProfileImage: false,
        phoneNumbers: entity.phoneNumbers,
        phoneNumber: entity.phoneNumbers[0] && entity.phoneNumbers[0].phoneNumber,
        phoneType: entity.phoneNumbers[0] && entity.phoneNumbers[0].phoneType,
        entityType: 'personalContact',
      })),
      readyCheckFn: () => contacts.ready,
    });

    // CallMonitor configuration
    callMonitor._onRinging = async () => {
      if (this.webphone._webphone) {
        return;
      }
      // TODO refactor some of these logic into appropriate modules
      this.router.push('/calls');
    };

    this._appConfig = appConfig;
  }

  initialize() {
    this.store.subscribe(() => {
      if (this.auth.ready) {
        if (
          this.router.currentPath !== '/' &&
          !this.auth.loggedIn
        ) {
          this.router.push('/');
        } else if (
          this.router.currentPath === '/' &&
          this.auth.loggedIn
        ) {
          this.router.push('/dialer');
        }
      }
    });
  }

  get name() {
    return this._appConfig.name;
  }

  get version() {
    return this._appConfig.version;
  }
}

export function createPhone({
  prefix,
  apiConfig,
  brandConfig,
  appVersion,
  redirectUri,
}) {
  @ModuleFactory({
    providers: [
      { provide: 'ModuleOptions', useValue: { prefix }, spread: true },
      {
        provide: 'SdkConfig',
        useValue: {
          ...apiConfig,
          cachePrefix: `sdk-${prefix}`,
          clearCacheOnRefreshError: false,
        },
      },
      {
        provide: 'AppConfig',
        useValue: { name: brandConfig.appName, version: appVersion },
      },
      { provide: 'BrandOptions', useValue: brandConfig, spread: true },
      { provide: 'AuthOptions', useValue: { redirectUri }, spread: true },
      {
        provide: 'WebphoneOptions',
        spread: true,
        useValue: {
          appKey: apiConfig.appKey,
          appName: brandConfig.appName,
          appVersion,
          webphoneLogLevel: 1,
        },
        deps: [
          { dep: 'SdkConfig' },
        ],
      },
    ]
  })
  class Phone extends BasePhone {}
  return Phone.create();
}
