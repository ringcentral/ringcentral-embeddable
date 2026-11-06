/** @jest-environment jsdom */
jest.mock('mixpanel-browser', () => ({
  _$$track: jest.fn(),
  add_group: jest.fn(),
  identify: jest.fn(),
  init: jest.fn(),
  people: {
    set: jest.fn(),
  },
  set_group: jest.fn(),
  track: jest.fn(),
  track_pageview: jest.fn(),
}));

jest.mock('@ringcentral-integration/core', () => ({
  ...jest.requireActual('@ringcentral-integration/core'),
  watch: jest.fn(),
}));

const mixpanel = require('mixpanel-browser');
const { notReadyModulesKey } = require('@ringcentral-integration/core/lib/RcModule');
const { watch } = require('@ringcentral-integration/core');
const { Analytics } = require('../../src/modules/Analytics');
const { AnalyticsBrowser } = require('../../src/modules/Analytics/AnalyticsBrowser');

function createAnalytics({ devices, hasRingCXPermission } = {}) {
  const deps = {
    analyticsOptions: {
      analyticsKey: 'mixpanel-token',
      appVersion: '1.0.0',
      enableExternalAnalytics: true,
    },
    auth: {
      ownerId: 'owner-1',
    },
    brand: {
      defaultConfig: {
        appName: 'Embeddable',
        code: 'rc',
      },
    },
    environment: {
      environmentName: 'Production',
    },
  };
  if (devices) {
    deps.extensionDevice = { devices };
  }
  if (hasRingCXPermission !== undefined) {
    deps.appFeatures = { hasRingCXPermission };
  }
  return { analytics: new Analytics(deps), deps };
}

/** Starts the module and returns the user type watcher callback. */
function startUserTypeWatch(analytics) {
  analytics.onInitOnce();
  const [, getUserType, onUserTypeChange] = watch.mock.calls.find(
    ([target]) => target === analytics,
  );
  return { getUserType, onUserTypeChange };
}

describe('Analytics account id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(window.parent, 'postMessage').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sends the raw and hashed account ids to the profile and groups', () => {
    const { analytics } = createAnalytics();

    analytics.identify({ accountId: 372332026, userId: 'user-1' });

    const [profile] = mixpanel.people.set.mock.calls[0];
    expect(profile).toEqual({
      rcAccountId: expect.any(String),
      accountId: '372332026',
      environment: 'Production',
    });
    expect(profile.rcAccountId).not.toBe('372332026');
    for (const groupCall of [mixpanel.add_group, mixpanel.set_group]) {
      expect(groupCall).toHaveBeenCalledTimes(2);
      expect(groupCall).toHaveBeenCalledWith('rcAccountId', profile.rcAccountId);
      expect(groupCall).toHaveBeenCalledWith('accountId', '372332026');
    }
  });

  it('has no account ids before identify', () => {
    const { analytics } = createAnalytics();

    expect(analytics.trackProps).toMatchObject({
      accountId: null,
      rcAccountId: null,
    });
  });

  it('does not link account groups without an account id', () => {
    const { analytics } = createAnalytics();

    analytics.identify({ userId: 'user-1' });

    expect(mixpanel.add_group).not.toHaveBeenCalled();
    expect(analytics.trackProps.accountId).toBeNull();
  });

  it('sends the raw account id with events but not to the host', () => {
    const { analytics } = createAnalytics();
    analytics.identify({ accountId: 'account-1', userId: 'user-1' });

    analytics.track('Some event', { foo: 'bar' });

    expect(mixpanel._$$track).toHaveBeenCalledWith(
      'Some event',
      expect.objectContaining({
        accountId: 'account-1',
        rcAccountId: expect.any(String),
        foo: 'bar',
      }),
    );
    expect(window.parent.postMessage).toHaveBeenCalledWith({
      type: 'rc-analytics-track',
      event: 'Some event',
      properties: { foo: 'bar' },
    }, '*');
  });
});

