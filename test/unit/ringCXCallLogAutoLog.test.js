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

function createBridge({
  autoLog = true,
  showLogModal = false,
  prepareLogForm = false,
  callLoggerRegistered = true,
} = {}) {
  const deps = {
    _cxCallDisposition: {
      getDisposition: jest.fn(() => undefined),
      isDisposed: jest.fn(() => false),
    },
    _cxAgentSession: { dialGroupId: undefined, selectedSkillProfileId: undefined },
    _cxAuth: { agentId: 'agent-1' },
    _callLogger: { ready: true, autoLog, logCall: jest.fn(async () => undefined) },
    _thirdParty: {
      callLoggerRegistered,
      showLogModal,
      callLoggerPrepareLogForm: prepareLogForm,
      displayName: 'TestService',
      serviceName: 'test-service',
      customizedLogCallPage: undefined,
      logCall: jest.fn(async () => ({ data: 'ok' })),
      setLogCallPageOwner: jest.fn(async () => undefined),
    },
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

describe('RingCXAdapterBridge wrap-up call log mode', () => {
  test.each([
    ['an opted-in host', { prepareLogForm: true }, 'prepare'],
    ['an opted-in showLogModal host', { prepareLogForm: true, showLogModal: true }, 'prepare'],
    ['a showLogModal host', { showLogModal: true }, 'page'],
    ['another host', {}, 'none'],
    ['no call logger', { prepareLogForm: true, callLoggerRegistered: false }, 'none'],
  ])('is %s', (_name, options, mode) => {
    const { bridge } = createBridge(options);

    expect(bridge.wrapUpLogMode).toBe(mode);
  });

  test("names the host by its display name, else its service name", () => {
    const { bridge, _thirdParty } = createBridge();
    expect(bridge.hostName).toBe('TestService');

    _thirdParty.displayName = null;
    expect(bridge.hostName).toBe('test-service');
  });

  test('logs an ended call without dispositions on its wrap-up page', async () => {
    const { bridge, _callLogger } = createBridge({ prepareLogForm: true });

    expect(bridge.logEndedCall(endedCall())).toBe(true);
    await flushLog();

    expect(_callLogger.logCall).not.toHaveBeenCalled();
  });

  test('sends an opted-in host no callDisposition after the disposition', async () => {
    const { bridge, _adapter, _callLogger } = createBridge({
      prepareLogForm: true,
    });

    await expect(
      bridge.logAfterDisposition({
        call: endedCall({ outdialDispositions: DISPOSITIONS }),
        callId: LOCAL_CALL_ID,
        note: 'Note',
      }),
    ).resolves.toBe(true);

    expect(_callLogger.logCall).not.toHaveBeenCalled();
    expect(_adapter.notifyRingCXCall).toHaveBeenCalledWith(
      'disposed',
      expect.anything(),
    );
    expect(bridge.shouldOpenLogPageAfterDisposition()).toBe(true);
  });
});

describe('RingCXAdapterBridge prepareLogForm', () => {
  function createPreparingBridge(call = endedCall()) {
    const created = createBridge({ prepareLogForm: true });
    Object.defineProperty(created.bridge, '_findRawCall', {
      value: jest.fn((id) => (id === LOCAL_CALL_ID ? call : undefined)),
    });
    created._cxCallDisposition.getDisposition.mockReturnValue({
      dispositionId: null,
      notes: 'Typed so far',
      summary: '',
    });
    return created;
  }

  test('asks the host for the form of the call, with the notes so far', async () => {
    const { bridge, _thirdParty } = createPreparingBridge();
    _thirdParty.logCall.mockImplementation(async () => {
      // The host posts its form before it answers.
      _thirdParty.customizedLogCallPage = { id: '$LOG-CALL', schema: {} };
      return { data: 'ok' };
    });

    await expect(bridge.prepareLogForm(LOCAL_CALL_ID)).resolves.toEqual({
      status: 'ready',
    });

    expect(_thirdParty.setLogCallPageOwner).toHaveBeenCalledWith(LOCAL_CALL_ID);
    expect(_thirdParty.logCall).toHaveBeenCalledWith(
      expect.objectContaining({
        triggerType: 'prepareLogForm',
        note: 'Typed so far',
        throwOnFailure: true,
        call: expect.objectContaining({
          source: 'ringcx',
          duration: 30,
          ringcx: expect.objectContaining({ notes: 'Typed so far' }),
        }),
      }),
    );
  });

  test("passes on the host's reason when it has no form", async () => {
    const { bridge, _thirdParty } = createPreparingBridge();
    _thirdParty.logCall.mockResolvedValueOnce({
      data: 'ok',
      noLogForm: 'No contact found',
    });

    await expect(bridge.prepareLogForm(LOCAL_CALL_ID)).resolves.toEqual({
      status: 'none',
      reason: 'No contact found',
    });
  });

  test('has no form when the host answers without posting one', async () => {
    const { bridge } = createPreparingBridge();

    await expect(bridge.prepareLogForm(LOCAL_CALL_ID)).resolves.toEqual({
      status: 'none',
    });
  });

  test('reports a host that does not answer', async () => {
    const { bridge, _thirdParty } = createPreparingBridge();
    _thirdParty.logCall.mockRejectedValueOnce(new Error('Time out'));

    await expect(bridge.prepareLogForm(LOCAL_CALL_ID)).resolves.toEqual({
      status: 'failed',
    });
  });

  test('reports a call it cannot find', async () => {
    const { bridge, _thirdParty } = createPreparingBridge();

    await expect(bridge.prepareLogForm('uii-9$1')).resolves.toEqual({
      status: 'failed',
    });
    expect(_thirdParty.logCall).not.toHaveBeenCalled();
  });
});

describe('RingCXAdapterBridge saveLogForm', () => {
  const CONTACTS = [
    { id: 'contact-1', name: 'First' },
    { id: 'contact-2', name: 'Second' },
  ];

  function createSavingBridge() {
    const created = createBridge({ prepareLogForm: true });
    Object.defineProperty(created.bridge, '_findRawCall', {
      value: jest.fn(() => endedCall({ contactMatches: CONTACTS })),
    });
    return created;
  }

  test('saves the form as the log page does, for the contact it picked', async () => {
    const { bridge, _thirdParty } = createSavingBridge();
    const formData = { contactId: 'contact-2', note: 'Saved note' };

    await expect(
      bridge.saveLogForm({ callId: LOCAL_CALL_ID, formData }),
    ).resolves.toEqual({});

    expect(_thirdParty.logCall).toHaveBeenCalledWith(
      expect.objectContaining({
        triggerType: 'logForm',
        formData,
        note: 'Saved note',
        redirect: true,
        fromEntity: null,
        toEntity: expect.objectContaining({ id: 'contact-2' }),
      }),
    );
  });

  test("returns the host's error for a failed save", async () => {
    const { bridge, _thirdParty } = createSavingBridge();
    _thirdParty.logCall.mockResolvedValueOnce({ error: 'CRM is down' });

    await expect(
      bridge.saveLogForm({ callId: LOCAL_CALL_ID, formData: {} }),
    ).resolves.toEqual({ error: 'CRM is down' });
  });

  test('returns an error when the host does not answer', async () => {
    const { bridge, _thirdParty } = createSavingBridge();
    _thirdParty.logCall.mockRejectedValueOnce(new Error('Time out'));

    await expect(
      bridge.saveLogForm({ callId: LOCAL_CALL_ID, formData: {} }),
    ).resolves.toEqual({ error: expect.any(String) });
  });
});

describe('RingCX wrap-up contract', () => {
  const fs = require('fs');
  const path = require('path');
  const {
    ringCXThirdPartyContract,
  } = require('../../src/app/contracts/ringcx-third-party.contract');

  test('registers the prepareLogForm opt-in and trigger', () => {
    expect(ringCXThirdPartyContract.registrationOptions).toContain(
      'callLoggerPrepareLogForm',
    );
    expect(ringCXThirdPartyContract.triggerTypes).toContain('prepareLogForm');
  });

  test.each(['docs/integration/ringcx.md', 'docs/contracts/ringcx-third-party.md'])(
    'documents the prepareLogForm contract in %s',
    (file) => {
      const doc = fs.readFileSync(path.join(__dirname, '../..', file), 'utf8');
      ['callLoggerPrepareLogForm', 'prepareLogForm', 'noLogForm'].forEach((term) => {
        expect(doc).toContain(term);
      });
    },
  );
});
