jest.mock('@ringcentral-integration/micro-core/src/app/components', () => ({
  AppAnnouncement: () => null,
  AppFooterNav: () => null,
  AppHeaderNav: () => null,
}));

jest.mock('@ringcentral-integration/next-widgets/components', () => ({
  PageHeader: () => null,
}));

jest.mock('../../src/ringcx/services/CxPresence', () => ({
  CxPresence: class CxPresence {},
}));

jest.mock('../../src/ringcx/services/CxAuth', () => ({
  CxAuth: class CxAuth {},
}));

jest.mock('../../src/ringcx/services/CxCall', () => ({
  CxCall: class CxCall {},
}));

jest.mock('../../src/ringcx/services/CxCallMonitor', () => ({
  CxCallMonitor: class CxCallMonitor {},
}));

jest.mock('../../src/ringcx/services/CxCallDisposition', () => ({
  CxCallDisposition: class CxCallDisposition {},
}));

jest.mock('../../src/ringcx/services/CxWorkingState', () => ({
  CxWorkingState: class CxWorkingState {},
}));

jest.mock('../../src/ringcx/services/CxActiveCallControl', () => ({
  CxActiveCallControl: class CxActiveCallControl {},
}));

jest.mock('../../src/ringcx/services/CxAgentScript', () => ({
  CxAgentScript: class CxAgentScript {},
}));

jest.mock('../../src/ringcx/services/CxClient', () => ({
  CxClient: class CxClient {},
}));

jest.mock('../../src/ringcx/services/CxCallHistory', () => ({
  CxCallHistory: class CxCallHistory {},
}));

jest.mock('../../src/ringcx/services/CxCallHistory/formatHistoryCall', () => ({
  parseHistoryCallId: jest.fn(),
}));

jest.mock('../../src/ringcx/components/CallInfoHeader', () => ({
  CallInfoHeader: () => null,
}));

jest.mock('../../src/ringcx/components/DispositionForm', () => ({
  DispositionForm: () => null,
}));

jest.mock('../../src/ringcx/services/RingCXSideWidgets', () => ({
  RingCXSideWidgets: class RingCXSideWidgets {},
}));

jest.mock('../../src/app/services/MatchedContactSelection', () => ({
  MatchedContactSelection: class MatchedContactSelection {},
}));

jest.mock('../../src/app/views/SideWidgetView', () => ({
  useSideWidgetTabsShown: () => false,
}));

jest.mock('../../src/ringcx/views/CxDispositionView/i18n', () => ({
  __esModule: true,
  default: {},
  t: (key) => key,
}));

const {
  CxDispositionView,
  SaveStatus,
} = require('../../src/ringcx/views/CxDispositionView/CxDispositionView.view');
const { CxWrapUpLog } = require('../../src/ringcx/services/CxWrapUpLog');
const {
  callLogSourceRegistry,
} = require('../../src/app/services/CallLogger/CallLogSourceRegistry');

const CALL_ID = 'uii-1$session-1';
const OTHER_CALL_ID = 'uii-2$session-2';
const DISPOSITION_PATH = `/agent/calls/${CALL_ID}/disposition`;
const DISPOSITIONS = {
  dispositions: [{ dispositionId: 'disp-1', disposition: 'Finished' }],
};
const FORM_DATA = { contact: 'contact-1', note: 'Asked for pricing' };

function createCall({ ended = false, dispositions = DISPOSITIONS } = {}) {
  return {
    uii: 'uii-1',
    session: { sessionId: 'session-1', dialogId: 'dialog-1' },
    outdialDispositions: dispositions,
    endedCall: ended ? { duration: '60' } : undefined,
  };
}

function createBridge(overrides = {}) {
  return {
    wrapUpLogMode: 'prepare',
    hostName: 'TestService',
    logCallPageOwnerId: null,
    prepareLogForm: jest.fn(async () => ({ status: 'ready' })),
    saveLogForm: jest.fn(async () => ({})),
    ...overrides,
  };
}

