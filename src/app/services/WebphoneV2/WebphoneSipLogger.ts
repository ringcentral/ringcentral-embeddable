import { getHeader } from './WebphoneV2Session';

export type SipMessageDirection = 'inbound' | 'outbound';

type SipMessageLike = {
  readonly subject?: unknown;
  readonly body?: unknown;
};

const SIP_REQUEST_PATTERN = /^([A-Z]+)\s+\S+\s+SIP\/2\.0$/i;

const parseSipResponse = (subject: string) => {
  if (subject.includes('\r') || subject.includes('\n')) return undefined;
  const parts = subject.trim().split(/\s+/);
  if (
    parts.length < 2 ||
    parts[0].toLowerCase() !== 'sip/2.0' ||
    !/^\d{3}$/.test(parts[1])
  ) {
    return undefined;
  }
  return {
    statusCode: Number(parts[1]),
    statusText: parts.slice(2).join(' ') || undefined,
  };
};

export const summarizeSipMessage = (
  direction: SipMessageDirection,
  message: unknown,
) => {
  const source = message as SipMessageLike;
  const subject = typeof source?.subject === 'string' ? source.subject : '';
  const response = parseSipResponse(subject);
  const request = subject.match(SIP_REQUEST_PATTERN);
  let type: 'response' | 'request' | 'unknown' = 'unknown';
  if (response) type = 'response';
  else if (request) type = 'request';
  const cseq = getHeader(message, 'CSeq');
  const cseqParts = cseq?.trim().split(/\s+/);
  const bodyLength =
    typeof source?.body === 'string' ? source.body.length : undefined;

  return {
    direction,
    type,
    method: request?.[1] ?? cseqParts?.[1],
    statusCode: response?.statusCode,
    statusText: response?.statusText,
    cseq: cseqParts?.[0],
    callId: getHeader(message, 'Call-ID'),
    contentType: getHeader(message, 'Content-Type'),
    reason: getHeader(message, 'Reason'),
    bodyLength,
    hasAuthorization: Boolean(
      getHeader(message, 'Authorization') ||
        getHeader(message, 'Proxy-Authorization'),
    ),
    hasProxyAuthenticate: Boolean(getHeader(message, 'Proxy-Authenticate')),
    hasWwwAuthenticate: Boolean(getHeader(message, 'WWW-Authenticate')),
  };
};
