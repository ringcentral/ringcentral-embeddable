// Host page side of the progressive dialer: the start / stop commands, the
// `rc-ringcx-progressive-dial-notify` event, the RCAdapter helpers, and the
// contract registry.

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
jest.mock('../../src/ringcx/services/CxLeads', () => ({ CxLeads: class {} }));
jest.mock('../../src/ringcx/services/CxPresence', () => ({
  CxPresence: class {},
}));
jest.mock('../../src/ringcx/services/CxProgressiveDial', () => ({
  CxProgressiveDial: class {},
}));
jest.mock('../../src/ringcx/services/CxWorkingState', () => ({
  CxWorkingState: class {},
}));

const fs = require('fs');
const path = require('path');

const { Adapter } = require('../../src/app/services/Adapter');
const AdapterClient = require('../../src/lib/Adapter').default;
const {
  ringCXCommandTypes,
  ringCXEventTypes,
} = require('../../src/lib/Adapter/ringCXMessageTypes');
const {
  ringCXThirdPartyContract,
} = require('../../src/app/contracts/ringcx-third-party.contract');
const {
  RingCXAdapterBridge,
} = require('../../src/ringcx/services/RingCXAdapterBridge/RingCXAdapterBridge');

function createAdapterInstance(overrides = {}) {
  const adapter = new Adapter(
    {},
    { enable: jest.fn() },
    { shared: true, onClient: jest.fn(), onServer: jest.fn() },
    ...Array.from({ length: 20 }, () => ({})),
  );
  return Object.assign(adapter, overrides);
}

function createReadyAdapter({ stage = 'ready' } = {}) {
  const bridge = {
    startProgressiveDial: jest.fn(async () => undefined),
    stopProgressiveDial: jest.fn(async () => undefined),
    getAgentSessionSnapshot: () => ({ status: stage }),
  };
  const toast = { warning: jest.fn() };
  const postMessage = jest.fn();
  const adapter = createAdapterInstance({
    _ringCX: { enabled: true, stage },
    _ringCXBridge: bridge,
    _toast: toast,
    _postMessage: postMessage,
  });
  return { adapter, bridge, toast, postMessage };
}

const settle = () => new Promise((resolve) => setImmediate(resolve));

describe('RingCX progressive dial commands', () => {
  test.each([
    ['rc-adapter-ringcx-start-progressive-dial', 'startProgressiveDial'],
    ['rc-adapter-ringcx-stop-progressive-dial', 'stopProgressiveDial'],
  ])('%s runs %s on the RingCX bridge', async (type, method) => {
    const { adapter, bridge, toast } = createReadyAdapter();

    adapter._onWindowMessage({ data: { type } });
    await settle();

    expect(bridge[method]).toHaveBeenCalledTimes(1);
    expect(toast.warning).not.toHaveBeenCalled();
  });

  test('answers that the agent session is not ready before it is', async () => {
    const { adapter, bridge, toast, postMessage } = createReadyAdapter({
      stage: 'connecting',
    });

    adapter._onWindowMessage({
      data: { type: 'rc-adapter-ringcx-start-progressive-dial' },
    });
    await settle();

    expect(bridge.startProgressiveDial).not.toHaveBeenCalled();
    expect(toast.warning).toHaveBeenCalledTimes(1);
    expect(postMessage).toHaveBeenCalledWith({
      type: 'rc-ringcx-agent-session-notify',
      status: 'connecting',
    });
  });

  test('the RCAdapter helpers post the commands', () => {
    const postMessage = jest.fn();
    const client = Object.assign(Object.create(AdapterClient.prototype), {
      _postMessage: postMessage,
    });

    client.startRingCXProgressiveDial();
    client.stopRingCXProgressiveDial();

    expect(postMessage.mock.calls).toEqual([
      [{ type: 'rc-adapter-ringcx-start-progressive-dial' }],
      [{ type: 'rc-adapter-ringcx-stop-progressive-dial' }],
    ]);
  });
});

describe('rc-ringcx-progressive-dial-notify', () => {
  test('posts the dialer status to the host page', async () => {
    const postMessage = jest.fn();
    const adapter = createAdapterInstance({
      _portManager: { shared: false },
      _postMessage: postMessage,
      _shouldSuppressCallEvent: () => false,
    });

    adapter.notifyRingCXProgressiveDial({
      running: false,
      phase: 'idle',
      nextDialAt: null,
      reason: 'notAvailable',
    });
    await settle();

    expect(postMessage).toHaveBeenCalledWith({
      type: 'rc-ringcx-progressive-dial-notify',
      running: false,
      phase: 'idle',
      nextDialAt: null,
      reason: 'notAvailable',
    });
  });
});

