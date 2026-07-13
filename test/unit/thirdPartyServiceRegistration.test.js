import requestWithPostMessage from '../../src/lib/requestWithPostMessage';

jest.mock('@ringcentral-integration/commons/lib/di', () => ({
  Module: () => (target) => target,
}));

const mockWatch = jest.fn();

jest.mock('@ringcentral-integration/core', () => {
  const decorator = () => {};
  return {
    action: decorator,
    computed: () => decorator,
    globalStorage: decorator,
    storage: decorator,
    state: decorator,
    watch: (...args) => mockWatch(...args),
    RcModuleV2: class RcModuleV2 {
      constructor({ deps }) {
        this._deps = deps;
      }

      _ignoreModuleReadiness() {}
    },
  };
});

jest.mock('../../src/lib/requestWithPostMessage', () => jest.fn());

const ThirdPartyService = require('../../src/modules/ThirdPartyService').default;

function createSearchRegistry() {
  return {
    _searchSources: new Map(),
    _searchSourcesCheck: new Map(),
    _searchSourcesFormat: new Map(),
    addSearchSource: jest.fn(),
  };
}

function createMatcherRegistry() {
  return {
    _getQueries: jest.fn(() => ['query-1', 'query-2']),
    _searchProviders: new Map(),
    addSearchProvider: jest.fn(),
    match: jest.fn(),
    triggerMatch: jest.fn(),
  };
}

function createDeps(overrides = {}) {
  return {
    activityMatcher: createMatcherRegistry(),
    auth: {
      accessToken: 'access-token',
    },
    callHistory: {
      callerIDMap: {},
    },
    callMonitor: {
      calls: [],
    },
    contactMatcher: createMatcherRegistry(),
    contactMatcherOptions: {},
    contactSearch: createSearchRegistry(),
    contactSources: [],
    contacts: {
      addSource: jest.fn(),
    },
    conversationMatcher: createMatcherRegistry(),
    genericMeeting: {
      addThirdPartyProvider: jest.fn(),
    },
    globalStorage: {},
    messageStore: {
      fetchVoicemailTranscription: jest.fn(),
      voicemailTranscriptionMap: {},
    },
    smartNotes: {
      fetchSmartNoteText: jest.fn(),
      fetchTranscript: jest.fn(),
      hasPermission: false,
    },
    storage: {},
    tabManager: {
      active: true,
      autoMainTab: false,
    },
    thirdPartyContactsOptions: {
      recordingLink: 'https://recording.example.com/',
    },
    voicemailDrop: {
      setExternalVoicemailFetcher: jest.fn(),
    },
    smsTypingTimeTracker: {},
    ...overrides,
  };
}

function createService(deps = createDeps()) {
  return new ThirdPartyService(deps);
}

function installMessageListener() {
  const addEventListener = jest.fn();
  Object.defineProperty(global, 'window', {
    configurable: true,
    value: {
      addEventListener,
    },
  });
  return addEventListener;
}

function dispatchServiceMessage(handler, service) {
  handler({
    data: {
      service,
      type: 'rc-adapter-register-third-party-service',
    },
  });
}

function createFullServiceRegistration(overrides = {}) {
  return {
    activitiesPath: '/activities',
    activityName: 'Timeline',
    activityPath: '/activity',
    authorizationLinks: [{ label: 'Docs', uri: 'https://example.com/docs' }],
    authorizationLogo: 'https://example.com/logo.png',
    authorizationPath: '/authorize',
    authorized: true,
    authorizedAccount: 'Ada',
    authorizedTitle: 'Disconnect',
    banner: {
      id: 'banner-1',
      message: 'Trial ending',
    },
    buttonEventPath: '/button',
    buttons: [
      {
        icon: 'open',
        id: 'open',
        label: 'Open',
        type: 'link',
      },
    ],
    callLogEntityMatcherPath: '/call-match',
    callLogPageInputChangedEventPath: '/call-change',
    callLoggerPath: '/call-log',
    callLoggerTitle: 'Log call',
    contactIcon: 'https://example.com/icon.png',
    contactMatchPath: '/match',
    contactMatchTtl: 100,
    contactNoMatchTtl: 20,
    contactSearchPath: '/search',
    contactsPath: '/contacts',
    customizedPageInputChangedEventPath: '/custom-change',
    displayName: 'CRM Display',
    doNotContactPath: '/do-not-contact',
    feedbackPath: '/feedback',
    info: 'CRM info',
    meetingInvitePath: '/meeting-invite',
    meetingInviteTitle: 'Invite',
    meetingLoggerPath: '/meeting-log',
    meetingLoggerTitle: 'Log meeting',
    meetingUpcomingPath: '/meeting-upcoming',
    messageLogEntityMatcherPath: '/message-match',
    messageLoggerPath: '/message-log',
    messageLoggerTitle: 'Log message',
    messagesLogPageInputChangedEventPath: '/message-change',
    name: 'crm',
    settings: [{
      id: 'sync',
      name: 'Sync',
      type: 'button',
      buttonLabel: 'Sync now',
    }],
    settingsPath: '/settings',
    unauthorizedTitle: 'Connect',
    vcardHandlerPath: '/vcard',
    viewMatchedContactPath: '/view-contact',
    voicemailDropFilesPath: '/voicemail-files',
    ...overrides,
  };
}

