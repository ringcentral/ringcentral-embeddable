import {
  action,
  inject,
  injectable,
  optional,
  PortManager,
  RcModule,
  RouterPlugin,
  state,
  watch,
} from '@ringcentral-integration/next-core';

import type { CxHostIntegration } from '../app/services/RingCX/RingCX.interface';
import type { RingCXAdapterBridge } from './interfaces/RingCXAdapterBridge.interface';
import { CxAuth } from './services/CxAuth';
import { CxCall } from './services/CxCall';
import { CxCallDisposition } from './services/CxCallDisposition';
import { CxCallMonitor } from './services/CxCallMonitor';
import { CxClient } from './services/CxClient';
import { CxProgressiveDial } from './services/CxProgressiveDial';
import { CxDialerView } from './views/CxDialerView';
import { CxWorkingState } from './services/CxWorkingState';
import type { DispositionStepOptions } from './utils/shouldShowDispositionSubmitStep';
import { shouldShowDispositionSubmitStep } from './utils/shouldShowDispositionSubmitStep';
import { shouldReplaceActivityCallRoute } from './utils/shouldReplaceActivityCallRoute';
import { dialoutStatuses } from './enums';
import { cxPath, isCxAgentPath } from './routes';

/**
 * Where the call policy wants the agent to be.
 *
 * `token` separates two requests for the same page, for example a second call
 * answered after the agent already went back to that call's page.
 */
interface CxNavigationRequest {
  readonly path: string;
  readonly mode: 'push' | 'replace';
  readonly showWindow: boolean;
  /** A call log page the agent is on stays, as the agent is still logging. */
  readonly keepLogPage: boolean;
  readonly token: number;
}

const CALL_LOG_PATH_PREFIX = '/log/call/';

@injectable({
  name: 'CxRouteCoordinator',
})
export class CxRouteCoordinator extends RcModule {
  constructor(
    private readonly _router: RouterPlugin,
    private readonly _portManager: PortManager,
    private readonly _cxAuth: CxAuth,
    private readonly _cxClient: CxClient,
    private readonly _cxCall: CxCall,
    private readonly _cxCallMonitor: CxCallMonitor,
    private readonly _cxCallDisposition: CxCallDisposition,
    private readonly _cxWorkingState: CxWorkingState,
    private readonly _cxDialerView: CxDialerView,
    @inject('CxHostIntegration')
    private readonly _host: CxHostIntegration,
    @optional('RingCXAdapterBridge')
    private readonly _bridge?: RingCXAdapterBridge,
    @optional('CxDispositionViewOptions')
    private readonly _dispositionViewOptions?: DispositionStepOptions,
    // Always registered with the RingCX modules; optional only so the call
    // policy keeps working without the progressive dialer.
    @optional()
    private readonly _cxProgressiveDial?: CxProgressiveDial,
  ) {
    super();
    this._cxAuth.onAuthSuccess(() => {
      void this._handleAuthenticationSuccess();
    });
    watch(
      this,
      () => this.navigationRequest,
      (request) => this._applyNavigationRequest(request),
    );
    if (this._portManager?.shared) {
      this._portManager.onServer(() => {
        this._watchCallStatus();
      });
    } else {
      this._watchCallStatus();
    }
  }

  /**
   * Call events are watched on a single port, and with a shared worker that
   * port owns neither a browser history nor a window. The policy therefore
   * records where the agent should be, and the ports that render the app
   * follow it.
   */
  @state
  navigationRequest: CxNavigationRequest | null = null;

  /**
   * Token this port already routed to. The request stays in shared state after
   * it is honoured, so a full state resync hands every port the same object
   * again with a new reference; without this the agent would be sent back to
   * a page the policy asked for long ago.
   */
  private _appliedNavigationToken = 0;

  @action
  private _requestNavigation(
    path: string,
    mode: 'push' | 'replace',
    { showWindow = false, keepLogPage = false } = {},
  ): void {
    this.navigationRequest = {
      path,
      mode,
      showWindow,
      keepLogPage,
      token: (this.navigationRequest?.token ?? 0) + 1,
    };
  }

  private _applyNavigationRequest(request: CxNavigationRequest | null): void {
    if (!request || !this._rendersApp) {
      return;
    }
    if (request.token === this._appliedNavigationToken) {
      return;
    }
    this._appliedNavigationToken = request.token;
    // The host opens its own log page for a call, for example right after a
    // disposition submitted while the call was still up. Leaving it would
    // close the page under the agent; the main column behind it already
    // follows the call ending.
    if (
      request.keepLogPage &&
      this._router.currentPath?.startsWith(CALL_LOG_PATH_PREFIX)
    ) {
      this.logger.info('applyNavigationRequest~~ kept log page', request.path);
      return;
    }
    this.logger.info('applyNavigationRequest~~', request.path);
    // Replace vs push is decided here, on the client that owns the visible
    // history. The server that records the request has no UI path, so a
    // queued answer while the agent is still on a previous call's activity
    // subtree must inspect this port's currentPath.
    const navigationMode: 'push' | 'replace' =
      request.mode === 'push' &&
      shouldReplaceActivityCallRoute(this._router.currentPath)
        ? 'replace'
        : request.mode;
    if (this._router.currentPath !== request.path) {
      if (navigationMode === 'push') {
        void this._router.push(request.path);
      } else {
        void this._router.replace(request.path);
      }
    }
    if (request.showWindow) {
      this._host.showClientWindow();
    }
  }

