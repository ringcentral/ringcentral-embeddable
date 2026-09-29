/**
 * The Agent SDK persists `agent_id` and `hash_code` to local storage on every
 * successful login. That pair is the same session token a socket-level (Layer
 * 2) reconnect uses, and this check gates the manual "retry connection"
 * action: a fresh token is worth replaying so the server hands back the
 * in-flight call, while a stale one means the server-side session is gone and
 * a full re-authentication is the better path.
 */

/** Session token pair as read back from the Agent SDK's local storage. */
export interface StoredEvSession {
  readonly agentId: string;
  readonly hashCode: string;
  /** When the token was stored, in epoch milliseconds. */
  readonly savedAt: number;
}

export interface RejoinEvaluation {
  readonly canRejoin: boolean;
  readonly reason: string;
}

/**
 * The server drops an abandoned agent session well before this, so a token
 * older than the window is assumed dead and a fresh login is preferred over a
 * rejoin that would fail and cost the agent an extra round trip.
 */
export const SESSION_REJOIN_MAX_AGE_MS = 5 * 60 * 1000;

/**
 * Decide whether a stored session token is worth replaying on startup.
 *
 * The token must belong to the agent that is signing in; reusing another
 * agent's hash code would attach this browser to the wrong server session.
 */
export function canRejoinEvSession({
  stored,
  agentId,
  now,
  maxAgeMs = SESSION_REJOIN_MAX_AGE_MS,
}: {
  stored: StoredEvSession | null;
  agentId: string;
  now: number;
  maxAgeMs?: number;
}): RejoinEvaluation {
  if (!stored || !stored.hashCode || !stored.agentId) {
    return { canRejoin: false, reason: 'noStoredSession' };
  }
  if (!agentId) {
    return { canRejoin: false, reason: 'noAgentId' };
  }
  if (String(stored.agentId) !== String(agentId)) {
    return { canRejoin: false, reason: 'agentMismatch' };
  }
  const age = now - stored.savedAt;
  if (!Number.isFinite(age) || age < 0) {
    return { canRejoin: false, reason: 'invalidTimestamp' };
  }
  if (age > maxAgeMs) {
    return { canRejoin: false, reason: 'sessionExpired' };
  }
  return { canRejoin: true, reason: 'rejoinable' };
}
