import type { Call as CallData } from '@ringcentral-integration/commons/interfaces/Call.interface';
import type { WebSocketSubscription as Subscription } from '@ringcentral-integration/micro-auth/src/app/services';
import { ContactMatcher } from '@ringcentral-integration/micro-contacts/src/app/services';
import { AppMainContent } from '@ringcentral-integration/micro-core/src/app/components';
import {
  fromWatchValue,
  inject,
  injectable,
  optional,
  PortManager,
  RouterPlugin,
  takeUntilAppDestroy,
  useConnector,
} from '@ringcentral-integration/next-core';
import {
  Call,
  CallAction,
  CALLING_ROUTE_PATH,
  CallMonitor,
  CallingSettings,
  type OnCallActionType,
  PreinsertCall,
  Webphone as MicroPhoneWebphone,
} from '@ringcentral-integration/micro-phone/src/app/services';
import {
  ConnectingView as ConnectingViewBase,
  type PreinsertConnectingOverlayViewProps,
} from '@ringcentral-integration/micro-phone/src/app/views/ConnectingView/Connecting.view';
import { CallViewState } from '@ringcentral-integration/micro-phone/src/app/views/CallView/services';
import { CallControlView as CallControlViewBase } from '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/CallControlViewSpring';
import React, { type FC, type ReactElement, useCallback, useMemo } from 'react';
import { filter, tap } from 'rxjs';

import { MatchedContactSelection } from '../../services/MatchedContactSelection';
import type { Webphone } from '../../services/WebphoneV2';
import type { CallControlView } from '../CallView/CallControlView/CallControl.view';
import { VoicemailDropCallControlPanel } from '../CallView/CallControlView/VoicemailDropCallControlPanel';

type ConnectingViewInternals = {
  Connecting: FC<PreinsertConnectingOverlayViewProps>;
  call: CallData;
  preinsertConnectingWebphoneSessionId: string;
};

type CallSelectionInfo = NonNullable<CallData['callSelectionInfo']>;

@injectable({
  name: 'ConnectingView',
})
export class ConnectingView extends ConnectingViewBase {
  constructor(
    @inject(CallControlViewBase) callControlView: CallControlView,
    call: Call,
    callAction: CallAction,
    callViewState: CallViewState,
    callingSettings: CallingSettings,
    preinsertCall: PreinsertCall,
    portManager: PortManager,
    router: RouterPlugin,
    @inject('Subscription') subscription: Subscription,
    @inject(MicroPhoneWebphone) webphone: Webphone,
    matchedContactSelection: MatchedContactSelection,
    callMonitor: CallMonitor,
    @optional() contactMatcher?: ContactMatcher,
  ) {
    super(
      callControlView,
      call,
      callAction,
      callViewState,
      callingSettings,
      preinsertCall,
      portManager,
      router,
      subscription,
      contactMatcher,
    );
    this._connectingCallAction = callAction;
    this._connectingCallControlView = callControlView;
    this._connectingCallViewState = callViewState;
    this._connectingPortManager = portManager;
    this._connectingRouter = router;
    this._connectingWebphone = webphone;
    this._matchedContactSelection = matchedContactSelection;
    this._connectingCallMonitor = callMonitor;
    const internals = this as unknown as ConnectingViewInternals;
    internals.Connecting = this.renderConnecting.bind(this);
  }

  private readonly _connectingCallAction: CallAction;
  private readonly _connectingCallControlView: CallControlView;
  private readonly _connectingCallViewState: CallViewState;
  private readonly _connectingPortManager: PortManager;
  private readonly _connectingRouter: RouterPlugin;
  private readonly _connectingWebphone: Webphone;
  private readonly _matchedContactSelection: MatchedContactSelection;
  private readonly _connectingCallMonitor: CallMonitor;

  override onInitOnce(): void {
    super.onInitOnce();
    if (this._connectingPortManager.shared) {
      // Lifecycle hooks never run on a client port, so an `onClient` binding
      // registered here never fires. The webphone runtime publishes its call
      // events on the server, which also owns the connecting state.
      this._connectingPortManager.onServer(() => {
        this.bindConnectingCallReady();
        this.bindConnectingCallLifecycle();
      });
      return;
    }
    this.bindConnectingCallReady();
    this.bindConnectingCallLifecycle();
  }

