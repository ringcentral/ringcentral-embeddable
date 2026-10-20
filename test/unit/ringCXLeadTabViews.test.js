// The Manual pass and Update lead side widget tabs render a form for the lead
// they were opened on, held as server state so every tab shows the same one.

jest.mock('../../src/ringcx/services/CxAuth', () => ({ CxAuth: class {} }));
jest.mock('../../src/ringcx/services/CxCall', () => ({ CxCall: class {} }));
jest.mock('../../src/ringcx/services/CxWorkingState', () => ({
  CxWorkingState: class CxWorkingState {},
}));
jest.mock('../../src/ringcx/services/CxLeadEdit', () => ({
  CxLeadEdit: class CxLeadEdit {},
}));
// The view shares the Leads list's state lists, so it uses the real ones.
jest.mock('../../src/ringcx/services/CxLeads', () => {
  const actual = jest.requireActual('../../src/ringcx/services/CxLeads/CxLeads');
  return {
    CxLeads: class CxLeads {},
    AGENT_BUSY_STATES: actual.AGENT_BUSY_STATES,
    DISABLE_MANUAL_PASS_STATES: actual.DISABLE_MANUAL_PASS_STATES,
  };
});

const mockManualPassProps = [];
jest.mock('../../src/ringcx/components/ManualPassForm', () => ({
  ManualPassForm: (props) => {
    mockManualPassProps.push(props);
    return null;
  },
}));

const mockLeadUpdateProps = [];
jest.mock('../../src/ringcx/components/LeadInfoPanel', () => ({
  LeadUpdateForm: (props) => {
    mockLeadUpdateProps.push(props);
    return null;
  },
}));

const { render, screen } = require('@testing-library/react');
const React = require('react');

const {
  CxManualPassView,
} = require('../../src/ringcx/views/CxManualPassView/CxManualPassView.view');
const {
  CxLeadUpdateView,
} = require('../../src/ringcx/views/CxLeadUpdateView/CxLeadUpdateView.view');

const LEAD = {
  requestId: 'request-1',
  leadId: '5725',
  campaignId: '1',
  firstName: 'Embbnux',
  lastName: 'Labs',
  leadState: 'PENDING',
  completed: false,
};

/** Renders a view's unbound `component`, as next-core binds it. */
function renderView(view, props) {
  const Harness = () => view.component(props);
  return render(React.createElement(Harness));
}

describe('CxManualPassView', () => {
  function createView({
    leads = [LEAD],
    isDialing = false,
    isPendingDisposition = false,
    agentState = 'AVAILABLE',
  } = {}) {
    const cxLeads = {
      leads,
      manualPassLead: jest.fn(async () => undefined),
      fetchManualPassDispositions: jest.fn(async () => []),
    };
    const view = new CxManualPassView(
      cxLeads,
      { isDialing },
      { agentState: { agentState }, isPendingDisposition },
      {
        authenticateResponse: {
          regionalSettings: { timezoneName: 'Asia/Shanghai' },
        },
      },
    );
    return { cxLeads, view };
  }

  function renderPass(view, props = {}) {
    mockManualPassProps.length = 0;
    const viewProps = { showCloseButton: false, onClose: jest.fn(), ...props };
    renderView(view, viewProps);
    return {
      form: mockManualPassProps[mockManualPassProps.length - 1],
      viewProps,
    };
  }

  test('holds the fetched lead it was opened on', () => {
    const { view } = createView();

    view.setRequestId('request-1');

    expect(view.lead).toBe(LEAD);
  });

  test('lets the lead go once it is passed or no longer fetched', () => {
    const passed = createView({ leads: [{ ...LEAD, completed: true }] }).view;
    passed.setRequestId('request-1');
    const gone = createView({ leads: [] }).view;
    gone.setRequestId('request-1');

    expect(passed.lead).toBeNull();
    expect(gone.lead).toBeNull();
  });

  test("renders the pass form for the lead's campaign, under the tab bar", () => {
    const { view } = createView();
    view.setRequestId('request-1');

    const { form } = renderPass(view);

    expect(form).toEqual(
      expect.objectContaining({
        leadName: 'Embbnux Labs',
        campaignId: '1',
        defaultTimezone: 'Asia/Shanghai',
        showHeader: false,
        disabled: false,
      }),
    );
  });

  test('shows its own header while no tab bar names the tab', () => {
    const { view } = createView();
    view.setRequestId('request-1');

    expect(renderPass(view, { showCloseButton: true }).form.showHeader).toBe(
      true,
    );
  });

  test('closes the tab and passes the lead on submit', async () => {
    const { cxLeads, view } = createView();
    view.setRequestId('request-1');
    const { form, viewProps } = renderPass(view);
    const params = {
      dispositionId: 'disposition-1',
      notes: 'Wrong number',
      callback: false,
      callbackDTS: '',
    };

    await form.onSubmit(params);

    expect(viewProps.onClose).toHaveBeenCalledTimes(1);
    expect(cxLeads.manualPassLead).toHaveBeenCalledWith({ lead: LEAD, ...params });
  });

  test.each([
    ['while dialing', { isDialing: true }],
    ['during a pending disposition', { isPendingDisposition: true }],
    ['while the agent is engaged', { agentState: 'ENGAGED' }],
    ['for a ringing lead', { leads: [{ ...LEAD, leadState: 'RINGING' }] }],
  ])('blocks the pass %s, as the Leads list does', (_name, options) => {
    const { view } = createView(options);
    view.setRequestId('request-1');

    expect(renderPass(view).form.disabled).toBe(true);
  });

  test('says the lead is gone instead of showing the form', () => {
    const { view } = createView({ leads: [] });
    view.setRequestId('request-1');

    const { form } = renderPass(view);

    expect(form).toBeUndefined();
    // Locale strings render as their keys in tests.
    expect(screen.getByText('leadNotAvailable')).toBeInTheDocument();
  });
});

