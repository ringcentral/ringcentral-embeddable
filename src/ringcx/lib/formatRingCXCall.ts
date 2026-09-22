import { getCallAni, getCallDnis } from './getCxCallNumbers';
import { getEvServerTimestamp } from './getEvServerTimestamp';

const ENCODE_SYMBOL = '$';
const HISTORY_ID_SEPARATOR = '$$';

export interface RingCXCallParty {
  phoneNumber?: string;
  name?: string;
  extensionNumber?: string;
}

export interface RingCXDispositionRef {
  id: string;
  name: string;
  requireNotes?: boolean;
}

export interface RingCXCallInfo {
  uii: string;
  callType: string;
  agentId: string;
  queue?: { id: string; name: string };
  dialGroup?: { id: string; name: string };
  skillProfileId?: string;
  dispositions?: RingCXDispositionRef[];
  disposition?: { id: string; name: string };
  notes?: string;
  recordingUrl?: string;
  scriptId?: string;
  isMonitoring?: boolean;
  lead?: { id: string; [key: string]: unknown };
}

/**
 * Host-facing CX call. `id` and `sessionId` are the same stable log key.
 */
export interface RingCXNormalizedCall {
  id: string;
  sessionId: string;
  direction: 'Inbound' | 'Outbound';
  from: RingCXCallParty;
  to: RingCXCallParty;
  startTime: string;
  endTime?: string;
  duration?: number;
  result?: string;
  toName?: string;
  fromName?: string;
  contactMatches?: Array<{ id?: string; name?: string; type?: string }>;
  source: 'ringcx';
  ringcx: RingCXCallInfo;
}

export interface FormatRingCXCallResult {
  call: RingCXNormalizedCall;
  startTimeMs?: number;
}

export interface FormatRingCXCallInput {
  id?: string;
  uii?: string;
  sessionId?: string;
  session?: { sessionId?: string; recordingUrl?: string; segmentId?: string };
  segmentId?: string;
  callType?: string;
  direction?: string;
  agentId?: string;
  ani?: string;
  dnis?: string;
  aniE164?: string;
  dnisE164?: string;
  queueDts?: string;
  queue?: { number?: string; name?: string; id?: string };
  queueName?: string;
  scriptId?: string;
  isMonitoring?: boolean;
  lead?: { leadId?: string; id?: string; [key: string]: unknown };
  recordingUrl?: string;
  endedCall?: {
    duration?: string;
    recordingUrl?: string;
    callDts?: string;
    termReason?: string;
  };
  duration?: number;
  durationMs?: number;
  startTime?: number;
  result?: string;
  termReason?: string;
  disposition?: string | { id?: string; name?: string };
  notes?: string;
  contactMatches?: Array<{ id?: string; name?: string; type?: string }>;
  from?: { phoneNumber?: string; name?: string };
  to?: { phoneNumber?: string; name?: string };
  fromName?: string;
  toName?: string;
  outdialDispositions?: {
    dispositions?: Array<{
      dispositionId?: string;
      disposition?: string;
      requireNote?: boolean;
    }>;
  };
  dialGroup?: { id: string; name: string };
  skillProfileId?: string;
  localCallId?: string;
}

export function isRingCXHistoryId(id: string): boolean {
  return id.includes(HISTORY_ID_SEPARATOR);
}

/** Live call id used by Agent routes and call-log matching: `uii$sessionId`. */
export function ringCXLiveCallId(uii: string, sessionId: string): string {
  const decoded = uii.split(ENCODE_SYMBOL)[0];
  return `${decoded}${ENCODE_SYMBOL}${sessionId}`;
}

/**
 * One id per CX call leg. Live legs use the encoded uii. Server-only history
 * rows use `<segmentId>$$<uii>`.
 */
export function ringCXLogId(input: {
  id?: string;
  localCallId?: string;
  uii?: string;
  sessionId?: string;
}): string {
  if (input.localCallId) {
    return input.localCallId;
  }
  if (input.id && isRingCXHistoryId(input.id)) {
    return input.id;
  }
  if (input.uii && input.sessionId) {
    return ringCXLiveCallId(input.uii, input.sessionId);
  }
  return input.id || input.uii || '';
}

/** Remote party phone number. Matching keys are plain numbers, not call type. */
export function ringCXContactPhone(input: FormatRingCXCallInput): string {
  return (
    getCallAni(input) ||
    input.from?.phoneNumber ||
    input.to?.phoneNumber ||
    ''
  );
}

function isOutboundCall(input: FormatRingCXCallInput): boolean {
  const callType = (input.callType || '').toUpperCase();
  if (
    callType === 'OUTBOUND' ||
    callType === 'MANUAL' ||
    callType === 'PREVIEW'
  ) {
    return true;
  }
  if (callType === 'INBOUND') {
    return false;
  }
  return input.direction === 'Outbound' || input.direction === 'OUTBOUND';
}

function toIso(timestamp?: number): string | undefined {
  if (!timestamp || Number.isNaN(timestamp)) {
    return undefined;
  }
  return new Date(timestamp).toISOString();
}

