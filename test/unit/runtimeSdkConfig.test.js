const {
  resolveRuntimeSdkConfig,
} = require('../../src/lib/resolveRuntimeSdkConfig');

describe('runtime SDK configuration compatibility', () => {
  const defaults = {
    appKey: 'default-client',
    appSecret: 'default-secret',
    server: 'https://platform.ringcentral.com',
  };

  test('normalizes static credential aliases', () => {
    expect(resolveRuntimeSdkConfig(defaults, {})).toEqual({
      clientId: 'default-client',
      clientSecret: 'default-secret',
      server: 'https://platform.ringcentral.com',
    });
    expect(
      resolveRuntimeSdkConfig(
        {
          apiKey: 'api-client',
          apiSecret: 'api-secret',
          apiServer: 'https://api.example.com',
        },
        {}
      )
    ).toEqual({
      clientId: 'api-client',
      clientSecret: 'api-secret',
      server: 'https://api.example.com',
    });
  });

  test('does not pair the default secret with a runtime client ID', () => {
    expect(
      resolveRuntimeSdkConfig(defaults, {
        clientId: 'runtime-client',
      })
    ).toEqual({
      clientId: 'runtime-client',
      server: 'https://platform.ringcentral.com',
    });
  });

  test('uses a runtime secret only with the runtime client ID', () => {
    expect(
      resolveRuntimeSdkConfig(defaults, {
        clientId: 'runtime-client',
        clientSecret: 'runtime-secret',
      })
    ).toEqual({
      clientId: 'runtime-client',
      clientSecret: 'runtime-secret',
      server: 'https://platform.ringcentral.com',
    });
  });

  test('accepts legacy-compatible HTTPS app servers', () => {
    expect(
      resolveRuntimeSdkConfig(defaults, {
        appServer: 'https://platform.devtest.ringcentral.com',
      }).server
    ).toBe('https://platform.devtest.ringcentral.com');
  });

  test.each([
    'http://platform.example.com',
    'javascript:alert(1)',
    'https://platform.example.com?redirect=javascript:alert(1)',
    'https://platform.example.com/javascript',
  ])('rejects an invalid app server: %s', (appServer) => {
    expect(resolveRuntimeSdkConfig(defaults, { appServer }).server).toBe(
      'https://platform.ringcentral.com'
    );
  });

  test('enables discovery with an allowlisted server', () => {
    expect(
      resolveRuntimeSdkConfig(defaults, {
        discovery: true,
        discoverAppServer: 'https://discovery.ringcentral.com',
      })
    ).toEqual({
      clientId: 'default-client',
      clientSecret: 'default-secret',
      server: 'https://platform.ringcentral.com',
      enableDiscovery: true,
      discoveryServer: 'https://discovery.ringcentral.com',
    });
  });

  test('falls back to the static server for an unknown discovery server', () => {
    expect(
      resolveRuntimeSdkConfig(defaults, {
        discovery: true,
        discoverAppServer: 'https://attacker.example.com',
      }).discoveryServer
    ).toBe('https://platform.ringcentral.com');
  });

  test('preserves explicit static discovery configuration without URL input', () => {
    expect(
      resolveRuntimeSdkConfig(
        {
          ...defaults,
          enableDiscovery: true,
          discoveryServer: 'https://discovery.ringcentral.biz',
        },
        {}
      )
    ).toEqual({
      clientId: 'default-client',
      clientSecret: 'default-secret',
      server: 'https://platform.ringcentral.com',
      enableDiscovery: true,
      discoveryServer: 'https://discovery.ringcentral.biz',
    });
  });
});