function createView({
  call = createCall(),
  live = true,
  bridge = createBridge(),
  disposed = false,
  currentPath = DISPOSITION_PATH,
} = {}) {
  const order = [];
  const router = {
    currentPath,
    goBack: jest.fn(),
    push: jest.fn(async (path) => {
      router.currentPath = path;
    }),
    replace: jest.fn(),
  };
  const cxCall = {
    activityCallId: CALL_ID,
    setActivityCallId: jest.fn(),
    setDialoutStatus: jest.fn(),
    homeTabAfterCall: 'dialer',
  };
  const cxCallMonitor = {
    callIds: live ? [CALL_ID] : [],
    callsMapping: {},
    getCallId: () => '',
  };
  const disposedIds = new Set(disposed ? [CALL_ID] : []);
  const cxCallDisposition = {
    isDisposed: jest.fn((id) => disposedIds.has(id)),
    getDisposition: jest.fn(() => ({
      dispositionId: 'disp-1',
      notes: 'Asked for pricing',
      summary: '',
    })),
  };
  const wrapUpLog = new CxWrapUpLog({ enable: jest.fn() });
  const view = new CxDispositionView(
    { callsMapping: { [CALL_ID]: call } },
    {},
    cxCall,
    cxCallMonitor,
    cxCallDisposition,
    {
      isPendingDisposition: true,
      setIsPendingDisposition: jest.fn(async () => {}),
    },
    {},
    {},
    { refresh: jest.fn(async () => {}) },
    router,
    { success: jest.fn(), danger: jest.fn() },
    { enable: jest.fn() },
    {},
    {},
    wrapUpLog,
    undefined,
    undefined,
    bridge,
  );
  // The disposition itself: RingCX, its activity and the script result.
  view.doDisposeCall = jest.fn(async () => {
    order.push('disposition');
    disposedIds.add(CALL_ID);
    return bridge ? bridge.wrapUpLogMode !== 'none' : false;
  });
  if (bridge?.saveLogForm) {
    const save = bridge.saveLogForm;
    bridge.saveLogForm = jest.fn(async (input) => {
      order.push('log');
      return save(input);
    });
  }
  view._scheduleSubmitNavigation = jest.fn();
  return {
    bridge,
    cxCallMonitor,
    disposedIds,
    order,
    router,
    view,
    wrapUpLog,
  };
}

afterEach(() => {
  callLogSourceRegistry.unregisterLogPageHandler('ringcx');
});

describe('wrap-up call log mode', () => {
  test.each(['prepare', 'page', 'none'])('follows the host, %s', (mode) => {
    const { view } = createView({ bridge: createBridge({ wrapUpLogMode: mode }) });

    expect(view.getWrapUpLogMode(CALL_ID)).toBe(mode);
  });

  test('shows the form of a host that opened its own log page for the call', () => {
    const { view, wrapUpLog } = createView({
      bridge: createBridge({ wrapUpLogMode: 'none' }),
    });
    wrapUpLog.open(CALL_ID, true);
    wrapUpLog.update(CALL_ID, { hostOpened: true });

    expect(view.getWrapUpLogMode(CALL_ID)).toBe('page');
  });

  test('has no call log without the bridge', () => {
    const { view } = createView({ bridge: null });

    expect(view.getWrapUpLogMode(CALL_ID)).toBe('none');
  });
});

describe('wrap-up side widget tab name', () => {
  test('is kept from when the page opened', () => {
    const { view, wrapUpLog } = createView();
    wrapUpLog.open(CALL_ID, true);
    expect(view.getTabNameKey(CALL_ID)).toBe('disposition');

    wrapUpLog.update(CALL_ID, { hasDispositionStep: false });
    expect(view.getTabNameKey(CALL_ID)).toBe('logCall');
  });

  test('follows the call before the page opened', () => {
    expect(createView().view.getTabNameKey(CALL_ID)).toBe('disposition');
    expect(
      createView({ call: createCall({ dispositions: null }) }).view.getTabNameKey(
        CALL_ID,
      ),
    ).toBe('logCall');
  });

  test('starts the wrap-up as the page opens during the call', async () => {
    const { view, wrapUpLog } = createView();

    await view.setViewCallId(CALL_ID);

    expect(wrapUpLog.get(CALL_ID)).toEqual(
      expect.objectContaining({ hasDispositionStep: true, logStatus: 'pending' }),
    );
  });
});