function mapResult(
  input: FormatRingCXCallInput,
  duration?: number,
): string | undefined {
  if (input.result) {
    return input.result;
  }
  const reason = (
    input.termReason ||
    input.endedCall?.termReason ||
    ''
  ).toLowerCase();
  if (!reason && duration == null && !input.endedCall) {
    return undefined;
  }
  if (
    reason.includes('miss') ||
    reason.includes('abandon') ||
    reason.includes('no answer') ||
    reason.includes('rna')
  ) {
    return 'Missed';
  }
  if (duration && duration > 0) {
    return 'Call connected';
  }
  return input.termReason || input.endedCall?.termReason;
}

function mapDispositions(
  input: FormatRingCXCallInput,
): RingCXDispositionRef[] | undefined {
  const items = input.outdialDispositions?.dispositions;
  if (!items?.length) {
    return undefined;
  }
  const dispositions = items
    .filter((item) => item.dispositionId && item.disposition)
    .map((item) => ({
      id: item.dispositionId as string,
      name: item.disposition as string,
      requireNotes: item.requireNote,
    }));
  return dispositions.length > 0 ? dispositions : undefined;
}

function mapDisposition(
  input: FormatRingCXCallInput,
): { id: string; name: string } | undefined {
  if (!input.disposition) {
    return undefined;
  }
  if (typeof input.disposition === 'string') {
    return { id: input.disposition, name: input.disposition };
  }
  if (!input.disposition.id) {
    return undefined;
  }
  return {
    id: input.disposition.id,
    name: input.disposition.name || input.disposition.id,
  };
}

/**
 * Normalize a live or history CX call into the host third-party call shape.
 */
export function formatRingCXCall(
  input: FormatRingCXCallInput,
): FormatRingCXCallResult | null {
  const sessionId = input.session?.sessionId || input.sessionId;
  const uii = input.uii || '';
  const id = ringCXLogId({
    id: input.id,
    localCallId: input.localCallId,
    uii,
    sessionId,
  });
  if (!id) {
    return null;
  }
  const outbound = isOutboundCall(input);
  const ani =
    getCallAni(input) ||
    (outbound ? input.to?.phoneNumber : input.from?.phoneNumber) ||
    '';
  const dnis =
    getCallDnis(input) ||
    (outbound ? input.from?.phoneNumber : input.to?.phoneNumber) ||
    '';
  const fromNumber = outbound ? dnis : ani;
  const toNumber = outbound ? ani : dnis;
  const matchName = input.contactMatches?.[0]?.name;
  const startTimeMs =
    input.startTime ||
    (input.queueDts ? getEvServerTimestamp(input.queueDts) : undefined) ||
    (input.endedCall?.callDts
      ? getEvServerTimestamp(input.endedCall.callDts)
      : undefined);
  const parsedDuration = input.endedCall?.duration
    ? Number.parseInt(input.endedCall.duration, 10)
    : undefined;
  const duration =
    input.duration ??
    (input.durationMs != null ? Math.round(input.durationMs / 1000) : undefined) ??
    (parsedDuration != null && !Number.isNaN(parsedDuration)
      ? parsedDuration
      : undefined);
  const recordingUrl =
    input.recordingUrl ||
    input.endedCall?.recordingUrl ||
    input.session?.recordingUrl;
  const queueName = input.queue?.name || input.queueName;
  const leadId = input.lead?.leadId || input.lead?.id;
  const fromName = !outbound
    ? matchName || input.fromName || input.from?.name
    : input.fromName;
  const toName = outbound
    ? matchName || input.toName || input.to?.name
    : input.toName;
  const call: RingCXNormalizedCall = {
    id,
    sessionId: id,
    direction: outbound ? 'Outbound' : 'Inbound',
    from: {
      phoneNumber: fromNumber || undefined,
      name: fromName,
    },
    to: {
      phoneNumber: toNumber || undefined,
      name: toName,
    },
    startTime: toIso(startTimeMs) || new Date().toISOString(),
    endTime:
      startTimeMs && duration != null
        ? toIso(startTimeMs + duration * 1000)
        : undefined,
    duration,
    result: mapResult(input, duration),
    fromName,
    toName,
    contactMatches: input.contactMatches,
    source: 'ringcx',
    ringcx: {
      uii: uii.split(ENCODE_SYMBOL)[0] || uii,
      callType: input.callType || (outbound ? 'OUTBOUND' : 'INBOUND'),
      agentId: input.agentId || '',
      queue: queueName
        ? {
            id: input.queue?.number || input.queue?.id || '',
            name: queueName,
          }
        : undefined,
      dialGroup: input.dialGroup,
      skillProfileId: input.skillProfileId,
      dispositions: mapDispositions(input),
      disposition: mapDisposition(input),
      notes: input.notes,
      recordingUrl,
      scriptId: input.scriptId || undefined,
      isMonitoring: input.isMonitoring,
      lead: leadId
        ? { ...input.lead, id: String(leadId) }
        : undefined,
    },
  };
  return { call, startTimeMs };
}
