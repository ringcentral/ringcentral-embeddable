// Host CX call events carry the agent leg's segmentId and the dialogId,
// for history rows as well as live calls.

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
jest.mock('../../src/app/views/CustomizedPageView', () => ({
  CustomizedPageView: class CustomizedPageView {},
}));
jest.mock('../../src/app/views/LogCallView/LogCall.view', () => ({
  LogCallView: class LogCallView {},
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

function createBridge({ formattedCalls = [] } = {}) {
  const deps = {
    _cxCallMonitor: { callsMapping: {} },
    _cxPresence: { callIds: [], callLogsIds: [] },
    _cxCallHistory: { formattedCalls },
    _cxCallDisposition: {
      getDisposition: jest.fn(() => undefined),
      isDisposed: jest.fn(() => false),
    },
    _cxAgentSession: {
      dialGroupId: undefined,
      selectedSkillProfileId: undefined,
    },
    _cxAuth: { agentId: 'agent-1' },
  };
  const bridge = Object.create(RingCXAdapterBridge.prototype);
  Object.entries(deps).forEach(([key, value]) => {
    Object.defineProperty(bridge, key, { value });
  });
  return bridge;
}

function historyCall(overrides = {}) {
  return {
    id: 'seg-1$$uii-1',
    uii: 'uii-1',
    sessionId: 'seg-1',
    segmentId: 'seg-1',
    dialogId: 'dialog-1',
    direction: 'Inbound',
    from: { phoneNumber: '+16505550100' },
    to: { phoneNumber: '+16505550199' },
    fromMatches: [],
    toMatches: [],
    startTime: 1790000000000,
    durationMs: 30000,
    ...overrides,
  };
}

describe('RingCXAdapterBridge segmentId and dialogId', () => {
  test('passes both ids of a history row to the host call', () => {
    const bridge = createBridge({ formattedCalls: [historyCall()] });

    const formatted = bridge._format(bridge._findRawCall('seg-1$$uii-1'));

    expect(formatted.call.id).toBe('uii-1');
    expect(formatted.call.ringcx).toEqual(
      expect.objectContaining({
        uii: 'uii-1',
        segmentId: 'seg-1',
        dialogId: 'dialog-1',
      }),
    );
  });

  test('keeps the segmentId of a history id with no loaded row', () => {
    const bridge = createBridge();

    const formatted = bridge._format(bridge._findRawCall('seg-2$$uii-2'));

    expect(formatted.call.ringcx.segmentId).toBe('seg-2');
    expect(formatted.call.ringcx.dialogId).toBeUndefined();
  });
});
