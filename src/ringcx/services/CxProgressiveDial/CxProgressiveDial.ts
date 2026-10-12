import { Toast } from '@ringcentral-integration/micro-core/src/app/services';
import {
  action,
  delegate,
  fromWatchValue,
  injectable,
  optional,
  PortManager,
  RcModule,
  state,
  takeUntilAppDestroy,
  watch,
} from '@ringcentral-integration/next-core';
import {
  concat,
  debounceTime,
  defer,
  EMPTY,
  filter,
  firstValueFrom,
  from,
  map,
  merge,
  Observable,
  startWith,
  Subject,
  type Subscription,
  switchMap,
  timeout,
  timer,
} from 'rxjs';

import { agentStateTypes } from '../../enums';
import { trackEvents } from '../../lib/trackEvents';
import { CxProgressiveDialConfirmView } from '../../views/CxProgressiveDialConfirmView';
import { track } from '../Analytics/track';
import { CxAgentSession } from '../CxAgentSession';
import { CxAuth } from '../CxAuth';
import { CxCall } from '../CxCall';
import { CxClient } from '../CxClient';
import { CxCallbackTypes } from '../CxClient/enums';
import type { CxBaseCall } from '../CxClient/interfaces';
import { CxLeads, PENDING_LEAD_STATE } from '../CxLeads';
import type { Lead } from '../CxLeads';
import { CxPresence } from '../CxPresence';
import { CxSettings } from '../CxSettings';
import { CxSubscription } from '../CxSubscription';
import { CxWorkingState } from '../CxWorkingState';
import type {
  CxProgressiveDialOptions,
  ProgressiveDialCommandParams,
  ProgressiveDialPhase,
  ProgressiveDialStatus,
  ProgressiveDialStopReason,
} from './CxProgressiveDial.interface';
import { t } from './i18n';

/**
 * Time the dialer conditions must hold before it acts. Call end, disposition
 * and agent state notifications arrive one by one and can flip the
 * conditions for a moment.
 */
const SETTLE_MS = 500;

/** Wait before fetching again when no leads came back, as Agent One does. */
const NO_LEADS_RETRY_MS = 5 * 1000;

/** Wait for the AVAILABLE state after the agent chose Go available. */
const AVAILABLE_WAIT_MS = 10 * 1000;

/**
 * Wait before asking a free agent who is not available to go available, as
 * Agent One does, in case the AVAILABLE state is only late.
 */
const AVAILABLE_PROMPT_DELAY_MS = 1000;

/**
 * What the loop does next
 * - `advance`: dial the next lead
 * - `prompt`: ask the agent, free but not available, to go available
 * - `wait`: wait for the call, the disposition, or a state change to end
 */
type LoopState = 'advance' | 'prompt' | 'wait';

interface PhaseUpdate {
  nextDialAt?: number | null;
  nextLeadRequestId?: string | null;
}

interface HaltParams {
  reason: ProgressiveDialStopReason;
  releaseLine?: boolean;
}

/**
 * CxProgressiveDial module - Progressive dialer
 *
 * RingCX has no progressive API: a progressive dial group is a `PREVIEW` group
 * with progressive mode on, and the client loops over the preview APIs. On
 * Start it connects the agent's line and keeps it open, then repeats: take the
 * next pending lead (fetching a batch when none is left), count down the dial
 * group delay, and dial it. The loop moves on once the agent is free again
 * after the call and its disposition. When the server leaves the agent in
 * another state after a call, Working for example, the agent is asked to go
 * available; choosing a state stops the dialer.
 *
 * The loop runs on the server port only, so tabs never dial twice.
 */
@injectable({
  name: 'CxProgressiveDial',
})
class CxProgressiveDial extends RcModule {
  private readonly _kick$ = new Subject<void>();

  private _loop?: Subscription;

  private readonly _statusListeners = new Set<
    (status: ProgressiveDialStatus) => void
  >();

  private readonly _attentionListeners = new Set<() => void>();

  constructor(
    private cxAuth: CxAuth,
    private cxClient: CxClient,
    private cxAgentSession: CxAgentSession,
    private cxCall: CxCall,
    private cxLeads: CxLeads,
    private cxPresence: CxPresence,
    private cxSettings: CxSettings,
    private cxSubscription: CxSubscription,
    private cxWorkingState: CxWorkingState,
    private confirmView: CxProgressiveDialConfirmView,
    private toast: Toast,
    private portManager: PortManager,
    @optional('CxProgressiveDialOptions')
    private progressiveDialOptions?: CxProgressiveDialOptions,
  ) {
    super();
    if (this.portManager?.shared) {
      this.portManager.onServer(() => {
        this._initialize();
      });
    } else {
      this._initialize();
    }
  }

