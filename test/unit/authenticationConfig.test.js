const {
  getAuthenticationConfig,
} = require('../../src/app/services/Authentication/getAuthenticationConfig');

describe('authentication configuration', () => {
  test('configures PKCE and preserves Embeddable OAuth inputs', () => {
    const config = getAuthenticationConfig({
      prefix: 'rc-widget',
      sdkConfig: {
        clientId: 'client-id',
        server: 'https://platform.example.com',
      },
      authProxy: false,
      disableLoginPopup: true,
      authorizationCode: 'authorization-code',
      authorizationCodeVerifier: 'code-verifier',
      externalAuthId: 'external-user',
      jwt: 'jwt-token',
      redirectUri: 'https://host.example.com/redirect',
    });

    expect(config.sdkOptions).toEqual({
      cachePrefix: 'sdk-rc-widget',
      redirectUri: 'https://host.example.com/redirect',
    });
    expect(config.authOptions).toEqual({
      usePKCE: true,
      authProxy: false,
    });
    expect(config.oAuthOptions).toEqual({
      redirectUri: 'https://host.example.com/redirect',
      prefix: 'rc-widget',
      uiOptions: ['hide_remember_me', 'hide_tos'],
      authProxy: false,
      authorizationCode: 'authorization-code',
      authorizationCodeVerifier: 'code-verifier',
      disableLoginPopup: true,
      externalAuthId: 'external-user',
      jwt: 'jwt-token',
    });
  });

  test.each([
    ['a client secret is present', { clientSecret: 'client-secret' }],
    ['auth proxy is enabled', { authProxy: true }],
  ])('disables PKCE when %s', (_description, override) => {
    const config = getAuthenticationConfig({
      prefix: 'rc-widget',
      sdkConfig: {
        clientId: 'client-id',
        server: 'https://platform.example.com',
        ...override,
      },
      authProxy: override.authProxy ?? false,
      disableLoginPopup: false,
    });

    expect(config.authOptions.usePKCE).toBe(false);
  });

  test('configures the legacy auth-proxy SDK endpoints and cache', () => {
    const config = getAuthenticationConfig({
      prefix: 'rc-widget',
      sdkConfig: {
        clientId: 'client-id',
        server: 'https://platform.example.com',
      },
      authProxy: true,
      disableLoginPopup: false,
    });

    expect(config.sdkOptions).toEqual({
      cachePrefix: 'sdk-auth-proxy-rc-widget',
      redirectUri: './redirect.html',
      authProxy: true,
      authorizeEndpoint: '/authorize',
      revokeEndpoint: '/logout',
    });
    expect(config.oAuthOptions.redirectUri).toBe('./redirect.html');
  });
});
