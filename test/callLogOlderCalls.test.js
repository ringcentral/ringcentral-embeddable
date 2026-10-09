import { sleep } from '@ringcentral-integration/utils';

import { CallLog } from '../src/app/services/CallLog';

// Every micro-* services path maps to one mock module, so this factory serves
// them all; it only swaps in a base `CallLog` with the synced state the app
// subclass merges with, and the record normalizer it pages through.
jest.mock('@ringcentral-integration/micro-phone/src/app/services', () =>
  mockMicroServices(),
);

jest.mock('@ringcentral-integration/utils', () => ({
  sleep: jest.fn(async () => undefined),
}));

function mockMicroServices() {
  class BaseCallLog {
    constructor(
      auth,
      client,
      extensionPhoneNumber,
      extensionInfo,
      callMonitor,
      subscription,
      appFeatures,
    ) {
      this._auth = auth;
      this._client = client;
      this._appFeatures = appFeatures;
      this.status = 'ready';
      this.data = { list: [], map: {}, token: null, timestamp: null };
      this.baseCalls = [];
      this.baseSyncSuccess = jest.fn();
      this.logger = { error: jest.fn() };
    }

    get ready() {
      return this.status === 'ready';
    }

    get calls() {
      return this.baseCalls;
    }

    syncSuccess(options) {
      this.baseSyncSuccess(options);
    }

    _isCallVisibleInCallLogList(call) {
      return !call.hidden;
    }

    onReset() {}
  }
  return {
    ...jest.requireActual(
      '@ringcentral-integration/micro-phone/src/app/services',
    ),
    CallLog: BaseCallLog,
    processRecords: (records = []) =>
      records.map(({ uri, startTime, ...record }) => ({
        ...record,
        startTime: new Date(startTime).getTime(),
      })),
  };
}

const NOW = new Date('2026-10-01T12:00:00.000Z').getTime();
const DAY = 24 * 60 * 60 * 1000;
const LOOKBACK = 365 * DAY;
const iso = (time) => new Date(time).toISOString();

let phoneNumberSeed = 0;

/**
 * A call log record as the call log list API returns it.
 */
const apiRecord = (id, daysAgo, extra = {}) => {
  phoneNumberSeed += 1;
  return {
    id,
    sessionId: `session-${id}`,
    telephonySessionId: `telephony-${id}`,
    uri: `https://platform/call-log/${id}`,
    type: 'Voice',
    direction: 'Inbound',
    result: 'Accepted',
    startTime: iso(NOW - daysAgo * DAY),
    from: { phoneNumber: `+1650555${String(phoneNumberSeed).padStart(4, '0')}` },
    to: { phoneNumber: '+16505550000' },
    ...extra,
  };
};

/**
 * A call log record as the call log keeps it, with a numeric start time.
 */
const storedRecord = (id, daysAgo, extra = {}) => {
  const { uri, startTime, ...record } = apiRecord(id, daysAgo, extra);
  return { ...record, startTime: new Date(startTime).getTime() };
};

function createCallLog({ allowLoadMoreCalls = true } = {}) {
  const list = jest.fn(async () => ({ records: [], navigation: {} }));
  const client = {
    account: () => ({ extension: () => ({ callLog: () => ({ list }) }) }),
  };
  const auth = { loggedIn: true, ownerId: 'owner-1' };
  const appFeatures = { allowLoadMoreCalls };
  const callLog = new CallLog(
    auth,
    client,
    {},
    {},
    {},
    {},
    appFeatures,
  );
  return { auth, callLog, list };
}

function setSyncedCalls(callLog, calls) {
  callLog.baseCalls = calls;
  callLog.data = {
    ...callLog.data,
    list: calls.map((call) => call.id),
    map: Object.fromEntries(calls.map((call) => [call.id, call])),
  };
}

const ids = (calls) => calls.map((call) => call.id);

