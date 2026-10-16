import { isCxRecordingUrl } from '../../src/ringcx/lib/isCxRecordingUrl';
import { buildCxLeadInfoRows } from '../../src/ringcx/services/CxLeadInfo/buildCxLeadInfoRows';
import { getCxLeadAuxLabels } from '../../src/ringcx/services/CxLeadInfo/getCxLeadAuxLabels';
import { resolveCxCallLead } from '../../src/ringcx/services/CxLeadInfo/resolveCxCallLead';

const VRU_V1_URL =
  'https://c01-recordings.vacd.biz/api/v1/calls/recordings/?v=1&accountId=15520003&bucket=c01-recordings&region=eu-central-1&file=15520003/202412/23/1.WAV';
const VRU_V2_URL =
  'https://exs.ringcentral.com/cx/interactions/assets/v1/accounts/1/sub-accounts/2/dialogs/d-1/segments/s-1/type/AudioStereo';
const NO_AUX_LABELS = [undefined, undefined, undefined, undefined, undefined];

function buildRows(lead, options = {}) {
  return buildCxLeadInfoRows({
    lead: { leadId: '5725', ...lead },
    source: '',
    isCallLead: false,
    auxLabels: NO_AUX_LABELS,
    ...options,
  });
}

const rowIds = (rows) => rows.map((row) => row.id);

describe('isCxRecordingUrl', () => {
  test.each([
    ['a VRU v1 URL', VRU_V1_URL],
    ['a VRU v2 URL', VRU_V2_URL],
    [
      'a recording-access proxy wrapping one',
      `/cx/interactions/assets/delegate/v1/accounts/1/sub-accounts/2/agent/recording-access?fileUrl=${encodeURIComponent(
        VRU_V2_URL,
      )}&guid=abc`,
    ],
  ])('matches %s', (_name, value) => {
    expect(isCxRecordingUrl(value)).toBe(true);
  });

  test.each([
    ['an empty value', ''],
    ['plain text', 'Call Ctr 1'],
    ['a v2 URL missing its segment', 'https://exs.ringcentral.com/assets/v1/dialogs/d-1/type/AudioStereo'],
    ['a proxy URL wrapping a non-recording', '/recording-access?fileUrl=https%3A%2F%2Fexample.com'],
  ])('rejects %s', (_name, value) => {
    expect(isCxRecordingUrl(value)).toBe(false);
  });
});

describe('getCxLeadAuxLabels', () => {
  test('prefers the campaign label, then the call baggage, then the default', () => {
    expect(
      getCxLeadAuxLabels({
        campaignLabels: [
          { aux_1_label: 'Account' },
          { aux_2_label: '' },
          { aux_3_label: '' },
        ],
        baggageLabels: { aux_2_label: 'Region', aux_3_label: '' },
      }),
    ).toEqual(['Account', 'Region', undefined, undefined, undefined]);
  });

  test('keeps every default without labels', () => {
    expect(getCxLeadAuxLabels({})).toEqual(NO_AUX_LABELS);
  });
});

