// Edits an agent saves on a lead. The server sends no notification after
// LEAD-UPDATE, and a call's lead comes from baggage that never changes, so the
// saved fields are kept by lead id and laid over the lead until logout.

jest.mock('@ringcentral-integration/micro-core/src/app/services', () => ({
  Toast: class Toast {},
}));
jest.mock('../../src/ringcx/components/LeadInfoPanel/i18n', () => ({
  t: (key) => key,
}));
jest.mock('../../src/ringcx/services/CxAuth', () => ({ CxAuth: class {} }));
jest.mock('../../src/ringcx/services/CxClient', () => ({ CxClient: class {} }));
jest.mock('../../src/ringcx/services/CxLeads', () => ({
  CxLeads: class {},
  PHONE_DELIMETER: '|',
}));

import { CxLeadEdit } from '../../src/ringcx/services/CxLeadEdit/CxLeadEdit';

const LEAD = {
  leadId: '5725',
  campaignId: '1',
  firstName: 'Ada',
  lastName: 'Lovelace',
  city: 'Belmont',
};

const FIELDS = {
  firstName: 'Grace',
  midName: '',
  lastName: 'Hopper',
  suffix: '',
  title: '',
  address1: '',
  address2: '',
  city: 'Arlington',
  state: 'VA',
  zip: '',
  email: '',
  gateKeeper: '',
  auxData1: '',
  auxData2: '',
  auxData3: '',
  auxData4: '',
  auxData5: '',
};

function createLeadEdit({
  allowLeadUpdatesByCampaign = { 1: '1' },
  updateResult = { ok: true },
  leads = [],
  shared = false,
} = {}) {
  let logoutCallback;
  const cxClient = { updateLead: jest.fn(async () => updateResult) };
  const cxAuth = {
    agentPermissions: { allowLeadUpdatesByCampaign },
    beforeAgentLogout: jest.fn((callback) => {
      logoutCallback = callback;
    }),
  };
  const cxLeads = {
    leads,
    updateLead: jest.fn(),
    notifyLeadUpdated: jest.fn(),
  };
  const toast = { success: jest.fn(), danger: jest.fn() };
  let serverCallback;
  const portManager = {
    shared,
    onServer: jest.fn((callback) => {
      serverCallback = callback;
    }),
  };
  const leadEdit = new CxLeadEdit(cxClient, cxAuth, cxLeads, toast, portManager);
  return {
    cxAuth,
    cxClient,
    cxLeads,
    leadEdit,
    logout: () => logoutCallback?.(),
    runServer: () => serverCallback?.(),
    toast,
  };
}

describe('CxLeadEdit.getPermission', () => {
  test.each([
    ['every field', '1', 'all'],
    ['every field but the phone', '2', 'noPhone'],
    ['nothing', '0', 'none'],
  ])("lets the agent change %s when the lead's campaign says %p", (_name, value, permission) => {
    const { leadEdit } = createLeadEdit({
      allowLeadUpdatesByCampaign: { 1: value },
    });

    expect(leadEdit.getPermission(LEAD)).toBe(permission);
  });

  test('reads only the setting of the lead campaign', () => {
    const { leadEdit } = createLeadEdit({
      allowLeadUpdatesByCampaign: { 2: '1' },
    });

    expect(leadEdit.getPermission(LEAD)).toBe('none');
    expect(leadEdit.getPermission({ ...LEAD, campaignId: '2' })).toBe('all');
  });

  test('does not edit a lead without a campaign, such as an inbound call lead', () => {
    const { leadEdit } = createLeadEdit();

    expect(leadEdit.getPermission({ ...LEAD, campaignId: undefined })).toBe(
      'none',
    );
    expect(leadEdit.getPermission(null)).toBe('none');
  });

  test('does not edit without the agent permissions', () => {
    const { cxAuth, leadEdit } = createLeadEdit();
    cxAuth.agentPermissions = undefined;

    expect(leadEdit.getPermission(LEAD)).toBe('none');
  });
});

