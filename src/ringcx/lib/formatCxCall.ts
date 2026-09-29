import type {
  CxBaseCall,
  CxEndedCall,
} from '../services/CxClient/interfaces';
import type { CxCallData } from '../services/CxCallMonitor/CxCallMonitor.interface';
import type { FormattedCall } from '../services/CxCallHistory/CxCallHistory.interface';
import { callDirection } from '../enums';
import { getCallAni, getCallDnis } from './getCxCallNumbers';
import { getEvServerTimestamp } from './getEvServerTimestamp';

function getStartTime(queueDts?: string): number | undefined {
  return queueDts ? getEvServerTimestamp(queueDts) : undefined;
}

export interface FormattedCxCall {
  id: string;
  direction: 'INBOUND' | 'OUTBOUND';
  from: {
    phoneNumber: string;
    name?: string;
  };
  to: {
    phoneNumber: string;
    name?: string;
  };
  telephonyStatus: 'CallRing' | 'CallConnected';
  sessionId: string | undefined;
  telephonySessionId: string;
  partyId: string;
  startTime: number | undefined;
  duration?: number;
  offset: number;
  fromMatches: any[];
  toMatches: any[];
  activityMatches: any[];
  recordingUrl?: string;
  segmentId?: string;
}

/**
 * Format a raw EV call into the standardized call log shape for ring events.
 * Used for onRingCall adapter notifications (before contact matching completes).
 */
export function formatCxCallForRing(
  call: CxBaseCall & { session?: { sessionId?: string } },
): FormattedCxCall {
  const isOutbound = call.callType === 'OUTBOUND';
  const ani = getCallAni(call);
  const dnis = getCallDnis(call);
  const fromNumber = isOutbound ? dnis : ani;
  const toNumber = isOutbound ? ani : dnis;
  return {
    id: call.uii,
    direction: call.callType,
    from: {
      phoneNumber: fromNumber,
    },
    to: {
      phoneNumber: toNumber,
    },
    telephonyStatus: 'CallRing',
    sessionId: call.session?.sessionId,
    telephonySessionId: call.uii,
    partyId: call.agentId,
    startTime: getStartTime(call.queueDts),
    offset: 0,
    fromMatches: [],
    toMatches: [],
    activityMatches: [],
  };
}

/**
 * Format a raw EV call into the standardized call log shape for connected/ended events.
 * Includes contact match name and recording URL when available.
 */
export function formatCxCallForConnected(call: CxCallData): FormattedCxCall {
  const isOutbound = call.callType === 'OUTBOUND';
  const contactMatches: any[] = call.contactMatches || [];
  const name = contactMatches[0]?.name;
  const ani = getCallAni(call);
  const dnis = getCallDnis(call);
  const fromNumber = isOutbound ? dnis : ani;
  const toNumber = isOutbound ? ani : dnis;
  const endedCall = call.endedCall as unknown as CxEndedCall | undefined;
  return {
    id: call.uii,
    direction: call.callType,
    from: {
      phoneNumber: fromNumber,
      name: !isOutbound ? name : fromNumber,
    },
    to: {
      phoneNumber: toNumber,
      name: isOutbound ? name : toNumber,
    },
    telephonyStatus: 'CallConnected',
    sessionId: call.session?.sessionId,
    telephonySessionId: call.uii,
    partyId: call.agentId,
    startTime: getStartTime(call.queueDts ?? endedCall?.callDts),
    duration: endedCall?.duration ? Number.parseInt(endedCall.duration, 10) : undefined,
    offset: 0,
    fromMatches: [],
    toMatches: [],
    activityMatches: [],
    recordingUrl: endedCall?.recordingUrl ?? call.session?.recordingUrl,
    segmentId: call.session?.segmentId ?? call.segmentContext?.segmentId,
  };
}

/**
 * Map a server history row onto the same `FormattedCxCall` shape local calls
 * use for `rc-ev-logCall`.
 *
 * History has no EV session id; `segmentId` stands in so the payload still
 * carries a stable per-leg identifier CRMs can key on.
 *
 * Phone numbers come from the raw history fields (`dialableNumber` / `dnis`),
 * not the display-formatted `from`/`to` values used in the list UI.
 */
export function formatCxCallFromHistory(
  call: FormattedCall,
  agentId: string,
): FormattedCxCall | null {
  if (!call.uii) {
    return null;
  }
  const isOutbound = call.direction === callDirection.outbound;
  const contactNumber = getRawHistoryContactNumber(call);
  const agentNumber = call.dnis || '';
  const durationSeconds =
    call.durationMs != null
      ? Math.round(call.durationMs / 1000)
      : undefined;
  return {
    id: call.uii,
    direction: isOutbound ? 'OUTBOUND' : 'INBOUND',
    from: {
      phoneNumber: isOutbound ? agentNumber : contactNumber,
      name: isOutbound
        ? agentNumber
        : call.from.name || call.fromName || contactNumber,
    },
    to: {
      phoneNumber: isOutbound ? contactNumber : agentNumber,
      name: isOutbound
        ? call.to.name || call.toName || contactNumber
        : agentNumber,
    },
    telephonyStatus: 'CallConnected',
    sessionId: call.segmentId,
    telephonySessionId: call.uii,
    partyId: agentId,
    startTime: call.startTime || undefined,
    duration: durationSeconds,
    offset: 0,
    fromMatches: [],
    toMatches: [],
    activityMatches: [],
    recordingUrl: call.recordingUrl,
    segmentId: call.segmentId,
  };
}

/** Raw contact destination from history, without the dialing `@RC_EXT` suffix. */
function getRawHistoryContactNumber(call: FormattedCall): string {
  const dialableNumber = call.dialableNumber || '';
  if (dialableNumber.endsWith('@RC_EXT')) {
    return dialableNumber.slice(0, -'@RC_EXT'.length);
  }
  return dialableNumber;
}
