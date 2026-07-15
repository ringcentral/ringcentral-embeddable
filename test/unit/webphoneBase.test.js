const { EventEmitter } = require('events');

const { connectionStatus } = require('@ringcentral-integration/commons/modules/Webphone/connectionStatus');
const { webphoneErrors } = require('@ringcentral-integration/commons/modules/Webphone/webphoneErrors');
const { setStagedState } = require('@ringcentral-integration/core/lib/usm-redux/utils');

jest.mock('ringcentral-web-phone', () => (
  require('../mocks/RingCentralWebphoneV2Mock').default
));

jest.mock('ringcentral-web-phone/sip-message/outbound/response', () => (
  class TestResponseMessage {
    constructor(message, { responseCode }) {
      this.message = message;
      this.responseCode = responseCode;
    }
  }
));

jest.mock('../../src/modules/WebphoneV2/audio/incoming.mp3', () => 'incoming.mp3');
jest.mock('../../src/modules/WebphoneV2/audio/outgoing.mp3', () => 'outgoing.mp3');

const mockSharedSipClients = [];

jest.mock('../../src/modules/WebphoneV2/SharedSipClient', () => {
  const { EventEmitter: MockEventEmitter } = require('events');

  class MockSharedSipClient extends MockEventEmitter {
    constructor(options) {
      super();
      this.activeTabId = null;
      this.device = { id: 'shared-device' };
      this.disposed = false;
      this.instanceId = 'shared-instance-id';
      this.options = options;
      this.sipInfo = { authorizationId: 'shared-auth' };
      this.status = 'init';
      this.syncActiveTabId = jest.fn(async () => {});
      this.setActive = jest.fn((activeTabId) => {
        this.activeTabId = activeTabId;
      });
      this.start = jest.fn(async ({ device, sipInfo, instanceId }) => {
        this.device = device;
        this.sipInfo = sipInfo;
        this.instanceId = instanceId;
        this.status = 'registered';
      });
      this.unregister = jest.fn(async () => {});
      this.dispose = jest.fn(() => {
        this.disposed = true;
      });
      this.getStatus = jest.fn(async () => ({
        device: this.device,
        instanceId: this.instanceId,
        sipInfo: this.sipInfo,
        status: this.status,
      }));
      mockSharedSipClients.push(this);
    }

    get active() {
      return this.activeTabId === this.options.tabId;
    }
  }

  return {
    SharedSipClient: MockSharedSipClient,
  };
});

jest.mock('@ringcentral-integration/utils', () => ({
  ...jest.requireActual('@ringcentral-integration/utils'),
  sleep: jest.fn(async () => {}),
}));

const { DEFAULT_AUDIO, WebphoneBase } = require('../../src/modules/WebphoneV2/WebphoneBase');
const { EVENTS } = require('../../src/modules/WebphoneV2/events');

function createLogger() {
  return {
    error: jest.fn(),
    log: jest.fn(),
    warn: jest.fn(),
  };
}

function createDeps(overrides = {}) {
  const platform = {
    post: jest.fn(async () => ({
      json: async () => ({
        device: { id: 'device-id' },
        sipInfo: [{ authorizationId: 'auth-id', outboundProxy: 'sip.example.com' }],
      }),
    })),
  };
  return {
    alert: {
      danger: jest.fn(),
      dismiss: jest.fn(),
      messages: [],
      warning: jest.fn(),
    },
    appFeatures: {
      isWebPhoneEnabled: true,
      ready: true,
    },
    audioSettings: {
      callVolume: 0.5,
      outputDeviceId: 'speaker-id',
      ready: true,
      ringtoneMuted: false,
      ringtoneVolume: 0.75,
      supportDevices: true,
      userMedia: true,
    },
    auth: {
      addBeforeLogoutHandler: jest.fn(),
      endpointId: 'endpoint-id',
      loggedIn: true,
    },
    client: {
      account: jest.fn(() => ({
        extension: () => ({
          device: () => ({
            list: jest.fn(async () => ({
              records: [
                { phoneLines: [{ id: 'line-1' }] },
                { phoneLines: [] },
                {},
              ],
            })),
          }),
        }),
      })),
      service: {
        platform: () => platform,
      },
    },
    extensionFeatures: {
      fetchData: jest.fn(),
      ready: true,
    },
    numberValidate: {
      ready: true,
    },
    prefix: 'test',
    regionSettings: {},
    storage: {
      ready: true,
    },
    tabManager: {
      active: true,
      ready: true,
      tabbie: {
        id: 'tab-id',
      },
    },
    webphoneOptions: {
      appKey: 'app-key',
      connectDelay: 0,
      webphoneLogLevel: 0,
    },
    platform,
    ...overrides,
  };
}

