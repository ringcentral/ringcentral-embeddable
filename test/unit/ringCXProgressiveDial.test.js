// The progressive dialer loops over the preview APIs on the server port:
// connect the line, take the next pending lead (fetching when none is left),
// count down the dial group delay, dial, and move on once the agent is free
// again. These tests drive that loop with fake timers and a small reactive
// stand-in for next-core's `watch` / `fromWatchValue`.

const mockWatchers = new Set();

function mockNextCore() {
  const actual = jest.requireActual('../mocks/nextCoreMock');
  const { Observable } = jest.requireActual('rxjs');
  const register = (selector, onChange, multiple) => {
    const watcher = { selector, onChange, multiple, last: selector() };
    mockWatchers.add(watcher);
    return () => mockWatchers.delete(watcher);
  };
  return {
    ...actual,
    watch: (_module, selector, onChange, options) =>
      register(selector, onChange, options?.multiple),
    fromWatchValue: (_module, selector) =>
      new Observable((subscriber) =>
        register(selector, (value) => subscriber.next(value)),
      ),
  };
}

jest.mock('@ringcentral-integration/next-core', () => mockNextCore());
jest.mock('../../src/ringcx/services/Analytics/track', () => ({
  track: () => (_target, _key, descriptor) => descriptor,
}));
jest.mock('../../src/ringcx/services/CxProgressiveDial/i18n', () => ({
  t: (key) => key,
}));
jest.mock('../../src/ringcx/views/CxProgressiveDialConfirmView', () => ({
  CxProgressiveDialConfirmView: class {},
}));
jest.mock('../../src/ringcx/services/CxAgentSession', () => ({
  CxAgentSession: class {},
}));
jest.mock('../../src/ringcx/services/CxAuth', () => ({ CxAuth: class {} }));
jest.mock('../../src/ringcx/services/CxCall', () => ({ CxCall: class {} }));
jest.mock('../../src/ringcx/services/CxClient', () => ({ CxClient: class {} }));
jest.mock('../../src/ringcx/services/CxLeads', () => ({
  CxLeads: class {},
  PENDING_LEAD_STATE: 'PENDING',
}));
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

import { CxProgressiveDial } from '../../src/ringcx/services/CxProgressiveDial/CxProgressiveDial';
import { CxCallbackTypes } from '../../src/ringcx/services/CxClient/enums';

const SETTLE_MS = 500;
const DELAY_MS = 3000;
const NO_LEADS_RETRY_MS = 5000;
const PROMPT_DELAY_MS = 1000;

/**
 * Re-evaluates every watched selector and reports the ones that changed, as
 * next-core does after a state update.
 */
function notify() {
  for (let pass = 0; pass < 5; pass += 1) {
    let changed = false;
    Array.from(mockWatchers).forEach((watcher) => {
      const value = watcher.selector();
      const same = watcher.multiple
        ? value.length === watcher.last.length &&
          value.every((item, index) => Object.is(item, watcher.last[index]))
        : Object.is(value, watcher.last);
      if (!same) {
        watcher.last = value;
        changed = true;
        watcher.onChange(value);
      }
    });
    if (!changed) {
      return;
    }
  }
}

const advance = (ms) => jest.advanceTimersByTimeAsync(ms);

const lead = (requestId, leadState = 'PENDING') => ({ requestId, leadState });

