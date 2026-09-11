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
import React, { type FC, type ReactElement, useCallback } from 'react';
import { filter, tap } from 'rxjs';

import type { Webphone } from '../../services/WebphoneV2';
import type { CallControlView } from '../CallView/CallControlView/CallControl.view';
import { VoicemailDropCallControlPanel } from '../CallView/CallControlView/VoicemailDropCallControlPanel';

type ConnectingViewInternals = {
  Connecting: FC<PreinsertConnectingOverlayViewProps>;
  call: CallData;
  preinsertConnectingWebphoneSessionId: string;
};

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
    const internals = this as unknown as ConnectingViewInternals;
    internals.Connecting = this.renderConnecting.bind(this);
  }

  private readonly _connectingCallAction: CallAction;
  private readonly _connectingCallControlView: CallControlView;
  private readonly _connectingCallViewState: CallViewState;
  private readonly _connectingPortManager: PortManager;
  private readonly _connectingRouter: RouterPlugin;
  private readonly _connectingWebphone: Webphone;

  override onInitOnce(): void {
    super.onInitOnce();
    if (this._connectingPortManager.shared) {
      this._connectingPortManager.onServer(() => {
        this.bindConnectingCallReady();
      });
      this._connectingPortManager.onClient(() => {
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

  private renderConnecting(
    props: PreinsertConnectingOverlayViewProps,
  ): ReactElement {
    const call = useConnector(
      () => (this as unknown as ConnectingViewInternals).call,
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
