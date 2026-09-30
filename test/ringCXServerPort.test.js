// The RingCX Agent SDK, its callbacks and the services reacting to them live on
// the server port (the shared worker in worker mode). Client tabs only render,
// so they load the RingCX modules once the server has, and take the session
// state from the server instead of deriving it themselves.

jest.mock('@ringcentral-integration/next-core', () => ({
  ...jest.requireActual('./mocks/nextCoreMock'),
  load: jest.fn(async () => undefined),
}));

jest.mock('../src/app/services/load-ringcx-chunk', () => ({
  loadRingCXChunk: jest.fn(async () => ({
    getRingCXModules: jest.fn(() => []),
  })),
}));

jest.mock('../src/app/services/RingCX/keep-router-path-on-load', () => ({
  keepRouterPathOnLoad: jest.fn(),
}));

jest.mock('@ringcentral-integration/micro-core/src/app/plugins', () => ({
  BlockPlugin: class BlockPlugin {},
}));

import { load, watch } from '@ringcentral-integration/next-core';

import { RingCX } from '../src/app/services/RingCX/RingCX';
import { loadRingCXChunk } from '../src/app/services/load-ringcx-chunk';
import { CxAuth } from '../src/ringcx/services/CxAuth/CxAuth';
import { CxCallbackTypes } from '../src/ringcx/services/CxClient/enums';
import { CxSubscription } from '../src/ringcx/services/CxSubscription/CxSubscription';
import { registerOnServer } from '../src/ringcx/utils/register-on-server';

