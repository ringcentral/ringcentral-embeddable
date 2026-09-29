import { callDirection } from '../../enums';
import { formatPhoneNumber } from '../../lib/FormatPhoneNumber/formatPhoneNumber';
import { OutboundType } from '../CxClient/interfaces';
import type { HistoryItemResponse } from '../CxClient/interfaces';
import type {
  ActivityMatch,
  ContactMatch,
  FormattedCall,
} from './CxCallHistory.interface';

/**
 * Maps a server call-history record onto the `FormattedCall` shape the list and
 * detail views already consume.
 *
 * Kept free of decorators, module state and `this` so it can be unit tested
 * without bootstrapping the DI container.
 */

/** Separates the two halves of a history row id. */
const ID_SEPARATOR = '$$';

const UNKNOWN_DISPLAY_NAME = 'unknown';
const TRUNK_DISPLAY_NAME_PREFIX = 'trunk:';

/**
 * The server exposes no contact-matching data, and `useConnector` shallow
 * compares, so every call shares one frozen empty array rather than allocating
 * a new one per row.
 */
const EMPTY_MATCHES = Object.freeze([]) as unknown as ContactMatch[];
const EMPTY_ACTIVITY_MATCHES = Object.freeze([]) as unknown as ActivityMatch[];

export interface FormatHistoryCallOptions {
  currentLocale?: string;
  countryCode?: string;
  /** Localized label used when an outbound call has no queue or campaign. */
  manualLabel?: string;
}

const normalizeText = (value: string | null | undefined) =>
  value?.trim().toLocaleLowerCase() || '';

const normalizeDigits = (value: string | null | undefined) =>
  value?.replace(/\D/g, '') || '';

/**
 * Build the id for a history row.
 *
 * Uses the same two components the web agent hashes, without the hash: both are
 * URL-safe, and keeping them readable lets the detail and call-log views
 * recover the segment id for the activity lookup.
 */
export function makeHistoryCallId(item: HistoryItemResponse): string {
  return `${item.agentSegment?.segmentId ?? ''}${ID_SEPARATOR}${item.dialog?.uii ?? ''}`;
}

/**
 * Recover the segment id and uii from a history row id.
 *
 * Splits on the first separator: a segment id never contains `$`, so anything
 * after it belongs to the uii.
 */
export function parseHistoryCallId(id: string): {
  segmentId: string;
  uii: string;
} {
  const index = id?.indexOf(ID_SEPARATOR) ?? -1;
  if (index === -1) {
    return { segmentId: '', uii: id || '' };
  }
  return {
    segmentId: id.slice(0, index),
    uii: id.slice(index + ID_SEPARATOR.length),
  };
}

