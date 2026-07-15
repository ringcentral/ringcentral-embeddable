const { EventEmitter } = require('events');

jest.mock('@ringcentral-integration/commons/lib/di', () => ({
  Module: () => (target) => target,
}));

jest.mock('@ringcentral-integration/core', () => ({
  computed: () => () => {},
}));

jest.mock('@ringcentral-integration/commons/modules/GenericMeeting', () => ({
  GenericMeeting: class MockGenericMeeting {},
}));

jest.mock('@ringcentral-integration/commons/modules/Call', () => ({
  Call: class MockCall {
    async _makeCall(params) {
      this.baseMakeCallParams = params;
      return {
        base: true,
        params,
      };
    }
  },
}));

jest.mock('@ringcentral-integration/commons/modules/Ringout', () => ({
  Ringout: class MockRingout {
    constructor() {
      this.setRingoutStatus = jest.fn();
      this._monitorRingout = jest.fn(async () => {});
    }
  },
}));

jest.mock('@ringcentral-integration/commons/modules/Ringout/ringoutErrors', () => ({
  ringoutErrors: {
    pollingCancelled: 'pollingCancelled',
  },
}));

jest.mock('@ringcentral-integration/commons/modules/Ringout/ringoutStatus', () => ({
  ringoutStatus: {
    connecting: 'connecting',
    idle: 'idle',
  },
}));

jest.mock('@ringcentral-integration/commons/modules/CallMonitor', () => ({
  CallMonitor: class MockCallMonitor {},
}));

jest.mock('@ringcentral-integration/commons/modules/CompanyContacts', () => ({
  CompanyContacts: class MockCompanyContacts {},
}));

jest.mock('../../src/modules/ActiveCallControl/ActiveCallControl', () => ({
  ActiveCallControl: class MockActiveCallControlBase {
    constructor(deps) {
      const { EventEmitter: MockEventEmitter } = require('events');
      this._deps = deps;
      this.baseRcCallControl = new MockEventEmitter();
    }

    _initRcCallControl() {
      return this.baseRcCallControl;
    }
  },
}));

const { callingModes } = require('@ringcentral-integration/commons/modules/CallingSettings/callingModes');
const { GenericMeeting } = require('../../src/modules/GenericMeeting');
const { Call } = require('../../src/modules/Call');
const { Ringout } = require('../../src/modules/Ringout');
const { ActiveCallControl } = require('../../src/modules/ActiveCallControl');
const { CallMonitor } = require('../../src/modules/CallMonitor');
const { CompanyContacts } = require('../../src/modules/CompanyContacts');

function setMeetingMode(instance, { isRCM, isRCV }) {
  Object.defineProperties(instance, {
    isRCM: {
      configurable: true,
      value: isRCM,
    },
    isRCV: {
      configurable: true,
      value: isRCV,
    },
  });
}

function createGenericMeeting() {
  const meeting = {
    cleanHistoryMeetings: jest.fn(async () => 'clean-rcm'),
    createInstantMeeting: jest.fn(async () => 'instant-rcm'),
    fetchHistoryMeetings: jest.fn(async () => 'history-rcm'),
    fetchUpcomingMeetings: jest.fn(async () => 'upcoming-rcm'),
    historyMeetings: ['rcm-history'],
    upcomingMeetings: ['rcm-upcoming'],
  };
  const rcVideo = {
    addThirdPartyProvider: jest.fn(async () => 'provider-added'),
    cleanHistoryMeetings: jest.fn(async () => 'clean-rcv'),
    createInstantMeeting: jest.fn(async () => 'instant-rcv'),
    fetchHistoryMeetings: jest.fn(async () => 'history-rcv'),
    fetchUpcomingMeetings: jest.fn(async () => 'upcoming-rcv'),
    historyMeetings: ['rcv-history'],
    upcomingMeetings: ['rcv-upcoming'],
  };
  const instance = Object.create(GenericMeeting.prototype);
  instance._deps = {
    meeting,
    rcVideo,
  };
  return {
    instance,
    meeting,
    rcVideo,
  };
}

function createRingout(overrides = {}) {
  const post = jest.fn(async () => ({ id: 'ringout-1' }));
  const ringout = new Ringout();
  Object.assign(ringout, {
    _deps: {
      client: {
        account: () => ({
          extension: () => ({
            ringOut: () => ({
              post,
            }),
          }),
        }),
      },
      contactMatcher: {
        forceMatchBatchNumbers: jest.fn(async () => {}),
      },
    },
    ready: true,
    ...overrides,
  });
  return {
    post,
    ringout,
  };
}

