import requestWithPostMessage from '../../src/lib/requestWithPostMessage';
import ThirdPartyService from '../../src/modules/ThirdPartyService';
import { setStagedState } from '@ringcentral-integration/core/lib/usm-redux/utils';

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
    manualRefreshNumber: '+16505550100',
    _searchProviders: new Map(),
    addSearchProvider: jest.fn(function addSearchProvider(provider) {
      this.added = provider;
      this._searchProviders.set(provider.name, provider);
    }),
    _getQueries: jest.fn(() => queries),
    match: jest.fn(),
    triggerMatch: jest.fn(),
    resetManualRefreshNumber: jest.fn(),
  };
}

function createService(overrides = {}) {
  const contactMatcher = createMatcherRegistry(['+16505550100', '+16505550101']);
  const activityMatcher = createMatcherRegistry(['session-1', 'session-2']);
  const conversationMatcher = createMatcherRegistry(['conversation-1', 'conversation-2']);
  const service = Object.create(ThirdPartyService.prototype);
  Object.assign(service, {
    serviceName: 'crm',
    displayName: 'CRM',
    _sourceReady: true,
    authorized: true,
    authorizedAccount: '',
    contacts: [],
    contactSyncTimestamp: null,
    contactSyncing: false,
    settings: [],
    additionalButtons: [],
    customizedPages: [],
    apps: [],
    pinAppIds: [],
    _contactsPath: '/contacts',
    _contactSearchPath: '/contact-search',
    _contactMatchPath: '/contact-match',
    _viewMatchedContactPath: '/view-contact',
    _callLogEntityMatcherPath: '/call-log-match',
    _messageLogEntityMatcherPath: '/message-log-match',
    _activitiesPath: '/activities',
    _activityPath: '/activity',
    _meetingInvitePath: '/meeting-invite',
    _meetingLoggerPath: '/meeting-log',
    _callLoggerPath: '/call-log',
    _messageLoggerPath: '/message-log',
    _feedbackPath: '/feedback',
    _settingsPath: '/settings',
    _authorizationPath: '/authorize',
    _additionalButtonPath: '/button',
    _vcardHandlerPath: '/vcard',
    _recordingLink: 'https://recording.example.com/',
    _fetchContactsPromise: null,
    _searchSourceAdded: false,
    _contactMatchSourceAdded: false,
    _callLogEntityMatchSourceAdded: false,
    _messageLogEntityMatchSourceAdded: false,
    _callLoggerRecordingWithToken: false,
    _messageLoggerAttachmentWithToken: false,
    _deps: {
      auth: { accessToken: 'access-token' },
      contacts: { addSource: jest.fn() },
      contactSources: [],
      contactSearch: createSearchRegistry(),
      contactMatcher,
      contactMatcherOptions: {},
      activityMatcher,
      conversationMatcher,
      genericMeeting: { addThirdPartyProvider: jest.fn() },
      smartNotes: {
        hasPermission: true,
        fetchSmartNoteText: jest.fn(async () => 'AI note'),
        fetchTranscript: jest.fn(async () => ({
          context: {
            participants: [{ participantId: 'p1', extensionId: '101', name: 'Agent' }],
          },
          transcripts: [{ participantId: 'p1', text: 'hello' }],
        })),
      },
      callHistory: { callerIDMap: { '+16505550100': 'caller-id' } },
      callMonitor: { calls: [{ sessionId: 'session-1' }] },
      messageStore: {
        voicemailTranscriptionMap: {
          'message-1': { text: 'Voicemail transcript' },
        },
        fetchVoicemailTranscription: jest.fn(async () => {}),
      },
      voicemailDrop: {
        setExternalVoicemailFetcher: jest.fn(),
      },
      tabManager: { active: true, autoMainTab: false },
    },
    ...overrides,
  });
  Object.assign(service, {
    _registerService({
      serviceName,
      serviceDisplayName,
      serviceInfo,
    }) {
      this.serviceName = serviceName;
      if (serviceDisplayName) {
        this.displayName = serviceDisplayName;
      }
      this._sourceReady = true;
      this.serviceInfo = serviceInfo;
    },
    _setContactSyncing(value) {
      this.contactSyncing = value;
    },
    _fetchContactsSuccess({ contacts, syncTimestamp = null }) {
      this.contacts = contacts;
      this.contactSyncTimestamp = syncTimestamp;
      this.contactSyncing = false;
    },
    _syncContactsSuccess({ contacts, syncTimestamp = null }) {
      const contactsMap = {};
      contacts.forEach((contact) => {
        contactsMap[contact.id] = 1;
      });
      const oldContacts = this.contacts.filter((contact) => !contactsMap[contact.id]);
      this.contacts = oldContacts.concat(contacts.filter((contact) => !contact.deleted));
      this.contactSyncTimestamp = syncTimestamp;
      this.contactSyncing = false;
    },
    _onRegisterActivities({ activityName }) {
      this._activitiesRegistered = true;
      if (activityName) {
        this.activityName = activityName;
      }
    },
    _onLoadActivities() {
      this.activitiesLoaded = false;
      this.activities = [];
    },
    _onLoadActivitiesSuccess({ activities }) {
      this.activitiesLoaded = true;
      this.activities = activities;
    },
    _onRegisterMeetingInvite({ meetingInviteTitle }) {
      this.meetingInviteTitle = meetingInviteTitle;
    },
    _onRegisterMeetingLogger({ meetingLoggerTitle }) {
      this.meetingLoggerTitle = meetingLoggerTitle;
      this.meetingLoggerRegistered = true;
    },
    _onRegisterFeedback() {
      this.showFeedback = true;
    },
    _onRegisterSettings({ settings }) {
      this.settings = settings;
    },
    _onUpdateSettings({ setting }) {
      const target = this.settings.find((item) => item.id === setting.id);
      if (target) {
        target.value = setting.value;
      }
    },
    _onRegisterAuthorization({
      authorized,
      authorizedTitle = '',
      unauthorizedTitle = '',
      showAuthRedDot = false,
      authorizedAccount = '',
      showAuthButton = false,
      licenseStatus = '',
      licenseStatusColor = '',
      licenseDescription = '',
      authorizationLinks = [],
    }) {
      this.authorized = authorized;
      this.authorizedTitle = authorizedTitle;
      this.unauthorizedTitle = unauthorizedTitle;
      this._showAuthRedDot = showAuthRedDot;
      this.authorizedAccount = authorizedAccount;
      this.showAuthButton = showAuthButton;
      this.licenseStatus = licenseStatus;
      this.licenseStatusColor = licenseStatusColor;
      this.licenseDescription = licenseDescription;
      this.authorizationLinks = authorizationLinks;
    },
    setAuthorized(value, account) {
      this.authorized = value;
      this.authorizedAccount = account;
    },
    setLicenseStatus(status = '', color = 'neutral.f04', description = '') {
      this.licenseStatus = status;
      this.licenseStatusColor = color;
      this.licenseDescription = description;
    },
    _onRegisterAdditionalButtons({ additionalButtons }) {
      this.additionalButtons = additionalButtons;
    },
  });
  return service;
}

