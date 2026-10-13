jest.mock('@ringcentral-integration/micro-phone/src/app/services', () => ({
  CallerId: class CallerId {},
  ForwardingNumber: class ForwardingNumber {},
  Softphone: class Softphone {},
  Webphone: class Webphone {},
  callingOptions: {
    softphone: 'callingOptions-softphone',
    ringout: 'callingOptions-ringout',
    browser: 'callingOptions-browser',
    jupiter: 'callingOptions-jupiter',
  },
  // The upstream first login picks the first option.
  CallingSettings: class CallingSettings {
    constructor(...args) {
      this._callingSettingsOptions = args[14];
      this.data = { callWith: null, timestamp: null };
      this.callWithOptions = [];
    }

    get callWith() {
      return this.data.callWith;
    }

    get timestamp() {
      return this.data.timestamp;
    }

    setDataAction({ callWith = this.callWith, timestamp = this.timestamp }) {
      this.data = { callWith, timestamp };
    }

    _handleFirstTimeLogin() {
      if (!this.timestamp) {
        this.setDataAction({
          callWith: this.callWithOptions[0],
          timestamp: 1,
        });
      }
    }
  },
}));

import { CallingSettings } from '../../src/app/services/CallingSettings';

const ALL_OPTIONS = [
  'callingOptions-browser',
  'callingOptions-jupiter',
  'callingOptions-softphone',
  'callingOptions-ringout',
];

function createCallingSettings(defaultCallWith, callWithOptions = ALL_OPTIONS) {
  const args = Array.from({ length: 14 }, () => ({}));
  const callingSettings = new CallingSettings(...args, { defaultCallWith });
  callingSettings.callWithOptions = callWithOptions;
  return callingSettings;
}

describe('CallingSettings defaultCallWith', () => {
  test.each([
    ['browser', 'callingOptions-browser'],
    ['jupiter', 'callingOptions-jupiter'],
    ['softphone', 'callingOptions-softphone'],
    ['ringout', 'callingOptions-ringout'],
  ])('starts a first login on %s', (defaultCallWith, callWith) => {
    const callingSettings = createCallingSettings(defaultCallWith);

    callingSettings._handleFirstTimeLogin();

    expect(callingSettings.callWith).toBe(callWith);
    expect(callingSettings.timestamp).toBe(1);
  });

  test('keeps the first option when the account does not offer the default', () => {
    const callingSettings = createCallingSettings('browser', [
      'callingOptions-softphone',
      'callingOptions-ringout',
    ]);

    callingSettings._handleFirstTimeLogin();

    expect(callingSettings.callWith).toBe('callingOptions-softphone');
  });

  test.each([undefined, '', 'phone', 'toString'])(
    'keeps the first option for %p',
    (defaultCallWith) => {
      const callingSettings = createCallingSettings(defaultCallWith);

      callingSettings._handleFirstTimeLogin();

      expect(callingSettings.defaultCallWith).toBeUndefined();
      expect(callingSettings.callWith).toBe('callingOptions-browser');
    },
  );

  test('keeps what the user picked after the first login', () => {
    const callingSettings = createCallingSettings('ringout');
    callingSettings.data = {
      callWith: 'callingOptions-browser',
      timestamp: 100,
    };

    callingSettings._handleFirstTimeLogin();

    expect(callingSettings.callWith).toBe('callingOptions-browser');
    expect(callingSettings.timestamp).toBe(100);
  });
});
