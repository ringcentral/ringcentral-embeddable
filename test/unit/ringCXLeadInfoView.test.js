jest.mock('../../src/app/services/ThirdParty', () => ({
  ThirdParty: class ThirdParty {},
}));
jest.mock('../../src/ringcx/components/LeadInfoPanel', () => ({
  LeadInfoPanel: () => null,
}));
jest.mock('../../src/ringcx/services/CxAgentSession', () => ({
  CxAgentSession: class CxAgentSession {},
}));
jest.mock('../../src/ringcx/services/CxAuth', () => ({ CxAuth: class {} }));
jest.mock('../../src/ringcx/services/CxCall', () => ({ CxCall: class {} }));
jest.mock('../../src/ringcx/services/CxClient', () => ({ CxClient: class {} }));
jest.mock('../../src/ringcx/services/CxLeadInfo', () => ({
  CxLeadInfo: class CxLeadInfo {},
}));
jest.mock('../../src/ringcx/services/CxSubscription', () => ({
  CxSubscription: class CxSubscription {},
}));
jest.mock('../../src/ringcx/services/CxWorkingState', () => ({
  CxWorkingState: class CxWorkingState {},
}));
// The view shares the Leads list's state lists, so it uses the real ones.
jest.mock('../../src/ringcx/services/CxLeads', () => {
  const actual = jest.requireActual('../../src/ringcx/services/CxLeads/CxLeads');
  return {
    CxLeads: class CxLeads {},
    AGENT_BUSY_STATES: actual.AGENT_BUSY_STATES,
    ALLOW_DIAL_STATES: actual.ALLOW_DIAL_STATES,
    DISABLE_MANUAL_PASS_STATES: actual.DISABLE_MANUAL_PASS_STATES,
  };
});

const { CxLeadInfoView } = require('../../src/ringcx/views/CxLeadInfoView/CxLeadInfoView.view');

const PREVIEW_LEAD = {
  leadId: '5725',
  requestId: 'request-1',
  campaignId: '1',
  leadState: 'PENDING',
};

function createView({
  previewLead = PREVIEW_LEAD,
  phoneNumbers = ['+16508446685', '+16505550100'],
  agentState = 'AVAILABLE',
  isDialing = false,
  isPendingDisposition = false,
  isProgressiveDialMode = false,
  allowManualPass = true,
} = {}) {
  const cxLeadInfo = {
    previewLead,
    info: { phoneNumbers },
  };
  const cxLeads = {
    dialLead: jest.fn(async () => true),
    manualPassLead: jest.fn(async () => undefined),
    fetchManualPassDispositions: jest.fn(async () => []),
  };
  const cxWorkingState = {
    agentState: { agentState },
    isPendingDisposition,
  };
  const cxAuth = {
    agentId: 'agent-1',
    agentConfig: { agentPermissions: { allowManualPass } },
    authenticateResponse: {
      regionalSettings: { timezoneName: 'Asia/Shanghai' },
    },
  };
  const thirdParty = {
    leadViewerRegistered: true,
    viewLead: jest.fn(async () => undefined),
  };
  const view = new CxLeadInfoView(
    cxLeadInfo,
    cxLeads,
    { isDialing },
    cxWorkingState,
    { isProgressiveDialMode },
    cxAuth,
    thirdParty,
  );
  return { cxLeads, thirdParty, view };
}

describe('CxLeadInfoView', () => {
  describe('actions of a fetched lead', () => {
    test('lets the agent dial each number and pass the lead', () => {
      const { view } = createView();

      expect(view._getPreviewActionState()).toEqual({
        hasPreviewActions: true,
        dialNumbers: ['+16508446685', '+16505550100'],
        isDialDisabled: false,
        showManualPass: true,
        isManualPassDisabled: false,
        defaultTimezone: 'Asia/Shanghai',
      });
    });

    test('offers none for a call lead', () => {
      const { view } = createView({ previewLead: null });

      expect(view._getPreviewActionState()).toEqual(
        expect.objectContaining({
          hasPreviewActions: false,
          dialNumbers: [],
          showManualPass: false,
        }),
      );
    });

    test('leaves dialing to the dialer in progressive dial mode', () => {
      const { view } = createView({ isProgressiveDialMode: true });

      expect(view._getPreviewActionState().dialNumbers).toEqual([]);
    });

    test('hides manual pass without the permission', () => {
      const { view } = createView({ allowManualPass: false });

      expect(view._getPreviewActionState().showManualPass).toBe(false);
    });

    test.each([
      ['while dialing', { isDialing: true }],
      ['during a pending disposition', { isPendingDisposition: true }],
      ['while the agent is engaged', { agentState: 'ENGAGED' }],
    ])('blocks both %s', (_name, options) => {
      const { view } = createView(options);

      expect(view._getPreviewActionState()).toEqual(
        expect.objectContaining({
          isDialDisabled: true,
          isManualPassDisabled: true,
        }),
      );
    });

    test('follows the lead state as the Leads list does', () => {
      const ringing = createView({
        previewLead: { ...PREVIEW_LEAD, leadState: 'RINGING' },
      }).view._getPreviewActionState();
      const complete = createView({
        previewLead: { ...PREVIEW_LEAD, leadState: 'COMPLETE' },
      }).view._getPreviewActionState();

      expect(ringing).toEqual(
        expect.objectContaining({
          isDialDisabled: true,
          isManualPassDisabled: true,
        }),
      );
      expect(complete).toEqual(
        expect.objectContaining({
          isDialDisabled: false,
          isManualPassDisabled: false,
        }),
      );
    });
  });

  test('dials and passes the fetched lead', async () => {
    const { cxLeads, view } = createView();
    const params = {
      dispositionId: 'disposition-1',
      notes: 'Wrong number',
      callback: false,
      callbackDTS: '',
    };

    view._onDial('+16505550100');
    await view._onManualPass(params);

    expect(cxLeads.dialLead).toHaveBeenCalledWith(PREVIEW_LEAD, '+16505550100');
    expect(cxLeads.manualPassLead).toHaveBeenCalledWith({
      lead: PREVIEW_LEAD,
      ...params,
    });
  });

  test('does nothing once the fetched lead is gone', async () => {
    const { cxLeads, view } = createView({ previewLead: null });

    view._onDial('+16505550100');
    await view._onManualPass({});

    expect(cxLeads.dialLead).not.toHaveBeenCalled();
    expect(cxLeads.manualPassLead).not.toHaveBeenCalled();
  });

  test('sends the lead to the host lead viewer with the agent id', () => {
    const { thirdParty, view } = createView();
    const lead = { leadId: '5725' };

    view._onViewLead(lead);

    expect(thirdParty.viewLead).toHaveBeenCalledWith({
      lead,
      agentId: 'agent-1',
    });
  });
});
