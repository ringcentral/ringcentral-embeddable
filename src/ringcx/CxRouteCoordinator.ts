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
import { CxCallbackTypes } from './services/CxClient/enums';
import { CxDialerView } from './views/CxDialerView';
import { CxIntegratedSoftphone } from './services/CxIntegratedSoftphone';
import { CxSubscription } from './services/CxSubscription';
import { CxWorkingState } from './services/CxWorkingState';
import type { DispositionStepOptions } from './utils/shouldShowDispositionSubmitStep';
import { shouldShowDispositionSubmitStep } from './utils/shouldShowDispositionSubmitStep';
import { shouldReplaceActivityCallRoute } from './utils/shouldReplaceActivityCallRoute';
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
  readonly token: number;
}

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
    private readonly _cxIntegratedSoftphone: CxIntegratedSoftphone,
    private readonly _cxSubscription: CxSubscription,
    @inject('CxHostIntegration')
    private readonly _host: CxHostIntegration,
    @optional('RingCXAdapterBridge')
    private readonly _bridge?: RingCXAdapterBridge,
    @optional('CxDispositionViewOptions')
    private readonly _dispositionViewOptions?: DispositionStepOptions,
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
        this._watchSipEvents();
      });
    } else {
      this._watchCallStatus();
      this._watchSipEvents();
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
    showWindow = false,
  ): void {
    this.navigationRequest = {
      path,
      mode,
      showWindow,
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
      this._router.push(cxPath.chooseAccount());
    }
  }

  private _watchCallStatus(): void {
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
      this._requestNavigation(cxPath.call(id), 'push', true);
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
          this._requestNavigation(cxPath.home('dialer'), 'replace');
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
        this._requestNavigation(cxPath.home('dialer'), 'replace');
        this._bridge?.onEndCall(call);
        return;
      }
      // A `replace` also collapses a sub page of the call that just ended, a
      // transfer for example, so going back cannot return to a control page
      // for a call that is over.
      this._requestNavigation(cxPath.disposition(id), 'replace');
      this._bridge?.onEndCall(call);
    });
  }

  private _watchSipEvents(): void {
    this._cxIntegratedSoftphone.onRegistered(() => {
      this._bridge?.onSoftphoneStatus('registered');
    });
    this._cxSubscription.subscribe(CxCallbackTypes.SIP_UNREGISTERED, () => {
      this._bridge?.onSoftphoneStatus('unregistered');
    });
    this._cxSubscription.subscribe(
      CxCallbackTypes.SIP_UNSTABLE_CONNECTION,
      () => {
        this._bridge?.onSoftphoneStatus('unstable');
      },
    );
    this._cxSubscription.subscribe(
      CxCallbackTypes.SIP_REGISTRATION_FAILED,
      () => {
        this._bridge?.onSoftphoneStatus('failed');
      },
    );
  }
}
