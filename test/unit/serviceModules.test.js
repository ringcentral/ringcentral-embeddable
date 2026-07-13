/** @jest-environment jsdom */
const { setStagedState } = require('@ringcentral-integration/core/lib/usm-redux/utils');
const { loginStatus } = require('@ringcentral-integration/commons/modules/Auth/loginStatus');

jest.mock('@ringcentral-integration/commons/modules/DataFetcherV2', () => ({
  DataFetcherV2Consumer: class MockDataFetcherV2Consumer {
    constructor({ deps }) {
      this._deps = deps;
      this.data = null;
    }
  },
  DataSource: class MockDataSource {
    constructor(options) {
      Object.assign(this, options);
    }
  },
}));

jest.mock('@ringcentral-integration/commons/lib/batchApiHelper', () => ({
  batchGetApi: jest.fn(async () => [
    { json: async () => ({ extensionId: '102', activeCalls: [] }) },
    { json: async () => ({ extensionId: '103', activeCalls: [] }) },
  ]),
}));

jest.mock('@ringcentral-integration/commons/lib/saveBlob', () => jest.fn());

jest.mock('mixpanel-browser', () => ({
  _$$track: jest.fn(),
  add_group: jest.fn(),
  identify: jest.fn(),
  init: jest.fn(),
  people: {
    set: jest.fn(),
  },
  set_group: jest.fn(),
  track: jest.fn(),
  track_pageview: jest.fn(),
}));

jest.mock('@ringcentral-integration/widgets/lib/parseCallbackUri', () => (
  jest.fn((callbackUri) => {
    if (callbackUri.includes('jwt=')) {
      return { jwt: 'jwt-from-callback' };
    }
    if (callbackUri.includes('error=')) {
      const message = callbackUri.match(/error=([^&]+)/)?.[1] || 'access_denied';
      const error = new Error(message);
      if (!callbackUri.includes('without_description=true')) {
        error.error_description = 'Access denied';
      }
      throw error;
    }
    return {
      code: 'code-from-callback',
      code_verifier: callbackUri.includes('code_verifier=') ? 'verifier-from-callback' : undefined,
    };
  })
));

jest.mock('@ringcentral-integration/widgets/modules/OAuth', () => ({
  OAuth: class BaseOAuth {
    constructor(deps) {
      this._deps = deps;
      this.authState = 'auth-state';
      this.ready = true;
      this.redirectUri = 'https://example.com/callback';
      this._loginWithCallbackQuery = jest.fn(async () => {});
      this._refreshWithCallbackQuery = jest.fn(async () => {});
    }

    onInitOnce() {
      this.baseOnInitOnceCalled = true;
    }

    async openOAuthPage() {
      this.baseOpenOAuthPageCalled = true;
    }
  },
}));

jest.mock('@ringcentral-integration/commons/modules/Auth', () => ({
  Auth: class BaseAuth {
    constructor(deps) {
      this._deps = deps;
      this._loggedIn = false;
      this._triggerSyncToken = false;
      this.loginStatus = null;
      this.ready = true;
      this.token = null;
    }

    get ownerId() {
      return 12345;
    }

    _bindEvents() {
      this.baseBindEventsCalled = true;
    }

    async _getTokenFromSDK() {
      return { access_token: 'base-token' };
    }

    async logout(options) {
      this.baseLogoutOptions = options;
      return 'logged-out';
    }

    async onStateChange() {
      this.baseOnStateChangeCalled = true;
    }

    setInitLogin(payload) {
      this.initLoginPayload = payload;
    }

    setLogin() {
      this.loginSet = true;
    }
  },
}));

jest.mock('@ringcentral-integration/commons/modules/Storage', () => ({
  Storage: class BaseStorage {
    constructor(deps) {
      this._deps = deps;
      this.data = {
        ExistingReducer: { enabled: true },
        WritableOnly: 'default',
      };
      this.storageKey = 'test-storage';
      this.storageWritable = true;
      this._storageReducers = {
        ExistingReducer: jest.fn(),
        WritableOnly: jest.fn(),
      };
      this._StorageProvider = class MockStorageProvider {
        constructor() {
          this.getData = jest.fn(async () => ({}));
          this.removeItem = jest.fn(async () => {});
          this.setItem = jest.fn(async () => {});
        }
      };
      this.setData = jest.fn((data) => {
        this.data = data;
      });
    }
  },
}));

jest.mock('@ringcentral-integration/commons/modules/CallHistory', () => ({
  CallHistory: class BaseCallHistory {
    constructor(deps) {
      this._deps = deps;
      this.endedCalls = [];
      this.normalizedCalls = [];
      this.findMatches = jest.fn((mapping, call) => ({
        fromMatches: mapping[call.from.phoneNumber] || [],
        toMatches: mapping[call.to.phoneNumber] || [],
      }));
    }
  },
}));

