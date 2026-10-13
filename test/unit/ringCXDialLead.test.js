// Host page side of `rc-adapter-ringcx-dial-lead`: which lead shapes and
// destinations the bridge accepts, and what it hands to `CxLeads.dialLead`.

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

const storedLead = {
  leadId: '5444',
  requestId: 'request-1',
  externId: 'extern-1',
  campaignId: 'campaign-1',
  firstName: 'Ada',
  lastName: 'Lovelace',
  destination: '6508447090|6505550100',
  destinationE164: '+16508447090|+16505550100',
  leadState: 'PENDING',
};

const otherCampaignLead = {
  ...storedLead,
  requestId: 'request-2',
  campaignId: 'campaign-2',
};

function createBridge(leads = [storedLead]) {
  const cxLeads = { leads, dialLead: jest.fn(async () => true) };
  const logger = { warn: jest.fn() };
  const bridge = Object.create(RingCXAdapterBridge.prototype);
  Object.defineProperty(bridge, '_cxLeads', { value: cxLeads });
  Object.defineProperty(bridge, 'logger', { value: logger });
  return { bridge, cxLeads, logger };
}

describe('RingCXAdapterBridge dialLead', () => {
  test('dials the stored lead for the lead sent in rc-ringcx-lead-notify', async () => {
    const { bridge, cxLeads } = createBridge();
    const notifiedLead = {
      leadId: '5444',
      campaignId: 'campaign-1',
      destination: '6508447090|6505550100',
      raw: { ...storedLead },
    };

    await bridge.dialLead(notifiedLead, '6508447090');

    expect(cxLeads.dialLead).toHaveBeenCalledWith(storedLead, '+16508447090');
  });

  test('finds the stored lead from only its leadId', async () => {
    const { bridge, cxLeads } = createBridge();

    await bridge.dialLead({ leadId: '5444' }, '6508447090');

    expect(cxLeads.dialLead).toHaveBeenCalledWith(storedLead, '+16508447090');
  });

  test('narrows a leadId match with campaignId', async () => {
    const { bridge, cxLeads } = createBridge([storedLead, otherCampaignLead]);

    await bridge.dialLead(
      { leadId: '5444', campaignId: 'campaign-2' },
      '6505550100',
    );

    expect(cxLeads.dialLead).toHaveBeenCalledWith(
      otherCampaignLead,
      '+16505550100',
    );
  });

  test('prefers the stored lead with the same requestId', async () => {
    const { bridge, cxLeads } = createBridge([storedLead, otherCampaignLead]);

    await bridge.dialLead({ ...otherCampaignLead }, '+16505550100');

    expect(cxLeads.dialLead).toHaveBeenCalledWith(
      otherCampaignLead,
      '+16505550100',
    );
  });

  test('still dials a raw lead that is no longer in the list', async () => {
    const { bridge, cxLeads } = createBridge([]);

    await bridge.dialLead({ ...storedLead }, '(650) 844-7090');

    expect(cxLeads.dialLead).toHaveBeenCalledWith(
      expect.objectContaining({ requestId: 'request-1' }),
      '+16508447090',
    );
  });

  test('dials the national number when the lead has no E.164 number', async () => {
    const nationalLead = { ...storedLead, destinationE164: undefined };
    const { bridge, cxLeads } = createBridge([nationalLead]);

    await bridge.dialLead({ leadId: '5444' }, '+16505550100');

    expect(cxLeads.dialLead).toHaveBeenCalledWith(nationalLead, '6505550100');
  });

  test('does not dial an unknown lead', async () => {
    const { bridge, cxLeads, logger } = createBridge();

    await bridge.dialLead({ leadId: 'missing' }, '6508447090');

    expect(cxLeads.dialLead).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      'RingCX lead to dial was not found',
      { leadId: 'missing' },
    );
  });

  test.each(['6509990000', '7090'])(
    'does not dial %s, which is not one of the lead numbers',
    async (destination) => {
      const { bridge, cxLeads, logger } = createBridge();

      await bridge.dialLead({ leadId: '5444' }, destination);

      expect(cxLeads.dialLead).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        'RingCX lead has no such destination',
        destination,
      );
    },
  );

  test('ignores a request without a destination', async () => {
    const { bridge, cxLeads, logger } = createBridge();

    await bridge.dialLead({ leadId: '5444' });

    expect(cxLeads.dialLead).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
  });
});
