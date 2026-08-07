import { SyncTabView } from '@ringcentral-integration/micro-core/src/app/views';
import { CallLogTasks } from '@ringcentral-integration/micro-phone/src/app/services';
import { CallDetailView as CallDetailViewBase } from '@ringcentral-integration/micro-phone/src/app/views/CallDetailView';
import type {
  CallDetailViewOptions,
  CallDetailViewPanelProps,
  CallDetailViewProps,
} from '@ringcentral-integration/micro-phone/src/app/views/CallDetailView/CallDetail.view.interface';
import { CallLogFormView } from '@ringcentral-integration/micro-phone/src/app/views/CallLogFormView';
import { CallView } from '@ringcentral-integration/micro-phone/src/app/views/CallView';
import { CallViewState } from '@ringcentral-integration/micro-phone/src/app/views/CallView/services';
import { CallsListViewSpring } from '@ringcentral-integration/micro-phone/src/app/views/CallsListViewSpring';
import {
  injectable,
  optional,
  PortManager,
  RouterPlugin,
} from '@ringcentral-integration/next-core';
import React from 'react';

import { CallDetailPage } from './CallDetailPage';

@injectable({
  name: 'CallDetailView',
})
export class CallDetailView extends CallDetailViewBase {
  constructor(
    syncTabView: SyncTabView,
    callViewState: CallViewState,
    portManager: PortManager,
    callsListView: CallsListViewSpring,
    callView: CallView,
    router: RouterPlugin,
    @optional() callLogTasks?: CallLogTasks,
    @optional() callLogFormView?: CallLogFormView,
    @optional('CallDetailViewOptions')
    callDetailViewOptions?: CallDetailViewOptions
  ) {
    super(
      syncTabView,
      callViewState,
      portManager,
      callsListView,
      callView,
      router,
      callLogTasks,
      callLogFormView,
      callDetailViewOptions
    );
  }

  override component(props: CallDetailViewProps) {
    const component = super.component(props);
    if (!React.isValidElement<CallDetailViewPanelProps>(component)) {
      return component;
    }
    return <CallDetailPage {...component.props} />;
  }
}
