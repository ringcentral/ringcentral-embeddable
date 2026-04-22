import type { Call } from '@ringcentral-integration/commons/interfaces/Call.interface';
import {
  RateLimiter,
  RingCentralExtensions,
} from '@ringcentral-integration/micro-auth/src/app/services';
import { AppFooterNav } from '@ringcentral-integration/micro-core/src/app/components';
import { SyncTabView } from '@ringcentral-integration/micro-core/src/app/views';
import {
  autobind,
  injectable,
  optional,
  PortManager,
  Root,
} from '@ringcentral-integration/next-core';
import React, { FC } from 'react';

import {
  ActiveCallControl,
  CallAction,
  type CallMetaInfo,
  CallMonitor,
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
    (this as any).CallItem = this.renderCallItem.bind(this);
  }

  private readonly _parkView: ParkView;

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
