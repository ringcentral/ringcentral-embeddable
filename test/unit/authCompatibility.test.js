const {
  EmbeddableAuth,
} = require('../../src/app/services/Authentication/Auth');

function createAuth() {
  const sdkAuth = {
    data: jest.fn(async () => ({ access_token: 'access-token' })),
    setData: jest.fn(async () => {}),
  };
  const requestClient = {
    events: {
      requestError: 'requestError',
    },
    addListener: jest.fn(),
    removeListener: jest.fn(),
  };
  const platform = {
    auth: jest.fn(() => sdkAuth),
    get: jest.fn(async () => ({
      json: async () => ({
        owner_id: 'owner-id',
        scope: 'scope',
        endpoint_id: 'endpoint-id',
      }),
    })),
    post: jest.fn(async () => ({ ok: true })),
    logout: jest.fn(async () => {}),
    events: {
      logoutSuccess: 'logoutSuccess',
      logoutError: 'logoutError',
    },
    emit: jest.fn(),
  };
  const cache = {
    clean: jest.fn(async () => {}),
  };
  const client = {
    service: {
      platform: jest.fn(() => platform),
      cache: jest.fn(() => cache),
      client: jest.fn(() => requestClient),
    },
  };
  const auth = new EmbeddableAuth(
    client,
    {},
    {},
    {},
    {},
    {},
    undefined,
    undefined,
    undefined,
    { authProxy: true }
  );
  return { auth, cache, platform, requestClient, sdkAuth };
}

describe('EmbeddableAuth', () => {
  test('hydrates missing auth-proxy owner identity during initialization', async () => {
    const { auth, platform, sdkAuth } = createAuth();
    auth._loggedIn = true;
    const setInitLogin = jest.spyOn(auth, 'setInitLogin');

    await auth.fetchToken();

    expect(platform.get).toHaveBeenCalledWith('/restapi/v1.0/client-info');
    expect(sdkAuth.setData).toHaveBeenCalledWith({
      owner_id: 'owner-id',
      scope: 'scope',
      endpoint_id: 'endpoint-id',
    });
    expect(setInitLogin).toHaveBeenCalledWith({
      loggedIn: true,
      token: {
        access_token: 'access-token',
        owner_id: 'owner-id',
        scope: 'scope',
        endpoint_id: 'endpoint-id',
      },
    });
  });

  test('installs the legacy auth-proxy logout exchange', async () => {
    const { auth, cache, platform } = createAuth();

    await auth.logout({ reason: 'User action' });
    const response = await platform.logout();

    expect(platform.post).toHaveBeenCalledWith('/logout');
    expect(cache.clean).toHaveBeenCalledTimes(1);
    expect(platform.emit).toHaveBeenCalledWith('logoutSuccess', response);
  });

  test('logs out an auth-proxy session after an unauthorized request', async () => {
    const { auth, requestClient } = createAuth();
    auth.loggedIn = true;
    const logout = jest.spyOn(auth, 'logout').mockResolvedValue();

    await auth.onInit();
    const listener = requestClient.addListener.mock.calls.find(
      ([event]) => event === 'requestError'
    )[1];
    listener({ response: { status: 401 } });

    expect(logout).toHaveBeenCalledWith({ reason: 'Request error' });
  });
});
