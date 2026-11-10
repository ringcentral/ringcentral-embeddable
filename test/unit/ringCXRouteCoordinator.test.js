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
const { CxWrapUpLog } = require('../../src/ringcx/services/CxWrapUpLog');

const CALL_ID = 'uii-1$session-1';
const SESSION = { uii: 'uii-1', sessionId: 'session-1' };
const DISPOSITIONS = { dispositions: [{ dispositionId: 'disp-1' }] };
const CALL_WITH_DISPOSITIONS = {
  session: SESSION,
  outdialDispositions: DISPOSITIONS,
};

function createCoordinator({
  isDisposed = false,
  activityCallId = CALL_ID,
  currentPath = `/agent/calls/${CALL_ID}`,
  bridge = {},
  homeTabAfterCall = 'dialer',
  progressiveDial,
  cxAuth = {},
  wrapUpLog = new CxWrapUpLog({ enable: jest.fn() }),
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
    logEndedCall: jest.fn(() => false),
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
    wrapUpLog,
    host,
    ringCXBridge,
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
    wrapUpLog,
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
    test('brings its wrap-up page back for the call log and finishes the call', async () => {
      const { callbacks, coordinator, cxCall, ringCXBridge, wrapUpLog } =
        createCoordinator({
          isDisposed: true,
          bridge: {
            shouldOpenLogPageAfterDisposition: jest.fn(() => true),
          },
        });

      await callbacks.ended(CALL_WITH_DISPOSITIONS);

      expect(ringCXBridge.logEndedCall).not.toHaveBeenCalled();
      expect(coordinator.navigationRequest).toEqual(
        expect.objectContaining({
          path: `/agent/calls/${CALL_ID}/disposition`,
          mode: 'replace',
          showWindow: true,
        }),
      );
      // Named "Log call": only the call log is left.
      expect(wrapUpLog.get(CALL_ID)).toEqual(
        expect.objectContaining({
          hasDispositionStep: false,
          logStatus: 'pending',
        }),
      );
      expect(cxCall.setDialoutStatus).toHaveBeenCalledWith('idle');
      expect(cxCall.activityCallId).toBe('');
    });

    test('renames a wrap-up page opened during the call to Log call', async () => {
      const wrapUpLog = new CxWrapUpLog({ enable: jest.fn() });
      wrapUpLog.open(CALL_ID, true);
      const { callbacks } = createCoordinator({
        isDisposed: true,
        wrapUpLog,
        bridge: {
          shouldOpenLogPageAfterDisposition: jest.fn(() => true),
        },
      });

      await callbacks.ended(CALL_WITH_DISPOSITIONS);

      expect(wrapUpLog.get(CALL_ID).hasDispositionStep).toBe(false);
    });

    test('saves a call log form submitted during the call and goes home', async () => {
      const wrapUpLog = new CxWrapUpLog({ enable: jest.fn() });
      const formData = { contact: 'contact-1', note: 'Typed during the call' };
      wrapUpLog.open(CALL_ID, true);
      wrapUpLog.update(CALL_ID, { logStatus: 'queued', queuedFormData: formData });
      const saveLogForm = jest.fn(async () => ({}));
      const { callbacks, coordinator } = createCoordinator({
        isDisposed: true,
        wrapUpLog,
        bridge: {
          shouldOpenLogPageAfterDisposition: jest.fn(() => true),
          saveLogForm,
        },
      });

      await callbacks.ended(CALL_WITH_DISPOSITIONS);
      await Promise.resolve();

      expect(saveLogForm).toHaveBeenCalledWith({ callId: CALL_ID, formData });
      expect(wrapUpLog.get(CALL_ID)).toEqual(
        expect.objectContaining({ logStatus: 'saved', queuedFormData: undefined }),
      );
      expect(wrapUpLog.isLogOpen(CALL_ID)).toBe(false);
      expect(coordinator.navigationRequest).toEqual(
        expect.objectContaining({
          path: '/agent/home/dialer',
          mode: 'replace',
          keepLogPage: true,
        }),
      );
    });

    test('brings the wrap-up page back when the queued call log fails to save', async () => {
      const wrapUpLog = new CxWrapUpLog({ enable: jest.fn() });
      const formData = { note: 'Typed during the call' };
      wrapUpLog.open(CALL_ID, true);
      wrapUpLog.update(CALL_ID, { logStatus: 'queued', queuedFormData: formData });
      const { callbacks, coordinator } = createCoordinator({
        isDisposed: true,
        wrapUpLog,
        bridge: {
          shouldOpenLogPageAfterDisposition: jest.fn(() => true),
          saveLogForm: jest.fn(async () => ({ error: 'CRM is down' })),
        },
      });

      await callbacks.ended(CALL_WITH_DISPOSITIONS);
      await Promise.resolve();

      // The form is kept for Retry.
      expect(wrapUpLog.get(CALL_ID)).toEqual(
        expect.objectContaining({
          logStatus: 'failed',
          logError: 'CRM is down',
          queuedFormData: formData,
          hasDispositionStep: false,
        }),
      );
      expect(coordinator.navigationRequest).toEqual(
        expect.objectContaining({
          path: `/agent/calls/${CALL_ID}/disposition`,
          mode: 'push',
          showWindow: true,
        }),
      );
    });

    test('goes home when the call log was already done on the page', async () => {
      const wrapUpLog = new CxWrapUpLog({ enable: jest.fn() });
      wrapUpLog.open(CALL_ID, true);
      wrapUpLog.update(CALL_ID, { logStatus: 'skipped' });
      const { callbacks, coordinator } = createCoordinator({
        isDisposed: true,
        wrapUpLog,
        bridge: {
          shouldOpenLogPageAfterDisposition: jest.fn(() => true),
        },
      });

      await callbacks.ended(CALL_WITH_DISPOSITIONS);

      expect(coordinator.navigationRequest).toEqual(
        expect.objectContaining({ path: '/agent/home/dialer' }),
      );
    });

    test('goes to the dialer, keeping a host log page, and finishes the call', async () => {
      const { callbacks, coordinator, cxCall } = createCoordinator({
        isDisposed: true,
      });

      await callbacks.ended(CALL_WITH_DISPOSITIONS);

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

      await callbacks.ended(CALL_WITH_DISPOSITIONS);

      expect(cxCall.setActivityCallId).not.toHaveBeenCalled();
      expect(cxCall.setDialoutStatus).not.toHaveBeenCalled();
      expect(cxCall.activityCallId).toBe('uii-2$session-2');
    });
  });

  test.each([
    ['has no dispositions', { session: SESSION }],
    [
      'has dispositions turned off for its queue',
      { ...CALL_WITH_DISPOSITIONS, surveyPopType: 'SUPPRESS' },
    ],
  ])('finishes a call that %s when it ends', async (_name, call) => {
    const { callbacks, coordinator, cxCall, ringCXBridge } = createCoordinator();

    await callbacks.ended(call);

    expect(ringCXBridge.logEndedCall).toHaveBeenCalledWith(call);
    expect(ringCXBridge.shouldOpenLogPageAfterDisposition).not.toHaveBeenCalled();
    expect(coordinator.navigationRequest).toEqual(
      expect.objectContaining({
        path: '/agent/home/dialer',
        keepLogPage: true,
      }),
    );
    expect(cxCall.activityCallId).toBe('');
  });

  test('opens a Log call wrap-up page for a call without a disposition step when the bridge asks', async () => {
    const { callbacks, coordinator, wrapUpLog } = createCoordinator({
      bridge: { logEndedCall: jest.fn(() => true) },
    });

    await callbacks.ended({ session: SESSION });

    expect(coordinator.navigationRequest).toEqual(
      expect.objectContaining({
        path: `/agent/calls/${CALL_ID}/disposition`,
        mode: 'replace',
        showWindow: true,
      }),
    );
    expect(wrapUpLog.get(CALL_ID)).toEqual(
      expect.objectContaining({ hasDispositionStep: false, logStatus: 'pending' }),
    );
  });

  test.each(['INBOUND', 'OUTBOUND'])('sends an ended %s call with dispositions to its form', async (callType) => {
    const { callbacks, coordinator, cxCall, ringCXBridge, wrapUpLog } =
      createCoordinator();

    await callbacks.ended({ ...CALL_WITH_DISPOSITIONS, callType });

    expect(ringCXBridge.logEndedCall).not.toHaveBeenCalled();
    expect(wrapUpLog.get(CALL_ID)).toEqual(
      expect.objectContaining({ hasDispositionStep: true, logStatus: 'pending' }),
    );
    expect(wrapUpLog.lastCallId).toBe(CALL_ID);

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

      await callbacks.ended(CALL_WITH_DISPOSITIONS);
      coordinator._applyNavigationRequest(coordinator.navigationRequest);

      expect(router.replace).not.toHaveBeenCalled();
      expect(router.push).not.toHaveBeenCalled();
    });

    test('still leaves a page of the ended call', async () => {
      const { callbacks, coordinator, router } = createCoordinator({
        isDisposed: true,
      });

      await callbacks.ended(CALL_WITH_DISPOSITIONS);
      coordinator._applyNavigationRequest(coordinator.navigationRequest);

      expect(router.replace).toHaveBeenCalledWith('/agent/home/dialer');
    });
  });

  describe('after a preview or progressive call', () => {
    test.each([
      ['is disposed', { isDisposed: true }, CALL_WITH_DISPOSITIONS],
      ['has no disposition step', {}, { session: SESSION }],
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
