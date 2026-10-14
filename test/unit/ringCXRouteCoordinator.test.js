jest.mock('../../src/ringcx/services/CxAuth', () => ({
  CxAuth: class CxAuth {},
}));

jest.mock('../../src/ringcx/services/CxCall', () => ({
  CxCall: class CxCall {},
}));

jest.mock('../../src/ringcx/services/CxCallDisposition', () => ({
  CxCallDisposition: class CxCallDisposition {},
}));

jest.mock('../../src/ringcx/services/CxCallMonitor', () => ({
  CxCallMonitor: class CxCallMonitor {},
}));

jest.mock('../../src/ringcx/services/CxClient', () => ({
  CxClient: class CxClient {},
}));

jest.mock('../../src/ringcx/services/CxProgressiveDial', () => ({
  CxProgressiveDial: class CxProgressiveDial {},
}));

jest.mock('../../src/ringcx/services/CxWorkingState', () => ({
  CxWorkingState: class CxWorkingState {},
}));

jest.mock('../../src/ringcx/views/CxDialerView', () => ({
  CxDialerView: class CxDialerView {},
}));

const { CxRouteCoordinator } = require('../../src/ringcx/CxRouteCoordinator');

const CALL_ID = 'uii-1$session-1';
const SESSION = { uii: 'uii-1', sessionId: 'session-1' };

function createCoordinator({
  isDisposed = false,
  activityCallId = CALL_ID,
  currentPath = `/agent/calls/${CALL_ID}`,
  bridge = {},
  dispositionOptions,
  homeTabAfterCall = 'dialer',
  progressiveDial,
  cxAuth = {},
} = {}) {
  const callbacks = {};
  const router = {
    currentPath,
    push: jest.fn(),
    replace: jest.fn(),
  };
  const cxCall = {
    activityCallId,
    setActivityCallId: jest.fn((id) => {
      cxCall.activityCallId = id;
    }),
    setDialoutStatus: jest.fn(),
    homeTabAfterCall,
  };
  const cxCallMonitor = {
    onCallRinging: jest.fn((callback) => {
      callbacks.ringing = callback;
    }),
    onCallAnswered: jest.fn((callback) => {
      callbacks.answered = callback;
    }),
    onCallEnded: jest.fn((callback) => {
      callbacks.ended = callback;
    }),
  };
  const cxWorkingState = {
    setIsPendingDisposition: jest.fn(async () => {}),
  };
  const host = { showClientWindow: jest.fn() };
  const ringCXBridge = {
    onEndCall: jest.fn(),
    logEndedCall: jest.fn(async () => false),
    shouldOpenLogPageAfterDisposition: jest.fn(() => false),
    ...bridge,
  };
  const coordinator = new CxRouteCoordinator(
    router,
    { shared: false },
    {
      onAuthSuccess: jest.fn((callback) => {
        callbacks.authSuccess = callback;
      }),
      ...cxAuth,
    },
    { encodeUii: (session) => `${session.uii}$${session.sessionId}` },
    cxCall,
    cxCallMonitor,
    { isDisposed: jest.fn(() => isDisposed) },
    cxWorkingState,
    {},
    host,
    ringCXBridge,
    dispositionOptions,
    progressiveDial,
  );
  return {
    callbacks,
    coordinator,
    cxCall,
    cxWorkingState,
    host,
    ringCXBridge,
    router,
  };
}