describe('buildCxLeadInfoRows', () => {
  test('orders the rows by card and drops the empty ones', () => {
    const rows = buildRows(
      {
        leadState: 'PENDING',
        leadPasses: '0',
        listDesc: 'Spring list',
        title: 'Dr',
        email: 'lead@example.com',
        city: '',
        state: 'CA',
        externId: '2',
        campaignId: '1',
        auxData1: 'BMAK',
        extraData: { Plan: 'Gold' },
      },
      { source: 'Spring campaign', leadState: 'RINGING' },
    );

    expect(rowIds(rows)).toEqual([
      'source',
      'leadState',
      'leadPasses',
      'listDesc',
      'title',
      'email',
      'state',
      'leadId',
      'externId',
      'auxData1',
      'extraData-Plan',
    ]);
    expect(rows.map((row) => row.group)).toEqual([
      'status',
      'status',
      'status',
      'status',
      'contact',
      'contact',
      'contact',
      'ids',
      'ids',
      'aux',
      'extra',
    ]);
    // The live state wins over the fetched one.
    expect(rows[1]).toEqual(
      expect.objectContaining({ labelKey: 'leadState', value: 'RINGING' }),
    );
  });

  test('gives the source, email, addresses and list description the full width', () => {
    const rows = buildRows(
      {
        listDesc: 'List',
        email: 'lead@example.com',
        address1: '1 Main St',
        address2: 'Suite 2',
        city: 'Belmont',
      },
      { source: 'A long campaign name' },
    );
    const wideIds = rows.filter((row) => row.wide).map((row) => row.id);

    expect(wideIds).toEqual(['source', 'listDesc', 'email', 'address1', 'address2']);
  });

  test('counts passes before the call for a call lead', () => {
    const [passes] = buildRows({ leadPasses: '1' }, { isCallLead: true });

    expect(passes).toEqual(
      expect.objectContaining({ id: 'leadPasses', labelKey: 'preCallLeadPasses' }),
    );
    expect(buildRows({ leadPasses: '1' })[0].labelKey).toBe('currentLeadPasses');
  });

  test('hides the passes and list description the call baggage turns off', () => {
    const rows = buildRows({
      leadPasses: '1',
      listDesc: 'List',
      showLeadPasses: false,
      showListName: false,
    });

    expect(rowIds(rows)).toEqual(['leadId']);
  });

  test('shows aux rows only for a campaign or queue lead, with admin labels', () => {
    expect(rowIds(buildRows({ auxData1: 'BMAK' }))).not.toContain('auxData1');

    const rows = buildRows(
      { sourceId: '7', auxData1: 'BMAK', auxData2: 'Call Ctr 1' },
      { auxLabels: ['Account', undefined, undefined, undefined, undefined] },
    );
    const auxRows = rows.filter((row) => row.group === 'aux');

    expect(auxRows).toEqual([
      expect.objectContaining({ label: 'Account', value: 'BMAK' }),
      expect.objectContaining({ labelKey: 'aux2', value: 'Call Ctr 1' }),
    ]);
  });

  test('keeps empty extra data under its own key', () => {
    const rows = buildRows({ extraData: { Notes: '' } });

    expect(rows.at(-1)).toEqual(
      expect.objectContaining({ id: 'extraData-Notes', label: 'Notes', value: '' }),
    );
  });

  test('marks recordings, which take the full width for their player', () => {
    const rows = buildRows({ extraData: { Message: VRU_V2_URL } });

    expect(rows.at(-1)).toEqual(
      expect.objectContaining({ isRecording: true, wide: true }),
    );
  });
});

describe('resolveCxCallLead', () => {
  const call = {
    ani: '6508446685',
    aniE164: '+16508446685',
    baggage: {
      leadId: '5725',
      firstName: 'Embbnux Labs',
      leadPasses: '0',
      sourceName: 'Inbound queue',
    },
    lead: { leadPhone: '6508446685', extraData: { Plan: 'Gold' } },
  };

  test('merges the baggage, dialed at the call number, with the call lead', () => {
    expect(resolveCxCallLead(call, [])).toEqual(
      expect.objectContaining({
        leadId: '5725',
        firstName: 'Embbnux Labs',
        destination: '+16508446685',
        sourceName: 'Inbound queue',
        extraData: { Plan: 'Gold' },
      }),
    );
  });

  test('overlays the fetched preview lead of the same id', () => {
    const previewLead = {
      leadId: 5725,
      requestId: 'request-1',
      campaignId: '1',
      leadState: 'ACTIVE',
      destination: '6508446685|6505550100',
    };

    expect(resolveCxCallLead(call, [previewLead])).toEqual(
      expect.objectContaining({
        leadId: '5725',
        requestId: 'request-1',
        campaignId: '1',
        destination: '6508446685|6505550100',
        firstName: 'Embbnux Labs',
      }),
    );
  });

  test('skips a call without a lead id', () => {
    expect(resolveCxCallLead({ ...call, baggage: {}, lead: {} }, [])).toBeNull();
    expect(resolveCxCallLead(undefined, [])).toBeNull();
  });

  test('takes the lead id from the call lead when the baggage has none', () => {
    const lead = resolveCxCallLead(
      { ...call, baggage: {}, lead: { leadId: '42', extraData: {} } },
      [],
    );

    expect(lead.leadId).toBe('42');
  });
});