function createTelephonySession(overrides = {}) {
  const session = new EventEmitter();
  const on = session.on.bind(session);
  const removeListener = session.removeListener.bind(session);
  Object.assign(session, {
    data: {
      id: 'session-1',
    },
    on: jest.fn((...args) => on(...args)),
    party: {
      status: {
        code: 'Answered',
        reason: '',
      },
    },
    removeListener: jest.fn((...args) => removeListener(...args)),
    ...overrides,
  });
  return session;
}

test('delegates generic meeting calls to the active meeting implementation', async () => {
  const { instance, meeting, rcVideo } = createGenericMeeting();
  setMeetingMode(instance, {
    isRCM: true,
    isRCV: false,
  });
  await expect(instance.fetchHistoryMeetings({ page: 1 })).resolves.toBe('history-rcm');
  await expect(instance.cleanHistoryMeetings()).resolves.toBe('clean-rcm');
  await expect(instance.fetchUpcomingMeetings()).resolves.toBe('upcoming-rcm');
  await expect(instance.createInstantMeeting()).resolves.toBe('instant-rcm');
  expect(instance.historyMeetings).toEqual(['rcm-history']);
  expect(instance.upcomingMeetings).toEqual(['rcm-upcoming']);
  expect(meeting.fetchHistoryMeetings).toHaveBeenCalledWith({ page: 1 });
  setMeetingMode(instance, {
    isRCM: false,
    isRCV: true,
  });
  await expect(instance.fetchHistoryMeetings({ page: 2 })).resolves.toBe('history-rcv');
  await expect(instance.cleanHistoryMeetings()).resolves.toBe('clean-rcv');
  await expect(instance.fetchUpcomingMeetings()).resolves.toBe('upcoming-rcv');
  await expect(instance.createInstantMeeting()).resolves.toBe('instant-rcv');
  await expect(instance.addThirdPartyProvider({ provider: 'zoom' })).resolves.toBe('provider-added');
  expect(instance.historyMeetings).toEqual(['rcv-history']);
  expect(instance.upcomingMeetings).toEqual(['rcv-upcoming']);
  expect(rcVideo.addThirdPartyProvider).toHaveBeenCalledWith({ provider: 'zoom' });
  setMeetingMode(instance, {
    isRCM: false,
    isRCV: false,
  });
  await expect(instance.fetchHistoryMeetings()).resolves.toBeNull();
  await expect(instance.cleanHistoryMeetings()).resolves.toBeNull();
  await expect(instance.fetchUpcomingMeetings()).resolves.toBeNull();
  await expect(instance.createInstantMeeting()).resolves.toBeNull();
  expect(instance.historyMeetings).toBeNull();
  expect(instance.upcomingMeetings).toBeNull();
});

test('routes calls through ringout caller-id mode or base call mode', async () => {
  const ringout = {
    makeCall: jest.fn(async () => 'ringout-call'),
  };
  const call = new Call();
  call._deps = {
    callingSettings: {
      callingMode: callingModes.ringout,
      fromNumber: '+16505550100',
      isRingoutCallerIdEnabled: true,
      ringoutPrompt: true,
    },
    ringout,
  };
  await expect(call._makeCall({
    fromNumber: '+16505550101',
    toNumber: '+16505550123*123',
  })).resolves.toBe('ringout-call');
  expect(ringout.makeCall).toHaveBeenCalledWith({
    callerId: '+16505550100',
    fromNumber: '+16505550101',
    prompt: true,
    toNumber: '+16505550123',
  });
  call._deps.callingSettings.fromNumber = 'anonymous';
  await call._makeCall({
    fromNumber: '+16505550101',
    toNumber: '',
  });
  expect(ringout.makeCall).toHaveBeenLastCalledWith(expect.objectContaining({
    callerId: undefined,
    toNumber: '',
  }));
  call._deps.callingSettings.isRingoutCallerIdEnabled = false;
  await expect(call._makeCall({
    callingMode: 'browser',
    fromNumber: '+1',
    toNumber: '+2',
  })).resolves.toEqual({
    base: true,
    params: {
      callingMode: 'browser',
      fromNumber: '+1',
      toNumber: '+2',
    },
  });
});

