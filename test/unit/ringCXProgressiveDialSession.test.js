// Session, lead and call pieces the progressive dialer builds on: which dial
// group is progressive and its delay, the next pending lead, dialing a lead
// with no destination, the persistent offhook line, and the agent's home tab
// after a lead call.

jest.mock('@ringcentral-integration/micro-core/src/app/plugins', () => ({
  BlockPlugin: class {},
}));
jest.mock('../../src/ringcx/services/Analytics/track', () => ({
  track: () => (_target, _key, descriptor) => descriptor,
}));
jest.mock('../../src/ringcx/views/CxMultiLoginView', () => ({
  CxMultiLoginView: class {},
}));
jest.mock('../../src/ringcx/services/CxAgentSession/i18n', () => ({
  __esModule: true,
  default: { getString: (key) => key },
  t: (key, params) => (params ? `${key} ${JSON.stringify(params)}` : key),
}));
jest.mock('../../src/ringcx/services/CxAuth', () => ({ CxAuth: class {} }));
jest.mock('../../src/ringcx/services/CxClient', () => ({ CxClient: class {} }));
jest.mock('../../src/ringcx/services/CxPresence', () => ({
  CxPresence: class {},
}));
jest.mock('../../src/ringcx/services/CxSettings', () => ({
  CxSettings: class {},
}));
jest.mock('../../src/ringcx/services/CxSubscription', () => ({
  CxSubscription: class {},
}));
jest.mock('../../src/ringcx/services/CxWorkingState', () => ({
  CxWorkingState: class {},
}));
jest.mock('../../src/ringcx/services/CxIntegratedSoftphone', () => ({
  CxIntegratedSoftphone: class {},
}));

import { EventEmitter } from 'events';

import { CxAgentSession } from '../../src/ringcx/services/CxAgentSession/CxAgentSession';
import { CxCall } from '../../src/ringcx/services/CxCall/CxCall';
import { CxCallbackTypes } from '../../src/ringcx/services/CxClient/enums';
import { CxLeads } from '../../src/ringcx/services/CxLeads/CxLeads';
import { parseProgressiveCallDelay } from '../../src/ringcx/utils/parseProgressiveCallDelay';

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function createSubscription() {
  const listeners = {};
  return {
    listeners,
    subscribe: jest.fn(function subscribe(type, listener) {
      listeners[type] = listener;
      return this;
    }),
  };
}

describe('parseProgressiveCallDelay', () => {
  test.each([
    ['10', 10],
    [15, 15],
    ['120', 120],
    ['300', 120],
    ['0', 1],
    ['-5', 1],
    ['', 1],
    ['abc', 1],
    [undefined, 1],
    [null, 1],
  ])('reads %p as %p seconds', (value, seconds) => {
    expect(parseProgressiveCallDelay(value)).toBe(seconds);
  });
});

