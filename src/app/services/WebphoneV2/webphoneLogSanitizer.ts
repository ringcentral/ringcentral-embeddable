/**
 * Sanitizes and caps SIP/transport log content to avoid bloated application logs,
 * cyclic JSON serialization, and to keep message type + partial data for troubleshooting.
 */

import { maskCallId } from '@ringcentral-integration/core/lib/logger/piiSanitizer';

/** Maximum length for a single log message string in application logs. */
export const MAX_SIP_TRANSPORT_LOG_LENGTH = 2000;

const TRUNCATED_SUFFIX = '… [truncated]';

/**
 * Truncates string content to a maximum length and appends a suffix when truncated.
 * Use for SIP/transport log messages (e.g. from webphone SDK connector).
 */
export function truncateLogContent(
  content: string,
  maxLength: number = MAX_SIP_TRANSPORT_LOG_LENGTH,
): string {
  if (typeof content !== 'string') {
    return (
      String(content).slice(0, maxLength - TRUNCATED_SUFFIX.length) +
      TRUNCATED_SUFFIX
    );
  }
  if (content.length <= maxLength) {
    return content;
  }
  return (
    content.slice(0, maxLength - TRUNCATED_SUFFIX.length) + TRUNCATED_SUFFIX
  );
}

/**
 * Picks a small, safe subset of fields from transport/session event payloads
 * for logging (e.g. method, code, message, sessionId) to avoid huge/circular objects.
 */
function pickSafeSummary(payload: unknown): Record<string, unknown> {
  if (payload === null || typeof payload !== 'object') {
    return { value: payload };
  }
  const obj = payload as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  const safeKeys = [
    'message',
    'code',
    'reason',
    'statusCode',
    'status_code',
    'type',
    'statusText',
    'status',
    'callStatus',
    'method',
    'cseq',
    'contentType',
    'bodyLength',
    'hasAuthorization',
    'hasProxyAuthenticate',
    'hasWwwAuthenticate',
    'id',
    'callId',
    'sessionId',
    'direction',
    'startTime',
    'endTime',
    'hasOffer',
    'hasAnswer',
    'localHold',
    'request',
  ];
  for (const k of safeKeys) {
    if (!(k in obj)) continue;
    const v = obj[k];
    if (v === null || v === undefined) continue;
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      if (
        k === 'request' &&
        typeof (v as { method?: string }).method === 'string'
      ) {
        out.request = { method: (v as { method: string }).method };
      } else {
        out[k] = '[object]';
      }
    } else if (Array.isArray(v)) {
      out[k] = `[${v.length} items]`;
    } else if (k === 'callId' && typeof v === 'string') {
      out[k] = maskCallId(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

/**
 * Formats a transport or session event for logging: event name + safe partial payload.
 * Caps total length and avoids cyclic or huge payloads (e.g. full SDP/candidate lists).
 */
export function formatTransportEventSummary(
  eventName: string,
  payload: unknown,
  maxLength: number = MAX_SIP_TRANSPORT_LOG_LENGTH,
): string {
  const summary = pickSafeSummary(payload);
  const hasUseful = Object.keys(summary).length > 0;
  let part: string;
  try {
    part = hasUseful
      ? JSON.stringify(summary)
      : (typeof payload === 'string' ? payload : '[no summary]').slice(0, 300);
  } catch {
    part = '[Unserializable]';
  }
  const line = `${eventName} ${part}`;
  return truncateLogContent(line, maxLength);
}

/** Formats only diagnostic fields from a live SIP/WebRTC session. */
export function formatWebphoneSessionSummary(
  session: unknown,
  maxLength: number = MAX_SIP_TRANSPORT_LOG_LENGTH,
): string {
  if (session === null || typeof session !== 'object') {
    return formatTransportEventSummary('session', session, maxLength);
  }

  const source = session as Record<string, unknown>;
  const partyData = source.__rc_partyData;
  const sessionId =
    partyData && typeof partyData === 'object'
      ? (partyData as Record<string, unknown>).sessionId
      : undefined;

  return formatTransportEventSummary(
    'session',
    {
      id: source.id,
      sessionId,
      callId: source.callId ?? source.__rc_callId,
      status: source.status,
      callStatus: source.__rc_callStatus,
      direction: source.__rc_direction,
      startTime: source.startTime,
      endTime: source.endTime,
      hasOffer: source.hasOffer,
      hasAnswer: source.hasAnswer,
      localHold: source.localHold,
    },
    maxLength,
  );
}
