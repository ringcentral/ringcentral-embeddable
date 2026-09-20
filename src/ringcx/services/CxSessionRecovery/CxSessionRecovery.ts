import {
  injectable,
  optional,
  PortManager,
  RcModule,
  RouterPlugin,
  delegate,
} from '@ringcentral-integration/next-core';

import { CxCallbackTypes, evStatus } from '../CxClient/enums';
import { CxClient } from '../CxClient';
import { CxAuth } from '../CxAuth';
import { CxCall } from '../CxCall';
import { CxPresence } from '../CxPresence';
import { CxWorkingState } from '../CxWorkingState';
import {
  reconcileReconnectState,
  reconnectActions,
} from '../../utils/reconcileReconnectState';
import type { ReconnectPlan } from '../../utils/reconcileReconnectState';
import { registerOnMainTab } from '../../utils/register-on-main-tab';
import { shouldRecycleEvSocket } from '../../utils/shouldRecycleEvSocket';
import type { CxSessionRecoveryOptions } from './CxSessionRecovery.interface';

/** Sampling cadence for the socket watchdog. */
const SOCKET_WATCHDOG_INTERVAL_MS = 15 * 1000;

/**
 * Extra checks after the browser reports back online, so a socket that died
 * with the old network is condemned as soon as the echo grace elapses rather
 * than on the next sampling tick.
 */
const ONLINE_RECHECK_DELAYS_MS = [2 * 1000, 6 * 1000, 12 * 1000];

/**
 * CxSessionRecovery - realigns the client with the server after the Agent SDK
 * re-establishes its WebSocket.
 *
 * The SDK replays queued server messages only up to three minutes back, so
 * after a longer outage the client's view of the agent can be stale in either
 * direction. The Layer 2 reconnect login response carries the server's
 * authoritative view, and this module applies it. Without that step an agent
 * whose network dropped mid-call comes back showing "Engaged" with no call to
 * act on, while the server waits forever for a disposition that can no longer
 * be submitted.
 *
 * A page reload is out of scope here: it always performs a fresh login whose
 * response carries no session state, so reload recovery relies on the
 * persisted activity call id plus the server's PENDING_DISP push instead.
 */
@injectable({
  name: 'CxSessionRecovery',
})
class CxSessionRecovery extends RcModule {
  /** Epoch ms of the last forced socket close, for the recycle cooldown. */
  private _lastSocketRecycleAt = 0;

  /**
   * Epoch ms of the last browser-reported network drop, cleared once an echo
   * newer than it proves the socket survived.
   */
  private _networkDropAt: number | null = null;

  /** Epoch ms when the browser reported back online after that drop. */
  private _networkOnlineAt: number | null = null;

  /**
   * Pending post-online rechecks. Superseded on every network transition so
   * flapping connectivity keeps at most one burst in flight.
   */
  private _onlineRecheckTimers: ReturnType<typeof setTimeout>[] = [];

  constructor(
    protected cxClient: CxClient,
    protected cxAuth: CxAuth,
    protected cxCall: CxCall,
    protected cxPresence: CxPresence,
    protected cxWorkingState: CxWorkingState,
    protected router: RouterPlugin,
    protected portManager: PortManager,
    @optional('CxSessionRecoveryOptions')
    protected options?: CxSessionRecoveryOptions,
  ) {
    super();
    // The SDK, and therefore the login callback, only lives on the main
    // tab, while the session state this module corrects lives on the server.
    registerOnMainTab(this.portManager, () => {
      this._initReconnectListener();
      this._initSocketWatchdog();
    });
  }

