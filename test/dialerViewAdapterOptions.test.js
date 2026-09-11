jest.mock('@ringcentral-integration/micro-auth/src/app/services', () => ({
  AccountInfo: class AccountInfo {},
  ConnectivityManager: class ConnectivityManager {},
  ExtensionFeatures: class ExtensionFeatures {},
  RateLimiter: class RateLimiter {},
  RegionSettings: class RegionSettings {},
}));
jest.mock('@ringcentral-integration/micro-contacts/src/app/services', () => ({
  ContactSearch: class ContactSearch {},
}));
jest.mock('@ringcentral-integration/micro-core/src/app/services', () => ({
  Locale: class Locale {},
  Toast: class Toast {},
}));
jest.mock('@ringcentral-integration/micro-phone/src/app/services', () => ({
  AudioSettings: class AudioSettings {},
  Call: class Call {},
  CallingSettings: class CallingSettings {},
  Webphone: class Webphone {},
  callingModes: { ringout: 'callingModes-ringout' },
}));
jest.mock('@ringcentral-integration/micro-phone/src/app/views', () => ({
  DialerView: class DialerView {
    getUIProps() {
      return this.baseUIProps;
    }
  },
}));
jest.mock('@ringcentral-integration/next-core', () => ({
  PortManager: class PortManager {},
  injectable: () => (target) => target,
  optional: () => () => {},
}));
jest.mock('../src/app/services/DoNotContact', () => ({
  DoNotContact: class DoNotContact {},
}));

const { DialerView } = require('../src/app/views/DialerView/Dialer.view');

describe('DialerView Adapter options', () => {
  test('shows caller ID for RingOut only when the legacy option is enabled', () => {
    const view = Object.assign(Object.create(DialerView.prototype), {
      baseUIProps: {
        callingMode: 'callingModes-ringout',
        isWebphoneMode: false,
      },
      _adapterOptions: { enableRingoutCallerId: true },
    });

    expect(view.getUIProps({}).isWebphoneMode).toBe(true);
    view._adapterOptions.enableRingoutCallerId = false;
    expect(view.getUIProps({}).isWebphoneMode).toBe(false);
  });
});
