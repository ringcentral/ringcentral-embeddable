import 'whatwg-fetch';
import '@ringcentral-integration/commons/lib/TabFreezePrevention';
import { SDK } from '@ringcentral/sdk';
import { RingCentralClient } from '@ringcentral-integration/commons/lib/RingCentralClient';

import { ModuleFactory } from '@ringcentral-integration/commons/lib/di';
import RcModule from '@ringcentral-integration/commons/lib/RcModule';
import callDirections from '@ringcentral-integration/commons/enums/callDirections';

import AvailabilityMonitor from '@ringcentral-integration/commons/modules/AvailabilityMonitor';
import { Analytics } from '@ringcentral-integration/commons/modules/Analytics';
import { AccountInfo } from '@ringcentral-integration/commons/modules/AccountInfoV2';
import ActivityMatcher from '@ringcentral-integration/commons/modules/ActivityMatcher';
// import ActiveCalls from '@ringcentral-integration/commons/modules/ActiveCalls';
// import AddressBook from '@ringcentral-integration/commons/modules/AddressBook';
import AccountContacts from '@ringcentral-integration/commons/modules/AccountContacts';
import CompanyContacts from '@ringcentral-integration/commons/modules/CompanyContacts';
import { Brand } from '@ringcentral-integration/commons/modules/Brand';
import { Theme } from '@ringcentral-integration/commons/modules/Theme';
import { ThemeUI } from '@ringcentral-integration/widgets/modules/ThemeUI';

// import AudioSettings from '@ringcentral-integration/commons/modules/AudioSettings';
import BlockedNumber from '@ringcentral-integration/commons/modules/BlockedNumber';
import Call from '@ringcentral-integration/commons/modules/Call';
import CallMonitor from '@ringcentral-integration/commons/modules/CallMonitor';
import ConnectivityMonitor from '@ringcentral-integration/commons/modules/ConnectivityMonitor';
import ContactMatcher from '@ringcentral-integration/commons/modules/ContactMatcher';
import Contacts from '@ringcentral-integration/commons/modules/Contacts';
import ContactSearch from '@ringcentral-integration/commons/modules/ContactSearch';
import ConversationMatcher from '@ringcentral-integration/commons/modules/ConversationMatcher';
import DateTimeFormat from '@ringcentral-integration/commons/modules/DateTimeFormat';
import Presence from '@ringcentral-integration/commons/modules/Presence';
import DialingPlan from '@ringcentral-integration/commons/modules/DialingPlan';
import { DataFetcherV2 } from '@ringcentral-integration/commons/modules/DataFetcherV2';
import ExtensionDevice from '@ringcentral-integration/commons/modules/ExtensionDevice';
import { ExtensionFeatures } from '@ringcentral-integration/commons/modules/ExtensionFeatures';
import { ExtensionInfo } from '@ringcentral-integration/commons/modules/ExtensionInfoV2';
import ExtensionPhoneNumber from '@ringcentral-integration/commons/modules/ExtensionPhoneNumber';
import ForwardingNumber from '@ringcentral-integration/commons/modules/ForwardingNumber';
import GlobalStorage from '@ringcentral-integration/commons/modules/GlobalStorage';
import { Locale } from '@ringcentral-integration/commons/modules/Locale';
import NumberValidate from '@ringcentral-integration/commons/modules/NumberValidate';
import RateLimiter from '@ringcentral-integration/commons/modules/RateLimiter';
import RegionSettings from '@ringcentral-integration/commons/modules/RegionSettings';
import Ringout from '@ringcentral-integration/commons/modules/Ringout';
import { Softphone } from '@ringcentral-integration/commons/modules/Softphone';
import Storage from '@ringcentral-integration/commons/modules/Storage';
import Subscription from '@ringcentral-integration/commons/modules/Subscription';
import { TabManager } from '@ringcentral-integration/commons/modules/TabManager';
// import Webphone from '@ringcentral-integration/commons/modules/Webphone';
import Feedback from '@ringcentral-integration/commons/modules/Feedback';
import Conference from '@ringcentral-integration/commons/modules/Conference';
import RecentMessages from '@ringcentral-integration/commons/modules/RecentMessages';
import RecentCalls from '@ringcentral-integration/commons/modules/RecentCalls';
import MessageStore from '@ringcentral-integration/commons/modules/MessageStore';
import { ComposeText } from '@ringcentral-integration/commons/modules/ComposeTextV2';
// import { MessageSender } from '@ringcentral-integration/commons/modules/MessageSenderV2';
import { Conversations } from '@ringcentral-integration/commons/modules/ConversationsV2';

