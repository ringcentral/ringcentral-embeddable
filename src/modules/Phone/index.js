import 'whatwg-fetch';
import SDK from 'ringcentral';
import RingCentralClient from 'ringcentral-client';

import { ModuleFactory } from 'ringcentral-integration/lib/di';
import RcModule from 'ringcentral-integration/lib/RcModule';
import callDirections from 'ringcentral-integration/enums/callDirections';

import AvailabilityMonitor from 'ringcentral-integration/modules/AvailabilityMonitor';
import Analytics from 'ringcentral-integration/modules/Analytics';
import AccountInfo from 'ringcentral-integration/modules/AccountInfo';
import ActivityMatcher from 'ringcentral-integration/modules/ActivityMatcher';
// import ActiveCalls from 'ringcentral-integration/modules/ActiveCalls';
import AddressBook from 'ringcentral-integration/modules/AddressBook';
import AccountContacts from 'ringcentral-integration/modules/AccountContacts';
import CompanyContacts from 'ringcentral-integration/modules/CompanyContacts';
import Alert from 'ringcentral-integration/modules/Alert';
// import AudioSettings from 'ringcentral-integration/modules/AudioSettings';
import BlockedNumber from 'ringcentral-integration/modules/BlockedNumber';
import Brand from 'ringcentral-integration/modules/Brand';
import Call from 'ringcentral-integration/modules/Call';
import CallHistory from 'ringcentral-integration/modules/CallHistory';
// import CallingSettings from 'ringcentral-integration/modules/CallingSettings';
import ConferenceCall from 'ringcentral-integration/modules/ConferenceCall';
// import CallLog from 'ringcentral-integration/modules/CallLog';
import CallMonitor from 'ringcentral-integration/modules/CallMonitor';
import ComposeText from 'ringcentral-integration/modules/ComposeText';
import ConnectivityMonitor from 'ringcentral-integration/modules/ConnectivityMonitor';
import ContactMatcher from 'ringcentral-integration/modules/ContactMatcher';
import Contacts from 'ringcentral-integration/modules/Contacts';
import ContactSearch from 'ringcentral-integration/modules/ContactSearch';
import ConversationMatcher from 'ringcentral-integration/modules/ConversationMatcher';
import DateTimeFormat from 'ringcentral-integration/modules/DateTimeFormat';
import Presence from 'ringcentral-integration/modules/Presence';
import DialingPlan from 'ringcentral-integration/modules/DialingPlan';
import ExtensionDevice from 'ringcentral-integration/modules/ExtensionDevice';
import ExtensionInfo from 'ringcentral-integration/modules/ExtensionInfo';
import ExtensionPhoneNumber from 'ringcentral-integration/modules/ExtensionPhoneNumber';
import ForwardingNumber from 'ringcentral-integration/modules/ForwardingNumber';
import GlobalStorage from 'ringcentral-integration/modules/GlobalStorage';
import Locale from 'ringcentral-integration/modules/Locale';
import MessageSender from 'ringcentral-integration/modules/MessageSender';
import NumberValidate from 'ringcentral-integration/modules/NumberValidate';
import RateLimiter from 'ringcentral-integration/modules/RateLimiter';
import RegionSettings from 'ringcentral-integration/modules/RegionSettings';
import Ringout from 'ringcentral-integration/modules/Ringout';
import Softphone from 'ringcentral-integration/modules/Softphone';
import Storage from 'ringcentral-integration/modules/Storage';
import Subscription from 'ringcentral-integration/modules/Subscription';
import TabManager from 'ringcentral-integration/modules/TabManager';
// import Webphone from 'ringcentral-integration/modules/Webphone';
import Feedback from 'ringcentral-integration/modules/Feedback';
import Conference from 'ringcentral-integration/modules/Conference';
import RecentMessages from 'ringcentral-integration/modules/RecentMessages';
import RecentCalls from 'ringcentral-integration/modules/RecentCalls';
import MessageStore from 'ringcentral-integration/modules/MessageStore';
import Conversations from 'ringcentral-integration/modules/Conversations';

