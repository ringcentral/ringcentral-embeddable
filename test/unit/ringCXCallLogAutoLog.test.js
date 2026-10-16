// A RingCX call is sent to the host call logger after it is disposed, or when
// it ends without a disposition step, only with auto log on. A host that logs
// on its own log page opens it either way.

jest.mock('@ringcentral-integration/micro-phone/src/app/views', () => ({
  DialerView: class DialerView {},
}));
jest.mock(
  '@ringcentral-integration/micro-phone/src/app/views/CallView/services',
  () => ({
    CallViewState: class CallViewState {},
  }),
);
jest.mock('../../src/app/views/SideWidgetView', () => ({
  SideWidgetView: class SideWidgetView {},
}));
jest.mock('../../src/app/services/SmartNotes', () => ({
  SmartNotes: class SmartNotes {},
}));
jest.mock('@ringcentral-integration/micro-core/src/app/plugins', () => ({
  BlockPlugin: class BlockPlugin {},
}));
jest.mock('../../src/ringcx/services/CxActiveCallControl', () => ({
  CxActiveCallControl: class {},
}));
jest.mock('../../src/ringcx/services/CxAgentSession', () => ({
  CxAgentSession: class {},
}));
jest.mock('../../src/ringcx/services/CxAuth', () => ({ CxAuth: class {} }));
jest.mock('../../src/ringcx/services/CxCall', () => ({ CxCall: class {} }));
jest.mock('../../src/ringcx/services/CxCallDisposition', () => ({
  CxCallDisposition: class {},
}));
jest.mock('../../src/ringcx/services/CxCallHistory', () => ({
  CxCallHistory: class {},
}));
jest.mock('../../src/ringcx/services/CxCallMonitor', () => ({
  CxCallMonitor: class {},
}));
jest.mock('../../src/ringcx/services/CxClient', () => ({ CxClient: class {} }));
jest.mock('../../src/ringcx/services/CxIntegratedSoftphone', () => ({
  CxIntegratedSoftphone: class {},
}));
jest.mock('../../src/ringcx/services/CxLeads', () => ({
  CxLeads: class {},
  PHONE_DELIMETER: '|',
}));
jest.mock('../../src/ringcx/services/CxPresence', () => ({
  CxPresence: class {},
}));
jest.mock('../../src/ringcx/services/CxProgressiveDial', () => ({
  CxProgressiveDial: class {},
}));
jest.mock('../../src/ringcx/services/CxWorkingState', () => ({
  CxWorkingState: class {},
}));


const {
  RingCXAdapterBridge,
} = require('../../src/ringcx/services/RingCXAdapterBridge/RingCXAdapterBridge');
const { ringCXLiveCallId } = require('../../src/ringcx/lib/formatRingCXCall');

const LOCAL_CALL_ID = ringCXLiveCallId('uii-1', '2');
const START_TIME = Date.UTC(2026, 9, 15, 5, 0, 0);

function endedCall(overrides = {}) {
  return {
    uii: 'uii-1',
    sessionId: '2',
    callType: 'OUTBOUND',
    startTime: START_TIME,
    endedCall: { duration: '30' },
    ...overrides,
  };
}

const DISPOSITIONS = {
  dispositions: [{ dispositionId: '10', disposition: 'Sale' }],
};

function createBridge({ autoLog = true, showLogModal = false } = {}) {
  const deps = {
    _cxCallDisposition: {
      getDisposition: jest.fn(() => undefined),
      isDisposed: jest.fn(() => false),
    },
    _cxAgentSession: { dialGroupId: undefined, selectedSkillProfileId: undefined },
    _cxAuth: { agentId: 'agent-1' },
    _callLogger: { ready: true, autoLog, logCall: jest.fn(async () => undefined) },
    _thirdParty: { callLoggerRegistered: true, showLogModal },
    _adapter: { notifyRingCXCall: jest.fn() },
    _toast: { danger: jest.fn() },
    logger: { error: jest.fn() },
  };
  const bridge = Object.create(RingCXAdapterBridge.prototype);
  Object.entries(deps).forEach(([key, value]) => {
    Object.defineProperty(bridge, key, { value });
  });
  return { bridge, ...deps };
}