// import GlipCompany from '@ringcentral-integration/commons/modules/GlipCompany';
import GlipPersons from '@ringcentral-integration/commons/modules/GlipPersons';
// import GlipGroups from '@ringcentral-integration/commons/modules/GlipGroups';
import GlipPosts from '@ringcentral-integration/commons/modules/GlipPosts';

import { LocalForageStorage } from '@ringcentral-integration/commons/lib/LocalForageStorage';

import RouterInteraction from '@ringcentral-integration/widgets/modules/RouterInteraction';
import ConferenceDialerUI from '@ringcentral-integration/widgets/modules/ConferenceDialerUI';
import ConferenceUI from '@ringcentral-integration/widgets/modules/ConferenceUI';
import { ConferenceParticipantUI } from '@ringcentral-integration/widgets/modules/ConferenceParticipantUI';
import { AudioSettingsUI } from '@ringcentral-integration/widgets/modules/AudioSettingsUI';
import RegionSettingsUI from '@ringcentral-integration/widgets/modules/RegionSettingsUI';
import { CallingSettingsUI } from '@ringcentral-integration/widgets/modules/CallingSettingsUI';
import { ActiveCallsUI } from '@ringcentral-integration/widgets/modules/ActiveCallsUI';
import { ContactDetailsUI } from '@ringcentral-integration/widgets/modules/ContactDetailsUI';
import { ComposeTextUI } from '@ringcentral-integration/widgets/modules/ComposeTextUI';
import { AlertUI } from '@ringcentral-integration/widgets/modules/AlertUI';
import { ConnectivityManager } from '@ringcentral-integration/widgets/modules/ConnectivityManager';
import ConnectivityBadgeUI from '@ringcentral-integration/widgets/modules/ConnectivityBadgeUI';
import LoginUI from '@ringcentral-integration/widgets/modules/LoginUI';
import MeetingUI from '@ringcentral-integration/widgets/modules/MeetingUI';

import MeetingProvider from '@ringcentral-integration/commons/modules/MeetingProvider';
import { CallerId } from '@ringcentral-integration/commons/modules/CallerId';

import { CallBadgeUI } from '@ringcentral-integration/widgets/modules/CallBadgeUI';
import { CallHistoryUI } from '@ringcentral-integration/widgets/modules/CallHistoryUI';
import { CallsOnholdUI } from '@ringcentral-integration/widgets/modules/CallsOnholdUI';
import { DialerAndCallsTabUI } from '@ringcentral-integration/widgets/modules/DialerAndCallsTabUI';
import { SimpleCallControlUI } from '@ringcentral-integration/widgets/modules/SimpleCallControlUI';
import { IncomingCallUI } from '@ringcentral-integration/widgets/modules/IncomingCallUI';
import FlipUI from '@ringcentral-integration/widgets/modules/FlipUI';
import TransferUI from '@ringcentral-integration/widgets/modules/TransferUI';

import { ModalUI } from '@ringcentral-integration/widgets/modules/ModalUIV2';
import GenericMeetingUI from '@ringcentral-integration/widgets/modules/GenericMeetingUI';

import { SleepDetector } from '@ringcentral-integration/commons/modules/SleepDetectorV2';

import Alert from '../Alert';
import AudioSettings from '../AudioSettings';
import { SettingsUI } from '../SettingsUI';
import { DynamicBrand } from '../DynamicBrand';
import OAuth from '../OAuth';
import Auth from '../Auth';
import Environment from '../Environment';
import Adapter from '../Adapter';
import ThirdPartyService from '../ThirdPartyService';
import CallLogger from '../CallLogger';
import CallLogSection from '../CallLogSection';
import { ConversationUI } from '../ConversationUI';
import { ConversationsUI } from '../ConversationsUI';
import ConversationLogger from '../ConversationLogger';
import AppFeatures from '../AppFeatures';
import ActiveCallControl from '../ActiveCallControl';
import GlipGroups from '../GlipGroups';
import GlipCompany from '../GlipCompany';
import ErrorLogger from '../ErrorLogger';
import AddressBook from '../AddressBook';
import { ContactListUI } from '../ContactListUI';

import CallingSettings from '../CallingSettings';
import CallLog from '../CallLog';
import CallHistory from '../CallHistory';
import Meeting from '../Meeting';
import { MessageSender } from '../MessageSender';
import Webphone from '../Webphone';
import ConferenceCall from '../ConferenceCall';

