/** @jest-environment jsdom */

function createClass(name) {
  return class MockProvider {
    static providerName = name;
  };
}

function mockNamedModule(moduleName, exportNames) {
  jest.doMock(moduleName, () => (
    exportNames.reduce((accumulator, exportName) => ({
      ...accumulator,
      [exportName]: createClass(exportName),
    }), {})
  ));
}

function mockDefaultModule(moduleName, name) {
  jest.doMock(moduleName, () => ({
    __esModule: true,
    default: createClass(name),
  }));
}

function setupPhoneModuleMocks() {
  const moduleFactoryCalls = [];
  class MockRcModule {
    constructor(options = {}) {
      Object.assign(this, options);
      this.store = {
        subscribe: jest.fn((handler) => {
          this.storeSubscriber = handler;
          return jest.fn();
        }),
      };
    }
  }
  class MockRingCentralClient {
    constructor(sdk) {
      this.sdk = sdk;
    }
  }
  class MockSDK {
    constructor(config) {
      this.config = config;
    }
  }
  jest.doMock('whatwg-fetch', () => ({}));
  jest.doMock('@ringcentral-integration/commons/enums/callDirections', () => ({
    callDirection: {
      inbound: 'Inbound',
      outbound: 'Outbound',
    },
  }));
  jest.doMock('@ringcentral-integration/commons/lib/di', () => ({
    ModuleFactory: jest.fn((config) => (Target) => {
      moduleFactoryCalls.push(config);
      Target.providers = config.providers;
      Target.create = jest.fn(() => ({
        moduleName: Target.name,
        providers: config.providers,
      }));
      return Target;
    }),
  }));
  jest.doMock('@ringcentral-integration/commons/lib/RcModule', () => ({
    __esModule: true,
    default: MockRcModule,
  }));
  jest.doMock('@ringcentral-integration/commons/lib/LocalForageStorage', () => ({
    LocalForageStorage: createClass('LocalForageStorage'),
  }));
  jest.doMock('@ringcentral-integration/commons/lib/RingCentralClient', () => ({
    RingCentralClient: MockRingCentralClient,
  }));
  jest.doMock('@ringcentral/sdk', () => ({
    SDK: MockSDK,
  }));
  jest.doMock('../../src/lib/hackSend', () => ({
    __esModule: true,
    default: jest.fn((sdk) => ({
      hacked: sdk,
    })),
  }));
  jest.doMock('../../src/lib/lockRefresh', () => ({
    __esModule: true,
    default: jest.fn((sdk) => ({
      locked: sdk,
    })),
  }));
  mockDefaultModule('@ringcentral-integration/commons/modules/GlipPosts', 'GlipPosts');
  mockNamedModule('@ringcentral-integration/commons/modules/AccountInfo', ['AccountInfo']);
  mockNamedModule('@ringcentral-integration/commons/modules/ActivityMatcher', ['ActivityMatcher']);
  mockNamedModule('@ringcentral-integration/commons/modules/Alert', ['Alert']);
  mockNamedModule('@ringcentral-integration/commons/modules/AvailabilityMonitor', ['AvailabilityMonitor']);
  mockNamedModule('@ringcentral-integration/commons/modules/Brand', ['Brand']);
  mockNamedModule('@ringcentral-integration/commons/modules/CallerId', ['CallerId']);
  mockNamedModule('@ringcentral-integration/commons/modules/ConnectivityMonitor', ['ConnectivityMonitor']);
  mockNamedModule('@ringcentral-integration/commons/modules/Contacts', ['Contacts']);
  mockNamedModule('@ringcentral-integration/commons/modules/ContactSearch', ['ContactSearch']);
  mockNamedModule('@ringcentral-integration/commons/modules/ConversationMatcher', ['ConversationMatcher']);
  mockNamedModule('@ringcentral-integration/commons/modules/DataFetcherV2', ['DataFetcherV2']);
  mockNamedModule('@ringcentral-integration/commons/modules/DialingPlan', ['DialingPlan']);
  mockNamedModule('@ringcentral-integration/commons/modules/ExtensionDevice', ['ExtensionDevice']);
  mockNamedModule('@ringcentral-integration/commons/modules/ExtensionFeatures', ['ExtensionFeatures']);
  mockNamedModule('@ringcentral-integration/commons/modules/ExtensionInfo', ['ExtensionInfo']);
  mockNamedModule('@ringcentral-integration/commons/modules/ExtensionPhoneNumber', ['ExtensionPhoneNumber']);
  mockNamedModule('@ringcentral-integration/commons/modules/Feedback', ['Feedback']);
  mockNamedModule('@ringcentral-integration/commons/modules/ForwardingNumber', ['ForwardingNumber']);
  mockNamedModule('@ringcentral-integration/commons/modules/Locale', ['Locale']);
  mockNamedModule('@ringcentral-integration/commons/modules/Meeting', ['Meeting']);
  mockNamedModule('@ringcentral-integration/commons/modules/RateLimiter', ['RateLimiter']);
  mockNamedModule('@ringcentral-integration/commons/modules/RecentCalls', ['RecentCalls']);
  mockNamedModule('@ringcentral-integration/commons/modules/RecentMessages', ['RecentMessages']);
  mockNamedModule('@ringcentral-integration/commons/modules/RegionSettings', ['RegionSettings']);
  mockNamedModule('@ringcentral-integration/commons/modules/SleepDetector', ['SleepDetector']);
  mockNamedModule('@ringcentral-integration/commons/modules/Softphone', ['Softphone']);
  mockNamedModule('@ringcentral-integration/commons/modules/VideoConfiguration', ['VideoConfiguration']);
  mockNamedModule('@ringcentral-integration/commons/modules/WebSocketSubscription', ['WebSocketSubscription']);
  mockNamedModule('@ringcentral-integration/widgets/modules/ActiveCallsUI', ['ActiveCallsUI']);
  mockNamedModule('@ringcentral-integration/widgets/modules/CallBadgeUI', ['CallBadgeUI']);
  mockNamedModule('@ringcentral-integration/widgets/modules/CallHistoryUI', ['CallHistoryUI']);
  mockNamedModule('@ringcentral-integration/widgets/modules/CallingSettingsUI', ['CallingSettingsUI']);
  mockNamedModule('@ringcentral-integration/widgets/modules/CallsOnholdUI', ['CallsOnholdUI']);
  mockNamedModule('@ringcentral-integration/widgets/modules/ConferenceDialerUI', ['ConferenceDialerUI']);
  mockNamedModule('@ringcentral-integration/widgets/modules/ConferenceParticipantUI', ['ConferenceParticipantUI']);
  mockNamedModule('@ringcentral-integration/widgets/modules/ConnectivityBadgeUI', ['ConnectivityBadgeUI']);
  mockNamedModule('@ringcentral-integration/widgets/modules/ConnectivityManager', ['ConnectivityManager']);
  mockNamedModule('@ringcentral-integration/widgets/modules/ContactListUI', ['ContactListUI']);
  mockNamedModule('@ringcentral-integration/widgets/modules/ContactSearchUI', ['ContactSearchUI']);
  mockNamedModule('@ringcentral-integration/widgets/modules/FlipUI', ['FlipUI']);
  mockNamedModule('@ringcentral-integration/widgets/modules/GenericMeetingUI', ['GenericMeetingUI']);
  mockNamedModule('@ringcentral-integration/widgets/modules/LoginUI', ['LoginUI']);
  mockNamedModule('@ringcentral-integration/widgets/modules/ModalUI', ['ModalUI']);
  mockNamedModule('@ringcentral-integration/widgets/modules/RegionSettingsUI', ['RegionSettingsUI']);
  mockNamedModule('@ringcentral-integration/widgets/modules/RouterInteraction', ['RouterInteraction']);
  mockNamedModule('@ringcentral-integration/widgets/modules/ThemeUI', ['ThemeUI']);

  const localNamedModules = {
    '../../src/modules/AccountContacts': ['AccountContacts'],
    '../../src/modules/ActiveCallControl': ['ActiveCallControl'],
    '../../src/modules/AddressBook': ['AddressBook'],
    '../../src/modules/AlertUI': ['AlertUI'],
    '../../src/modules/Analytics': ['Analytics'],
    '../../src/modules/AppFeatures': ['AppFeatures'],
    '../../src/modules/AppViewUI': ['AppViewUI'],
    '../../src/modules/AudioSettings': ['AudioSettings'],
    '../../src/modules/AudioSettingsUI': ['AudioSettingsUI'],
    '../../src/modules/Auth': ['Auth'],
    '../../src/modules/Call': ['Call'],
    '../../src/modules/CallControlUI': ['CallControlUI'],
    '../../src/modules/CallDetailsUI': ['CallDetailsUI'],
    '../../src/modules/CallHistory': ['CallHistory'],
    '../../src/modules/CallHUDUI': ['CallHUDUI'],
    '../../src/modules/CallLog': ['CallLog'],
    '../../src/modules/CallLogger': ['CallLogger'],
    '../../src/modules/CallMonitor': ['CallMonitor'],
    '../../src/modules/CallQueuePresence': ['CallQueuePresence'],
    '../../src/modules/CallQueueSettingsUI': ['CallQueueSettingsUI'],
    '../../src/modules/CallQueues': ['CallQueues'],
    '../../src/modules/CallingSettings': ['CallingSettings'],
    '../../src/modules/CallsListUI': ['CallsListUI'],
    '../../src/modules/CompanyContacts': ['CompanyContacts'],
    '../../src/modules/ComposeText': ['ComposeText'],
    '../../src/modules/ComposeTextUI': ['ComposeTextUI'],
    '../../src/modules/ConferenceCall': ['ConferenceCall'],
    '../../src/modules/ContactDetailsUI': ['ContactDetailsUI'],
    '../../src/modules/ContactMatcher': ['ContactMatcher'],
    '../../src/modules/ConversationLogger': ['ConversationLogger'],
    '../../src/modules/ConversationUI': ['ConversationUI'],
    '../../src/modules/Conversations': ['Conversations'],
    '../../src/modules/ConversationsUI': ['ConversationsUI'],
    '../../src/modules/CustomizedPageUI': ['CustomizedPageUI'],
    '../../src/modules/DateTimeFormat': ['DateTimeFormat'],
    '../../src/modules/DialerUI': ['DialerUI'],
    '../../src/modules/DynamicBrand': ['DynamicBrand'],
    '../../src/modules/Environment': ['Environment'],
    '../../src/modules/GenericMeeting': ['GenericMeeting'],
    '../../src/modules/GlipChatUI': ['GlipChatUI'],
    '../../src/modules/GlipGroupsUI': ['GlipGroupsUI'],
    '../../src/modules/GlobalStorage': ['GlobalStorage'],
    '../../src/modules/GrantExtensions': ['GrantExtensions'],
    '../../src/modules/IncomingCallUI': ['IncomingCallUI'],
    '../../src/modules/LogCallUI': ['LogCallUI'],
    '../../src/modules/LogMessagesUI': ['LogMessagesUI'],
    '../../src/modules/MainViewUI': ['MainViewUI'],
    '../../src/modules/MeetingHistoryUI': ['MeetingHistoryUI'],
    '../../src/modules/MeetingHomeUI': ['MeetingHomeUI'],
    '../../src/modules/MeetingInviteModalUI': ['MeetingInviteUI'],
    '../../src/modules/MessageDetailsUI': ['MessageDetailsUI'],
    '../../src/modules/MessageSender': ['MessageSender'],
    '../../src/modules/MessageStore': ['MessageStore'],
    '../../src/modules/MessageThreadEntries': ['MessageThreadEntries'],
    '../../src/modules/MessageThreads': ['MessageThreads'],
    '../../src/modules/MonitoredExtensions': ['MonitoredExtensions'],
    '../../src/modules/NoiseReduction': ['NoiseReduction'],
    '../../src/modules/NumberValidate': ['NumberValidate'],
    '../../src/modules/OAuth': ['OAuth'],
    '../../src/modules/ParkUI': ['ParkUI'],
    '../../src/modules/PhoneNumberFormat': ['PhoneNumberFormat'],
    '../../src/modules/PhoneNumberFormatSettingUI': ['PhoneNumberFormatSettingUI'],
    '../../src/modules/PhoneTabsUI': ['PhoneTabsUI'],
    '../../src/modules/Presence': ['Presence'],
    '../../src/modules/RcVideo': ['RcVideo'],
    '../../src/modules/RingCentralExtensions': ['RingCentralExtensions'],
    '../../src/modules/Ringout': ['Ringout'],
    '../../src/modules/RingtoneSettingsUI': ['RingtoneSettingsUI'],
    '../../src/modules/SettingsUI': ['SettingsUI'],
    '../../src/modules/SideDrawerUI': ['SideDrawerUI'],
    '../../src/modules/SimpleCallControlUI': ['SimpleCallControlUI'],
    '../../src/modules/SmartNotes': ['SmartNotes'],
    '../../src/modules/SmartNotesUI': ['SmartNotesUI'],
    '../../src/modules/SmsTemplates': ['SmsTemplates'],
    '../../src/modules/SmsTypingTimeTracker': ['SmsTypingTimeTracker'],
    '../../src/modules/Storage': ['Storage'],
    '../../src/modules/TabManager': ['TabManager'],
    '../../src/modules/TextSettingUI': ['TextSettingUI'],
    '../../src/modules/Theme': ['Theme'],
    '../../src/modules/ThemeSettingUI': ['ThemeSettingUI'],
    '../../src/modules/ThirdPartySettingSectionUI': ['ThirdPartySettingSectionUI'],
    '../../src/modules/TransferUI': ['TransferUI'],
    '../../src/modules/VoicemailDrop': ['VoicemailDrop'],
    '../../src/modules/VoicemailDropSettingsUI': ['VoicemailDropSettingsUI'],
    '../../src/modules/VoicemailDropUI': ['VoicemailDropUI'],
    '../../src/modules/WebphoneV2': ['Webphone'],
    '../../src/modules/WidgetAppsUI': ['WidgetAppsUI'],
  };
  Object.entries(localNamedModules).forEach(([moduleName, exportNames]) => {
    mockNamedModule(moduleName, exportNames);
  });
  mockDefaultModule('../../src/modules/Adapter', 'Adapter');
  mockDefaultModule('../../src/modules/GlipCompany', 'GlipCompany');
  mockDefaultModule('../../src/modules/GlipGroups', 'GlipGroups');
  mockDefaultModule('../../src/modules/GlipPersons', 'GlipPersons');
  mockDefaultModule('../../src/modules/ThirdPartyService', 'ThirdPartyService');
  return {
    moduleFactoryCalls,
    MockRingCentralClient,
    MockSDK,
  };
}