function createBase(overrides = {}) {
  const deps = overrides.deps || createDeps();
  const phone = Object.create(WebphoneBase.prototype);
  Object.defineProperties(phone, {
    pending: {
      value: true,
      configurable: true,
      writable: true,
    },
    ready: {
      value: true,
      configurable: true,
      writable: true,
    },
  });
  Object.assign(phone, {
    _audioDeviceManager: { id: 'audio-device-manager' },
    _closedByUser: false,
    _connectTimeout: null,
    _deps: deps,
    _eventEmitter: new EventEmitter(),
    _logger: createLogger(),
    _reconnectDelays: [0, 5, 10, 30, 60, 90, 120],
    _removedWebphoneAtBeforeUnload: false,
    _ringtoneHelper: {
      loadAudio: jest.fn(),
      stop: jest.fn(),
    },
    _sharedSipClient: null,
    _sipInstanceId: null,
    _sipInstanceManager: {
      getInstanceId: jest.fn(() => 'sip-instance-id'),
      setInstanceInactive: jest.fn(),
    },
    _stopWebphoneUserAgentPromise: null,
    _webphone: null,
    connectRetryCounts: 0,
    connectionStatus: connectionStatus.disconnected,
    data: {
      incomingAudioDataUrl: null,
      incomingAudioFile: DEFAULT_AUDIO,
      outgoingAudioDataUrl: null,
      outgoingAudioFile: DEFAULT_AUDIO,
    },
    device: null,
    errorCode: null,
    parentModule: {
      analytics: {
        track: jest.fn(),
      },
    },
    statusCode: null,
    ...overrides,
  });
  return phone;
}

function installBrowserSupport() {
  Object.defineProperty(global, 'navigator', {
    value: {
      mediaDevices: {
        getUserMedia: jest.fn(),
      },
      userAgent: 'Chrome',
    },
    configurable: true,
  });
  global.WebSocket = function WebSocket() {};
  global.MediaStream = function MediaStream() {};
  global.RTCPeerConnection = function RTCPeerConnection() {};
}

async function flushPromises(times = 3) {
  for (let i = 0; i < times; i += 1) {
    await Promise.resolve();
  }
}