describe('CxAgentSession progressive dial group', () => {
  function createSession({ dialGroupId = '', groups = [] } = {}) {
    const toast = { info: jest.fn(), success: jest.fn(), danger: jest.fn() };
    const cxSubscription = createSubscription();
    const session = new CxAgentSession(
      {},
      {
        onceLoginSuccess: jest.fn(),
        onLoginSuccess: jest.fn(),
        beforeAgentLogout: jest.fn(),
        agentPermissions: { allowOutbound: true },
        agentConfig: {
          outboundSettings: { availableOutdialGroups: groups },
        },
      },
      {},
      toast,
      {},
      {},
      { enable: jest.fn() },
      { shared: false },
      {},
      {},
      cxSubscription,
    );
    session.dialGroupId = dialGroupId;
    return { session, toast, cxSubscription };
  }

  const groups = [
    {
      dialGroupId: 'preview',
      dialGroupName: 'Preview',
      dialMode: 'PREVIEW',
      progressiveEnabled: false,
    },
    {
      dialGroupId: 'progressive',
      dialGroupName: 'Progressive',
      dialMode: 'PREVIEW',
      progressiveEnabled: true,
      progressiveCallDelay: '15',
    },
    {
      dialGroupId: 'predictive',
      dialGroupName: 'Predictive',
      dialMode: 'PREDICTIVE',
      progressiveEnabled: true,
    },
  ];

  test('maps the progressive settings of each dial group', () => {
    const { session } = createSession({ groups });

    expect(session.dialGroups).toEqual([
      expect.objectContaining({
        groupId: '',
        progressiveEnabled: false,
        progressiveCallDelay: 0,
      }),
      expect.objectContaining({
        groupId: 'preview',
        progressiveEnabled: false,
        progressiveCallDelay: 1,
      }),
      expect.objectContaining({
        groupId: 'progressive',
        progressiveEnabled: true,
        progressiveCallDelay: 15,
      }),
      expect.objectContaining({
        groupId: 'predictive',
        progressiveEnabled: true,
      }),
    ]);
  });

  test.each([
    ['progressive', 'PREVIEW', true, 15000],
    ['preview', 'PREVIEW', false, 1000],
    ['predictive', 'PREDICTIVE', false, 1000],
    ['', '', false, 1000],
  ])(
    'group %p: dial mode %p, progressive %p, delay %p ms',
    (dialGroupId, dialMode, isProgressive, delayMs) => {
      const { session } = createSession({ dialGroupId, groups });

      expect(session.currentDialMode).toBe(dialMode);
      expect(session.isProgressiveDialMode).toBe(isProgressive);
      expect(session.progressiveCallDelayMs).toBe(delayMs);
    },
  );

  test('only tells the agent when an admin moves them to another dial group', () => {
    const { session, toast, cxSubscription } = createSession({
      dialGroupId: 'progressive',
      groups,
    });

    cxSubscription.listeners[CxCallbackTypes.DIAL_GROUP_CHANGE]({
      dialGroupId: 'preview',
      dialGroupName: 'Preview',
    });

    expect(toast.info).toHaveBeenCalledWith({
      message: 'dialGroupUpdated {"dialGroupName":"Preview"}',
    });
    // As in Agent One, the session keeps its dial group until it is updated.
    expect(session.dialGroupId).toBe('progressive');
    expect(session.isProgressiveDialMode).toBe(true);
  });
});

