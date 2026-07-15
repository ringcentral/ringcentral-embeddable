const { createStore } = require('redux');

function createLocalStorage(initialValues = {}) {
  const storage = {};
  Object.defineProperties(storage, {
    getItem: {
      value(key) {
        return Object.prototype.hasOwnProperty.call(this, key) ? this[key] : null;
      },
    },
    setItem: {
      value(key, value) {
        this[key] = String(value);
      },
    },
    removeItem: {
      value(key) {
        delete this[key];
      },
    },
  });
  Object.entries(initialValues).forEach(([key, value]) => {
    storage.setItem(key, value);
  });
  return storage;
}

function defineGlobal(name, value) {
  Object.defineProperty(global, name, {
    value,
    configurable: true,
    writable: true,
  });
}

function createQuietStore(reducer) {
  const store = createStore(reducer);
  return {
    dispatch: store.dispatch,
    getState: store.getState,
    replaceReducer: store.replaceReducer,
    subscribe: jest.fn(() => jest.fn()),
  };
}

function setupBrowserGlobals() {
  const localStorage = createLocalStorage();
  const addEventListener = jest.fn();
  const removeEventListener = jest.fn();
  const dispatchEvent = jest.fn();
  class TestBroadcastChannel {
    constructor(name) {
      this.name = name;
      this.addEventListener = jest.fn();
      this.removeEventListener = jest.fn();
      this.postMessage = jest.fn();
      this.close = jest.fn();
    }
  }
  class TestMessageChannel {
    constructor() {
      this.port1 = {
        onmessage: null,
        close: jest.fn(),
      };
      this.port2 = {
        close: jest.fn(),
        postMessage: jest.fn((message) => {
          Promise.resolve().then(() => {
            if (typeof this.port1.onmessage === 'function') {
              this.port1.onmessage({ data: message });
            }
          });
        }),
      };
    }
  }
  const document = {
    nodeType: 9,
    hidden: false,
    addEventListener,
    removeEventListener,
    dispatchEvent,
    documentElement: {
      classList: {
        add: jest.fn(),
      },
      style: {},
      setAttribute: jest.fn(),
    },
    createEvent: jest.fn(() => ({
      initCustomEvent: jest.fn(),
    })),
    createElement: jest.fn(() => ({
      setAttribute: jest.fn(),
      style: {},
    })),
    head: {
      appendChild: jest.fn(),
    },
  };
  const window = {
    addEventListener,
    removeEventListener,
    dispatchEvent,
    requestAnimationFrame: jest.fn((callback) => setTimeout(callback, 0)),
    cancelAnimationFrame: jest.fn((timer) => clearTimeout(timer)),
    getComputedStyle: jest.fn(() => ({
      getPropertyValue: jest.fn(() => ''),
    })),
    BroadcastChannel: TestBroadcastChannel,
    MessageChannel: TestMessageChannel,
    document,
    localStorage,
    location: {
      origin: 'http://localhost:8080',
      href: 'http://localhost:8080/app.html',
      hostname: 'localhost',
      protocol: 'http:',
    },
    navigator: {
      userAgent: 'Jest Chrome',
      mediaDevices: {},
    },
    parent: {
      postMessage: jest.fn(),
    },
    screen: {
      width: 1024,
      height: 768,
    },
    open: jest.fn(),
  };
  defineGlobal('window', window);
  defineGlobal('document', document);
  defineGlobal('localStorage', localStorage);
  defineGlobal('navigator', window.navigator);
  defineGlobal('fetch', jest.fn(() => Promise.resolve({ ok: true })));
  defineGlobal('requestAnimationFrame', window.requestAnimationFrame);
  defineGlobal('cancelAnimationFrame', window.cancelAnimationFrame);
  defineGlobal('BroadcastChannel', TestBroadcastChannel);
  defineGlobal('MessageChannel', TestMessageChannel);
  defineGlobal('AudioWorkletProcessor', class AudioWorkletProcessor {});
  defineGlobal('registerProcessor', jest.fn());
  defineGlobal('Node', {
    DOCUMENT_FRAGMENT_NODE: 11,
    DOCUMENT_NODE: 9,
  });
  defineGlobal('CustomEvent', function CustomEvent(type) {
    this.type = type;
  });
  defineGlobal('Element', function Element() {});
  defineGlobal('HTMLElement', function HTMLElement() {});
}