describe('Analytics user type', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    ['EX+CX', [{ id: 'device-1' }], true],
    ['EX', [{ id: 'device-1' }], false],
    ['CX', [], true],
    [null, [], false],
  ])(
    'reports %s from digital lines and the RingCX permission',
    (userType, devices, hasRingCXPermission) => {
      const { analytics } = createAnalytics({ devices, hasRingCXPermission });

      expect(analytics.userType).toBe(userType);
      expect(analytics.trackProps.userType).toBe(userType);
    },
  );

  it('is null before devices and features are available', () => {
    expect(createAnalytics().analytics.userType).toBeNull();
  });

  it('reports CX while devices are not available yet', () => {
    expect(
      createAnalytics({ hasRingCXPermission: true }).analytics.userType,
    ).toBe('CX');
  });

  it('leaves the user type off the profile until it is known', () => {
    const { analytics } = createAnalytics({ devices: [], hasRingCXPermission: false });

    analytics.identify({ accountId: 'account-1', userId: 'user-1' });

    expect(mixpanel.people.set).toHaveBeenCalledWith(
      expect.not.objectContaining({ userType: expect.anything() }),
    );
  });

  it('includes a known user type in the identify profile', () => {
    const { analytics } = createAnalytics({
      devices: [{ id: 'device-1' }],
      hasRingCXPermission: true,
    });

    analytics.identify({ accountId: 'account-1', userId: 'user-1' });

    expect(mixpanel.people.set).toHaveBeenCalledWith(
      expect.objectContaining({ userType: 'EX+CX' }),
    );
  });

  it('updates the profile when the user type changes after identify', () => {
    const { analytics, deps } = createAnalytics({
      devices: [],
      hasRingCXPermission: false,
    });
    const { getUserType, onUserTypeChange } = startUserTypeWatch(analytics);

    deps.appFeatures.hasRingCXPermission = true;
    onUserTypeChange(getUserType());
    expect(mixpanel.people.set).not.toHaveBeenCalled();

    analytics.identify({ accountId: 'account-1', userId: 'user-1' });
    mixpanel.people.set.mockClear();
    deps.extensionDevice.devices = [{ id: 'device-1' }];
    onUserTypeChange(getUserType());

    expect(mixpanel.people.set).toHaveBeenCalledTimes(1);
    expect(mixpanel.people.set).toHaveBeenCalledWith({ userType: 'EX+CX' });
  });

  it('does not wait for devices and features to be ready', () => {
    const { analytics, deps } = createAnalytics({
      devices: [],
      hasRingCXPermission: false,
    });
    deps.extensionDevice.ready = false;
    deps.appFeatures.ready = false;

    expect(analytics[notReadyModulesKey]).not.toContain(deps.extensionDevice);
    expect(analytics[notReadyModulesKey]).not.toContain(deps.appFeatures);
  });

  it('does not clear the profile user type when it becomes unknown', () => {
    const { analytics } = createAnalytics();
    const { onUserTypeChange } = startUserTypeWatch(analytics);
    analytics.identify({ accountId: 'account-1', userId: 'user-1' });
    mixpanel.people.set.mockClear();

    onUserTypeChange(null);

    expect(mixpanel.people.set).not.toHaveBeenCalled();
  });
});

describe('AnalyticsBrowser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('links a group by key and sets user properties', () => {
    const browser = new AnalyticsBrowser('token');

    browser.group('accountId', 'account-1');
    browser.setUserProperties({ userType: 'EX' });

    expect(mixpanel.add_group).toHaveBeenCalledWith('accountId', 'account-1');
    expect(mixpanel.set_group).toHaveBeenCalledWith('accountId', 'account-1');
    expect(mixpanel.people.set).toHaveBeenCalledWith({ userType: 'EX' });
  });

  it('skips groups and user properties without mixpanel', () => {
    const browser = new AnalyticsBrowser('token');
    browser._mixpanel = null;

    browser.group('accountId', 'account-1');
    browser.setUserProperties({ userType: 'EX' });

    expect(mixpanel.add_group).not.toHaveBeenCalled();
    expect(mixpanel.people.set).not.toHaveBeenCalled();
  });
});
