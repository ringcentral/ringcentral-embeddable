const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** A note body is HTML: escape the typed text and keep its line breaks. */
export function textToNoteHtml(text: string): string {
  return text
    .replace(/[&<>"']/g, (char) => HTML_ESCAPES[char])
    .replace(/\r?\n/g, '<br>');
}
