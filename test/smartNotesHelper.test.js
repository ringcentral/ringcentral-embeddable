import {
  createSmartNoteCallMetadata,
  createSmartNoteSession,
  mergeSmartNoteRecords,
  normalizeSmartNoteHtml,
  smartNoteHtmlToText,
} from '../src/app/services/SmartNotes/SmartNotes.helper';

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

  const HTML = '<p>Hello <strong>World</strong></p><ul><li>One</li><li>Two</li></ul>';

  describe('with DOMParser (browser tab)', () => {
    it('extracts text from normalized note html', () => {
      const text = smartNoteHtmlToText(normalizeSmartNoteHtml(HTML));
      expect(text).toContain('Hello **World**');
      expect(text).toContain('One');
      expect(text).toContain('Two');
    });

    it('returns an empty string for empty input', () => {
      expect(smartNoteHtmlToText('')).toBe('');
    });
  });

  describe('without DOMParser (SharedWorker)', () => {
    let originalDOMParser;

    beforeEach(() => {
      originalDOMParser = globalThis.DOMParser;
      // The worker has no DOM, so the fallback path must produce the same text.
      Reflect.deleteProperty(globalThis, 'DOMParser');
    });

    afterEach(() => {
      globalThis.DOMParser = originalDOMParser;
    });

    it('produces the same visible text as the DOM path', () => {
      const normalized = normalizeSmartNoteHtml(HTML);
      globalThis.DOMParser = originalDOMParser;
      const domText = smartNoteHtmlToText(normalized);
      Reflect.deleteProperty(globalThis, 'DOMParser');
      const workerText = smartNoteHtmlToText(normalized);

      const collapse = (value) => value.replace(/\s+/g, ' ').trim();
      expect(collapse(workerText)).toBe(collapse(domText));
    });

    it('strips tags and keeps list items on separate lines', () => {
      const text = smartNoteHtmlToText('<p>A</p><ul><li>B</li><li>C</li></ul>');
      expect(text).toContain('A');
      expect(text).toContain('B');
      expect(text).toContain('C');
      expect(text).not.toContain('<');
    });

    it('converts <br> to newlines', () => {
      expect(smartNoteHtmlToText('a<br>b<br />c')).toBe('a\nb\nc');
    });

    it('decodes named and numeric entities', () => {
      expect(smartNoteHtmlToText('&amp;&lt;&gt;&quot;&nbsp;x')).toBe('&<>" x');
      expect(smartNoteHtmlToText('&#65;&#x42;')).toBe('AB');
    });

    it('leaves unknown entities untouched', () => {
      expect(smartNoteHtmlToText('&notarealentity;')).toBe('&notarealentity;');
    });

    it('returns an empty string for empty input', () => {
      expect(smartNoteHtmlToText('')).toBe('');
    });
  });
});
