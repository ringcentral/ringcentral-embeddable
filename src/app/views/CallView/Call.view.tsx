import type { Call } from '@ringcentral-integration/commons/interfaces/Call.interface';
import {
  RateLimiter,
  RingCentralExtensions,
} from '@ringcentral-integration/micro-auth/src/app/services';
import {
  AppFooterNav,
  AppMainContent,
} from '@ringcentral-integration/micro-core/src/app/components';
import {
  SyncTabId,
  SyncTabView,
} from '@ringcentral-integration/micro-core/src/app/views';
import {
  autobind,
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
import { distinctUntilChanged } from 'rxjs';

import {
  ActiveCallControl,
  CallAction,
  type CallMetaInfo,
  CallMonitor,
  isRingingCall,
  PreinsertCall,
  useLatestExistCall,
  Webphone,
} from '@ringcentral-integration/micro-phone/src/app/services';
import type { CallViewOptions } from '@ringcentral-integration/micro-phone/src/app/views/CallView';
import { CallView as CallViewBase } from '@ringcentral-integration/micro-phone/src/app/views/CallView';
import { CallViewState } from '@ringcentral-integration/micro-phone/src/app/views/CallView/services';
import { ActiveCallsView } from '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/ActiveCallsViewSpring';
import { AddCallView } from '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/AddCallViewSpring';
import { CallControlView } from '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/CallControlViewSpring';
import { ForwardView } from '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/ForwardViewSpring';
import { IncomingCallView } from '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/IncomingCallViewSpring';
import { KeypadView } from '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/KeypadViewSpring';
import { PostCallView } from '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/PostCallViewSpring';
import { ReplyWithMessageView } from '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/ReplyWithMessageViewSpring';
import { TransferView } from '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/TransferViewSpring';
import {
  CallLogFormView,
  type CallLogFormViewProps,
} from '@ringcentral-integration/micro-phone/src/app/views/CallLogFormView';
import { QuickCallActionView } from '@ringcentral-integration/micro-phone/src/app/views/QuickCallActionView';

import { SideWidgetView } from '../SideWidgetView';
import type { SmartNotesHistoryCall } from '../CallHistoryView/SmartNotesHistoryCall';
import type { SmartNotesView } from '../SmartNotesView';
import { ParkView } from './ParkView';

const FullWrapper: FC<{ children?: React.ReactNode }> = ({ children }) => (
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
  CallDetailForm: FC<CallLogFormViewProps>;
  CallItem: FC<CallItemProps>;
  CallLogArea: FC;
};

type SideWidgetCallAction = CallAction & {
  leaveCallingRouteForSideWidget: () => Promise<void>;
};

@injectable({
  name: 'CallView',
})
// @ts-expect-error override private base method processNewCall
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
    @optional() sideWidgetView?: SideWidgetView,
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
    this._appCallAction = callAction;
    this._appCallViewState = callViewState;
    this._appActiveCallsView = activeCallsView;
    this._appAddCallView = addCallView;
    this._appCallLogFormView = callLogFormView;
    this._appRouter = router;
    this._appSyncTabView = syncTabView;
    const privateComponents = this as unknown as CallViewPrivateComponents;
    this._baseCallDetailForm = (
      CallViewBase.prototype as unknown as Pick<
        CallViewPrivateComponents,
        'CallDetailForm'
      >
    ).CallDetailForm.bind(this);
    const BaseCallLogArea = (
      CallViewBase.prototype as unknown as Pick<
        CallViewPrivateComponents,
        'CallLogArea'
      >
    ).CallLogArea.bind(this);
    const PostCallLogArea: FC = () => {
      const view = useConnector(() => callViewState.view);
      return view === 'postCall' && !sideWidgetView?.enabled ? (
        <BaseCallLogArea />
      ) : null;
    };
    privateComponents.CallItem = this.renderCallItem.bind(this);
    privateComponents.CallDetailForm = this.renderCallDetailForm.bind(this);
    privateComponents.CallLogArea = PostCallLogArea;
    this.bindPostCallNavigation(sideWidgetView);
  }

  private readonly _parkView: ParkView;
  private readonly _appCallAction: CallAction;
  private readonly _appCallViewState: CallViewState;
  private readonly _appActiveCallsView: ActiveCallsView;
  private readonly _appAddCallView: AddCallView;
  private readonly _appCallLogFormView?: CallLogFormView;
  private readonly _baseCallDetailForm: FC<CallLogFormViewProps>;
  private readonly _appRouter: RouterPlugin;
  private readonly _appSyncTabView: SyncTabView;

  override get showQuickCallAction(): boolean {
    const currentPath = this._appRouter.currentPath;
    const isCallsTab =
      currentPath === '/dialer/calls' ||
      (currentPath === '/dialer' &&
        this._appSyncTabView.getActive(SyncTabId.DIALPAD) === 'calls');
    return !isCallsTab && super.showQuickCallAction;
  }

  @autobind
  private renderCallDetailForm(
    props: CallLogFormViewProps,
  ): React.ReactElement | null {
    if (props.variant !== 'history') {
      return <this._baseCallDetailForm {...props} />;
    }
    const call = props.info as SmartNotesHistoryCall | undefined;
    const hasSmartNotes = Boolean(call?.hasSmartNote);
    const smartNotesView = this._smartNotesView as SmartNotesView | undefined;
    return (
      <div
        className="flex flex-col"
        data-sign="history-call-details-content"
      >
        {this._appCallLogFormView ? (
          <div className="flex-none" data-sign="history-call-log-form">
            <this._appCallLogFormView.component {...props} />
          </div>
        ) : null}
        {hasSmartNotes && smartNotesView ? (
          <smartNotesView.component
            {...props}
            embedded
            mode="post-call"
            data-sign="embedded-smart-notes"
          />
        ) : null}
      </div>
    );
  }

  private bindPostCallNavigation(sideWidgetView?: SideWidgetView): void {
    if (!sideWidgetView?.enabled) {
      return;
    }
    fromWatchValue(this, () => this._appCallViewState.view)
      .pipe(distinctUntilChanged(), takeUntilAppDestroy)
      .subscribe((view) => this.handlePostCallViewChange(view));
  }

  private handlePostCallViewChange(view: string): void {
    if (view === 'postCall') {
      void (
        this._appCallAction as SideWidgetCallAction
      ).leaveCallingRouteForSideWidget();
    }
  }

  /** Keeps calls on another device closed until the user selects them. */
  private processNewCall(call: Call): void {
    const isOtherDeviceCall = Boolean(!call.webphoneSession && call.id);
    if (isOtherDeviceCall) {
      this._appCallAction._updateCallMetaInfo(call.telephonySessionId!, {
        currentPath: isRingingCall(call) ? 'incoming' : 'controls',
      });
      return;
    }
    (CallViewBase.prototype as any)['processNewCall'].call(this, call);
  }

  override component() {
    const view = useConnector(() => this._appCallViewState.view);
    const activeCallInfo = useConnector(() => this._appCallAction.activeCallInfo);
    const latestActiveCall = useLatestExistCall(activeCallInfo);
    const activeRenderCallInfo = useMemo(() => {
      if (!activeCallInfo) {
        return undefined;
      }
      return activeCallInfo.call
        ? activeCallInfo
        : { ...activeCallInfo, call: latestActiveCall };
    }, [activeCallInfo, latestActiveCall]);
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