describe('ThirdPartyService module methods', () => {
  beforeEach(() => {
    setStagedState({});
    requestWithPostMessage.mockReset();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    setStagedState(undefined);
    jest.restoreAllMocks();
  });

  it('registers contact sources, search providers, match providers, and refreshes matches', async () => {
    const service = createService();
    requestWithPostMessage.mockResolvedValue({
      data: {
        '+16505550100': [{ id: 'contact-1', type: 'lead' }],
      },
    });

    service._registerContacts({
      contactsPath: '/contacts',
      contactIcon: 'https://example.com/icon.png',
    });
    service._registerContactSearch();
    service._registerContactMatch();
    service._registerCallLogEntityMatch();
    service._registerMessageLogEntityMatch();

    expect(service._deps.contacts.addSource).toHaveBeenCalledWith(service);
    expect(service._deps.contactSources).toContain(service);
    expect(service._deps.contactSearch.addSearchSource).toHaveBeenCalledWith(
      expect.objectContaining({ sourceName: 'crm' }),
    );
    expect(service._deps.contactMatcher.addSearchProvider).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'crm' }),
    );
    await expect(
      service._deps.contactSearch.added.searchFn({ searchString: '' }),
    ).resolves.toEqual([]);
    requestWithPostMessage.mockResolvedValueOnce({
      data: [{
        id: 'search-contact',
        name: 'Ada',
        phoneNumbers: [{ phoneNumber: '+16505550100', phoneType: 'businessPhone' }],
      }],
    });
    await expect(
      service._deps.contactSearch.added.searchFn({ searchString: '+16505550100' }),
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          contactId: 'search-contact',
          entityType: 'crm',
          phoneNumber: '+16505550100',
        }),
      ]),
    );

    await expect(service._deps.contactMatcher.added.searchFn({
      queries: ['+16505550100'],
    })).resolves.toEqual({
      '+16505550100': [expect.objectContaining({
        id: 'contact-1',
        entityType: 'lead',
      })],
    });
    expect(service._deps.contactMatcher.resetManualRefreshNumber).toHaveBeenCalled();

    service._refreshContactMatch();
    service._refreshCallLogEntityMatch();
    service._refreshMessageLogEntityMatch();
    expect(service._deps.contactMatcher.match).toHaveBeenCalledWith({
      queries: ['+16505550100', '+16505550101'],
      ignoreCache: false,
    });
    expect(service._deps.activityMatcher.match).toHaveBeenCalledWith({
      queries: ['session-1', 'session-2'],
      ignoreCache: true,
    });
    expect(service._deps.conversationMatcher.match).toHaveBeenCalledWith({
      queries: ['conversation-1', 'conversation-2'],
      ignoreCache: true,
    });

    service._unregisterContactSearch();
    service._unregisterContactMatch();
    service._unregisterCallLogEntityMatch();
    service._unregisterMessageLogEntityMatch();
    expect(service._searchSourceAdded).toBe(false);
    expect(service._contactMatchSourceAdded).toBe(false);
    expect(service._callLogEntityMatchSourceAdded).toBe(false);
    expect(service._messageLogEntityMatchSourceAdded).toBe(false);
  });

  it('fetches, syncs, searches, and matches contacts and log entities', async () => {
    const service = createService({
      contacts: [{ id: 'old-contact' }, { id: 'deleted-contact' }],
      contactSyncTimestamp: 100,
    });
    requestWithPostMessage
      .mockResolvedValueOnce({
        data: [{ id: 'new-contact', phoneNumbers: [{ phoneNumber: '+1', phoneType: 'mobile' }] }],
        nextPage: 2,
        syncTimestamp: 200,
      })
      .mockResolvedValueOnce({
        data: [{ id: 'deleted-contact', deleted: true }],
        syncTimestamp: 200,
      });

    await service.fetchContacts({ type: 'api' });

    expect(service.contacts).toEqual([
      { id: 'old-contact' },
      {
        id: 'new-contact',
        phoneNumbers: [{ phoneNumber: '+1', phoneType: 'mobile' }],
      },
    ]);
    expect(service.contactSyncTimestamp).toBe(200);
    expect(service.contactSyncing).toBe(false);

    requestWithPostMessage.mockResolvedValueOnce({ data: [{ id: 'found-contact' }] });
    await expect(service.searchContacts('Ada')).resolves.toEqual([{ id: 'found-contact' }]);
    requestWithPostMessage.mockResolvedValueOnce({ data: null });
    await expect(service.searchContacts('Ada')).resolves.toEqual([]);

    requestWithPostMessage.mockResolvedValueOnce({
      data: {
        'session-1': [{ id: 'call-log-entity' }],
        'session-2': 'invalid',
      },
    });
    await expect(service.matchCallLogEntities(['session-1', 'session-2'])).resolves.toEqual({
      'session-1': [{ id: 'call-log-entity' }],
      'session-2': [],
    });
    requestWithPostMessage.mockResolvedValueOnce({
      data: {
        'conversation-1': [{ id: 'message-log-entity' }],
        'conversation-2': null,
      },
    });
    await expect(service.matchMessageLogEntities(['conversation-1', 'conversation-2'])).resolves.toEqual({
      'conversation-1': [{ id: 'message-log-entity' }],
      'conversation-2': [],
    });
    expect(service.findContact('new-contact')).toEqual(
      expect.objectContaining({ id: 'new-contact' }),
    );
  });

  it('registers third-party UI capabilities and handles simple user actions', async () => {
    const service = createService();
    service._registerService({
      serviceName: 'crm',
      serviceDisplayName: 'CRM Display',
      serviceInfo: 'Info',
    });
    service._registerActivities({ activitiesPath: '/activities', activityPath: '/activity', activityName: 'Timeline' });
    service._registerMeetingInvite({ meetingInvitePath: '/meeting-invite', meetingInviteTitle: 'Invite', meetingUpcomingPath: '/upcoming' });
    service._registerMeetingLogger({ meetingLoggerPath: '/meeting-log', meetingLoggerTitle: 'Log meeting' });
    service._registerFeedback({ feedbackPath: '/feedback' });
    service._registerSettings({
      settingsPath: '/settings',
      settings: [{ id: 'setting-button', name: 'Setting Button', type: 'button', buttonLabel: 'Run' }],
    });
    service._registerAuthorizationButton({
      authorizationPath: '/authorize',
      authorizationLogo: 'https://example.com/logo.png',
      authorized: false,
      authorizedTitle: 'Disconnect',
      unauthorizedTitle: 'Connect',
      authorizedAccount: 'account',
      showAuthRedDot: true,
    });
    service._registerButtons({
      buttonEventPath: '/button',
      buttons: [
        { id: 'open', type: 'link', label: 'Open', icon: 'open' },
        { id: 1, type: 'bad', label: 'Bad', icon: 'bad' },
      ],
    });
    service._registerVCardHandler({ vcardHandlerPath: '/vcard' });

    expect(service.displayName).toBe('CRM Display');
    expect(service.activityName).toBe('Timeline');
    expect(service.meetingInviteTitle).toBe('Invite');
    expect(service.meetingLoggerTitle).toBe('Log meeting');
    expect(service.authorizationLogo).toBe('https://example.com/logo.png');
    expect(service.additionalButtons).toEqual([
      { id: 'open', type: 'link', icon: 'open', label: 'Open' },
    ]);
    expect(service.sourceReady).toBe(false);
    service.setAuthorized(true, 'account');
    expect(service.sourceReady).toBe(true);

    requestWithPostMessage.mockResolvedValue({ data: [{ id: 'activity' }] });
    await service.fetchActivities({ id: 'contact' });
    expect(service.activities).toEqual([{ id: 'activity' }]);
    expect(service.activitiesLoaded).toBe(true);
    await service.openActivity({ id: 'activity' });
    await service.inviteMeeting({ id: 'meeting' });
    await service.onShowFeedback();
    await service.authorizeService();
    await service.onUpdateSetting({ id: 'setting-button', value: true });
    await service.onClickAdditionalButton('open', { id: 'resource' });
    await service.onClickSettingButton('setting-button');
    const preventDefault = jest.fn();
    await service.onClickVCard('https://example.com/contact.vcard', {
      currentTarget: { download: 'contact.vcard' },
      preventDefault,
    });

    expect(preventDefault).toHaveBeenCalled();
    expect(requestWithPostMessage).toHaveBeenCalledWith('/vcard', {
      vcardUri: 'https://example.com/contact.vcard',
    });
  });

  it('logs meetings, calls, and conversations with recording and transcript metadata', async () => {
    const service = createService({
      _callLoggerRecordingWithToken: true,
      _messageLoggerAttachmentWithToken: true,
      _callLogEntityMatchSourceAdded: true,
      _messageLogEntityMatchSourceAdded: true,
    });
    requestWithPostMessage.mockResolvedValue({});

    await service.logMeeting({
      id: 'meeting-id',
      recordings: [{ contentUri: 'https://recording.example.com/content' }],
    });
    await service.logCall({
      call: {
        sessionId: 'session-1',
        telephonySessionId: 'telephony-session-id',
        internalType: 'history',
        from: { extensionId: '101', name: 'Agent' },
        to: { extensionId: '102', name: 'Customer' },
        recording: {
          uri: 'https://platform.devtest.ringcentral.com/restapi/recording',
          contentUri: 'https://media.devtest.ringcentral.com/content?download=1',
        },
      },
      note: 'manual note',
    });
    const conversation = {
      conversationLogId: 'conversation-1',
      type: 'VoiceMail',
      messages: [{
        id: 'message-1',
        attachments: [{
          uri: 'https://media.devtest.ringcentral.com/voicemail',
        }],
      }],
    };
    await service.logConversation({
      item: conversation,
      note: 'message note',
    });

    expect(requestWithPostMessage).toHaveBeenCalledWith(
      '/meeting-log',
      {
        meeting: expect.objectContaining({
          recordings: [expect.objectContaining({
            link: 'https://v.ringcentral.com/welcome/meetings/recordings/recording/meeting-id',
          })],
        }),
      },
      6000,
    );
    expect(requestWithPostMessage).toHaveBeenCalledWith(
      '/call-log',
      expect.objectContaining({
        call: expect.objectContaining({
          recording: expect.objectContaining({
            link: expect.stringContaining('https://recording.example.com/sandbox?media='),
            contentUri: 'https://media.devtest.ringcentral.com/content?access_token=access-token',
          }),
        }),
        aiNote: 'AI note',
        transcript: 'Agent: hello',
      }),
      15000,
    );
    expect(requestWithPostMessage).toHaveBeenCalledWith(
      '/message-log',
      expect.objectContaining({
        conversation: expect.objectContaining({
          messages: [expect.objectContaining({
            transcript: 'Voicemail transcript',
            attachments: [expect.objectContaining({
              link: expect.stringContaining('https://recording.example.com/sandbox?media='),
              uri: 'https://media.devtest.ringcentral.com/voicemail?access_token=access-token',
            })],
          })],
        }),
      }),
      15000,
    );
    expect(service._deps.activityMatcher.match).toHaveBeenCalledWith({
      queries: ['session-1'],
      ignoreCache: true,
    });
    expect(service._deps.conversationMatcher.match).toHaveBeenCalledWith({
      queries: ['conversation-1'],
      ignoreCache: true,
    });
  });

  it('validates trigger inputs and handles missing registrations without posting', async () => {
    const service = createService({
      _contactsPath: null,
      _contactSearchPath: null,
      _contactMatchPath: null,
      _callLogEntityMatcherPath: null,
      _messageLogEntityMatcherPath: null,
      _activitiesPath: null,
      _activityPath: null,
      _meetingInvitePath: null,
      _meetingLoggerPath: null,
      _callLoggerPath: null,
      _messageLoggerPath: null,
      _authorizationPath: null,
      _feedbackPath: null,
      _additionalButtonPath: null,
      additionalButtons: [],
      settings: [],
    });

    await expect(service.fetchContacts()).resolves.toBeUndefined();
    await expect(service.searchContacts('Ada')).resolves.toEqual([]);
    await expect(service.matchContacts(['+1'])).resolves.toEqual({});
    await expect(service.matchCallLogEntities(['session-1'])).resolves.toEqual({});
    await expect(service.matchMessageLogEntities(['conversation-1'])).resolves.toEqual({});
    await service.fetchActivities({ id: 'contact' });
    await service.openActivity({ id: 'activity' });
    await service.inviteMeeting({ id: 'meeting' });
    await service.logMeeting({ id: 'meeting' });
    await service.logCall({ call: { sessionId: 'session-1' } });
    await service.logConversation({ item: { conversationLogId: 'conversation-1' } });
    await service.authorizeService();
    await service.onShowFeedback();
    await service.onClickAdditionalButton('missing');
    await service.onClickSettingButton('missing');
    service._triggerCallLoggerMatch('bad');
    service._triggerCallLoggerMatch(['missing']);
    service._triggerContactMatch('bad');
    service._triggerContactMatch(['missing']);

    expect(requestWithPostMessage).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith('Setting not found');
  });

  it('filters authorization links and exposes registered button groups', () => {
    const service = createService();
    ThirdPartyService.prototype._onRegisterAuthorization.call(service, {
      authorized: false,
      authorizedTitle: 'Disconnect',
      unauthorizedTitle: 'Connect',
      showAuthRedDot: true,
      authorizedAccount: 'Ada',
      showAuthButton: true,
      licenseStatus: 'Limited',
      licenseStatusColor: 'warning.f02',
      licenseDescription: 'Needs license',
      authorizationLinks: [
        { label: 'Docs', uri: 'https://example.com/docs' },
        { label: 'Support', uri: 'http://example.com/support' },
        { label: 'Bad protocol', uri: 'ftp://example.com/file' },
        { label: 'Script', uri: 'javascript:alert(1)' },
        { label: 1, uri: 'https://example.com/bad' },
      ],
    });
    expect(service.authorizationRegistered).toBe(true);
    expect(service.showAuthRedDot).toBe(true);
    expect(service.sourceReady).toBe(false);
    expect(service.authorizationLinks).toEqual([
      { label: 'Docs', uri: 'https://example.com/docs' },
      { label: 'Support', uri: 'http://example.com/support' },
    ]);

    ThirdPartyService.prototype.setAuthorized.call(service, true, 'Grace');
    ThirdPartyService.prototype.setLicenseStatus.call(
      service,
      'Active',
      'success.f02',
      'Licensed',
    );
    ThirdPartyService.prototype._onRegisterAdditionalButtons.call(service, {
      additionalButtons: [
        { id: 'sms', type: 'smsToolbar' },
        { id: 'call', type: 'callAction' },
        { id: 'message', type: 'messageAction' },
        { id: 'contact', type: 'contactAction' },
      ],
    });

    expect(service.sourceReady).toBe(true);
    expect(service.authorizedAccount).toBe('Grace');
    expect(service.licenseStatus).toBe('Active');
    expect(service.licenseStatusColor).toBe('success.f02');
    expect(service.licenseDescription).toBe('Licensed');
    expect(service.additionalSMSToolbarButtons).toEqual([{ id: 'sms', type: 'smsToolbar' }]);
    expect(service.additionalCallActions).toEqual([{ id: 'call', type: 'callAction' }]);
    expect(service.additionalMessageActions).toEqual([{ id: 'message', type: 'messageAction' }]);
    expect(service.additionalContactActions).toEqual([{ id: 'contact', type: 'contactAction' }]);
  });

  it('registers logger settings, matched-contact viewing, and external checks', async () => {
    const service = createService();

    service._registerCallLogger({
      callLoggerPath: '/call-log',
      callLoggerTitle: 'Log call',
      recordingWithToken: true,
      showLogModal: true,
      callLoggerAutoSettingLabel: 'Auto log',
      callLoggerAutoSettingDescription: 'Auto log calls',
      callLoggerAutoSettingReadOnly: true,
      callLoggerAutoSettingReadOnlyReason: 'Policy',
      callLoggerAutoSettingReadOnlyValue: false,
      callLoggerAutoSettingWarning: 'Required',
      callLoggerAutoLogOnCallSync: true,
      callLoggerHideEditLogButton: true,
      callLoggerAutoLogSettingHidden: true,
    });
    service._registerMessageLogger({
      messageLoggerPath: '/message-log',
      messageLoggerTitle: 'Log message',
      attachmentWithToken: true,
      messageLoggerAutoSettingLabel: 'Message auto log',
      messageLoggerAutoSettingDescription: 'Auto log messages',
      messageLoggerAutoSettingReadOnly: true,
      messageLoggerAutoSettingReadOnlyReason: 'Readonly',
      messageLoggerAutoSettingReadOnlyValue: true,
      messageLoggerAutoSettingHidden: true,
    });
    service._registerViewMatchedContact();

    expect(service.callLoggerRegistered).toBe(true);
    expect(service.callLoggerTitle).toBe('Log call');
    expect(service.callLoggerAutoSettingReadOnlyValue).toBe(false);
    expect(service.callLoggerAutoSettingWarning).toBe('Required');
    expect(service.callLoggerAutoLogOnCallSync).toBe(true);
    expect(service.callLoggerHideEditLogButton).toBe(true);
    expect(service.callLoggerAutoLogSettingHidden).toBe(true);
    expect(service.messageLoggerRegistered).toBe(true);
    expect(service.messageLoggerTitle).toBe('Log message');
    expect(service.messageLoggerAutoSettingReadOnlyValue).toBe(true);
    expect(service.messageLoggerAutoSettingHidden).toBe(true);
    expect(service.viewMatchedContactExternal).toBe(true);

    await service.onClickLicenseRefreshButton();
    requestWithPostMessage.mockResolvedValueOnce({ data: true });
    service._registerDoNotContact({ doNotContactPath: '/do-not-contact' });
    await expect(service.checkDoNotContact({ id: 'contact-1' })).resolves.toBe(true);
    expect(service.doNotContactRegistered).toBe(true);
    expect(requestWithPostMessage).toHaveBeenCalledWith('/do-not-contact', { id: 'contact-1' });

    const noCheckService = createService({ _doNotContactPath: null });
    await expect(noCheckService.checkDoNotContact({ id: 'contact-2' })).resolves.toBe(false);
  });

  it('updates customized pages and posts customized-page actions', async () => {
    const service = createService();
    service._callLogPageInputChangedEventPath = '/call-page-change';
    service._messagesLogPageInputChangedEventPath = '/messages-page-change';
    service._customizedPageInputChangedEventPath = '/custom-page-change';
    requestWithPostMessage.mockResolvedValue({});

    service.updateCustomizedPage({});
    expect(console.error).toHaveBeenCalledWith('Customized page id is required');

    service.updateCustomizedPage({
      id: 'tab-1',
      type: 'tab',
      title: 'Timeline',
      iconUri: 'light.svg',
      activeIconUri: 'active.svg',
      darkIconUri: 'dark.svg',
      priority: 10,
      unreadCount: 2,
      actions: [{ id: 'refresh', title: 'Refresh' }],
    });
    service.updateCustomizedPage({
      id: 'tab-1',
      unreadCount: 3,
      hidden: true,
    });
    service._onUpdateCallLogPage({
      page: {
        title: 'Call form',
      },
    });
    service._onUpdateCallLogPage({
      page: {
        uiSchema: {
          submitButtonOptions: {
            norender: true,
          },
        },
      },
    });
    service._onUpdateMessagesLogPage({
      page: {
        title: 'Messages form',
      },
    });
    service._onRegisterCustomizedPage({
      page: {
        id: 'page-1',
        type: 'page',
        title: 'Profile',
      },
    });

    expect(service.customizedLogCallPage).toEqual(
      expect.objectContaining({
        id: '$LOG-CALL',
        uiSchema: {
          submitButtonOptions: {
            submitText: 'Save',
            norender: true,
          },
        },
      }),
    );
    expect(service.customizedLogMessagesPage).toEqual(
      expect.objectContaining({ id: '$LOG-MESSAGES', title: 'Messages form' }),
    );
    expect(service.getCustomizedPage('page-1')).toEqual(
      expect.objectContaining({ title: 'Profile' }),
    );
    expect(service.customizedTabs).toEqual([
      {
        id: 'tab-1',
        label: 'Timeline',
        iconUri: 'light.svg',
        activeIconUri: 'active.svg',
        darkIconUri: 'dark.svg',
        priority: 10,
        unreadCount: 3,
        path: '/customizedTabs/tab-1',
        hidden: true,
        actions: [{ id: 'refresh', title: 'Refresh' }],
      },
    ]);

    await service.onCustomizedLogCallPageInputChanged({
      call: { sessionId: 'session-1' },
      formData: { note: 'call note' },
      keys: ['note'],
    });
    await service.onCustomizedLogMessagesPageInputChanged({
      conversation: { conversationLogId: 'conversation-1' },
      formData: { note: 'message note' },
      keys: ['note'],
    });
    await service.onCustomizedPageInputChanged({
      pageId: 'page-1',
      formData: { name: 'Ada' },
      keys: ['name'],
    });
    await service.onCustomizedPageInputChanged({
      pageId: 'missing-page',
      formData: {},
      keys: [],
    });
    await service.onClickButtonInCustomizedPage('save', 'customizedPageButton', {
      name: 'Ada',
    });
    await service.onClickLinkInAlertDetail('alert-link');
    await service.onClickCustomizedTabAction('tab-1', 'refresh');

    expect(requestWithPostMessage).toHaveBeenCalledWith('/call-page-change', {
      call: { sessionId: 'session-1' },
      formData: { note: 'call note' },
      keys: ['note'],
      page: service.customizedLogCallPage,
    });
    expect(requestWithPostMessage).toHaveBeenCalledWith('/messages-page-change', {
      conversation: { conversationLogId: 'conversation-1' },
      formData: { note: 'message note' },
      keys: ['note'],
      page: service.customizedLogMessagesPage,
    });
    expect(requestWithPostMessage).toHaveBeenCalledWith('/custom-page-change', {
      page: service.getCustomizedPage('page-1'),
      formData: { name: 'Ada' },
      keys: ['name'],
    });
    expect(requestWithPostMessage).toHaveBeenCalledWith('/button', {
      button: {
        id: 'save',
        type: 'customizedPageButton',
        formData: { name: 'Ada' },
      },
    });
    expect(requestWithPostMessage).toHaveBeenCalledWith('/button', {
      button: {
        id: 'alert-link',
        type: 'linkInAlertDetail',
      },
    });
    expect(requestWithPostMessage).toHaveBeenCalledWith('/button', {
      button: {
        id: 'refresh',
        type: 'customizedTabAction',
        tabId: 'tab-1',
      },
    });

    const noButtonPathService = createService({ _additionalButtonPath: null });
    await noButtonPathService.onClickLinkInAlertDetail('alert-link');
    await noButtonPathService.onClickCustomizedTabAction('tab-1', 'refresh');
    expect(console.warn).toHaveBeenCalledWith('Button event is not registered, ');
  });

  it('registers voicemail drop file fetchers from the service', async () => {
    const service = createService();
    service._registerVoicemailDropFiles({ voicemailDropFilesPath: '/voicemail-files' });

    expect(service._deps.voicemailDrop.setExternalVoicemailFetcher).toHaveBeenCalled();
    const fetcher = service._deps.voicemailDrop.setExternalVoicemailFetcher.mock.calls[0][0];
    requestWithPostMessage.mockResolvedValueOnce({
      data: [{ id: 'file-1', name: 'Intro' }],
    });
    await expect(fetcher()).resolves.toEqual([{ id: 'file-1', name: 'Intro' }]);

    requestWithPostMessage.mockResolvedValueOnce({
      data: { id: 'bad-file' },
    });
    await expect(fetcher()).resolves.toEqual([]);
    expect(console.error).toHaveBeenCalledWith('Voicemail drop files must be an array');
  });

  it('updates widget apps, pins apps, and loads app pages by event type', async () => {
    const service = createService();
    const app = {
      id: 'app-1',
      name: 'CRM App',
      pagePath: '/app-page',
      inputChangedPath: '/app-input',
      submitPath: '/app-submit',
      buttonEventPath: '/app-button',
    };

    service.updateApps({});
    expect(console.error).toHaveBeenCalledWith('App id is required');
    service.updateApps(app);
    service.updateApps({ id: 'app-1', name: 'CRM App Updated', extra: true });
    service._onRegisterApp({
      app: { id: 'app-2', name: 'Tasks', pagePath: '/tasks' },
    });
    service.removeApp('missing-app');
    service._onUnregisterApp({ appId: 'app-2' });
    service.toggleAppPin('app-1');
    service.toggleAppPin('app-2');
    service.toggleAppPin('app-1');

    expect(service.apps).toEqual([
      expect.objectContaining({
        id: 'app-1',
        name: 'CRM App Updated',
        extra: true,
      }),
    ]);
    expect(service.pinAppIds).toEqual(['app-2']);

    requestWithPostMessage.mockResolvedValue({ data: { schema: 'loaded' } });
    await expect(service.loadAppPage({ app: null, contact: null })).resolves.toBeUndefined();
    await expect(service.loadAppPage({
      app,
      contact: { id: 'contact-1' },
      type: 'inputChanged',
      formData: { name: 'Ada' },
      changedKeys: ['name'],
      theme: 'dark',
    })).resolves.toEqual({ schema: 'loaded' });
    await expect(service.loadAppPage({
      app,
      contact: { id: 'contact-1' },
      type: 'submit',
      formData: { name: 'Ada' },
    })).resolves.toEqual({ schema: 'loaded' });
    await expect(service.loadAppPage({
      app,
      contact: { id: 'contact-1' },
      type: 'buttonClick',
      button: { id: 'save' },
      formData: { name: 'Ada' },
    })).resolves.toEqual({ schema: 'loaded' });
    await expect(service.loadAppPage({
      app,
      contact: { id: 'contact-1' },
      type: 'refresh',
      formData: { name: 'Ada' },
    })).resolves.toEqual({ schema: 'loaded' });
    await expect(service.loadAppPage({
      app: { id: 'app-3' },
      contact: { id: 'contact-1' },
      type: 'submit',
    })).resolves.toBeUndefined();

    requestWithPostMessage.mockRejectedValueOnce(new Error('app failed'));
    await expect(service.loadAppPage({
      app,
      contact: { id: 'contact-1' },
    })).resolves.toBeNull();

    expect(requestWithPostMessage).toHaveBeenCalledWith(
      '/app-input',
      {
        contact: { id: 'contact-1' },
        app,
        theme: 'dark',
        formData: { name: 'Ada' },
        changedKeys: ['name'],
      },
      15000,
    );
    expect(requestWithPostMessage).toHaveBeenCalledWith(
      '/app-submit',
      {
        contact: { id: 'contact-1' },
        app,
        theme: 'light',
        formData: { name: 'Ada' },
      },
      15000,
    );
    expect(requestWithPostMessage).toHaveBeenCalledWith(
      '/app-button',
      {
        contact: { id: 'contact-1' },
        app,
        theme: 'light',
        button: { id: 'save' },
        formData: { name: 'Ada' },
      },
      15000,
    );
    expect(requestWithPostMessage).toHaveBeenCalledWith(
      '/app-page',
      {
        contact: { id: 'contact-1' },
        app,
        theme: 'light',
        refresh: true,
        formData: { name: 'Ada' },
      },
      15000,
    );
    expect(console.error).toHaveBeenCalledWith('Load app page error', expect.any(Error));
  });

  it('updates customized banners and posts banner actions', async () => {
    const service = createService();
    requestWithPostMessage.mockResolvedValue({});

    service._setCustomizedBanner({
      id: 'banner-1',
      message: 'Trial ending',
      action: { label: 'Upgrade' },
    });
    expect(service.customizedBanner).toEqual({
      id: 'banner-1',
      message: 'Trial ending',
      severity: 'info',
      action: { label: 'Upgrade' },
      closable: false,
    });

    await service.onBannerAction();
    await service.onBannerClose();
    expect(service.customizedBanner).toBeNull();
    expect(requestWithPostMessage).toHaveBeenCalledWith('/button', {
      button: {
        id: 'banner-1',
        type: 'customizedBanner',
        label: 'Upgrade',
      },
    });
    expect(requestWithPostMessage).toHaveBeenCalledWith('/button', {
      button: {
        id: 'banner-1',
        type: 'customizedBanner',
        dismissed: true,
      },
    });

    service._setCustomizedBanner({
      id: 'banner-2',
      hidden: true,
    });
    expect(service.customizedBanner).toBeNull();

    const noButtonPathService = createService({ _additionalButtonPath: null });
    noButtonPathService._setCustomizedBanner({ id: 'banner-3', message: 'No path' });
    await noButtonPathService.onBannerAction();
    expect(console.warn).toHaveBeenCalledWith('Button event path is not registered');

    const noBannerService = createService();
    noBannerService.customizedBanner = null;
    await noBannerService.onBannerAction();
    expect(console.warn).toHaveBeenCalledWith('Banner not found');

    requestWithPostMessage.mockRejectedValueOnce(new Error('banner action failed'));
    service._setCustomizedBanner({ id: 'banner-4', message: 'Retry', action: { label: 'Retry' } });
    await service.onBannerAction();
    expect(console.error).toHaveBeenCalledWith('Banner action error', expect.any(Error));

    requestWithPostMessage.mockRejectedValueOnce(new Error('banner close failed'));
    service._setCustomizedBanner({ id: 'banner-5', message: 'Close me' });
    await service.onBannerClose();
    expect(console.error).toHaveBeenCalledWith('Banner close error', expect.any(Error));
  });

  it('covers authorization lifecycle guards and fallback branches', async () => {
    const service = createService();

    service.fetchContacts = jest.fn(async () => {});
    service._contactSearchPath = null;
    service._registerContactSearch();
    expect(service._deps.contactSearch.addSearchSource).not.toHaveBeenCalled();
    service._contactSearchPath = '/contact-search';
    service._registerContactSearch();
    service._registerContactSearch();
    expect(service._deps.contactSearch.addSearchSource).toHaveBeenCalledTimes(1);

    service._contactMatchPath = '/contact-match';
    service._contactMatchTtl = 30;
    service._contactNoMatchTtl = 10;
    service._registerContactMatch();
    service._registerContactMatch();
    expect(service._deps.contactMatcherOptions).toEqual({
      ttl: 30,
      noMatchTtl: 10,
    });
    expect(service._deps.contactMatcher.addSearchProvider).toHaveBeenCalledTimes(1);

    service._callLogEntityMatcherPath = '/call-match';
    service._messageLogEntityMatcherPath = '/message-match';
    service._registerCallLogEntityMatch();
    service._registerCallLogEntityMatch();
    service._registerMessageLogEntityMatch();
    service._registerMessageLogEntityMatch();
    expect(service._deps.activityMatcher.addSearchProvider).toHaveBeenCalledTimes(1);
    expect(service._deps.conversationMatcher.addSearchProvider).toHaveBeenCalledTimes(1);

    service._deps.tabManager.autoMainTab = true;
    service._deps.tabManager.active = false;
    service._onAuthorizedChanged(true, false);
    expect(service.fetchContacts).toHaveBeenCalled();
    expect(service._deps.contactMatcher.triggerMatch).not.toHaveBeenCalled();
    service._deps.tabManager.autoMainTab = false;
    service._deps.tabManager.active = true;
    service.fetchContacts.mockClear();
    service._deps.contactMatcher.triggerMatch.mockClear();
    service._deps.activityMatcher.triggerMatch.mockClear();
    service._deps.conversationMatcher.triggerMatch.mockClear();
    service._onAuthorizedChanged(true, true);
    expect(service.fetchContacts).toHaveBeenCalled();
    expect(service._deps.contactMatcher.triggerMatch).toHaveBeenCalled();
    expect(service._deps.activityMatcher.triggerMatch).toHaveBeenCalled();
    expect(service._deps.conversationMatcher.triggerMatch).toHaveBeenCalled();

    service._onAuthorizedChanged(false, false);
    expect(service._searchSourceAdded).toBe(false);
    expect(service._contactMatchSourceAdded).toBe(false);
    expect(service._callLogEntityMatchSourceAdded).toBe(false);
    expect(service._messageLogEntityMatchSourceAdded).toBe(false);

    service._registerContacts({ contactsPath: '/contacts', contactIcon: 'icon.png' });
    service._registerContacts({ contactsPath: '/contacts', contactIcon: 'icon.png' });
    expect(service._deps.contactSources.filter((source) => source === service)).toHaveLength(1);
    expect(service.filterContacts('missing')).toEqual([]);

    service._registerButtons({ buttonEventPath: '/button', buttons: null });
    expect(service.additionalButtons).toEqual([]);
    service._registerButtons({
      buttonEventPath: '/button',
      buttons: [{ id: 'bad', type: 'link', label: 'Bad' }],
    });
    expect(service.additionalButtons).toEqual([]);

    await expect(service._fetchUpcomingMeetingList()).resolves.toEqual([]);
    service._meetingUpcomingPath = '/upcoming';
    requestWithPostMessage.mockResolvedValueOnce({ data: { id: 'bad' } });
    await expect(service._fetchUpcomingMeetingList()).resolves.toEqual([]);
    requestWithPostMessage.mockRejectedValueOnce(new Error('upcoming failed'));
    await expect(service._fetchUpcomingMeetingList()).resolves.toEqual([]);

    const unauthorizedService = createService({
      authorized: false,
      _fetchContactsPromise: null,
    });
    unauthorizedService._onRegisterAuthorization({ authorized: false });
    await expect(unauthorizedService.fetchContacts()).resolves.toBeUndefined();

    const pendingService = createService({
      _fetchContactsPromise: Promise.resolve({ contacts: [], syncTimestamp: 1 }),
    });
    pendingService._setContactSyncing = jest.fn();
    await pendingService.fetchContacts();
    expect(pendingService._setContactSyncing).not.toHaveBeenCalled();

    const fetchErrorService = createService();
    requestWithPostMessage.mockRejectedValueOnce(new Error('fetch failed'));
    await fetchErrorService.fetchContacts();
    expect(fetchErrorService.contactSyncing).toBe(false);
    expect(console.error).toHaveBeenCalledWith(expect.any(Error));

    requestWithPostMessage.mockResolvedValueOnce({ data: null, syncTimestamp: 10 });
    await expect(service._fetchContacts()).resolves.toEqual({
      contacts: [],
      syncTimestamp: 10,
    });
    requestWithPostMessage.mockResolvedValueOnce({ data: {} });
    await expect(service.searchContacts('Ada')).resolves.toEqual([]);
    requestWithPostMessage.mockRejectedValueOnce(new Error('search failed'));
    await expect(service.searchContacts('Ada')).resolves.toEqual([]);

    requestWithPostMessage.mockResolvedValueOnce({ data: {} });
    await expect(service.matchContacts(['+16505550100'])).resolves.toEqual({});
    requestWithPostMessage.mockResolvedValueOnce({ data: null });
    await expect(service.matchContacts(['+16505550100'])).resolves.toEqual({});
    requestWithPostMessage.mockRejectedValueOnce(new Error('match failed'));
    await expect(service.matchContacts(['+16505550100'])).resolves.toEqual({});

    requestWithPostMessage.mockResolvedValueOnce({ data: {} });
    await expect(service.matchCallLogEntities(['session-1'])).resolves.toEqual({});
    requestWithPostMessage.mockRejectedValueOnce(new Error('call match failed'));
    await expect(service.matchCallLogEntities(['session-1'])).resolves.toEqual({});
    requestWithPostMessage.mockResolvedValueOnce({ data: {} });
    await expect(service.matchMessageLogEntities(['conversation-1'])).resolves.toEqual({});
    requestWithPostMessage.mockRejectedValueOnce(new Error('message match failed'));
    await expect(service.matchMessageLogEntities(['conversation-1'])).resolves.toEqual({});

    await service.onViewMatchedContactExternal({ id: 'contact-1' });
    requestWithPostMessage.mockRejectedValueOnce(new Error('view failed'));
    await service.onViewMatchedContactExternal({ id: 'contact-1' });

    requestWithPostMessage.mockRejectedValueOnce(new Error('activities failed'));
    await service.fetchActivities({ id: 'contact-1' });
    requestWithPostMessage.mockRejectedValueOnce(new Error('activity failed'));
    await service.openActivity({ id: 'activity-1' });
    requestWithPostMessage.mockRejectedValueOnce(new Error('invite failed'));
    await service.inviteMeeting({ id: 'meeting-1' });

    await expect(service.logMeeting({ id: 'meeting-2' })).resolves.toBeUndefined();
    requestWithPostMessage.mockRejectedValueOnce(new Error('meeting failed'));
    await service.logMeeting({ id: 'meeting-3' });
    expect(service.getRecordingLink(null)).toBeNull();
    expect(service.getRecordingLink({
      contentUri: 'https://media.ringcentral.com/content',
      uri: 'https://platform.ringcentral.com/restapi/recording',
    })).toBe('https://recording.example.com/?media=https%3A%2F%2Fmedia.ringcentral.com%2Fcontent');
    service._callLoggerRecordingWithToken = false;
    expect(service.getRecordingContentUri({
      contentUri: 'https://media.ringcentral.com/content?download=1',
    })).toBe('https://media.ringcentral.com/content');

    service._deps.smartNotes.hasPermission = false;
    requestWithPostMessage.mockResolvedValueOnce({});
    await service.logCall({
      call: {
        result: 'Disconnected',
        sessionId: 'session-no-note',
      },
    });
    requestWithPostMessage.mockRejectedValueOnce(new Error('call log failed'));
    await service.logCall({
      call: {
        sessionId: 'session-error',
      },
    });

    requestWithPostMessage.mockResolvedValueOnce({});
    await service.logConversation({
      item: {
        conversationLogId: 'fax-1',
        messages: [{ id: 'fax-message' }],
        type: 'Fax',
      },
    });
    requestWithPostMessage.mockRejectedValueOnce(new Error('message log failed'));
    await service.logConversation({
      item: {
        conversationLogId: 'conversation-error',
        type: 'SMS',
      },
    });

    const vcardPreventDefault = jest.fn();
    await service.onClickVCard('https://example.com/contact.txt', {
      currentTarget: { download: 'contact.txt' },
      preventDefault: vcardPreventDefault,
    });
    expect(vcardPreventDefault).not.toHaveBeenCalled();

    service.settings = [{ id: 'setting-button', buttonLabel: 'Run', name: 'Setting Button' }];
    service._additionalButtonPath = null;
    await service.onClickSettingButton('setting-button');
    expect(console.error).toHaveBeenCalledWith('additionalButtonPath is not registered');
    service._additionalButtonPath = '/button';
    await service.onClickButtonInCustomizedPage('simple', 'customizedPageButton');
    expect(requestWithPostMessage).toHaveBeenCalledWith('/button', {
      button: {
        id: 'simple',
        type: 'customizedPageButton',
      },
    });

    const noPathService = createService({
      _callLogPageInputChangedEventPath: null,
      _customizedPageInputChangedEventPath: null,
      _messagesLogPageInputChangedEventPath: null,
    });
    await noPathService.onCustomizedLogCallPageInputChanged({ call: {}, formData: {}, keys: [] });
    await noPathService.onCustomizedLogMessagesPageInputChanged({ conversation: {}, formData: {}, keys: [] });
    await noPathService.onCustomizedPageInputChanged({ pageId: 'page-1', formData: {}, keys: [] });
    await expect(noPathService.sync({ type: 'manual' })).resolves.toBeUndefined();
  });
});
