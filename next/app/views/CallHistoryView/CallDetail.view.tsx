import { Auth } from '@ringcentral-integration/micro-auth/src/app/services';
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
  type UIFunctions,
  type UIProps,
} from '@ringcentral-integration/next-core';
import React from 'react';
import type { SetOptional } from 'type-fest';

import { CallDetailPage } from './CallDetailPage';

type CallDetailUIProps = UIProps<
  SetOptional<CallDetailViewPanelProps, 'currentCallLog'>
> & {
  recordingUri?: string;
};

function getRecordingUri(
  contentUri: string | undefined,
  accessToken: string | undefined,
): string | undefined {
  if (!contentUri || !accessToken) {
    return contentUri;
  }
  const url = new URL(contentUri);
  url.searchParams.set('access_token', accessToken);
  return url.toString();
}

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
    private readonly _auth: Auth,
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
    this._appRouter = router;
  }

  private readonly _appRouter: RouterPlugin;

  override getUIProps(props: CallDetailViewProps): CallDetailUIProps {
    const uiProps = super.getUIProps(props);
    return {
      ...uiProps,
      recordingUri: getRecordingUri(
        uiProps.currentCallLog?.recording?.contentUri,
        this._auth.accessToken,
      ),
    };
  }

  override getUIFunctions(
    props: CallDetailViewProps,
  ): UIFunctions<CallDetailViewPanelProps> {
    return {
      ...super.getUIFunctions(props),
      goBack: () => this._appRouter.push('/dialer'),
    };
  }

  override component(props: CallDetailViewProps) {
    const component = super.component(props);
    if (!React.isValidElement<CallDetailViewPanelProps>(component)) {
      return component;
    }
    return (
      <CallDetailPage {...component.props} scrollCallInfoWithContent />
    );
  }
}
