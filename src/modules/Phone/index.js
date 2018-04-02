import 'whatwg-fetch';
import SDK from 'ringcentral';
import RingCentralClient from 'ringcentral-client';

import { ModuleFactory } from 'ringcentral-integration/lib/di';
import RcModule from 'ringcentral-integration/lib/RcModule';

import AccountExtension from 'ringcentral-integration/modules/AccountExtension';
import AccountInfo from 'ringcentral-integration/modules/AccountInfo';
import AccountPhoneNumber from 'ringcentral-integration/modules/AccountPhoneNumber';
import ActivityMatcher from 'ringcentral-integration/modules/ActivityMatcher';
import ActiveCalls from 'ringcentral-integration/modules/ActiveCalls';
import AddressBook from 'ringcentral-integration/modules/AddressBook';
import AccountContacts from 'ringcentral-integration/modules/AccountContacts';
import Alert from 'ringcentral-integration/modules/Alert';
import AudioSettings from 'ringcentral-integration/modules/AudioSettings';
import BlockedNumber from 'ringcentral-integration/modules/BlockedNumber';
import Brand from 'ringcentral-integration/modules/Brand';
import Call from 'ringcentral-integration/modules/Call';
import CallHistory from 'ringcentral-integration/modules/CallHistory';
import CallingSettings from 'ringcentral-integration/modules/CallingSettings';
import CallLog from 'ringcentral-integration/modules/CallLog';
import CallMonitor from 'ringcentral-integration/modules/CallMonitor';
import ComposeText from 'ringcentral-integration/modules/ComposeText';
import ConnectivityMonitor from 'ringcentral-integration/modules/ConnectivityMonitor';
import ContactMatcher from 'ringcentral-integration/modules/ContactMatcher';
import Contacts from 'ringcentral-integration/modules/Contacts';
import ContactSearch from 'ringcentral-integration/modules/ContactSearch';
import Conversation from 'ringcentral-integration/modules/Conversation';
import ConversationMatcher from 'ringcentral-integration/modules/ConversationMatcher';
import DateTimeFormat from 'ringcentral-integration/modules/DateTimeFormat';
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
import ContactDetails from 'ringcentral-integration/modules/ContactDetails';
import Feedback from 'ringcentral-integration/modules/Feedback';

import DialerUI from 'ringcentral-widgets/modules/DialerUI';
import RouterInteraction from 'ringcentral-widgets/modules/RouterInteraction';
import OAuth from '../OAuth';
import Auth from '../Auth';
import Environment from '../Environment';
import Adapter from '../Adapter';