  // Not persisted: a reload or a worker restart must not resume automatic
  // dialing without the agent starting it again.
  @state
  running = false;

  @state
  phase: ProgressiveDialPhase = 'idle';

  @state
  nextDialAt: number | null = null;

  @state
  nextLeadRequestId: string | null = null;

  @state
  stopReason: ProgressiveDialStopReason | null = null;

  @action
  private _setPhase(phase: ProgressiveDialPhase, update: PhaseUpdate = {}): void {
    this.phase = phase;
    this.nextDialAt = update.nextDialAt ?? null;
    if (update.nextLeadRequestId !== undefined) {
      this.nextLeadRequestId = update.nextLeadRequestId;
    }
  }

  @action
  private _setRunning(): void {
    this.running = true;
    this.stopReason = null;
    this.phase = 'waiting';
  }

  @action
  private _setStopped(reason: ProgressiveDialStopReason | null): void {
    this.running = false;
    this.stopReason = reason;
    this.phase = 'idle';
    this.nextDialAt = null;
    this.nextLeadRequestId = null;
  }

  /**
   * Status reported to host pages
   */
  get dialerStatus(): ProgressiveDialStatus {
    return {
      running: this.running,
      phase: this.phase,
      nextDialAt: this.nextDialAt,
      nextLeadRequestId: this.nextLeadRequestId,
      reason: this.stopReason,
    };
  }

  /**
   * Whether the dialer may move to the next lead now
   */
  get canAdvance(): boolean {
    return this._loopState === 'advance';
  }

  private get _loopState(): LoopState {
    if (
      !this.running ||
      !this.cxAgentSession.isProgressiveDialMode ||
      this._isBusy
    ) {
      return 'wait';
    }
    if (this._isAgentAvailable) {
      return 'advance';
    }
    // TRANSITION is only passed through on the way to the next state.
    return this.cxWorkingState.agentState.agentState === agentStateTypes.transition
      ? 'wait'
      : 'prompt';
  }

  /**
   * Starting: the go-available prompt or the line connection is in progress.
   * Read through a getter so a stop in between is seen after each await.
   */
  private get _isConnecting(): boolean {
    return this.phase === 'connecting';
  }

  private get _isAgentAvailable(): boolean {
    return (
      this.cxWorkingState.agentState.agentState === agentStateTypes.available
    );
  }

  /**
   * On a call, placing one, or in pending disposition
   */
  private get _isBusy(): boolean {
    return (
      this.cxWorkingState.isPendingDisposition ||
      this.cxPresence.calls.length > 0 ||
      !this.cxCall.isIdle
    );
  }

  /**
   * Notifies on the server port when the status changes, and when a start is
   * refused.
   */
  onStatusChange(
    listener: (status: ProgressiveDialStatus) => void,
  ): () => void {
    this._statusListeners.add(listener);
    return () => {
      this._statusListeners.delete(listener);
    };
  }

  /**
   * Notifies on the server port when the agent has to answer a dialer prompt,
   * so the widget can be brought up.
   */
  onAttentionRequired(listener: () => void): () => void {
    this._attentionListeners.add(listener);
    return () => {
      this._attentionListeners.delete(listener);
    };
  }

  /**
   * Starts the progressive dialer: asks the agent to go available when needed,
   * connects the offhook line and keeps it open, then dials leads one by one.
   * @returns whether the dialer is running
   */
  @track((_: CxProgressiveDial, params?: ProgressiveDialCommandParams) => [
    trackEvents.startProgressiveDialer,
    { source: params?.source ?? 'widget' },
  ])
  @delegate('server')
  async start(_params: ProgressiveDialCommandParams = {}): Promise<boolean> {
    if (this.running || this._isConnecting) {
      return this.running;
    }
    if (!this._canStart()) {
      return false;
    }
    this._setPhase('connecting');
    const ready = (await this._ensureAvailable()) && (await this._connectLine());
    // A stop while connecting already set the phase back to idle, before the
    // line it released was connected.
    if (ready && !this._isConnecting) {
      await this.cxCall.releasePersistentOffhook();
    }
    if (!ready || !this._isConnecting) {
      return false;
    }
    this._setRunning();
    this._startLoop();
    return true;
  }

  /**
   * Stops the progressive dialer and releases the offhook line, now when no
   * call is live, otherwise when the call ends.
   */
  @track((_: CxProgressiveDial, params?: ProgressiveDialCommandParams) => [
    trackEvents.stopProgressiveDialer,
    { source: params?.source ?? 'widget' },
  ])
  @delegate('server')
  async stop(_params: ProgressiveDialCommandParams = {}): Promise<void> {
    if (!this.running && this.phase === 'idle') {
      return;
    }
    await this._halt({ reason: 'stopped', releaseLine: true });
  }

