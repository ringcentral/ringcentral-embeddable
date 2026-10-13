// A host `callLoggerPath` that fails or does not respond while the bridge
// logs a RingCX call shows a message to the agent.

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

function createBridge(logCall) {
  const deps = {
    _format: jest.fn(() => ({ call: { ringcx: {}, aiNote: 'Summary' } })),
    _toLoggerCall: jest.fn(() => ({ sessionId: 'session-1' })),
    _callLogger: { logCall: jest.fn(logCall) },
    _toast: { danger: jest.fn() },
    logger: { error: jest.fn() },
  };
  const bridge = Object.create(RingCXAdapterBridge.prototype);
  Object.entries(deps).forEach(([key, value]) => {
    Object.defineProperty(bridge, key, { value });
  });
  return { bridge, ...deps };
}

describe('RingCXAdapterBridge logCall', () => {
  test('asks the call logger to report host failures', async () => {
    const { bridge, _callLogger, _toast } = createBridge(async () => undefined);

    await bridge.logCall({
      call: { uii: 'uii-1' },
      note: 'Note',
      triggerType: 'callDisposition',
      redirect: true,
    });

    expect(_callLogger.logCall).toHaveBeenCalledWith(
      expect.objectContaining({
        call: { sessionId: 'session-1' },
        note: 'Note',
        aiNote: 'Summary',
        redirect: true,
        triggerType: 'callDisposition',
        throwOnFailure: true,
      }),
    );
    expect(_toast.danger).not.toHaveBeenCalled();
  });

  test('shows a message when the host does not log the call', async () => {
    const error = new Error('Call logger did not respond: /callLogger');
    const { bridge, _toast, logger } = createBridge(async () => {
      throw error;
    });

    await expect(
      bridge.logCall({ call: { uii: 'uii-1' }, triggerType: 'createLog' }),
    ).resolves.toBeUndefined();

    expect(_toast.danger).toHaveBeenCalledWith({ message: 'callLogFailed' });
    expect(logger.error).toHaveBeenCalledWith('RingCX call log failed', error);
  });
});