/** A lead's name, for outbound campaign calls. */
export function getHistoryLeadName(
  outbound: HistoryItemResponse['outbound'],
): string {
  if (outbound?.type !== OutboundType.LEAD) {
    return '';
  }
  const lead = outbound.lead;
  return [lead?.firstName, lead?.midName, lead?.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();
}

/**
 * Whether a display name is a placeholder rather than a person.
 *
 * The platform sends the literal "unknown" and `trunk:`-prefixed carrier labels
 * where it has no caller name; showing either is worse than showing the number.
 */
export function isInvalidHistoryDisplayName(displayName: string): boolean {
  const normalized = normalizeText(displayName);
  return (
    normalized === UNKNOWN_DISPLAY_NAME ||
    normalized.startsWith(TRUNK_DISPLAY_NAME_PREFIX)
  );
}

/**
 * Resolve what to show as the caller/callee name.
 *
 * A lead name wins outright. Otherwise the display name is used only if it
 * names a person: the platform also echoes the queue name, the campaign name or
 * the number itself into this field, none of which is worth showing twice.
 */
export function getHistoryDisplayName(
  item: HistoryItemResponse,
  formattedPhoneNumber: string,
): string {
  const leadName = getHistoryLeadName(item.outbound);
  if (leadName) {
    return leadName;
  }

  const displayName = item.dialog?.sessionInformation?.displayName?.trim() || '';
  if (!displayName || isInvalidHistoryDisplayName(displayName)) {
    return '';
  }

  const phoneNumber = item.dialog?.sessionInformation?.phoneNumber;
  const sourceNames = [
    item.agentSegment?.queue?.queueName,
    item.outbound?.campaignName,
    formattedPhoneNumber,
  ].map(normalizeText);
  if (sourceNames.includes(normalizeText(displayName))) {
    return '';
  }

  const displayNameDigits = normalizeDigits(displayName);
  if (
    displayNameDigits &&
    (displayNameDigits === normalizeDigits(phoneNumber) ||
      displayNameDigits === normalizeDigits(formattedPhoneNumber))
  ) {
    return '';
  }

  return displayName;
}

/** Secondary line: the queue, else the campaign, else a "Manual" label. */
export function getHistoryInfoLine(
  item: HistoryItemResponse,
  manualLabel?: string,
): string | undefined {
  return (
    item.agentSegment?.queue?.queueName ||
    item.outbound?.campaignName ||
    (item.outbound?.type === OutboundType.MANUAL ? manualLabel : undefined) ||
    undefined
  );
}

function parseTimestamp(value: string | null | undefined): number {
  if (!value) return 0;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

/**
 * Call length in milliseconds.
 *
 * Prefers the segment interval, which is exact; `duration` is only a fallback
 * for segments the server reports without an end time.
 */
function getDurationMs(agentSegment: HistoryItemResponse['agentSegment']): number {
  const start = parseTimestamp(agentSegment?.segmentStart);
  const end = parseTimestamp(agentSegment?.segmentEnd);
  if (start && end && end >= start) {
    return end - start;
  }
  return (agentSegment?.duration ?? 0) * 1000;
}

export function formatHistoryCall(
  item: HistoryItemResponse,
  options: FormatHistoryCallOptions = {},
): FormattedCall {
  const { currentLocale, countryCode = 'US', manualLabel } = options;
  const { agentSegment, dialog } = item;
  const sessionInformation = dialog?.sessionInformation;

  const isOutbound = dialog?.dialogOrigination === 'OUTBOUND';
  const direction = isOutbound ? callDirection.outbound : callDirection.inbound;

  // Guarded because `formatPhoneNumber` renders a localized "unknown" for an
  // empty input, which would read as a contact name here.
  const rawPhoneNumber = sessionInformation?.phoneNumber || '';
  const contactNumber = rawPhoneNumber
    ? formatPhoneNumber({
        phoneNumber: rawPhoneNumber,
        countryCode,
        currentLocale,
      }) || rawPhoneNumber
    : '';

  const contactName = getHistoryDisplayName(item, contactNumber);
  const contact = {
    name: contactName || contactNumber,
    phoneNumber: contactNumber,
  };

  // The endpoint carries no agent-side number; the list always renders the
  // contact side, and the detail view labels this party by direction.
  const dnis = dialog?.channelConfiguration?.dnis || '';
  const agent = {
    name: '',
    phoneNumber: dnis
      ? formatPhoneNumber({ phoneNumber: dnis, countryCode, currentLocale }) ||
        dnis
      : '',
  };

  const from = isOutbound ? agent : contact;
  const to = isOutbound ? contact : agent;

  const disposition = agentSegment?.disposition?.value || undefined;
  const isDisposed = !!disposition;

  return {
    id: makeHistoryCallId(item),
    direction,
    agent,
    contact,
    from,
    to,
    fromName: from.name || from.phoneNumber,
    toName: to.name || to.phoneNumber,
    fromMatches: EMPTY_MATCHES,
    toMatches: EMPTY_MATCHES,
    activityMatches: EMPTY_ACTIVITY_MATCHES,
    startTime: parseTimestamp(agentSegment?.segmentStart),
    isDisposed,
    isLogged: false,
    result: dialog?.dialDisposition ?? undefined,
    telephonySessionId: dialog?.uii,
    sessionId: agentSegment?.segmentId ?? undefined,

    uii: dialog?.uii,
    segmentId: agentSegment?.segmentId ?? undefined,
    dialogId: dialog?.dialogId,
    queueName: agentSegment?.queue?.queueName,
    campaignName: item.outbound?.campaignName ?? undefined,
    infoLine: getHistoryInfoLine(item, manualLabel),
    outboundType:
      item.outbound?.type === OutboundType.LEAD ||
      item.outbound?.type === OutboundType.MANUAL
        ? item.outbound.type
        : undefined,
    dialogState: dialog?.state,
    dialableNumber: rawPhoneNumber
      ? sessionInformation?.rcExtention
        ? `${rawPhoneNumber}@RC_EXT`
        : rawPhoneNumber
      : undefined,
    dnis: dnis || undefined,
    termParty: agentSegment?.termParty ?? undefined,
    termReason: agentSegment?.termReason ?? undefined,
    disposition,
    durationMs: getDurationMs(agentSegment),
    recordingUrl: agentSegment?.recordingUrl || undefined,
    isActive:
      dialog?.state === 'ACTIVE' && agentSegment?.termReason !== 'DROP',
  };
}