const saveBlob = require('@ringcentral-integration/commons/lib/saveBlob');
const mixpanel = require('mixpanel-browser');
const { batchGetApi } = require('@ringcentral-integration/commons/lib/batchApiHelper');
const { Analytics: AnalyticsBase } = require('../../src/modules/Analytics/AnalyticsBase');
const { Analytics } = require('../../src/modules/Analytics');
const { AnalyticsBrowser } = require('../../src/modules/Analytics/AnalyticsBrowser');
const { Auth, TriggerSyncTokenEvent } = require('../../src/modules/Auth');
const { CallHistory } = require('../../src/modules/CallHistory');
const { CallQueuePresence } = require('../../src/modules/CallQueuePresence');
const { MonitoredExtensions } = require('../../src/modules/MonitoredExtensions');
const { OAuth } = require('../../src/modules/OAuth');
const { Storage } = require('../../src/modules/Storage');

function createPresence(overrides = {}) {
  return {
    activeCalls: [{
      id: 'active-call',
    }, {
      id: 'ended-call',
      telephonyStatus: 'NoCall',
      terminationType: 'final',
    }],
    extension: {
      id: '102',
    },
    extensionId: '102',
    uri: 'https://example.com/presence/102',
    ...overrides,
  };
}

function createMonitoredDeps(overrides = {}) {
  const platform = {
    get: jest.fn(async () => ({
      json: async () => createPresence({ extensionId: '102' }),
    })),
    put: jest.fn(async () => {}),
  };
  return {
    alert: {
      danger: jest.fn(),
      warning: jest.fn(),
    },
    appFeatures: {
      hasHUDPermission: true,
      ready: true,
    },
    auth: {
      accessToken: 'access-token',
    },
    client: {
      service: {
        platform: jest.fn(() => platform),
      },
    },
    companyContacts: {
      data: [{
        extensionNumber: '102',
        firstName: 'Ada',
        id: '102',
        lastName: 'Lovelace',
        profileImage: {
          uri: 'https://example.com/avatar',
        },
        status: 'Enabled',
        type: 'User',
      }, {
        extensionNumber: '801',
        id: '801',
        name: 'Park 801',
        type: 'ParkLocation',
      }, {
        extensionNumber: '701',
        id: '701',
        name: 'Pickup 701',
        type: 'GroupCallPickup',
      }, {
        extensionNumber: '901',
        id: '901',
        name: 'Queue 901',
        type: 'Department',
      }],
    },
    dataFetcherV2: {
      fetchData: jest.fn(async () => {}),
      register: jest.fn(),
    },
    extensionFeatures: {
      features: {
        HUD: {
          params: [{ name: 'limitMax', value: '4' }],
        },
      },
    },
    extensionInfo: {
      id: '101',
    },
    monitoredExtensionsOptions: {
      ttl: 1000,
    },
    storage: {},
    subscription: {
      message: null,
      subscribe: jest.fn(),
    },
    tabManager: {
      active: true,
    },
    ...overrides,
    platform,
  };
}

function createCallQueuePresenceDeps(overrides = {}) {
  const platform = {
    get: jest.fn(async () => ({
      json: async () => ({
        records: [
          { callQueue: { id: 2 }, acceptCalls: false },
          { callQueue: { id: 1 }, acceptCalls: true },
        ],
      }),
    })),
    put: jest.fn(async () => ({
      json: async () => ({
        records: [{ callQueue: { id: 3 }, acceptCalls: false }],
      }),
    })),
  };
  return {
    alert: {
      danger: jest.fn(),
    },
    appFeatures: {
      hasEditCallQueuePresencePermission: true,
      hasReadCallQueuePresencePermission: true,
      ready: true,
    },
    client: {
      service: {
        platform: jest.fn(() => platform),
      },
    },
    dataFetcherV2: {
      fetchData: jest.fn(async () => {}),
      register: jest.fn(),
      updateData: jest.fn(async () => {}),
    },
    platform,
    ...overrides,
  };
}

function createAnalyticsDeps(overrides = {}) {
  return {
    accountInfo: {
      id: 'account-1',
    },
    analyticsOptions: {
      appVersion: '1.0.0',
      enableExternalAnalytics: true,
      enablePendo: true,
      externalAppName: 'CRM',
      externalClientId: 'client-id',
      lingerThreshold: 50,
      trackRouters: [{
        eventPostfix: 'Calls',
        router: '/calls',
      }, {
        eventPostfix: 'Call Details',
        router: '/calls/active',
      }],
      useLog: true,
    },
    auth: {
      ownerId: 'owner-1',
    },
    brand: {
      defaultConfig: {
        appName: 'Embeddable',
        code: 'rc',
      },
    },
    environment: {
      environmentName: 'production',
    },
    extensionInfo: {
      info: {
        type: 'User',
      },
    },
    locale: {
      browserLocale: 'en-US',
      currentLocale: 'en-US',
    },
    routerInteraction: {
      currentPath: '/calls/active',
    },
    ...overrides,
  };
}

