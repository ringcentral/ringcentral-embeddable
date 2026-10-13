const mockStyles = new Proxy(
  {},
  {
    get: (_target, property) =>
      property === '__esModule' ? false : String(property),
  }
);

jest.mock('../../src/lib/Adapter/styles.scss', () => mockStyles);

describe('adapter unsupported parameters', () => {
  const originalEnv = process.env;
  let warn;

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
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    window.RCAdapterDispose?.();
    delete window.RC_EMBEDDABLE_ADAPTER_MANUAL_INIT;
    delete window.__ON_RC_POPUP_WINDOW;
    warn.mockRestore();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  function loadAdapter(query) {
    const script = document.createElement('script');
    script.src = `https://widget.example.com/adapter.js?${query}`;
    document.head.appendChild(script);
    require('../../src/adapter');
    window.RCAdapterInit();
    return new URL(window.RCAdapter.contentFrameEl.src);
  }

  test('does not pass stylesUri to the app and warns the host', () => {
    const iframeUrl = loadAdapter(
      'clientId=client-id&stylesUri=https%3A%2F%2Fhost.example.com%2Fwidget.css',
    );

    expect(iframeUrl.searchParams.has('stylesUri')).toBe(false);
    expect(iframeUrl.searchParams.get('clientId')).toBe('client-id');
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('stylesUri is not supported since 3.1'),
    );
  });

  test.each([
    ['multipleTabsSupport', 'tabs always share one connection'],
    ['disconnectInactiveWebphone', 'tabs always share one connection'],
    ['enableRingtoneSettings', 'ringtone settings are always available'],
  ])('does not pass %s to the app and warns the host', (name, reason) => {
    const iframeUrl = loadAdapter(`clientId=client-id&${name}=1`);

    expect(iframeUrl.searchParams.has(name)).toBe(false);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining(`${name} is not needed since 3.1: ${reason}`),
    );
  });

  test('drops undocumented parameters that 3.1 does not read without a warning', () => {
    const names = [
      'enableWebRTCPlanB',
      'enableErrorReport',
      'errorReportToken',
      'errorReportSampleRate',
      'errorReportProjectId',
      'proxyUri',
    ];
    const iframeUrl = loadAdapter(
      ['clientId=client-id', ...names.map((name) => `${name}=1`)].join('&'),
    );

    names.forEach((name) => {
      expect(iframeUrl.searchParams.has(name)).toBe(false);
    });
    expect(warn).not.toHaveBeenCalled();
  });

  test('passes appVersion, enableSMSTemplate, and enableSharedMessages to the app', () => {
    const iframeUrl = loadAdapter(
      'clientId=client-id&appVersion=9.9.9&enableSMSTemplate=1&enableSharedMessages=true',
    );

    expect(iframeUrl.searchParams.get('appVersion')).toBe('9.9.9');
    expect(iframeUrl.searchParams.get('enableSMSTemplate')).toBe('1');
    expect(iframeUrl.searchParams.get('enableSharedMessages')).toBe('true');
  });

  test('does not warn without stylesUri', () => {
    loadAdapter('clientId=client-id');

    expect(warn).not.toHaveBeenCalledWith(
      expect.stringContaining('stylesUri'),
    );
  });
});