  private bindConnectingCallReady(): void {
    if (!this._connectingCallAction.displayCallTelephonyIdChange$) {
      return;
    }
    fromWatchValue(
      this,
      () => {
        const { preinsertConnectingWebphoneSessionId } =
          this as unknown as ConnectingViewInternals;
        return [
          preinsertConnectingWebphoneSessionId,
          this._connectingCallViewState.view,
          this._connectingCallAction.activeCallInfo,
          this._connectingRouter.currentPath,
        ] as const;
      },
      { multiple: true },
    )
      .pipe(
        filter(
          ([webphoneSessionId, view, activeCallInfo, currentPath]) =>
            Boolean(
              webphoneSessionId &&
                view === 'activeCall' &&
                currentPath === CALLING_ROUTE_PATH &&
                activeCallInfo?.meta?.open &&
                activeCallInfo.call?.webphoneSession?.id ===
                  webphoneSessionId,
            ),
        ),
        tap(() => {
          this.resetPreinsertConnecting();
        }),
        takeUntilAppDestroy,
      )
      .subscribe();
  }

  private bindConnectingCallLifecycle(): void {
    this._connectingWebphone.onCallStart((session) => {
      this.closeConnectingForSession(session.id);
    });
    this._connectingWebphone.end$
      .pipe(takeUntilAppDestroy)
      .subscribe((session) => {
        this.closeConnectingForSession(session.id);
      });
  }

  private closeConnectingForSession(webphoneSessionId: string): void {
    const { preinsertConnectingWebphoneSessionId } =
      this as unknown as ConnectingViewInternals;
    if (
      this.isConnecting &&
      preinsertConnectingWebphoneSessionId === webphoneSessionId
    ) {
      void this.setPreinsertConnectingOnServer(false);
    }
  }

  /**
   * The contact the dialled record resolved to, for the stand-in call shown
   * while connecting.
   *
   * The stand-in has a fake session id, so it carries no pick of its own and
   * would render `Maybe: <name>`. Until the real call arrives the pick waits as
   * the pending outbound selection. Once the call claims it, it is read off
   * that call, found by the telephony session id its webphone session reports:
   * this screen can stay up a few updates longer, and the call reaches the
   * call monitor before it becomes the active call.
   */
  private getConnectingCallSelectionInfo(
    call: CallData,
  ): CallSelectionInfo | undefined {
    const { preinsertConnectingWebphoneSessionId } =
      this as unknown as ConnectingViewInternals;
    const telephonySessionId = preinsertConnectingWebphoneSessionId
      ? this._connectingWebphone.sessions.find(
          (session) => session.id === preinsertConnectingWebphoneSessionId,
        )?.partyData?.sessionId
      : undefined;
    const realCall = telephonySessionId
      ? this._connectingCallMonitor.callsInfo.telephonySessionIdCallMap[
          telephonySessionId
        ]
      : undefined;
    const claimedSelection = realCall?.sessionId
      ? this._connectingCallViewState.getExtraLogData(
          realCall.sessionId,
          telephonySessionId!,
        )?.callSelectionInfo
      : undefined;
    return (
      (claimedSelection as CallSelectionInfo | undefined) ??
      this._matchedContactSelection.resolvePendingOutboundSelection(
        [call.to?.phoneNumber, call.to?.extensionNumber],
        call.toMatches,
      )
    );
  }

  private renderConnecting(
    props: PreinsertConnectingOverlayViewProps,
  ): ReactElement {
    const connectingCall = useConnector(
      () => (this as unknown as ConnectingViewInternals).call,
    );
    const callSelectionInfo = useConnector(() =>
      this.getConnectingCallSelectionInfo(connectingCall),
    );
    const call = useMemo(
      () =>
        callSelectionInfo
          ? { ...connectingCall, callSelectionInfo }
          : connectingCall,
      [connectingCall, callSelectionInfo],
    );
    const actions = this._connectingCallControlView.useCallActions({
      call,
      actionsDisabled: true,
    });
    const uiProps = useConnector(() =>
      this._connectingCallControlView.getUIProps({
        call,
        actionsDisabled: true,
      }),
    );
    const onAction = useCallback<OnCallActionType>(
      async (actionType) => {
        if (actionType === 'hangUp' || actionType === 'back') {
          await this.hangUpPreinsertConnecting();
          return;
        }
        props.onAction?.(actionType);
      },
      [props.onAction],
    );
    return (
      <AppMainContent>
        <div
          aria-live="polite"
          aria-busy="true"
          className="absolute inset-0 z-drawer flex flex-col bg-neutral-base"
          data-sign="preinsertConnectingOverlay"
        >
          <VoicemailDropCallControlPanel
            {...uiProps}
            call={call}
            actions={actions}
            transferringCalls={null}
            onAction={onAction}
            onExpand={undefined}
            AudioCardComponent={null}
            viewAiNote={() => undefined}
            onCloseAiNoteTip={() => undefined}
          />
        </div>
      </AppMainContent>
    );
  }
}
