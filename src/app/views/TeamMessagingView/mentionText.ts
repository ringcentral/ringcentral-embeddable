/** A person mentioned in the composer, shown as "@name" until sent. */
export interface ComposerMention {
  id: string;
  name: string;
}

/** "@" at the start of the text or after a space, then the typed query. */
const MENTION_QUERY_PATTERN = /(^|\s)@([^\s@]*)$/;

/**
 * The mention being typed before the caret: its query and where its "@" is,
 * or `null` when the caret is not in one.
 */
export function getMentionQuery(
  text: string,
  caret: number,
): { query: string; start: number } | null {
  const match = MENTION_QUERY_PATTERN.exec(text.slice(0, caret));
  if (!match) {
    return null;
  }
  return { query: match[2], start: match.index + match[1].length };
}

/** Replace the typed "@query" with "@name ". Returns the text and new caret. */
export function insertMention({
  text,
  start,
  caret,
  name,
}: {
  text: string;
  start: number;
  caret: number;
  name: string;
}): { text: string; caret: number } {
  const mentionText = `@${name} `;
  return {
    text: `${text.slice(0, start)}${mentionText}${text.slice(caret)}`,
    caret: start + mentionText.length,
  };
}

/**
 * Turn each "@name" still in the text into a `![:Person](id)` token, the
 * format the API expects.
 */
export function serializeMentions(
  text: string,
  mentions: readonly ComposerMention[],
): string {
  return mentions.reduce((result, mention) => {
    const mentionText = `@${mention.name}`;
    const index = result.indexOf(mentionText);
    if (index === -1) {
      return result;
    }
    return `${result.slice(0, index)}![:Person](${mention.id})${result.slice(
      index + mentionText.length,
    )}`;
  }, text);
}
