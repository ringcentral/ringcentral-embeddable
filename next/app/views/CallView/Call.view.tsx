import callDirections from '@ringcentral-integration/commons/enums/callDirections';
import type { Call } from '@ringcentral-integration/commons/interfaces/Call.interface';
import {
  RateLimiter,
  RingCentralExtensions,
} from '@ringcentral-integration/micro-auth/src/app/services';
import {
  AppFooterNav,
  AppMainContent,
} from '@ringcentral-integration/micro-core/src/app/components';
import { SyncTabView } from '@ringcentral-integration/micro-core/src/app/views';
import {
  autobind,
  computed,
  fromWatchValue,
  injectable,
  optional,
  PortManager,
  Root,
  RouterPlugin,
  takeUntilAppDestroy,
  useConnector,
} from '@ringcentral-integration/next-core';
import React, { FC, useMemo } from 'react';
import { concatMap, distinctUntilChanged, pairwise } from 'rxjs';

import {
  ActiveCallControl,
  CallAction,
  type CallMetaInfo,
  CallMonitor,
  isRingingCall,
  PreinsertCall,
  Webphone,
} from '@ringcentral-integration/micro-phone/src/app/services';
import type { CallViewOptions } from '@ringcentral-integration/micro-phone/src/app/views/CallView';
import {
  CallView as CallViewBase,
} from '@ringcentral-integration/micro-phone/src/app/views/CallView';
import { CallViewState } from '@ringcentral-integration/micro-phone/src/app/views/CallView/services';
import { ActiveCallsView } from '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/ActiveCallsViewSpring';
import { AddCallView } from '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/AddCallViewSpring';
import {
  CallControlView,
} from '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/CallControlViewSpring';
import { ForwardView } from '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/ForwardViewSpring';
import { IncomingCallView } from '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/IncomingCallViewSpring';
import { KeypadView } from '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/KeypadViewSpring';
import { PostCallView } from '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/PostCallViewSpring';
import {
  ReplyWithMessageView,
} from '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/ReplyWithMessageViewSpring';
import { TransferView } from '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/TransferViewSpring';
import { CallLogFormView } from '@ringcentral-integration/micro-phone/src/app/views/CallLogFormView';
import { QuickCallActionView } from '@ringcentral-integration/micro-phone/src/app/views/QuickCallActionView';

import { ParkView } from './ParkView';
import { useCallInfoWithPreinsert } from './useCallInfoWithPreinsert';

const CALLING_ROUTE_PATH = '/calling';

const FullWrapper: FC = ({ children }) => (
  <>
    <div
      tabIndex={0}
      className="absolute top-0 left-0 size-full z-drawer flex flex-col"
    >
      {children}
    </div>
    <AppFooterNav />
  </>
);

type CallItemProps = {
  call?: Call;
  meta?: CallMetaInfo;
};

type CallViewPrivateComponents = {
  CallItem: FC<CallItemProps>;
  CallLogArea: FC;
};

@injectable({
  name: 'CallView',
})
export class CallView extends CallViewBase {
  constructor(
    callAction: CallAction,
    callMonitor: CallMonitor,
    syncTabView: SyncTabView,
    root: Root,
    callViewState: CallViewState,
    keypadView: KeypadView,
    incomingCallView: IncomingCallView,
    activeCallsView: ActiveCallsView,
    transferView: TransferView,
    callControlView: CallControlView,
    forwardView: ForwardView,
    replyWithMessageView: ReplyWithMessageView,
    postCallView: PostCallView,
    addCallView: AddCallView,
    quickCallActionView: QuickCallActionView,
    activeCallControl: ActiveCallControl,
    preInsertCall: PreinsertCall,
    portManager: PortManager,
    ringCentralExtensions: RingCentralExtensions,
    rateLimiter: RateLimiter,
    webphone: Webphone,
    parkView: ParkView,
    router: RouterPlugin,
    @optional() callLogFormView?: CallLogFormView,
    @optional('CallViewOptions') callViewOptions?: CallViewOptions,
  ) {
    super(
      callAction,
      callMonitor,
      syncTabView,
      root,
      callViewState,
      keypadView,
      incomingCallView,
      activeCallsView,
      transferView,
      callControlView,
      forwardView,
      replyWithMessageView,
      postCallView,
      addCallView,
      quickCallActionView,
      activeCallControl,
      preInsertCall,
      portManager,
      ringCentralExtensions,
      rateLimiter,
      webphone,
      callLogFormView,
      callViewOptions,
    );
    this._parkView = parkView;
    this._appRouter = router;
    this._appCallAction = callAction;
    this._appCallViewState = callViewState;
    this._appCallMonitor = callMonitor;
    this._appPreinsertCall = preInsertCall;
    this._appActiveCallsView = activeCallsView;
    this._appAddCallView = addCallView;
    if (portManager.shared) {
      portManager.onServer(() => {
        this.bindPreinsertNavigation();
      });
    } else {
      this.bindPreinsertNavigation();
    }
    const privateComponents = this as unknown as CallViewPrivateComponents;
    const BaseCallLogArea = (
      CallViewBase.prototype as unknown as Pick<
        CallViewPrivateComponents,
        'CallLogArea'
      >
    ).CallLogArea.bind(this);
    const PostCallLogArea: FC = () => {
      const view = useConnector(() => callViewState.view);
      return view === 'postCall' ? <BaseCallLogArea /> : null;
    };
    privateComponents.CallItem = this.renderCallItem.bind(this);
    privateComponents.CallLogArea = PostCallLogArea;
  }