describe('CallLog sync filtering', () => {
  test('drops faxes and outbound IP Phone Offline records from a sync', () => {
    const { callLog } = createCallLog();
    const voice = storedRecord('voice', 1);
    const fax = storedRecord('fax', 1, { type: 'Fax' });
    const offline = storedRecord('offline', 1, {
      direction: 'Outbound',
      result: 'IP Phone Offline',
    });
    const inboundOffline = storedRecord('inbound-offline', 1, {
      result: 'IP Phone Offline',
    });

    callLog.syncSuccess({
      timestamp: NOW,
      syncToken: 'token',
      daySpan: 7,
      records: [voice, fax, offline, inboundOffline],
      supplementRecords: [fax, voice],
    });

    expect(callLog.baseSyncSuccess).toHaveBeenCalledWith({
      timestamp: NOW,
      syncToken: 'token',
      daySpan: 7,
      records: [voice, inboundOffline],
      supplementRecords: [voice],
    });
  });
});

describe('CallLog older calls', () => {
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(NOW);
    sleep.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('requests the page of voice calls before the oldest call listed', async () => {
    const { callLog, list } = createCallLog();
    setSyncedCalls(callLog, [storedRecord('1', 1), storedRecord('2', 5)]);
    list.mockImplementation(async () => {
      expect(callLog.loadingOlderCalls).toBe(true);
      return {
        records: [apiRecord('3', 9), apiRecord('4', 40)],
        navigation: { nextPage: { uri: 'next' } },
      };
    });

    await callLog.fetchOlderCalls();

    expect(list).toHaveBeenCalledWith({
      type: ['Voice'],
      perPage: 250,
      dateFrom: iso(NOW - 5 * DAY - LOOKBACK),
      dateTo: iso(NOW - 5 * DAY),
    });
    expect(ids(callLog.olderCalls)).toEqual(['3', '4']);
    expect(callLog.olderCalls[0].uri).toBeUndefined();
    expect(callLog.hasMoreOlderCalls).toBe(true);
    expect(callLog.loadingOlderCalls).toBe(false);
  });

  test('pages back from now when no call is listed', async () => {
    const { callLog, list } = createCallLog();

    await callLog.fetchOlderCalls();

    expect(list).toHaveBeenCalledWith(
      expect.objectContaining({ dateTo: iso(NOW) }),
    );
  });

  test('asks the server for one direction under a direction scope', async () => {
    const { callLog, list } = createCallLog();

    await callLog.fetchOlderCalls('Outbound');

    expect(list).toHaveBeenCalledWith(
      expect.objectContaining({ direction: ['Outbound'] }),
    );
    expect(callLog.olderCallsScope).toBe('Outbound');
  });

  test('drops faxes and outbound IP Phone Offline records from a page', async () => {
    const { callLog, list } = createCallLog();
    list.mockResolvedValue({
      records: [
        apiRecord('voice', 9),
        apiRecord('fax', 10, { type: 'Fax' }),
        apiRecord('offline', 11, {
          direction: 'Outbound',
          result: 'IP Phone Offline',
        }),
      ],
      navigation: {},
    });

    await callLog.fetchOlderCalls();

    expect(ids(callLog.olderCalls)).toEqual(['voice']);
  });

  test('pages on from the oldest call fetched so far', async () => {
    const { callLog, list } = createCallLog();
    // Filtered out of the list, but still the oldest call the page returned.
    list.mockResolvedValueOnce({
      records: [apiRecord('3', 9), apiRecord('4', 40, { type: 'Fax' })],
      navigation: { nextPage: { uri: 'next' } },
    });

    await callLog.fetchOlderCalls();
    await callLog.fetchOlderCalls();

    expect(list).toHaveBeenLastCalledWith(
      expect.objectContaining({ dateTo: iso(NOW - 40 * DAY) }),
    );
  });

  test('moves back past a page that repeats the cursor time', async () => {
    const { callLog, list } = createCallLog();
    setSyncedCalls(callLog, [storedRecord('1', 5)]);
    list.mockResolvedValueOnce({
      records: [apiRecord('1', 5)],
      navigation: { nextPage: { uri: 'next' } },
    });

    await callLog.fetchOlderCalls();
    await callLog.fetchOlderCalls();

    expect(list).toHaveBeenLastCalledWith(
      expect.objectContaining({ dateTo: iso(NOW - 5 * DAY - 1) }),
    );
  });

  test('stops paging once the server has no next page', async () => {
    const { callLog, list } = createCallLog();
    list.mockResolvedValueOnce({ records: [apiRecord('3', 9)], navigation: {} });

    await callLog.fetchOlderCalls();
    await callLog.fetchOlderCalls();

    expect(list).toHaveBeenCalledTimes(1);
    expect(callLog.hasMoreOlderCalls).toBe(false);
    expect(callLog.canLoadOlderCalls).toBe(false);
  });

  test('keeps one copy of a call fetched twice', async () => {
    const { callLog, list } = createCallLog();
    list.mockResolvedValue({
      records: [apiRecord('3', 9)],
      navigation: { nextPage: { uri: 'next' } },
    });

    await callLog.fetchOlderCalls();
    await callLog.fetchOlderCalls();

    expect(ids(callLog.olderCalls)).toEqual(['3']);
  });

  test.each([
    ['the feature is off', { allowLoadMoreCalls: false }, () => {}],
    [
      'the module is not ready',
      {},
      (callLog) => {
        callLog.status = 'pending';
      },
    ],
    [
      'the user logged out',
      {},
      (callLog) => {
        callLog._auth.loggedIn = false;
      },
    ],
    [
      'a page is already loading',
      {},
      (callLog) => {
        callLog.loadingOlderCalls = true;
      },
    ],
  ])('does not fetch when %s', async (_name, options, prepare) => {
    const { callLog, list } = createCallLog(options);
    prepare(callLog);

    await callLog.fetchOlderCalls();

    expect(list).not.toHaveBeenCalled();
  });

  test('spaces requests apart to stay under the call log rate limit', async () => {
    const { callLog, list } = createCallLog();
    list.mockResolvedValue({
      records: [],
      navigation: { nextPage: { uri: 'next' } },
    });

    await callLog.fetchOlderCalls();
    Date.now.mockReturnValue(NOW + 2000);
    await callLog.fetchOlderCalls();

    expect(sleep).toHaveBeenLastCalledWith(4000);
    expect(list).toHaveBeenCalledTimes(2);
  });

  test('waits before retrying a failed request', async () => {
    const { callLog, list } = createCallLog();
    const error = new Error('rate limited');
    list.mockRejectedValueOnce(error);

    await callLog.fetchOlderCalls();
    expect(callLog.logger.error).toHaveBeenCalledWith(
      'fetch older calls failed',
      error,
    );
    expect(callLog.loadingOlderCalls).toBe(false);

    await callLog.fetchOlderCalls();
    expect(list).toHaveBeenCalledTimes(1);

    Date.now.mockReturnValue(NOW + 30 * 1000);
    await callLog.fetchOlderCalls();
    expect(list).toHaveBeenCalledTimes(2);
  });

  test('discards a page that arrives after the user logged out', async () => {
    const { auth, callLog, list } = createCallLog();
    list.mockImplementation(async () => {
      auth.ownerId = 'owner-2';
      return { records: [apiRecord('3', 9)], navigation: {} };
    });

    await callLog.fetchOlderCalls();

    expect(callLog.olderCalls).toEqual([]);
    expect(callLog.hasMoreOlderCalls).toBe(true);
  });

  test('discards a page that arrives after the scope switched', async () => {
    const { callLog, list } = createCallLog();
    list.mockImplementation(async () => {
      await callLog.setOlderCallsScope('Outbound');
      return { records: [apiRecord('3', 9)], navigation: {} };
    });

    await callLog.fetchOlderCalls('Inbound');

    expect(callLog.olderCalls).toEqual([]);
    expect(callLog.olderCallsScope).toBe('Outbound');
  });

  test('keeps the loaded calls when narrowing from every direction', async () => {
    const { callLog, list } = createCallLog();
    list.mockResolvedValueOnce({
      records: [apiRecord('3', 9)],
      navigation: { nextPage: { uri: 'next' } },
    });
    await callLog.fetchOlderCalls();

    await callLog.fetchOlderCalls('Inbound');

    expect(ids(callLog.olderCalls)).toEqual(['3']);
    expect(list).toHaveBeenLastCalledWith(
      expect.objectContaining({
        dateTo: iso(NOW - 9 * DAY),
        direction: ['Inbound'],
      }),
    );
  });

  test('drops the loaded calls when leaving a direction scope', async () => {
    const { callLog, list } = createCallLog();
    list.mockResolvedValueOnce({ records: [apiRecord('3', 9)], navigation: {} });
    await callLog.fetchOlderCalls('Inbound');
    expect(callLog.hasMoreOlderCalls).toBe(false);

    await callLog.setOlderCallsScope('All');

    expect(callLog.olderCalls).toEqual([]);
    expect(callLog.olderCallsScope).toBe('All');
    expect(callLog.hasMoreOlderCalls).toBe(true);

    await callLog.fetchOlderCalls();
    expect(list).toHaveBeenLastCalledWith(
      expect.not.objectContaining({ direction: expect.anything() }),
    );
    expect(list).toHaveBeenLastCalledWith(
      expect.objectContaining({ dateTo: iso(NOW) }),
    );
  });

  test('clears the older calls on reset', async () => {
    const { callLog, list } = createCallLog();
    list.mockResolvedValueOnce({ records: [apiRecord('3', 9)], navigation: {} });
    await callLog.fetchOlderCalls('Inbound');

    callLog.onReset();

    expect(callLog.olderCalls).toEqual([]);
    expect(callLog.olderCallsScope).toBe('All');
    expect(callLog.hasMoreOlderCalls).toBe(true);
  });
});