describe('CxRouteCoordinator', () => {
  describe('when a user with several agent accounts authenticates', () => {
    test('asks the app ports to open the account picker', async () => {
      const cxAuth = {
        isOnlyOneAgent: false,
        agentId: '',
        setupNavigationRequested: true,
        completeSetupNavigation: jest.fn(),
      };
      const { callbacks, coordinator, router } = createCoordinator({
        currentPath: '/agent',
        cxAuth,
      });

      await callbacks.authSuccess();

      expect(cxAuth.completeSetupNavigation).toHaveBeenCalledTimes(1);
      // Authentication runs on the server port, whose router renders nothing.
      expect(router.push).not.toHaveBeenCalled();
      expect(coordinator.navigationRequest).toEqual(
        expect.objectContaining({
          path: '/agent/chooseAccount',
          mode: 'push',
        }),
      );

      coordinator._applyNavigationRequest(coordinator.navigationRequest);

      expect(router.push).toHaveBeenCalledWith('/agent/chooseAccount');
    });
  });

  describe('when a call disposed while it was up ends', () => {
    test('opens the deferred log page and finishes the call', async () => {
      const { callbacks, coordinator, cxCall, ringCXBridge } =
        createCoordinator({
          isDisposed: true,
          bridge: {
            shouldOpenLogPageAfterDisposition: jest.fn(() => true),
          },
        });

      await callbacks.ended({ session: SESSION });

      expect(ringCXBridge.logEndedCall).not.toHaveBeenCalled();
      expect(coordinator.navigationRequest).toEqual(
        expect.objectContaining({
          path: `/log/call/${CALL_ID}?source=ringcx`,
          mode: 'push',
          showWindow: true,
        }),
      );
      expect(cxCall.setDialoutStatus).toHaveBeenCalledWith('idle');
      expect(cxCall.activityCallId).toBe('');
    });

    test('goes to the dialer, keeping a host log page, and finishes the call', async () => {
      const { callbacks, coordinator, cxCall } = createCoordinator({
        isDisposed: true,
      });

      await callbacks.ended({ session: SESSION });

      expect(coordinator.navigationRequest).toEqual(
        expect.objectContaining({
          path: '/agent/home/dialer',
          mode: 'replace',
          keepLogPage: true,
        }),
      );
      expect(cxCall.activityCallId).toBe('');
    });

    test('keeps a call that took over as the call worked on', async () => {
      const { callbacks, cxCall } = createCoordinator({
        isDisposed: true,
        activityCallId: 'uii-2$session-2',
      });

      await callbacks.ended({ session: SESSION });

      expect(cxCall.setActivityCallId).not.toHaveBeenCalled();
      expect(cxCall.setDialoutStatus).not.toHaveBeenCalled();
      expect(cxCall.activityCallId).toBe('uii-2$session-2');
    });
  });

  test('finishes a call without a disposition step when it ends', async () => {
    const { callbacks, coordinator, cxCall, ringCXBridge } = createCoordinator({
      // An outbound call has no disposition step once call notes are hidden.
      dispositionOptions: { hideCallNote: true },
    });

    await callbacks.ended({ session: SESSION, callType: 'OUTBOUND' });

    expect(ringCXBridge.logEndedCall).toHaveBeenCalled();
    expect(ringCXBridge.shouldOpenLogPageAfterDisposition).not.toHaveBeenCalled();
    expect(coordinator.navigationRequest).toEqual(
      expect.objectContaining({
        path: '/agent/home/dialer',
        keepLogPage: true,
      }),
    );
    expect(cxCall.activityCallId).toBe('');
  });

  test('sends an ended call that still needs a disposition to its form', async () => {
    const { callbacks, coordinator, cxCall } = createCoordinator();

    await callbacks.ended({ session: SESSION });

    expect(coordinator.navigationRequest).toEqual(
      expect.objectContaining({
        path: `/agent/calls/${CALL_ID}/disposition`,
        mode: 'replace',
        keepLogPage: false,
      }),
    );
    expect(cxCall.setActivityCallId).not.toHaveBeenCalled();
    expect(cxCall.activityCallId).toBe(CALL_ID);
  });

  describe('applying a navigation request that keeps the log page', () => {
    test('stays on a call log page the host opened', async () => {
      const { callbacks, coordinator, router } = createCoordinator({
        isDisposed: true,
        currentPath: `/log/call/${CALL_ID}?source=ringcx`,
      });

      await callbacks.ended({ session: SESSION });
      coordinator._applyNavigationRequest(coordinator.navigationRequest);

      expect(router.replace).not.toHaveBeenCalled();
      expect(router.push).not.toHaveBeenCalled();
    });

    test('still leaves a page of the ended call', async () => {
      const { callbacks, coordinator, router } = createCoordinator({
        isDisposed: true,
      });

      await callbacks.ended({ session: SESSION });
      coordinator._applyNavigationRequest(coordinator.navigationRequest);

      expect(router.replace).toHaveBeenCalledWith('/agent/home/dialer');
    });
  });

  describe('after a preview or progressive call', () => {
    test.each([
      ['is disposed', { isDisposed: true }, { session: SESSION }],
      [
        'has no disposition step',
        { dispositionOptions: { hideCallNote: true } },
        { session: SESSION, callType: 'OUTBOUND' },
      ],
      ['ends without a session', {}, {}],
    ])('goes back to the Leads tab when the call %s', async (_name, options, call) => {
      const { callbacks, coordinator } = createCoordinator({
        ...options,
        activityCallId: '',
        homeTabAfterCall: 'leads',
      });

      await callbacks.ended(call);

      expect(coordinator.navigationRequest).toEqual(
        expect.objectContaining({
          path: '/agent/home/leads',
          mode: 'replace',
        }),
      );
    });
  });

  test('brings the widget up on the Leads tab when the progressive dialer needs the agent', () => {
    let attentionRequired;
    const progressiveDial = {
      onAttentionRequired: jest.fn((listener) => {
        attentionRequired = listener;
      }),
    };
    const { coordinator } = createCoordinator({ progressiveDial });

    attentionRequired();

    expect(coordinator.navigationRequest).toEqual(
      expect.objectContaining({
        path: '/agent/home/leads',
        mode: 'replace',
        showWindow: true,
      }),
    );
  });
});
