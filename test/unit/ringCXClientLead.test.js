// LEAD-HISTORY and LEAD-UPDATE on the agent library. The library keeps one
// callback per response type and has no error path for either, so the client
// queues history requests, matches each answer to its lead, and gives up after
// a timeout.

import { CxClient } from '../../src/ringcx/services/CxClient/CxClient';

const LEAD_REQUEST_TIMEOUT = 10 * 1000;

const RECORD_A = { passUii: 'uii-a', passNumber: '1', passDisposition: 'ANSWER' };
const RECORD_B = { passUii: 'uii-b', passNumber: '2', passDisposition: 'BUSY' };

const FIELDS = {
  firstName: 'Ada',
  midName: 'M',
  lastName: 'Lovelace',
  suffix: 'Jr',
  title: 'Ms',
  address1: '1 Main St',
  address2: 'Suite 2',
  city: 'Belmont',
  state: 'CA',
  zip: '94002',
  email: 'ada@example.com',
  gateKeeper: 'Front desk',
  externId: 'ext-1',
  auxData1: 'a1',
  auxData2: 'a2',
  auxData3: 'a3',
  auxData4: 'a4',
  auxData5: 'a5',
};

/** The agent library, which keeps only the latest callback of each type. */
function createSdk() {
  const sdk = {
    historyCallback: null,
    updateCallback: null,
    leadHistory: jest.fn((_leadId, callback) => {
      sdk.historyCallback = callback;
    }),
    leadUpdate: jest.fn((...args) => {
      sdk.updateCallback = args[args.length - 1];
    }),
  };
  return sdk;
}

function createClient(sdk = createSdk()) {
  const client = Object.assign(Object.create(CxClient.prototype), {
    _sdk: sdk,
    _leadHistoryQueue: Promise.resolve(),
    _leadHistoryRequests: new Map(),
  });
  return { client, sdk };
}

/** Lets the queued request reach the agent library. */
async function flush() {
  for (let i = 0; i < 5; i += 1) {
    await Promise.resolve();
  }
}

afterEach(() => {
  jest.useRealTimers();
});

describe('CxClient.getLeadHistory', () => {
  test("resolves the lead's past attempts", async () => {
    const { client, sdk } = createClient();

    const history = client.getLeadHistory('5725');
    await flush();
    expect(sdk.leadHistory).toHaveBeenCalledWith('5725', expect.any(Function));
    sdk.historyCallback({ leadId: '5725', leadHistory: [RECORD_A] });

    await expect(history).resolves.toEqual([RECORD_A]);
  });

  test('resolves an empty history when the answer lists none', async () => {
    const { client, sdk } = createClient();

    const history = client.getLeadHistory('5725');
    await flush();
    sdk.historyCallback({ leadId: '5725' });

    await expect(history).resolves.toEqual([]);
  });

  test('joins a request already in flight for the same lead', async () => {
    const { client, sdk } = createClient();

    const first = client.getLeadHistory('5725');
    const second = client.getLeadHistory('5725');
    await flush();
    sdk.historyCallback({ leadId: '5725', leadHistory: [RECORD_A] });

    await expect(first).resolves.toEqual([RECORD_A]);
    await expect(second).resolves.toEqual([RECORD_A]);
    expect(sdk.leadHistory).toHaveBeenCalledTimes(1);
  });

  test('asks again once the previous request for the lead is over', async () => {
    const { client, sdk } = createClient();

    const first = client.getLeadHistory('5725');
    await flush();
    sdk.historyCallback({ leadId: '5725', leadHistory: [RECORD_A] });
    await first;
    const second = client.getLeadHistory('5725');
    await flush();
    sdk.historyCallback({ leadId: '5725', leadHistory: [RECORD_B] });

    await expect(second).resolves.toEqual([RECORD_B]);
    expect(sdk.leadHistory).toHaveBeenCalledTimes(2);
  });

  test('runs requests for different leads one after another', async () => {
    const { client, sdk } = createClient();

    const historyA = client.getLeadHistory('lead-a');
    const historyB = client.getLeadHistory('lead-b');
    await flush();
    // Lead B waits, or its callback would replace lead A's.
    expect(sdk.leadHistory.mock.calls.map(([leadId]) => leadId)).toEqual([
      'lead-a',
    ]);

    sdk.historyCallback({ leadId: 'lead-a', leadHistory: [RECORD_A] });
    await expect(historyA).resolves.toEqual([RECORD_A]);
    await flush();
    expect(sdk.leadHistory.mock.calls.map(([leadId]) => leadId)).toEqual([
      'lead-a',
      'lead-b',
    ]);
    sdk.historyCallback({ leadId: 'lead-b', leadHistory: [RECORD_B] });
    await expect(historyB).resolves.toEqual([RECORD_B]);
  });

  test('resolves null when the server does not answer in time', async () => {
    jest.useFakeTimers();
    const { client } = createClient();

    const history = client.getLeadHistory('5725');
    await flush();
    jest.advanceTimersByTime(LEAD_REQUEST_TIMEOUT);

    await expect(history).resolves.toBeNull();
  });

  test('ignores a late answer for a lead that already timed out', async () => {
    jest.useFakeTimers();
    const { client, sdk } = createClient();

    const historyA = client.getLeadHistory('lead-a');
    const historyB = client.getLeadHistory('lead-b');
    await flush();
    jest.advanceTimersByTime(LEAD_REQUEST_TIMEOUT);
    await expect(historyA).resolves.toBeNull();
    await flush();

    // Lead A's answer arrives on the callback lead B's request installed.
    sdk.historyCallback({ leadId: 'lead-a', leadHistory: [RECORD_A] });
    sdk.historyCallback({ leadId: 'lead-b', leadHistory: [RECORD_B] });

    await expect(historyB).resolves.toEqual([RECORD_B]);
  });

  test('matches an answer whose lead id is a number', async () => {
    const { client, sdk } = createClient();

    const history = client.getLeadHistory('5725');
    await flush();
    sdk.historyCallback({ leadId: 5725, leadHistory: [RECORD_A] });

    await expect(history).resolves.toEqual([RECORD_A]);
  });

  test('resolves null before the agent library is loaded', async () => {
    const { client } = createClient(null);

    await expect(client.getLeadHistory('5725')).resolves.toBeNull();
  });
});

