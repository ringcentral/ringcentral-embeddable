const {
  EmbeddableOAuth,
} = require('../src/app/services/Authentication/OAuth');

function createOAuth(options = {}, authOverrides = {}) {
  const auth = {
    notLoggedIn: true,
    ...authOverrides,
  };
  const authentication = {
    completeAuthProxyLogin: jest.fn(async () => {}),
    loginWithAuthorizationCode: jest.fn(async () => {}),
    loginWithJwt: jest.fn(async () => {}),
  };
  const client = {
    checkLoginUrlWithDiscovery: jest.fn(async () => {}),
  };
  const oAuth = new EmbeddableOAuth(
    client,
    {},
    {},
    auth,
    {},
    {},
    {},
    authentication,
    undefined,
    {
      prefix: 'rc-widget',
      redirectUri: 'https://host.example.com/redirect',
      ...options,
    }
  );
  return { auth, authentication, client, oAuth };
}

describe('EmbeddableOAuth', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test('automatically exchanges an authorization code before JWT', async () => {
    const { authentication, oAuth } = createOAuth({
      authorizationCode: 'authorization-code',
      authorizationCodeVerifier: 'code-verifier',
      jwt: 'jwt-token',
      externalAuthId: 'external-user',
    });

    await oAuth.onInitOnce();

    expect(authentication.loginWithAuthorizationCode).toHaveBeenCalledWith({
      code: 'authorization-code',
      codeVerifier: 'code-verifier',
      redirectUri: 'https://host.example.com/redirect',
    });
    expect(authentication.loginWithJwt).not.toHaveBeenCalled();
    expect(window.localStorage.getItem('rc-widget-external-auth-id')).toBe(
      'external-user'
    );
  });

  test('automatically exchanges JWT only once during initialization', async () => {
    const { authentication, oAuth } = createOAuth({ jwt: 'jwt-token' });

    await oAuth.onInitOnce();

    expect(authentication.loginWithJwt).toHaveBeenCalledWith('jwt-token');
  });

  test('keeps the current session when the external identity matches', async () => {
    window.localStorage.setItem('rc-widget-external-auth-id', 'external-user');
    const { authentication, oAuth } = createOAuth(
      {
        jwt: 'jwt-token',
        externalAuthId: 'external-user',
      },
      { notLoggedIn: false }
    );

    await oAuth.onInitOnce();

    expect(authentication.loginWithJwt).not.toHaveBeenCalled();
  });

  test('re-authenticates when the host external identity changes', async () => {
    window.localStorage.setItem('rc-widget-external-auth-id', 'old-user');
    const { authentication, oAuth } = createOAuth(
      {
        jwt: 'jwt-token',
        externalAuthId: 'new-user',
      },
      { notLoggedIn: false }
    );

    await oAuth.onInitOnce();

    expect(authentication.loginWithJwt).toHaveBeenCalledWith('jwt-token');
    expect(window.localStorage.getItem('rc-widget-external-auth-id')).toBe(
      'new-user'
    );
  });

  test('forwards callback JWT, verifier, and auth-proxy exchanges', async () => {
    const jwtCase = createOAuth();
    await jwtCase.oAuth._loginWithCallbackQuery({ jwt: 'callback-jwt' });
    expect(jwtCase.authentication.loginWithJwt).toHaveBeenCalledWith(
      'callback-jwt'
    );

    const verifierCase = createOAuth();
    await verifierCase.oAuth._loginWithCallbackQuery({
      code: 'callback-code',
      code_verifier: 'callback-verifier',
    });
    expect(
      verifierCase.authentication.loginWithAuthorizationCode
    ).toHaveBeenCalledWith({
      code: 'callback-code',
      codeVerifier: 'callback-verifier',
      redirectUri: 'https://host.example.com/redirect',
    });

    const proxyCase = createOAuth({ authProxy: true });
    await proxyCase.oAuth._loginWithCallbackQuery({});
    expect(
      proxyCase.authentication.completeAuthProxyLogin
    ).toHaveBeenCalledTimes(1);
  });

  test('delegates ordinary callbacks to micro-auth', async () => {
    const { oAuth } = createOAuth();

    await oAuth._loginWithCallbackQuery({ code: 'callback-code' });

    expect(oAuth.baseCallbackLogin).toHaveBeenCalledWith({
      code: 'callback-code',
    });
  });

  test('emits the documented login-popup event instead of opening a popup', async () => {
    const postMessage = jest.spyOn(window.parent, 'postMessage');
    const { client, oAuth } = createOAuth({ disableLoginPopup: true });
    oAuth.oAuthReady = true;

    await oAuth.openOAuthPage();

    expect(client.checkLoginUrlWithDiscovery).toHaveBeenCalledTimes(1);
    expect(postMessage).toHaveBeenCalledWith(
      {
        type: 'rc-login-popup-notify',
        oAuthUri: 'https://login.example.com/oauth',
      },
      '*'
    );
    expect(oAuth.baseOpenOAuthPage).not.toHaveBeenCalled();
    postMessage.mockRestore();
  });

  test('uses the stock popup flow when host popup handling is enabled', async () => {
    const { oAuth } = createOAuth({ disableLoginPopup: false });

    await oAuth.openOAuthPage();

    expect(oAuth.baseOpenOAuthPage).toHaveBeenCalledTimes(1);
  });
});
