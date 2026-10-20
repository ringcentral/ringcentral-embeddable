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
const mockLeadItemProps = [];
jest.mock('../../src/ringcx/components/LeadItem', () => ({
  LeadItem: (props) => {
    mockLeadItemProps.push(props);
    return null;
  },
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

const { render } = require('@testing-library/react');
const React = require('react');

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

  test('marks the numbers of a lead already dialed', () => {
    const lead = {
      leadId: '5725',
      requestId: 'request-1',
      leadState: 'PENDING',
      destination: '+16505550100|+16505550101',
      dialedList: ['6505550100'],
    };
    const view = new CxLeadsView(
      { filteredLeads: [lead], loading: false, noLeadsReturned: false },
      {},
      { isDialing: false },
      { isPendingDisposition: false, agentState: { agentState: 'AVAILABLE' } },
      { isProgressiveDialMode: false },
      { agentConfig: { agentPermissions: { allowManualPass: true } } },
    );
    mockLeadItemProps.length = 0;
    const Harness = () => view.component();
    render(React.createElement(Harness));

    expect(mockLeadItemProps[0].phoneNumbers).toEqual([
      { formatted: '+16505550100', destination: '+16505550100', dialed: true },
      { formatted: '+16505550101', destination: '+16505550101', dialed: false },
    ]);
  });
});