describe('a finished disposition', () => {
  test('stays reachable while its call log is open', () => {
    const { view, wrapUpLog } = createView({ live: false, disposed: true });
    wrapUpLog.open(CALL_ID, false);

    expect(view.isFinishedDisposition(CALL_ID)).toBe(false);

    wrapUpLog.update(CALL_ID, { logStatus: 'saved' });
    expect(view.isFinishedDisposition(CALL_ID)).toBe(true);
  });
});

describe('Rule A: a RingCX log page for a wrap-up call', () => {
  function openLogPage(id) {
    return callLogSourceRegistry.openLogPage('ringcx', id);
  }

  test("shows the host's form on the wrap-up page of the call", async () => {
    const { router, view, wrapUpLog } = createView({
      bridge: createBridge({ wrapUpLogMode: 'none' }),
      live: false,
      currentPath: '/agent/home/dialer',
    });
    void view;
    wrapUpLog.open(CALL_ID, true);

    // The host's log page id is the call uii.
    await expect(openLogPage('uii-1')).resolves.toBe(true);

    expect(router.push).toHaveBeenCalledWith(DISPOSITION_PATH);
    expect(wrapUpLog.get(CALL_ID).hostOpened).toBe(true);
  });

  test('keeps the page for the call log when a submit was about to leave it', async () => {
    const { router, view, wrapUpLog } = createView({ live: false });
    wrapUpLog.open(CALL_ID, true);
    view._scheduleSubmitNavigation = undefined;
    const timer = setTimeout(() => {}, 0);
    view._submitNavigation = { context: { callId: CALL_ID }, timer };
    view.setSaveStatus(SaveStatus.SAVED);

    await openLogPage(CALL_ID);

    expect(view._submitNavigation).toBeUndefined();
    expect(view.saveStatus).toBe(SaveStatus.SUBMIT);
    expect(router.push).not.toHaveBeenCalled();
  });

  test('leaves a call without an open call log to the log page', async () => {
    const { router, view, wrapUpLog } = createView();
    void view;
    wrapUpLog.open(CALL_ID, true);
    wrapUpLog.update(CALL_ID, { logStatus: 'saved' });

    await expect(openLogPage('uii-1')).resolves.toBe(false);
    await expect(openLogPage('uii-9')).resolves.toBe(false);
    expect(router.push).not.toHaveBeenCalled();
  });
});

describe('prepareLogForm', () => {
  test('asks the host for the form once, during the call too', async () => {
    const { bridge, view, wrapUpLog } = createView();
    wrapUpLog.open(CALL_ID, true);

    await view.prepareWrapUpLogForm(CALL_ID);
    expect(bridge.prepareLogForm).toHaveBeenCalledWith(CALL_ID);
    expect(wrapUpLog.get(CALL_ID).formStatus).toBe('ready');

    bridge.logCallPageOwnerId = CALL_ID;
    await view.prepareWrapUpLogForm(CALL_ID);
    expect(bridge.prepareLogForm).toHaveBeenCalledTimes(1);
  });

  test("asks again once another call's form replaced it", async () => {
    const { bridge, view, wrapUpLog } = createView();
    wrapUpLog.open(CALL_ID, true);
    await view.prepareWrapUpLogForm(CALL_ID);

    bridge.logCallPageOwnerId = OTHER_CALL_ID;
    await view.prepareWrapUpLogForm(CALL_ID);

    expect(bridge.prepareLogForm).toHaveBeenCalledTimes(2);
  });

  test('sends one request while one is in flight', async () => {
    let answer;
    const bridge = createBridge({
      prepareLogForm: jest.fn(
        () => new Promise((resolve) => {
          answer = resolve;
        }),
      ),
    });
    const { view, wrapUpLog } = createView({ bridge });
    wrapUpLog.open(CALL_ID, true);

    const first = view.prepareWrapUpLogForm(CALL_ID);
    await view.prepareWrapUpLogForm(CALL_ID);
    expect(wrapUpLog.get(CALL_ID).formStatus).toBe('loading');
    answer({ status: 'ready' });
    await first;

    expect(bridge.prepareLogForm).toHaveBeenCalledTimes(1);
  });

  test("shows the host's reason when it has no form", async () => {
    const bridge = createBridge({
      prepareLogForm: jest.fn(async () => ({ status: 'none', reason: 'No contact' })),
    });
    const { view, wrapUpLog } = createView({ bridge });
    wrapUpLog.open(CALL_ID, true);

    await view.prepareWrapUpLogForm(CALL_ID);

    expect(wrapUpLog.get(CALL_ID)).toEqual(
      expect.objectContaining({ formStatus: 'none', noLogFormReason: 'No contact' }),
    );
  });

  test('says the form could not load when the host does not answer', async () => {
    const bridge = createBridge({
      prepareLogForm: jest.fn(async () => ({ status: 'failed' })),
    });
    const { view, wrapUpLog } = createView({ bridge });
    wrapUpLog.open(CALL_ID, true);

    await view.prepareWrapUpLogForm(CALL_ID);

    expect(wrapUpLog.get(CALL_ID)).toEqual(
      expect.objectContaining({
        formStatus: 'none',
        noLogFormReason: 'logFormUnavailable',
      }),
    );
  });

  test.each(['page', 'none'])('is not sent to a %s host', async (mode) => {
    const bridge = createBridge({ wrapUpLogMode: mode });
    const { view, wrapUpLog } = createView({ bridge });
    wrapUpLog.open(CALL_ID, true);

    await view.prepareWrapUpLogForm(CALL_ID);

    expect(bridge.prepareLogForm).not.toHaveBeenCalled();
  });
});