  /**
   * Opens the widget on the Leads tab, for a progressive dialer prompt the
   * agent has to answer.
   */
  showLeadsPage(): void {
    this._requestNavigation(cxPath.home('leads'), 'replace', {
      showWindow: true,
    });
  }

  /**
   * Agent home tab to return to after a call: Leads after a preview or
   * progressive call, where the agent picks or waits for the next lead.
   */
  private get _homeTab(): string {
    return this._cxCall.homeTabAfterCall;
  }

  private get _rendersApp(): boolean {
    return !this._portManager?.shared || this._portManager.isClient;
  }

  private async _handleAuthenticationSuccess(): Promise<void> {
    if (this._cxAuth.isOnlyOneAgent) {
      const agent = this._cxAuth.authenticateResponse?.agents[0];
      if (!agent?.agentId) return;
      await this._cxAuth.setAgentId(agent.agentId);
      await this._cxAuth.openSocketWithSelectedAgentId();
      return;
    }
    // Authentication also succeeds for a session restored in the background,
    // so the account picker only takes over the router inside the agent tab or
    // for a session the user just asked for.
    if (this._cxAuth.agentId) {
      return;
    }
    if (
      isCxAgentPath(this._router.currentPath) ||
      this._cxAuth.setupNavigationRequested
    ) {
      this._cxAuth.completeSetupNavigation();
      // Authentication runs on the server port, which renders no app.
      this._requestNavigation(cxPath.chooseAccount(), 'push');
    }
  }

  private _watchCallStatus(): void {
    this._cxProgressiveDial?.onAttentionRequired(() => this.showLeadsPage());
    this._cxCallMonitor.onCallRinging(async () => {
      const call = await this._cxClient.getCurrentCall();
      if (!call) {
        return;
      }
      if (call.callType === 'INBOUND') {
        this._bridge?.onRingCall(call);
      }
      await this._cxCallMonitor.getMatcher(call);
    });
    this._cxCallMonitor.onCallAnswered(async (call) => {
      if (!call?.session) {
        this.logger.warn('onCallAnswered~~ without session');
        return;
      }
      const id = this._cxClient.encodeUii(call.session);
      this.logger.info('onCallAnswered~~', id);
      this._host.dismissExCallUiForCxCall();
      this._cxCall.setActivityCallId(id);
      this._requestNavigation(cxPath.call(id), 'push', { showWindow: true });
      await this._cxDialerView.setToNumber('');
      this._bridge?.onNewCall(call);
      await this._cxCallMonitor.getMatcher(call);
    });
    this._cxCallMonitor.onCallEnded(async (call) => {
      if (!call?.session) {
        // The ended call cannot be identified without its session, so the
        // agent only goes back to the dialer when no call is left to work on.
        // A leg of a live call dropping also reports an end without one.
        const currentCall = this._cxCall.currentCall;
        this.logger.warn('onCallEnded~~ without session', {
          hasCurrentCall: !!currentCall,
        });
        if (!currentCall || currentCall.endedCall) {
          this._requestNavigation(cxPath.home(this._homeTab), 'replace');
        }
        this._bridge?.onEndCall(call);
        return;
      }
      const id = this._cxClient.encodeUii(call.session);
      const isDisposed = this._cxCallDisposition.isDisposed(id);
      const showDispositionStep = shouldShowDispositionSubmitStep(
        call,
        this._dispositionViewOptions,
      );
      this.logger.info('onCallEnded~~', id, { isDisposed, showDispositionStep });
      if (isDisposed || !showDispositionStep) {
        await this._cxWorkingState.setIsPendingDisposition(false);
        this._bridge?.onEndCall(call);
        // A call disposed while it was still up left its log page for now,
        // when the call is over.
        const openedLogPage = showDispositionStep
          ? (this._bridge?.shouldOpenLogPageAfterDisposition?.() ?? false)
          : await this._bridge?.logEndedCall?.(call);
        this._finishActivityCall(id);
        if (openedLogPage) {
          this._requestNavigation(
            `${CALL_LOG_PATH_PREFIX}${id}?source=ringcx`,
            'push',
            { showWindow: true },
          );
        } else {
          this._requestNavigation(cxPath.home(this._homeTab), 'replace', {
            keepLogPage: true,
          });
        }
        return;
      }
      // A `replace` also collapses a sub page of the call that just ended, a
      // transfer for example, so going back cannot return to a control page
      // for a call that is over.
      this._requestNavigation(cxPath.disposition(id), 'replace');
      this._bridge?.onEndCall(call);
    });
  }

  /**
   * Nothing is left to do for a call that ended with its disposition done, so
   * it stops being the call worked on. That also closes the side widgets that
   * follow it, such as the Agent Assistant, which would otherwise stay open
   * for a finished call. A call that took over in the meantime is kept.
   */
  private _finishActivityCall(id: string): void {
    if (this._cxCall.activityCallId !== id) {
      return;
    }
    this._cxCall.setDialoutStatus(dialoutStatuses.idle);
    this._cxCall.setActivityCallId('');
  }
}
