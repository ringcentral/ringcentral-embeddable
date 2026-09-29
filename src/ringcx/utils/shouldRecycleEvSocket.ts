/**
 * A network switch kills the agent websocket's TCP path without the browser
 * noticing: the socket keeps reporting readyState OPEN while nothing can get
 * through, and the SDK's reconnect only starts once `onclose` finally fires —
 * typically minutes later, long after the server has abandoned the agent's
 * call. The server's echo instructions are the liveness signal (`lastAlive`
 * in the SDK model): on a healthy session they arrive within seconds, and the
 * SDK itself treats a 10s gap as abnormal enough to queue call control.
 * Closing such a zombie socket by hand is what turns the SDK's reconnect on
 * within seconds instead of minutes.
 */

/**
 * Comfortably beyond healthy echo jitter (sub-second in practice, 10s is the
 * SDK's own abnormality threshold), short enough to beat the server's
 * tolerance for an unreachable mid-call agent.
 */
export const SOCKET_STALE_ALIVE_MS = 30 * 1000;

/**
 * After a forced close, `lastAlive` stays stale until the first echo of the
 * next session arrives, so without a cooldown the freshly reopened socket
 * would be judged by the old timestamp and closed again.
 */
export const SOCKET_RECYCLE_COOLDOWN_MS = 60 * 1000;

/**
 * How long after connectivity returns to wait for an echo before treating a
 * browser-reported network drop as proof the socket died with it. A socket
 * that survived a short blip sees echoes again within a beat or two; five
 * seconds is enough to tell the difference without flapping on every blip.
 */
export const ONLINE_ECHO_GRACE_MS = 5 * 1000;

export interface RecycleEvSocketInputs {
  /** The SDK only auto-reconnects a logged-in agent; recycling helps nobody else. */
  readonly isLoggedIn: boolean;
  /** WebSocket readyState; only an OPEN(1) socket can be a zombie. */
  readonly socketReadyState: number | null;
  /** Epoch ms of the last server echo, or null before the first one. */
  readonly lastAlive: number | null;
  readonly now: number;
  /** Epoch ms of the last forced close, 0 when none happened yet. */
  readonly lastRecycleAt: number;
  /**
   * Epoch ms when the browser last reported going offline, or null once an
   * echo newer than it proved the socket survived. An echo older than this
   * predates the drop.
   */
  readonly networkDropAt?: number | null;
  /** Epoch ms when the browser reported back online after that drop. */
  readonly networkOnlineAt?: number | null;
  readonly staleMs?: number;
  readonly cooldownMs?: number;
  readonly onlineGraceMs?: number;
}

export interface RecycleEvSocketPlan {
  readonly shouldRecycle: boolean;
  readonly reason: string;
}

/**
 * Decide whether the agent websocket is a zombie worth force-closing.
 */
export function shouldRecycleEvSocket({
  isLoggedIn,
  socketReadyState,
  lastAlive,
  now,
  lastRecycleAt,
  networkDropAt = null,
  networkOnlineAt = null,
  staleMs = SOCKET_STALE_ALIVE_MS,
  cooldownMs = SOCKET_RECYCLE_COOLDOWN_MS,
  onlineGraceMs = ONLINE_ECHO_GRACE_MS,
}: RecycleEvSocketInputs): RecycleEvSocketPlan {
  if (!isLoggedIn) {
    return { shouldRecycle: false, reason: 'notLoggedIn' };
  }
  if (socketReadyState !== 1) {
    // Closed or connecting sockets are already in the SDK's own hands.
    return { shouldRecycle: false, reason: 'socketNotOpen' };
  }
  if (!lastAlive) {
    return { shouldRecycle: false, reason: 'noAliveSignal' };
  }
  const stale = now - lastAlive > staleMs;
  // The browser witnessed a network drop, connectivity has been back long
  // enough for an echo, and none has arrived since before the drop: the
  // socket provably rode the old network. This fires long before the raw
  // staleness threshold, closing the window where the UI looks healthy while
  // call control goes nowhere.
  const deadSinceDrop =
    networkDropAt !== null &&
    lastAlive <= networkDropAt &&
    networkOnlineAt !== null &&
    networkOnlineAt >= networkDropAt &&
    now - networkOnlineAt >= onlineGraceMs;
  if (!stale && !deadSinceDrop) {
    return { shouldRecycle: false, reason: 'alive' };
  }
  if (now - lastRecycleAt < cooldownMs) {
    return { shouldRecycle: false, reason: 'cooldown' };
  }
  return {
    shouldRecycle: true,
    reason: stale ? 'staleAlive' : 'noEchoSinceNetworkDrop',
  };
}
