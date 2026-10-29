const LINE_BREAK = /<br\s*\/?>/gi;

const TAG = /<[^>]*>/;

/**
 * A note body as plain text, or `null` when it has formatting the plain text
 * would lose. Plain bodies are text with line breaks, as notes created here
 * are.
 */
export function noteHtmlToText(html: string): string | null {
  const withLines = html.replace(LINE_BREAK, '\n');
  if (TAG.test(withLines)) {
    return null;
  }
  // Decode entities, such as `&amp;`, without rendering anything.
  const document = new DOMParser().parseFromString(withLines, 'text/html');
  return document.body.textContent ?? '';
}