describe('one Submit for the wrap-up page', () => {
  test('sends the disposition, then the call log form, for an ended call', async () => {
    const { bridge, order, view, wrapUpLog } = createView({
      call: createCall({ ended: true }),
      live: false,
    });
    wrapUpLog.open(CALL_ID, true);

    await view.submitWrapUp({ formData: FORM_DATA });

    expect(order).toEqual(['disposition', 'log']);
    expect(bridge.saveLogForm).toHaveBeenCalledWith({
      callId: CALL_ID,
      formData: FORM_DATA,
    });
    expect(wrapUpLog.get(CALL_ID).logStatus).toBe('saved');
    expect(view.saveStatus).toBe(SaveStatus.SAVED);
    expect(view._scheduleSubmitNavigation).toHaveBeenCalledWith(
      expect.objectContaining({ callId: CALL_ID, shouldGoToDialer: true }),
    );
  });

  test('keeps the disposition and the page when the host fails to save', async () => {
    const bridge = createBridge({
      saveLogForm: jest.fn(async () => ({ error: 'CRM is down' })),
    });
    const { disposedIds, view, wrapUpLog } = createView({
      bridge,
      call: createCall({ ended: true }),
      live: false,
    });
    wrapUpLog.open(CALL_ID, true);

    await view.submitWrapUp({ formData: FORM_DATA });

    expect(disposedIds.has(CALL_ID)).toBe(true);
    expect(wrapUpLog.get(CALL_ID)).toEqual(
      expect.objectContaining({ logStatus: 'failed', logError: 'CRM is down' }),
    );
    expect(view.saveStatus).toBe(SaveStatus.SUBMIT);
    expect(view._scheduleSubmitNavigation).not.toHaveBeenCalled();
  });

  test('retries only the call log once the disposition is saved', async () => {
    const { order, view, wrapUpLog } = createView({
      call: createCall({ ended: true }),
      live: false,
      disposed: true,
    });
    wrapUpLog.open(CALL_ID, true);
    wrapUpLog.update(CALL_ID, { logStatus: 'failed', logError: 'CRM is down' });

    await view.submitWrapUp({ formData: FORM_DATA });

    expect(order).toEqual(['log']);
    expect(wrapUpLog.get(CALL_ID)).toEqual(
      expect.objectContaining({ logStatus: 'saved', logError: undefined }),
    );
  });

  test('queues the call log form submitted during the call', async () => {
    const { bridge, order, view, wrapUpLog } = createView();
    wrapUpLog.open(CALL_ID, true);

    await view.submitWrapUp({ formData: FORM_DATA });

    expect(order).toEqual(['disposition']);
    expect(bridge.saveLogForm).not.toHaveBeenCalled();
    expect(wrapUpLog.get(CALL_ID)).toEqual(
      expect.objectContaining({ logStatus: 'queued', queuedFormData: FORM_DATA }),
    );
    expect(view._scheduleSubmitNavigation).toHaveBeenCalledWith(
      expect.objectContaining({ openedLogPage: true, shouldGoToDialer: false }),
    );
  });

  test('logs right away when the call ends while the disposition is sent', async () => {
    const { cxCallMonitor, order, view, wrapUpLog } = createView();
    wrapUpLog.open(CALL_ID, true);
    const dispose = view.doDisposeCall;
    // "Hangup on Disp": the server ends the call on submit.
    view.doDisposeCall = jest.fn(async () => {
      const result = await dispose();
      cxCallMonitor.callIds = [];
      return result;
    });

    await view.submitWrapUp({ formData: FORM_DATA });

    expect(order).toEqual(['disposition', 'log']);
    expect(wrapUpLog.get(CALL_ID).logStatus).toBe('saved');
  });

  test('submits without logging when only the call log form blocks the submit', async () => {
    const { bridge, view, wrapUpLog } = createView({
      call: createCall({ ended: true }),
      live: false,
    });
    wrapUpLog.open(CALL_ID, true);

    await view.submitWrapUp({ formData: null, skipLog: true });

    expect(view.doDisposeCall).toHaveBeenCalled();
    expect(bridge.saveLogForm).not.toHaveBeenCalled();
    expect(wrapUpLog.get(CALL_ID).logStatus).toBe('skipped');
    expect(view.saveStatus).toBe(SaveStatus.SAVED);
  });

  test('stays for the call log form when it is not shown yet', async () => {
    const { view, wrapUpLog } = createView({
      call: createCall({ ended: true }),
      live: false,
    });
    wrapUpLog.open(CALL_ID, true);

    await view.submitWrapUp({ formData: null });

    expect(view.doDisposeCall).toHaveBeenCalled();
    expect(wrapUpLog.get(CALL_ID).logStatus).toBe('pending');
    expect(view.saveStatus).toBe(SaveStatus.SUBMIT);
    expect(view._scheduleSubmitNavigation).not.toHaveBeenCalled();
  });

  test('stays when the host opens its log form while the disposition is sent', async () => {
    const bridge = createBridge({ wrapUpLogMode: 'none' });
    const { view, wrapUpLog } = createView({ bridge });
    wrapUpLog.open(CALL_ID, true);
    view.doDisposeCall = jest.fn(async () => {
      // The host answers `callDisposition` by opening its own log page.
      wrapUpLog.update(CALL_ID, { hostOpened: true });
      return false;
    });

    await view.submitWrapUp({ formData: null });

    expect(view.saveStatus).toBe(SaveStatus.SUBMIT);
    expect(view._scheduleSubmitNavigation).not.toHaveBeenCalled();
  });

  test('leaves a host that logs on its own after the disposition', async () => {
    const bridge = createBridge({ wrapUpLogMode: 'none' });
    const { view, wrapUpLog } = createView({
      bridge,
      call: createCall({ ended: true }),
      live: false,
    });
    wrapUpLog.open(CALL_ID, true);

    await view.submitWrapUp({ formData: null });

    expect(bridge.saveLogForm).not.toHaveBeenCalled();
    expect(wrapUpLog.get(CALL_ID).logStatus).toBe('saved');
    expect(view._scheduleSubmitNavigation).toHaveBeenCalled();
  });

  test('sends nothing when the disposition is not valid', async () => {
    const { bridge, view, wrapUpLog } = createView({
      call: createCall({ ended: true }),
      live: false,
    });
    wrapUpLog.open(CALL_ID, true);
    view.setValidated({ dispositionId: false });

    await view.submitWrapUp({ formData: FORM_DATA });

    expect(view.doDisposeCall).not.toHaveBeenCalled();
    expect(bridge.saveLogForm).not.toHaveBeenCalled();
  });
});

describe('Log later', () => {
  test('leaves the call Unlogged', async () => {
    const { view, wrapUpLog } = createView({ live: false, disposed: true });
    wrapUpLog.open(CALL_ID, false);
    wrapUpLog.update(CALL_ID, { logStatus: 'failed' });
    view.leaveEndedDisposition = jest.fn();

    await view.logLater();

    expect(wrapUpLog.get(CALL_ID).logStatus).toBe('skipped');
    expect(view.leaveEndedDisposition).toHaveBeenCalled();
  });
});
