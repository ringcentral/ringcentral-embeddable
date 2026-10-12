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
jest.mock('@ringcentral-integration/micro-core/src/app/components', () => ({
  AppHeaderNav: () => null,
}));
jest.mock('@ringcentral-integration/micro-core/src/app/hooks', () => ({
  useLocale: () => ({ t: (key) => key }),
}));
jest.mock('@ringcentral-integration/micro-phone/src/app/views/DialerView/i18n', () => ({
  __esModule: true,
  default: {},
}));
jest.mock('../../src/app/services/RingCX/i18n', () => ({
  t: (key) => key,
}));
jest.mock('../../src/app/services/RingCX', () => ({
  RingCX: class RingCX {},
}));
jest.mock('../../src/app/views/DialerView/DialerPage', () => ({
  DialerPage: () => null,
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

    async call(params) {
      this.events.push(['call', params]);
    }

    async onCallButtonClick(options) {
      this.events.push(['onCallButtonClick', options]);
      return true;
    }
  },
}));
jest.mock('@ringcentral-integration/next-core', () => ({
  PortManager: class PortManager {},
  injectable: () => (target) => target,
  optional: () => () => {},
  useConnector: (fn) => fn(),
  dynamic: () => () => {},
}));
jest.mock('../../src/app/services/DoNotContact', () => ({
  DoNotContact: class DoNotContact {},
}));
jest.mock('../../src/app/services/MatchedContactSelection', () => ({
  MatchedContactSelection: class MatchedContactSelection {},
}));

const { DialerView } = require('../../src/app/views/DialerView/Dialer.view');

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

  describe('matched-contact hand-off', () => {
    const createView = (recipient = null) => {
      const events = [];
      const view = Object.assign(Object.create(DialerView.prototype), {
        events,
        recipient,
        _matchedContactSelection: {
          setPendingOutbound: jest.fn(async (pending) => {
            events.push(['setPendingOutbound', pending]);
          }),
        },
      });
      return { events, view };
    };

    const CONTACT = {
      id: 'contact-1',
      name: 'Ada Lovelace',
      phoneNumber: '+16505550100',
      type: 'personal',
    };

    test('hands a contact picked in the search on to the new call', async () => {
      const { events, view } = createView();

      await view.call({ recipient: CONTACT });

      // Before the call, so the connecting page already has the pick.
      expect(events).toEqual([
        [
          'setPendingOutbound',
          { entityId: 'contact-1', phoneNumber: '+16505550100' },
        ],
        ['call', { recipient: CONTACT }],
      ]);
    });

    test.each([
      ['a typed number', { phoneNumber: '6505550100', freeSolo: true }],
      // Call history and conversations build a recipient without an id and
      // hand their own pick off first, which must survive.
      ['a record recipient', { phoneNumber: '+16505550100', name: 'Ada' }],
    ])('leaves the pending pick alone for %s', async (_label, recipient) => {
      const { events, view } = createView();

      await view.call({ recipient });

      expect(events).toEqual([['call', { recipient }]]);
    });

    test('clears a stale pending pick when the keypad dials a typed number', async () => {
      const { events, view } = createView(null);

      await expect(view.onCallButtonClick({ fromNumber: '+1' })).resolves.toBe(
        true,
      );

      expect(events).toEqual([
        ['setPendingOutbound', null],
        ['onCallButtonClick', { fromNumber: '+1' }],
      ]);
    });

    test('keeps the keypad pick for the call to hand off', async () => {
      const { events, view } = createView(CONTACT);

      await view.onCallButtonClick({});

      expect(events).toEqual([['onCallButtonClick', {}]]);
    });
  });
});