// The ended call is logged without holding the caller.
const flushLog = () => new Promise((resolve) => setImmediate(resolve));

describe('RingCXAdapterBridge logEndedCall', () => {
  test('logs a call without dispositions with auto log on', async () => {
    const { bridge, _callLogger } = createBridge();

    expect(bridge.logEndedCall(endedCall())).toBe(false);
    await flushLog();

    expect(_callLogger.logCall).toHaveBeenCalledTimes(1);
    expect(_callLogger.logCall).toHaveBeenCalledWith(
      expect.objectContaining({
        triggerType: 'callDisposition',
        redirect: true,
        call: expect.objectContaining({
          startTime: START_TIME,
          duration: 30,
        }),
      }),
    );
  });

  test('sends nothing with auto log off', async () => {
    const { bridge, _callLogger } = createBridge({ autoLog: false });

    expect(bridge.logEndedCall(endedCall())).toBe(false);
    await flushLog();

    expect(_callLogger.logCall).not.toHaveBeenCalled();
  });

  test('asks for the host log page instead of logging', async () => {
    const { bridge, _callLogger } = createBridge({
      autoLog: false,
      showLogModal: true,
    });

    expect(bridge.logEndedCall(endedCall())).toBe(true);
    await flushLog();

    expect(_callLogger.logCall).not.toHaveBeenCalled();
  });

  test('leaves a call with dispositions to its disposition step', async () => {
    const { bridge, _callLogger } = createBridge();

    expect(
      bridge.logEndedCall(endedCall({ outdialDispositions: DISPOSITIONS })),
    ).toBe(false);
    await flushLog();

    expect(_callLogger.logCall).not.toHaveBeenCalled();
  });

  test('logs a call whose queue turns dispositions off', async () => {
    const { bridge, _callLogger } = createBridge();

    bridge.logEndedCall(
      endedCall({ outdialDispositions: DISPOSITIONS, surveyPopType: 'SUPPRESS' }),
    );
    await flushLog();

    expect(_callLogger.logCall).toHaveBeenCalledTimes(1);
  });
});

describe('RingCXAdapterBridge logAfterDisposition', () => {
  const input = {
    call: endedCall({ outdialDispositions: DISPOSITIONS }),
    callId: LOCAL_CALL_ID,
    note: 'Note',
    extra: { dispositionId: '10' },
  };

  test('logs the disposed call with auto log on', async () => {
    const { bridge, _callLogger } = createBridge();

    await expect(bridge.logAfterDisposition(input)).resolves.toBe(false);

    expect(_callLogger.logCall).toHaveBeenCalledWith(
      expect.objectContaining({
        triggerType: 'callDisposition',
        redirect: true,
      }),
    );
  });

  test('logs the disposed call with auto log off', async () => {
    const { bridge, _adapter, _callLogger } = createBridge({ autoLog: false });

    await expect(bridge.logAfterDisposition(input)).resolves.toBe(false);

    expect(_adapter.notifyRingCXCall).toHaveBeenCalledWith(
      'disposed',
      expect.anything(),
    );
    expect(_callLogger.logCall).toHaveBeenCalledWith(
      expect.objectContaining({
        triggerType: 'callDisposition',
        redirect: true,
        note: 'Note',
      }),
    );
  });

  test('asks for the host log page whatever the auto log setting', async () => {
    const { bridge, _callLogger } = createBridge({
      autoLog: false,
      showLogModal: true,
    });

    await expect(bridge.logAfterDisposition(input)).resolves.toBe(true);

    expect(_callLogger.logCall).not.toHaveBeenCalled();
  });
});
