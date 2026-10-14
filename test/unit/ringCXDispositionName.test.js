// RingCX calls sent to the host carry the submitted disposition with its
// label, not only its id, on the disposed notify and on every log request.

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

function liveCall(overrides = {}) {
  return {
    uii: 'uii-1',
    sessionId: '2',
    callType: 'OUTBOUND',
    outdialDispositions: {
      dispositions: [
        { dispositionId: '10', disposition: 'Sale' },
        { dispositionId: '11', disposition: 'No answer', isDefault: true },
      ],
    },
    ...overrides,
  };
}

function createBridge({ saved, disposed = false } = {}) {
  const deps = {
    _cxCallDisposition: {
      getDisposition: jest.fn((id) => (id === LOCAL_CALL_ID ? saved : undefined)),
      isDisposed: jest.fn((id) => id === LOCAL_CALL_ID && disposed),
    },
    _cxAgentSession: { dialGroupId: undefined, selectedSkillProfileId: undefined },
    _cxAuth: { agentId: 'agent-1' },
    _callLogger: { ready: true, logCall: jest.fn(async () => undefined) },
    _thirdParty: { callLoggerRegistered: true, showLogModal: false },
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

describe('RingCXAdapterBridge disposition name', () => {
  test('looks up the label of a submitted disposition id', () => {
    const { bridge } = createBridge();

    const formatted = bridge._format(liveCall(), { dispositionId: '10' });

    expect(formatted.call.ringcx.disposition).toEqual({
      id: '10',
      name: 'Sale',
    });
  });

  test('keeps the label passed by the disposition form', () => {
    const { bridge } = createBridge();

    const formatted = bridge._format(liveCall(), {
      dispositionId: '10',
      dispositionName: 'Sale (form)',
    });

    expect(formatted.call.ringcx.disposition).toEqual({
      id: '10',
      name: 'Sale (form)',
    });
  });

  test('uses the saved disposition of a disposed call', () => {
    const { bridge } = createBridge({
      saved: { dispositionId: '10', notes: '', summary: '' },
      disposed: true,
    });

    const formatted = bridge._format(liveCall());

    expect(formatted.call.ringcx.disposition).toEqual({
      id: '10',
      name: 'Sale',
    });
  });

  test('ignores the prefilled disposition of a call not disposed yet', () => {
    const { bridge } = createBridge({
      saved: { dispositionId: '11', notes: '', summary: '' },
    });

    const formatted = bridge._format(liveCall());

    expect(formatted.call.ringcx.disposition).toBeUndefined();
  });

  test('falls back to the id when the call has no disposition list', () => {
    const { bridge } = createBridge();

    const formatted = bridge._format(
      liveCall({ outdialDispositions: undefined }),
      { dispositionId: '10' },
    );

    expect(formatted.call.ringcx.disposition).toEqual({ id: '10', name: '10' });
  });

  test('keeps the disposition recorded on a history row', () => {
    const { bridge } = createBridge();

    const formatted = bridge._format(
      liveCall({ outdialDispositions: undefined, disposition: 'Sale' }),
    );

    expect(formatted.call.ringcx.disposition).toEqual({
      id: 'Sale',
      name: 'Sale',
    });
  });

  test('sends the label on the disposed notify and the silent log', async () => {
    const { bridge, _adapter, _callLogger } = createBridge({
      saved: { dispositionId: '10', notes: 'Note', summary: '' },
      disposed: true,
    });

    await bridge.logAfterDisposition({
      call: liveCall(),
      callId: LOCAL_CALL_ID,
      note: 'Note',
      extra: { dispositionId: '10' },
    });

    expect(_adapter.notifyRingCXCall).toHaveBeenCalledWith(
      'disposed',
      expect.objectContaining({
        ringcx: expect.objectContaining({
          disposition: { id: '10', name: 'Sale' },
        }),
      }),
    );
    expect(_callLogger.logCall).toHaveBeenCalledWith(
      expect.objectContaining({
        triggerType: 'callDisposition',
        call: expect.objectContaining({
          ringcx: expect.objectContaining({
            disposition: { id: '10', name: 'Sale' },
          }),
        }),
      }),
    );
  });
});