function createDialer({
  batches = [[lead('lead-1'), lead('lead-2')]],
  agentState = 'AVAILABLE',
} = {}) {
  const callbacks = {};
  const subscriptions = {};
  const confirms = [];
  let remainingBatches = [...batches];

  const cxAgentSession = {
    isProgressiveDialMode: true,
    progressiveCallDelayMs: DELAY_MS,
  };
  const cxWorkingState = {
    agentState: { agentState },
    isPendingDisposition: false,
    changeWorkingState: jest.fn(),
  };
  const cxPresence = { calls: [], isOffhook: true };
  const cxCall = {
    isIdle: true,
    onManualDialout: jest.fn((callback) => {
      callbacks.manualDialout = callback;
    }),
    connectPersistentOffhook: jest.fn(async () => true),
    releasePersistentOffhook: jest.fn(async () => undefined),
  };
  const cxLeads = {
    leads: [],
    get nextPendingLead() {
      return this.leads.find((item) => item.leadState === 'PENDING');
    },
    getLeadState: (item) => item.leadState,
    fetchLeads: jest.fn(async () => {
      cxLeads.leads = remainingBatches.shift() ?? [];
      return true;
    }),
    // Dialing puts the phone in "dialing" and the lead out of PENDING.
    dialLead: jest.fn(async (item) => {
      item.leadState = 'DIALING';
      cxCall.isIdle = false;
      notify();
      return true;
    }),
    onLeadEvent: jest.fn((callback) => {
      callbacks.leadEvent = callback;
    }),
  };
  const confirmView = {
    openGoAvailableConfirm: jest.fn(() => {
      const confirm = {};
      confirm.answer = new Promise((resolve) => {
        confirm.resolve = resolve;
      });
      confirm.close = jest.fn();
      confirms.push(confirm);
      return { answer: confirm.answer, close: confirm.close };
    }),
  };
  const toast = { warning: jest.fn(), danger: jest.fn() };

  const dialer = new CxProgressiveDial(
    {
      beforeAgentLogout: jest.fn((callback) => {
        callbacks.logout = callback;
      }),
    },
    {
      onAgentStateRequest: jest.fn((callback) => {
        callbacks.agentStateRequest = callback;
      }),
    },
    cxAgentSession,
    cxCall,
    cxLeads,
    cxPresence,
    {
      onAgentOffhookEnd: jest.fn((callback) => {
        callbacks.offhookEnd = callback;
      }),
    },
    {
      subscribe: jest.fn((type, callback) => {
        subscriptions[type] = callback;
      }),
    },
    cxWorkingState,
    confirmView,
    toast,
    { shared: false },
  );

  return {
    dialer,
    callbacks,
    subscriptions,
    confirms,
    cxAgentSession,
    cxWorkingState,
    cxPresence,
    cxCall,
    cxLeads,
    confirmView,
    toast,
    /** Ends the live call: the agent is then in pending disposition. */
    endCall() {
      cxPresence.calls = [];
      cxCall.isIdle = true;
      cxWorkingState.isPendingDisposition = true;
      notify();
    },
    /** Submits the disposition; the server sets the agent's next state. */
    finishDisposition(nextState = 'AVAILABLE') {
      cxWorkingState.isPendingDisposition = false;
      cxWorkingState.agentState = { agentState: nextState };
      notify();
    },
    setAgentState(state) {
      cxWorkingState.agentState = { agentState: state };
      notify();
    },
  };
}

/** Starts the dialer and lets the first lead's countdown begin. */
async function startDialing(context) {
  await expect(context.dialer.start()).resolves.toBe(true);
  await advance(SETTLE_MS);
}