function loadPhoneModule() {
  let loadedModule;
  let mockContext;
  jest.isolateModules(() => {
    mockContext = setupPhoneModuleMocks();
    loadedModule = require('../../src/modules/Phone');
  });
  return {
    ...loadedModule,
    ...mockContext,
  };
}

function createPhoneOptions(overrides = {}) {
  const callbacks = {};
  const routerInteraction = {
    currentPath: '/dialer',
    go: jest.fn(),
    goBack: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  };
  const webphone = {
    _webphone: {},
    connected: false,
    onBeforeCallEnd: jest.fn((handler) => {
      callbacks.beforeCallEnd = handler;
    }),
    onBeforeCallResume: jest.fn((handler) => {
      callbacks.beforeCallResume = handler;
    }),
    onCallEnd: jest.fn((handler) => {
      callbacks.callEnd = handler;
    }),
    onCallInit: jest.fn((handler) => {
      callbacks.callInit = handler;
    }),
    onCallRing: jest.fn((handler) => {
      callbacks.callRing = handler;
    }),
    onCallStart: jest.fn((handler) => {
      callbacks.callStart = handler;
    }),
    ringSessions: [],
    sessions: [],
    toggleMinimized: jest.fn(),
  };
  const contacts = {
    matchContacts: jest.fn(async ({ phoneNumbers }) => phoneNumbers.map((phoneNumber) => ({ phoneNumber }))),
    ready: true,
    searchForPhoneNumbers: jest.fn(async (searchString) => [{ phoneNumber: searchString }]),
  };
  const contactMatcher = {
    addSearchProvider: jest.fn(),
    forceMatchNumber: jest.fn(),
  };
  const contactSearch = {
    addSearchSource: jest.fn(),
  };
  const callMonitorCallbacks = {};
  const callMonitor = {
    onCallRinging: jest.fn((handler) => {
      callMonitorCallbacks.ringing = handler;
    }),
    onCallUpdated: jest.fn((handler) => {
      callMonitorCallbacks.updated = handler;
    }),
  };
  const conferenceCallbacks = {};
  const conferenceCall = {
    closeMergingPair: jest.fn(),
    isMerging: false,
    mergingPair: null,
    onMergeSuccess: jest.fn((handler) => {
      conferenceCallbacks.mergeSuccess = handler;
    }),
  };
  const sideDrawerUI = {
    clearWidgets: jest.fn(),
    modalOpen: false,
  };
  const options = {
    appConfig: {
      name: 'Embeddable',
      version: '1.0.0',
    },
    callMonitor,
    conferenceCall,
    contactMatcher,
    contactSearch,
    contacts,
    routerInteraction,
    sideDrawerUI,
    webphone,
    ...overrides,
  };
  return {
    callMonitorCallbacks,
    callbacks,
    conferenceCallbacks,
    options,
    routerInteraction,
    webphone,
  };
}

