const {
  Authentication,
} = require('../../src/app/services/Authentication/Authentication');

function createService() {
  const platform = {
    login: jest.fn(async () => {}),
    get: jest.fn(async () => ({
      json: async () => ({
        owner_id: 'owner-id',
        scope: 'scope',
        endpoint_id: 'endpoint-id',
      }),
    })),
    auth: jest.fn(() => ({
      setData: jest.fn(async () => {}),
    })),
    events: {
      loginSuccess: 'loginSuccess',
    },
    emit: jest.fn(),
  };
  const auth = {
    login: jest.fn(async () => {}),
    setLogin: jest.fn(),
  };
  const client = {
    service: {
      platform: jest.fn(() => platform),
    },
  };
  return {
    auth,
    platform,
    service: new Authentication(auth, client),
  };
}

describe('Authentication', () => {
  test('uses micro-auth for an authorization code without a verifier', async () => {
    const { auth, platform, service } = createService();

    await service.loginWithAuthorizationCode({
      code: 'authorization-code',
      redirectUri: 'https://host.example.com/redirect',
    });

    expect(auth.login).toHaveBeenCalledWith({
      code: 'authorization-code',
      redirectUri: 'https://host.example.com/redirect',
    });
    expect(platform.login).not.toHaveBeenCalled();
  });

  test('sends the public SDK verifier fields for host-owned PKCE', async () => {
    const { auth, platform, service } = createService();

    await service.loginWithAuthorizationCode({
      code: 'authorization-code',
      codeVerifier: 'code-verifier',
      redirectUri: 'https://host.example.com/redirect',
    });

    expect(auth.setLogin).toHaveBeenCalledTimes(1);
    expect(platform.login).toHaveBeenCalledWith({
      code: 'authorization-code',
      code_verifier: 'code-verifier',
      redirect_uri: 'https://host.example.com/redirect',
    });
  });

  test('logs in with JWT through the SDK', async () => {
    const { auth, platform, service } = createService();

    await service.loginWithJwt('jwt-token');

    expect(auth.setLogin).toHaveBeenCalledTimes(1);
    expect(platform.login).toHaveBeenCalledWith({ jwt: 'jwt-token' });
  });

  test('hydrates auth-proxy identity and emits SDK login success', async () => {
    const { platform, service } = createService();
    const platformAuth = platform.auth();
    platform.auth.mockReturnValue(platformAuth);

    await service.completeAuthProxyLogin();

    expect(platform.get).toHaveBeenCalledWith('/restapi/v1.0/client-info');
    expect(platformAuth.setData).toHaveBeenCalledWith({
      owner_id: 'owner-id',
      scope: 'scope',
      endpoint_id: 'endpoint-id',
    });
    expect(platform.emit).toHaveBeenCalledWith(
      'loginSuccess',
      expect.any(Object)
    );
  });
});
