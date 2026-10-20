jest.mock('../../src/app/services/ThirdParty', () => ({
  ThirdParty: class ThirdParty {},
}));
const mockPanelProps = [];
jest.mock('../../src/ringcx/components/LeadInfoPanel', () => ({
  LeadInfoPanel: (props) => {
    mockPanelProps.push(props);
    return null;
  },
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

const { render } = require('@testing-library/react');
const React = require('react');

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
  editPermission = 'none',
  showLeadHistory = true,
} = {}) {
  const cxLeadInfo = {
    previewLead,
    info: {
      phoneNumbers,
      lead: PREVIEW_LEAD,
      target: previewLead
        ? { type: 'lead', requestId: previewLead.requestId }
        : { type: 'call', callId: 'call-1' },
    },
    loadLeadHistory: jest.fn(async () => []),
    loadRecording: jest.fn(async () => ''),
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
    agentPermissions: { showLeadHistory },
    authenticateResponse: {
      regionalSettings: { timezoneName: 'Asia/Shanghai' },
    },
  };
  const thirdParty = {
    leadViewerRegistered: true,
    viewLead: jest.fn(async () => undefined),
  };
  const cxLeadEdit = { getPermission: jest.fn(() => editPermission) };
  const view = new CxLeadInfoView(
    cxLeadInfo,
    cxLeads,
    { isDialing },
    cxWorkingState,
    { isProgressiveDialMode },
    cxAuth,
    thirdParty,
    cxLeadEdit,
  );
  return { cxLeadEdit, cxLeads, thirdParty, view };
}

/** Renders the view and returns the props its panel received. */
function renderView(view, props = {}) {
  mockPanelProps.length = 0;
  const viewProps = {
    showCloseButton: false,
    onClose: jest.fn(),
    onOpenManualPass: jest.fn(),
    onOpenLeadUpdate: jest.fn(),
    ...props,
  };
  const Harness = () => view.component(viewProps);
  render(React.createElement(Harness));
  return { panel: mockPanelProps[mockPanelProps.length - 1], viewProps };
}

describe('CxLeadInfoView', () => {
  describe('actions of a fetched lead', () => {
    test('lets the agent dial each number and pass the lead', () => {
      const { view } = createView();

      expect(view._getPreviewActionState()).toEqual({
        previewRequestId: 'request-1',
        dialNumbers: ['+16508446685', '+16505550100'],
        isDialDisabled: false,
        showManualPass: true,
        isManualPassDisabled: false,
      });
    });

    test('offers none for a call lead', () => {
      const { view } = createView({ previewLead: null });

      expect(view._getPreviewActionState()).toEqual(
        expect.objectContaining({
          previewRequestId: '',
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

  test('dials the fetched lead', () => {
    const { cxLeads, view } = createView();

    view._onDial('+16505550100');

    expect(cxLeads.dialLead).toHaveBeenCalledWith(PREVIEW_LEAD, '+16505550100');
  });

  test('does not dial once the fetched lead is gone', () => {
    const { cxLeads, view } = createView({ previewLead: null });

    view._onDial('+16505550100');

    expect(cxLeads.dialLead).not.toHaveBeenCalled();
  });

  test('opens the Manual pass tab on the fetched lead, which passes it there', () => {
    const { cxLeads, view } = createView();
    const { panel, viewProps } = renderView(view);

    panel.previewActions.onOpenManualPass();

    expect(viewProps.onOpenManualPass).toHaveBeenCalledWith('request-1');
    expect(cxLeads.manualPassLead).not.toHaveBeenCalled();
  });

  test('offers no preview actions for a call lead', () => {
    const { view } = createView({ previewLead: null });

    expect(renderView(view).panel.previewActions).toBeNull();
  });

  test('opens the Update lead tab when the campaign allows editing', () => {
    const { view } = createView({ editPermission: 'noPhone' });
    const { panel, viewProps } = renderView(view);

    panel.editActions.onOpenEdit();

    expect(viewProps.onOpenLeadUpdate).toHaveBeenCalledTimes(1);
  });

  test('offers no Edit when the campaign does not allow it', () => {
    const { view } = createView({ editPermission: 'none' });

    expect(renderView(view).panel.editActions).toBeNull();
  });

  test('passes lead history only with the permission to see it', () => {
    const allowed = createView().view;
    const denied = createView({ showLeadHistory: false }).view;

    expect(renderView(allowed).panel.loadLeadHistory).toEqual(
      expect.any(Function),
    );
    expect(renderView(denied).panel.loadLeadHistory).toBeUndefined();
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
