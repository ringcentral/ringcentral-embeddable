// CxClient drives the RingCX Agent SDK on the server port. In worker mode that
// is the shared worker, which has no page `localStorage`, so everything the SDK
// persists is read and written through the storage the bundle itself uses,
// `AgentSDK.shared.localStorage` (the page storage on a tab, an in-memory
// storage in the worker).

import { CxClient } from '../../src/ringcx/services/CxClient/CxClient';
import {
  CxCallbackTypes,
  evStatus,
} from '../../src/ringcx/services/CxClient/enums';
import { messageTypes } from '../../src/ringcx/enums';

const AUTH_HOST = 'https://ringcx.example.test';

function createMemoryStorage() {
  const items = new Map();
  return {
    getItem: (key) => (items.has(key) ? items.get(key) : null),
    setItem: (key, value) => items.set(key, String(value)),
    removeItem: (key) => items.delete(key),
  };
}

function installAgentSdk() {
  const storage = createMemoryStorage();
  const sdk = {
    terminateStats: jest.fn(),
    openSocket: jest.fn(),
    authenticateAgentWithRcAccessToken: jest.fn(),
    authenticateAgentWithEngageAccessToken: jest.fn(),
    getAuthenticateRequest: jest.fn(() => ({})),
  };
  const AgentSDK = jest.fn(function AgentSDK(config) {
    sdk.config = config;
    return sdk;
  });
  AgentSDK.shared = {
    localStorage: storage,
    HttpService: { setApiBase: jest.fn() },
    Session: {
      storeAccessTokenResult: jest.fn(),
      storeRCAccessTokenResult: jest.fn(),
    },
  };
  globalThis.AgentSDK = AgentSDK;
  return { AgentSDK, sdk, storage };
}

function createCxClient() {
  return new CxClient(
    {},
    {
      options: { authHost: AUTH_HOST, clientAppType: 'RingCX Embeddable' },
      callbacks: { openResponse: jest.fn(), closeResponse: jest.fn() },
    },
    { sipInfo: [] },
  );
}

afterEach(() => {
  jest.restoreAllMocks();
  delete globalThis.AgentSDK;
  delete globalThis.evAuthHost;
  window.localStorage.clear();
});

