import requestWithPostMessage from '../../src/lib/requestWithPostMessage';
import { ThirdParty } from '../../src/app/services/ThirdParty/ThirdParty';
import { watch } from '@ringcentral-integration/next-core';

jest.mock('../../src/lib/requestWithPostMessage', () => jest.fn());

function createSearchRegistry() {
  return {
    added: null,
    _searchSources: new Map(),
    _searchSourcesFormat: new Map(),
    _searchSourcesCheck: new Map(),
    addSearchSource: jest.fn(function addSearchSource(source) {
      this.added = source;
      this._searchSources.set(source.sourceName, source.searchFn);
      this._searchSourcesFormat.set(source.sourceName, source.formatFn);
      this._searchSourcesCheck.set(source.sourceName, source.readyCheckFn);
    }),
  };
}

function createMatcherRegistry(queries = []) {
  return {
    added: null,
    manualRefreshNumber: null,
    _searchProviders: new Map(),
    addSearchProvider: jest.fn(function addSearchProvider(provider) {
      this.added = provider;
      this._searchProviders.set(provider.name, provider);
    }),
    _getQueries: jest.fn(() => queries),
    match: jest.fn(),
    triggerMatch: jest.fn(),
    setManualRefreshNumber: jest.fn(function setManualRefreshNumber(phoneNumber) {
      this.manualRefreshNumber = phoneNumber;
    }),
    resetManualRefreshNumber: jest.fn(function resetManualRefreshNumber() {
      this.manualRefreshNumber = null;
    }),
    removeSearchProvider: jest.fn(function removeSearchProvider(name) {
      this._searchProviders.delete(name);
    }),
  };
}

function createDependencies(overrides = {}) {
  return {
    storage: { enable: jest.fn() },
    portManager: {
      shared: true,
      onClient: jest.fn(),
      onServer: jest.fn(),
    },
    auth: { accessToken: 'access-token' },
    contacts: { addSource: jest.fn() },
    contactSources: [],
    contactSearch: createSearchRegistry(),
    contactMatcher: createMatcherRegistry(['+16505550100', '+16505550101']),
    contactMatcherOptions: {
      ttl: 120 * 60 * 1000,
      noMatchTtl: 5 * 60 * 1000,
    },
    genericMeeting: { addThirdPartyProvider: jest.fn() },
    messageStore: {
      voicemailTranscriptionMap: {
        'message-1': { text: 'Voicemail transcript' },
      },
      fetchVoicemailTranscription: jest.fn(async () => {}),
    },
    callHistory: {
      calls: [
        {
          from: { phoneNumber: '+16505550100', name: 'caller-id' },
          to: { extensionNumber: '101', name: 'extension-name' },
        },
      ],
    },
    callMonitor: { calls: [{ sessionId: 'session-1' }] },
    voicemailDrop: { setExternalVoicemailFetcher: jest.fn() },
    activityMatcher: createMatcherRegistry(['session-1', 'session-2']),
    conversationMatcher: createMatcherRegistry(['conversation-1', 'conversation-2']),
    smartNotes: {
      hasPermission: true,
      fetchSmartNoteText: jest.fn(async () => 'AI note'),
      fetchTranscript: jest.fn(async () => ({
        context: {
          participants: [
            { participantId: 'agent', extensionId: '101', name: 'Original agent' },
          ],
        },
        transcripts: [{ participantId: 'agent', text: 'hello' }],
      })),
    },
    thirdPartyOptions: { recordingLink: 'https://recording.example.com/' },
    ...overrides,
  };
}

function createThirdParty(overrides = {}) {
  const dependencies = createDependencies(overrides);
  const service = new ThirdParty(
    dependencies.storage,
    dependencies.portManager,
    dependencies.auth,
    dependencies.contacts,
    dependencies.contactSources,
    dependencies.contactSearch,
    dependencies.contactMatcher,
    dependencies.contactMatcherOptions,
    dependencies.genericMeeting,
    dependencies.messageStore,
    dependencies.callHistory,
    dependencies.callMonitor,
    dependencies.voicemailDrop,
    dependencies.activityMatcher,
    dependencies.conversationMatcher,
    dependencies.smartNotes,
    dependencies.thirdPartyOptions,
  );
  return { dependencies, service };
}

function createFullRegistration(overrides = {}) {
  return {
    name: 'crm',
    displayName: 'CRM Display',
    info: 'CRM info',
    contactsPath: '/contacts',
    contactSearchPath: '/contact-search',
    contactMatchPath: '/contact-match',
    contactMatchTtl: 100,
    contactNoMatchTtl: 20,
    viewMatchedContactPath: '/view-contact',
    contactIcon: 'https://example.com/contact.png',
    activitiesPath: '/activities',
    activityPath: '/activity',
    activityName: 'Timeline',
    meetingInvitePath: '/meeting-invite',
    meetingInviteTitle: 'Invite',
    meetingUpcomingPath: '/meeting-upcoming',
    meetingLoggerPath: '/meeting-log',
    meetingLoggerTitle: 'Log meeting',
    callLoggerPath: '/call-log',
    callLoggerTitle: 'Log call',
    callLogEntityMatcherPath: '/call-match',
    callLogPageInputChangedEventPath: '/call-page-change',
    recordingWithToken: true,
    messageLoggerPath: '/message-log',
    messageLoggerTitle: 'Log message',
    messageLogEntityMatcherPath: '/message-match',
    messagesLogPageInputChangedEventPath: '/message-page-change',
    attachmentWithToken: true,
    feedbackPath: '/feedback',
    settingsPath: '/settings',
    settings: [
      { id: 'sync', name: 'Sync', type: 'button', buttonLabel: 'Sync now' },
    ],
    authorizationPath: '/authorize',
    authorizationLogo: 'https://example.com/logo.png',
    authorized: false,
    authorizedTitle: 'Disconnect',
    unauthorizedTitle: 'Connect',
    authorizedAccount: 'Ada',
    showAuthRedDot: true,
    showAuthButton: true,
    licenseStatus: 'Limited',
    licenseStatusColor: 'warning.f02',
    licenseDescription: 'Needs license',
    authorizationLinks: [
      { label: 'Docs', uri: 'https://example.com/docs' },
      { label: 'Unsafe', uri: 'javascript:alert(1)' },
    ],
    buttonEventPath: '/button',
    buttons: [
      { id: 'sms', type: 'smsToolbar', label: 'SMS', icon: 'sms' },
      { id: 'call', type: 'callAction', label: 'Call', icon: 'call' },
      { id: 'message', type: 'messageAction', label: 'Message', icon: 'message' },
      { id: 'contact', type: 'contactAction', label: 'Contact', icon: 'contact' },
      { id: 1, type: 'invalid', label: 'Invalid', icon: 'invalid' },
    ],
    vcardHandlerPath: '/vcard',
    customizedPageInputChangedEventPath: '/page-change',
    doNotContactPath: '/do-not-contact',
    voicemailDropFilesPath: '/voicemail-files',
    banner: { id: 'banner', message: 'Trial ending', action: { label: 'Upgrade' } },
    ...overrides,
  };
}

function registerService(service, overrides = {}) {
  const registration = createFullRegistration(overrides);
  service._onRegisterServiceMessage(registration);
  return registration;
}

