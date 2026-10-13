jest.mock('../../src/app/getAppConfig', () => ({
  getAppConfig: jest.fn((config) => config),
}));

const { getAppConfig } = require('../../src/app/getAppConfig');
const { createApp } = require('../../src/createApp');

describe('createApp disable* URL parameters', () => {
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
      },
      API_CONFIG: {
        clientId: 'default-client-id',
        server: 'https://platform.example.com',
      },
      MIXPANEL_KEY: '',
    };
    getAppConfig.mockClear();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('leaves every feature enabled without disable* parameters', async () => {
    window.history.replaceState({}, '', '/app.html');

    await createApp();

    expect(getAppConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        disableCall: false,
        disableCallHistory: false,
        disableContacts: false,
        disableMeeting: false,
        disableMessages: false,
        disableReadText: false,
      }),
    );
  });

  test('disables a feature only for 1 or true, like other boolean parameters', async () => {
    const query = new URLSearchParams({
      disableCall: '0',
      disableCallHistory: 'false',
      disableContacts: '1',
      disableMeeting: 'true',
      disableMessages: 'yes',
      disableReadText: '',
    });
    window.history.replaceState({}, '', `/app.html?${query.toString()}`);

    await createApp();

    expect(getAppConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        disableCall: false,
        disableCallHistory: false,
        disableContacts: true,
        disableMeeting: true,
        disableMessages: false,
        disableReadText: false,
      }),
    );
  });

  test('reads parameters from the hash too', async () => {
    window.history.replaceState({}, '', '/app.html#disableContacts=1');

    await createApp();

    expect(getAppConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        disableCall: false,
        disableContacts: true,
      }),
    );
  });
});

describe('createApp feature and version URL parameters', () => {
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
        version: { appVersion: '3.1.0' },
      },
      API_CONFIG: {
        clientId: 'default-client-id',
        server: 'https://platform.example.com',
      },
      MIXPANEL_KEY: '',
    };
    delete process.env.APP_VERSION;
    getAppConfig.mockClear();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('keeps SMS templates and shared messages off by default', async () => {
    window.history.replaceState({}, '', '/app.html');

    await createApp();

    expect(getAppConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        appVersion: '3.1.0',
        displayAppVersion: undefined,
        enableSMSTemplate: false,
        enableSharedMessages: false,
      }),
    );
  });

  test('turns the features on for 1 or true and shows the host app version', async () => {
    window.history.replaceState(
      {},
      '',
      '/app.html?enableSMSTemplate=1&enableSharedMessages=true&appVersion=9.9.9',
    );

    await createApp();

    expect(getAppConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        appVersion: '3.1.0',
        displayAppVersion: '9.9.9',
        enableSMSTemplate: true,
        enableSharedMessages: true,
      }),
    );
  });

  test('passes defaultCallWith through for the calling settings', async () => {
    window.history.replaceState({}, '', '/app.html?defaultCallWith=ringout');

    await createApp();

    expect(getAppConfig).toHaveBeenCalledWith(
      expect.objectContaining({ defaultCallWith: 'ringout' }),
    );
  });

  test('leaves the features off for other values', async () => {
    window.history.replaceState(
      {},
      '',
      '/app.html?enableSMSTemplate=0&enableSharedMessages=false',
    );

    await createApp();

    expect(getAppConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        enableSMSTemplate: false,
        enableSharedMessages: false,
      }),
    );
  });
});

describe('createApp stylesUri', () => {
  const originalEnv = process.env;
  let warn;

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
      },
      API_CONFIG: {
        clientId: 'default-client-id',
        server: 'https://platform.example.com',
      },
      MIXPANEL_KEY: '',
    };
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('warns that stylesUri is no longer supported', async () => {
    window.history.replaceState(
      {},
      '',
      '/app.html?stylesUri=https%3A%2F%2Fhost.example.com%2Fwidget.css',
    );

    await createApp();

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('stylesUri is not supported since 3.1'),
    );
  });

  test('does not warn without stylesUri', async () => {
    window.history.replaceState({}, '', '/app.html');

    await createApp();

    expect(warn).not.toHaveBeenCalledWith(
      expect.stringContaining('stylesUri'),
    );
  });
});