// user Dependency Injection with decorator to create a phone class
// https://github.com/ringcentral/ringcentral-js-integration-commons/blob/master/docs/dependency-injection.md
@ModuleFactory({
  providers: [
    { provide: 'Alert', useClass: Alert },
    { provide: 'Brand', useClass: Brand },
    { provide: 'Locale', useClass: Locale },
    { provide: 'TabManager', useClass: TabManager },
    { provide: 'GlobalStorage', useClass: GlobalStorage },
    { provide: 'ConnectivityMonitor', useClass: ConnectivityMonitor },
    { provide: 'Auth', useClass: Auth },
    { provide: 'OAuth', useClass: OAuth },
    { provide: 'Storage', useClass: Storage },
    { provide: 'AudioSettings', useClass: AudioSettings },
    { provide: 'AccountContacts', useClass: AccountContacts },
    { provide: 'RateLimiter', useClass: RateLimiter },
    { provide: 'ExtensionDevice', useClass: ExtensionDevice },
    { provide: 'Softphone', useClass: Softphone },
    { provide: 'Ringout', useClass: Ringout },
    { provide: 'AccountInfo', useClass: AccountInfo },
    { provide: 'ExtensionInfo', useClass: ExtensionInfo },
    { provide: 'RolesAndPermissions', useClass: RolesAndPermissions },
    { provide: 'DialingPlan', useClass: DialingPlan },
    { provide: 'ExtensionPhoneNumber', useClass: ExtensionPhoneNumber },
    { provide: 'ForwardingNumber', useClass: ForwardingNumber },
    { provide: 'BlockedNumber', useClass: BlockedNumber },
    { provide: 'ContactMatcher', useClass: ContactMatcher },
    { provide: 'Subscription', useClass: Subscription },
    { provide: 'RegionSettings', useClass: RegionSettings },
    { provide: 'AccountExtension', useClass: AccountExtension },
    { provide: 'NumberValidate', useClass: NumberValidate },
    { provide: 'Webphone', useClass: Webphone },
    { provide: 'CallingSettings', useClass: CallingSettings },
    { provide: 'DetailedPresence', useClass: DetailedPresence },
    { provide: 'CallLog', useClass: CallLog },
    { provide: 'Call', useClass: Call },
    { provide: 'MessageSender', useClass: MessageSender },
    { provide: 'ComposeText', useClass: ComposeText },
    { provide: 'CallMonitor', useClass: CallMonitor },
    { provide: 'CallHistory', useClass: CallHistory },
    { provide: 'ActivityMatcher', useClass: ActivityMatcher },
    { provide: 'ConversationMatcher', useClass: ConversationMatcher },
    { provide: 'ContactSearch', useClass: ContactSearch },
    { provide: 'MessageStore', useClass: MessageStore },
    { provide: 'Conversation', useClass: Conversation },
    { provide: 'DateTimeFormat', useClass: DateTimeFormat },
    { provide: 'AccountPhoneNumber', useClass: AccountPhoneNumber },
    { provide: 'AddressBook', useClass: AddressBook },
    { provide: 'Contacts', useClass: Contacts },
    { provide: 'ContactDetails', useClass: ContactDetails },
    { provide: 'Messages', useClass: Messages },
    { provide: 'DialerUI', useClass: DialerUI },
    { provide: 'Adapter', useClass: Adapter },
    { provide: 'RouterInteraction', useClass: RouterInteraction },
    { provide: 'Feedback', useClass: Feedback },
    { provide: 'ActiveCalls', useClass: ActiveCalls },
    { provide: 'Environment', useClass: Environment },
    {
      provide: 'EnvironmentOptions',
      useFactory: () => ({}),
    },
    {
      provide: 'Client',
      useFactory: ({ sdkConfig }) =>
        new RingCentralClient(new SDK(sdkConfig)),
      deps: [
        { dep: 'SdkConfig', useParam: true, },
      ],
    },
    {
      provide: 'ContactSources',
      useFactory: ({ addressBook, accountContacts }) =>
        [addressBook, accountContacts],
      deps: ['AccountContacts', 'AddressBook']
    },
  ]
})
export default class BasePhone extends RcModule {
  constructor(options) {
    super(options);
    const {
      routerInteraction,
      webphone,
      contactSearch,
      contacts,
      callMonitor,
      contactMatcher,
      appConfig,
      adapter,
    } = options;
    // Webphone configuration
    webphone._onCallEndFunc = (session) => {
      adapter.endCallNotify(session);
      if (routerInteraction.currentPath !== '/calls/active') {
        return;
      }
      const currentSession = webphone.activeSession;
      if (currentSession && session.id !== currentSession.id) {
        return;
      }
      routerInteraction.goBack();
    };
    webphone._onCallStartFunc = (session) => {
      adapter.startCallNotify(session);
      if (routerInteraction.currentPath === '/calls/active') {
        return;
      }
      routerInteraction.push('/calls/active');
    };
    webphone._onCallRingFunc = (session) => {
      adapter.ringCallNotify(session);
      if (
        webphone.ringSessions.length > 1
      ) {
        if (routerInteraction.currentPath !== '/calls') {
          routerInteraction.push('/calls');
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
      sourceName: 'contacts',
      searchFn: ({ searchString }) => {
        const items = contacts.allContacts;
        if (!searchString) {
          return items;
        }
        const searchText = searchString.toLowerCase();
        const result = [];
        items.forEach((item) => {
          const name = item.name || `${item.firstName} ${item.lastName}`;
          item.phoneNumbers.forEach((p) => {
            if (
              name.toLowerCase().indexOf(searchText) >= 0 ||
              p.phoneNumber.indexOf(searchText) >= 0
            ) {
              result.push({
                id: `${item.id}${p.phoneNumber}`,
                name,
                type: item.type,
                phoneNumber: p.phoneNumber,
                phoneType: p.phoneType.replace('Phone', ''),
                entityType: 'contact',
              });
            }
          });
        });
        return result;
      },
      formatFn: entities => entities,
      readyCheckFn: () => this.contacts.ready,
    });

    // CallMonitor configuration
    callMonitor._onRinging = async () => {
      if (webphone._webphone) {
        return;
      }
      // TODO refactor some of these logic into appropriate modules
      routerInteraction.push('/calls');
    };

    this._appConfig = appConfig;
  }

  initialize() {
    this.store.subscribe(() => {
      if (this.auth.ready) {
        if (
          this.routerInteraction.currentPath !== '/' &&
          !this.auth.loggedIn
        ) {
          this.routerInteraction.push('/');
        } else if (
          this.routerInteraction.currentPath === '/' &&
          this.auth.loggedIn
        ) {
          this.routerInteraction.push('/dialer');
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
  stylesUri,
}) {
  @ModuleFactory({
    providers: [
      { provide: 'ModuleOptions', useValue: { prefix }, spread: true },
      {
        provide: 'SdkConfig',
        useValue: {
          ...apiConfig,
          appName: brandConfig.appName,
          appVersion,
          cachePrefix: `sdk-${prefix}`,
          clearCacheOnRefreshError: false,
        },
      },
      {
        provide: 'AppConfig',
        useValue: { name: brandConfig.appName, version: appVersion },
      },
      { provide: 'BrandOptions', useValue: brandConfig, spread: true },
      { provide: 'OAuthOptions', useValue: { redirectUri }, spread: true },
      { provide: 'AdapterOptions', useValue: { stylesUri }, spread: true },
      {
        provide: 'WebphoneOptions',
        spread: true,
        useValue: {
          appKey: apiConfig.appKey,
          appName: brandConfig.appName,
          appVersion,
          webphoneLogLevel: 1,
        },
      },
    ]
  })
  class Phone extends BasePhone {}
  return Phone.create();
}