  /**
   * Watch for a zombie agent websocket and force its reconnect.
   *
   * A network switch kills the socket's TCP path without the browser
   * noticing: readyState stays OPEN, `onclose` fires only minutes later when
   * TCP finally times out, and every message sent meanwhile is lost. The
   * server's echoes (`lastAlive`) are the liveness signal, so a logged-in
   * agent whose open socket has gone silent gets the socket closed by hand,
   * which starts the SDK's own 5s reconnect loop immediately. The browser's
   * `online` event triggers an extra check so a network switch is caught as
   * soon as the new network is up rather than on the next sampling tick.
   */
  private _initSocketWatchdog(): void {
    setInterval(() => {
      void this._checkSocketHealth();
    }, SOCKET_WATCHDOG_INTERVAL_MS);
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('offline', () => {
        // Witness the drop: any echo timestamp older than this predates it,
        // which lets the check condemn the socket seconds after connectivity
        // returns instead of waiting out the raw staleness threshold.
        this._networkDropAt = Date.now();
        this._clearOnlineRechecks();
      });
      window.addEventListener('online', () => {
        this._networkOnlineAt = Date.now();
        void this._checkSocketHealth();
        // The echo grace has not elapsed the instant connectivity returns,
        // and the next sampling tick could be 15s away; look again while the
        // outage is fresh.
        this._clearOnlineRechecks();
        for (const delay of ONLINE_RECHECK_DELAYS_MS) {
          this._onlineRecheckTimers.push(
            setTimeout(() => {
              void this._checkSocketHealth();
            }, delay),
          );
        }
      });
    }
  }

  private _clearOnlineRechecks(): void {
    for (const timer of this._onlineRecheckTimers) {
      clearTimeout(timer);
    }
    this._onlineRecheckTimers = [];
  }

  private async _checkSocketHealth(): Promise<void> {
    const diagnostics = await this.cxClient.getSocketDiagnostics();
    if (
      this._networkDropAt !== null &&
      diagnostics.lastAlive !== null &&
      diagnostics.lastAlive > this._networkDropAt
    ) {
      // An echo arrived after the drop: the socket survived it.
      this._networkDropAt = null;
      this._networkOnlineAt = null;
    }
    const plan = shouldRecycleEvSocket({
      isLoggedIn: diagnostics.isLoggedIn,
      socketReadyState: diagnostics.socketReadyState,
      lastAlive: diagnostics.lastAlive,
      now: Date.now(),
      lastRecycleAt: this._lastSocketRecycleAt,
      networkDropAt: this._networkDropAt,
      networkOnlineAt: this._networkOnlineAt,
    });
    if (!plan.shouldRecycle) {
      return;
    }
    this.logger.warn('zombie socket~~ forcing reconnect', diagnostics);
    this._lastSocketRecycleAt = Date.now();
    // Surface the reconnect in the connectivity banner before touching the
    // socket, so the agent sees it even if abandoning were to stall.
    await this.cxClient.setAppStatus(evStatus.RECONNECTING);
    // Abandon rather than close: a graceful close of a black-holed socket
    // waits out the browser's 60s closing-handshake timeout before the
    // SDK's reconnect can start.
    await this.cxClient.abandonSocket();
  }

  private get _dispositionPathPrefix(): string {
    return this.options?.dispositionPathPrefix ?? '/agent/calls';
  }

  private _initReconnectListener(): void {
    this.cxClient.addListener(CxCallbackTypes.LOGIN, (response) => {
      // Only a Layer 2 reconnect response carries the server's session state
      // (is_on_call / active_call_uii / is_pending_disp) into the SDK model,
      // and its arrival is the earliest moment that state exists: OPEN_SOCKET
      // fires before the reconnect login is even sent, and a fresh login
      // response has nothing to reconcile against.
      if (!response?.isReconnect) {
        return;
      }
      this.recoverSession().catch((error) => {
        this.logger.error('recoverSession failed~~', error);
      });
    });
  }

  /**
   * Compare the server's view of the agent with the client's and apply
   * whichever correction the two disagree on.
   */
  @delegate('server')
  async recoverSession(): Promise<ReconnectPlan> {
    // The Engage token can expire during the outage and nothing else renews
    // it on reconnect, leaving every Engage HTTP call — including the SDK's
    // own sipRegistrationInfo fetch during registrar rotation — failing with
    // 401. EAG refreshes it in its reconnect callback for the same reason.
    // A refresh that fails — the network is still settling when the socket
    // comes back — must not abort the reconciliation: the stale call state it
    // corrects is exactly what the agent is stuck on, and it needs no token.
    try {
      await this.cxAuth.refreshEvToken();
    } catch (error) {
      this.logger.error('refreshEvToken failed~~', error);
    }
    const snapshot = await this.cxClient.getReconnectSnapshot();
    const plan = reconcileReconnectState({
      snapshot,
      local: {
        activeCallIds: this.cxPresence.callIds,
        activityCallId: this.cxCall.activityCallId,
        activeCallUii: this.cxPresence.currentCallUii,
        isPendingDisposition: this.cxWorkingState.isPendingDisposition,
      },
    });
    this.logger.info('recoverSession~~', { snapshot, plan });
    await this._applyPlan(plan);
    return plan;
  }

  private async _applyPlan(plan: ReconnectPlan): Promise<void> {
    switch (plan.action) {
      case reconnectActions.restorePendingDisposition:
        await this.cxWorkingState.setIsPendingDisposition(true, plan.callId);
        this._goToDisposition(plan.callId);
        break;
      case reconnectActions.clearPendingDisposition:
        await this.cxWorkingState.setIsPendingDisposition(false);
        break;
      case reconnectActions.reloadActiveCall:
        await this.cxClient.loadCurrentCall();
        break;
      case reconnectActions.endStaleLocalCall:
        // The SDK synthesises an END-CALL for this case, which drives the
        // normal call-ended path. Only the pointer to the call being worked on
        // has to be cleared here so a stale id cannot outlive the call.
        if (!plan.callId) {
          this.cxCall.setActivityCallId('');
        }
        break;
      case reconnectActions.forceClearCall:
        // The SDK already sent the hangup with `cancel_pending_disp` itself
        // while processing this reconnect response, so only the local view
        // has to be brought in line here; a second hangup would be a
        // duplicate request against a session the server just released.
        await this.cxWorkingState.setIsPendingDisposition(false);
        this.cxCall.setActivityCallId('');
        break;
      default:
        break;
    }
  }

  private _goToDisposition(callId: string): void {
    this.logger.info('[cxdbg] recovery goToDisposition~~', {
      callId,
      currentPath: this.router.currentPath,
    });
    if (!callId) {
      return;
    }
    this.router.replace(`${this._dispositionPathPrefix}/${callId}/disposition`);
  }

  /**
   * Release an agent the server has parked in pending disposition with no call
   * the client can dispose.
   *
   * The hangup carries `cancel_pending_disp`, which is the only way to clear
   * that state without an administrator, so it is also the recovery the UI
   * offers when everything else has failed.
   */
  @delegate('server')
  async forceClearStuckState(): Promise<void> {
    this.logger.warn('forceClearStuckState~~');
    await this.cxClient.forceClearPendingDisposition();
    await this.cxWorkingState.setIsPendingDisposition(false);
    this.cxCall.setActivityCallId('');
  }

  /**
   * Whether the agent is in a state only {@link forceClearStuckState} can
   * resolve: the server owes a disposition but no local call exists to submit
   * one against.
   */
  get isStuckWithoutCall(): boolean {
    if (!this.cxWorkingState.isPendingDisposition) {
      return false;
    }
    const callId = this.cxWorkingState.pendingDispositionCallId;
    return !callId || !this.cxPresence.callsMapping[callId];
  }
}

export { CxSessionRecovery };