function createTestPhone() {
  const { createPhone } = require('../../src/modules/Phone');
  return createPhone({
    prefix: 'test',
    apiConfig: {
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      server: 'https://platform.devtest.ringcentral.com',
    },
    brandConfig: {
      id: '1210',
      code: 'rc',
      name: 'RingCentral',
      appName: 'RingCentral Embeddable',
    },
    appVersion: 'test-version',
    redirectUri: 'http://localhost:8080/redirect.html',
    proxyUri: 'http://localhost:8080/proxy.html',
    brandBaseUrl: 'http://localhost:8080',
    recordingLink: 'https://example.com/recording',
    disableConferenceInvite: false,
    disableGlip: true,
    disableMeeting: true,
    disableNoiseReduction: true,
    disableInactiveTabCallEvent: true,
    multipleTabsSupport: false,
    isMainTab: true,
    autoMainTab: false,
  });
}

describe('createPhone integration', () => {
  beforeEach(() => {
    jest.resetModules();
    setupBrowserGlobals();
  });

  afterEach(() => {
    delete global.window;
    delete global.document;
    delete global.localStorage;
    delete global.navigator;
    delete global.fetch;
    delete global.requestAnimationFrame;
    delete global.cancelAnimationFrame;
    delete global.BroadcastChannel;
    delete global.MessageChannel;
    delete global.AudioWorkletProcessor;
    delete global.registerProcessor;
    delete global.Node;
    delete global.CustomEvent;
    delete global.Element;
    delete global.HTMLElement;
  });

  it('creates the real phone instance and wires the redux store', () => {
    const phone = createTestPhone();
    const store = createQuietStore(phone.reducer);
    phone.setStore(store);

    expect(phone.name).toBe('RingCentral Embeddable');
    expect(phone.version).toBe('test-version');
    expect(phone.auth).toBeDefined();
    expect(phone.oAuth).toBeDefined();
    expect(phone.webphone).toBeDefined();
    expect(phone.adapter).toBeDefined();
    expect(phone.routerInteraction).toBeDefined();
    expect(phone.brand.name).toBe('RingCentral');
    expect(phone.appFeatures).toBeDefined();
    expect(phone.webphone._deps.webphoneOptions.appKey).toBe('test-client-id');
    expect(phone.webphone._deps.webphoneOptions.permissionCheck).toBe(false);
    expect(phone.call._deps.callOptions.permissionCheck).toBe(false);
    expect(phone.store).toBe(store);
    expect(store.subscribe).toHaveBeenCalled();
    expect(store.getState()).toEqual(expect.any(Object));
  });

  it('migrates stale non-PKCE SDK tokens when creating a PKCE phone', () => {
    localStorage.setItem('sdk-testplatform', JSON.stringify({
      access_token: 'old-token',
      refresh_token: 'old-refresh',
    }));

    const { createPhone } = require('../../src/modules/Phone');
    createPhone({
      prefix: 'test',
      apiConfig: {
        clientId: 'test-client-id',
        server: 'https://platform.devtest.ringcentral.com',
      },
      brandConfig: {
        id: '1210',
        code: 'rc',
        name: 'RingCentral',
        appName: 'RingCentral Embeddable',
      },
      appVersion: 'test-version',
      redirectUri: 'http://localhost:8080/redirect.html',
      proxyUri: 'http://localhost:8080/proxy.html',
      brandBaseUrl: 'http://localhost:8080',
      recordingLink: 'https://example.com/recording',
      disableConferenceInvite: false,
      disableGlip: true,
      disableMeeting: true,
      disableNoiseReduction: true,
      disableInactiveTabCallEvent: true,
      multipleTabsSupport: false,
      isMainTab: true,
      autoMainTab: false,
    });

    expect(localStorage.getItem('sdk-testplatform')).toBeNull();
    expect(localStorage.getItem('test-pkce-enabled')).toBe('1');
  });
});