describe('WebphoneBase module methods', () => {
  beforeEach(() => {
    mockSharedSipClients.length = 0;
    setStagedState({});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    setStagedState(undefined);
    delete global.WebSocket;
    delete global.MediaStream;
    delete global.RTCPeerConnection;
    delete global.navigator;
    delete global.SharedWorker;
    delete global.window;
    delete global.document;
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('updates connection state, audio storage, and derived availability flags', async () => {
    const phone = createBase();

    phone._setStateOnConnect();
    expect(phone.connecting).toBe(true);
    expect(phone.connectRetryCounts).toBe(1);

    phone._setStateOnReconnect();
    expect(phone.reconnecting).toBe(true);
    expect(phone.connectRetryCounts).toBe(2);

    phone._setStateOnRegistered({ id: 'device-id' });
    expect(phone.connected).toBe(true);
    expect(phone.device).toEqual({ id: 'device-id' });
    expect(phone.parentModule.analytics.track).toHaveBeenCalledWith(
      'WebRTC registration',
    );

    phone._setStateOnConnectError(webphoneErrors.connectFailed, 504);
    expect(phone.connectError).toBe(true);
    expect(phone.isUnavailable).toBe(true);
    expect(phone.statusCode).toBe(504);

    phone._setStateOnConnectFailed(webphoneErrors.serverTimeout, 503);
    expect(phone.connectFailed).toBe(true);
    phone._setStateWhenUnregisteredOnInactive();
    expect(phone.inactive).toBe(true);
    phone._setStoreOnDisconnect();
    expect(phone.disconnecting).toBe(true);
    phone._setStateOnUnregistered();
    expect(phone.disconnected).toBe(true);

    await phone.setIncomingAudio({ fileName: 'incoming.wav', dataUrl: 'data:in' });
    expect(phone.incomingAudioFile).toBe('incoming.wav');
    expect(phone.incomingAudio).toBe('data:in');
    expect(phone._ringtoneHelper.loadAudio).toHaveBeenCalledWith('data:in');

    await phone.setOutgoingAudio({ fileName: 'outgoing.wav', dataUrl: 'data:out' });
    expect(phone.outgoingAudioFile).toBe('outgoing.wav');
    expect(phone.outgoingAudio).toBe('data:out');

    await phone.setRingtone({
      incomingAudio: phone.defaultIncomingAudio,
      incomingAudioFile: phone.defaultIncomingAudioFile,
      outgoingAudio: 'custom-out',
      outgoingAudioFile: 'custom.wav',
    });
    expect(phone.incomingAudioFile).toBe(DEFAULT_AUDIO);
    expect(phone.incomingAudioDataUrl).toBeNull();
    expect(phone.outgoingAudioFile).toBe('custom.wav');

    await phone.resetIncomingAudio();
    await phone.resetOutgoingAudio();
    expect(phone.incomingAudioFile).toBe(DEFAULT_AUDIO);
    expect(phone.outgoingAudioFile).toBe(DEFAULT_AUDIO);
    phone.stopRingtone();
    expect(phone._ringtoneHelper.stop).toHaveBeenCalled();
  });

  it('fetches SIP provisioning, device lines, and checks init/reset readiness', async () => {
    const phone = createBase();

    await expect(phone._sipProvision()).resolves.toEqual({
      device: { id: 'device-id' },
      sipInfo: [{ authorizationId: 'auth-id', outboundProxy: 'sip.example.com' }],
    });
    expect(phone._deps.platform.post).toHaveBeenCalledWith(
      '/restapi/v1.0/client-info/sip-provision',
      { sipInfo: [{ transport: 'WSS' }] },
    );

    await expect(phone._fetchDL()).resolves.toEqual([{ id: 'line-1' }]);
    expect(phone._shouldInit()).toBe(true);
    phone._deps.auth.loggedIn = false;
    expect(phone._shouldReset()).toBe(true);
  });

  it('disposes webphone call sessions and shared clients', async () => {
    const answered = {
      callId: 'answered',
      state: 'answered',
      hangup: jest.fn(async () => {}),
    };
    const inbound = {
      callId: 'inbound',
      direction: 'inbound',
      state: 'ringing',
      decline: jest.fn(async () => {}),
    };
    const outbound = {
      callId: 'outbound',
      direction: 'outbound',
      remotePeer: 'peer',
      state: 'init',
      cancel: jest.fn(async () => {}),
    };
    const pendingOutbound = {
      callId: 'pending',
      direction: 'outbound',
      state: 'init',
      dispose: jest.fn(),
    };
    const phone = createBase({
      _sharedSipClient: {
        unregister: jest.fn(async () => {}),
      },
      _webphone: {
        callSessions: [answered, inbound, outbound, pendingOutbound],
        removeAllListeners: jest.fn(),
        sipClient: {
          dispose: jest.fn(async () => {}),
        },
      },
    });

    await phone._removeWebphone(true);

    expect(phone._sharedSipClient).toBeNull();
    expect(phone._webphone).toBeNull();
    expect(answered.hangup).toHaveBeenCalled();
    expect(inbound.decline).toHaveBeenCalled();
    expect(outbound.cancel).toHaveBeenCalled();
    expect(pendingOutbound.dispose).toHaveBeenCalled();

    const sharedOnly = createBase({
      _sharedSipClient: {
        dispose: jest.fn(async () => {}),
        unregister: jest.fn(async () => {}),
      },
    });
    await sharedOnly._removeWebphone(true);
    expect(sharedOnly._sharedSipClient).toBeNull();
  });

  it('creates non-shared webphones and handles inbound SIP events', async () => {
    const phone = createBase();
    phone._onSessionUpdate = jest.fn();
    phone._onProvisionUpdateRequired = jest.fn();
    const registeredHandler = jest.fn();
    phone._eventEmitter.on(EVENTS.webphoneRegistered, registeredHandler);

    await phone._createWebphone({
      device: { id: 'device-id' },
      sipInfo: [{ authorizationId: 'auth-id', outboundProxy: 'sip.example.com' }],
    });

    expect(phone._sipInstanceManager.getInstanceId).toHaveBeenCalledWith('endpoint-id');
    expect(phone._webphone.options).toEqual(
      expect.objectContaining({
        instanceId: 'sip-instance-id',
        sipInfo: { authorizationId: 'auth-id', outboundProxy: 'sip.example.com' },
      }),
    );
    expect(phone.connected).toBe(true);
    expect(registeredHandler).toHaveBeenCalled();

    const inboundHandler = phone._webphone.sipClient.on.mock.calls[0][1];
    await inboundHandler({
      subject: 'UPDATE sip:test@example.com',
      headers: {},
    });
    expect(phone._onSessionUpdate).toHaveBeenCalled();
    expect(phone._webphone.sipClient.reply).toHaveBeenCalledWith(
      expect.objectContaining({ responseCode: 200 }),
    );

    await inboundHandler({
      subject: 'NOTIFY sip:test@example.com',
      headers: { Event: 'check-sync' },
    });
    expect(phone._onProvisionUpdateRequired).toHaveBeenCalled();

    const closeHandler = phone._webphone.sipClient.wsc.addEventListener.mock.calls[0][1];
    phone._onConnectError = jest.fn(async () => {});
    closeHandler();
    expect(phone._onConnectError).toHaveBeenCalledWith({
      errorCode: webphoneErrors.connectFailed,
      statusCode: null,
    });
    phone._closedByUser = true;
    phone._onWebphoneUnregistered = jest.fn();
    closeHandler();
    expect(phone._onWebphoneUnregistered).toHaveBeenCalled();
  });

  it('cleans up webphone state from browser unload lifecycle events', async () => {
    jest.useFakeTimers();
    const listeners = {};
    global.window = {
      addEventListener: jest.fn((event, listener) => {
        listeners[event] = listener;
      }),
    };
    global.document = {};
    const basePrototype = Object.getPrototypeOf(WebphoneBase.prototype);
    jest.spyOn(basePrototype, '_initModule').mockResolvedValue(undefined);
    const phone = createBase({
      _webphone: {
        callSessions: [],
      },
      _sipInstanceId: 'sip-instance-id',
    });
    phone._disconnect = jest.fn(async () => {});
    phone.connect = jest.fn();

    await phone._initModule();
    listeners.beforeunload();
    expect(phone._removedWebphoneAtBeforeUnload).toBe(true);
    expect(phone._disconnect).toHaveBeenCalledWith(false);

    jest.advanceTimersByTime(4000);
    expect(phone._removedWebphoneAtBeforeUnload).toBe(false);
    expect(phone.connect).toHaveBeenCalledWith({
      skipConnectDelay: true,
      skipDLCheck: true,
    });

    listeners.pagehide();
    expect(phone._sipInstanceManager.setInstanceInactive).toHaveBeenCalledWith(
      'sip-instance-id',
      'endpoint-id',
    );
    expect(phone._sipInstanceId).toBeNull();

    phone._removedWebphoneAtBeforeUnload = false;
    listeners.pagehide();
    expect(phone._disconnect).toHaveBeenLastCalledWith(false);
  });

  it('connects through a shared worker client and handles shared client events', async () => {
    installBrowserSupport();
    global.SharedWorker = jest.fn(function SharedWorker(url, options) {
      this.url = url;
      this.options = options;
    });
    const phone = createBase();
    phone._syncSharedState = jest.fn(async () => {});
    phone._onSessionUpdate = jest.fn();
    phone._onProvisionUpdateRequired = jest.fn();
    phone._onSharedStateUpdated = jest.fn();
    phone._onActiveTabIdChanged = jest.fn();

    await phone._connect(false);

    const sharedClient = mockSharedSipClients[0];
    expect(global.SharedWorker).toHaveBeenCalledWith(
      expect.any(URL),
      { name: 'ringcentral-webphone-shared-sip-client' },
    );
    expect(sharedClient.start).toHaveBeenCalledWith(
      expect.objectContaining({
        device: { id: 'device-id' },
        force: false,
        instanceId: 'sip-instance-id',
      }),
    );
    expect(phone._syncSharedState).toHaveBeenCalled();
    expect(sharedClient.setActive).toHaveBeenCalledWith('tab-id');
    expect(sharedClient.activeTabId).toBe('tab-id');
    expect(phone.connected).toBe(true);

    sharedClient.emit('inboundMessage', {
      subject: 'UPDATE sip:test@example.com',
      headers: {},
    });
    expect(phone._onSessionUpdate).toHaveBeenCalled();
    sharedClient.emit('inboundMessage', {
      subject: 'NOTIFY sip:test@example.com',
      headers: { Event: 'check-sync' },
    });
    expect(phone._onProvisionUpdateRequired).toHaveBeenCalled();

    sharedClient.status = 'registered';
    sharedClient.device = { id: 'event-device' };
    sharedClient.emit('status', 'registered');
    await flushPromises();
    expect(phone.device).toEqual({ id: 'event-device' });

    phone.connectionStatus = connectionStatus.connected;
    phone._onWebphoneUnregistered = jest.fn();
    sharedClient.emit('status', 'unregistered');
    expect(phone._onWebphoneUnregistered).toHaveBeenCalled();

    phone.connectionStatus = connectionStatus.connectError;
    sharedClient.emit('status', 'registering');
    expect(phone.reconnecting).toBe(true);
    phone.connectionStatus = connectionStatus.disconnected;
    sharedClient.emit('status', 'registering');
    expect(phone.connecting).toBe(true);

    phone._onConnectError = jest.fn();
    sharedClient.emit('status', 'registrationError', 'SIP/2.0 500 Internal Server Error');
    expect(phone._onConnectError).toHaveBeenCalledWith({
      errorCode: webphoneErrors.internalServerError,
      statusCode: null,
      ttl: 0,
    });

    sharedClient.emit('transportStatus', 'connecting');
    expect(phone._logger.log).toHaveBeenCalledWith(
      'shared sip client transport status',
      'connecting',
    );
    sharedClient.emit('transportStatus', 'error');
    sharedClient.emit('transportStatus', 'disconnected');
    expect(phone._onConnectError).toHaveBeenCalledWith({
      errorCode: webphoneErrors.connectFailed,
      statusCode: null,
    });

    sharedClient.emit('sharedStateChanged', { sessions: [] });
    sharedClient.emit('activeTabIdChanged', 'tab-2');
    expect(phone._onSharedStateUpdated).toHaveBeenCalledWith({ sessions: [] });
    expect(phone._onActiveTabIdChanged).toHaveBeenCalled();
  });

  it('maps webphone start SIP errors into registration alerts', async () => {
    const WebphoneMock = require('../mocks/RingCentralWebphoneV2Mock').default;
    const cases = [
      ['SIP/2.0 603 Decline', webphoneErrors.webphoneCountOverLimit, 603],
      ['SIP/2.0 403 Forbidden', webphoneErrors.webphoneForbidden, 403],
      ['SIP/2.0 500 Server Error', webphoneErrors.internalServerError, 500],
      ['SIP/2.0 504 Timeout', webphoneErrors.serverTimeout, 504],
      ['network failed', webphoneErrors.unknownError, null],
    ];

    for (const [message, errorCode, statusCode] of cases) {
      WebphoneMock.prototype.start = jest.fn(async () => {
        throw new Error(message);
      });
      const phone = createBase();
      phone._onConnectError = jest.fn();

      await phone._createWebphone({
        device: { id: 'device-id' },
        sipInfo: [{ authorizationId: 'auth-id', outboundProxy: 'sip.example.com' }],
      });

      expect(phone._onConnectError).toHaveBeenCalledWith({
        errorCode,
        statusCode,
        ttl: 0,
      });
    }
  });

  it('creates shared webphones and syncs active shared client state', async () => {
    const sharedClient = {
      active: true,
      activeTabId: null,
      getStatus: jest.fn(async () => ({
        status: 'registered',
        device: { id: 'shared-device' },
        sipInfo: { authorizationId: 'shared-auth' },
      })),
      setActive: jest.fn(),
      start: jest.fn(async () => {}),
      syncActiveTabId: jest.fn(async () => {}),
    };
    const phone = createBase({
      _sharedSipClient: sharedClient,
    });
    phone._syncSharedState = jest.fn(async () => {});

    await phone._createWebphone({
      device: { id: 'device-id' },
      sipInfo: [{ authorizationId: 'auth-id', outboundProxy: 'sip.example.com' }],
    }, true);

    expect(sharedClient.start).toHaveBeenCalledWith(
      expect.objectContaining({
        device: { id: 'device-id' },
        force: true,
        instanceId: 'sip-instance-id',
      }),
    );
    expect(phone._syncSharedState).toHaveBeenCalled();
    expect(sharedClient.setActive).toHaveBeenCalledWith('tab-id');
    expect(sharedClient.syncActiveTabId).toHaveBeenCalled();
    expect(phone.device).toEqual({ id: 'shared-device' });
    expect(phone.activeWebphoneId).toBeNull();
    expect(phone.isWebphoneActiveTab).toBe(true);
  });

  it('connects with DL checks, retry timers, and connection error alerts', async () => {
    installBrowserSupport();
    jest.useFakeTimers();
    const phone = createBase();
    phone._connect = jest.fn(async () => {});
    phone._fetchDL = jest.fn(async () => []);

    await phone.connect({ skipTimeout: true, skipDLCheck: false });
    expect(phone._deps.alert.warning).toHaveBeenCalledWith({
      message: webphoneErrors.noOutboundCallWithoutDL,
    });
    expect(phone._connect).toHaveBeenCalledWith(false);

    phone._connect.mockClear();
    phone._deps.appFeatures.isWebPhoneEnabled = false;
    await phone.connect({ skipTimeout: true, skipDLCheck: true });
    expect(phone._connect).not.toHaveBeenCalled();
    phone._deps.appFeatures.isWebPhoneEnabled = true;

    phone.connectionStatus = connectionStatus.connectError;
    phone._isAvailableToConnect = jest.fn(() => true);
    phone._fetchDL = jest.fn(async () => {
      throw new Error('DL failed');
    });
    await phone.connect({ force: false, skipTimeout: false, skipDLCheck: false });
    expect(phone._deps.alert.warning).toHaveBeenCalledWith({
      message: webphoneErrors.checkDLError,
      allowDuplicates: false,
    });
    expect(phone._connectTimeout).toBeTruthy();
    jest.runOnlyPendingTimers();
    await Promise.resolve();
    expect(phone._connect).toHaveBeenCalledWith();
  });

  it('handles connect errors, registration alerts, disconnects, and provision updates', async () => {
    installBrowserSupport();
    const phone = createBase();
    phone.connect = jest.fn();
    phone._deps.alert.messages = [
      { id: 'connecting', message: webphoneErrors.connectFailed, payload: { isConnecting: true } },
      { id: 'failed', message: webphoneErrors.connectFailed, payload: {} },
      { id: 'register', message: webphoneErrors.sipProvisionError, payload: {} },
    ];

    phone.connectRetryCounts = 1;
    await phone._onConnectError({
      errorCode: webphoneErrors.connectFailed,
      statusCode: 500,
      ttl: 10,
    });
    expect(phone.connectFailed).toBe(true);
    expect(phone._deps.alert.warning).toHaveBeenCalledWith(
      expect.objectContaining({
        message: webphoneErrors.connectFailed,
        payload: expect.objectContaining({ isConnecting: true }),
      }),
    );
    expect(phone.connect).toHaveBeenCalledWith({
      skipDLCheck: true,
      skipConnectDelay: true,
      skipTimeout: false,
    });

    phone.connectionStatus = connectionStatus.reconnecting;
    phone.connectRetryCounts = 3;
    await phone._onConnectError({
      errorCode: webphoneErrors.webphoneForbidden,
      statusCode: 403,
      ttl: 0,
    });
    expect(phone._sipInstanceId).toBeNull();
    expect(phone.connectError).toBe(true);
    expect(phone._deps.alert.danger).toHaveBeenCalledWith(
      expect.objectContaining({
        message: webphoneErrors.webphoneForbidden,
      }),
    );
    expect(phone._deps.alert.dismiss).toHaveBeenCalledWith(['connecting']);

    const unregisteredHandler = jest.fn();
    phone._eventEmitter.on(EVENTS.webphoneUnregistered, unregisteredHandler);
    phone.connectionStatus = connectionStatus.connected;
    phone._onWebphoneUnregistered();
    expect(unregisteredHandler).toHaveBeenCalled();

    phone.connectionStatus = connectionStatus.connected;
    phone._sharedSipClient = { dispose: jest.fn() };
    await phone._disconnect(false);
    expect(phone._sharedSipClient.dispose).toHaveBeenCalled();

    phone.connect.mockClear();
    phone._sharedSipClient = null;
    phone._webphone = { callSessions: [{ callId: 'active' }] };
    phone._onProvisionUpdateRequired();
    expect(phone.connect).not.toHaveBeenCalledWith(
      expect.objectContaining({ force: true }),
    );

    phone._webphone = { callSessions: [] };
    phone._sharedSipClient = { active: true };
    phone._deps.tabManager.active = false;
    phone._onProvisionUpdateRequired();
    expect(phone.connect).not.toHaveBeenCalledWith(
      expect.objectContaining({ force: true }),
    );

    phone._deps.tabManager.active = true;
    phone._onProvisionUpdateRequired();
    expect(phone.connect).toHaveBeenCalledWith({
      force: true,
      skipDLCheck: true,
      skipConnectDelay: true,
    });

    phone.errorCode = webphoneErrors.connectFailed;
    phone.statusCode = 503;
    await phone.showAlert();
    expect(phone._deps.alert.danger).toHaveBeenCalledWith({
      message: webphoneErrors.connectFailed,
      allowDuplicates: false,
      payload: {
        statusCode: 503,
      },
    });
  });

  it('covers readiness guards, connect fallbacks, and alert no-op paths', async () => {
    let phone = createBase();

    phone._deps.appFeatures.ready = false;
    expect(phone._shouldInit()).toBe(false);
    phone._deps.appFeatures.ready = true;
    phone._deps.tabManager = null;
    expect(phone._shouldInit()).toBe(true);
    phone._deps.auth.loggedIn = false;
    expect(phone._shouldReset()).toBe(true);
    phone._deps.auth.loggedIn = true;
    phone._deps.appFeatures.ready = false;
    expect(phone._shouldReset()).toBe(true);
    phone._deps.appFeatures.ready = true;
    phone._deps.extensionFeatures.ready = false;
    expect(phone._shouldReset()).toBe(true);
    phone._deps.extensionFeatures.ready = true;
    phone._deps.numberValidate.ready = false;
    expect(phone._shouldReset()).toBe(true);

    await expect(phone._removeWebphone()).resolves.toBeUndefined();
    const unregisterError = new Error('unregister failed');
    const disposeError = new Error('dispose failed');
    phone = createBase({
      _sharedSipClient: {
        unregister: jest.fn(async () => {
          throw unregisterError;
        }),
      },
      _webphone: {
        callSessions: [{
          callId: 'bad-call',
          direction: 'inbound',
          state: 'ringing',
          decline: jest.fn(async () => {
            throw new Error('decline failed');
          }),
        }],
        removeAllListeners: jest.fn(),
        sipClient: {
          dispose: jest.fn(async () => {
            throw disposeError;
          }),
        },
      },
    });
    await phone._removeWebphone(true);
    expect(phone._logger.error).toHaveBeenCalledWith(
      'Failed to unregister shared sip client',
      unregisterError,
    );
    expect(phone._logger.error).toHaveBeenCalledWith(
      'Fail to disconnect call session',
      'bad-call',
    );
    expect(phone._logger.error).toHaveBeenCalledWith(
      'Failed to dispose webphone',
      disposeError,
    );

    phone = createBase();
    phone._deps.auth.loggedIn = false;
    await expect(phone._connect()).resolves.toBeUndefined();
    phone._deps.auth.loggedIn = true;
    phone._sipProvision = jest.fn(async () => {
      throw new Error('Feature [WebPhone] is not available');
    });
    await phone._connect();
    expect(phone._deps.extensionFeatures.fetchData).toHaveBeenCalled();

    phone = createBase();
    phone._sipProvision = jest.fn(async () => {
      throw new Error('provision failed');
    });
    phone._onConnectError = jest.fn();
    await phone._connect();
    expect(phone._onConnectError).toHaveBeenCalledWith({
      errorCode: webphoneErrors.sipProvisionError,
      statusCode: null,
      ttl: 0,
    });

    installBrowserSupport();
    global.SharedWorker = jest.fn(function SharedWorker() {});
    phone = createBase();
    phone._syncSharedState = jest.fn(async () => {});
    await phone._connect(false);
    expect(mockSharedSipClients[0].getStatus).toHaveBeenCalled();

    phone = createBase();
    await expect(phone._waitStillTabActive()).resolves.toBeUndefined();
    phone._deps.tabManager.active = false;
    phone._deps.appFeatures.isWebPhoneEnabled = false;
    expect(phone._isAvailableToConnect({ force: false })).toBe(false);
    phone._deps.appFeatures.isWebPhoneEnabled = true;
    phone.connectionStatus = connectionStatus.connecting;
    expect(phone._isAvailableToConnect({ force: false })).toBe(false);
    phone.connectionStatus = connectionStatus.connected;
    expect(phone._isAvailableToConnect({ force: false })).toBe(false);
    phone._sharedSipClient = { active: false };
    phone.connectionStatus = connectionStatus.connectError;
    expect(phone._isAvailableToConnect({ force: true })).toBe(false);

    delete global.WebSocket;
    delete global.MediaStream;
    delete global.RTCPeerConnection;
    phone = createBase();
    await phone.connect();
    expect(phone.errorCode).toBe(webphoneErrors.browserNotSupported);
    expect(phone._deps.alert.warning).toHaveBeenCalledWith({
      message: webphoneErrors.browserNotSupported,
      ttl: 0,
    });

    phone = createBase();
    phone.connectRetryCounts = 8;
    expect(phone._getConnectTimeoutTtl()).toBe(120);
    phone._sipInstanceId = 'sip-instance-id';
    phone.connectRetryCounts = 1;
    phone.connect = jest.fn();
    await phone._onConnectError({
      errorCode: webphoneErrors.webphoneForbidden,
      statusCode: 403,
      ttl: 5,
    });
    expect(phone._sipInstanceId).toBeNull();
    expect(phone.connectFailed).toBe(true);
    expect(phone._deps.alert.warning).toHaveBeenCalledWith(
      expect.objectContaining({
        message: webphoneErrors.webphoneForbidden,
        payload: expect.objectContaining({ isConnecting: true }),
      }),
    );

    [
      connectionStatus.disconnecting,
      connectionStatus.inactiveDisconnecting,
      connectionStatus.disconnected,
      connectionStatus.inactive,
    ].forEach((status) => {
      const guarded = createBase({ connectionStatus: status });
      guarded._eventEmitter.emit = jest.fn();
      guarded._onWebphoneUnregistered();
      expect(guarded._eventEmitter.emit).not.toHaveBeenCalled();
    });
    phone = createBase({
      _stopWebphoneUserAgentPromise: Promise.resolve(),
    });
    phone._eventEmitter.emit = jest.fn();
    phone._onWebphoneUnregistered();
    expect(phone._eventEmitter.emit).not.toHaveBeenCalled();

    phone = createBase();
    phone.connectionStatus = connectionStatus.disconnected;
    await phone._disconnect();
    expect(phone.connectionStatus).toBe(connectionStatus.disconnected);
    phone.errorCode = null;
    await expect(phone.showAlert()).resolves.toBeUndefined();
    phone._ringtoneHelper = null;
    expect(() => phone.loadAudio()).not.toThrow();
    phone.data.incomingAudioDataUrl = null;
    phone.data.outgoingAudioDataUrl = null;
    expect(phone.incomingAudio).toBe(phone.defaultIncomingAudio);
    expect(phone.outgoingAudio).toBe(phone.defaultOutgoingAudio);
    expect(phone._sessions).toBeInstanceOf(Map);
  });
});