test('posts ringout calls, monitors status, and handles cancellation/errors', async () => {
  jest.spyOn(Date, 'now').mockReturnValue(123456);
  const { post, ringout } = createRingout();
  await ringout.makeCall({
    callerId: '+16505550199',
    fromNumber: '+16505550100',
    prompt: false,
    toNumber: '+16505550123',
  });
  expect(ringout.setRingoutStatus).toHaveBeenNthCalledWith(1, 'connecting');
  expect(ringout.setRingoutStatus).toHaveBeenLastCalledWith('idle');
  expect(post).toHaveBeenCalledWith({
    callerId: { phoneNumber: '+16505550199' },
    from: { phoneNumber: '+16505550100' },
    playPrompt: false,
    to: { phoneNumber: '+16505550123' },
  });
  expect(ringout._deps.contactMatcher.forceMatchBatchNumbers).toHaveBeenCalledWith({
    phoneNumbers: ['+16505550100', '+16505550123'],
  });
  expect(ringout._monitorRingout).toHaveBeenCalledWith('ringout-1', 123456);
  const withoutMatcher = createRingout({
    _deps: {
      client: ringout._deps.client,
    },
  }).ringout;
  await withoutMatcher.makeCall({
    fromNumber: '+1',
    prompt: true,
    toNumber: '+2',
  });
  expect(withoutMatcher.setRingoutStatus).toHaveBeenCalledWith('idle');
  const cancelled = createRingout().ringout;
  cancelled._monitorRingout.mockRejectedValueOnce(new Error('pollingCancelled'));
  await expect(cancelled.makeCall({
    fromNumber: '+1',
    prompt: true,
    toNumber: '+2',
  })).resolves.toBeUndefined();
  const failed = createRingout().ringout;
  failed._monitorRingout.mockRejectedValueOnce(new Error('network failed'));
  await expect(failed.makeCall({
    fromNumber: '+1',
    prompt: true,
    toNumber: '+2',
  })).rejects.toThrow('network failed');
  const notReady = createRingout({ ready: false }).ringout;
  await expect(notReady.makeCall({
    fromNumber: '+1',
    prompt: true,
    toNumber: '+2',
  })).resolves.toBeUndefined();
  expect(notReady.setRingoutStatus).not.toHaveBeenCalled();
  Date.now.mockRestore();
});

test('wires active call control telephony session update handlers', () => {
  const control = new ActiveCallControl({ client: 'deps' });
  const handler = jest.fn();
  control.onTelephonySessionUpdated(handler);
  control._updateTelephonySessionsHandler(null);
  expect(handler).toHaveBeenCalledWith(null);
  const session = createTelephonySession();
  control._newTelephonySessionHandler(session);
  expect(handler).toHaveBeenCalledWith({ id: 'session-1' });
  expect(session.on).toHaveBeenCalledWith('status', expect.any(Function));
  expect(session.on).toHaveBeenCalledWith('muted', expect.any(Function));
  expect(session.on).toHaveBeenCalledWith('recordings', expect.any(Function));
  session.party.status = {
    code: 'Disconnected',
    reason: 'Pickup',
  };
  session.emit('status');
  expect(session.removeListener).not.toHaveBeenCalledWith('status', session.__updateTelephonySessionsHandler__);
  session.party.status.reason = 'CallSwitch';
  session.emit('muted');
  expect(session.removeListener).not.toHaveBeenCalledWith('muted', session.__updateTelephonySessionsHandler__);
  const currentHandler = session.__updateTelephonySessionsHandler__;
  session.party.status.reason = 'Hangup';
  session.emit('recordings');
  expect(session.removeListener).toHaveBeenCalledWith('status', currentHandler);
  expect(session.removeListener).toHaveBeenCalledWith('muted', currentHandler);
  expect(session.removeListener).toHaveBeenCalledWith('recordings', currentHandler);
  expect(session.__updateTelephonySessionsHandler__).toBeNull();
  const previousHandler = jest.fn();
  const nextSession = createTelephonySession({
    __updateTelephonySessionsHandler__: previousHandler,
  });
  control._newTelephonySessionHandler(nextSession);
  expect(nextSession.removeListener).toHaveBeenCalledWith('status', previousHandler);
  expect(nextSession.removeListener).toHaveBeenCalledWith('muted', previousHandler);
  expect(nextSession.removeListener).toHaveBeenCalledWith('recordings', previousHandler);
  const rcCallControl = control._initRcCallControl();
  const emittedSession = createTelephonySession();
  rcCallControl.emit('new', emittedSession);
  expect(emittedSession.on).toHaveBeenCalledWith('status', expect.any(Function));
});

