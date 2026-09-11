import { getVisibleTelephonySessionIds } from '../src/app/views/CallHistoryView/CallHistorySmartNotesQuery';

describe('call-history Smart Notes query', () => {
  test('selects the visible call range for embedded Smart Notes', () => {
    expect(
      getVisibleTelephonySessionIds(
        [
          { telephonySessionId: 'telephony-1' },
          {},
          { telephonySessionId: 'telephony-2' },
          { telephonySessionId: 'telephony-3' },
        ],
        1,
        2,
      ),
    ).toEqual(['telephony-2']);
  });
});