describe('CxLeadUpdateView', () => {
  const TARGET = {
    lead: { leadId: '5725', campaignId: '1', firstName: 'Embbnux' },
    phoneNumbers: ['+16508446685'],
    auxLabels: ['Tier'],
  };

  function createView({ permission = 'all', updateResult = true } = {}) {
    const cxLeadEdit = {
      getPermission: jest.fn(() => permission),
      updateLead: jest.fn(async () => updateResult),
    };
    return { cxLeadEdit, view: new CxLeadUpdateView(cxLeadEdit) };
  }

  function renderUpdate(view, props = {}) {
    mockLeadUpdateProps.length = 0;
    const viewProps = { showCloseButton: false, onClose: jest.fn(), ...props };
    const result = renderView(view, viewProps);
    return {
      form: mockLeadUpdateProps[mockLeadUpdateProps.length - 1],
      result,
      viewProps,
    };
  }

  test('renders nothing until a lead is set', () => {
    const { view } = createView();

    const { form, result } = renderUpdate(view);

    expect(form).toBeUndefined();
    expect(result.container.innerHTML).toBe('');
  });

  test('edits the lead as the Lead tab showed it, under the tab bar', () => {
    const { view } = createView();
    view.setTarget(TARGET);

    const { form, viewProps } = renderUpdate(view);

    expect(form).toEqual(
      expect.objectContaining({
        lead: TARGET.lead,
        phoneNumbers: TARGET.phoneNumbers,
        auxLabels: TARGET.auxLabels,
        canEditPhone: true,
        showHeader: false,
        onClose: viewProps.onClose,
      }),
    );
  });

  test('shows its own header while no tab bar names the tab', () => {
    const { view } = createView();
    view.setTarget(TARGET);

    expect(renderUpdate(view, { showCloseButton: true }).form.showHeader).toBe(
      true,
    );
  });

  test('locks the numbers when the campaign only lets agents edit other fields', () => {
    const { cxLeadEdit, view } = createView({ permission: 'noPhone' });
    view.setTarget(TARGET);

    expect(renderUpdate(view).form.canEditPhone).toBe(false);
    expect(cxLeadEdit.getPermission).toHaveBeenCalledWith(TARGET.lead);
  });

  test('saves the edits to the target lead', async () => {
    const { cxLeadEdit, view } = createView();
    view.setTarget(TARGET);
    const request = {
      phoneNumbers: ['+16505550100'],
      fields: { firstName: 'Embbnux' },
    };

    await expect(view._onSave(request)).resolves.toBe(true);

    expect(cxLeadEdit.updateLead).toHaveBeenCalledWith({
      lead: TARGET.lead,
      ...request,
    });
  });

  test('reports a failed save', async () => {
    const { view } = createView({ updateResult: false });
    view.setTarget(TARGET);

    await expect(
      view._onSave({ phoneNumbers: [], fields: {} }),
    ).resolves.toBe(false);
  });

  test('does not save without a lead', async () => {
    const { cxLeadEdit, view } = createView();

    await expect(
      view._onSave({ phoneNumbers: [], fields: {} }),
    ).resolves.toBe(false);
    expect(cxLeadEdit.updateLead).not.toHaveBeenCalled();
  });
});