// import GlipCompany from 'ringcentral-integration/modules/GlipCompany';
import GlipPersons from 'ringcentral-integration/modules/GlipPersons';
// import GlipGroups from 'ringcentral-integration/modules/GlipGroups';
import GlipPosts from 'ringcentral-integration/modules/GlipPosts';

import LocalForageStorage from 'ringcentral-integration/lib/LocalForageStorage';

import DialerUI from 'ringcentral-widgets/modules/DialerUI';
import RouterInteraction from 'ringcentral-widgets/modules/RouterInteraction';
import ConferenceDialerUI from 'ringcentral-widgets/modules/ConferenceDialerUI';
import ConferenceUI from 'ringcentral-widgets/modules/ConferenceUI';
import AudioSettingsUI from 'ringcentral-widgets/modules/AudioSettingsUI';
import RegionSettingsUI from 'ringcentral-widgets/modules/RegionSettingsUI';
import CallingSettingsUI from 'ringcentral-widgets/modules/CallingSettingsUI';
import SettingsPageUI from 'ringcentral-widgets/modules/SettingsPageUI';
import ActiveCallsUI from 'ringcentral-widgets/modules/ActiveCallsUI';
import { ContactDetailsUI } from 'ringcentral-widgets/modules/ContactDetailsUI';
import ComposeTextUI from 'ringcentral-widgets/modules/ComposeTextUI';
import AlertUI from 'ringcentral-widgets/modules/AlertUI';
import ConnectivityManager from 'ringcentral-widgets/modules/ConnectivityManager';
import ConnectivityBadgeUI from 'ringcentral-widgets/modules/ConnectivityBadgeUI';
import LoginUI from 'ringcentral-widgets/modules/LoginUI';
import MeetingUI from 'ringcentral-widgets/modules/MeetingUI';
import Meeting from 'ringcentral-integration/modules/Meeting';

import CallBadgeUI from 'ringcentral-widgets/modules/CallBadgeUI';
import CallHistoryUI from 'ringcentral-widgets/modules/CallHistoryUI';
import CallCtrlUI from 'ringcentral-widgets/modules/CallCtrlUI';
import FlipUI from 'ringcentral-widgets/modules/FlipUI';
import TransferUI from 'ringcentral-widgets/modules/TransferUI';
import SettingsUI from 'ringcentral-widgets/modules/SettingsUI';

import AudioSettings from '../AudioSettings';
import OAuth from '../OAuth';
import Auth from '../Auth';
import Environment from '../Environment';
import Adapter from '../Adapter';
import ThirdPartyService from '../ThirdPartyService';
import CallLogger from '../CallLogger';
import CallLogSection from '../CallLogSection';
import ConversationLogger from '../ConversationLogger';
import RolesAndPermissions from '../RolesAndPermissions';
import ActiveCallControl from '../ActiveCallControl';
import GlipGroups from '../GlipGroups';
import GlipCompany from '../GlipCompany';
import ErrorLogger from '../ErrorLogger';
import ActiveCalls from '../ActiveCalls';
import CallingSettings from '../CallingSettings';
import CallLog from '../CallLog';
import MeetingInviteModalUI from '../MeetingInviteModalUI';
import Webphone from '../Webphone';

import searchContactPhoneNumbers from '../../lib/searchContactPhoneNumbers';
import hackSend from '../../lib/hackSend';

