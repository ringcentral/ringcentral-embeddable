import { _encodeSymbol } from '../lib/constant';

/**
 * The parts of an END-CALL notification needed to match it against the calls
 * the client currently holds.
 */
export interface EndedCallIdentity {
  readonly uii: string;
  readonly sessionId: string;
}

/**
 * Work out which of the agent's call sessions an END-CALL notification ends.
 *
 * Every notification the backend sends names its session, so normally this is
 * just the session the notification already carries. The Agent SDK also
 * synthesises an END-CALL of its own: when a Layer 2 reconnect comes back
 * with the server no longer on the call, it fabricates a notification from
 * the remembered `uii` alone, with no `session_id` at all. That payload
 * encodes to `<uii>$` and matches nothing in `callsMapping`, so the handler
 * that drops the call ignores it and leaves the agent looking busy on a call
 * the server has already released — visibly stuck, with no way to hang up.
 * Recovering the session from the calls actually held closes that gap without
 * loosening the match for real notifications.
 *
 * @param callIds encoded ids (`<uii>$<sessionId>`) of the agent's live calls.
 * @returns session ids to end, in the order the calls were held.
 */
export function resolveEndedCallSessions({
  endedCall,
  callIds,
}: {
  endedCall: EndedCallIdentity;
  callIds: readonly string[];
}): string[] {
  if (!endedCall?.uii) {
    return [];
  }
  if (endedCall.sessionId) {
    return [endedCall.sessionId];
  }
  const prefix = `${endedCall.uii}${_encodeSymbol}`;
  return callIds
    .filter((callId) => callId.startsWith(prefix))
    .map((callId) => callId.slice(prefix.length))
    .filter((sessionId) => !!sessionId);
}