function createOAuthDeps(overrides = {}) {
  const platform = {
    _codeVerifier: null,
    discovery: jest.fn(() => true),
    loginUrlWithDiscovery: jest.fn(async () => {}),
  };
  return {
    alert: {
      danger: jest.fn(),
    },
    auth: {
      getLoginUrl: jest.fn((query) => `https://login.example.com?state=${query.state}`),
      isImplicit: false,
      jwtLogin: jest.fn(async () => {}),
      loginStatus: loginStatus.notLoggedIn,
      notLoggedIn: true,
      useWAP: false,
      wapLogin: jest.fn(async () => {}),
    },
    brand: {
      id: '1210',
    },
    client: {
      service: {
        platform: jest.fn(() => platform),
      },
    },
    locale: {
      currentLocale: 'en-US',
    },
    oAuthOptions: {
      authorizationCode: 'authorization-code',
      authorizationCodeVerifier: 'authorization-code-verifier',
      disableLoginPopup: true,
      externalAuthId: 'external-auth-1',
      jwt: '',
    },
    prefix: 'rc',
    ...overrides,
    platform,
  };
}

function createAuthDeps(overrides = {}) {
  const listeners = {};
  const client = {
    addListener: jest.fn((event, handler) => {
      listeners[event] = handler;
    }),
    events: {
      requestError: 'requestError',
    },
    removeListener: jest.fn((event, handler) => {
      if (listeners[event] === handler) {
        delete listeners[event];
      }
    }),
  };
  const authData = {
    endpoint_id: 'endpoint-1',
    owner_id: 'owner-1',
    scope: 'ReadAccounts',
  };
  const platform = {
    _cache: {
      clean: jest.fn(async () => {}),
    },
    _revokeEndpoint: '/oauth/revoke',
    auth: jest.fn(() => ({
      data: jest.fn(async () => authData),
      setData: jest.fn(async (data) => {
        Object.assign(authData, data);
      }),
    })),
    emit: jest.fn(),
    events: {
      loginSuccess: 'loginSuccess',
      logoutError: 'logoutError',
      logoutSuccess: 'logoutSuccess',
    },
    get: jest.fn(async () => ({
      json: async () => ({
        endpoint_id: 'wap-endpoint',
        owner_id: 'wap-owner',
        scope: 'WAP',
      }),
    })),
    loggedIn: jest.fn(async () => true),
    login: jest.fn(async ({ jwt }) => ({ jwt })),
    post: jest.fn(async () => ({ ok: true })),
  };
  return {
    authOptions: {
      authProxy: true,
    },
    client: {
      service: {
        client: jest.fn(() => client),
        platform: jest.fn(() => platform),
      },
    },
    tabManager: {
      active: true,
      autoMainTab: false,
      event: null,
      ready: true,
      send: jest.fn(),
    },
    ...overrides,
    authData,
    clientEmitter: client,
    listeners,
    platform,
  };
}

function createCall(overrides = {}) {
  return {
    from: {
      name: 'Agent',
      phoneNumber: '+16505550100',
    },
    offset: 500,
    sessionId: 'call-session-1',
    startTime: 1000,
    telephonySessionId: 'telephony-1',
    to: {
      name: 'Customer',
      phoneNumber: '+16505550123',
    },
    ...overrides,
  };
}