describe('ThirdParty service', () => {
  beforeEach(() => {
    requestWithPostMessage.mockReset();
    requestWithPostMessage.mockResolvedValue({ data: [] });
    watch.mockReset();
    watch.mockReturnValue(jest.fn());
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('configures shared runtime callbacks and storage', () => {
    const { dependencies, service } = createThirdParty();

    expect(dependencies.storage.enable).toHaveBeenCalledWith(service);
    expect(service.ignoredModules).toEqual([
      dependencies.auth,
      dependencies.contacts,
      dependencies.contactSearch,
      dependencies.contactMatcher,
      dependencies.genericMeeting,
      dependencies.messageStore,
      dependencies.callHistory,
      dependencies.callMonitor,
      dependencies.voicemailDrop,
      dependencies.activityMatcher,
      dependencies.conversationMatcher,
      dependencies.smartNotes,
    ]);
    expect(service.ignoredModules).not.toContain(dependencies.portManager);
    expect(dependencies.portManager.onClient).toHaveBeenCalledWith(expect.any(Function));
    expect(dependencies.portManager.onServer).toHaveBeenCalledWith(expect.any(Function));
    expect(dependencies.voicemailDrop.setExternalVoicemailFetcher).not.toHaveBeenCalled();

    const bindClient = dependencies.portManager.onClient.mock.calls[0][0];
    const bindServer = dependencies.portManager.onServer.mock.calls[0][0];
    const removeMessageListener = jest.spyOn(window, 'removeEventListener');
    const disposeClient = bindClient();
    const disposeServer = bindServer();

    expect(dependencies.voicemailDrop.setExternalVoicemailFetcher)
      .toHaveBeenCalledWith(expect.any(Function));
    expect(watch).toHaveBeenCalledWith(service, expect.any(Function), expect.any(Function));
    disposeClient();
    disposeServer();
    expect(removeMessageListener).toHaveBeenCalledWith('message', service._onWindowMessage);
  });

  test('binds both runtime sides directly when sharing is disabled', () => {
    const { dependencies } = createThirdParty({
      portManager: { shared: false, onClient: jest.fn(), onServer: jest.fn() },
    });

    expect(dependencies.voicemailDrop.setExternalVoicemailFetcher)
      .toHaveBeenCalledWith(expect.any(Function));
    expect(watch).toHaveBeenCalledTimes(1);
  });

  test('registers the complete third-party capability surface', () => {
    const { dependencies, service } = createThirdParty();

    service._onRegisterServiceMessage();
    service._onRegisterServiceMessage({});
    registerService(service);

    expect(service.serviceName).toBe('crm');
    expect(service.sourceName).toBe('crm');
    expect(service.displayName).toBe('CRM Display');
    expect(service.serviceInfo).toBe('CRM info');
    expect(service.contactIcon).toBe('https://example.com/contact.png');
    expect(service.authorizationLogo).toBe('https://example.com/logo.png');
    expect(service.authorizationRegistered).toBe(true);
    expect(service.authorized).toBe(false);
    expect(service.sourceReady).toBe(false);
    expect(service.activitiesRegistered).toBe(false);
    expect(service.showAuthRedDot).toBe(true);
    expect(service.authorizationLinks).toEqual([
      { label: 'Docs', uri: 'https://example.com/docs' },
    ]);
    expect(service.activityName).toBe('Timeline');
    expect(service.meetingInviteTitle).toBe('Invite');
    expect(service.meetingLoggerRegistered).toBe(true);
    expect(service.meetingLoggerTitle).toBe('Log meeting');
    expect(service.callLoggerRegistered).toBe(true);
    expect(service.callLoggerTitle).toBe('Log call');
    expect(service.messageLoggerRegistered).toBe(true);
    expect(service.messageLoggerTitle).toBe('Log message');
    expect(service.showFeedback).toBe(true);
    expect(service.settings).toHaveLength(1);
    expect(service.additionalSMSToolbarButtons).toHaveLength(1);
    expect(service.additionalCallActions).toHaveLength(1);
    expect(service.additionalMessageActions).toHaveLength(1);
    expect(service.additionalContactActions).toHaveLength(1);
    expect(service.doNotContactRegistered).toBe(true);
    expect(service.customizedBanner).toEqual(expect.objectContaining({ id: 'banner' }));
    expect(dependencies.contacts.addSource).toHaveBeenCalledWith(service);
    expect(dependencies.contactSources).toContain(service);
    expect(service.isContactSourceRegistered).toBe(true);
    expect(service.rawContacts).toBe(service.contacts);
    expect(dependencies.genericMeeting.addThirdPartyProvider).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'crm', fetchUpcomingMeetingList: expect.any(Function) }),
    );

    service.setAuthorized(true, 'Grace');
    expect(service.sourceReady).toBe(true);
    expect(service.activitiesRegistered).toBe(true);
    expect(service.showAuthRedDot).toBe(false);
  });

  test('registers logger policy fields and defaults', () => {
    const { service } = createThirdParty();
    service._registerCallLogger(
      createFullRegistration({
        showLogModal: true,
        callLoggerAutoSettingLabel: 'Auto log',
        callLoggerAutoSettingDescription: 'Description',
        callLoggerAutoSettingReadOnly: true,
        callLoggerAutoSettingReadOnlyReason: 'Policy',
        callLoggerAutoSettingReadOnlyValue: false,
        callLoggerAutoLogSettingHidden: true,
        callLoggerAutoSettingWarning: 'Warning',
        callLoggerAutoLogOnCallSync: true,
        callLoggerHideEditLogButton: true,
      }),
    );
    service._registerMessageLogger(
      createFullRegistration({
        messageLoggerAutoSettingLabel: 'Auto log messages',
        messageLoggerAutoSettingDescription: 'Message description',
        messageLoggerAutoSettingReadOnly: true,
        messageLoggerAutoSettingReadOnlyReason: 'Readonly',
        messageLoggerAutoSettingReadOnlyValue: true,
        messageLoggerAutoSettingHidden: true,
      }),
    );

    expect(service.showLogModal).toBe(true);
    expect(service.callLoggerAutoSettingLabel).toBe('Auto log');
    expect(service.callLoggerAutoSettingDescription).toBe('Description');
    expect(service.callLoggerAutoSettingReadOnly).toBe(true);
    expect(service.callLoggerAutoSettingReadOnlyReason).toBe('Policy');
    expect(service.callLoggerAutoSettingReadOnlyValue).toBe(false);
    expect(service.callLoggerAutoSettingWarning).toBe('Warning');
    expect(service.callLoggerAutoLogOnCallSync).toBe(true);
    expect(service.callLoggerHideEditLogButton).toBe(true);
    expect(service.callLoggerAutoLogSettingHidden).toBe(true);
    expect(service.messageLoggerAutoSettingLabel).toBe('Auto log messages');
    expect(service.messageLoggerAutoSettingDescription).toBe('Message description');
    expect(service.messageLoggerAutoSettingReadOnly).toBe(true);
    expect(service.messageLoggerAutoSettingReadOnlyReason).toBe('Readonly');
    expect(service.messageLoggerAutoSettingReadOnlyValue).toBe(true);
    expect(service.messageLoggerAutoSettingHidden).toBe(true);
  });

  test('dispatches every adapter message type', async () => {
    const { service } = createThirdParty();
    const registration = createFullRegistration();
    const register = jest.spyOn(service, '_onRegisterServiceMessage');
    const authorization = jest.spyOn(service, '_updateAuthorizationStatus');
    const license = jest.spyOn(service, '_refreshLicenseStatus');
    const sync = jest.spyOn(service, '_triggerSyncContacts').mockResolvedValue();
    const callMatch = jest.spyOn(service, '_triggerCallLoggerMatch');
    const contactMatch = jest.spyOn(service, '_triggerContactMatch');
    const settings = jest.spyOn(service, '_updateSettings');
    const callPage = jest.spyOn(service, '_onUpdateCallLogPage');
    const messagePage = jest.spyOn(service, '_onUpdateMessagesLogPage');
    const page = jest.spyOn(service, '_onRegisterCustomizedPage');
    const app = jest.spyOn(service, '_onRegisterApp');
    const removeApp = jest.spyOn(service, '_onUnregisterApp');
    const banner = jest.spyOn(service, '_setCustomizedBanner');

    const messages = [
      { type: 'rc-adapter-register-third-party-service', service: registration },
      { type: 'rc-adapter-update-authorization-status', authorized: true },
      { type: 'rc-adapter-refresh-license-status', licenseStatus: 'Active' },
      { type: 'rc-adapter-sync-third-party-contacts' },
      { type: 'rc-adapter-trigger-call-logger-match', sessionIds: ['one'] },
      { type: 'rc-adapter-trigger-contact-match', phoneNumbers: ['+1'] },
      { type: 'rc-adapter-update-third-party-settings', settings: [] },
      { type: 'rc-adapter-update-call-log-page', page: { title: 'Call' } },
      { type: 'rc-adapter-update-messages-log-page', page: { title: 'Message' } },
      { type: 'rc-adapter-register-customized-page', page: { id: 'page' } },
      { type: 'rc-adapter-register-widget-app', app: { id: 'app' } },
      { type: 'rc-adapter-unregister-widget-app', appId: 'app' },
      { type: 'rc-adapter-update-customized-banner', banner: { id: 'banner' } },
      { type: 'unknown-message' },
    ];
    for (const message of messages) {
      await service._handleWindowMessage(message);
    }

    expect(register).toHaveBeenCalledWith(registration);
    expect(authorization).toHaveBeenCalled();
    expect(license).toHaveBeenCalled();
    expect(sync).toHaveBeenCalled();
    expect(callMatch).toHaveBeenCalledWith(['one']);
    expect(contactMatch).toHaveBeenCalledWith(['+1']);
    expect(settings).toHaveBeenCalledWith([]);
    expect(callPage).toHaveBeenCalled();
    expect(messagePage).toHaveBeenCalled();
    expect(page).toHaveBeenCalled();
    expect(app).toHaveBeenCalled();
    expect(removeApp).toHaveBeenCalled();
    expect(banner).toHaveBeenCalledWith({ id: 'banner' });
  });

  test('ignores malformed window messages and forwards valid ones', async () => {
    const { service } = createThirdParty();
    const handler = jest.spyOn(service, '_handleWindowMessage').mockResolvedValue();

    service._onWindowMessage({ data: null });
    service._onWindowMessage({ data: {} });
    service._onWindowMessage({ data: { type: 'valid' } });
    await Promise.resolve();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ type: 'valid' });
  });

  test('updates authorization and license status only after registration', () => {
    const { service } = createThirdParty();
    service._updateAuthorizationStatus({ authorized: true, authorizedAccount: 'Ada' });
    expect(service.authorized).toBeNull();

    service._onRegisterAuthorization({ authorized: false });
    service._updateAuthorizationStatus({ authorized: 1, authorizedAccount: 22 });
    expect(service.authorized).toBe(true);
    expect(service.authorizedAccount).toBe('22');

    service._refreshLicenseStatus({
      licenseStatus: 2,
      licenseStatusColor: null,
      licenseDescription: {},
    });
    expect(service.licenseStatus).toBe('');
    expect(service.licenseStatusColor).toBe('');
    expect(service.licenseDescription).toBe('');
    service.setLicenseStatus('Active', 'success.f02', 'Licensed');
    expect(service.licenseStatus).toBe('Active');
  });

  test('registers, refreshes, and removes search and matcher providers', async () => {
    const { dependencies, service } = createThirdParty();
    registerService(service, { authorized: true });
    jest.spyOn(service, 'fetchContacts').mockResolvedValue();

    await service._onAuthorizedChanged(true, false);

    expect(dependencies.contactSearch.addSearchSource).toHaveBeenCalledWith(
      expect.objectContaining({ sourceName: 'crm' }),
    );
    expect(dependencies.contactMatcher.addSearchProvider).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'crm' }),
    );
    expect(dependencies.activityMatcher.addSearchProvider).toHaveBeenCalled();
    expect(dependencies.conversationMatcher.addSearchProvider).toHaveBeenCalled();
    expect(dependencies.contactMatcherOptions.ttl).toBe(100);
    expect(dependencies.contactMatcherOptions.noMatchTtl).toBe(20);
    expect(dependencies.contactMatcher.match).toHaveBeenCalledWith({
      queries: ['+16505550100', '+16505550101'],
      ignoreCache: false,
    });
    expect(dependencies.activityMatcher.match).toHaveBeenCalledWith({
      queries: ['session-1', 'session-2'],
      ignoreCache: true,
    });
    expect(dependencies.conversationMatcher.match).toHaveBeenCalledWith({
      queries: ['conversation-1', 'conversation-2'],
      ignoreCache: true,
    });
    expect(dependencies.contactMatcher.triggerMatch).toHaveBeenCalled();

    await service._onAuthorizedChanged(true, true);
    expect(service.fetchContacts).toHaveBeenCalledTimes(2);

    await expect(dependencies.contactSearch.added.searchFn({ searchString: '' }))
      .resolves.toEqual([]);
    requestWithPostMessage.mockResolvedValueOnce({
      data: [
        {
          id: 'contact',
          name: 'Ada',
          phoneNumbers: [{ phoneNumber: '+16505550100', phoneType: 'businessPhone' }],
        },
      ],
    });
    await expect(
      dependencies.contactSearch.added.searchFn({ searchString: '+16505550100' }),
    ).resolves.toEqual([
      expect.objectContaining({ contactId: 'contact', entityType: 'crm' }),
    ]);
    expect(dependencies.contactSearch.added.formatFn(['one'])).toEqual(['one']);
    expect(dependencies.contactSearch.added.readyCheckFn()).toBe(true);

    await service._onAuthorizedChanged(false, false);
    expect(service._searchSourceAdded).toBe(false);
    expect(service._contactMatchSourceAdded).toBe(false);
    expect(service._callLogEntityMatchSourceAdded).toBe(false);
    expect(service._messageLogEntityMatchSourceAdded).toBe(false);
    expect(dependencies.contactSearch._searchSources.has('crm')).toBe(false);
    expect(dependencies.contactMatcher.removeSearchProvider).toHaveBeenCalledWith('crm');
    expect(dependencies.contactMatcher._searchProviders.has('crm')).toBe(false);
  });

  test('skips duplicate or incomplete provider registrations and refreshes', () => {
    const { dependencies, service } = createThirdParty();
    service._registerContactSearch();
    service._registerContactMatch();
    service._registerCallLogEntityMatch();
    service._registerMessageLogEntityMatch();
    expect(dependencies.contactSearch.addSearchSource).not.toHaveBeenCalled();

    registerService(service);
    service._registerContactSearch();
    service._registerContactSearch();
    service._registerContactMatch();
    service._registerContactMatch();
    service._registerCallLogEntityMatch();
    service._registerCallLogEntityMatch();
    service._registerMessageLogEntityMatch();
    service._registerMessageLogEntityMatch();
    expect(dependencies.contactSearch.addSearchSource).toHaveBeenCalledTimes(1);
    expect(dependencies.contactMatcher.addSearchProvider).toHaveBeenCalledTimes(1);

    service._refreshContactMatch();
    service._refreshCallLogEntityMatch();
    service._refreshMessageLogEntityMatch();
    expect(dependencies.contactMatcher.match).toHaveBeenCalled();

    service._contactMatchSourceAdded = false;
    service._callLogEntityMatchSourceAdded = false;
    service._messageLogEntityMatchSourceAdded = false;
    dependencies.contactMatcher.match.mockClear();
    dependencies.activityMatcher.match.mockClear();
    dependencies.conversationMatcher.match.mockClear();
    service._refreshContactMatch();
    service._refreshCallLogEntityMatch();
    service._refreshMessageLogEntityMatch();
    expect(dependencies.contactMatcher.match).not.toHaveBeenCalled();
    expect(dependencies.activityMatcher.match).not.toHaveBeenCalled();
    expect(dependencies.conversationMatcher.match).not.toHaveBeenCalled();
  });

  test('fetches paginated contacts and applies incremental sync changes', async () => {
    const { service } = createThirdParty();
    registerService(service, { authorized: true });
    requestWithPostMessage
      .mockResolvedValueOnce({
        data: [
          { id: 'one', phoneNumbers: [{ phoneNumber: '+1', phoneType: 'businessPhone' }] },
        ],
        nextPage: 2,
        syncTimestamp: 100,
      })
      .mockResolvedValueOnce({
        data: [{ id: 'two', phoneNumbers: [] }],
        syncTimestamp: 100,
      });

    await service.fetchContacts();

    expect(service.contacts).toEqual([
      { id: 'one', phoneNumbers: [{ phoneNumber: '+1', phoneType: 'business' }] },
      { id: 'two', phoneNumbers: [] },
    ]);
    expect(service.contactSyncTimestamp).toBe(100);
    expect(service.contactSyncing).toBe(false);
    expect(requestWithPostMessage).toHaveBeenNthCalledWith(
      1,
      '/contacts',
      { page: 1, syncTimestamp: null, type: undefined },
      60000,
    );

    requestWithPostMessage.mockResolvedValueOnce({
      data: [{ id: 'one', deleted: true }, { id: 'three' }],
      syncTimestamp: 200,
    });
    await service.fetchContacts({ type: 'api' });
    expect(service.contacts).toEqual([
      { id: 'two', phoneNumbers: [] },
      { id: 'three', phoneNumbers: undefined },
    ]);
    expect(service.contactSyncTimestamp).toBe(200);
  });

  test('uses the delegated contacts path without main-client registration', async () => {
    const { service } = createThirdParty();
    requestWithPostMessage.mockResolvedValueOnce({ data: null, syncTimestamp: 2 });

    await expect(
      service._fetchContacts({ contactsPath: '/contacts' }),
    ).resolves.toEqual({
      contacts: [],
      syncTimestamp: 2,
    });
    expect(requestWithPostMessage).toHaveBeenCalledWith(
      '/contacts',
      { page: 1, syncTimestamp: null, type: undefined },
      60000,
    );
  });

  test('guards contact fetching, joins concurrent fetches, and handles failures', async () => {
    const { service } = createThirdParty();
    await service.fetchContacts();
    expect(requestWithPostMessage).not.toHaveBeenCalled();

    registerService(service, { authorized: false });
    await service.fetchContacts();
    expect(requestWithPostMessage).not.toHaveBeenCalled();

    service.setAuthorized(true, '');
    let resolveFetch;
    requestWithPostMessage.mockImplementationOnce(
      () => new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );
    const first = service.fetchContacts();
    const second = service.fetchContacts();
    resolveFetch({ data: [], syncTimestamp: 1 });
    await Promise.all([first, second]);
    expect(requestWithPostMessage).toHaveBeenCalledTimes(1);

    requestWithPostMessage.mockRejectedValueOnce(new Error('fetch failed'));
    await expect(service.fetchContacts()).resolves.toBeUndefined();
    expect(service.contactSyncing).toBe(false);
    expect(service._fetchContactsPromise).toBeNull();
    expect(console.error).toHaveBeenCalledWith(expect.any(Error));
  });

  test('searches and matches contacts with caller and manual-refresh metadata', async () => {
    const { dependencies, service } = createThirdParty();
    registerService(service, { authorized: true });
    requestWithPostMessage.mockResolvedValueOnce({ data: [{ id: 'found' }] });
    await expect(service.searchContacts('Ada')).resolves.toEqual([{ id: 'found' }]);

    requestWithPostMessage.mockResolvedValueOnce({
      data: {
        '+16505550100': [{ id: 'lead', type: 'lead' }],
        '+16505550101': 'invalid',
      },
    });
    await expect(
      service.matchContacts(['+16505550100', '+16505550101']),
    ).resolves.toEqual({
      '+16505550100': [
        { id: 'lead', type: 'lead', entityType: 'lead', resourceType: 'crm' },
      ],
      '+16505550101': [],
    });
    expect(requestWithPostMessage).toHaveBeenLastCalledWith(
      '/contact-match',
      {
        phoneNumbers: ['+16505550100', '+16505550101'],
        callerIds: { '+16505550100': 'caller-id' },
      },
      30000,
    );

    requestWithPostMessage.mockResolvedValueOnce({
      data: { '+16505550100': [{ id: 'manual', entityType: 'person' }] },
    });
    dependencies.contactMatcher.setManualRefreshNumber('+16505550100');
    await service.matchContacts(['+16505550100']);
    expect(dependencies.contactMatcher.resetManualRefreshNumber).toHaveBeenCalled();
    expect(requestWithPostMessage).toHaveBeenLastCalledWith(
      '/contact-match',
      expect.objectContaining({ triggerFrom: 'manual' }),
      30000,
    );
  });

  test('filters invalid phone numbers before matching contacts', async () => {
    const { service } = createThirdParty();
    registerService(service, { authorized: true });

    await expect(service.matchContacts([undefined])).resolves.toEqual({});
    expect(requestWithPostMessage).not.toHaveBeenCalled();

    requestWithPostMessage.mockResolvedValueOnce({
      data: {
        '+16505550100': [{ id: 'lead', type: 'lead' }],
      },
    });
    await expect(
      service.matchContacts([undefined, '+16505550100', '']),
    ).resolves.toEqual({
      '+16505550100': [
        { id: 'lead', type: 'lead', entityType: 'lead', resourceType: 'crm' },
      ],
    });
    expect(requestWithPostMessage).toHaveBeenCalledWith(
      '/contact-match',
      {
        phoneNumbers: ['+16505550100'],
        callerIds: { '+16505550100': 'caller-id' },
      },
      30000,
    );
  });

  test('handles contact search and matching response and error fallbacks', async () => {
    const { service } = createThirdParty();
    await expect(service.searchContacts('Ada')).resolves.toEqual([]);
    await expect(service.matchContacts(['+1'])).resolves.toEqual({});

    registerService(service, { authorized: true });
    requestWithPostMessage.mockResolvedValueOnce({ data: {} });
    await expect(service.searchContacts('Ada')).resolves.toEqual([]);
    requestWithPostMessage.mockRejectedValueOnce(new Error('search'));
    await expect(service.searchContacts('Ada')).resolves.toEqual([]);
    requestWithPostMessage.mockResolvedValueOnce({ data: null });
    await expect(service.matchContacts(['+1'])).resolves.toEqual({});
    requestWithPostMessage.mockRejectedValueOnce(new Error('match'));
    await expect(service.matchContacts(['+1'])).resolves.toEqual({});
  });

  test('matches call and message entities and includes active sessions', async () => {
    const { service } = createThirdParty();
    registerService(service, { authorized: true });
    requestWithPostMessage.mockResolvedValueOnce({
      data: { 'session-1': [{ id: 'activity' }], 'session-2': 'invalid' },
    });
    await expect(
      service.matchCallLogEntities(['session-1', 'session-2']),
    ).resolves.toEqual({ 'session-1': [{ id: 'activity' }], 'session-2': [] });
    expect(requestWithPostMessage).toHaveBeenLastCalledWith(
      '/call-match',
      { sessionIds: ['session-1', 'session-2'], activeSessionIds: ['session-1'] },
      30000,
    );

    requestWithPostMessage.mockResolvedValueOnce({
      data: { 'conversation-1': [{ id: 'entity' }], 'conversation-2': null },
    });
    await expect(
      service.matchMessageLogEntities(['conversation-1', 'conversation-2']),
    ).resolves.toEqual({
      'conversation-1': [{ id: 'entity' }],
      'conversation-2': [],
    });
  });

  test('handles entity matcher missing, empty, and rejected responses', async () => {
    const { service } = createThirdParty();
    await expect(service.matchCallLogEntities(['one'])).resolves.toEqual({});
    await expect(service.matchMessageLogEntities(['one'])).resolves.toEqual({});
    registerService(service);

    requestWithPostMessage.mockResolvedValueOnce({ data: {} });
    await expect(service.matchCallLogEntities(['one'])).resolves.toEqual({});
    requestWithPostMessage.mockRejectedValueOnce(new Error('call match'));
    await expect(service.matchCallLogEntities(['one'])).resolves.toEqual({});
    requestWithPostMessage.mockResolvedValueOnce({ data: null });
    await expect(service.matchMessageLogEntities(['one'])).resolves.toEqual({});
    requestWithPostMessage.mockRejectedValueOnce(new Error('message match'));
    await expect(service.matchMessageLogEntities(['one'])).resolves.toEqual({});
  });

  test('fetches activities and invokes activity and meeting handlers', async () => {
    const { service } = createThirdParty();
    registerService(service);
    requestWithPostMessage.mockResolvedValueOnce({ data: [{ id: 'activity' }] });
    await service.fetchActivities({ id: 'contact' });
    expect(service.activitiesLoaded).toBe(true);
    expect(service.activities).toEqual([{ id: 'activity' }]);

    requestWithPostMessage.mockResolvedValueOnce({ data: {} });
    await service.fetchActivities({ id: 'contact' });
    expect(service.activities).toEqual([]);
    await service.openActivity({ id: 'activity' });
    await service.inviteMeeting({ id: 'meeting' });
    expect(requestWithPostMessage).toHaveBeenCalledWith('/activity', {
      activity: { id: 'activity' },
    });
    expect(requestWithPostMessage).toHaveBeenCalledWith('/meeting-invite', {
      meeting: { id: 'meeting' },
    });
  });

  test('loads upcoming meetings and falls back for missing or invalid data', async () => {
    const { service } = createThirdParty();
    await expect(service._fetchUpcomingMeetingList()).resolves.toEqual([]);
    registerService(service);
    requestWithPostMessage.mockResolvedValueOnce({ data: [{ id: 'meeting' }] });
    await expect(service._fetchUpcomingMeetingList()).resolves.toEqual([{ id: 'meeting' }]);
    requestWithPostMessage.mockResolvedValueOnce({ data: {} });
    await expect(service._fetchUpcomingMeetingList()).resolves.toEqual([]);
    requestWithPostMessage.mockRejectedValueOnce(new Error('upcoming'));
    await expect(service._fetchUpcomingMeetingList()).resolves.toEqual([]);
  });

  test('logs meetings with normalized recording links and handles errors', async () => {
    const { service } = createThirdParty();
    await service.logMeeting({ id: 'missing' });
    expect(requestWithPostMessage).not.toHaveBeenCalled();
    registerService(service);

    await service.logMeeting({ id: 'meeting', recordings: [] });
    await service.logMeeting({
      id: 'meeting',
      recordings: [{ id: 'recording', contentUri: 'hidden' }],
    });
    expect(requestWithPostMessage).toHaveBeenLastCalledWith(
      '/meeting-log',
      {
        meeting: {
          id: 'meeting',
          recordings: [
            {
              id: 'recording',
              link: 'https://v.ringcentral.com/welcome/meetings/recordings/recording/meeting',
            },
          ],
        },
      },
      6000,
    );
    requestWithPostMessage.mockRejectedValueOnce(new Error('meeting log'));
    await expect(service.logMeeting({ id: 'error' })).resolves.toBeUndefined();
  });

  test('logs calls with recordings, SmartNotes, transcripts, and matcher refresh', async () => {
    const { dependencies, service } = createThirdParty();
    registerService(service, { authorized: true });
    service._callLogEntityMatchSourceAdded = true;
    const call = {
      sessionId: 'session-1',
      telephonySessionId: 'telephony-1',
      internalType: 'history',
      result: 'Disconnected',
      fromName: 'Agent',
      from: { extensionId: '101', name: '', phoneNumber: '+1' },
      to: { extensionId: '102', name: 'Customer' },
      recording: {
        uri: 'https://platform.devtest.ringcentral.com/recording',
        contentUri: 'https://media.devtest.ringcentral.com/content?download=1',
      },
    };

    await service.logCall({ call, note: 'Manual' });

    expect(dependencies.smartNotes.fetchSmartNoteText).toHaveBeenCalledWith('telephony-1');
    expect(requestWithPostMessage).toHaveBeenCalledWith(
      '/call-log',
      expect.objectContaining({
        note: 'Manual',
        aiNote: 'AI note',
        transcript: 'Agent: hello',
        call: expect.objectContaining({
          recording: expect.objectContaining({
            link: expect.stringContaining('/sandbox?media='),
            contentUri: 'https://media.devtest.ringcentral.com/content?access_token=access-token',
          }),
        }),
      }),
      15000,
    );
    expect(dependencies.activityMatcher.match).toHaveBeenCalledWith({
      queries: ['session-1'],
      ignoreCache: true,
    });
  });

  test('logs a RingCX call with the AI note it carries', async () => {
    const { dependencies, service } = createThirdParty();
    registerService(service, { authorized: true });
    const call = {
      sessionId: 'uii-1',
      source: 'ringcx',
      aiNote: 'CX summary',
      from: { phoneNumber: '+1' },
      to: { phoneNumber: '+2' },
    };

    await service.logCall({ call, note: 'Manual', triggerType: 'logForm' });

    expect(dependencies.smartNotes.fetchSmartNoteText).not.toHaveBeenCalled();
    expect(requestWithPostMessage).toHaveBeenLastCalledWith(
      '/call-log',
      expect.objectContaining({
        note: 'Manual',
        aiNote: 'CX summary',
        triggerType: 'logForm',
      }),
      15000,
    );

    await service.logCall({ call, aiNote: 'Given note' });

    expect(requestWithPostMessage).toHaveBeenLastCalledWith(
      '/call-log',
      expect.objectContaining({ aiNote: 'Given note' }),
      15000,
    );
  });

  test('does not take the AI note off a RingEX call', async () => {
    const { dependencies, service } = createThirdParty();
    registerService(service, { authorized: true });
    dependencies.smartNotes.hasPermission = false;

    await service.logCall({
      call: {
        sessionId: 'session-1',
        aiNote: 'Stale note',
        from: {},
        to: {},
      },
    });

    expect(requestWithPostMessage).toHaveBeenLastCalledWith(
      '/call-log',
      expect.not.objectContaining({ aiNote: expect.anything() }),
      15000,
    );
  });

  test('covers call logging guards, recording links, and failures', async () => {
    const withoutRecordingLink = createThirdParty({ thirdPartyOptions: {} }).service;
    expect(withoutRecordingLink.getRecordingLink()).toBeNull();
    expect(
      withoutRecordingLink.getRecordingLink({ uri: 'https://platform', contentUri: 'content' }),
    ).toBeNull();

    const { dependencies, service } = createThirdParty();
    expect(
      service.getRecordingLink({
        uri: 'https://platform.ringcentral.com/recording',
        contentUri: 'https://media.ringcentral.com/content',
      }),
    ).toBe(
      'https://recording.example.com/?media=https%3A%2F%2Fmedia.ringcentral.com%2Fcontent',
    );
    registerService(service, { recordingWithToken: false });
    expect(
      service.getRecordingContentUri({
        contentUri: 'https://media.ringcentral.com/content?download=1',
      }),
    ).toBe('https://media.ringcentral.com/content');

    const call = { sessionId: 'one', from: {}, to: {} };
    const missing = createThirdParty().service;
    await missing.logCall({ call });
    expect(requestWithPostMessage).not.toHaveBeenCalled();

    dependencies.smartNotes.hasPermission = false;
    requestWithPostMessage.mockResolvedValueOnce({});
    await service.logCall({ call });
    expect(dependencies.smartNotes.fetchSmartNoteText).not.toHaveBeenCalled();
    requestWithPostMessage.mockRejectedValueOnce(new Error('log failed'));
    await expect(service.logCall({ call })).resolves.toBeUndefined();
  });

  test('logs voicemail and fax attachments with transcript and access tokens', async () => {
    const { dependencies, service } = createThirdParty();
    registerService(service, { authorized: true });
    service._messageLogEntityMatchSourceAdded = true;
    const voicemail = {
      conversationLogId: 'conversation-1',
      type: 'VoiceMail',
      messages: [
        {
          id: 'message-1',
          attachments: [{ uri: 'https://media.devtest.ringcentral.com/voicemail' }],
        },
      ],
    };

    await service.logConversation({ item: voicemail, note: 'Message note' });

    expect(dependencies.messageStore.fetchVoicemailTranscription)
      .toHaveBeenCalledWith(expect.objectContaining({ id: 'message-1' }));
    expect(requestWithPostMessage).toHaveBeenCalledWith(
      '/message-log',
      expect.objectContaining({
        note: 'Message note',
        conversation: expect.objectContaining({
          messages: [
            expect.objectContaining({
              transcript: 'Voicemail transcript',
              attachments: [
                expect.objectContaining({
                  link: expect.stringContaining('/sandbox?media='),
                  uri: 'https://media.devtest.ringcentral.com/voicemail?access_token=access-token',
                }),
              ],
            }),
          ],
        }),
      }),
      15000,
    );
    expect(dependencies.conversationMatcher.match).toHaveBeenCalledWith({
      queries: ['conversation-1'],
      ignoreCache: true,
    });

    const fax = {
      type: 'Fax',
      messages: [{ id: 'fax', attachments: [{ uri: 'https://media.ringcentral.com/fax' }] }],
    };
    await service.logConversation({ item: fax });
    expect(fax.messages[0].attachments[0].uri).toBe(
      'https://media.ringcentral.com/fax?access_token=access-token',
    );
  });

  test('handles conversation logging guards and attachment variants', async () => {
    const missing = createThirdParty().service;
    await missing.logConversation({ item: { type: 'SMS' } });
    expect(requestWithPostMessage).not.toHaveBeenCalled();

    const { service } = createThirdParty();
    registerService(service, { attachmentWithToken: false });
    const item = {
      type: 'SMS',
      messages: [{ id: 'one' }, { id: 'two', attachments: [] }],
    };
    await service.logConversation({ item });
    expect(item.messages[0]).toEqual({ id: 'one' });
    requestWithPostMessage.mockRejectedValueOnce(new Error('message log'));
    await expect(service.logConversation({ item: { type: 'SMS' } })).resolves.toBeUndefined();
  });

  test('runs simple registered actions and settings updates', async () => {
    const { service } = createThirdParty();
    registerService(service);
    service.setAuthorized(true, 'Ada');

    await service.authorizeService();
    await service.onShowFeedback();
    await service.onClickLicenseRefreshButton();
    await service.onClickAdditionalButton('call', { id: 'resource' });
    await service.onUpdateSetting({ id: 'sync', value: true });
    await service.onClickSettingButton('sync');

    expect(requestWithPostMessage).toHaveBeenCalledWith('/authorize', { authorized: true });
    expect(requestWithPostMessage).toHaveBeenCalledWith('/feedback', { show: true });
    expect(requestWithPostMessage).toHaveBeenCalledWith('/button', {
      button: { id: 'refreshLicense', type: 'refreshLicense' },
    });
    expect(requestWithPostMessage).toHaveBeenCalledWith('/button', {
      button: { id: 'call', type: 'callAction', label: 'Call' },
      resource: { id: 'resource' },
    });
    expect(service.settings[0].value).toBe(true);
    expect(requestWithPostMessage).toHaveBeenCalledWith('/settings', {
      settings: service.settings,
      setting: { id: 'sync', value: true },
    });
  });

  test('opens downloaded vcards and ignores other anchors', async () => {
    const { service } = createThirdParty();
    registerService(service);
    const preventDefault = jest.fn();
    await service.onClickVCard('https://example.com/contact.vcard', {
      currentTarget: { download: 'contact.vcard' },
      preventDefault,
    });
    expect(preventDefault).toHaveBeenCalled();
    expect(requestWithPostMessage).toHaveBeenCalledWith('/vcard', {
      vcardUri: 'https://example.com/contact.vcard',
    });

    requestWithPostMessage.mockClear();
    await service.onClickVCard('https://example.com/contact.txt', {
      currentTarget: { download: 'contact.txt' },
      preventDefault,
    });
    await service.onClickVCard('https://example.com/contact.vcard', {
      currentTarget: null,
      preventDefault,
    });
    expect(requestWithPostMessage).not.toHaveBeenCalled();
  });

  test('handles missing simple-action registrations and request errors', async () => {
    const { service } = createThirdParty();
    await service.authorizeService();
    await service.onShowFeedback();
    await service.onClickLicenseRefreshButton();
    await service.onClickAdditionalButton('missing');
    await service.onClickSettingButton('missing');
    await service.onUpdateSetting({ id: 'missing', value: true });
    expect(requestWithPostMessage).not.toHaveBeenCalled();

    registerService(service);
    requestWithPostMessage.mockRejectedValue(new Error('failed'));
    await expect(service.authorizeService()).resolves.toBeUndefined();
    await expect(service.onShowFeedback()).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalled();

    service._setServiceRegistration({ buttonEventPath: undefined });
    service.settings = [{ id: 'setting', name: 'Setting', type: 'button' }];
    await service.onClickSettingButton('setting');
    expect(console.error).toHaveBeenCalledWith('additionalButtonPath is not registered');
  });

  test('validates and triggers explicit matcher refresh requests', () => {
    const { dependencies, service } = createThirdParty();
    service._triggerCallLoggerMatch();
    service._triggerCallLoggerMatch('invalid');
    service._triggerCallLoggerMatch(['missing']);
    service._triggerContactMatch();
    service._triggerContactMatch('invalid');
    service._triggerContactMatch(['missing']);
    expect(dependencies.activityMatcher.match).not.toHaveBeenCalled();
    expect(dependencies.contactMatcher.match).not.toHaveBeenCalled();

    service._triggerCallLoggerMatch(['session-2', 'missing']);
    service._triggerContactMatch(['+16505550101', 'missing']);
    expect(dependencies.activityMatcher.match).toHaveBeenCalledWith({
      queries: ['session-2'],
      ignoreCache: true,
    });
    expect(dependencies.contactMatcher.match).toHaveBeenCalledWith({
      queries: ['+16505550101'],
      ignoreCache: true,
    });
  });

  test('updates customized pages and exposes tab metadata', () => {
    const { service } = createThirdParty();
    service.updateCustomizedPage({});
    expect(console.error).toHaveBeenCalledWith('Customized page id is required');
    service.updateCustomizedPage({
      id: 'tab',
      type: 'tab',
      title: 'Timeline',
      iconUri: 'icon.svg',
      activeIconUri: 'active.svg',
      darkIconUri: 'dark.svg',
      priority: 10,
      unreadCount: 2,
      actions: [{ id: 'refresh' }],
    });
    service.updateCustomizedPage({ id: 'tab', unreadCount: 3, hidden: true });
    service._onUpdateCallLogPage({ page: { title: 'Call form' } });
    service._onUpdateCallLogPage({
      page: { uiSchema: { submitButtonOptions: { norender: true } } },
    });
    service._onUpdateMessagesLogPage({ page: { title: 'Message form' } });
    service._onRegisterCustomizedPage({ page: { id: 'page', title: 'Profile' } });
    service._onRegisterCustomizedPage({});
    service._onUpdateCallLogPage({});
    service._onUpdateMessagesLogPage({});

    expect(service.customizedLogCallPage.uiSchema.submitButtonOptions).toEqual({
      submitText: 'Save',
      norender: true,
    });
    expect(service.customizedLogMessagesPage.title).toBe('Message form');
    expect(service.getCustomizedPage('page').title).toBe('Profile');
    expect(service.customizedTabs).toEqual([
      {
        id: 'tab',
        label: 'Timeline',
        iconUri: 'icon.svg',
        activeIconUri: 'active.svg',
        darkIconUri: 'dark.svg',
        priority: 10,
        unreadCount: 3,
        path: '/customizedTabs/tab',
        hidden: true,
        actions: [{ id: 'refresh' }],
      },
    ]);
  });

  test('posts customized page input and action events', async () => {
    const { service } = createThirdParty();
    registerService(service);
    service.updateCustomizedPage({ id: 'page', title: 'Profile' });
    service._onUpdateCallLogPage({ page: { title: 'Call form' } });
    service._onUpdateMessagesLogPage({ page: { title: 'Message form' } });

    await service.onCustomizedLogCallPageInputChanged({
      call: { sessionId: 'one' },
      formData: { note: 'call' },
      keys: ['note'],
    });
    await service.onCustomizedLogMessagesPageInputChanged({
      conversation: { conversationLogId: 'one' },
      formData: { note: 'message' },
      keys: ['note'],
    });
    await service.onCustomizedPageInputChanged({
      pageId: 'page',
      formData: { name: 'Ada' },
      keys: ['name'],
    });
    await service.onCustomizedPageInputChanged({
      pageId: 'missing',
      formData: {},
      keys: [],
    });
    await service.onClickButtonInCustomizedPage('save', 'pageButton', { name: 'Ada' });
    await service.onClickButtonInCustomizedPage('simple', 'pageButton');
    await service.onClickLinkInAlertDetail('link');
    await service.onClickCustomizedTabAction('tab', 'refresh');

    expect(requestWithPostMessage).toHaveBeenCalledWith('/page-change', {
      page: service.getCustomizedPage('page'),
      formData: { name: 'Ada' },
      keys: ['name'],
    });
    expect(requestWithPostMessage).toHaveBeenCalledWith('/button', {
      button: { id: 'simple', type: 'pageButton' },
    });
  });

  test('guards and handles errors from customized page events', async () => {
    const { service } = createThirdParty();
    await service.onCustomizedLogCallPageInputChanged({ call: {}, formData: {}, keys: [] });
    await service.onCustomizedLogMessagesPageInputChanged({
      conversation: {},
      formData: {},
      keys: [],
    });
    await service.onCustomizedPageInputChanged({ pageId: 'page', formData: {}, keys: [] });
    await service.onClickButtonInCustomizedPage('button', 'type');
    await service.onClickLinkInAlertDetail('link');
    await service.onClickCustomizedTabAction('tab', 'action');
    expect(requestWithPostMessage).not.toHaveBeenCalled();

    registerService(service);
    service.updateCustomizedPage({ id: 'page' });
    requestWithPostMessage.mockRejectedValue(new Error('page failed'));
    await service.onCustomizedLogCallPageInputChanged({ call: {}, formData: {}, keys: [] });
    await service.onCustomizedLogMessagesPageInputChanged({
      conversation: {},
      formData: {},
      keys: [],
    });
    await service.onCustomizedPageInputChanged({ pageId: 'page', formData: {}, keys: [] });
    expect(console.error).toHaveBeenCalled();
  });

  test('manages widget apps and loads every app event path', async () => {
    const { service } = createThirdParty();
    const app = {
      id: 'app',
      name: 'CRM',
      pagePath: '/app-page',
      inputChangedPath: '/app-input',
      submitPath: '/app-submit',
      buttonEventPath: '/app-button',
    };
    service.updateApps({});
    service.updateApps(app);
    service.updateApps({ id: 'app', name: 'Updated', extra: true });
    service._onRegisterApp({ app: { id: 'other', pagePath: '/other' } });
    service._onRegisterApp({});
    service._onUnregisterApp({ appId: 'other' });
    service._onUnregisterApp({ appId: 2 });
    service.toggleAppPin('app');
    service.toggleAppPin('other');
    service.toggleAppPin('app');
    expect(service.apps).toEqual([expect.objectContaining({ id: 'app', name: 'Updated' })]);
    expect(service.pinAppIds).toEqual(['other']);

    requestWithPostMessage.mockResolvedValue({ data: { schema: 'loaded' } });
    await expect(service.loadAppPage({ app: null })).resolves.toBeNull();
    await expect(service.loadAppPage({ app })).resolves.toEqual({ schema: 'loaded' });
    await expect(
      service.loadAppPage({
        app,
        contact: { id: 'contact' },
        type: 'inputChanged',
        formData: { name: 'Ada' },
        changedKeys: ['name'],
        theme: 'dark',
      }),
    ).resolves.toEqual({ schema: 'loaded' });
    await expect(
      service.loadAppPage({ app, type: 'submit', formData: { name: 'Ada' } }),
    ).resolves.toEqual({ schema: 'loaded' });
    await expect(
      service.loadAppPage({
        app,
        type: 'buttonClick',
        button: { id: 'save' },
        formData: { name: 'Ada' },
      }),
    ).resolves.toEqual({ schema: 'loaded' });
    await expect(
      service.loadAppPage({ app, type: 'refresh', formData: { name: 'Ada' } }),
    ).resolves.toEqual({ schema: 'loaded' });
    await expect(service.loadAppPage({ app: { id: 'without-path' }, type: 'submit' }))
      .resolves.toBeNull();

    requestWithPostMessage.mockRejectedValueOnce(new Error('app failed'));
    await expect(service.loadAppPage({ app })).resolves.toBeNull();
  });

  test('checks do-not-contact and external matched contacts', async () => {
    const { service } = createThirdParty();
    await expect(
      service.checkDoNotContact({ actionType: 'call', phoneNumber: '+16505550100' }),
    ).resolves.toBe(false);
    await service.onViewMatchedContactExternal({ id: 'one' });
    expect(requestWithPostMessage).not.toHaveBeenCalled();

    registerService(service);
    const doNotContactResponse = {
      result: true,
      mode: 'restrict',
      message: 'Calling is restricted',
    };
    requestWithPostMessage.mockResolvedValueOnce({ data: doNotContactResponse });
    await expect(
      service.checkDoNotContact({ actionType: 'call', phoneNumber: '+16505550100' }),
    ).resolves.toEqual(doNotContactResponse);
    expect(requestWithPostMessage).toHaveBeenCalledWith('/do-not-contact', {
      actionType: 'call',
      phoneNumber: '+16505550100',
    });
    await service.onViewMatchedContactExternal({ id: 'one' });
    expect(requestWithPostMessage).toHaveBeenCalledWith('/view-contact', { id: 'one' });
    requestWithPostMessage.mockRejectedValueOnce(new Error('view failed'));
    await expect(service.onViewMatchedContactExternal({ id: 'one' })).resolves.toBeUndefined();
  });

  test('fetches voicemail drop files through the registered callback', async () => {
    const { dependencies, service } = createThirdParty({
      portManager: { shared: false, onClient: jest.fn(), onServer: jest.fn() },
    });
    const fetcher = dependencies.voicemailDrop.setExternalVoicemailFetcher.mock.calls[0][0];
    await expect(fetcher()).resolves.toEqual([]);

    registerService(service);
    requestWithPostMessage.mockResolvedValueOnce({ data: [{ id: 'message' }] });
    await expect(fetcher()).resolves.toEqual([{ id: 'message' }]);
    requestWithPostMessage.mockResolvedValueOnce({ data: {} });
    await expect(fetcher()).resolves.toEqual([]);
    expect(console.error).toHaveBeenCalledWith('Voicemail drop files must be an array');
  });

  test('updates, acts on, closes, and hides customized banners', async () => {
    const { service } = createThirdParty();
    registerService(service);
    service._setCustomizedBanner({
      id: 'banner',
      message: 'Updated',
      severity: 'announcement',
      closable: true,
      closeButtonLabel: 'Dismiss announcement',
    });
    expect(service.customizedBanner).toEqual({
      id: 'banner',
      message: 'Updated',
      severity: 'announcement',
      action: undefined,
      closable: true,
      closeButtonLabel: 'Dismiss announcement',
    });
    await service.onBannerAction();
    await service.onBannerClose();
    expect(service.customizedBanner).toBeNull();
    expect(requestWithPostMessage).toHaveBeenCalledWith('/button', {
      button: { id: 'banner', type: 'customizedBanner', dismissed: true },
    });

    service._setCustomizedBanner({ id: 'hidden', hidden: true });
    expect(service.customizedBanner).toBeNull();
    service._setCustomizedBanner(null);
  });

  test('guards banner actions and logs action and close errors', async () => {
    const { service } = createThirdParty();
    await service.onBannerAction();
    expect(console.warn).toHaveBeenCalledWith('Button event path is not registered');

    registerService(service);
    service._setCustomizedBanner(null);
    await service.onBannerAction();
    expect(console.warn).toHaveBeenCalledWith('Banner not found');

    service._setCustomizedBanner({ id: 'banner', message: 'Retry' });
    requestWithPostMessage.mockRejectedValueOnce(new Error('action failed'));
    await service.onBannerAction();
    expect(console.error).toHaveBeenCalledWith('Banner action error', expect.any(Error));
    requestWithPostMessage.mockRejectedValueOnce(new Error('close failed'));
    await service.onBannerClose();
    expect(console.error).toHaveBeenCalledWith('Banner close error', expect.any(Error));
    await service.onBannerClose();
  });

  test('syncs contacts and refreshes the contact matcher', async () => {
    const { service } = createThirdParty();
    const fetchContacts = jest.spyOn(service, 'fetchContacts').mockResolvedValue();
    const refresh = jest.spyOn(service, '_refreshContactMatch');
    await service.sync({ type: 'manual' });
    expect(fetchContacts).toHaveBeenCalledWith({ type: 'manual' });
    await service._triggerSyncContacts();
    expect(fetchContacts).toHaveBeenCalledWith({ type: 'api' });
    expect(refresh).toHaveBeenCalled();
  });

  test('finds and filters cached contacts', () => {
    const { service } = createThirdParty();
    service.contacts = [
      { id: 'one', name: 'Ada', phoneNumbers: [] },
      { id: 'two', name: 'Grace', phoneNumbers: [] },
    ];
    expect(service.findContact('two')).toEqual(expect.objectContaining({ name: 'Grace' }));
    expect(service.findContact('missing')).toBeUndefined();
    expect(service.filterContacts('Ada')).toEqual(expect.any(Array));
  });
});
