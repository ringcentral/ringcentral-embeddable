import { noteHtmlToText } from '../../src/app/views/TeamMessagingView/components/notes/noteHtmlToText';
import { textToNoteHtml } from '../../src/app/views/TeamMessagingView/components/notes/textToNoteHtml';

describe('textToNoteHtml', () => {
  test('escapes HTML characters', () => {
    expect(textToNoteHtml(`a & b <c> "d" 'e'`)).toBe(
      'a &amp; b &lt;c&gt; &quot;d&quot; &#39;e&#39;',
    );
  });

  test('keeps line breaks as <br>', () => {
    expect(textToNoteHtml('one\ntwo\r\nthree')).toBe('one<br>two<br>three');
    expect(textToNoteHtml('')).toBe('');
  });
});

describe('noteHtmlToText', () => {
  test('turns line breaks into newlines and decodes entities', () => {
    expect(noteHtmlToText('one<br>two<br/>three<br />four<BR>five')).toBe(
      'one\ntwo\nthree\nfour\nfive',
    );
    expect(noteHtmlToText('a &amp; b &lt;c&gt; &quot;d&quot; &#39;e&#39;')).toBe(
      `a & b <c> "d" 'e'`,
    );
    expect(noteHtmlToText('')).toBe('');
  });

  test('returns null for bodies with formatting', () => {
    expect(noteHtmlToText('<b>bold</b>')).toBeNull();
    expect(noteHtmlToText('<p>para</p>')).toBeNull();
    expect(noteHtmlToText('text<br>more<div>x</div>')).toBeNull();
    expect(noteHtmlToText('<img src=x onerror=alert(1)>')).toBeNull();
  });

  test('round trips typed text', () => {
    [
      'Tom & Jerry',
      '<script>alert("x")</script>',
      `It's "quoted"`,
      'line 1\nline 2\n\nline 4',
      '&amp; already escaped',
    ].forEach((text) => {
      expect(noteHtmlToText(textToNoteHtml(text))).toBe(text);
    });
    expect(noteHtmlToText(textToNoteHtml('a\r\nb'))).toBe('a\nb');
  });
});
