jest.mock('../../src/ringcx/services/CxAuth', () => ({
  CxAuth: class CxAuth {},
}));

jest.mock('../../src/ringcx/services/CxClient', () => ({
  CxClient: class CxClient {},
}));

jest.mock('../../src/ringcx/services/CxLeadEdit', () => ({
  CxLeadEdit: class CxLeadEdit {},
}));

jest.mock('../../src/ringcx/services/CxLeads', () => ({
  CxLeads: class CxLeads {},
  PHONE_DELIMETER: '|',
}));

jest.mock('../../src/ringcx/services/CxPresence', () => ({
  CxPresence: class CxPresence {},
}));

const { CxLeadInfo } = require('../../src/ringcx/services/CxLeadInfo/CxLeadInfo');

const PREVIEW_LEAD = {
  leadId: '5725',
  requestId: 'request-1',
  firstName: 'Embbnux',
  lastName: 'Labs',
  campaignId: '1',
  leadState: 'PENDING',
  leadPasses: '0',
  destination: '6508446685|6505550100',
  destinationE164: '+16508446685|+16505550100',
};

const CALL_ID = 'uii-1$1';

const LEAD_CALL = {
  ani: '6508446685',
  aniE164: '+16508446685',
  baggage: {
    leadId: '5725',
    firstName: 'Embbnux',
    lastName: 'Labs',
    leadPasses: '1',
    sourceName: 'Spring queue',
    sourceType: 'INBOUND',
  },
  lead: { extraData: {} },
};

const NO_LEAD_CALL = { ani: '6505550199', baggage: {}, lead: { extraData: {} } };

function createLeadInfo({
  leads = [PREVIEW_LEAD],
  leadStatesMapping = {},
  callsMapping = { [CALL_ID]: LEAD_CALL },
  campaigns = [
    {
      campaignId: '1',
      campaignName: 'Spring campaign',
      customLabels: [{ aux_1_label: 'Account' }],
    },
  ],
  cxClient = {},
  // No saved edits: leads resolve as they are.
  cxLeadEdit = { applyEdits: (lead) => lead },
} = {}) {
  const cxLeads = { leads, leadStatesMapping };
  const cxPresence = { callsMapping };
  const cxAuth = {
    agentConfig: { outboundSettings: { availableCampaigns: campaigns } },
  };
  return new CxLeadInfo(cxLeads, cxPresence, cxAuth, cxClient, cxLeadEdit);
}