  private _canStart(): boolean {
    if (!this.cxAgentSession.isProgressiveDialMode) {
      this.toast.warning({ message: t('notProgressive') });
      this._refuse('notProgressive');
      return false;
    }
    if (this._isBusy) {
      this.toast.warning({ message: t('finishCallFirst') });
      this._refuse('busy');
      return false;
    }
    return true;
  }

  /**
   * Opens the "Required state change" prompt when the agent is not available,
   * and waits for the AVAILABLE state after Go available.
   */
  private async _ensureAvailable(): Promise<boolean> {
    if (this._isAgentAvailable) {
      return true;
    }
    this._attentionListeners.forEach((listener) => listener());
    const confirmed = await this.confirmView.openGoAvailableConfirm().answer;
    if (!this._isConnecting) {
      return false;
    }
    if (confirmed) {
      this._requestAvailable();
      if (await this._waitForAvailable()) {
        return true;
      }
    }
    this._refuse('notAvailable');
    return false;
  }

  private _requestAvailable(): void {
    this.cxWorkingState.changeWorkingState({
      agentState: agentStateTypes.available,
      agentAuxState: '',
    });
  }

  private async _waitForAvailable(): Promise<boolean> {
    try {
      await firstValueFrom(
        fromWatchValue(this, () => this._isAgentAvailable).pipe(
          startWith(this._isAgentAvailable),
          filter(Boolean),
          timeout(AVAILABLE_WAIT_MS),
        ),
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * The progressive dialer needs a persistent voice session that stays
   * connected for as long as it runs.
   */
  private async _connectLine(): Promise<boolean> {
    if (await this.cxCall.connectPersistentOffhook()) {
      return true;
    }
    if (this._isConnecting) {
      this._refuse('offhookFailed');
    }
    return false;
  }

  /**
   * Reports a start that did not happen. The status does not change otherwise,
   * so host pages get the reason here.
   */
  private _refuse(reason: ProgressiveDialStopReason): void {
    const isUnchanged =
      !this.running && this.phase === 'idle' && this.stopReason === reason;
    this._setStopped(reason);
    if (isUnchanged) {
      this._emitStatus();
    }
  }

  private _startLoop(): void {
    this._loop?.unsubscribe();
    this._loop = merge(
      fromWatchValue(this, () => this._loopState).pipe(
        startWith(this._loopState),
      ),
      this._kick$.pipe(map(() => this._loopState)),
    )
      .pipe(
        debounceTime(SETTLE_MS),
        switchMap((loopState) => this._runLoopStep$(loopState)),
        takeUntilAppDestroy,
      )
      .subscribe();
  }

  private _runLoopStep$(loopState: LoopState): Observable<unknown> {
    if (loopState === 'advance') {
      return this._cycle$();
    }
    if (loopState === 'prompt') {
      return this._promptAvailable$();
    }
    return this._wait$();
  }

  /**
   * Asks the agent to go available, as Agent One does after a call that
   * leaves the agent in another state. Go available resumes dialing once the
   * AVAILABLE state arrives; Dismiss stops the dialer. The prompt closes by
   * itself when the agent becomes available another way.
   */
  private _promptAvailable$(): Observable<unknown> {
    return concat(this._wait$(), timer(AVAILABLE_PROMPT_DELAY_MS)).pipe(
      switchMap(() => this._askGoAvailable$()),
      switchMap((confirmed) => from(this._answerGoAvailable(confirmed))),
    );
  }

  private _askGoAvailable$(): Observable<boolean> {
    return new Observable<boolean>((subscriber) => {
      this._attentionListeners.forEach((listener) => listener());
      const confirm = this.confirmView.openGoAvailableConfirm();
      let isAnswered = false;
      void confirm.answer.then((confirmed) => {
        isAnswered = true;
        subscriber.next(confirmed);
        subscriber.complete();
      });
      return () => {
        if (!isAnswered) {
          confirm.close();
        }
      };
    });
  }

  private async _answerGoAvailable(confirmed: boolean): Promise<void> {
    if (confirmed) {
      this._requestAvailable();
      return;
    }
    await this._halt({ reason: 'notAvailable' });
  }

  private _wait$(): Observable<never> {
    return defer(() => {
      if (this.running) {
        this._setPhase('waiting');
      }
      return EMPTY;
    });
  }

  /**
   * One step of the loop: the next pending lead, or a new batch of leads,
   * then the countdown and the dial. Retries in 5 seconds when no lead is
   * left.
   */
  private _cycle$(): Observable<unknown> {
    return defer(() => from(this._resolveNextLead())).pipe(
      switchMap((lead) =>
        lead ? this._countdownThenDial$(lead) : this._retryLater$(),
      ),
    );
  }

  private _countdownThenDial$(lead: Lead): Observable<unknown> {
    return defer(() => {
      const delay = this.cxAgentSession.progressiveCallDelayMs;
      this._setPhase('countdown', {
        nextDialAt: Date.now() + delay,
        nextLeadRequestId: lead.requestId,
      });
      return timer(delay).pipe(switchMap(() => from(this._dial(lead))));
    });
  }

  private _retryLater$(): Observable<unknown> {
    return defer(() => {
      this._setPhase('noLeads', {
        nextDialAt: Date.now() + NO_LEADS_RETRY_MS,
        nextLeadRequestId: null,
      });
      return timer(NO_LEADS_RETRY_MS).pipe(switchMap(() => this._cycle$()));
    });
  }

  private async _resolveNextLead(): Promise<Lead | null> {
    const pendingLead = this.cxLeads.nextPendingLead;
    if (pendingLead) {
      return pendingLead;
    }
    this._setPhase('fetching', { nextLeadRequestId: null });
    await this.cxLeads.fetchLeads();
    return this.cxLeads.nextPendingLead ?? null;
  }

  /**
   * Dials a lead at the end of its countdown. The server picks the number,
   * as in Agent One.
   */
  private async _dial(lead: Lead): Promise<void> {
    if (!this.canAdvance) {
      this._setPhase('waiting');
      return;
    }
    if (this.cxLeads.getLeadState(lead) !== PENDING_LEAD_STATE) {
      this._kick$.next();
      return;
    }
    this._setPhase('dialing', { nextLeadRequestId: lead.requestId });
    if (!this.cxPresence.isOffhook && !(await this._connectLine())) {
      await this._halt({ reason: 'offhookFailed' });
      return;
    }
    if (!(await this.cxLeads.dialLead(lead))) {
      this.toast.danger({ message: t('dialFailed') });
      await this._halt({ reason: 'dialFailed' });
    }
  }

  private async _halt({ reason, releaseLine = false }: HaltParams): Promise<void> {
    this._loop?.unsubscribe();
    this._loop = undefined;
    this._setStopped(reason);
    if (releaseLine) {
      await this.cxCall.releasePersistentOffhook();
    }
  }

  private _haltWhenRunning(params: HaltParams): void {
    if (this.running || this._isConnecting) {
      void this._halt(params);
    }
  }

  private _emitStatus(): void {
    const { dialerStatus } = this;
    this._statusListeners.forEach((listener) => listener(dialerStatus));
  }

  private _initialize(): void {
    watch(
      this,
      () =>
        [
          this.running,
          this.phase,
          this.nextDialAt,
          this.nextLeadRequestId,
          this.stopReason,
        ] as const,
      () => this._emitStatus(),
      { multiple: true },
    );
    this._bindStopTriggers();
    this.cxLeads.onLeadEvent((event) => {
      // A pass of the lead in countdown moves on to the next one at once.
      if (event.action === 'passed' && this.running) {
        this._kick$.next();
      }
    });
  }

  /**
   * Agent One stops the dialer on any of these. Only the Stop command and a
   * dial group change release the line; the others keep it open.
   * A state the agent picks stops it too, while a state the server sets after
   * a call opens the go-available prompt instead (see `_loopState`).
   */
  private _bindStopTriggers(): void {
    this.cxCall.onManualDialout(() => {
      this._haltWhenRunning({ reason: 'manualOutdial' });
    });
    this.cxSettings.onAgentOffhookEnd(() => {
      this._haltWhenRunning({ reason: 'offhookEnded' });
    });
    this.cxAuth.beforeAgentLogout(() => {
      this._haltWhenRunning({ reason: 'logout' });
    });
    this.cxSubscription.subscribe(
      CxCallbackTypes.NEW_CALL,
      (call?: CxBaseCall) => {
        if (call?.callType === 'INBOUND') {
          this._haltWhenRunning({ reason: 'inboundCall' });
        }
      },
    );
    watch(
      this,
      () => this.cxAgentSession.isProgressiveDialMode,
      (isProgressiveDialMode) => {
        if (!isProgressiveDialMode) {
          this._haltWhenRunning({
            reason: 'dialGroupChanged',
            releaseLine: true,
          });
        }
      },
    );
    this.cxClient.onAgentStateRequest((agentState) => {
      if (agentState !== agentStateTypes.available) {
        this._haltWhenRunning({ reason: 'agentState' });
      }
    });
  }
}

export { CxProgressiveDial };
