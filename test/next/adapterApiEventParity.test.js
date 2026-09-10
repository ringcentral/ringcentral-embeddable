jest.mock('@ringcentral-integration/micro-phone/src/app/views', () => ({
  DialerView: class DialerView {},
}));
jest.mock(
  '@ringcentral-integration/micro-phone/src/app/views/CallView/services',
  () => ({
    CallViewState: class CallViewState {},
  })
);
jest.mock('../../next/app/views/SideWidgetView', () => ({
  SideWidgetView: class SideWidgetView {},
}));
jest.mock('../../next/app/services/SmartNotes', () => ({
  SmartNotes: class SmartNotes {},
}));

const { Adapter } = require('../../next/app/services/Adapter');
const AdapterClient = require('../../next/lib/Adapter').default;

function createAdapter(overrides = {}) {
  return Object.assign(Object.create(Adapter.prototype), overrides);
}

function createAdapterInstance() {
  return new Adapter(
    {},
    { enable: jest.fn() },
    { shared: true, onClient: jest.fn() },
    {},
    {},
    {},
    {},
    {},
    {},
    {},
    {},
    {},
    {},
    {},
    {},
    {},
    {},
    {},
    {},
    {},
    {},
    {},
    {}
  );
}

describe('Adapter API and event parity', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('registers the client bridge synchronously and defers its work', () => {
    jest.useFakeTimers();
    const onClient = jest.fn();
    const adapter = new Adapter(
      {},
      { enable: jest.fn() },
      { shared: true, onClient },
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {}
    );

    expect(onClient).toHaveBeenCalledTimes(1);
    const bindClient = jest.fn();
    adapter._bindClient = bindClient;
    const bindClientBridge = onClient.mock.calls[0][0];
    bindClientBridge();
    bindClientBridge();
    expect(bindClient).not.toHaveBeenCalled();
    jest.runAllTimers();
    expect(bindClient).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  test('exposes refreshLoginSession through the Adapter client', async () => {
    const request = jest.fn(async () => ({ result: 'ok' }));
    const client = createAdapter({ _requestWithPostMessage: request });

    await expect(
      AdapterClient.prototype.refreshLoginSession.call(client, true)
    ).resolves.toEqual({ result: 'ok' });
    expect(request).toHaveBeenCalledWith('/refresh-login-session', {
      force: true,
    });
  });

  test.each([
    [false, 'ensureLoggedIn'],
    [true, 'get'],
  ])('refreshes the login session with force=%s', async (force, method) => {
    const ensureLoggedIn = jest.fn(async () => {});
    const get = jest.fn(async () => {});
    const response = jest.fn();
    const adapter = createAdapter({
      _client: {
        service: {
          ensureLoggedIn,
          platform: () => ({ get }),
        },
      },
      _postRCAdapterMessageResponse: response,
    });

    await adapter._handleRCAdapterMessageRequest({
      requestId: 'refresh-request',
      path: '/refresh-login-session',
      body: { force },
    });

    expect(method === 'get' ? get : ensureLoggedIn).toHaveBeenCalledTimes(1);
    expect(response).toHaveBeenCalledWith({
      responseId: 'refresh-request',
      response: { result: 'ok' },
    });
  });

  test('preserves the legacy presence payload', async () => {
    const update = jest.fn(async () => {});
    const adapter = createAdapter({
      _presence: {
        ready: true,
        userStatus: 'Offline',
        dndStatus: 'TakeAllCalls',
        _update: update,
      },
    });

    await adapter._setPresence({
      userStatus: 'Available',
      dndStatus: 'DoNotAcceptAnyCalls',
    });

    expect(update).toHaveBeenCalledWith({
      userStatus: 'Available',
      dndStatus: 'DoNotAcceptAnyCalls',
    });
  });

  test('updates ringtone volume without requiring a custom ringtone', async () => {
    const setData = jest.fn(async () => {});
    const uploadCustomRingtone = jest.fn();
    const adapter = createAdapter({
      _audioSettings: { setData },
      _ringtoneConfiguration: { uploadCustomRingtone },
    });

    await adapter._updateRingtone({ volume: 0.5 });

    expect(setData).toHaveBeenCalledWith({ ringtoneVolume: 0.5 });
    expect(uploadCustomRingtone).not.toHaveBeenCalled();
  });

  test('opens an existing conversation when conversation is requested', async () => {
    const updateMessageText = jest.fn(async () => {});
    const addAttachments = jest.fn(async () => {});
    const clean = jest.fn();
    const adapter = createAdapter({
      _auth: { loggedIn: true },
      _regionSettings: { countryCode: 'US', areaCode: '650' },
      _router: { push: jest.fn(async () => {}) },
      _composeText: { clean },
      _conversations: {
        allConversations: [
          {
            conversationId: 'conversation-id',
            direction: 'Inbound',
            from: { phoneNumber: '+16505550100' },
            to: [{ phoneNumber: '+16505550101' }],
            type: 'SMS',
          },
        ],
        loadConversation: jest.fn(async () => {}),
        updateMessageText,
        addAttachments,
      },
    });

    await adapter._newSMS('+16505550100', 'hello', true);

    expect(adapter._router.push).toHaveBeenCalledWith(
      '/conversations/conversation-id'
    );
    expect(updateMessageText).toHaveBeenCalledWith('hello');
    expect(clean).not.toHaveBeenCalled();
  });

  test('routes all formerly missing commands', async () => {
    const adapter = createAdapterInstance();
    Object.assign(adapter, {
      _autoPopulateConversation: jest.fn(async () => {}),
      _pickCall: jest.fn(async () => {}),
      _onUpdateFeatureConfig: jest.fn(),
      _setCallContactMatched: jest.fn(async () => {}),
      _showClientWindow: jest.fn(),
      _root: { setExpanded: jest.fn(async () => {}) },
    });

    const messages = [
      { type: 'rc-adapter-auto-populate-conversation', text: 'text' },
      {
        type: 'rc-adapter-pick-call',
        extensionId: 'extension-id',
        telephonySessionId: 'telephony-id',
      },
      { type: 'rc-adapter-update-features-flags', text: false },
      { type: 'rc-adapter-set-side-drawer-extended', extended: true },
      {
        type: 'rc-adapter-set-call-contact-matches-select',
        contactId: 'contact-id',
        telephonySessionId: 'telephony-id',
      },
      { type: 'rc-adapter-popOut' },
    ];
    messages.forEach((data) => adapter._onWindowMessage({ data }));
    await new Promise((resolve) => setImmediate(resolve));

    expect(adapter._autoPopulateConversation).toHaveBeenCalled();
    expect(adapter._pickCall).toHaveBeenCalled();
    expect(adapter._onUpdateFeatureConfig).toHaveBeenCalled();
    expect(adapter._root.setExpanded).toHaveBeenCalledWith(true);
    expect(adapter._setCallContactMatched).toHaveBeenCalled();
    expect(adapter._showClientWindow).toHaveBeenCalled();
  });

  test('emits incremental message thread and entity events', () => {
    const postMessage = jest.fn();
    const adapter = createAdapter({
      _postMessage: postMessage,
      _messageThread: {
        token: 'thread-token',
        entriesToken: 'entries-token',
        data: {
          threads: {
            thread: {
              threadInfo: { id: 'thread', status: 'Open' },
            },
          },
          messages: {
            message: { id: 'message', text: 'old' },
          },
        },
      },
      _lastMessageThreadSignatures: new Map(),
      _lastMessageThreadEntitySignatures: new Map(),
      _isMessageThreadSnapshotReady: false,
      _isMessageThreadEntitySnapshotReady: false,
    });
    adapter._captureMessageThreadSnapshots();
    adapter._messageThread.data = {
      threads: {
        thread: { threadInfo: { id: 'thread', status: 'Resolved' } },
      },
      messages: {
        message: { id: 'message', text: 'new' },
      },
    };

    adapter._notifyMessageThreadUpdates();

    expect(postMessage).toHaveBeenCalledWith({
      type: 'rc-message-thread-notify',
      thread: { id: 'thread', status: 'Resolved' },
    });
    expect(postMessage).toHaveBeenCalledWith({
      type: 'rc-message-thread-entity-notify',
      entity: { id: 'message', text: 'new' },
    });
  });

  test('does not emit message thread events for initial history hydration', () => {
    const postMessage = jest.fn();
    const adapter = createAdapter({
      _postMessage: postMessage,
      _messageThread: {
        token: null,
        entriesToken: null,
        data: { threads: {}, messages: {} },
      },
      _lastMessageThreadSignatures: new Map(),
      _lastMessageThreadEntitySignatures: new Map(),
      _isMessageThreadSnapshotReady: false,
      _isMessageThreadEntitySnapshotReady: false,
    });
    adapter._captureMessageThreadSnapshots();
    adapter._messageThread.token = 'thread-token';
    adapter._messageThread.entriesToken = 'entries-token';
    adapter._messageThread.data = {
      threads: {
        thread: { threadInfo: { id: 'thread', status: 'Open' } },
      },
      messages: {
        message: { id: 'message', text: 'history' },
      },
    };

    adapter._notifyMessageThreadUpdates();

    expect(postMessage).not.toHaveBeenCalled();
  });

  test('emits telephony session updates only on the active tab', () => {
    const postMessage = jest.fn();
    const adapter = createAdapter({
      _postMessage: postMessage,
      _activeCallControl: {
        telephonySessionUpdate: {
          sequence: 2,
          session: { id: 'telephony-session', status: 'Disconnected' },
        },
      },
      _lastTelephonySessionSequence: 1,
      _adapterOptions: { disableInactiveTabCallEvent: true },
      _tabManager: { ready: true, active: true },
    });

    adapter._notifyTelephonySessionUpdate();

    expect(postMessage).toHaveBeenCalledWith({
      type: 'rc-telephony-session-notify',
      telephonySession: {
        id: 'telephony-session',
        status: 'Disconnected',
      },
    });
    adapter._activeCallControl.telephonySessionUpdate = {
      sequence: 3,
      session: { id: 'suppressed' },
    };
    adapter._tabManager.active = false;
    adapter._notifyTelephonySessionUpdate();
    expect(postMessage).toHaveBeenCalledTimes(1);
  });

  test('restores feature flag updates without clearing previous overrides', async () => {
    const setConfigState = jest.fn();
    const adapter = createAdapter({
      _appFeatures: {
        configState: { NoiseReduction: true },
        setConfigState,
      },
    });

    await adapter._onUpdateFeatureConfig({ text: false, contacts: true });

    expect(setConfigState).toHaveBeenCalledWith({
      NoiseReduction: true,
      Pages: false,
      SMS: false,
      Contacts: true,
    });
  });

  test('routes monitored-extension pickup by extension type', async () => {
    const activeCall = { telephonySessionId: 'telephony-id' };
    const pickParkLocation = jest.fn(async () => {});
    const adapter = createAdapter({
      _callingSettings: {
        callingMode: 'callingModes-webphone',
        fromNumber: '+16505550100',
      },
      _monitoredExtensions: {
        monitoredExtensions: [
          {
            extension: { id: 'park-id', type: 'ParkLocation' },
            presence: { activeCalls: [activeCall] },
          },
        ],
      },
      _webphone: { pickParkLocation },
      _postMessage: jest.fn(),
    });

    await adapter._pickCall('park-id', 'telephony-id');

    expect(pickParkLocation).toHaveBeenCalledWith(
      'park-id',
      activeCall,
      '+16505550100'
    );
  });

  test('preserves calling-settings payload gates and selected location', () => {
    const postMessage = jest.fn();
    const adapter = createAdapter({
      _postMessage: postMessage,
      _adapterOptions: {
        enableFromNumberSetting: true,
        showMyLocationNumbers: true,
      },
      _callingSettings: {
        ready: true,
        callWith: 'callingOptions-browser',
        callingMode: 'callingModes-webphone',
        fromNumber: '+16505550100',
        fromNumbers: [{ phoneNumber: '+16505550100' }],
        myLocation: '+16505550101',
        availableNumbersWithLabel: [{ value: '+16505550101' }],
      },
    });

    adapter._notifyCallingSettings();

    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        myLocation: '+16505550101',
        fromNumber: '+16505550100',
      })
    );
  });

  test('enriches call events and persists an explicit contact selection', async () => {
    const contact = { id: 'contact-id', name: 'Contact' };
    const updateSessionMatchedContact = jest.fn(async () => {});
    const select = jest.fn(async () => {});
    const session = {
      id: 'webphone-id',
      direction: 'Inbound',
      from: '+16505550100',
      partyData: { sessionId: 'telephony-id' },
    };
    const adapter = createAdapter({
      _contactMatcher: {
        dataMapping: { '+16505550100': [contact] },
      },
      _webphone: {
        sessions: [session],
        updateSessionMatchedContact,
      },
      _callMonitor: {
        allCalls: [
          { sessionId: 'call-session-id', telephonySessionId: 'telephony-id' },
        ],
      },
      _matchedContactSelection: { select },
    });

    expect(adapter._withContactMatch(session)).toEqual({
      ...session,
      contactMatch: contact,
    });
    await adapter._setCallContactMatched({
      contactId: 'contact-id',
      telephonySessionId: 'telephony-id',
    });

    expect(updateSessionMatchedContact).toHaveBeenCalledWith(
      'webphone-id',
      contact
    );
    expect(select).toHaveBeenCalledWith({
      scope: 'call',
      key: 'call-session-id',
      entityId: 'contact-id',
    });
  });

  test('emits SMS settings only when the legacy option enables it', () => {
    const postMessage = jest.fn();
    const adapter = createAdapter({
      _postMessage: postMessage,
      _adapterOptions: { enableSmsSettingEvent: false },
      _composeText: {
        ready: true,
        senderNumber: '+16505550100',
        senderNumbersList: [],
      },
    });

    adapter._notifySmsSettings();
    expect(postMessage).not.toHaveBeenCalled();
    adapter._adapterOptions.enableSmsSettingEvent = true;
    adapter._notifySmsSettings();
    expect(postMessage).toHaveBeenCalledWith({
      type: 'rc-sms-settings-notify',
      senderNumber: '+16505550100',
      senderNumbers: [],
    });
  });
});