describe('CallLog calls with older calls', () => {
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(NOW);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('keeps the upstream list until older calls are loaded', () => {
    const { callLog } = createCallLog();
    const capped = [storedRecord('1', 1)];
    setSyncedCalls(callLog, [storedRecord('1', 1), storedRecord('2', 2)]);
    callLog.baseCalls = capped;

    expect(callLog.calls).toBe(capped);
  });

  test('lists every synced call followed by the older ones', () => {
    const { callLog } = createCallLog();
    const synced = [storedRecord('1', 1), storedRecord('2', 2)];
    setSyncedCalls(callLog, synced);
    // The upstream list caps the synced calls; merged, none is left out.
    callLog.baseCalls = synced.slice(0, 1);
    callLog.olderCalls = [
      storedRecord('4', 20),
      storedRecord('2', 2),
      storedRecord('3', 9),
      storedRecord('hidden', 10, { hidden: true }),
    ];

    expect(ids(callLog.calls)).toEqual(['1', '2', '3', '4']);
  });

  test('moves synced calls that expire into the older calls once any are loaded', () => {
    const { callLog } = createCallLog();
    const recent = storedRecord('1', 1);
    const expiring = storedRecord('2', 10);
    setSyncedCalls(callLog, [recent, expiring]);
    callLog.olderCalls = [storedRecord('3', 20)];

    callLog.syncSuccess({ timestamp: NOW, daySpan: 7, records: [] });

    expect(ids(callLog.olderCalls)).toEqual(['3', '2']);
  });

  test('lets synced calls expire while no older call is loaded', () => {
    const { callLog } = createCallLog();
    setSyncedCalls(callLog, [storedRecord('1', 1), storedRecord('2', 10)]);

    callLog.syncSuccess({ timestamp: NOW, daySpan: 7, records: [] });

    expect(callLog.olderCalls).toEqual([]);
  });
});