function createPortManager({ shared = true, isServer = false } = {}) {
  const serverCallbacks = [];
  const clientCallbacks = [];
  return {
    shared,
    isServer,
    serverCallbacks,
    clientCallbacks,
    onServer: jest.fn((callback) => serverCallbacks.push(callback)),
    onClient: jest.fn((callback) => clientCallbacks.push(callback)),
    portDetector: { syncFullState: jest.fn(async () => undefined) },
    runServer() {
      serverCallbacks.forEach((callback) => callback());
    },
    runClient() {
      return clientCallbacks.map((callback) => callback());
    },
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('registerOnServer', () => {
  test('runs right away when the app is not shared', () => {
    const portManager = createPortManager({ shared: false });
    const callback = jest.fn();

    registerOnServer(portManager, callback);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(portManager.onServer).not.toHaveBeenCalled();
  });

  test('waits for the server port when the app is shared', () => {
    const portManager = createPortManager();
    const callback = jest.fn();

    registerOnServer(portManager, callback);
    expect(callback).not.toHaveBeenCalled();

    portManager.runServer();
    expect(callback).toHaveBeenCalledTimes(1);
  });
});

describe('CxSubscription', () => {
  function createCxClient() {
    const listeners = {};
    const sdkCallbacks = {};
    return {
      listeners,
      sdkCallbacks,
      addListener: jest.fn((type, listener) => {
        listeners[type] = listener;
      }),
      on: jest.fn((type, callback) => {
        sdkCallbacks[type] = callback;
      }),
    };
  }

  test('binds subscribed SDK events on the server once the socket opens', async () => {
    const cxClient = createCxClient();
    const portManager = createPortManager({ isServer: true });
    const subscription = new CxSubscription(cxClient, portManager);
    const onAgentState = jest.fn();

    portManager.runServer();
    subscription.subscribe(CxCallbackTypes.AGENT_STATE, onAgentState);
    expect(cxClient.on).not.toHaveBeenCalled();

    await cxClient.listeners[CxCallbackTypes.OPEN_SOCKET]();
    expect(cxClient.on).toHaveBeenCalledTimes(1);
    expect(cxClient.on).toHaveBeenCalledWith(
      CxCallbackTypes.AGENT_STATE,
      expect.any(Function),
    );

    await cxClient.sdkCallbacks[CxCallbackTypes.AGENT_STATE]({
      currentState: 'AVAILABLE',
    });
    expect(onAgentState).toHaveBeenCalledWith({ currentState: 'AVAILABLE' });
  });

  test('binds events subscribed after the socket opened right away', async () => {
    const cxClient = createCxClient();
    const portManager = createPortManager({ isServer: true });
    const subscription = new CxSubscription(cxClient, portManager);
    portManager.runServer();
    await cxClient.listeners[CxCallbackTypes.OPEN_SOCKET]();

    subscription.subscribe(CxCallbackTypes.LOGOUT, jest.fn());
    await Promise.resolve();

    expect(cxClient.on).toHaveBeenCalledWith(
      CxCallbackTypes.LOGOUT,
      expect.any(Function),
    );
  });

  test('does not listen to the SDK on a client port', () => {
    const cxClient = createCxClient();
    const portManager = createPortManager();
    const subscription = new CxSubscription(cxClient, portManager);

    subscription.subscribe(CxCallbackTypes.AGENT_STATE, jest.fn());

    expect(cxClient.addListener).not.toHaveBeenCalled();
    expect(cxClient.on).not.toHaveBeenCalled();
  });
});

describe('CxAuth', () => {
  test('keeps the agent logged in when the main tab changes', () => {
    const portManager = {
      ...createPortManager(),
      onMainTabChange: jest.fn(),
    };
    const auth = { addAfterLoggedInHandler: jest.fn(), loggedIn: true };
    const cxSubscription = { subscribe: jest.fn() };

    new CxAuth(
      {},
      auth,
      cxSubscription,
      {},
      {},
      {},
      { enable: jest.fn() },
      portManager,
    );
    portManager.runServer();

    expect(auth.addAfterLoggedInHandler).toHaveBeenCalledTimes(1);
    expect(cxSubscription.subscribe).toHaveBeenCalledWith(
      CxCallbackTypes.LOGOUT,
      expect.any(Function),
    );
    // The SDK socket lives in the shared worker, so there is nothing to move.
    expect(portManager.onMainTabChange).not.toHaveBeenCalled();
    expect(portManager.onClient).not.toHaveBeenCalled();
  });
});

describe('RingCX load on client tabs', () => {
  function createRingCX(portManager) {
    return new RingCX(
      { isRingCXEnabled: true },
      { addBeforeLogoutHandler: jest.fn(), loggedIn: true },
      portManager,
      { currentPath: '/agent' },
      { enable: jest.fn() },
      { danger: jest.fn() },
      { currentLocale: 'en-US' },
      { server: 'https://platform.ringcentral.com' },
    );
  }

  function getLoadRequestedWatcher() {
    const [, selector, callback] = watch.mock.calls[0];
    return { selector, callback };
  }

  function withReadySession(ringCX) {
    ringCX.cxAuth = { loginStatus: 'authSuccess', isOnlyOneAgent: true };
    ringCX.cxAgentSession = { configured: true, configSuccess: true };
  }

  test('follows the server load request on a tab opened later', async () => {
    const portManager = createPortManager();
    const ringCX = createRingCX(portManager);
    const unwatch = jest.fn();
    watch.mockReturnValueOnce(unwatch);

    const [dispose] = portManager.runClient();
    const { selector, callback } = getLoadRequestedWatcher();
    expect(dispose).toBe(unwatch);
    expect(loadRingCXChunk).not.toHaveBeenCalled();

    ringCX.loadRequested = true;
    expect(selector()).toBe(true);
    withReadySession(ringCX);
    callback(true);
    await ringCX.ensureLoaded();

    expect(load).toHaveBeenCalledTimes(1);
    expect(ringCX.loaded).toBe(true);
    // The client takes the server's session state instead of deriving it.
    expect(portManager.portDetector.syncFullState).toHaveBeenCalledWith({
      forceSync: true,
    });
    expect(ringCX.stage).toBe('idle');
  });

  test('loads right away when the session was already requested', async () => {
    const portManager = createPortManager();
    const ringCX = createRingCX(portManager);
    ringCX.loadRequested = true;

    portManager.runClient();
    // Connecting the client started the load; this only waits for it.
    expect(loadRingCXChunk).toHaveBeenCalledTimes(1);
    await ringCX.ensureLoaded();

    expect(loadRingCXChunk).toHaveBeenCalledTimes(1);
    expect(load).toHaveBeenCalledTimes(1);
  });

  test('does not follow load requests without a shared app', () => {
    createRingCX(createPortManager({ shared: false }));

    expect(watch).not.toHaveBeenCalled();
  });

  function watchHydrated(ringCX) {
    const values = [];
    ringCX.hydratedOnThisPort$.subscribe((value) => values.push(value));
    return values;
  }

  test('reports a client tab hydrated only once it holds the server state', async () => {
    const portManager = createPortManager();
    let finishSync;
    portManager.portDetector.syncFullState.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishSync = resolve;
        }),
    );
    const ringCX = createRingCX(portManager);
    const hydrated = watchHydrated(ringCX);

    const loading = ringCX.ensureLoaded();
    await new Promise((resolve) => setTimeout(resolve, 0));
    // The chunk is in and `loaded` is set, but the CX state is still empty.
    expect(load).toHaveBeenCalledTimes(1);
    expect(ringCX.loaded).toBe(true);
    expect(hydrated).toEqual([false]);

    finishSync();
    await loading;
    expect(hydrated).toEqual([false, true]);
  });

  test('reports the server hydrated after deriving the stage', async () => {
    const portManager = createPortManager({ isServer: true });
    const ringCX = createRingCX(portManager);
    withReadySession(ringCX);
    const hydrated = watchHydrated(ringCX);

    await ringCX.ensureLoaded();

    expect(ringCX.stage).toBe('ready');
    expect(hydrated).toEqual([false, true]);
  });

  test('derives the session stage on the server after loading', async () => {
    const portManager = createPortManager({ isServer: true });
    const ringCX = createRingCX(portManager);
    withReadySession(ringCX);

    await ringCX.ensureLoaded();

    expect(portManager.portDetector.syncFullState).not.toHaveBeenCalled();
    expect(ringCX.stage).toBe('ready');
    expect(ringCX.sessionWanted).toBe(true);
  });
});
