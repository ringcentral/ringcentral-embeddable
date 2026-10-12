// Host page side of `rc-adapter-control-call` refusals and
// `rc-adapter-ringcx-set-agent-state` validation.

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
const {
  CxWorkingState,
} = require('../../src/ringcx/services/CxWorkingState/CxWorkingState');

const availableAgentStates = [
  { agentState: 'AVAILABLE', agentAuxState: '' },
  { agentState: 'ON-BREAK', agentAuxState: 'Coffee' },
  { agentState: 'ON-BREAK', agentAuxState: 'Meeting' },
];

function findAvailableAgentState(agentState, agentAuxState) {
  return CxWorkingState.prototype.findAvailableAgentState.call(
    { cxAuth: { agentConfig: { agentSettings: { availableAgentStates } } } },
    agentState,
    agentAuxState,
  );
}

function createBridge({ isIntegratedSoftphone = true, isRinging = false } = {}) {
  const deps = {
    _cxAgentSession: { isIntegratedSoftphone },
    _cxIntegratedSoftphone: {
      isRinging,
      sipAnswer: jest.fn(async () => undefined),
      sipReject: jest.fn(async () => undefined),
    },
    _cxActiveCallControl: { onKeypadClick: jest.fn(async () => undefined) },
    _cxWorkingState: {
      findAvailableAgentState: jest.fn(findAvailableAgentState),
      changeWorkingState: jest.fn(),
    },
    _toast: { warning: jest.fn() },
    logger: { warn: jest.fn() },
  };
  const bridge = Object.create(RingCXAdapterBridge.prototype);
  Object.entries(deps).forEach(([key, value]) => {
    Object.defineProperty(bridge, key, { value });
  });
  return { bridge, ...deps };
}

describe('CxWorkingState.findAvailableAgentState', () => {
  test('uses the first listed entry without an aux state', () => {
    expect(findAvailableAgentState('ON-BREAK')).toEqual({
      agentState: 'ON-BREAK',
      agentAuxState: 'Coffee',
    });
  });

  test('picks the entry with the given aux state', () => {
    expect(findAvailableAgentState('ON-BREAK', 'Meeting')).toEqual({
      agentState: 'ON-BREAK',
      agentAuxState: 'Meeting',
    });
  });

  test('matches the default label of an entry without an aux state', () => {
    expect(findAvailableAgentState('AVAILABLE', 'Available')).toEqual({
      agentState: 'AVAILABLE',
      agentAuxState: '',
    });
  });

  test.each([
    ['NOPE', undefined],
    ['ON-BREAK', 'Lunch'],
    ['PENDING-DISPOSITION', 'Pending Disposition'],
  ])('finds nothing for %s / %s', (agentState, agentAuxState) => {
    expect(findAvailableAgentState(agentState, agentAuxState)).toBeUndefined();
  });
});

describe('RingCXAdapterBridge setAgentState', () => {
  test('sets the matched agent state', async () => {
    const { bridge, _cxWorkingState, _toast } = createBridge();

    await bridge.setAgentState('ON-BREAK', 'Meeting');

    expect(_cxWorkingState.changeWorkingState).toHaveBeenCalledWith({
      agentState: 'ON-BREAK',
      agentAuxState: 'Meeting',
    });
    expect(_toast.warning).not.toHaveBeenCalled();
  });

  test('refuses a state the agent cannot choose', async () => {
    const { bridge, _cxWorkingState, _toast, logger } = createBridge();

    await bridge.setAgentState('NOPE');

    expect(_cxWorkingState.changeWorkingState).not.toHaveBeenCalled();
    expect(_toast.warning).toHaveBeenCalledWith({
      message: 'agentStateUnavailable',
    });
    expect(logger.warn).toHaveBeenCalledWith(
      'RingCX agent state is not available',
      { state: 'NOPE', auxState: undefined },
    );
  });
});

describe('RingCXAdapterBridge controlCall refusals', () => {
  test.each([
    ['answer', 'sipAnswer'],
    ['reject', 'sipReject'],
  ])('%s acts on a call ringing on the softphone', async (action, method) => {
    const { bridge, _cxIntegratedSoftphone, _toast } = createBridge({
      isRinging: true,
    });

    await bridge.controlCall(action);

    expect(_cxIntegratedSoftphone[method]).toHaveBeenCalledTimes(1);
    expect(_toast.warning).not.toHaveBeenCalled();
  });

  test.each([
    ['answer', 'sipAnswer', { isRinging: false }],
    ['reject', 'sipReject', { isRinging: false }],
    ['answer', 'sipAnswer', { isIntegratedSoftphone: false, isRinging: true }],
  ])(
    '%s is refused with a message when no softphone call rings',
    async (action, method, options) => {
      const { bridge, _cxIntegratedSoftphone, _toast } = createBridge(options);

      await bridge.controlCall(action);

      expect(_cxIntegratedSoftphone[method]).not.toHaveBeenCalled();
      expect(_toast.warning).toHaveBeenCalledWith({
        message: 'callControlNotAllowed',
      });
    },
  );

  test('dtmf sends the digits', async () => {
    const { bridge, _cxActiveCallControl } = createBridge();

    await bridge.controlCall('dtmf', undefined, { dtmf: '5' });

    expect(_cxActiveCallControl.onKeypadClick).toHaveBeenCalledWith('5');
  });

  test.each([
    ['without digits', {}, {}],
    ['without the softphone', { dtmf: '5' }, { isIntegratedSoftphone: false }],
  ])('dtmf %s is refused with a message', async (_name, options, bridgeOptions) => {
    const { bridge, _cxActiveCallControl, _toast } = createBridge(bridgeOptions);

    await bridge.controlCall('dtmf', undefined, options);

    expect(_cxActiveCallControl.onKeypadClick).not.toHaveBeenCalled();
    expect(_toast.warning).toHaveBeenCalledWith({
      message: 'callControlNotAllowed',
    });
  });
});