describe('CxLeads progressive helpers', () => {
  function createLeads() {
    const cxSubscription = createSubscription();
    const cxCall = { previewDial: jest.fn(async () => true) };
    const leads = new CxLeads(
      {},
      { beforeAgentLogout: jest.fn() },
      cxSubscription,
      cxCall,
      { danger: jest.fn(), warning: jest.fn() },
      { enable: jest.fn() },
      { shared: false },
    );
    const onLeadEvent = jest.fn();
    leads.onLeadEvent(onLeadEvent);
    const previewLeadState = (data) =>
      cxSubscription.listeners[CxCallbackTypes.PREVIEW_LEAD_STATE](data);
    return { leads, cxCall, onLeadEvent, previewLeadState };
  }

  const lead = (id, props = {}) => ({
    leadId: `lead-${id}`,
    requestId: `request-${id}`,
    leadState: 'PENDING',
    destination: '6505550100',
    ...props,
  });

  test('the next pending lead skips completed leads and follows lead state updates', () => {
    const { leads, previewLeadState } = createLeads();
    leads.leads = [
      lead(1, { completed: true }),
      lead(2, { leadState: 'EXPIRED' }),
      lead(3),
      lead(4),
    ];

    expect(leads.nextPendingLead.requestId).toBe('request-3');

    previewLeadState({ requestId: 'request-3', leadState: 'DIALING' });
    expect(leads.getLeadState(leads.leads[2])).toBe('DIALING');
    expect(leads.nextPendingLead.requestId).toBe('request-4');

    previewLeadState({ requestId: 'request-4', leadState: 'NOANSWER' });
    expect(leads.nextPendingLead).toBeUndefined();
  });

  test('dials a lead with no destination and lets the server pick the number', async () => {
    const { leads, cxCall, onLeadEvent, previewLeadState } = createLeads();
    leads.leads = [lead(1)];
    const [target] = leads.leads;

    await expect(leads.dialLead(target)).resolves.toBe(true);

    expect(cxCall.previewDial).toHaveBeenCalledWith('request-1', '', '');
    expect(target.dialedList).toBeUndefined();
    expect(onLeadEvent).toHaveBeenCalledWith({
      action: 'dialed',
      lead: target,
      destination: undefined,
    });

    // The lead state notification reports the number the server dialed.
    previewLeadState({
      requestId: 'request-1',
      leadState: 'DIALING',
      number: '6505550100',
    });
    previewLeadState({
      requestId: 'request-1',
      leadState: 'ANSWER',
      number: '6505550100',
    });
    expect(target.dialedList).toEqual(['6505550100']);
  });

  test('records the destination of a lead dialed with one', async () => {
    const { leads, cxCall, onLeadEvent } = createLeads();
    leads.leads = [lead(1)];
    const [target] = leads.leads;

    await leads.dialLead(target, '+16505550100');

    expect(cxCall.previewDial).toHaveBeenCalledWith(
      'request-1',
      '+16505550100',
      '+16505550100',
    );
    expect(target.dialedList).toEqual(['+16505550100']);
    expect(onLeadEvent).toHaveBeenCalledWith(
      expect.objectContaining({ destination: '+16505550100' }),
    );
  });

  test('reports a dial that was not sent', async () => {
    const { leads, cxCall, onLeadEvent } = createLeads();
    leads.leads = [lead(1)];
    cxCall.previewDial.mockResolvedValue(false);

    await expect(leads.dialLead(leads.leads[0])).resolves.toBe(false);

    expect(onLeadEvent).not.toHaveBeenCalled();
  });
});

