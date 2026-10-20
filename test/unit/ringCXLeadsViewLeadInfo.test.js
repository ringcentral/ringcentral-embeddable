// The Leads list hands a lead to the Lead side widget tab, which links on to
// the host lead viewer.

jest.mock('../../src/ringcx/services/CxLeads', () => ({
  CxLeads: class CxLeads {},
  AGENT_BUSY_STATES: [],
  ALLOW_DIAL_STATES: [],
  DISABLE_MANUAL_PASS_STATES: [],
  PHONE_DELIMETER: '|',
}));
jest.mock('../../src/ringcx/services/CxProgressiveDial', () => ({
  CxProgressiveDial: class CxProgressiveDial {},
}));
jest.mock('../../src/ringcx/services/CxCall', () => ({ CxCall: class {} }));
jest.mock('../../src/ringcx/services/CxWorkingState', () => ({
  CxWorkingState: class {},
}));
jest.mock('../../src/ringcx/services/CxAgentSession', () => ({
  CxAgentSession: class {},
}));
jest.mock('../../src/ringcx/services/CxAuth', () => ({ CxAuth: class {} }));
jest.mock('../../src/ringcx/services/RingCXSideWidgets', () => ({
  RingCXSideWidgets: class RingCXSideWidgets {},
}));
jest.mock('../../src/ringcx/components/LeadItem', () => ({
  LeadItem: () => null,
}));
jest.mock('../../src/ringcx/components/ManualPassForm', () => ({
  ManualPassForm: () => null,
}));
jest.mock('../../src/ringcx/components/ProgressiveDialFooter', () => ({
  ProgressiveDialFooter: () => null,
}));
jest.mock('../../src/ringcx/lib/FormatPhoneNumber', () => ({
  formatPhoneNumber: ({ phoneNumber }) => phoneNumber,
}));

const { CxLeadsView } = require('../../src/ringcx/views/CxLeadsView/CxLeadsView.view');

describe('CxLeadsView', () => {
  test('opens a lead in the Lead side widget tab', async () => {
    const ringCXSideWidgets = { viewLeadInfo: jest.fn(async () => undefined) };
    const view = new CxLeadsView(
      {},
      {},
      {},
      {},
      {},
      {},
      undefined,
      ringCXSideWidgets,
    );

    await view.viewLead({ leadId: '5725', requestId: 'request-1' });

    expect(ringCXSideWidgets.viewLeadInfo).toHaveBeenCalledWith({
      type: 'lead',
      requestId: 'request-1',
    });
  });
});