describe('RingCX third-party contract', () => {
  test('lists every RingCX event and command', () => {
    expect(ringCXThirdPartyContract.events).toEqual(
      expect.arrayContaining(Object.values(ringCXEventTypes)),
    );
    expect(ringCXThirdPartyContract.commands).toEqual(
      expect.arrayContaining(Object.values(ringCXCommandTypes)),
    );
  });

  test('documents the progressive dial event and commands', () => {
    const doc = fs.readFileSync(
      path.join(__dirname, '../../docs/integration/ringcx.md'),
      'utf8',
    );
    [
      ringCXEventTypes.progressiveDialNotify,
      ringCXCommandTypes.startProgressiveDial,
      ringCXCommandTypes.stopProgressiveDial,
      'startRingCXProgressiveDial',
      'stopRingCXProgressiveDial',
    ].forEach((name) => {
      expect(doc).toContain(name);
    });
  });
});

describe('RingCXAdapterBridge progressive dial', () => {
  const lead = {
    leadId: 'lead-1',
    requestId: 'request-1',
    externId: 'extern-1',
    campaignId: 'campaign-1',
    firstName: 'Ada',
    lastName: 'Lovelace',
    destination: '6505550100',
    leadState: 'PENDING',
  };

  function createBridge() {
    let statusListener;
    const unregisterStatus = jest.fn();
    const adapter = {
      notifyRingCXAgentSession: jest.fn(),
      notifyRingCXAgentState: jest.fn(),
      notifyRingCXLead: jest.fn(),
      notifyRingCXProgressiveDial: jest.fn(),
    };
    const cxProgressiveDial = {
      start: jest.fn(async () => true),
      stop: jest.fn(async () => undefined),
      onStatusChange: jest.fn((listener) => {
        statusListener = listener;
        return unregisterStatus;
      }),
    };
    const bridge = Object.assign(
      Object.create(RingCXAdapterBridge.prototype),
      {
        _adapter: adapter,
        _ringCX: { stage: 'ready' },
        _cxAuth: { authenticateResponse: { agents: [] }, agentId: 'agent-1' },
        _cxAgentSession: {
          loginType: 'integrated',
          dialGroupId: 'progressive',
          isProgressiveDialMode: true,
        },
        _cxWorkingState: {
          agentState: { agentState: 'AVAILABLE' },
          workingState: { agentAuxState: '' },
        },
        _cxLeads: { leads: [lead], onLeadEvent: jest.fn(() => jest.fn()) },
        _cxProgressiveDial: cxProgressiveDial,
      },
    );
    return {
      bridge,
      adapter,
      cxProgressiveDial,
      unregisterStatus,
      emitStatus: (status) => statusListener(status),
    };
  }

  test('starts and stops the dialer as a third-party command', async () => {
    const { bridge, cxProgressiveDial } = createBridge();

    await bridge.startProgressiveDial();
    await bridge.stopProgressiveDial();

    expect(cxProgressiveDial.start).toHaveBeenCalledWith({
      source: 'thirdParty',
    });
    expect(cxProgressiveDial.stop).toHaveBeenCalledWith({
      source: 'thirdParty',
    });
  });

  test('relays the dialer status with the lead the countdown dials', () => {
    const { bridge, adapter, emitStatus, unregisterStatus } = createBridge();
    const unbind = bridge._bindHostNotifications();

    emitStatus({
      running: true,
      phase: 'countdown',
      nextDialAt: 1000,
      nextLeadRequestId: 'request-1',
      reason: null,
    });
    emitStatus({
      running: false,
      phase: 'idle',
      nextDialAt: null,
      nextLeadRequestId: 'request-unknown',
      reason: 'inboundCall',
    });

    expect(adapter.notifyRingCXProgressiveDial.mock.calls).toEqual([
      [
        {
          running: true,
          phase: 'countdown',
          nextDialAt: 1000,
          reason: null,
          lead: {
            leadId: 'lead-1',
            externId: 'extern-1',
            campaignId: 'campaign-1',
            firstName: 'Ada',
            lastName: 'Lovelace',
            destination: '6505550100',
            raw: lead,
          },
        },
      ],
      [
        {
          running: false,
          phase: 'idle',
          nextDialAt: null,
          reason: 'inboundCall',
          lead: undefined,
        },
      ],
    ]);

    unbind();
    expect(unregisterStatus).toHaveBeenCalledTimes(1);
  });

  test('reports whether the session dial group is progressive', () => {
    const { bridge } = createBridge();

    expect(bridge.getAgentSessionSnapshot().permissions).toEqual({
      allowLoginUpdates: undefined,
      progressiveEnabled: true,
    });
  });
});
