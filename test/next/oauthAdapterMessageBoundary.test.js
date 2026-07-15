jest.mock(
  '@ringcentral-integration/micro-auth/src/app/services/Analytics',
  () => ({
    trackEvent: jest.fn(),
  })
);
jest.mock('@ringcentral-integration/micro-auth/src/app/services/Auth', () => ({
  Auth: class Auth {},
}));
jest.mock(
  '@ringcentral-integration/micro-auth/src/app/services/Client',
  () => ({
    Client: class Client {},
  })
);

const {
  OAuth,
} = require('@ringcentral-integration/micro-auth/src/app/services/OAuth/OAuth');

describe('OAuth adapter-message boundary', () => {
  test('passes rc-adapter-authorization-code callbackUri to OAuth exactly once', () => {
    const oAuth = new OAuth(
      {
        checkLoginUrlWithDiscovery: jest.fn(async () => {}),
      },
      {
        currentPath: '/',
      },
      {
        shared: false,
        isWorkerMode: false,
      },
      {
        loggedIn: false,
      },
      {},
      {
        currentLocale: 'en-US',
      },
      {
        defaultConfig: { id: '1210' },
      },
      undefined,
      {
        loginPath: '/',
        redirectUri: 'https://host.example.com/redirect',
      }
    );
    oAuth.handleCallbackLogin = jest.fn(async () => {});
    const callbackUri =
      'https://host.example.com/redirect?code=authorization-code&code_verifier=verifier';

    window.dispatchEvent(
      new MessageEvent('message', {
        data: {
          type: 'rc-adapter-authorization-code',
          callbackUri,
        },
      })
    );

    expect(oAuth.handleCallbackLogin).toHaveBeenCalledTimes(1);
    expect(oAuth.handleCallbackLogin).toHaveBeenCalledWith(callbackUri);
  });
});
