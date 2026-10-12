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

  test('treats a present parameter as disabled whatever its value, like 3.x', async () => {
    const query = new URLSearchParams({
      disableCall: '0',
      disableCallHistory: 'false',
      disableContacts: '1',
      disableMeeting: 'true',
      disableMessages: '1',
      disableReadText: '1',
    });
    window.history.replaceState({}, '', `/app.html?${query.toString()}`);

    await createApp();

    expect(getAppConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        disableCall: true,
        disableCallHistory: true,
        disableContacts: true,
        disableMeeting: true,
        disableMessages: true,
        disableReadText: true,
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