describe('CxClient with the SDK on the server port', () => {
  test('creates the SDK once, aimed at the auth host', async () => {
    const { AgentSDK, sdk } = installAgentSdk();
    const cxClient = createCxClient();

    await cxClient.initSDK();
    await cxClient.initSDK();

    expect(AgentSDK).toHaveBeenCalledTimes(1);
    expect(globalThis.evAuthHost).toBe(AUTH_HOST);
    expect(sdk.config).toEqual(
      expect.objectContaining({
        authHost: AUTH_HOST,
        clientAppType: 'RingCX Embeddable',
        callbacks: expect.objectContaining({
          [CxCallbackTypes.ACK]: expect.any(Function),
          [CxCallbackTypes.CLOSE_SOCKET]: expect.any(Function),
          [CxCallbackTypes.LOGIN]: expect.any(Function),
          [CxCallbackTypes.OPEN_SOCKET]: expect.any(Function),
        }),
      }),
    );
    expect(AgentSDK.shared.HttpService.setApiBase).toHaveBeenCalledWith(
      AUTH_HOST,
    );
  });

  test('writes the feature flag domain defaults into SDK storage only', async () => {
    const { storage } = installAgentSdk();
    storage.setItem('FFS_DOMAIN_EXTERNAL', 'https://ffs.custom.test');

    await createCxClient().initSDK();

    expect(storage.getItem('FFS_DOMAIN_INITIAL')).toBe(
      'https://ffs.ringcentral.com',
    );
    expect(storage.getItem('FFS_DOMAIN_EXTERNAL')).toBe(
      'https://ffs.custom.test',
    );
    expect(window.localStorage.getItem('FFS_DOMAIN_INITIAL')).toBeNull();
  });

  test('reads the stored session back from SDK storage after the socket opens', async () => {
    const { sdk, storage } = installAgentSdk();
    const cxClient = createCxClient();
    await cxClient.initSDK();
    jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
    storage.setItem('agentSDK:agent_id', JSON.stringify('42'));
    storage.setItem('agentSDK:hash_code', JSON.stringify('hash-1'));
    window.localStorage.setItem('agentSDK:hash_code', JSON.stringify('stale'));

    await sdk.config.callbacks[CxCallbackTypes.OPEN_SOCKET]({});

    expect(cxClient.appStatus).toBe(evStatus.CONNECTED);
    expect(sdk.terminateStats).toHaveBeenCalled();
    await expect(cxClient.getStoredSession()).resolves.toEqual({
      agentId: '42',
      hashCode: 'hash-1',
      savedAt: 1_700_000_000_000,
    });
    expect(window.localStorage.getItem('__evSessionSavedAt__')).toBeNull();
  });

  test('has no stored session before a login or before the SDK is loaded', async () => {
    const cxClient = createCxClient();
    await expect(cxClient.getStoredSession()).resolves.toBeNull();

    const { storage } = installAgentSdk();
    storage.setItem('agentSDK:agent_id', JSON.stringify('42'));
    await expect(cxClient.getStoredSession()).resolves.toBeNull();
  });

  test('reads the Engage user details from SDK storage', () => {
    const { storage } = installAgentSdk();
    const userDetails = { rcAccountId: 'account-1', rcUserId: 'user-1' };
    storage.setItem('engage-auth:fullUserDetails', JSON.stringify(userDetails));
    window.localStorage.setItem(
      'engage-auth:fullUserDetails',
      JSON.stringify({ rcAccountId: 'page-account' }),
    );

    expect(createCxClient().getFullUserDetails()).toEqual(userDetails);
  });

  test('stores the Engage tokens through the SDK session without page storage', async () => {
    const { AgentSDK, sdk } = installAgentSdk();
    const engageResponse = { accessToken: 'socket-token', agentId: 42 };
    sdk.authenticateAgentWithRcAccessToken.mockImplementation(
      (_token, _tokenType, callback) =>
        callback({
          accessToken: 'engage-token',
          agents: [{ agentId: 42, agentType: 'AGENT' }],
        }),
    );
    sdk.authenticateAgentWithEngageAccessToken.mockImplementation(
      (_token, callback) => callback(engageResponse),
    );
    const cxClient = createCxClient();
    await cxClient.initSDK();

    const response = await cxClient.authenticateAgent('rc-token', 'Bearer');

    expect(sdk.authenticateAgentWithEngageAccessToken).toHaveBeenCalledWith(
      'engage-token',
      expect.any(Function),
    );
    expect(AgentSDK.shared.Session.storeAccessTokenResult).toHaveBeenCalledWith(
      { response: JSON.stringify(engageResponse) },
    );
    expect(
      AgentSDK.shared.Session.storeRCAccessTokenResult,
    ).toHaveBeenCalledWith({ response: JSON.stringify(engageResponse) });
    expect(response.agents[0].agentId).toBe('42');
    expect(cxClient.appStatus).toBe(evStatus.LOGINED);
  });

  test('opens the socket through the SDK and rejects without WebSocket support', async () => {
    const { sdk } = installAgentSdk();
    const cxClient = createCxClient();
    await cxClient.initSDK();
    sdk.openSocket.mockImplementation(() =>
      sdk.config.callbacks[CxCallbackTypes.OPEN_SOCKET]({ reconnect: false }),
    );

    await expect(cxClient.openSocket('42')).resolves.toEqual({
      reconnect: false,
    });
    expect(sdk.openSocket).toHaveBeenCalledWith('42');

    const { WebSocket } = globalThis;
    delete globalThis.WebSocket;
    try {
      expect(() => cxClient.openSocket('42')).toThrow(
        expect.objectContaining({
          type: messageTypes.INVALID_BROWSER,
        }),
      );
    } finally {
      globalThis.WebSocket = WebSocket;
    }
  });
});