import MeetingInviteModalUI from '../MeetingInviteModalUI';
import MeetingHistoryUI from '../MeetingHistoryUI';
import MeetingHomeUI from '../MeetingHomeUI';
import RcVideo from '../RcVideo';
import GenericMeeting from '../GenericMeeting';
import DialerUI from '../DialerUI';
import CallControlUI from '../CallControlUI';

import hackSend from '../../lib/hackSend';

// user Dependency Injection with decorator to create a phone class
// https://github.com/ringcentral/ringcentral-js-integration-commons/blob/master/docs/dependency-injection.md
@ModuleFactory({
  providers: [
    { provide: 'Alert', useClass: Alert },
    { provide: 'AlertUI', useClass: AlertUI },
    { provide: 'AppFeatures', useClass: AppFeatures },
    { provide: 'Brand', useClass: Brand },
    { provide: 'DynamicBrand', useClass: DynamicBrand },
    { provide: 'Theme', useClass: Theme },
    { provide: 'ThemeUI', useClass: ThemeUI },
    { provide: 'Locale', useClass: Locale },
    { provide: 'TabManager', useClass: TabManager },
    { provide: 'GlobalStorage', useClass: GlobalStorage },
    { provide: 'ConnectivityMonitor', useClass: ConnectivityMonitor },
    { provide: 'ConnectivityManager', useClass: ConnectivityManager },
    { provide: 'ConnectivityBadgeUI', useClass: ConnectivityBadgeUI },
    { provide: 'SleepDetector', useClass: SleepDetector },
    { provide: 'DataFetcherV2', useClass: DataFetcherV2 },
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
    { provide: 'ExtensionFeatures', useClass: ExtensionFeatures },
    { provide: 'DialingPlan', useClass: DialingPlan },
    { provide: 'ExtensionPhoneNumber', useClass: ExtensionPhoneNumber },
    { provide: 'ForwardingNumber', useClass: ForwardingNumber },
    { provide: 'BlockedNumber', useClass: BlockedNumber },
    { provide: 'ContactMatcher', useClass: ContactMatcher },
    { provide: 'Subscription', useClass: Subscription },
    { provide: 'RegionSettings', useClass: RegionSettings },
    { provide: 'NumberValidate', useClass: NumberValidate },
    { provide: 'Webphone', useClass: Webphone },
    { provide: 'CallerId', useClass: CallerId },
    { provide: 'CallingSettings', useClass: CallingSettings },
    { provide: 'CallingSettingsUI', useClass: CallingSettingsUI },
    { provide: 'Presence', useClass: Presence },
    { provide: 'CallLog', useClass: CallLog },
    { provide: 'Call', useClass: Call },
    { provide: 'ConferenceCall', useClass: ConferenceCall },
    { provide: 'MessageSender', useClass: MessageSender },
    { provide: 'ComposeText', useClass: ComposeText },
    { provide: 'ComposeTextUI', useClass: ComposeTextUI },
    { provide: 'ConversationsUI', useClass: ConversationsUI },
    { provide: 'ConversationUI', useClass: ConversationUI },
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
    { provide: 'ContactListUI', useClass: ContactListUI},
    { provide: 'DialerUI', useClass: DialerUI },
    { provide: 'Adapter', useClass: Adapter },
    { provide: 'RouterInteraction', useClass: RouterInteraction },
    { provide: 'Feedback', useClass: Feedback },
    { provide: 'Conference', useClass: Conference },
    { provide: 'Environment', useClass: Environment },
    { provide: 'ErrorLogger', useClass: ErrorLogger },
    { provide: 'RecentMessages', useClass: RecentMessages },
    { provide: 'RecentCalls', useClass: RecentCalls },
    { provide: 'ModalUI', useClass: ModalUI },
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
        showMMSAttachment: true,
      }
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
    { provide: 'SimpleCallControlUI', useClass: SimpleCallControlUI },
    { provide: 'ConferenceDialerUI', useClass: ConferenceDialerUI },
    { provide: 'ConferenceUI', useClass: ConferenceUI },
    { provide: 'ConferenceParticipantUI', useClass: ConferenceParticipantUI },
    { provide: 'Meeting', useClass: Meeting },
    { provide: 'Analytics', useClass: Analytics },
    { provide: 'ConversationLogger', useClass: ConversationLogger },
    { provide: 'ConversationLoggerOptions', useValue: {}, spread: true },
    { provide: 'ActiveCallsUI', useClass: ActiveCallsUI },
    { provide: 'LoginUI', useClass: LoginUI },
    { provide: 'MeetingUI', useClass: MeetingUI },
    { provide: 'SettingsUI', useClass: SettingsUI },
    { provide: 'CallBadgeUI', useClass: CallBadgeUI },
    { provide: 'CallControlUI', useClass: CallControlUI },
    { provide: 'CallHistoryUI', useClass: CallHistoryUI },
    { provide: 'CallsOnholdUI', useClass: CallsOnholdUI },
    { provide: 'DialerAndCallsTabUI', useClass: DialerAndCallsTabUI },
    { provide: 'IncomingCallUI', useClass: IncomingCallUI },
    { provide: 'FlipUI', useClass: FlipUI },
    { provide: 'TransferUI', useClass: TransferUI },
    { provide: 'RegionSettingsUI', useClass: RegionSettingsUI },
    { provide: 'MeetingInviteModalUI', useClass: MeetingInviteModalUI },
    { provide: 'MeetingProvider', useClass: MeetingProvider },
    { provide: 'RcVideo', useClass: RcVideo },
    { provide: 'GenericMeeting', useClass: GenericMeeting },
    { provide: 'GenericMeetingUI', useClass: GenericMeetingUI },
    { provide: 'MeetingHistoryUI', useClass: MeetingHistoryUI },
    { provide: 'MeetingHomeUI', useClass: MeetingHomeUI },
    {
      provide: 'RcVideoOptions',
      useValue: {
        showSaveAsDefault: true,
        enablePersonalMeeting: true,
        showAdminLock: true,
        enableScheduleOnBehalf: true,
        enableWaitingRoom: true,
        enableInvitationApi: true,
        enableHostCountryDialinNumbers: true,
        enableE2EE: true,
      },
      spread: true,
    },
    {
      provide: 'MeetingOptions',
      useValue: {
        showSaveAsDefault: true,
        enableInvitationApi: true,
        enablePersonalMeeting: false,
      },
      spread: true,
    },
    {
      provide: 'PresenceOptions',
      spread: true,
      useValue: {
        disableCache: true, // fix: can't get active calls correctly when enable cache
      },
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
      callMonitor,
      contactMatcher,
      appConfig,
      conferenceCall,
      contacts,
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
      if (!webphone._webphone) {
        return;
      }
      const sessionId = session && session.id;
      const mergingPair = conferenceCall && conferenceCall.mergingPair;
      if (mergingPair && sessionId !== mergingPair.toSessionId) {
        // close merging pair to close the merge call.
        conferenceCall.closeMergingPair();
      }
    });

    webphone.onBeforeCallEnd((session) => {
      if (!webphone._webphone) {
        return;
      }
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
      name: 'contacts',
      searchFn: async ({ queries }) => {
        const items = await contacts.matchContacts({ phoneNumbers: queries });
        return items;
      },
      readyCheckFn: () => contacts.ready,
    });

    contactSearch.addSearchSource({
      sourceName: 'contacts',
      searchFn: async ({ searchString }) => {
        const items = await contacts.searchForPhoneNumbers(searchString);
        return items;
      },
      formatFn: entities => entities,
      readyCheckFn: () => contacts.ready,
    });

    // CallMonitor configuration
    callMonitor.onRingings(() => {
      if (webphone.connected) {
        return;
      }
      // TODO refactor some of these logic into appropriate modules
      routerInteraction.push('/calls');
    });

    // TODO: use onCallUpdated API at CallMonitorV2
    callMonitor._onCallUpdated = (call) => {
      if (
        call.telephonyStatus === 'CallConnected' &&
        webphone.connected &&
        webphone.sessions.length === 0
      ) {
        routerInteraction.push('/calls');
      }
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
          this.auth.loggedIn &&
          this.appFeatures.ready
        ) {
          if (this.appFeatures.isCallingEnabled) {
            this.routerInteraction.push('/dialer');
          } else if (this.appFeatures.hasReadMessagesPermission) {
            this.routerInteraction.push('/messages');
          } else if (this.appFeatures.isContactsEnabled) {
            this.routerInteraction.push('/contacts');
          } else if (this.appFeatures.hasConferencing) {
            this.routerInteraction.push('/conference');
          } else if (this.appFeatures.hasMeetingsPermission) {
            if (this.genericMeeting.ready) {
              if (this.genericMeeting.isRCV) {
                this.routerInteraction.push('/meeting/home');
              } else {
                this.routerInteraction.push('/meeting/schedule');
              }
            }
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
  disableReadText,
  disableConferenceInvite,
  disableGlip,
  disableMeeting,
  userAgent,
  analyticsKey,
  authProxy,
  errorReportEndpoint,
  errorReportSampleRate,
  recordingLink,
  authorizationCode,
  authorizationCodeVerifier,
  defaultCallWith,
  enableFromNumberSetting,
  showMyLocationNumbers,
  disconnectInactiveWebphone,
  disableInactiveTabCallEvent,
  disableLoginPopup,
  multipleTabsSupport,
  forceCurrentWebphoneActive,
  enableWebRTCPlanB,
  fromPopup,
  enableRingtoneSettings,
  brandBaseUrl,
}) {
  let appNameForSDK = brandConfig.appName.replace(/\s+/g, '');
  if (userAgent) {
    appNameForSDK = `${userAgent} ${appNameForSDK}`;
  }
  const usePKCE = !authProxy && apiConfig.clientId && !apiConfig.clientSecret;
  const pkceEnabled = localStorage.getItem(`${prefix}-pkce-enabled`);
  if (usePKCE && !pkceEnabled) {
    // hack clean old authorization code token if auth flow change to PKCE
    const rawToken = localStorage.getItem(`sdk-${prefix}platform`);
    if (rawToken) {
      const token = JSON.parse(rawToken);
      if ((token.access_token || token.refresh_token) && !token.code_verifier) {
        localStorage.removeItem(`sdk-${prefix}platform`);
      }
    }
    localStorage.setItem(`${prefix}-pkce-enabled`, '1');
  }
  if (!usePKCE && pkceEnabled) {
    localStorage.removeItem(`${prefix}-pkce-enabled`);
  }
  const sdkConfig = {
    ...apiConfig,
    appName: appNameForSDK,
    appVersion,
    cachePrefix: `sdk-${prefix}`,
    clearCacheOnRefreshError: false,
    redirectUri: redirectUri,
  };
  if (authProxy) {
    sdkConfig.cachePrefix = `sdk-auth-proxy-${prefix}`;
    sdkConfig.authProxy = true;
    sdkConfig.authorizeEndpoint = '/authorize';
    sdkConfig.revokeEndpoint = '/logout';
  }
  @ModuleFactory({
    providers: [
      {
        provide: 'Prefix',
        useValue: prefix,
      },
      {
        provide: 'SdkConfig',
        useValue: sdkConfig,
      },
      {
        provide: 'AppConfig',
        useValue: { name: brandConfig.appName, version: appVersion },
      },
      { provide: 'BrandConfig', useValue: brandConfig },
      { provide: 'AuthOptions', useValue: { usePKCE, authProxy }, spread: true },
      {
        provide: 'OAuthOptions',
        useValue: {
          redirectUri,
          proxyUri,
          authorizationCode,
          authorizationCodeVerifier,
          disableLoginPopup,
        },
        spread: true
      },
      {
        provide: 'AdapterOptions',
        useValue: {
          stylesUri,
          enableFromNumberSetting,
          disableInactiveTabCallEvent,
          showMyLocationNumbers,
          fromPopup,
        },
        spread: true
      },
      {
        provide: 'AlertOptions',
        useValue: {
          multipleTabsSupport,
        },
        spread: true
      },
      {
        provide: 'WebphoneOptions',
        spread: true,
        useValue: {
          appKey: apiConfig.clientId,
          appName: appNameForSDK,
          appVersion,
          webphoneLogLevel: 1,
          permissionCheck: false,
          connectDelay: disconnectInactiveWebphone ? 800 : 0,
          disconnectOnInactive: disconnectInactiveWebphone,
          multipleTabsSupport,
          forceCurrentWebphoneActive,
          webphoneSDKOptions: {
            enablePlanB: enableWebRTCPlanB,
          },
        },
      },
      {
        provide: 'ConferenceCallOptions',
        spread: true,
        useValue: {
          multipleTabsSupport,
        },
      },
      {
        provide: 'FeatureConfiguration',
        useValue: {
          CallLog: !disableCall,
          RingOut: !disableCall,
          Softphone: !disableCall,
          WebPhone: !disableCall,
          Fax: !disableMessages,
          Voicemail: !disableMessages,
          Pages: !disableMessages && !disableReadText,
          SMS: !disableMessages && !disableReadText,
          Conferencing: !disableConferenceInvite,
          Glip: !disableGlip,
          Meetings: !disableMeeting,
          RingtoneSettings: enableRingtoneSettings,
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
          showCallWithJupiter: true,
        },
      },
      {
        provide: 'DynamicBrandOptions',
        useValue: {
          enableIDB: true,
          baseUrl: brandBaseUrl,
        },
      }
    ]
  })
  class Phone extends BasePhone {}
  return Phone.create();
}
