import { _encodeSymbol } from '../lib/constant';
import {
  resolveEndedCallSessions,
  type EndedCallIdentity,
} from './resolveEndedCallSessions';

/**
 * Decide whether any of the agent's live calls survive this END-CALL.
 *
 * `CxCall` used to drop `dialoutStatus` to idle on every END-CALL. That is
 * correct when the notification ends the last session the agent holds, but
 * a queued call can already be in `callIds` -- or can land there between
 * Presence removing the ended session and this handler running -- so forcing
 * idle then reports no call while a live session is still on the agent.
 *
 * Matching against the sessions this notification actually ends, rather than
 * against `callIds.length` after the fact, keeps the answer stable no matter
 * which of those two handlers ran first.
 *
 * @param endedCall identity carried by the END-CALL notification.
 * @param callIds encoded ids (`<uii>$<sessionId>`) of the agent's live calls.
 */
export function hasRemainingLiveCall({
  endedCall,
  callIds,
}: {
  endedCall: EndedCallIdentity;
  callIds: readonly string[];
}): boolean {
  const endedCallIds = new Set(
    resolveEndedCallSessions({ endedCall, callIds }).map(
      (sessionId) => `${endedCall.uii}${_encodeSymbol}${sessionId}`,
    ),
  );
  return callIds.some((callId) => !endedCallIds.has(callId));
}