describe('service modules', () => {
  beforeEach(() => {
    setStagedState({});
    jest.useFakeTimers();
    process.env.ANALYTICS_SECRET_KEY = 'secret';
    window.parent.postMessage = jest.fn();
    global.analytics = {
      identify: jest.fn(),
      track: jest.fn(),
    };
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    delete global.analytics;
    delete process.env.ANALYTICS_SECRET_KEY;
    setStagedState(undefined);
    jest.clearAllMocks();
    jest.restoreAllMocks();
    window.localStorage.clear();
  });

  it('syncs monitored extensions, presences, groups, limits, and subscription events', async () => {
    const deps = createMonitoredDeps();
    const module = new MonitoredExtensions(deps);
    module.data = {
      records: [
        { id: '1', extension: { extensionNumber: '101', id: '101', type: 'User' } },
        { id: '2', extension: { extensionNumber: '102', id: '102', type: 'User' } },
        { id: '3', extension: { extensionNumber: '801', id: '801', type: 'ParkLocation' } },
        { id: '4', extension: { extensionNumber: '701', id: '701', type: 'GroupCallPickup' } },
        { id: '5', extension: { extensionNumber: '901', id: '901', type: 'Department' } },
      ],
    };
    expect(deps.dataFetcherV2.register).toHaveBeenCalledWith(expect.objectContaining({
      key: 'monitoredExtensions',
      ttl: 1000,
    }));
    await expect(module._source.fetchFunction()).resolves.toEqual(createPresence({ extensionId: '102' }));

    module.onInit();
    expect(deps.subscription.subscribe).toHaveBeenCalledWith([
      '/restapi/v1.0/account/~/extension/~/presence/line',
      '/restapi/v1.0/account/~/extension/~/presence/line/presence?detailedTelephonyState=true&sipData=true',
    ]);
    expect(batchGetApi).toHaveBeenCalledWith({
      platform: deps.platform,
      url: '/restapi/v1.0/account/~/extension/102,801,701,901/presence?detailedTelephonyState=true&sipData=true',
    });

    module.setPresences([createPresence()]);
    expect(module.presences['102']).toEqual({
      activeCalls: [{ id: 'active-call' }],
    });
    expect(module.monitoredExtensions[0].extension).toMatchObject({
      extensionNumber: '102',
      id: '102',
      name: 'Ada Lovelace',
      profileImageUrl: 'https://example.com/avatar?access_token=access-token',
      status: 'Enabled',
    });
    expect(module.parkLocations.map((item) => item.extension.id)).toEqual(['801']);
    expect(module.groupCallPickupList.map((item) => item.extension.id)).toEqual(['701']);
    expect(module.callQueuePickupList.map((item) => item.extension.id)).toEqual(['901']);

    module.setPresences([
      createPresence({
        activeCalls: [{ id: 'parked-call' }],
        extensionId: '801',
      }),
    ]);
    expect(module.presences['801']).toEqual({
      activeCalls: [{ id: 'parked-call' }],
    });
    expect(module.activeExtensionLength).toBe(0);

    module._handleSubscription({
      body: createPresence({ extensionId: '701' }),
      event: '/restapi/v1.0/account/~/extension/~/presence/line/presence?detailedTelephonyState=true',
    });
    expect(module.presences['701']).toEqual({
      activeCalls: [{ id: 'active-call' }],
    });
    module.sync = jest.fn(async () => {});
    module._handleSubscription({
      event: '/restapi/v1.0/account/~/extension/~/presence/line',
    });
    expect(module.sync).toHaveBeenCalled();

    module.presences.missing = { activeCalls: [] };
    module.clearPresences();
    expect(module.presences.missing).toBeUndefined();

    module._stopWatching = jest.fn();
    await module.toggleEnabled();
    expect(module.enabled).toBe(false);
    await module.toggleEnabled();
    expect(module.enabled).toBe(true);

    await module.addExtensions([{ id: '200' }]);
    expect(deps.alert.warning).toHaveBeenCalledWith({
      message: 'callHUDAddExtensionsLimitExceeded',
    });
    deps.extensionFeatures.features.HUD.params[0].value = '10';
    module.data.records = module.data.records.slice(0, 2);
    await module.addExtensions([{ id: '200' }]);
    expect(deps.platform.put).toHaveBeenCalledWith(
      '/restapi/v1.0/account/~/extension/~/presence/line',
      JSON.stringify([
        { id: '1', extension: { id: '101' } },
        { id: '2', extension: { id: '102' } },
        { id: '3', extension: { id: '200' } },
      ]),
      null,
      { headers: { 'Content-Type': 'application/json' } },
    );
    await module.removeExtension('102');
    expect(deps.platform.put).toHaveBeenLastCalledWith(
      '/restapi/v1.0/account/~/extension/~/presence/line',
      JSON.stringify([{
        id: '1',
        extension: {
          extensionNumber: '101',
          id: '101',
          type: 'User',
        },
      }]),
      null,
      { headers: { 'Content-Type': 'application/json' } },
    );

    deps.platform.put.mockRejectedValueOnce(new Error('put failed'));
    await module._updateExtensions([]);
    expect(deps.alert.danger).toHaveBeenCalledWith({
      message: 'callHUDUpdateExtensionsFailed',
    });
  });

  it('fetches monitored extension presences through single, batched, inactive, and failure paths', async () => {
    const deps = createMonitoredDeps();
    const module = new MonitoredExtensions(deps);

    await module.fetchPresences([]);
    expect(deps.platform.get).not.toHaveBeenCalled();

    deps.tabManager.active = false;
    await module.fetchPresences(['102']);
    expect(deps.platform.get).not.toHaveBeenCalled();

    deps.tabManager.active = true;
    await module.fetchPresences(['102']);
    expect(deps.platform.get).toHaveBeenCalledWith(
      '/restapi/v1.0/account/~/extension/102/presence?detailedTelephonyState=true&sipData=true',
    );
    expect(module.presences['102']).toEqual({
      activeCalls: [{ id: 'active-call' }],
    });

    await module.fetchPresences(Array.from({ length: 31 }, (_, index) => String(index + 200)));
    expect(batchGetApi).toHaveBeenCalledWith({
      platform: deps.platform,
      url: '/restapi/v1.0/account/~/extension/200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,228,229/presence?detailedTelephonyState=true&sipData=true',
    });

    deps.platform.get.mockRejectedValueOnce(new Error('presence failed'));
    await module.fetchPresences(['103']);
    expect(console.error).toHaveBeenCalledWith(expect.any(Error));

    deps.dataFetcherV2.fetchData.mockRejectedValueOnce(new Error('sync failed'));
    await module.sync();
    expect(deps.alert.danger).toHaveBeenCalledWith({
      message: 'callHUDSyncExtensionsFailed',
    });
  });

  it('tracks analytics base navigation, identity, logs, and extended props', async () => {
    const deps = createAnalyticsDeps();
    const analytics = new AnalyticsBase(deps);

    analytics.setUserId();
    expect(global.analytics.identify).toHaveBeenCalledWith('owner-1', {}, expect.any(Object));
    analytics.identify({ accountId: 'account-1', userId: 'user-1' });
    expect(global.analytics.identify).toHaveBeenLastCalledWith('user-1', { accountId: 'account-1' }, expect.any(Object));

    analytics.addEventsExtendedProps({
      events: ['Event A'],
      extendedProps: { extra: 'value' },
    });
    await analytics.track('Event A', { custom: true });
    expect(global.analytics.track).toHaveBeenCalledWith(
      'Event A',
      expect.objectContaining({
        'App Language': 'en-US',
        brand: 'rc',
        custom: true,
        extra: 'value',
      }),
      expect.any(Object),
    );
    expect(analytics._logs).toHaveLength(1);

    analytics.trackNavigation({ eventPostfix: 'Calls', router: '/calls' });
    analytics.trackLinger({ eventPostfix: 'Calls', router: '/calls' });
    expect(global.analytics.track).toHaveBeenCalledWith(
      'Navigation: Click/Calls',
      expect.objectContaining({ router: '/calls' }),
      expect.any(Object),
    );
    expect(analytics.getTrackTarget('/calls/active/telephony-1')).toEqual({
      eventPostfix: 'Call Details',
      router: '/calls/active',
    });
    analytics.trackRouter('/calls');
    jest.advanceTimersByTime(50);
    expect(global.analytics.track).toHaveBeenCalledWith(
      'Navigation: View/Calls',
      expect.objectContaining({ router: '/calls' }),
      expect.any(Object),
    );
    analytics.downloadLogs();
    expect(saveBlob).toHaveBeenCalledWith('logs.json', expect.any(Blob));

    analytics.addEventsExtendedProps({});
    expect(console.error).toHaveBeenCalledWith('[events or extendedProps] is required');
    delete global.analytics;
    await analytics.track('No Analytics');
  });

  it('formats embeddable analytics events, identity, page targets, and browser mixpanel calls', () => {
    const deps = createAnalyticsDeps({
      analyticsOptions: {
        ...createAnalyticsDeps().analyticsOptions,
        analyticsKey: 'mixpanel-token',
      },
    });
    const analytics = new Analytics(deps);

    analytics.identify({
      accountId: 'account-1',
      userId: 'user-1',
    });
    expect(analytics.analytics.group).toBeDefined();
    expect(mixpanel.identify).toHaveBeenCalledWith(expect.any(String));
    expect(mixpanel.add_group).toHaveBeenCalledWith('rcAccountId', expect.any(String));

    analytics.track('Call Control: Mute/Call HUD', { foo: 'bar' });
    expect(window.parent.postMessage).toHaveBeenCalledWith({
      event: 'Call interaction',
      properties: {
        callInteractionLocation: 'Call HUD',
        callInteractionName: 'Mute',
        foo: 'bar',
      },
      type: 'rc-analytics-track',
    }, '*');
    expect(mixpanel._$$track).toHaveBeenCalledWith(
      'Call interaction',
      expect.objectContaining({
        callInteractionLocation: 'Call HUD',
        callInteractionName: 'Mute',
      }),
    );

    analytics.track('Click To SMS (Messages)', {});
    expect(mixpanel._$$track).toHaveBeenCalledWith(
      'Click to SMS',
      expect.objectContaining({ interactionLocation: 'Messages' }),
    );
    analytics.track('WebRTC registration', {});
    expect(mixpanel._$$track).not.toHaveBeenCalledWith('WebRTC registration', expect.anything());

    expect(analytics.getTrackTarget('/contacts/company/contact-1')).toMatchObject({
      router: '/contacts/details',
    });
    analytics.trackRouter('/calls/active');
    expect(mixpanel.track_pageview).toHaveBeenCalledWith(
      expect.objectContaining({ currentURL: '/calls/active' }),
      { event_name: 'Viewed page' },
    );
    expect(analytics.trackProps).toMatchObject({
      appName: 'RingCentral Embeddable',
      externalAppName: 'CRM',
      rcAccountId: expect.any(String),
    });

    const browser = new AnalyticsBrowser('token');
    browser.load();
    browser.track('Browser Event', { value: 1 });
    browser.group('account-1');
    browser.page('settings', { router: '/settings' });
    expect(mixpanel._$$track).toHaveBeenCalledWith(
      'Browser Event',
      expect.objectContaining({ value: 1 }),
    );
    expect(mixpanel.track_pageview).toHaveBeenCalledWith(
      expect.objectContaining({ pageName: 'Settings' }),
      { event_name: 'Viewed page' },
    );
    browser._mixpanel = null;
    browser.track('ignored');
    browser.group('ignored');
    browser.page('ignored');
  });

  it('handles OAuth callback, login URL, external id, silent code login, and popup modes', async () => {
    const deps = createOAuthDeps();
    const oauth = new OAuth(deps);

    oauth.setExternalAuthId('external-auth-1');
    expect(oauth.externalAuthId).toBe('external-auth-1');
    expect(oauth.oAuthUri).toBe('https://login.example.com?state=auth-state');
    expect(deps.auth.getLoginUrl).toHaveBeenCalledWith(expect.not.objectContaining({
      brandId: '1210',
    }));
    const brandedOAuth = new OAuth(createOAuthDeps({
      brand: {
        id: '999',
      },
    }));
    expect(brandedOAuth.oAuthUri).toBe('https://login.example.com?state=auth-state');
    expect(brandedOAuth._deps.auth.getLoginUrl).toHaveBeenCalledWith(
      expect.objectContaining({ brandId: '999' }),
    );

    await oauth._silentLoginWithCode();
    expect(deps.platform._codeVerifier).toBe('authorization-code-verifier');
    expect(oauth._loginWithCallbackQuery).toHaveBeenCalledWith({
      code: 'authorization-code',
    });
    const noVerifierOAuth = new OAuth(createOAuthDeps({
      oAuthOptions: {
        ...createOAuthDeps().oAuthOptions,
        authorizationCodeVerifier: '',
      },
    }));
    await noVerifierOAuth._silentLoginWithCode();
    expect(noVerifierOAuth._deps.platform._codeVerifier).toBeNull();

    await oauth._handleCallbackUri('https://example.com/callback?jwt=jwt');
    expect(deps.auth.jwtLogin).toHaveBeenCalledWith('jwt-from-callback');

    await oauth._handleCallbackUri('https://example.com/callback?code=code&code_verifier=value');
    expect(deps.platform._codeVerifier).toBe('verifier-from-callback');
    expect(oauth._loginWithCallbackQuery).toHaveBeenLastCalledWith({
      code: 'code-from-callback',
      code_verifier: 'verifier-from-callback',
    });
    await oauth._handleCallbackUri('https://example.com/callback?code=code', true);
    expect(oauth._refreshWithCallbackQuery).toHaveBeenCalledWith({
      code: 'code-from-callback',
      code_verifier: undefined,
    });

    deps.auth.useWAP = true;
    await oauth._handleCallbackUri('https://example.com/callback?code=code');
    expect(deps.auth.wapLogin).toHaveBeenCalledWith('https://example.com/callback?code=code');

    await oauth._handleCallbackUri('https://example.com/callback?error=access_denied');
    expect(deps.alert.danger).toHaveBeenCalledWith({
      message: 'authMessages-accessDenied',
      payload: expect.any(Error),
    });
    for (const errorMessage of [
      'invalid_request',
      'unauthorized_client',
      'unsupported_response_type',
      'invalid_scope',
      'login_required',
      'interaction_required',
    ]) {
      await oauth._handleCallbackUri(`https://example.com/callback?error=${errorMessage}`);
    }
    expect(deps.alert.danger).toHaveBeenCalledWith({
      message: 'authMessages-accessDenied',
      payload: expect.objectContaining({ message: 'interaction_required' }),
    });
    for (const errorMessage of [
      'server_error',
      'temporarily_unavailable',
      'unknown_error',
    ]) {
      await oauth._handleCallbackUri(
        `https://example.com/callback?error=${errorMessage}&without_description=true`,
      );
    }
    expect(deps.alert.danger).toHaveBeenCalledWith({
      message: 'authMessages-internalError',
      payload: expect.objectContaining({ message: 'unknown_error' }),
    });

    await oauth.openOAuthPage();
    expect(deps.platform.loginUrlWithDiscovery).toHaveBeenCalled();
    expect(window.parent.postMessage).toHaveBeenCalledWith({
      oAuthUri: 'https://login.example.com?state=auth-state',
      type: 'rc-login-popup-notify',
    }, '*');

    const popupOAuth = new OAuth(createOAuthDeps({
      oAuthOptions: {
        ...createOAuthDeps().oAuthOptions,
        disableLoginPopup: false,
      },
    }));
    await popupOAuth.openOAuthPage();
    expect(popupOAuth.baseOpenOAuthPageCalled).toBe(true);

    const noDiscoveryDeps = createOAuthDeps();
    noDiscoveryDeps.platform.discovery.mockReturnValue(false);
    const noDiscoveryOAuth = new OAuth(noDiscoveryDeps);
    await noDiscoveryOAuth.openOAuthPage();
    expect(noDiscoveryDeps.platform.loginUrlWithDiscovery).not.toHaveBeenCalled();
  });

  it('syncs auth token state, WAP token data, logout requests, WAP login, and JWT login', async () => {
    const deps = createAuthDeps();
    const auth = new Auth(deps);

    auth._bindEvents();
    expect(auth.baseBindEventsCalled).toBe(true);
    auth.loginStatus = loginStatus.loggedIn;
    deps.listeners.requestError({ response: { status: 401 } });
    expect(auth.baseLogoutOptions).toEqual({});

    await auth.onInit();
    expect(auth._loggedIn).toBe(true);
    await auth.fetchToken();
    expect(auth.initLoginPayload).toEqual({
      loggedIn: true,
      token: expect.objectContaining({
        endpoint_id: 'endpoint-1',
        owner_id: 'owner-1',
      }),
    });

    deps.authData.owner_id = undefined;
    await expect(auth._getTokenFromSDK()).resolves.toEqual(expect.objectContaining({
      endpoint_id: 'wap-endpoint',
      owner_id: 'wap-owner',
      scope: 'WAP',
    }));
    expect(deps.platform.get).toHaveBeenCalledWith('/restapi/v1.0/client-info');

    deps.tabManager.active = false;
    await auth.logout();
    expect(deps.tabManager.send).toHaveBeenCalledWith('LOGOUT_REQUEST');
    deps.tabManager.active = true;
    await expect(auth.logout({ reason: 'manual' })).resolves.toBe('logged-out');
    await deps.platform.logout();
    expect(deps.platform.post).toHaveBeenCalledWith('/oauth/revoke');
    expect(deps.platform.emit).toHaveBeenCalledWith('logoutSuccess', { ok: true });

    await auth.wapLogin('https://example.com/callback?code=code');
    expect(deps.platform.emit).toHaveBeenCalledWith('loginSuccess');
    await auth.wapLogin('https://example.com/callback?error=access_denied');
    expect(deps.platform.emit).toHaveBeenCalledTimes(2);

    await expect(auth.jwtLogin('jwt-token')).resolves.toEqual({ jwt: 'jwt-token' });
    expect(auth.loginSet).toBe(true);
    expect(auth.ownerId).toBe('12345');
    expect(auth.useWAP).toBe(true);

    deps.tabManager.event = { name: 'LOGOUT_REQUEST' };
    await auth.onStateChange();
    expect(auth.baseOnStateChangeCalled).toBe(true);
  });

  it('migrates storage data and removes unused keys on init', async () => {
    const storage = new Storage({
      storageOptions: {},
    });
    storage._StorageProvider = class MockStorageProvider {
      constructor() {
        this.getData = jest.fn(async () => ({
          activityMatcherData: { old: 'activity' },
          audioSettings: { old: 'audio' },
          callLoggerData: {
            autoLog: true,
            logOnRinging: false,
            transferredCallsMap: { call: true },
          },
          conversationLoggerData: { autoLog: true },
          regionSettingsAreaCode: '650',
          regionSettingsCountryCode: 'US',
          unusedKey: 'remove me',
        }));
        this.removeItem = jest.fn(async () => {});
        this.setItem = jest.fn(async () => {});
      }
    };
    Object.assign(storage._storageReducers, {
      'ActivityMatcher-data': jest.fn(),
      'AudioSettings-data': jest.fn(),
      'CallLogger-autoLog': jest.fn(),
      'CallLogger-logOnRinging': jest.fn(),
      'CallLogger-transferredCallsMap': jest.fn(),
      'ConversationLogger-_autoLog': jest.fn(),
      'RegionSettings-data': jest.fn(),
    });

    await storage.onInit();
    expect(storage.data).toMatchObject({
      'ActivityMatcher-data': { old: 'activity' },
      'AudioSettings-data': { old: 'audio' },
      'CallLogger-autoLog': true,
      'CallLogger-logOnRinging': false,
      'CallLogger-transferredCallsMap': { call: true },
      'ConversationLogger-_autoLog': true,
      'RegionSettings-data': {
        areaCode: '650',
        countryCode: 'US',
      },
      ExistingReducer: { enabled: true },
      WritableOnly: 'default',
    });
    expect(storage._storage.removeItem).toHaveBeenCalledWith('unusedKey');
    expect(storage._storage.setItem).toHaveBeenCalledWith('WritableOnly', 'default');

    const brokenStorage = new Storage({
      storageOptions: {
        disableClearUnused: true,
      },
    });
    brokenStorage.storedData = {
      regionSettingsCountryCode: 'US',
    };
    brokenStorage._storage = {
      removeItem: jest.fn(() => {
        throw new Error('remove failed');
      }),
      setItem: jest.fn(),
    };
    await brokenStorage._migrateOldData();
    expect(console.error).toHaveBeenCalledWith('migrate old data error: ', expect.any(Error));
  });

  it('normalizes ended calls, combines call history, and builds caller ID maps', () => {
    const deps = {
      activityMatcher: {
        dataMapping: {
          'call-session-1': [{ id: 'activity-1' }],
          'ended-session': [{ id: 'activity-ended' }],
        },
      },
      callLog: {
        sync: jest.fn(),
      },
      contactMatcher: {
        callMatched: {
          'telephony-1': 'matched-contact',
        },
        dataMapping: {
          '+16505550100': [{ id: 'from-contact' }],
          '+16505550123': [{ id: 'to-contact' }],
        },
      },
      storage: {},
      tabManager: {
        active: true,
      },
    };
    const callHistory = new CallHistory(deps);
    callHistory.normalizedCalls = [createCall()];

    const originalNow = Date.now;
    Date.now = jest.fn(() => 11500);
    callHistory._addEndedCalls([createCall({
      sessionId: 'ended-session',
      telephonySessionId: 'ended-telephony',
    })]);
    Date.now = originalNow;
    expect(callHistory.endedCalls[0]).toMatchObject({
      duration: 10,
      isRecording: false,
      result: 'Disconnected',
      warmTransferInfo: undefined,
    });
    expect(deps.callLog.sync).toHaveBeenCalled();

    callHistory.setEndedCalls([createCall({
      offset: undefined,
      sessionId: 'ended-session',
      startTime: 1000,
      telephonySessionId: 'ended-telephony',
    })], 5000);
    expect(callHistory.endedCalls).toHaveLength(1);
    expect(callHistory.endedCalls[0].duration).toBe(4);

    expect(callHistory.calls).toEqual([
      expect.objectContaining({
        activityMatches: [{ id: 'activity-ended' }],
        sessionId: 'ended-session',
        toMatches: [{ id: 'to-contact' }],
      }),
      expect.objectContaining({
        activityMatches: [{ id: 'activity-1' }],
        fromName: 'Agent',
        sessionId: 'call-session-1',
        toName: 'Customer',
        toNumberEntity: 'matched-contact',
      }),
    ]);
    expect(callHistory.callerIDMap).toEqual({
      '+16505550100': 'Agent',
      '+16505550123': 'Customer',
    });
  });

  it('syncs, sorts, updates, and reports call queue presence errors', async () => {
    const deps = createCallQueuePresenceDeps();
    const callQueuePresence = new CallQueuePresence(deps);
    callQueuePresence.parentModule = {
      analytics: {
        track: jest.fn(),
      },
    };
    const source = deps.dataFetcherV2.register.mock.calls[0][0];

    callQueuePresence.data = {
      records: [
        { callQueue: { id: 3 }, acceptCalls: true },
        { callQueue: { id: 1 }, acceptCalls: false },
      ],
    };
    expect(callQueuePresence.presences.map((presence) => presence.callQueue.id)).toEqual([1, 3]);
    await callQueuePresence.sync();
    expect(deps.dataFetcherV2.fetchData).toHaveBeenCalledWith(source);

    deps.appFeatures.hasReadCallQueuePresencePermission = false;
    await callQueuePresence.sync();
    expect(deps.dataFetcherV2.fetchData).toHaveBeenCalledTimes(1);

    await callQueuePresence.updatePresence('3', false);
    expect(deps.platform.put).toHaveBeenCalledWith(
      '/restapi/v1.0/account/~/extension/~/call-queue-presence',
      {
        records: [{
          acceptCalls: false,
          callQueue: { id: '3' },
        }],
      },
    );
    expect(deps.dataFetcherV2.updateData).toHaveBeenCalledWith(
      source,
      { records: [{ callQueue: { id: 3 }, acceptCalls: false }] },
      expect.any(Number),
    );

    deps.appFeatures.hasEditCallQueuePresencePermission = false;
    await callQueuePresence.updatePresence('3', true);
    expect(console.error).toHaveBeenCalledWith('No permission to update call queue presence');

    deps.appFeatures.hasEditCallQueuePresencePermission = true;
    deps.platform.put.mockRejectedValueOnce(new Error('update failed'));
    await callQueuePresence.updatePresence('3', true);
    expect(deps.alert.danger).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'showCustomAlertMessage',
        payload: expect.objectContaining({
          alertMessage: 'Failed to update call queue presence',
        }),
      }),
    );
  });
});