function findProvider(providers, provide) {
  return providers.find((provider) => provider.provide === provide);
}

describe('Phone module factory and route hooks', () => {
  beforeEach(() => {
    jest.resetModules();
    localStorage.clear();
    delete window.ActiveXObject;
  });

  afterEach(() => {
    jest.dontMock('whatwg-fetch');
    jest.restoreAllMocks();
  });

  it('wires BasePhone call lifecycle hooks and search providers', async () => {
    const { default: BasePhone } = loadPhoneModule();
    const {
      callMonitorCallbacks,
      callbacks,
      conferenceCallbacks,
      options,
      routerInteraction,
      webphone,
    } = createPhoneOptions();
    const phone = new BasePhone(options);

    routerInteraction.currentPath = '/conferenceCall/callsOnhold/to/from';
    callbacks.callEnd({ id: 'ended' }, null, null);
    expect(routerInteraction.go).toHaveBeenCalledWith(-2);

    routerInteraction.currentPath = '/conferenceCall/callsOnhold/to/from';
    callbacks.callEnd({ id: 'from' }, { id: 'active' }, null);
    expect(routerInteraction.replace).toHaveBeenCalledWith('/calls/active');

    routerInteraction.currentPath = '/conferenceCall/participants';
    callbacks.callEnd({ id: 'active' }, null, null);
    expect(routerInteraction.replace).toHaveBeenCalledWith('/dialer');

    routerInteraction.currentPath = '/conferenceCall/dialer/active';
    callbacks.callEnd({ id: 'active' }, { id: 'active' }, null);
    expect(routerInteraction.replace).toHaveBeenCalledWith('/calls/active');

    options.conferenceCall.isMerging = true;
    routerInteraction.currentPath = '/calls/active';
    callbacks.callEnd({ id: 'active' }, { id: 'active' }, null);
    expect(routerInteraction.goBack).not.toHaveBeenCalled();
    options.conferenceCall.isMerging = false;
    callbacks.callEnd({ id: 'active' }, { id: 'active' }, null);
    expect(routerInteraction.goBack).toHaveBeenCalled();

    routerInteraction.currentPath = '/calls/active/ended';
    callbacks.callEnd({ id: 'ended' }, { id: 'current' }, null);
    expect(routerInteraction.replace).toHaveBeenCalledWith('/calls/active/current');

    routerInteraction.currentPath = '/dialer';
    callbacks.callEnd({ id: 'ended' }, null, { id: 'ring' });
    expect(routerInteraction.push).toHaveBeenCalledWith('/history');

    routerInteraction.currentPath = '/calls/active/current';
    callbacks.callInit({ id: 'new-call', to: '+16505550123' });
    expect(routerInteraction.replace).toHaveBeenCalledWith('/calls/active/new-call');
    expect(options.contactMatcher.forceMatchNumber).toHaveBeenCalledWith({
      phoneNumber: '+16505550123',
    });

    routerInteraction.currentPath = '/dialer';
    callbacks.callInit({ id: 'another-call', to: '+16505550124' });
    expect(routerInteraction.push).toHaveBeenCalledWith('/calls/active/another-call');

    routerInteraction.currentPath = '/dialer';
    callbacks.callStart({ direction: 'Outbound', id: 'outbound' });
    expect(routerInteraction.push).not.toHaveBeenCalledWith('/calls/active/outbound');
    options.sideDrawerUI.modalOpen = true;
    callbacks.callStart({ direction: 'Inbound', id: 'inbound' });
    expect(options.sideDrawerUI.clearWidgets).toHaveBeenCalled();
    expect(routerInteraction.push).toHaveBeenCalledWith('/calls/active/inbound');

    webphone.ringSessions = [
      { id: 'ring-1', minimized: false },
      { id: 'ring-2', minimized: true },
    ];
    routerInteraction.currentPath = '/dialer';
    callbacks.callRing({ from: '+16505550125' });
    expect(routerInteraction.push).toHaveBeenCalledWith('/history');
    expect(webphone.toggleMinimized).toHaveBeenCalledWith('ring-1');
    expect(options.contactMatcher.forceMatchNumber).toHaveBeenCalledWith({
      phoneNumber: '+16505550125',
    });

    webphone._webphone = null;
    callbacks.beforeCallResume({ id: 'resume-1' });
    expect(options.conferenceCall.closeMergingPair).not.toHaveBeenCalled();
    webphone._webphone = {};
    options.conferenceCall.mergingPair = {
      fromSessionId: 'merge-from',
      toSessionId: 'merge-to',
    };
    callbacks.beforeCallResume({ id: 'other-session' });
    expect(options.conferenceCall.closeMergingPair).toHaveBeenCalled();
    callbacks.beforeCallEnd({ id: 'merge-from' });
    expect(options.conferenceCall.closeMergingPair).toHaveBeenCalledTimes(2);

    conferenceCallbacks.mergeSuccess({ sessionId: 'merged-session' });
    expect(routerInteraction.push).toHaveBeenCalledWith('/calls/active/merged-session');

    const searchProvider = options.contactMatcher.addSearchProvider.mock.calls[0][0];
    await expect(searchProvider.searchFn({ queries: ['+16505550126'] })).resolves.toEqual([
      { phoneNumber: '+16505550126' },
    ]);
    expect(searchProvider.readyCheckFn()).toBe(true);

    const searchSource = options.contactSearch.addSearchSource.mock.calls[0][0];
    await expect(searchSource.searchFn({ searchString: '+16505550127' })).resolves.toEqual([
      { phoneNumber: '+16505550127' },
    ]);
    expect(searchSource.formatFn([{ id: 'contact-1' }])).toEqual([{ id: 'contact-1' }]);
    expect(searchSource.readyCheckFn()).toBe(true);

    webphone.connected = false;
    callMonitorCallbacks.ringing();
    expect(routerInteraction.push).toHaveBeenCalledWith('/history');
    webphone.connected = true;
    webphone.sessions = [];
    routerInteraction.currentPath = '/dialer';
    callMonitorCallbacks.updated({ telephonyStatus: 'CallConnected' });
    expect(routerInteraction.push).toHaveBeenCalledWith('/history');
    routerInteraction.currentPath = '/simplifycallctrl/active';
    callMonitorCallbacks.updated({ telephonyStatus: 'CallConnected' });

    expect(phone.name).toBe('Embeddable');
    expect(phone.version).toBe('1.0.0');
  });

  it('redirects from initialize based on auth state and feature availability', () => {
    const { default: BasePhone } = loadPhoneModule();
    const { options, routerInteraction } = createPhoneOptions();
    const phone = new BasePhone(options);
    phone.auth = {
      loggedIn: false,
      ready: true,
    };
    phone.appFeatures = {
      hasConferencing: false,
      hasMeetingsPermission: false,
      hasReadMessagesPermission: false,
      isCallingEnabled: false,
      isContactsEnabled: false,
      ready: true,
    };
    phone.genericMeeting = {
      isRCV: false,
      ready: true,
    };
    phone.routerInteraction = routerInteraction;
    phone.initialize();

    routerInteraction.currentPath = '/dialer';
    phone.storeSubscriber();
    expect(routerInteraction.push).toHaveBeenCalledWith('/');

    phone.auth.loggedIn = true;
    routerInteraction.currentPath = '/';
    phone.appFeatures.isCallingEnabled = true;
    phone.storeSubscriber();
    expect(routerInteraction.push).toHaveBeenCalledWith('/dialer');

    phone.appFeatures.isCallingEnabled = false;
    phone.appFeatures.hasReadMessagesPermission = true;
    phone.storeSubscriber();
    expect(routerInteraction.push).toHaveBeenCalledWith('/messages');

    phone.appFeatures.hasReadMessagesPermission = false;
    phone.appFeatures.isContactsEnabled = true;
    phone.storeSubscriber();
    expect(routerInteraction.push).toHaveBeenCalledWith('/contacts');

    phone.appFeatures.isContactsEnabled = false;
    phone.appFeatures.hasConferencing = true;
    phone.storeSubscriber();
    expect(routerInteraction.push).toHaveBeenCalledWith('/conference');

    phone.appFeatures.hasConferencing = false;
    phone.appFeatures.hasMeetingsPermission = true;
    phone.genericMeeting.isRCV = true;
    phone.storeSubscriber();
    expect(routerInteraction.push).toHaveBeenCalledWith('/meeting/home');
    phone.genericMeeting.isRCV = false;
    phone.storeSubscriber();
    expect(routerInteraction.push).toHaveBeenCalledWith('/meeting/schedule');

    phone.appFeatures.hasMeetingsPermission = false;
    phone.storeSubscriber();
    expect(routerInteraction.push).toHaveBeenCalledWith('/settings');

    routerInteraction.currentPath = '/calls';
    phone.storeSubscriber();
    expect(routerInteraction.push).toHaveBeenCalledWith('/history');
  });

  it('builds createPhone provider options, SDK config, PKCE cleanup, and client factories', () => {
    localStorage.setItem('sdk-testplatform', JSON.stringify({
      access_token: 'old-access',
      refresh_token: 'old-refresh',
    }));
    const { createPhone, default: BasePhone } = loadPhoneModule();
    const app = createPhone({
      apiConfig: {
        clientId: 'client-id',
        server: 'https://platform.example.com',
      },
      appVersion: '3.0.0',
      authProxy: false,
      autoMainTab: true,
      brandBaseUrl: 'https://brand.example.com',
      brandConfig: {
        appName: 'RingCentral App',
      },
      defaultAutoLogCallEnabled: true,
      defaultAutoLogMessageEnabled: false,
      defaultCallWith: 'browser',
      disableCall: false,
      disableCallHistory: false,
      disableConferenceInvite: false,
      disableContacts: false,
      disableGlip: false,
      disableInactiveTabCallEvent: true,
      disableLoginPopup: true,
      disableMeeting: false,
      disableMessages: false,
      disableNoiseReduction: false,
      disableReadText: false,
      disconnectInactiveWebphone: true,
      enableAnalytics: true,
      enableAudioInitPrompt: true,
      enableFromNumberSetting: true,
      enableLoadMoreCalls: true,
      enableMeeting: true,
      enableRingoutCallerId: true,
      enableRingtoneSettings: true,
      enableSharedMessages: true,
      enableSideWidget: true,
      enableSmartNote: true,
      enableSMSTemplate: true,
      enableSmsSettingEvent: true,
      enableTypingTimeTracking: true,
      enableVoicemailDrop: true,
      enableWebRTCPlanB: true,
      forceCurrentWebphoneActive: true,
      fromPopup: true,
      isMainTab: true,
      isUsingDefaultClientId: false,
      multipleTabsSupport: true,
      prefix: 'test',
      proxyUri: 'https://proxy.example.com',
      recordingLink: 'https://recordings.example.com',
      redirectUri: 'https://redirect.example.com',
      showMyLocationNumbers: true,
      showSignUpButton: true,
      stylesUri: 'https://styles.example.com',
      userAgent: 'CRM/1.0',
    });
    expect(app.moduleName).toBe('Phone');
    expect(localStorage.getItem('sdk-testplatform')).toBeNull();
    expect(localStorage.getItem('test-pkce-enabled')).toBe('1');

    const providers = app.providers;
    expect(findProvider(providers, 'SdkConfig').useValue).toMatchObject({
      appName: 'CRM/1.0 RingCentralApp',
      appVersion: '3.0.0',
      cachePrefix: 'sdk-test',
      clientId: 'client-id',
      redirectUri: 'https://redirect.example.com',
    });
    expect(findProvider(providers, 'AuthOptions').useValue).toEqual({
      authProxy: false,
      usePKCE: true,
    });
    expect(findProvider(providers, 'WebphoneOptions').useValue).toMatchObject({
      appKey: 'client-id',
      connectDelay: 800,
      disconnectOnInactive: true,
      forceCurrentWebphoneActive: true,
      multipleTabsSupport: true,
      permissionCheck: false,
      webphoneSDKOptions: {
        enablePlanB: true,
      },
    });
    expect(findProvider(providers, 'FeatureConfiguration').useValue).toMatchObject({
      AudioInitPrompt: true,
      CallLog: true,
      CallRecording: true,
      Contacts: true,
      Glip: true,
      LoadMoreCalls: true,
      NoiseReduction: true,
      RingtoneSettings: true,
      SharedMessages: true,
      SmartNote: true,
      SMSTemplate: true,
      VoicemailDrop: true,
      WebPhone: true,
    });
    expect(findProvider(providers, 'AnalyticsOptions').useValue).toMatchObject({
      enableExternalAnalytics: true,
      externalAppName: 'CRM',
      externalClientId: 'client-id',
    });
    expect(findProvider(providers, 'CallLoggerOptions').useValue.autoLog).toBe(true);
    expect(findProvider(providers, 'ConversationLoggerOptions').useValue.autoLog).toBe(false);
    expect(findProvider(providers, 'ConversationLoggerOptions').useValue.readyCheckFunction()).toBe(true);
    expect(findProvider(providers, 'SideDrawerUIOptions').useValue).toEqual({
      enableSideWidget: true,
    });
    expect(findProvider(providers, 'SmsTypingTimeTrackerOptions').useValue).toEqual({
      enableTypingTimeTracking: true,
    });
    expect(findProvider(providers, 'ConnectivityMonitorOptions').useValue.checkConnectionFunc).toEqual(
      expect.any(Function),
    );
    expect(findProvider(BasePhone.providers, 'ConversationLoggerOptions').useValue.isLoggedContact(
      {},
      { contact: { id: 'contact-1' } },
      { id: 'contact-1' },
    )).toBe(true);

    const clientFactory = findProvider(BasePhone.providers, 'Client').useFactory;
    expect(clientFactory({
      sdkConfig: {
        clientId: 'client-id',
      },
    })).toMatchObject({
      sdk: {
        locked: {
          config: {
            clientId: 'client-id',
          },
        },
      },
    });
    window.ActiveXObject = function ActiveXObject() {};
    expect(clientFactory({
      sdkConfig: {
        clientId: 'client-id',
      },
    })).toMatchObject({
      sdk: {
        hacked: {
          config: {
            clientId: 'client-id',
          },
        },
      },
    });
  });

  it('clears stale PKCE marker when auth proxy disables PKCE', () => {
    localStorage.setItem('proxy-pkce-enabled', '1');
    const { createPhone } = loadPhoneModule();
    const app = createPhone({
      apiConfig: {
        clientId: 'client-id',
        clientSecret: 'secret',
      },
      appVersion: '3.0.0',
      authProxy: true,
      brandConfig: {
        appName: 'Proxy App',
      },
      prefix: 'proxy',
      userAgent: '',
    });
    expect(localStorage.getItem('proxy-pkce-enabled')).toBeNull();
    expect(findProvider(app.providers, 'SdkConfig').useValue).toMatchObject({
      authProxy: true,
      authorizeEndpoint: '/authorize',
      cachePrefix: 'sdk-auth-proxy-proxy',
      revokeEndpoint: '/logout',
    });
    expect(findProvider(app.providers, 'AuthOptions').useValue).toEqual({
      authProxy: true,
      usePKCE: false,
    });
  });
});