beforeEach(() => {
  jest.useFakeTimers();
  mockWatchers.clear();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('CxProgressiveDial start', () => {
  test('connects the line, fetches leads, counts down, then dials with no destination', async () => {
    const context = createDialer();
    const { dialer, cxCall, cxLeads } = context;

    await startDialing(context);

    expect(cxCall.connectPersistentOffhook).toHaveBeenCalledTimes(1);
    expect(cxLeads.fetchLeads).toHaveBeenCalledTimes(1);
    expect(
      cxCall.connectPersistentOffhook.mock.invocationCallOrder[0],
    ).toBeLessThan(cxLeads.fetchLeads.mock.invocationCallOrder[0]);
    expect(dialer.running).toBe(true);
    expect(dialer.phase).toBe('countdown');
    expect(dialer.nextLeadRequestId).toBe('lead-1');
    expect(dialer.nextDialAt).toBe(Date.now() + DELAY_MS);

    // The first call waits the dial group delay too, as in Agent One.
    await advance(DELAY_MS - 1);
    expect(cxLeads.dialLead).not.toHaveBeenCalled();

    await advance(1);
    expect(cxLeads.dialLead).toHaveBeenCalledTimes(1);
    expect(cxLeads.dialLead).toHaveBeenCalledWith(cxLeads.leads[0]);
    expect(dialer.phase).toBe('dialing');
  });

  test('uses a pending lead already loaded instead of fetching', async () => {
    const context = createDialer();
    context.cxLeads.leads = [lead('loaded-1')];

    await startDialing(context);

    expect(context.cxLeads.fetchLeads).not.toHaveBeenCalled();
    expect(context.dialer.nextLeadRequestId).toBe('loaded-1');
  });

  test('stops when the line cannot be connected', async () => {
    const context = createDialer();
    context.cxCall.connectPersistentOffhook.mockResolvedValue(false);

    await expect(context.dialer.start()).resolves.toBe(false);
    await advance(SETTLE_MS + DELAY_MS);

    expect(context.dialer.running).toBe(false);
    expect(context.dialer.stopReason).toBe('offhookFailed');
    expect(context.cxLeads.fetchLeads).not.toHaveBeenCalled();
  });

  test('is refused outside a progressive dial group', async () => {
    const context = createDialer();
    context.cxAgentSession.isProgressiveDialMode = false;

    await expect(context.dialer.start()).resolves.toBe(false);

    expect(context.toast.warning).toHaveBeenCalledWith({
      message: 'notProgressive',
    });
    expect(context.dialer.stopReason).toBe('notProgressive');
    expect(context.cxCall.connectPersistentOffhook).not.toHaveBeenCalled();
  });

  test.each([
    ['on a call', (context) => (context.cxPresence.calls = [{ id: 'call' }])],
    ['placing a call', (context) => (context.cxCall.isIdle = false)],
    [
      'in pending disposition',
      (context) => (context.cxWorkingState.isPendingDisposition = true),
    ],
  ])('is refused while %s', async (_name, makeBusy) => {
    const context = createDialer();
    makeBusy(context);

    await expect(context.dialer.start()).resolves.toBe(false);

    expect(context.toast.warning).toHaveBeenCalledWith({
      message: 'finishCallFirst',
    });
    expect(context.dialer.stopReason).toBe('busy');
  });

  test('reports a refusal again when the reason is unchanged', async () => {
    const context = createDialer();
    context.cxAgentSession.isProgressiveDialMode = false;
    const listener = jest.fn();
    context.dialer.onStatusChange(listener);

    await context.dialer.start();
    notify();
    await context.dialer.start();
    notify();

    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({ running: false, reason: 'notProgressive' }),
    );
  });

  test('asks an agent who is not available to go available first', async () => {
    const context = createDialer({ agentState: 'AWAY' });
    const attention = jest.fn();
    context.dialer.onAttentionRequired(attention);

    const starting = context.dialer.start();
    await advance(0);
    expect(attention).toHaveBeenCalledTimes(1);
    expect(context.confirmView.openGoAvailableConfirm).toHaveBeenCalledTimes(1);
    expect(context.cxCall.connectPersistentOffhook).not.toHaveBeenCalled();

    context.confirms[0].resolve(true);
    await advance(0);
    expect(context.cxWorkingState.changeWorkingState).toHaveBeenCalledWith({
      agentState: 'AVAILABLE',
      agentAuxState: '',
    });

    context.setAgentState('AVAILABLE');
    await expect(starting).resolves.toBe(true);
    expect(context.cxCall.connectPersistentOffhook).toHaveBeenCalledTimes(1);
  });

  test('does not start when the agent dismisses the go-available prompt', async () => {
    const context = createDialer({ agentState: 'AWAY' });

    const starting = context.dialer.start();
    await advance(0);
    context.confirms[0].resolve(false);

    await expect(starting).resolves.toBe(false);
    expect(context.dialer.stopReason).toBe('notAvailable');
    expect(context.cxCall.connectPersistentOffhook).not.toHaveBeenCalled();
  });

  test('does not start when AVAILABLE never arrives after Go available', async () => {
    const context = createDialer({ agentState: 'AWAY' });

    const starting = context.dialer.start();
    await advance(0);
    context.confirms[0].resolve(true);
    await advance(10 * 1000);

    await expect(starting).resolves.toBe(false);
    expect(context.dialer.stopReason).toBe('notAvailable');
  });

  test('releases the line connected after a stop during the start', async () => {
    const context = createDialer();
    let connected;
    context.cxCall.connectPersistentOffhook.mockImplementation(
      () =>
        new Promise((resolve) => {
          connected = resolve;
        }),
    );

    const starting = context.dialer.start();
    await advance(0);
    await context.dialer.stop();
    connected(true);

    await expect(starting).resolves.toBe(false);
    expect(context.dialer.running).toBe(false);
    expect(context.cxCall.releasePersistentOffhook).toHaveBeenCalledTimes(2);
  });
});

describe('CxProgressiveDial loop', () => {
  test('moves to the next lead once the call and its disposition are done', async () => {
    const context = createDialer();
    const { dialer, cxLeads } = context;
    await startDialing(context);
    await advance(DELAY_MS);
    const [first, second] = cxLeads.leads;

    // The call connects, then ends, then waits for its disposition.
    context.cxPresence.calls = [{ id: 'call-1' }];
    notify();
    await advance(SETTLE_MS);
    expect(dialer.phase).toBe('waiting');
    context.endCall();
    await advance(SETTLE_MS + DELAY_MS);
    expect(cxLeads.dialLead).toHaveBeenCalledTimes(1);

    context.finishDisposition();
    await advance(SETTLE_MS);
    expect(dialer.phase).toBe('countdown');
    expect(dialer.nextLeadRequestId).toBe(second.requestId);

    await advance(DELAY_MS);
    expect(cxLeads.dialLead).toHaveBeenCalledTimes(2);
    expect(cxLeads.dialLead).toHaveBeenLastCalledWith(second);
    expect(first.leadState).toBe('DIALING');
  });

  test('moves on when a lead is not reached', async () => {
    const context = createDialer();
    await startDialing(context);
    await advance(DELAY_MS);

    // A lead that is not reached never becomes a call; the phone goes back
    // to idle.
    context.cxLeads.leads[0].leadState = 'NOANSWER';
    context.cxCall.isIdle = true;
    notify();
    await advance(SETTLE_MS + DELAY_MS);

    expect(context.cxLeads.dialLead).toHaveBeenCalledTimes(2);
    expect(context.cxLeads.dialLead).toHaveBeenLastCalledWith(
      context.cxLeads.leads[1],
    );
  });

  test('fetches the next batch once every lead is dialed', async () => {
    const context = createDialer({
      batches: [[lead('lead-1')], [lead('lead-2')]],
    });
    await startDialing(context);
    await advance(DELAY_MS);

    context.cxCall.isIdle = true;
    notify();
    await advance(SETTLE_MS);

    expect(context.cxLeads.fetchLeads).toHaveBeenCalledTimes(2);
    expect(context.dialer.nextLeadRequestId).toBe('lead-2');
  });

  test('retries in 5 seconds when no leads come back', async () => {
    const context = createDialer({ batches: [[], [lead('lead-1')]] });
    const { dialer, cxLeads } = context;

    await startDialing(context);
    expect(dialer.phase).toBe('noLeads');
    expect(dialer.nextDialAt).toBe(Date.now() + NO_LEADS_RETRY_MS);
    expect(cxLeads.fetchLeads).toHaveBeenCalledTimes(1);

    await advance(NO_LEADS_RETRY_MS - 1);
    expect(cxLeads.fetchLeads).toHaveBeenCalledTimes(1);

    await advance(1);
    expect(cxLeads.fetchLeads).toHaveBeenCalledTimes(2);
    expect(dialer.phase).toBe('countdown');
    expect(dialer.nextLeadRequestId).toBe('lead-1');
  });

  test('a manual pass of the lead in countdown moves to the next one at once', async () => {
    const context = createDialer();
    const { dialer, cxLeads, callbacks } = context;
    await startDialing(context);
    await advance(DELAY_MS - 1000);
    const [first, second] = cxLeads.leads;

    first.leadState = 'PASSED';
    callbacks.leadEvent({ action: 'passed', lead: first });
    await advance(SETTLE_MS);

    expect(dialer.phase).toBe('countdown');
    expect(dialer.nextLeadRequestId).toBe(second.requestId);
    await advance(DELAY_MS);
    expect(cxLeads.dialLead).toHaveBeenCalledTimes(1);
    expect(cxLeads.dialLead).toHaveBeenCalledWith(second);
  });

  test('waits instead of dialing when the agent turns busy at the end of the countdown', async () => {
    const context = createDialer();
    await startDialing(context);

    // Busy right before the dial: the settle delay has not passed yet when
    // the countdown ends.
    await advance(DELAY_MS - 100);
    context.cxPresence.calls = [{ id: 'inbound' }];
    notify();
    await advance(100);

    expect(context.cxLeads.dialLead).not.toHaveBeenCalled();
    expect(context.dialer.phase).toBe('waiting');
  });

  test('skips a lead that left PENDING during its countdown', async () => {
    const context = createDialer();
    await startDialing(context);
    const [first, second] = context.cxLeads.leads;

    first.leadState = 'EXPIRED';
    await advance(DELAY_MS + SETTLE_MS);

    expect(context.cxLeads.dialLead).not.toHaveBeenCalledWith(first);
    expect(context.dialer.nextLeadRequestId).toBe(second.requestId);
  });

  test('connects the line again before the dial when it dropped', async () => {
    const context = createDialer();
    await startDialing(context);
    context.cxPresence.isOffhook = false;

    await advance(DELAY_MS);

    expect(context.cxCall.connectPersistentOffhook).toHaveBeenCalledTimes(2);
    expect(context.cxLeads.dialLead).toHaveBeenCalledTimes(1);
  });

  test('stops when the dropped line cannot be connected again', async () => {
    const context = createDialer();
    await startDialing(context);
    context.cxPresence.isOffhook = false;
    context.cxCall.connectPersistentOffhook.mockResolvedValue(false);

    await advance(DELAY_MS);

    expect(context.cxLeads.dialLead).not.toHaveBeenCalled();
    expect(context.dialer.running).toBe(false);
    expect(context.dialer.stopReason).toBe('offhookFailed');
  });

  test('stops with a message when the dial fails', async () => {
    const context = createDialer();
    context.cxLeads.dialLead.mockResolvedValue(false);
    await startDialing(context);

    await advance(DELAY_MS);

    expect(context.toast.danger).toHaveBeenCalledWith({ message: 'dialFailed' });
    expect(context.dialer.running).toBe(false);
    expect(context.dialer.stopReason).toBe('dialFailed');
  });

  test('does not dial twice when the conditions flip during the countdown', async () => {
    const context = createDialer();
    await startDialing(context);

    context.cxCall.isIdle = false;
    notify();
    await advance(100);
    context.cxCall.isIdle = true;
    notify();
    context.dialer._kick$.next();
    await advance(SETTLE_MS + DELAY_MS * 2);

    expect(context.cxLeads.dialLead).toHaveBeenCalledTimes(1);
  });

  test('reports status changes to listeners', async () => {
    const context = createDialer();
    const listener = jest.fn();
    context.dialer.onStatusChange(listener);

    await startDialing(context);
    notify();

    expect(listener).toHaveBeenLastCalledWith({
      running: true,
      phase: 'countdown',
      nextDialAt: Date.now() + DELAY_MS,
      nextLeadRequestId: 'lead-1',
      reason: null,
    });
  });
});

describe('CxProgressiveDial after a call that leaves the agent in another state', () => {
  async function finishCallInWorking(context) {
    await startDialing(context);
    await advance(DELAY_MS);
    context.cxPresence.calls = [{ id: 'call-1' }];
    notify();
    context.endCall();
    context.finishDisposition('WORKING');
    await advance(SETTLE_MS);
  }

  test('asks the agent to go available after a second and resumes on Go available', async () => {
    const context = createDialer();
    const attention = jest.fn();
    context.dialer.onAttentionRequired(attention);
    await finishCallInWorking(context);

    expect(context.dialer.phase).toBe('waiting');
    expect(context.confirmView.openGoAvailableConfirm).not.toHaveBeenCalled();
    await advance(PROMPT_DELAY_MS);
    expect(attention).toHaveBeenCalledTimes(1);
    expect(context.confirmView.openGoAvailableConfirm).toHaveBeenCalledTimes(1);

    context.confirms[0].resolve(true);
    await advance(0);
    expect(context.cxWorkingState.changeWorkingState).toHaveBeenCalledWith({
      agentState: 'AVAILABLE',
      agentAuxState: '',
    });

    context.setAgentState('AVAILABLE');
    await advance(SETTLE_MS + DELAY_MS);
    expect(context.cxLeads.dialLead).toHaveBeenCalledTimes(2);
    expect(context.dialer.running).toBe(true);
  });

  test('stops when the agent dismisses the prompt', async () => {
    const context = createDialer();
    await finishCallInWorking(context);
    await advance(PROMPT_DELAY_MS);

    context.confirms[0].resolve(false);
    await advance(0);

    expect(context.dialer.running).toBe(false);
    expect(context.dialer.stopReason).toBe('notAvailable');
    expect(context.cxCall.releasePersistentOffhook).not.toHaveBeenCalled();
  });

  test('closes the prompt when the agent becomes available another way', async () => {
    const context = createDialer();
    await finishCallInWorking(context);
    await advance(PROMPT_DELAY_MS);

    context.setAgentState('AVAILABLE');
    await advance(SETTLE_MS);

    expect(context.confirms[0].close).toHaveBeenCalledTimes(1);
    expect(context.dialer.phase).toBe('countdown');
  });

  test('does not prompt while the agent passes through TRANSITION', async () => {
    const context = createDialer();
    await startDialing(context);
    await advance(DELAY_MS);
    context.cxCall.isIdle = true;
    context.setAgentState('TRANSITION');
    await advance(SETTLE_MS + PROMPT_DELAY_MS * 2);

    expect(context.confirmView.openGoAvailableConfirm).not.toHaveBeenCalled();
    expect(context.dialer.phase).toBe('waiting');
  });
});

describe('CxProgressiveDial stop', () => {
  test('the Stop command stops dialing and releases the line', async () => {
    const context = createDialer();
    await startDialing(context);

    await context.dialer.stop();
    await advance(DELAY_MS * 2);

    expect(context.dialer.running).toBe(false);
    expect(context.dialer.stopReason).toBe('stopped');
    expect(context.dialer.nextDialAt).toBeNull();
    expect(context.cxCall.releasePersistentOffhook).toHaveBeenCalledTimes(1);
    expect(context.cxLeads.dialLead).not.toHaveBeenCalled();
  });

  test('Stop does nothing when the dialer is not running', async () => {
    const context = createDialer();

    await context.dialer.stop();

    expect(context.dialer.stopReason).toBeNull();
    expect(context.cxCall.releasePersistentOffhook).not.toHaveBeenCalled();
  });

  test.each([
    ['manualOutdial', false, (context) => context.callbacks.manualDialout()],
    ['offhookEnded', false, (context) => context.callbacks.offhookEnd()],
    ['logout', false, (context) => context.callbacks.logout()],
    [
      'inboundCall',
      false,
      (context) =>
        context.subscriptions[CxCallbackTypes.NEW_CALL]({ callType: 'INBOUND' }),
    ],
    [
      'agentState',
      false,
      (context) => context.callbacks.agentStateRequest('AWAY'),
    ],
    [
      'dialGroupChanged',
      true,
      (context) => {
        context.cxAgentSession.isProgressiveDialMode = false;
        notify();
      },
    ],
  ])('stops on %s (line released: %s)', async (reason, releasesLine, trigger) => {
    const context = createDialer();
    await startDialing(context);

    trigger(context);
    await advance(DELAY_MS * 2);

    expect(context.dialer.running).toBe(false);
    expect(context.dialer.stopReason).toBe(reason);
    expect(context.cxLeads.dialLead).not.toHaveBeenCalled();
    expect(context.cxCall.releasePersistentOffhook).toHaveBeenCalledTimes(
      releasesLine ? 1 : 0,
    );
  });

  test('keeps dialing on an outbound new call or a request to go available', async () => {
    const context = createDialer();
    await startDialing(context);

    context.subscriptions[CxCallbackTypes.NEW_CALL]({ callType: 'OUTBOUND' });
    context.callbacks.agentStateRequest('AVAILABLE');
    await advance(DELAY_MS);

    expect(context.dialer.running).toBe(true);
    expect(context.cxLeads.dialLead).toHaveBeenCalledTimes(1);
  });

  test('ignores the stop triggers while it is not running', () => {
    const context = createDialer();

    context.callbacks.manualDialout();
    context.callbacks.agentStateRequest('AWAY');

    expect(context.dialer.stopReason).toBeNull();
  });
});