// user Dependency Injection with decorator to create a phone class
// https://github.com/ringcentral/ringcentral-js-integration-commons/blob/master/docs/dependency-injection.md
@ModuleFactory({
  providers: [
    { provide: 'Alert', useClass: Alert },
    { provide: 'AlertUI', useClass: AlertUI },
    { provide: 'Brand', useClass: Brand },
    { provide: 'Locale', useClass: Locale },
    { provide: 'TabManager', useClass: TabManager },
    { provide: 'GlobalStorage', useClass: GlobalStorage },
    { provide: 'ConnectivityMonitor', useClass: ConnectivityMonitor },
    { provide: 'ConnectivityManager', useClass: ConnectivityManager },
    { provide: 'ConnectivityBadgeUI', useClass: ConnectivityBadgeUI },
    { provide: 'Auth', useClass: Auth },
    { provide: 'OAuth', useClass: OAuth },
    { provide: 'Storage', useClass: Storage },
    { provide: 'AudioSettings', useClass: AudioSettings },
    { provide: 'AudioSettingsUI', useClass: AudioSettingsUI },
    { provide: 'CompanyContacts', useClass: CompanyContacts },
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
    { provide: 'NumberValidate', useClass: NumberValidate },
    { provide: 'Webphone', useClass: Webphone },
    { provide: 'CallingSettings', useClass: CallingSettings },
    { provide: 'CallingSettingsUI', useClass: CallingSettingsUI },
    { provide: 'Presence', useClass: Presence },
    { provide: 'CallLog', useClass: CallLog },
    { provide: 'Call', useClass: Call },
    { provide: 'ConferenceCall', useClass: ConferenceCall },
    { provide: 'MessageSender', useClass: MessageSender },
    { provide: 'ComposeText', useClass: ComposeText },
    { provide: 'ComposeTextUI', useClass: ComposeTextUI },
    { provide: 'CallMonitor', useClass: CallMonitor },
    { provide: 'CallHistory', useClass: CallHistory },
    { provide: 'CallLogger', useClass: CallLogger },
    { provide: 'CallLogSection', useClass: CallLogSection },
    { provide: 'ActivityMatcher', useClass: ActivityMatcher },
    { provide: 'ConversationMatcher', useClass: ConversationMatcher },
    { provide: 'ContactSearch', useClass: ContactSearch },
    { provide: 'MessageStore', useClass: MessageStore },
    { provide: 'Conversations', useClass: Conversations },
    { provide: 'DateTimeFormat', useClass: DateTimeFormat },
    { provide: 'AddressBook', useClass: AddressBook },
    { provide: 'Contacts', useClass: Contacts },
    { provide: 'ContactDetailsUI', useClass: ContactDetailsUI },
    { provide: 'DialerUI', useClass: DialerUI },
    { provide: 'Adapter', useClass: Adapter },
    { provide: 'RouterInteraction', useClass: RouterInteraction },
    { provide: 'Feedback', useClass: Feedback },
    { provide: 'ActiveCalls', useClass: ActiveCalls },
    { provide: 'Conference', useClass: Conference },
    { provide: 'Environment', useClass: Environment },
    { provide: 'ErrorLogger', useClass: ErrorLogger },
    { provide: 'RecentMessages', useClass: RecentMessages },
    { provide: 'RecentCalls', useClass: RecentCalls },
    { provide: 'ThirdPartyService', useClass: ThirdPartyService },
    {
      provide: 'EnvironmentOptions',
      useFactory: () => ({}),
    },
    {
      provide: 'Client',
      useFactory: ({ sdkConfig }) => {
        if (!!window.ActiveXObject || 'ActiveXObject' in window) {
          // if the browser is IE , no cache
          return new RingCentralClient(hackSend(new SDK(sdkConfig)));
        }
        return new RingCentralClient(new SDK(sdkConfig));
      },
      deps: [
        { dep: 'SdkConfig', useParam: true, },
      ],
    },
    {
      provide: 'CompanyContactsOptions',
      useValue: {
        polling: true,
      },
      spread: true,
    },
    {
      provide: 'ContactSources',
      useFactory: ({ addressBook, accountContacts }) => [addressBook, accountContacts],
      deps: ['AccountContacts', 'AddressBook']
    },
    { provide: 'AvailabilityMonitor', useClass: AvailabilityMonitor },
    {
      provide: 'AvailabilityMonitorOptions',
      useValue: {
        enabled: true,
      },
      spread: true,
    },
    {
      provide: 'StorageOptions',
      useValue: {
        StorageProvider: LocalForageStorage, // IndexedDB
        disableAllowInactiveTabsWrite: true,
      },
      spread: true
    },
    {
      provide: 'MessageStoreOptions',
      useValue: {
        daySpan: 90,
        conversationsLoadLength: 10,
        conversationLoadLength: 15,
      },
      spread: true
    },
    {
      provide: 'ConversationsOptions',
      useValue: {
        enableLoadOldMessages: true,
      },
      spread: true
    },
    { provide: 'GlipCompany', useClass: GlipCompany },
    { provide: 'GlipGroups', useClass: GlipGroups },
    { provide: 'GlipPosts', useClass: GlipPosts },
    { provide: 'GlipPersons', useClass: GlipPersons },
    {
      provide: 'GlipPersonsOptions',
      useValue: { batchFetchDelay: 1000 },
      spread: true,
    },
    {
      provide: 'ContactMatcherOptions',
      useValue: {
        noMatchTtl: 5 * 60 * 1000,
        ttl: 120 * 60 * 1000,
      },
      spread: true,
    },
    {
      provide: 'ActivityMatcherOptions',
      useValue: {
        noMatchTtl: 120 * 60 * 1000,
        ttl: 240 * 60 * 1000,
      },
      spread: true,
    },
    { provide: 'ActiveCallControl', useClass: ActiveCallControl },
    { provide: 'ConferenceDialerUI', useClass: ConferenceDialerUI },
    { provide: 'ConferenceUI', useClass: ConferenceUI },
    { provide: 'Meeting', useClass: Meeting },
    { provide: 'Analytics', useClass: Analytics },
    { provide: 'ConversationLogger', useClass: ConversationLogger },
    { provide: 'ConversationLoggerOptions', useValue: {}, spread: true },
    { provide: 'ActiveCallsUI', useClass: ActiveCallsUI },
    { provide: 'LoginUI', useClass: LoginUI },
    { provide: 'SettingsPageUI', useClass: SettingsPageUI },
    { provide: 'MeetingUI', useClass: MeetingUI },
    { provide: 'SettingsUI', useClass: SettingsUI },
    { provide: 'CallBadgeUI', useClass: CallBadgeUI },
    { provide: 'CallCtrlUI', useClass: CallCtrlUI },
    { provide: 'CallHistoryUI', useClass: CallHistoryUI },
    { provide: 'FlipUI', useClass: FlipUI },
    { provide: 'TransferUI', useClass: TransferUI },
    { provide: 'RegionSettingsUI', useClass: RegionSettingsUI },
    { provide: 'MeetingInviteModalUI', useClass: MeetingInviteModalUI },
  ]
})
export default class BasePhone extends RcModule {
  constructor(options) {
    super(options);
    const {
      routerInteraction,
      webphone,
      contactSearch,
      callMonitor,
      contactMatcher,
      appConfig,
      conferenceCall,
    } = options;
    // Webphone configuration
    webphone.onCallEnd((session, currentSession, ringSession) => {
      const callsOnholdReg = /^\/conferenceCall\/callsOnhold\/(.+)\/(.+)$/;
      const execCallsOnhold = callsOnholdReg.exec(routerInteraction.currentPath);

      if (execCallsOnhold) {
        const fromSessionIdOfCallsOnhold = execCallsOnhold[2];
        if (!currentSession || session.id === currentSession.id) {
          routerInteraction.go(-2);
          return;
        }
        if (session.id === fromSessionIdOfCallsOnhold) {
          routerInteraction.replace('/calls/active');
          return;
        }
      }

      const withinCallCtrl = !![
        '/calls/active',
        '/conferenceCall/dialer/',
        '/conferenceCall/callsOnhold',
        '/conferenceCall/participants',
      ].find(path => routerInteraction.currentPath.indexOf(path) === 0);

      if (
        withinCallCtrl
        && (!currentSession || session.id === currentSession.id)
        && !ringSession
      ) {
        if (!currentSession) {
          routerInteraction.replace('/dialer');
          return;
        }
        if (routerInteraction.currentPath.indexOf('/calls/active') === -1) {
          routerInteraction.replace('/calls/active');
          return;
        }
        if (conferenceCall.isMerging) {
          // Do nothing, let the merge() to do the jump
          return;
        }
        routerInteraction.goBack();
        return;
      }

      if (
        currentSession
        && currentSession.id !== session.id
        && routerInteraction.currentPath === `/calls/active/${session.id}`
      ) {
        routerInteraction.replace(`/calls/active/${currentSession.id}`);
        return;
      }

      if (!currentSession && ringSession) {
        routerInteraction.push('/calls');
        return;
      }

      if (
        routerInteraction.currentPath === '/calls'
        && !callMonitor.activeRingCalls.length
        && !callMonitor.activeOnHoldCalls.length
        && !callMonitor.activeCurrentCalls.length
        && !conferenceCall.isMerging
        // && callMonitor.otherDeviceCalls.length === 0
      ) {
        routerInteraction.replace('/dialer');
      }
    });
    webphone.onCallInit((session) => {
      const path = `/calls/active/${session.id}`;
      if (routerInteraction.currentPath !== path) {
        if (routerInteraction.currentPath.indexOf('/calls/active') === 0) {
          routerInteraction.replace(path);
        } else {
          routerInteraction.push(path);
        }
      }
      contactMatcher.forceMatchNumber({ phoneNumber: session.to });
    });
    webphone.onCallStart((session) => {
      if (session.direction === callDirections.outbound) {
        return;
      }
      const path = `/calls/active/${session.id}`;
      if (routerInteraction.currentPath !== path) {
        if (routerInteraction.currentPath.indexOf('/calls/active') === 0) {
          routerInteraction.replace(path);
        } else {
          routerInteraction.push(path);
        }
      }
    });
    webphone.onCallRing((session) => {
      if (webphone.ringSessions.length > 1) {
        if (routerInteraction.currentPath !== '/calls') {
          routerInteraction.push('/calls');
        }
        webphone.ringSessions.forEach((session) => {
          if (!session.minimized) {
            webphone.toggleMinimized(session.id);
          }
        });
      }
      contactMatcher.forceMatchNumber({ phoneNumber: session.from });
    });
    webphone.onBeforeCallResume((session) => {
      const sessionId = session && session.id;
      const mergingPair = conferenceCall && conferenceCall.mergingPair;
      if (mergingPair && sessionId !== mergingPair.toSessionId) {
        // close merging pair to close the merge call.
        conferenceCall.closeMergingPair();
      }
    });

    webphone.onBeforeCallEnd((session) => {
      const mergingPair = conferenceCall && conferenceCall.mergingPair;
      if (
        session
        && mergingPair
        && (Object.values(mergingPair).indexOf(session.id) !== -1)
      ) {
        // close merging pair to close the merge call.
        conferenceCall.closeMergingPair();
      }
    });

    conferenceCall.onMergeSuccess((conferenceData) => {
      routerInteraction.push(`/calls/active/${conferenceData.sessionId}`);
    });

    // ContactMatcher configuration
    contactMatcher.addSearchProvider({
      name: 'personal',
      searchFn: ({ queries }) => {
        const result = {};
        const phoneNumbers = queries;
        phoneNumbers.forEach((phoneNumber) => {
          result[phoneNumber] = this.addressBook.matchPhoneNumber(phoneNumber);
        });
        return result;
      },
      readyCheckFn: () => this.addressBook.ready,
    });
    contactMatcher.addSearchProvider({
      name: 'company',
      searchFn: ({ queries }) => {
        const result = {};
        const phoneNumbers = queries;
        phoneNumbers.forEach((phoneNumber) => {
          result[phoneNumber] = this.accountContacts.matchPhoneNumber(phoneNumber);
        });
        return result;
      },
      readyCheckFn: () => this.accountContacts.ready,
    });

    // ContactSearch configuration
    contactSearch.addSearchSource({
      sourceName: 'personal',
      searchFn: ({ searchString }) => {
        const items = this.addressBook.contacts;
        if (!searchString) {
          return items;
        }
        return searchContactPhoneNumbers(items, searchString);
      },
      formatFn: entities => entities,
      readyCheckFn: () => this.addressBook.ready,
    });
    contactSearch.addSearchSource({
      sourceName: 'company',
      searchFn: ({ searchString }) => {
        const items = this.accountContacts.contacts;
        if (!searchString) {
          return items;
        }
        return searchContactPhoneNumbers(items, searchString);
      },
      formatFn: entities => entities,
      readyCheckFn: () => this.accountContacts.ready,
    });
    // CallMonitor configuration
    callMonitor.onRingings(async () => {
      if (webphone._webphone) {
        return;
      }
      // TODO refactor some of these logic into appropriate modules
      routerInteraction.push('/calls');
    });

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
          this.auth.loggedIn &&
          this.rolesAndPermissions.ready
        ) {
          if (this.rolesAndPermissions.callingEnabled) {
            this.routerInteraction.push('/dialer');
          } else if (this.rolesAndPermissions.messagesEnabled) {
            this.routerInteraction.push('/messages');
          } else if (this.rolesAndPermissions.contactsEnabled) {
            this.routerInteraction.push('/contacts');
          } else if (this.rolesAndPermissions.organizeConferenceEnabled) {
            this.routerInteraction.push('/conference');
          } else if (
            this.rolesAndPermissions.organizeMeetingEnabled &&
            !!this.thirdPartyService.meetingInviteTitle
          ) {
            this.routerInteraction.push('/meeting');
          } else {
            this.routerInteraction.push('/settings');
          }
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
  proxyUri,
  stylesUri,
  disableCall,
  disableMessages,
  disableConferenceInvite,
  disableGlip,
  disableConferenceCall,
  disableActiveCallControl,
  authMode,
  userAgent,
  analyticsKey,
  errorReportEndpoint,
  errorReportSampleRate,
  recordingLink,
  authorizationCode,
  defaultCallWith,
  enableFromNumberSetting,
  disconnectInactiveWebphone,
  disableInactiveTabCallEvent,
}) {
  let appNameForSDK = brandConfig.appName.replace(/\s+/g, '');
  if (userAgent) {
    appNameForSDK = `${userAgent} ${appNameForSDK}`;
  }

  @ModuleFactory({
    providers: [
      { provide: 'ModuleOptions', useValue: { prefix }, spread: true },
      {
        provide: 'SdkConfig',
        useValue: {
          ...apiConfig,
          appName: appNameForSDK,
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
      {
        provide: 'OAuthOptions',
        useValue: {
          redirectUri,
          proxyUri,
          authMode,
          authorizationCode,
        },
        spread: true
      },
      {
        provide: 'AdapterOptions',
        useValue: {
          stylesUri,
          enableFromNumberSetting,
          disableInactiveTabCallEvent,
        },
        spread: true
      },
      {
        provide: 'WebphoneOptions',
        spread: true,
        useValue: {
          appKey: apiConfig.appKey,
          appName: appNameForSDK,
          appVersion,
          webphoneLogLevel: 1,
          permissionCheck: false,
          connectDelay: disconnectInactiveWebphone ? 800 : 0,
          disconnectOnInactive: disconnectInactiveWebphone,
        },
      },
      {
        provide: 'RolesAndPermissionsOptions',
        spread: true,
        useValue: {
          disableCall,
          disableMessages,
          disableConferenceInvite,
          disableGlip,
          disableConferenceCall,
          disableActiveCallControl,
        },
      },
      {
        provide: 'AnalyticsOptions',
        useValue: {
          analyticsKey,
          appName: (userAgent ? userAgent.split('/')[0] : brandConfig.appName),
          appVersion,
          brandCode: brandConfig.brandCode,
        },
        spread: true,
      },
      {
        provide: 'ErrorLoggerOptions',
        useValue: {
          version: appVersion,
          endpoint: errorReportEndpoint,
          sampleRate: errorReportSampleRate,
        },
        spread: true,
      },
      {
        provide: 'ThirdPartyContactsOptions',
        useValue: {
          recordingLink,
        },
        spread: true,
      },
      {
        provide: 'CallOptions',
        useValue: {
          permissionCheck: false,
        },
        spread: true,
      },
      {
        provide: 'CallingSettingsOptions',
        useValue: {
          defaultCallWith,
          emergencyCallAvailable: true,
        },
        spread: true,
      },
    ]
  })
  class Phone extends BasePhone {}
  return Phone.create();
}