describe('ThirdPartyService registration message handling', () => {
  beforeEach(() => {
    requestWithPostMessage.mockReset();
    mockWatch.mockClear();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    delete global.window;
    jest.restoreAllMocks();
  });

  it('registers all third-party service capabilities from the adapter message', () => {
    const addEventListener = installMessageListener();
    const deps = createDeps();
    const service = createService(deps);

    service.onInitOnce();
    const handler = addEventListener.mock.calls[0][1];
    handler({ data: null });
    dispatchServiceMessage(handler, {});
    dispatchServiceMessage(handler, createFullServiceRegistration());

    expect(addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
    expect(mockWatch).toHaveBeenCalledWith(
      service,
      expect.any(Function),
      expect.any(Function),
    );
    expect(service.serviceName).toBe('crm');
    expect(service.displayName).toBe('CRM Display');
    expect(service.serviceInfo).toBe('CRM info');
    expect(service.contactIcon).toBe('https://example.com/icon.png');
    expect(service.authorizationRegistered).toBe(true);
    expect(service.authorized).toBe(true);
    expect(service.authorizationLogo).toBe('https://example.com/logo.png');
    expect(service.viewMatchedContactExternal).toBe(true);
    expect(service.activityName).toBe('Timeline');
    expect(service.meetingInviteTitle).toBe('Invite');
    expect(service.meetingLoggerTitle).toBe('Log meeting');
    expect(service.callLoggerTitle).toBe('Log call');
    expect(service.messageLoggerTitle).toBe('Log message');
    expect(service.showFeedback).toBe(true);
    expect(service.settings).toHaveLength(1);
    expect(service.additionalButtons).toEqual([
      {
        icon: 'open',
        id: 'open',
        label: 'Open',
        type: 'link',
      },
    ]);
    expect(service.doNotContactRegistered).toBe(true);
    expect(service.customizedBanner).toEqual(
      expect.objectContaining({
        id: 'banner-1',
        message: 'Trial ending',
      }),
    );
    expect(deps.contacts.addSource).toHaveBeenCalledWith(service);
    expect(deps.contactSources).toContain(service);
    expect(deps.genericMeeting.addThirdPartyProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'crm',
        fetchUpcomingMeetingList: expect.any(Function),
      }),
    );
    expect(deps.voicemailDrop.setExternalVoicemailFetcher).toHaveBeenCalledWith(
      expect.any(Function),
    );
  });

  it('dispatches adapter update messages to their service handlers', async () => {
    const addEventListener = installMessageListener();
    const service = createService();
    service.fetchContacts = jest.fn(async () => {});
    service._refreshContactMatch = jest.fn();
    service._triggerCallLoggerMatch = jest.fn();
    service._triggerContactMatch = jest.fn();
    service._onUpdateCallLogPage = jest.fn();
    service._onUpdateMessagesLogPage = jest.fn();
    service._onRegisterCustomizedPage = jest.fn();
    service._onRegisterApp = jest.fn();
    service._onUnregisterApp = jest.fn();
    service._setCustomizedBanner = jest.fn();
    service.authorized = true;

    service.onInitOnce();
    const handler = addEventListener.mock.calls[0][1];

    handler({
      data: {
        authorized: false,
        authorizedAccount: '',
        type: 'rc-adapter-update-authorization-status',
      },
    });
    handler({
      data: {
        licenseDescription: 'Needs license',
        licenseStatus: 'Limited',
        licenseStatusColor: 'warning.f02',
        type: 'rc-adapter-refresh-license-status',
      },
    });
    await handler({ data: { type: 'rc-adapter-sync-third-party-contacts' } });
    handler({
      data: {
        sessionIds: ['session-1'],
        type: 'rc-adapter-trigger-call-logger-match',
      },
    });
    handler({
      data: {
        phoneNumbers: ['+16505550100'],
        type: 'rc-adapter-trigger-contact-match',
      },
    });
    handler({
      data: {
        settings: [{
          buttonLabel: 'Sync now',
          id: 'setting-1',
          name: 'Settings',
          type: 'button',
        }],
        type: 'rc-adapter-update-third-party-settings',
      },
    });
    handler({ data: { page: { title: 'Call' }, type: 'rc-adapter-update-call-log-page' } });
    handler({ data: { page: { title: 'Message' }, type: 'rc-adapter-update-messages-log-page' } });
    handler({ data: { page: { id: 'page-1' }, type: 'rc-adapter-register-customized-page' } });
    handler({ data: { app: { id: 'app-1' }, type: 'rc-adapter-register-widget-app' } });
    handler({ data: { appId: 'app-1', type: 'rc-adapter-unregister-widget-app' } });
    handler({ data: { banner: { id: 'banner-2' }, type: 'rc-adapter-update-customized-banner' } });

    expect(service.authorized).toBe(false);
    expect(service.licenseStatus).toBe('Limited');
    expect(service.licenseStatusColor).toBe('warning.f02');
    expect(service.licenseDescription).toBe('Needs license');
    expect(service.fetchContacts).toHaveBeenCalledWith({ type: 'api' });
    expect(service._refreshContactMatch).toHaveBeenCalled();
    expect(service._triggerCallLoggerMatch).toHaveBeenCalledWith(['session-1']);
    expect(service._triggerContactMatch).toHaveBeenCalledWith(['+16505550100']);
    expect(service.settings).toEqual([{
      buttonLabel: 'Sync now',
      id: 'setting-1',
      name: 'Settings',
      type: 'button',
    }]);
    expect(service._onUpdateCallLogPage).toHaveBeenCalledWith(
      expect.objectContaining({ page: { title: 'Call' } }),
    );
    expect(service._onUpdateMessagesLogPage).toHaveBeenCalledWith(
      expect.objectContaining({ page: { title: 'Message' } }),
    );
    expect(service._onRegisterCustomizedPage).toHaveBeenCalledWith(
      expect.objectContaining({ page: { id: 'page-1' } }),
    );
    expect(service._onRegisterApp).toHaveBeenCalledWith(
      expect.objectContaining({ app: { id: 'app-1' } }),
    );
    expect(service._onUnregisterApp).toHaveBeenCalledWith(
      expect.objectContaining({ appId: 'app-1' }),
    );
    expect(service._setCustomizedBanner).toHaveBeenCalledWith({ id: 'banner-2' });
  });

  it('refreshes or unregisters providers when authorization changes', async () => {
    const deps = createDeps();
    const service = createService(deps);
    service.serviceName = 'crm';
    service._sourceReady = true;
    service.authorized = true;
    service._contactsPath = '/contacts';
    service._contactSearchPath = '/search';
    service._contactMatchPath = '/match';
    service._callLogEntityMatcherPath = '/call-match';
    service._messageLogEntityMatcherPath = '/message-match';
    service.fetchContacts = jest.fn(async () => {});

    service._onAuthorizedChanged(true, false);
    expect(deps.contactSearch.addSearchSource).toHaveBeenCalled();
    expect(deps.contactMatcher.addSearchProvider).toHaveBeenCalled();
    expect(deps.activityMatcher.addSearchProvider).toHaveBeenCalled();
    expect(deps.conversationMatcher.addSearchProvider).toHaveBeenCalled();
    expect(service.fetchContacts).toHaveBeenCalled();
    expect(deps.contactMatcher.match).toHaveBeenCalledWith({
      queries: ['query-1', 'query-2'],
      ignoreCache: false,
    });
    expect(deps.activityMatcher.match).toHaveBeenCalledWith({
      queries: ['query-1', 'query-2'],
      ignoreCache: true,
    });
    expect(deps.conversationMatcher.match).toHaveBeenCalledWith({
      queries: ['query-1', 'query-2'],
      ignoreCache: true,
    });
    expect(deps.contactMatcher.triggerMatch).toHaveBeenCalled();
    expect(deps.activityMatcher.triggerMatch).toHaveBeenCalled();
    expect(deps.conversationMatcher.triggerMatch).toHaveBeenCalled();

    deps.contactSearch._searchSources.set('crm', jest.fn());
    deps.contactSearch._searchSourcesFormat.set('crm', jest.fn());
    deps.contactSearch._searchSourcesCheck.set('crm', jest.fn());
    deps.contactMatcher._searchProviders.set('crm', {});
    deps.activityMatcher._searchProviders.set('crm', {});
    deps.conversationMatcher._searchProviders.set('crm', {});
    service._onAuthorizedChanged(false, false);
    expect(service._searchSourceAdded).toBe(false);
    expect(service._contactMatchSourceAdded).toBe(false);
    expect(service._callLogEntityMatchSourceAdded).toBe(false);
    expect(service._messageLogEntityMatchSourceAdded).toBe(false);
    expect(deps.contactMatcher._searchProviders.has('crm')).toBe(false);
    expect(deps.activityMatcher._searchProviders.has('crm')).toBe(false);
    expect(deps.conversationMatcher._searchProviders.has('crm')).toBe(false);
  });
});
