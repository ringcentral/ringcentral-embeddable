// Host CX calls report an inbound queue as `ringcx.queue` and an outbound
// campaign as `ringcx.campaign`, on every call logger trigger type.

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
const {
  RingCXAdapterBridge,
} = require('../../src/ringcx/services/RingCXAdapterBridge/RingCXAdapterBridge');
const {
  formatHistoryCall,
} = require('../../src/ringcx/services/CxCallHistory/formatHistoryCall');

const LIVE_CALL_ID = 'uii-1$2';
const CAMPAIGN = { id: '500', name: 'Spring Promo' };
const LOGGED = [{ id: 'activity-1', type: 'call' }];

function createBridge({ callsMapping = {}, formattedCalls = [] } = {}) {
  const deps = {
    _cxCallMonitor: { callsMapping },
    _cxPresence: { callIds: [], callLogsIds: [] },
    _cxCallHistory: { formattedCalls },
    _cxClient: {
      encodeUii: ({ sessionId }) => `uii-1$${sessionId}`,
    },
    _cxCallDisposition: {
      getDisposition: jest.fn(() => undefined),
      isDisposed: jest.fn(() => false),
    },
    _cxAgentSession: {
      dialGroupId: undefined,
      selectedSkillProfileId: undefined,
    },
    _cxAuth: { agentId: 'agent-1' },
    _callLogger: { ready: true, logCall: jest.fn(async () => undefined) },
    _thirdParty: { callLoggerRegistered: true, showLogModal: false },
    _toast: { danger: jest.fn() },
    logger: { error: jest.fn() },
  };
  const bridge = Object.create(RingCXAdapterBridge.prototype);
  Object.entries(deps).forEach(([key, value]) => {
    Object.defineProperty(bridge, key, { value });
  });
  return { bridge, ...deps };
}

function liveCampaignCall() {
  return {
    uii: 'uii-1',
    session: { sessionId: '2', segmentId: 'seg-1', dialogId: 'dialog-1' },
    callType: 'OUTBOUND',
    ani: '+16505550100',
    dnis: '+16505550199',
    startTime: 1790000000000,
    endedCall: { duration: '30' },
    queue: { number: '500', name: 'Spring Promo', isCampaign: true },
  };
}

function historyItem({ queue = null, outbound = null } = {}) {
  return {
    agentSegment: {
      segmentId: 'seg-1',
      segmentStart: '2026-10-15T13:50:00.000Z',
      segmentEnd: '2026-10-15T13:50:10.000Z',
      queue,
    },
    dialog: {
      uii: 'uii-1',
      dialogId: 'dialog-1',
      dialogOrigination: outbound ? 'OUTBOUND' : 'INBOUND',
      channelConfiguration: { dnis: '+16505550199' },
      sessionInformation: { phoneNumber: '+16505550100', displayName: '' },
    },
    outbound,
  };
}

const campaignHistoryItem = () =>
  historyItem({
    outbound: {
      type: 'LEAD',
      campaignId: 500,
      campaignName: 'Spring Promo',
      lead: null,
    },
  });

const queueHistoryItem = () =>
  historyItem({ queue: { queueId: 100, queueName: 'Support' } });

describe('formatHistoryCall queue and campaign ids', () => {
  test('keeps the campaign id of a campaign row as text', () => {
    const call = formatHistoryCall(campaignHistoryItem());

    expect(call.campaignId).toBe('500');
    expect(call.campaignName).toBe('Spring Promo');
    expect(call.queueId).toBeUndefined();
  });

  test('keeps the queue id of a queue row as text', () => {
    const call = formatHistoryCall(queueHistoryItem());

    expect(call.queueId).toBe('100');
    expect(call.queueName).toBe('Support');
    expect(call.campaignId).toBeUndefined();
  });
});

describe('RingCXAdapterBridge history rows', () => {
  test('passes the campaign of a campaign row to the host call', () => {
    const row = formatHistoryCall(campaignHistoryItem());
    const { bridge } = createBridge({ formattedCalls: [row] });

    const formatted = bridge._format(bridge._findRawCall(row.id));

    expect(formatted.call.ringcx.campaign).toEqual(CAMPAIGN);
    expect(formatted.call.ringcx.queue).toBeUndefined();
  });

  test('passes the queue of a queue row to the host call', () => {
    const row = formatHistoryCall(queueHistoryItem());
    const { bridge } = createBridge({ formattedCalls: [row] });

    const formatted = bridge._format(bridge._findRawCall(row.id));

    expect(formatted.call.ringcx.queue).toEqual({ id: '100', name: 'Support' });
    expect(formatted.call.ringcx.campaign).toBeUndefined();
  });
});

describe('RingCXAdapterBridge logFromHistory', () => {
  test('sends the campaign of a live campaign call with editLog', async () => {
    const { bridge, _callLogger } = createBridge({
      callsMapping: { [LIVE_CALL_ID]: liveCampaignCall() },
    });

    await bridge.logFromHistory(
      { id: LIVE_CALL_ID, localCallId: LIVE_CALL_ID, activityMatches: LOGGED },
      'logCall',
    );

    expect(_callLogger.logCall).toHaveBeenCalledTimes(1);
    const { call, triggerType } = _callLogger.logCall.mock.calls[0][0];
    expect(triggerType).toBe('editLog');
    expect(call.ringcx).toEqual(
      expect.objectContaining({
        campaign: CAMPAIGN,
        queue: undefined,
        segmentId: 'seg-1',
        dialogId: 'dialog-1',
      }),
    );
  });

  test('sends the campaign of a history row with createLog', async () => {
    const row = formatHistoryCall(campaignHistoryItem());
    const { bridge, _callLogger } = createBridge({ formattedCalls: [row] });

    await bridge.logFromHistory(row, 'logCall');

    const { call, triggerType } = _callLogger.logCall.mock.calls[0][0];
    expect(triggerType).toBe('createLog');
    expect(call.ringcx.campaign).toEqual(CAMPAIGN);
    expect(call.ringcx.queue).toBeUndefined();
  });

});