  private readonly _parkView: ParkView;
  private readonly _appRouter: RouterPlugin;
  private readonly _appCallAction: CallAction;
  private readonly _appCallViewState: CallViewState;
  private readonly _appCallMonitor: CallMonitor;
  private readonly _appPreinsertCall: PreinsertCall;
  private readonly _appActiveCallsView: ActiveCallsView;
  private readonly _appAddCallView: AddCallView;

  /**
   * the outbound call that only exists as a local webphone (SIP) session,
   * before the server telephony session event arrives
   */
  @computed
  private get connectingPreinsertInfo() {
    return this._appCallAction.preInsertCallInfoList.find(
      ({ call, meta }) =>
        call.direction === callDirections.outbound &&
        meta?.open &&
        !this._appPreinsertCall.isBringInPartyPreinsertStatus(
          call.telephonySessionId!,
        ),
    );
  }

  /**
   * navigate to the call control page as soon as the outbound SIP session is
   * created, instead of waiting for the server telephony session event (a
   * WebSocket round trip that can take seconds, during which the base
   * fullScreenCallActionOpened$ keeps the user stuck on the dial page)
   */
  private bindPreinsertNavigation() {
    fromWatchValue(
      this,
      () => this.connectingPreinsertInfo?.call.sessionId ?? null,
    )
      .pipe(
        distinctUntilChanged(),
        pairwise(),
        concatMap(async ([previousId, currentId]) => {
          if (currentId) {
            if (this._appCallViewState.view === 'hidden') {
              this._appCallViewState._setView('activeCall');
            }
            if (this._appRouter.currentPath !== CALLING_ROUTE_PATH) {
              await this._appRouter.push(CALLING_ROUTE_PATH);
            }
            return;
          }
          if (
            previousId &&
            this._appRouter.currentPath === CALLING_ROUTE_PATH &&
            !this._appCallAction.displayCallAllInfo &&
            this._appCallMonitor.allCalls.length === 0 &&
            this._appCallViewState.view !== 'postCall'
          ) {
            // the call ended before the server session arrived (rejected,
            // cancelled or failed): the base navigation never engaged, so
            // navigate back ourselves
            this._appCallViewState._setView('hidden');
            await (this._appCallAction as any)['leaveCallingRoute']();
          }
        }),
        takeUntilAppDestroy,
      )
      .subscribe();
  }

  override component() {
    const view = useConnector(() => this._appCallViewState.view);
    const activeRenderCallInfo = useCallInfoWithPreinsert(
      this._appCallAction,
      () => this.connectingPreinsertInfo,
    );
    const { CallItem, CallLogArea } =
      this as unknown as CallViewPrivateComponents;

    const modeView = useMemo(() => {
      switch (view) {
        case 'callList':
          return (
            <FullWrapper>
              <this._appActiveCallsView.component />
            </FullWrapper>
          );
        case 'addCall':
          return (
            <FullWrapper>
              <this._appAddCallView.component />
            </FullWrapper>
          );
        case 'activeCall': {
          // only show active call when not ringing call, ringing call will
          // show in the ringing call list
          const notRingingCall =
            activeRenderCallInfo && !isRingingCall(activeRenderCallInfo.call);
          if (notRingingCall) {
            return <CallItem {...activeRenderCallInfo} />;
          }

          // transient during the preinsert teardown, not an error
          return null;
        }
        case 'postCall':
        case 'hidden':
          return null;
        default:
          this.logger.error('wrong view', { view });
          return null;
      }
    }, [activeRenderCallInfo, view]);

    return (
      <AppMainContent>
        {modeView}
        <CallLogArea />
      </AppMainContent>
    );
  }

  @autobind
  private renderCallItem({ call, meta }: CallItemProps) {
    if (!meta?.open) {
      return null;
    }
    if (!call) {
      this.logger.error('call not found', { call, meta });
      return null;
    }
    if ((meta.currentPath as string) === 'park') {
      return (
        <FullWrapper>
          <this._parkView.component call={call} {...meta} />
        </FullWrapper>
      );
    }
    return (CallViewBase.prototype as any).CallItem.call(this, { call, meta });
  }
}