describe('CxClient.updateLead', () => {
  test('sends the numbers pipe-joined, read as international, with the fields as baggage', () => {
    const { client, sdk } = createClient();

    void client.updateLead({
      leadId: '5725',
      phoneNumbers: ['+16508446685', '+16505550100'],
      fields: FIELDS,
    });

    expect(sdk.leadUpdate).toHaveBeenCalledWith(
      '5725',
      '+16508446685|+16505550100',
      '+16508446685|+16505550100',
      true,
      {
        first_name: 'Ada',
        mid_name: 'M',
        last_name: 'Lovelace',
        suffix: 'Jr',
        title: 'Ms',
        address1: '1 Main St',
        address2: 'Suite 2',
        city: 'Belmont',
        state: 'CA',
        zip: '94002',
        email: 'ada@example.com',
        gate_keeper: 'Front desk',
        extern_id: 'ext-1',
        aux_data1: 'a1',
        aux_data2: 'a2',
        aux_data3: 'a3',
        aux_data4: 'a4',
        aux_data5: 'a5',
      },
      expect.any(Function),
    );
  });

  test.each([[true], ['TRUE']])('reports success for status %p', async (status) => {
    const { client, sdk } = createClient();

    const result = client.updateLead({
      leadId: '5725',
      phoneNumbers: ['+16508446685'],
      fields: FIELDS,
    });
    sdk.updateCallback({ status });

    await expect(result).resolves.toEqual({ ok: true });
  });

  test.each([
    ['the detail', { status: false, detail: 'Lead locked', message: 'Error' }, 'Lead locked'],
    ['the message', { status: 'FALSE', message: 'Error' }, 'Error'],
    ['no reason', { status: false }, ''],
  ])('reports a failure with %s', async (_name, response, message) => {
    const { client, sdk } = createClient();

    const result = client.updateLead({
      leadId: '5725',
      phoneNumbers: ['+16508446685'],
      fields: FIELDS,
    });
    sdk.updateCallback(response);

    await expect(result).resolves.toEqual({ ok: false, message });
  });

  test('fails when the server does not answer in time', async () => {
    jest.useFakeTimers();
    const { client } = createClient();

    const result = client.updateLead({
      leadId: '5725',
      phoneNumbers: ['+16508446685'],
      fields: FIELDS,
    });
    jest.advanceTimersByTime(LEAD_REQUEST_TIMEOUT);

    await expect(result).resolves.toEqual({ ok: false });
  });

  test('fails before the agent library is loaded', async () => {
    const { client } = createClient(null);

    await expect(
      client.updateLead({
        leadId: '5725',
        phoneNumbers: ['+16508446685'],
        fields: FIELDS,
      }),
    ).resolves.toEqual({ ok: false });
  });
});
