jest.mock('../../next/app/getAppConfig', () => ({
  getAppConfig: jest.fn((config) => config),
}));

const { createSharedApp } = require('@ringcentral-integration/next-core');
const { getAppConfig } = require('../../next/app/getAppConfig');
const { createApp } = require('../../next/createApp');

describe('createApp authentication boundary', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      APP_CONFIG: {
        prefix: 'default-prefix',
        brandConfig: {
          appName: 'Embeddable',
          defaultLocale: 'en-US',
          code: 'rc',
        },
        version: {
          appVersion: '1.0.0',
        },
      },
      API_CONFIG: {
        clientId: 'default-client-id',
        server: 'https://platform.example.com',
      },
      REDIRECT_URI: 'https://default.example.com/redirect',
      MIXPANEL_KEY: '',
    };
    getAppConfig.mockClear();
    createSharedApp.mockClear();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('forwards direct-iframe authentication inputs to DI configuration', async () => {
    const query = new URLSearchParams({
      clientId: 'runtime-client-id',
      clientSecret: 'runtime-client-secret',
      authorizationCode: 'query-code',
      authorizationCodeVerifier: 'code verifier',
      authProxy: '0',
      disableLoginPopup: 'false',
      externalAuthId: 'external/user',
      jwt: 'jwt.token',
      proxyUri: 'https://host.example.com/proxy?source=widget',
      redirectUri: 'https://host.example.com/redirect?source=widget',
    });
    window.history.replaceState(
      {},
      '',
      `/app.html?${query.toString()}#authorizationCode=hash-code`
    );

    await createApp();

    expect(getAppConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        authorizationCode: 'hash-code',
        authorizationCodeVerifier: 'code verifier',
        authProxy: true,
        disableLoginPopup: true,
        externalAuthId: 'external/user',
        jwt: 'jwt.token',
        proxyUri: 'https://host.example.com/proxy?source=widget',
        redirectUri: 'https://host.example.com/redirect?source=widget',
        sdkConfig: expect.objectContaining({
          clientId: 'runtime-client-id',
          clientSecret: 'runtime-client-secret',
        }),
      })
    );
  });

  test('uses the configured redirect URI when the URL does not override it', async () => {
    window.history.replaceState({}, '', '/app.html');

    await createApp();

    expect(getAppConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        authorizationCode: undefined,
        authorizationCodeVerifier: undefined,
        authProxy: false,
        disableLoginPopup: false,
        externalAuthId: undefined,
        jwt: undefined,
        proxyUri: undefined,
        redirectUri: 'https://default.example.com/redirect',
        enableAnalytics: false,
      })
    );
  });

  test('preserves legacy truthiness for the external analytics flag', async () => {
    window.history.replaceState({}, '', '/app.html?enableAnalytics=false');

    await createApp();

    expect(getAppConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        enableAnalytics: true,
      })
    );
  });

  test('forwards the Smart Notes URI flag to feature configuration', async () => {
    window.history.replaceState({}, '', '/app.html?enableSmartNote=1');

    await createApp();

    expect(getAppConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        enableSmartNote: true,
      })
    );
  });

  test('forwards message logger defaults and typing-time tracking', async () => {
    window.history.replaceState(
      {},
      '',
      '/app.html?defaultAutoLogMessageEnabled=1&enableTypingTimeTracking=true'
    );

    await createApp();

    expect(getAppConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultAutoLogMessageEnabled: true,
        enableTypingTimeTracking: true,
      })
    );
  });

  test('keeps a runtime client ID in PKCE mode without inheriting a default secret', async () => {
    process.env.API_CONFIG = {
      appKey: 'default-client',
      appSecret: 'default-secret',
      server: 'https://platform.ringcentral.com',
    };
    window.history.replaceState({}, '', '/app.html?clientId=runtime-client');

    await createApp();

    const [{ sdkConfig }] = getAppConfig.mock.calls[0];
    expect(sdkConfig).toEqual({
      clientId: 'runtime-client',
      server: 'https://platform.ringcentral.com',
    });
  });

  test('applies app-server validation and discovery allowlisting at the URL boundary', async () => {
    const query = new URLSearchParams({
      appServer: 'https://attacker.example.com?javascript=1',
      discovery: 'false',
      discoverAppServer: 'https://discovery.ringcentral.com',
    });
    window.history.replaceState({}, '', `/app.html?${query.toString()}`);

    await createApp();

    expect(getAppConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        sdkConfig: expect.objectContaining({
          server: 'https://platform.example.com',
          enableDiscovery: true,
          discoveryServer: 'https://discovery.ringcentral.com',
        }),
      })
    );
  });

  test('preserves the appKey alias and emits its deprecation warning', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    window.history.replaceState(
      {},
      '',
      '/app.html?appKey=legacy-client&appSecret=legacy-secret&prefix=legacy-prefix'
    );

    await createApp();

    expect(getAppConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        prefix: 'legacy-prefix',
        sdkConfig: expect.objectContaining({
          clientId: 'legacy-client',
          clientSecret: 'legacy-secret',
        }),
      })
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('deprecated'));
    warn.mockRestore();
  });

  test('rejects a missing client ID outside localhost', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    process.env.API_CONFIG = {
      server: 'https://platform.example.com',
    };
    window.history.replaceState({}, '', '/app.html');

    await expect(createApp()).rejects.toThrow(
      'RingCentral App Client Id is required.'
    );
    expect(createSharedApp).not.toHaveBeenCalled();
    error.mockRestore();
  });
});
