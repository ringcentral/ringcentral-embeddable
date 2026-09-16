import callDirections from '@ringcentral-integration/commons/enums/callDirections';

import type {
  SmartNoteCallMetadata,
  SmartNoteContact,
  SmartNoteSession,
  WebphoneSmartNoteSession,
} from './SmartNotes.interface';

export function createSmartNoteSession(
  session: WebphoneSmartNoteSession,
  matchedContact?: SmartNoteContact,
): SmartNoteSession | null {
  const id = session.partyData?.sessionId;
  if (!id) {
    return null;
  }
  const isOutbound = session.direction === callDirections.outbound;
  const phoneNumber = isOutbound ? session.to : session.from;
  const fallbackName = isOutbound ? session.toUserName : session.fromUserName;
  const startTime = session.startTime
    ? new Date(session.startTime).toISOString()
    : new Date().toISOString();
  return {
    id,
    status: 'Answered',
    phoneNumber,
    contact: matchedContact ?? {
      name: fallbackName,
      phoneNumber,
    },
    direction: session.direction,
    startTime,
  };
}

export function createSmartNoteCallMetadata(
  session: SmartNoteSession,
): SmartNoteCallMetadata {
  const metadata: SmartNoteCallMetadata = {
    startTime: session.startTime ?? new Date().toISOString(),
    direction: session.direction,
  };
  const participant = {
    phoneNumber: session.phoneNumber ?? '',
    name: session.contact?.name ?? '',
  };
  if (session.direction === callDirections.outbound) {
    metadata.to = participant;
  } else {
    metadata.from = participant;
  }
  return metadata;
}

export function mergeSmartNoteRecords<T extends { id: string }>(
  currentRecords: T[],
  incomingRecords: T[],
  limit: number,
): T[] {
  const incomingIds = new Set(incomingRecords.map(({ id }) => id));
  return [
    ...incomingRecords,
    ...currentRecords.filter(({ id }) => !incomingIds.has(id)),
  ].slice(0, limit);
}

export function normalizeSmartNoteHtml(html: string): string {
  return html
    .replace(/<strong>/g, '**')
    .replace(/<\/strong>/g, '**')
    .replace(/<\/p>(?!\n)/g, '</p>\n')
    .replace(/<\/li>(?!\n)/g, '</li>\n')
    .replace(/<ul>(?!\n)/g, '<ul>\n')
    .replace(/<\/ul>(?!\n)/g, '</ul>\n')
    .replace(/<ol>(?!\n)/g, '<ol>\n')
    .replace(/<\/ol>(?!\n)/g, '</ol>\n');
}

const HTML_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

const decodeHtmlEntities = (value: string): string =>
  value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity: string) => {
    if (entity.startsWith('#x') || entity.startsWith('#X')) {
      const code = Number.parseInt(entity.slice(2), 16);
      return Number.isNaN(code) ? match : String.fromCodePoint(code);
    }
    if (entity.startsWith('#')) {
      const code = Number.parseInt(entity.slice(1), 10);
      return Number.isNaN(code) ? match : String.fromCodePoint(code);
    }
    return HTML_ENTITIES[entity.toLowerCase()] ?? match;
  });

/**
 * Extracts plain text from smart-note HTML.
 *
 * Uses `DOMParser` when a document is available and falls back to string
 * processing otherwise, so notes can also be fetched from the SharedWorker,
 * which has no DOM.
 */
export function smartNoteHtmlToText(html: string): string {
  if (typeof DOMParser !== 'undefined') {
    return (
      new DOMParser().parseFromString(html, 'text/html').body.textContent ?? ''
    );
  }
  return decodeHtmlEntities(
    html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(?:p|div|li|h[1-6]|tr)>/gi, '\n')
      .replace(/<[^>]*>/g, ''),
  );
}