describe('CxLeadEdit.updateLead', () => {
  test('saves the lead, then lays the saved fields over it wherever it shows', async () => {
    const { cxClient, cxLeads, leadEdit, toast } = createLeadEdit();

    await expect(
      leadEdit.updateLead({
        lead: LEAD,
        phoneNumbers: ['+16508446685', '+16505550100'],
        fields: FIELDS,
      }),
    ).resolves.toBe(true);

    expect(cxClient.updateLead).toHaveBeenCalledWith({
      leadId: '5725',
      phoneNumbers: ['+16508446685', '+16505550100'],
      fields: FIELDS,
    });
    expect(leadEdit.applyEdits(LEAD)).toEqual(
      expect.objectContaining({
        leadId: '5725',
        firstName: 'Grace',
        lastName: 'Hopper',
        city: 'Arlington',
        destination: '+16508446685|+16505550100',
        destinationE164: '+16508446685|+16505550100',
      }),
    );
    expect(cxLeads.notifyLeadUpdated).toHaveBeenCalledWith(
      expect.objectContaining({ leadId: '5725', firstName: 'Grace' }),
    );
    expect(toast.success).toHaveBeenCalledWith({ message: 'leadUpdated' });
  });

  test('updates the lead in the Leads list too', async () => {
    const { cxLeads, leadEdit } = createLeadEdit({
      leads: [{ leadId: 5725 }],
    });

    await leadEdit.updateLead({
      lead: LEAD,
      phoneNumbers: ['+16508446685'],
      fields: FIELDS,
    });

    expect(cxLeads.updateLead).toHaveBeenCalledWith(
      5725,
      expect.objectContaining({
        firstName: 'Grace',
        destination: '+16508446685',
      }),
    );
  });

  test('leaves the Leads list alone for a lead it does not hold', async () => {
    const { cxLeads, leadEdit } = createLeadEdit({ leads: [{ leadId: 1 }] });

    await leadEdit.updateLead({
      lead: LEAD,
      phoneNumbers: ['+16508446685'],
      fields: FIELDS,
    });

    expect(cxLeads.updateLead).not.toHaveBeenCalled();
  });

  test("shows the server's reason and keeps the lead when the update fails", async () => {
    const { cxLeads, leadEdit, toast } = createLeadEdit({
      updateResult: { ok: false, message: 'Lead locked' },
    });

    await expect(
      leadEdit.updateLead({
        lead: LEAD,
        phoneNumbers: ['+16508446685'],
        fields: FIELDS,
      }),
    ).resolves.toBe(false);

    expect(toast.danger).toHaveBeenCalledWith({ message: 'Lead locked' });
    expect(leadEdit.applyEdits(LEAD)).toBe(LEAD);
    expect(cxLeads.notifyLeadUpdated).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });

  test('falls back to a generic failure message', async () => {
    const { leadEdit, toast } = createLeadEdit({ updateResult: { ok: false } });

    await leadEdit.updateLead({
      lead: LEAD,
      phoneNumbers: ['+16508446685'],
      fields: FIELDS,
    });

    expect(toast.danger).toHaveBeenCalledWith({ message: 'leadUpdateFailed' });
  });
});

describe('CxLeadEdit.applyEdits', () => {
  test('returns a lead without saved edits as it is', () => {
    const { leadEdit } = createLeadEdit();

    expect(leadEdit.applyEdits(LEAD)).toBe(LEAD);
  });

  test('keeps the edits of each lead apart', async () => {
    const { leadEdit } = createLeadEdit();
    const otherLead = { ...LEAD, leadId: '9000' };

    await leadEdit.updateLead({
      lead: LEAD,
      phoneNumbers: ['+16508446685'],
      fields: FIELDS,
    });

    expect(leadEdit.applyEdits(otherLead)).toBe(otherLead);
  });
});

describe('CxLeadEdit on logout', () => {
  test('drops the saved edits when the agent logs out', async () => {
    const { leadEdit, logout } = createLeadEdit();
    await leadEdit.updateLead({
      lead: LEAD,
      phoneNumbers: ['+16508446685'],
      fields: FIELDS,
    });

    logout();

    expect(leadEdit.applyEdits(LEAD)).toBe(LEAD);
  });

  test('binds the logout on the server port in a shared app', async () => {
    const { cxAuth, leadEdit, logout, runServer } = createLeadEdit({
      shared: true,
    });
    expect(cxAuth.beforeAgentLogout).not.toHaveBeenCalled();

    runServer();
    await leadEdit.updateLead({
      lead: LEAD,
      phoneNumbers: ['+16508446685'],
      fields: FIELDS,
    });
    logout();

    expect(leadEdit.applyEdits(LEAD)).toBe(LEAD);
  });
});
