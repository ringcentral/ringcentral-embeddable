/**
 * Reconciliation of the agent session after the Agent SDK re-establishes its
 * WebSocket.
 *
 * On a Layer 2 reconnect the server replies with the authoritative view of the
 * agent: whether it is on a call, which call, and whether a disposition is
 * still pending. The client's own view can be stale in either direction
 * because events emitted while the socket was down are never replayed.
 * Without reconciling the two the agent is left "Engaged" with no call to act
 * on, and the server keeps the interaction in pending disposition forever.
 */

/** The server's view of the agent, taken from the reconnect login response. */
export interface ReconnectSnapshot {
  /** Server believes the agent is on an active call. */
  readonly isOnCall: boolean;
  /** UII of the call the server considers active, if any. */
  readonly activeCallUii: string;
  /** Server is waiting for a disposition on the last interaction. */
  readonly isPendingDisposition: boolean;
}

/** The client's view of the agent at the moment the socket came back. */
export interface LocalCallState {
  /** Encoded ids of calls the client still believes are active. */
  readonly activeCallIds: readonly string[];
  /** The call the UI is currently working on, if any. */
  readonly activityCallId: string;
  /** UII of the call the client believes is active, if any. */
  readonly activeCallUii: string;
  /** Client already shows a pending disposition. */
  readonly isPendingDisposition: boolean;
}

export const reconnectActions = {
  /** Client and server agree; leave the session alone. */
  none: 'none',
  /** Server has no call but the client still shows one: end it locally. */
  endStaleLocalCall: 'endStaleLocalCall',
  /**
   * Client and server disagree about which call is active. The session cannot
   * be trusted, so the call is dropped and the pending disposition cancelled.
   */
  forceClearCall: 'forceClearCall',
  /** Server is waiting for a disposition the client is not showing. */
  restorePendingDisposition: 'restorePendingDisposition',
  /** Server holds a call the client lost track of: reload it from the SDK. */
  reloadActiveCall: 'reloadActiveCall',
  /** Client shows a pending disposition the server has already resolved. */
  clearPendingDisposition: 'clearPendingDisposition',
} as const;

export type ReconnectAction =
  (typeof reconnectActions)[keyof typeof reconnectActions];

export interface ReconnectPlan {
  readonly action: ReconnectAction;
  /**
   * Call the action applies to. An encoded call id for local actions, or the
   * server's UII when the client has no matching local call.
   */
  readonly callId: string;
  /** Short machine-readable justification, surfaced in logs. */
  readonly reason: string;
}

const noop: ReconnectPlan = {
  action: reconnectActions.none,
  callId: '',
  reason: 'inSync',
};

/**
 * Decide how to bring the client back in line with the server after a
 * reconnect.
 *
 * Ordered by severity: a disagreement about the active call is resolved before
 * anything else, because acting on the wrong call is worse than showing a
 * stale one.
 */
export function reconcileReconnectState({
  snapshot,
  local,
}: {
  snapshot: ReconnectSnapshot;
  local: LocalCallState;
}): ReconnectPlan {
  const hasLocalCall = local.activeCallIds.length > 0 || !!local.activeCallUii;
  if (!snapshot.isOnCall) {
    if (hasLocalCall) {
      return {
        action: reconnectActions.endStaleLocalCall,
        callId: local.activityCallId || local.activeCallIds[0] || '',
        reason: 'serverHasNoCall',
      };
    }
    if (snapshot.isPendingDisposition && !local.isPendingDisposition) {
      return {
        action: reconnectActions.restorePendingDisposition,
        callId: local.activityCallId || local.activeCallIds[0] || '',
        reason: 'serverPendingDisposition',
      };
    }
    if (!snapshot.isPendingDisposition && local.isPendingDisposition) {
      return {
        action: reconnectActions.clearPendingDisposition,
        callId: '',
        reason: 'serverResolvedDisposition',
      };
    }
    return noop;
  }
  if (!hasLocalCall) {
    return {
      action: reconnectActions.reloadActiveCall,
      callId: snapshot.activeCallUii,
      reason: 'clientLostActiveCall',
    };
  }
  if (
    snapshot.activeCallUii &&
    local.activeCallUii &&
    snapshot.activeCallUii !== local.activeCallUii
  ) {
    return {
      action: reconnectActions.forceClearCall,
      callId: snapshot.activeCallUii,
      reason: 'activeCallMismatch',
    };
  }
  return noop;
}
