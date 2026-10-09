jest.mock('@ringcentral-integration/micro-core/src/app/components', () => ({
  AppAnnouncement: () => null,
  AppFooterNav: () => null,
  AppHeaderNav: () => null,
}));

jest.mock('@ringcentral-integration/next-widgets/components', () => ({
  PageHeader: () => null,
}));

jest.mock('../src/ringcx/services/CxPresence', () => ({
  CxPresence: class CxPresence {},
}));

jest.mock('../src/ringcx/services/CxAuth', () => ({
  CxAuth: class CxAuth {},
}));

jest.mock('../src/ringcx/services/CxCall', () => ({
  CxCall: class CxCall {},
}));

jest.mock('../src/ringcx/services/CxCallMonitor', () => ({
  CxCallMonitor: class CxCallMonitor {},
}));

jest.mock('../src/ringcx/services/CxCallDisposition', () => ({
  CxCallDisposition: class CxCallDisposition {},
}));

jest.mock('../src/ringcx/services/CxWorkingState', () => ({
  CxWorkingState: class CxWorkingState {},
}));

jest.mock('../src/ringcx/services/CxActiveCallControl', () => ({
  CxActiveCallControl: class CxActiveCallControl {},
}));

jest.mock('../src/ringcx/services/CxAgentScript', () => ({
  CxAgentScript: class CxAgentScript {},
}));

jest.mock('../src/ringcx/services/CxClient', () => ({
  CxClient: class CxClient {},
}));

jest.mock('../src/ringcx/services/CxCallHistory', () => ({
  CxCallHistory: class CxCallHistory {},
}));

jest.mock('../src/ringcx/services/CxCallHistory/formatHistoryCall', () => ({
  parseHistoryCallId: jest.fn(),
}));

jest.mock('../src/ringcx/components/CallInfoHeader', () => ({
  CallInfoHeader: () => null,
}));

jest.mock('../src/ringcx/components/DispositionForm', () => ({
  DispositionForm: () => null,
}));

jest.mock('../src/app/services/MatchedContactSelection', () => ({
  MatchedContactSelection: class MatchedContactSelection {},
}));

jest.mock('../src/app/views/SideWidgetView', () => ({
  useSideWidgetTabsShown: () => false,
}));

jest.mock('../src/ringcx/views/CxDispositionView/i18n', () => ({
  __esModule: true,
  default: {},
  t: (key) => key,
}));

const {
  CxDispositionView,
} = require('../src/ringcx/views/CxDispositionView/CxDispositionView.view');

const CALL_ID = 'uii-1$session-1';
const DISPOSITION_PATH = `/agent/calls/${CALL_ID}/disposition`;

function createView({ liveCallIds = [CALL_ID] } = {}) {
  const router = {
    currentPath: DISPOSITION_PATH,
    goBack: jest.fn(),
    replace: jest.fn(),
  };
  const cxCall = {
    activityCallId: CALL_ID,
    setActivityCallId: jest.fn((id) => {
      cxCall.activityCallId = id;
    }),
    setDialoutStatus: jest.fn(),
  };
  const cxCallMonitor = { callIds: liveCallIds };
  const view = new CxDispositionView(
    {},
    {},
    cxCall,
    cxCallMonitor,
    {},
    {},
    {},
    {},
    {},
    router,
    {},
    { enable: jest.fn() },
    {},
    {},
  );
  view._reset = jest.fn();
  view._setViewCallId = jest.fn();
  view.goBack = jest.fn();
  return { cxCall, router, view };
}

function submitContext(overrides = {}) {
  return {
    callId: CALL_ID,
    viewCallId: CALL_ID,
    path: DISPOSITION_PATH,
    openedLogPage: false,
    shouldGoToDialer: false,
    ...overrides,
  };
}

describe('CxDispositionView submit hand-over', () => {
  test('returns a live call to its page instead of the log page', () => {
    const { cxCall, router, view } = createView();

    view._finishSubmit(submitContext({ openedLogPage: true }), true);

    expect(view.goBack).toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
    expect(cxCall.setActivityCallId).not.toHaveBeenCalled();
    expect(cxCall.activityCallId).toBe(CALL_ID);
  });

  test('keeps a live call worked on when the agent already left the form', () => {
    const { cxCall, router, view } = createView();

    view._finishSubmit(submitContext({ openedLogPage: true }), false);

    expect(router.replace).not.toHaveBeenCalled();
    expect(view.goBack).not.toHaveBeenCalled();
    expect(cxCall.setActivityCallId).not.toHaveBeenCalled();
  });

  test('opens the log page for a call that ended while the submit was in flight', () => {
    const { cxCall, router, view } = createView({ liveCallIds: [] });

    view._finishSubmit(submitContext({ openedLogPage: true }), true);

    expect(router.replace).toHaveBeenCalledWith(
      `/log/call/${CALL_ID}?source=ringcx`,
    );
    expect(cxCall.activityCallId).toBe('');
  });

  test('opens the log page for a call that was over before the submit', () => {
    const { cxCall, router, view } = createView({ liveCallIds: [] });

    view._finishSubmit(
      submitContext({ openedLogPage: true, shouldGoToDialer: true }),
      true,
    );

    expect(router.replace).toHaveBeenCalledWith(
      `/log/call/${CALL_ID}?source=ringcx`,
    );
    expect(cxCall.setDialoutStatus).toHaveBeenCalledWith('idle');
    expect(cxCall.activityCallId).toBe('');
  });

  test('leaves a disposition without a log page through its own back', () => {
    const { router, view } = createView({ liveCallIds: [] });

    view._finishSubmit(submitContext(), true);

    expect(view.goBack).toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
  });
});