describe('CxLeadInfo', () => {
  describe('info', () => {
    test('resolves a fetched lead with its campaign and live state', () => {
      const leadInfo = createLeadInfo({
        leadStatesMapping: { 'request-1': 'RINGING' },
      });
      leadInfo.setTarget({ type: 'lead', requestId: 'request-1' });

      expect(leadInfo.info).toEqual(
        expect.objectContaining({
          name: 'Embbnux Labs',
          phoneNumbers: ['+16508446685', '+16505550100'],
          source: 'Spring campaign',
        }),
      );
      expect(leadInfo.info.rows).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 'leadState', value: 'RINGING' }),
          expect.objectContaining({
            id: 'leadPasses',
            labelKey: 'currentLeadPasses',
          }),
        ]),
      );
    });

    test('resolves a call lead, showing an inbound call queue as its source', () => {
      const leadInfo = createLeadInfo({ leads: [] });
      leadInfo.setTarget({ type: 'call', callId: CALL_ID });

      expect(leadInfo.info).toEqual(
        expect.objectContaining({
          name: 'Embbnux Labs',
          phoneNumbers: ['+16508446685'],
          source: 'Spring queue',
        }),
      );
      expect(leadInfo.info.rows).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'leadPasses',
            labelKey: 'preCallLeadPasses',
            value: '1',
          }),
        ]),
      );
    });

    test('labels aux data with the campaign labels', () => {
      const leadInfo = createLeadInfo({
        leads: [{ ...PREVIEW_LEAD, auxData1: 'BMAK' }],
      });
      leadInfo.setTarget({ type: 'lead', requestId: 'request-1' });

      expect(leadInfo.info.rows).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 'auxData1', label: 'Account' }),
        ]),
      );
    });

    test.each([
      ['no target', null],
      ['a lead no longer fetched', { type: 'lead', requestId: 'request-9' }],
      ['a call without a lead', { type: 'call', callId: 'uii-2$1' }],
    ])('is null for %s', (_name, target) => {
      const leadInfo = createLeadInfo({
        callsMapping: { [CALL_ID]: LEAD_CALL, 'uii-2$1': NO_LEAD_CALL },
      });
      leadInfo.setTarget(target);

      expect(leadInfo.info).toBeNull();
    });

    test('is null once the fetched lead is passed', () => {
      const leadInfo = createLeadInfo({
        leads: [{ ...PREVIEW_LEAD, completed: true }],
      });
      leadInfo.setTarget({ type: 'lead', requestId: 'request-1' });

      expect(leadInfo.info).toBeNull();
      expect(leadInfo.previewLead).toBeNull();
    });
  });

  test('gives the fetched lead only for a lead target', () => {
    const leadInfo = createLeadInfo();
    leadInfo.setTarget({ type: 'lead', requestId: 'request-1' });
    expect(leadInfo.previewLead).toBe(PREVIEW_LEAD);

    leadInfo.setTarget({ type: 'call', callId: CALL_ID });
    expect(leadInfo.previewLead).toBeNull();
  });

  test('tells which calls have a lead', () => {
    const leadInfo = createLeadInfo({
      callsMapping: { [CALL_ID]: LEAD_CALL, 'uii-2$1': NO_LEAD_CALL },
    });

    expect(leadInfo.canViewCallLead(CALL_ID)).toBe(true);
    expect(leadInfo.canViewCallLead('uii-2$1')).toBe(false);
    expect(leadInfo.canViewCallLead('')).toBe(false);
  });

  describe('followActivityCall', () => {
    const callsMapping = {
      [CALL_ID]: LEAD_CALL,
      'uii-2$1': { ...LEAD_CALL, baggage: { leadId: '9000' } },
      'uii-3$1': NO_LEAD_CALL,
    };

    test('switches a fetched lead to its own answered call', () => {
      const leadInfo = createLeadInfo({ callsMapping });
      leadInfo.setTarget({ type: 'lead', requestId: 'request-1' });

      leadInfo.followActivityCall(CALL_ID);

      expect(leadInfo.target).toEqual({ type: 'call', callId: CALL_ID });
    });

    test("keeps a fetched lead when another lead's call is answered", () => {
      const leadInfo = createLeadInfo({ callsMapping });
      const target = { type: 'lead', requestId: 'request-1' };
      leadInfo.setTarget(target);

      leadInfo.followActivityCall('uii-2$1');
      leadInfo.followActivityCall('');

      expect(leadInfo.target).toBe(target);
    });

    test('moves a call lead to the next call with a lead', () => {
      const leadInfo = createLeadInfo({ callsMapping });
      leadInfo.setTarget({ type: 'call', callId: CALL_ID });

      leadInfo.followActivityCall('uii-2$1');

      expect(leadInfo.target).toEqual({ type: 'call', callId: 'uii-2$1' });
    });

    test.each([
      ['the call activity finishes', ''],
      ['the next call has no lead', 'uii-3$1'],
    ])('drops a call lead when %s', (_name, callId) => {
      const leadInfo = createLeadInfo({ callsMapping });
      leadInfo.setTarget({ type: 'call', callId: CALL_ID });

      leadInfo.followActivityCall(callId);

      expect(leadInfo.target).toBeNull();
    });

    test('leaves the target alone for the same call', () => {
      const leadInfo = createLeadInfo({ callsMapping });
      const target = { type: 'call', callId: CALL_ID };
      leadInfo.setTarget(target);
      const setTarget = jest.spyOn(leadInfo, 'setTarget');

      leadInfo.followActivityCall(CALL_ID);

      expect(setTarget).not.toHaveBeenCalled();
      expect(leadInfo.target).toBe(target);
    });
  });

  describe('loadRecording', () => {
    const access = {
      url: 'https://cx.example.com/cx/interactions/assets/delegate/recording-access',
      authorization: 'Bearer token',
    };
    const originalFetch = global.fetch;
    const originalCreateObjectURL = URL.createObjectURL;

    beforeEach(() => {
      URL.createObjectURL = jest.fn(() => 'blob:recording');
    });

    afterEach(() => {
      global.fetch = originalFetch;
      URL.createObjectURL = originalCreateObjectURL;
    });

    test('loads the recording with the CX token into a blob URL', async () => {
      const blob = new Blob(['audio']);
      global.fetch = jest.fn(async () => ({ ok: true, blob: async () => blob }));
      const getRecordingAccess = jest.fn(async () => access);
      const leadInfo = createLeadInfo({ cxClient: { getRecordingAccess } });

      await expect(leadInfo.loadRecording('https://vru/url')).resolves.toBe(
        'blob:recording',
      );
      expect(getRecordingAccess).toHaveBeenCalledWith('https://vru/url');
      expect(global.fetch).toHaveBeenCalledWith(access.url, {
        headers: { Authorization: 'Bearer token' },
      });
      expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
    });

    test.each([
      ['refuses the token', async () => ({ ok: false, status: 401 })],
      [
        'cannot be reached',
        async () => {
          throw new TypeError('Failed to fetch');
        },
      ],
    ])('falls back to the proxy URL when it %s', async (_name, fetchImpl) => {
      global.fetch = jest.fn(fetchImpl);
      const leadInfo = createLeadInfo({
        cxClient: { getRecordingAccess: async () => access },
      });

      await expect(leadInfo.loadRecording('https://vru/url')).resolves.toBe(
        access.url,
      );
    });

    test('fails when the server port gives no access', async () => {
      const leadInfo = createLeadInfo({
        cxClient: { getRecordingAccess: async () => undefined },
      });

      await expect(leadInfo.loadRecording('https://vru/url')).rejects.toThrow(
        'Recording access is not available',
      );
    });
  });

  describe('saved edits', () => {
    test('shows a fetched lead with the fields the agent saved on it', () => {
      const applyEdits = jest.fn((lead) => ({
        ...lead,
        firstName: 'Edited',
        destinationE164: '+16505550111',
      }));
      const leadInfo = createLeadInfo({ cxLeadEdit: { applyEdits } });
      leadInfo.setTarget({ type: 'lead', requestId: 'request-1' });

      expect(leadInfo.info).toEqual(
        expect.objectContaining({
          name: 'Edited Labs',
          phoneNumbers: ['+16505550111'],
        }),
      );
      // The fetched lead's numeric id is read as text, as edits are keyed.
      expect(applyEdits).toHaveBeenCalledWith(
        expect.objectContaining({ leadId: '5725', requestId: 'request-1' }),
      );
    });

    test("applies them to a call's lead too", () => {
      const applyEdits = jest.fn((lead) => ({ ...lead, lastName: 'Edited' }));
      const leadInfo = createLeadInfo({ leads: [], cxLeadEdit: { applyEdits } });
      leadInfo.setTarget({ type: 'call', callId: CALL_ID });

      expect(leadInfo.info.name).toBe('Embbnux Edited');
      expect(applyEdits).toHaveBeenCalledWith(
        expect.objectContaining({ leadId: '5725' }),
      );
    });

    test('are not applied to a lead that no longer resolves', () => {
      const applyEdits = jest.fn((lead) => lead);
      const leadInfo = createLeadInfo({ cxLeadEdit: { applyEdits } });
      leadInfo.setTarget({ type: 'lead', requestId: 'request-9' });

      expect(leadInfo.info).toBeNull();
      expect(applyEdits).not.toHaveBeenCalled();
    });
  });

  describe('auxLabels', () => {
    test("gives the campaign's labels, for the update form", () => {
      const leadInfo = createLeadInfo();
      leadInfo.setTarget({ type: 'lead', requestId: 'request-1' });

      expect(leadInfo.info.auxLabels).toEqual([
        'Account',
        undefined,
        undefined,
        undefined,
        undefined,
      ]);
    });

    test("falls back to the call baggage's labels", () => {
      const leadInfo = createLeadInfo({
        leads: [],
        callsMapping: {
          [CALL_ID]: {
            ...LEAD_CALL,
            baggage: {
              ...LEAD_CALL.baggage,
              customLabels: { aux_2_label: 'Region' },
            },
          },
        },
      });
      leadInfo.setTarget({ type: 'call', callId: CALL_ID });

      expect(leadInfo.info.auxLabels).toEqual([
        undefined,
        'Region',
        undefined,
        undefined,
        undefined,
      ]);
    });
  });

  describe('getPastLeadRows', () => {
    const PAST_LEAD = {
      leadId: '5725',
      campaignId: '1',
      leadState: 'COMPLETE',
      leadPasses: '2',
      firstName: 'Embbnux',
      auxData1: 'BMAK',
      extraData: {},
    };

    test('shows the passes of an ended call as lead passes, with no source', () => {
      const rows = createLeadInfo().getPastLeadRows(PAST_LEAD, false);

      expect(rows.find((row) => row.id === 'source')).toBeUndefined();
      expect(rows).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 'leadState', value: 'COMPLETE' }),
          expect.objectContaining({
            id: 'leadPasses',
            labelKey: 'leadPasses',
            value: '2',
          }),
          expect.objectContaining({ id: 'auxData1', label: 'Account' }),
        ]),
      );
    });

    test('shows them as pre-call passes while the call is still active', () => {
      const rows = createLeadInfo().getPastLeadRows(PAST_LEAD, true);

      expect(rows).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'leadPasses',
            labelKey: 'preCallLeadPasses',
          }),
        ]),
      );
    });

    test('uses the default aux labels for a campaign the agent does not have', () => {
      const rows = createLeadInfo().getPastLeadRows(
        { ...PAST_LEAD, campaignId: '99' },
        false,
      );

      expect(rows).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 'auxData1', labelKey: 'aux1' }),
        ]),
      );
    });
  });

  describe('loadLeadHistory', () => {
    test("loads the lead's past attempts from the server port", async () => {
      const records = [{ passUii: 'uii-1', passNumber: '1' }];
      const getLeadHistory = jest.fn(async () => records);
      const leadInfo = createLeadInfo({ cxClient: { getLeadHistory } });

      await expect(leadInfo.loadLeadHistory('5725')).resolves.toBe(records);
      expect(getLeadHistory).toHaveBeenCalledWith('5725');
    });

    test('gives null when the server did not answer', async () => {
      const leadInfo = createLeadInfo({
        cxClient: { getLeadHistory: async () => null },
      });

      await expect(leadInfo.loadLeadHistory('5725')).resolves.toBeNull();
    });
  });
});