describe('CxCall progressive support', () => {
  function createCall({ isOffhook = false, dialMode = 'PREVIEW' } = {}) {
    const cxSubscription = createSubscription();
    const evPresenceEvents = new EventEmitter();
    const cxSettings = { isOffhook, isManualOffhook: false };
    const cxPresence = {
      calls: [],
      callsMapping: {},
      dialoutStatus: 'idle',
      evPresenceEvents,
      setCurrentCallUii: jest.fn(),
      setDialoutStatus: jest.fn((status) => {
        cxPresence.dialoutStatus = status;
      }),
      setIsManualOffhook: jest.fn(async (value) => {
        cxSettings.isManualOffhook = value;
      }),
      setOffhooking: jest.fn(async () => undefined),
    };
    const cxClient = {
      offhookInit: jest.fn(),
      offhookTerm: jest.fn(),
      previewDial: jest.fn(),
    };
    const cxAgentSession = {
      isIntegratedSoftphone: false,
      currentDialMode: dialMode,
    };
    const call = new CxCall(
      cxClient,
      { isEvLogged: true },
      cxSettings,
      cxPresence,
      cxAgentSession,
      {},
      cxSubscription,
      { isPendingDisposition: false },
      { danger: jest.fn(), info: jest.fn() },
      { enable: jest.fn() },
      { shared: false },
    );
    return {
      call,
      cxClient,
      cxSettings,
      cxPresence,
      cxAgentSession,
      evPresenceEvents,
      newCall: (data) => cxSubscription.listeners[CxCallbackTypes.NEW_CALL](data),
    };
  }

  test('connects the offhook line as a manual one, so calls do not end it', async () => {
    const { call, cxClient, cxSettings, cxPresence, evPresenceEvents } =
      createCall();

    const connecting = call.connectPersistentOffhook();
    await flush();
    expect(cxClient.offhookInit).toHaveBeenCalledTimes(1);
    expect(cxPresence.setOffhooking).toHaveBeenCalledWith(true);
    evPresenceEvents.emit(CxCallbackTypes.OFFHOOK_INIT, { status: 'OK' });

    await expect(connecting).resolves.toBe(true);
    expect(cxSettings.isManualOffhook).toBe(true);
  });

  test('keeps an offhook line that is already connected', async () => {
    const { call, cxClient, cxSettings } = createCall({ isOffhook: true });

    await expect(call.connectPersistentOffhook()).resolves.toBe(true);

    expect(cxClient.offhookInit).not.toHaveBeenCalled();
    expect(cxSettings.isManualOffhook).toBe(true);
  });

  test('resets the offhook flags when the line cannot be connected', async () => {
    const { call, cxSettings, cxPresence, evPresenceEvents } = createCall();

    const connecting = call.connectPersistentOffhook();
    await flush();
    evPresenceEvents.emit(CxCallbackTypes.OFFHOOK_INIT, { status: 'FAILURE' });

    await expect(connecting).resolves.toBe(false);
    expect(cxPresence.setOffhooking).toHaveBeenLastCalledWith(false);
    expect(cxSettings.isManualOffhook).toBe(false);
  });

  test.each([
    ['no call is live', [], 1],
    ['a call is live', [{ id: 'call' }], 0],
  ])('releasing the line ends it now when %s', async (_name, calls, terms) => {
    const { call, cxClient, cxSettings, cxPresence } = createCall({
      isOffhook: true,
    });
    cxSettings.isManualOffhook = true;
    cxPresence.calls = calls;

    await call.releasePersistentOffhook();

    expect(cxSettings.isManualOffhook).toBe(false);
    expect(cxClient.offhookTerm).toHaveBeenCalledTimes(terms);
  });

  test('a lead that is not reached sets the phone back to idle', () => {
    const { call, cxClient, cxPresence, cxSettings } = createCall({
      isOffhook: true,
    });
    const previewLeadState = (leadState) =>
      call.cxSubscription.listeners[CxCallbackTypes.PREVIEW_LEAD_STATE]({
        leadState,
      });
    cxPresence.dialoutStatus = 'dialing';

    previewLeadState('RINGING');
    expect(cxPresence.dialoutStatus).toBe('dialing');

    cxSettings.isManualOffhook = true;
    previewLeadState('NOANSWER');
    expect(cxPresence.dialoutStatus).toBe('idle');
    expect(cxClient.offhookTerm).not.toHaveBeenCalled();
  });

  test('goes back to Leads after a lead call and to Dialer after a manual or inbound one', async () => {
    const { call, cxAgentSession, newCall } = createCall({ isOffhook: true });
    expect(call.homeTabAfterCall).toBe('dialer');

    await call.previewDial('request-1', '', '');
    expect(call.isLeadCall).toBe(true);
    expect(call.homeTabAfterCall).toBe('leads');

    // The Leads tab is gone once the dial group is no longer a Preview one.
    cxAgentSession.currentDialMode = 'PREDICTIVE';
    expect(call.homeTabAfterCall).toBe('dialer');
    cxAgentSession.currentDialMode = 'PREVIEW';

    newCall({ callType: 'OUTBOUND' });
    expect(call.homeTabAfterCall).toBe('leads');
    newCall({ callType: 'INBOUND' });
    expect(call.homeTabAfterCall).toBe('dialer');

    await call.previewDial('request-2', '', '');
    call._prepareIntegratedSoftphone = jest.fn(async () => false);
    await call.dialout('6505550100');
    expect(call.homeTabAfterCall).toBe('dialer');
  });

  test('tells listeners about a manual outbound call', async () => {
    const { call } = createCall();
    const listener = jest.fn();
    const unregister = call.onManualDialout(listener);
    call._prepareIntegratedSoftphone = jest.fn(async () => false);

    await call.dialout('6505550100');
    unregister();
    await call.dialout('6505550100');

    expect(listener).toHaveBeenCalledTimes(1);
  });
});
