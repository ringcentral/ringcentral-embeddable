// An expired CX (Engage) token is replaced by exchanging the RC access token
// again. When the RC token has expired too, `ensureValidAccessToken` refreshes
// it on the platform, but the Auth state only picks the new token up later from
// an async `refreshSuccess` listener. The exchange must use the platform token,
// not the stale one still held in the Auth state.

jest.mock('@ringcentral-integration/micro-core/src/app/plugins', () => ({
  BlockPlugin: class BlockPlugin {},
}));

import { CxAuth } from '../../src/ringcx/services/CxAuth/CxAuth';

const STALE_RC_TOKEN = 'stale-rc-token';
const FRESH_RC_TOKEN = 'fresh-rc-token';

function createAuthenticateResponse() {
  return { agents: [{ agentId: '1001' }] };
}

/**
 * Mimics micro-auth: the refresh saves the new token on the platform right
 * away, and the Auth state is only updated after the refresh call returned.
 */
function createRefreshingAuth(platformAuthData) {
  const auth = {
    loggedIn: true,
    accessToken: STALE_RC_TOKEN,
    ensureValidAccessToken: jest.fn(async () => {
      platformAuthData.access_token = FRESH_RC_TOKEN;
      setTimeout(() => {
        auth.accessToken = FRESH_RC_TOKEN;
      }, 0);
    }),
  };
  return auth;
}

function createClient(platformAuthData) {
  return {
    service: {
      platform: () => ({
        auth: () => ({
          data: jest.fn(async () => ({ ...platformAuthData })),
        }),
      }),
    },
  };
}

function createCxClient({ evTokenValid = false } = {}) {
  return {
    initSDK: jest.fn(async () => undefined),
    refreshEvToken: jest.fn(async () => evTokenValid),
    getAndHandleAuthenticateResponse: jest.fn(async () =>
      createAuthenticateResponse(),
    ),
  };
}

function createCxAuth({ auth, client, cxClient }) {
  return new CxAuth(
    cxClient,
    auth,
    client,
    { subscribe: jest.fn() },
    { currentLocale: 'en-US' },
    { danger: jest.fn(), warning: jest.fn(), info: jest.fn() },
    {},
    { enable: jest.fn() },
    { shared: true, onServer: jest.fn() },
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('CxAuth RC token exchange', () => {
  test('authenticates with the RC token the refresh just saved on the platform', async () => {
    const platformAuthData = { access_token: STALE_RC_TOKEN };
    const auth = createRefreshingAuth(platformAuthData);
    const cxClient = createCxClient();
    const cxAuth = createCxAuth({
      auth,
      client: createClient(platformAuthData),
      cxClient,
    });

    const response = await cxAuth.authenticateWithToken({
      shouldEmitAuthSuccess: false,
    });

    expect(auth.ensureValidAccessToken).toHaveBeenCalledTimes(1);
    expect(auth.accessToken).toBe(STALE_RC_TOKEN);
    expect(cxClient.getAndHandleAuthenticateResponse).toHaveBeenCalledWith(
      FRESH_RC_TOKEN,
      'Bearer',
    );
    expect(response).toEqual(createAuthenticateResponse());
  });

  test('re-exchanges the refreshed RC token when the CX token has expired', async () => {
    const platformAuthData = { access_token: STALE_RC_TOKEN };
    const auth = createRefreshingAuth(platformAuthData);
    const cxClient = createCxClient({ evTokenValid: false });
    const cxAuth = createCxAuth({
      auth,
      client: createClient(platformAuthData),
      cxClient,
    });

    await expect(cxAuth.refreshEvToken()).resolves.toBe(true);

    expect(cxClient.refreshEvToken).toHaveBeenCalledTimes(1);
    expect(cxClient.getAndHandleAuthenticateResponse).toHaveBeenCalledTimes(1);
    expect(cxClient.getAndHandleAuthenticateResponse).toHaveBeenCalledWith(
      FRESH_RC_TOKEN,
      'Bearer',
    );
  });

  test('skips the RC token exchange while the CX token is still valid', async () => {
    const platformAuthData = { access_token: STALE_RC_TOKEN };
    const auth = createRefreshingAuth(platformAuthData);
    const cxClient = createCxClient({ evTokenValid: true });
    const cxAuth = createCxAuth({
      auth,
      client: createClient(platformAuthData),
      cxClient,
    });

    await expect(cxAuth.refreshEvToken()).resolves.toBe(true);

    expect(auth.ensureValidAccessToken).not.toHaveBeenCalled();
    expect(cxClient.getAndHandleAuthenticateResponse).not.toHaveBeenCalled();
  });

  test('falls back to the Auth state token when the platform has none', async () => {
    const auth = {
      loggedIn: true,
      accessToken: FRESH_RC_TOKEN,
      ensureValidAccessToken: jest.fn(async () => undefined),
    };
    const cxClient = createCxClient();
    const cxAuth = createCxAuth({
      auth,
      client: createClient({}),
      cxClient,
    });

    await cxAuth.authenticateWithToken({ shouldEmitAuthSuccess: false });

    expect(cxClient.getAndHandleAuthenticateResponse).toHaveBeenCalledWith(
      FRESH_RC_TOKEN,
      'Bearer',
    );
  });
});
