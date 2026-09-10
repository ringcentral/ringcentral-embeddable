const mockStyles = new Proxy(
  {},
  {
    get: (_target, property) =>
      property === '__esModule' ? false : String(property),
  }
);

jest.mock('../../next/lib/Adapter/styles.scss', () => mockStyles);

describe('adapter authentication boundary', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      ADAPTER_NAME: 'adapter.js',
      APP_VERSION: '3.1.0-test',
      HOSTING_URL: '',
      PREFIX: 'rc-widget',
    };
    window.RCAdapter = null;
    window.RCAdapterInit = undefined;
    window.RCAdapterDispose = undefined;
    window.RC_EMBEDDABLE_ADAPTER_MANUAL_INIT = true;
    window.__ON_RC_POPUP_WINDOW = false;
    document.head.innerHTML = '';
  });

  afterEach(() => {
    window.RCAdapterDispose?.();
    delete window.RC_EMBEDDABLE_ADAPTER_MANUAL_INIT;
    delete window.__ON_RC_POPUP_WINDOW;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('preserves script URL authentication options in the iframe URL', () => {
    const script = document.createElement('script');
    const query = new URLSearchParams({
      clientId: 'client-id',
      clientSecret: 'client-secret',
      appServer: 'https://platform.devtest.ringcentral.com',
      discovery: 'false',
      discoverAppServer: 'https://discovery.ringcentral.com',
      authorizationCode: 'query-code',
      authorizationCodeVerifier: 'code verifier',
      authProxy: '0',
      disableLoginPopup: 'false',
      externalAuthId: 'external/user',
      jwt: 'jwt.token',
      proxyUri: 'https://host.example.com/proxy?source=adapter',
      redirectUri: 'https://host.example.com/redirect?source=adapter',
    });
    script.src = `https://widget.example.com/adapter.js?${query.toString()}#authorizationCode=hash-code`;
    document.head.appendChild(script);

    require('../../next/adapter');
    window.RCAdapterInit();

    const iframeUrl = new URL(window.RCAdapter.contentFrameEl.src);
    expect(iframeUrl.origin).toBe('https://widget.example.com');
    expect(iframeUrl.pathname).toBe('/app.html');
    expect(Object.fromEntries(iframeUrl.searchParams.entries())).toEqual(
      expect.objectContaining({
        clientId: 'client-id',
        clientSecret: 'client-secret',
        appServer: 'https://platform.devtest.ringcentral.com',
        discovery: 'false',
        discoverAppServer: 'https://discovery.ringcentral.com',
        authorizationCode: 'hash-code',
        authorizationCodeVerifier: 'code verifier',
        authProxy: '0',
        disableLoginPopup: 'false',
        externalAuthId: 'external/user',
        jwt: 'jwt.token',
        proxyUri: 'https://host.example.com/proxy?source=adapter',
        redirectUri: 'https://host.example.com/redirect?source=adapter',
        fromAdapter: '1',
      })
    );
  });

  test('uses explicit initialization options without changing auth values', () => {
    const script = document.createElement('script');
    script.src = 'https://widget.example.com/adapter.js';
    document.head.appendChild(script);
    require('../../next/adapter');

    window.RCAdapterInit({
      appUrl: 'https://custom.example.com/widget/app.html',
      options: {
        appKey: 'legacy-client',
        appSecret: 'legacy-secret',
        prefix: 'legacy-prefix',
        authorizationCode: 'explicit-code',
        authorizationCodeVerifier: 'explicit-verifier',
        disableLoginPopup: '1',
        externalAuthId: 'explicit-user',
        jwt: 'explicit-jwt',
      },
    });

    const iframeUrl = new URL(window.RCAdapter.contentFrameEl.src);
    expect(iframeUrl.origin).toBe('https://custom.example.com');
    expect(Object.fromEntries(iframeUrl.searchParams.entries())).toEqual(
      expect.objectContaining({
        appKey: 'legacy-client',
        appSecret: 'legacy-secret',
        prefix: 'legacy-prefix',
        authorizationCode: 'explicit-code',
        authorizationCodeVerifier: 'explicit-verifier',
        disableLoginPopup: '1',
        externalAuthId: 'explicit-user',
        jwt: 'explicit-jwt',
      })
    );
  });

  test('preserves the ringout caller ID option in the iframe URL', () => {
    const script = document.createElement('script');
    script.src =
      'https://widget.example.com/adapter.js?enableRingoutCallerId=1';
    document.head.appendChild(script);

    require('../../next/adapter');
    window.RCAdapterInit();

    const iframeUrl = new URL(window.RCAdapter.contentFrameEl.src);
    expect(iframeUrl.searchParams.get('enableRingoutCallerId')).toBe('1');
  });
});
