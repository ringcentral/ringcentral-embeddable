import {
  createSmartNoteCallMetadata,
  createSmartNoteSession,
  mergeSmartNoteRecords,
  normalizeSmartNoteHtml,
} from '../../next/app/services/SmartNotes/SmartNotes.helper';

describe('SmartNotes helpers', () => {
  test('creates outbound sessions and call metadata', () => {
    const smartNoteSession = createSmartNoteSession(
      {
        partyData: { sessionId: 'telephony-session' },
        direction: 'Outbound',
        to: '+16505550100',
        toUserName: 'Ada Lovelace',
        startTime: '2026-01-01T00:00:00.000Z',
      },
      { id: 'contact-id', name: 'Ada' },
    );

    expect(smartNoteSession).toEqual({
      id: 'telephony-session',
      status: 'Answered',
      phoneNumber: '+16505550100',
      contact: { id: 'contact-id', name: 'Ada' },
      direction: 'Outbound',
      startTime: '2026-01-01T00:00:00.000Z',
    });
    expect(createSmartNoteCallMetadata(smartNoteSession)).toEqual({
      startTime: '2026-01-01T00:00:00.000Z',
      direction: 'Outbound',
      to: { phoneNumber: '+16505550100', name: 'Ada' },
    });
  });

  test('returns null when a Webphone session has no telephony session id', () => {
    expect(
      createSmartNoteSession({
        direction: 'Inbound',
        from: '+16505550101',
      }),
    ).toBeNull();
  });

  test('creates inbound sessions with fallback contact data and a generated time', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-02-01T00:00:00.000Z'));

    expect(
      createSmartNoteSession({
        partyData: { sessionId: 'inbound-session' },
        direction: 'Inbound',
        from: '+16505550101',
        fromUserName: 'Caller',
      }),
    ).toEqual({
      id: 'inbound-session',
      status: 'Answered',
      phoneNumber: '+16505550101',
      contact: { name: 'Caller', phoneNumber: '+16505550101' },
      direction: 'Inbound',
      startTime: '2026-02-01T00:00:00.000Z',
    });

    jest.useRealTimers();
  });

  test('creates inbound call metadata with empty participant fallbacks', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-02-01T00:00:00.000Z'));

    expect(createSmartNoteCallMetadata({ direction: 'Inbound' })).toEqual({
      startTime: '2026-02-01T00:00:00.000Z',
      direction: 'Inbound',
      from: { phoneNumber: '', name: '' },
    });

    jest.useRealTimers();
  });

  test('merges records by id and enforces the cache limit', () => {
    expect(
      mergeSmartNoteRecords(
        [
          { id: 'one', value: 'old' },
          { id: 'two', value: 'two' },
        ],
        [
          { id: 'one', value: 'new' },
          { id: 'three', value: 'three' },
        ],
        3,
      ),
    ).toEqual([
      { id: 'one', value: 'new' },
      { id: 'three', value: 'three' },
      { id: 'two', value: 'two' },
    ]);
  });

  test('normalizes note markup before extracting text', () => {
    expect(
      normalizeSmartNoteHtml(
        '<p><strong>Summary</strong></p><ul><li>Follow up</li></ul>',
      ),
    ).toBe('<p>**Summary**</p>\n<ul>\n<li>Follow up</li>\n</ul>\n');
    expect(normalizeSmartNoteHtml('<ol><li>One</li></ol>\n')).toBe(
      '<ol>\n<li>One</li>\n</ol>\n',
    );
  });
});