test('normalizes call monitor matches and persists selected matched entity', () => {
  const callMonitor = Object.create(CallMonitor.prototype);
  Object.assign(callMonitor, {
    _deps: {
      activityMatcher: {
        dataMapping: {
          sessionA: [{ id: 'activity-1' }],
        },
      },
      contactMatcher: {
        callMatched: {
          telephonyA: { id: 'selected-contact' },
        },
        dataMapping: {
          '+16505550100': [{ id: 'from-contact' }],
          '+16505550123': [{ id: 'to-contact' }],
        },
        setCallMatched: jest.fn(),
      },
    },
    normalizedCalls: [{
      from: { phoneNumber: '+16505550100' },
      sessionId: 'sessionA',
      telephonySessionId: 'telephonyA',
      to: { phoneNumber: '+16505550123' },
    }, {
      from: null,
      sessionId: 'sessionB',
      telephonySessionId: 'telephonyB',
      to: null,
    }],
  });
  expect(callMonitor.allCalls).toEqual([
    expect.objectContaining({
      activityMatches: [{ id: 'activity-1' }],
      fromMatches: [{ id: 'from-contact' }],
      toMatches: [{ id: 'to-contact' }],
      toNumberEntity: { id: 'selected-contact' },
    }),
    expect.objectContaining({
      activityMatches: [],
      fromMatches: [],
      toMatches: [],
      toNumberEntity: undefined,
    }),
  ]);
  callMonitor.setMatchedData({
    sessionId: 'sessionA',
    toEntityId: 'contact-2',
  });
  expect(callMonitor._deps.contactMatcher.setCallMatched).toHaveBeenCalledWith({
    telephonySessionId: 'telephonyA',
    toEntityId: 'contact-2',
  });
  callMonitor.setMatchedData({
    sessionId: 'missing',
    toEntityId: 'contact-3',
  });
  expect(callMonitor._deps.contactMatcher.setCallMatched).toHaveBeenCalledTimes(1);
  const noMatcher = Object.create(CallMonitor.prototype);
  Object.assign(noMatcher, {
    _deps: {},
    normalizedCalls: [{ sessionId: 'sessionC' }],
  });
  expect(noMatcher.allCalls[0]).toEqual(expect.objectContaining({
    activityMatches: [],
    fromMatches: [],
    toMatches: [],
  }));
  expect(() => noMatcher.setMatchedData({
    sessionId: 'sessionC',
    toEntityId: 'contact-4',
  })).not.toThrow();
});

test('applies company contact subscription create update delete events only when active', () => {
  const companyContacts = Object.create(CompanyContacts.prototype);
  Object.assign(companyContacts, {
    _deps: {
      tabManager: {
        active: true,
      },
    },
    _source: {
      disableCache: false,
    },
    data: [{ id: 'old', name: 'Old' }],
    ready: true,
    setCompanyContactsData: jest.fn(function setCompanyContactsData(data) {
      this.data = data;
    }),
  });
  companyContacts._handleSubscription({
    body: {
      contacts: [
        { eventType: 'Create', id: 'new', name: 'New', newEtag: 'new-etag', oldEtag: 'old-etag' },
        { eventType: 'Update', id: 'old', name: 'Updated' },
        { eventType: 'Delete', id: 'missing', name: 'Missing' },
      ],
    },
    event: '/restapi/v1.0/account/~/directory/contacts',
  });
  expect(companyContacts.setCompanyContactsData).toHaveBeenCalledWith([
    { id: 'new', name: 'New' },
    { id: 'old', name: 'Updated' },
  ]);
  companyContacts._deps.tabManager.active = false;
  companyContacts._source.disableCache = false;
  companyContacts._handleSubscription({
    body: {
      contacts: [{ eventType: 'Create', id: 'inactive', name: 'Inactive' }],
    },
    event: '/restapi/v1.0/account/~/directory/contacts',
  });
  expect(companyContacts.setCompanyContactsData).toHaveBeenCalledTimes(1);
  companyContacts._source.disableCache = true;
  companyContacts._handleSubscription({
    body: {
      contacts: [{ eventType: 'Delete', id: 'new', name: 'New' }],
    },
    event: '/restapi/v1.0/account/~/directory/contacts',
  });
  expect(companyContacts.setCompanyContactsData).toHaveBeenLastCalledWith([
    { id: 'old', name: 'Updated' },
  ]);
  companyContacts.ready = false;
  companyContacts._handleSubscription({
    body: {
      contacts: [{ eventType: 'Create', id: 'ignored', name: 'Ignored' }],
    },
    event: '/restapi/v1.0/account/~/directory/contacts',
  });
  companyContacts.ready = true;
  companyContacts._handleSubscription({
    body: {},
    event: '/restapi/v1.0/account/~/directory/contacts',
  });
  companyContacts._handleSubscription({
    body: {
      contacts: [{ eventType: 'Create', id: 'ignored', name: 'Ignored' }],
    },
    event: '/restapi/v1.0/account/~/directory/other',
  });
  expect(companyContacts.setCompanyContactsData).toHaveBeenCalledTimes(2);
});
