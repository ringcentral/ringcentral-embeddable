import {
  AppFeatures,
  ConnectivityManager,
  RateLimiter,
} from '@ringcentral-integration/micro-auth/src/app/services';
import { Toast } from '@ringcentral-integration/micro-core/src/app/services';
import {
  ComposeText,
  MessageStore,
} from '@ringcentral-integration/micro-message/src/app/services';
import {
  Call,
  CallHistory,
  CallLogTasks,
} from '@ringcentral-integration/micro-phone/src/app/services';
import { CallsListViewSpring as CallsListViewSpringBase } from '@ringcentral-integration/micro-phone/src/app/views/CallsListViewSpring';
import type {
  CallsListPanelSpringProps,
  CallsListViewSpringOptions,
  CallsListViewSpringProps,
} from '@ringcentral-integration/micro-phone/src/app/views/CallsListViewSpring/CallsList.view.interface';
import { CallViewState } from '@ringcentral-integration/micro-phone/src/app/views/CallView/services';
import { DialerView } from '@ringcentral-integration/micro-phone/src/app/views/DialerView';
import { IntegrationConfig } from '@ringcentral-integration/micro-setting/src/app/services';
import {
  injectable,
  optional,
  RouterPlugin,
  type UIFunctions,
} from '@ringcentral-integration/next-core';
import React from 'react';

import { CallsListPage } from './CallsListPage';

@injectable({
  name: 'CallsListViewSpring',
})
export class CallsListView extends CallsListViewSpringBase {
  constructor(
    callViewState: CallViewState,
    connectivityManager: ConnectivityManager,
    callHistory: CallHistory,
    rateLimiter: RateLimiter,
    call: Call,
    messageStore: MessageStore,
    router: RouterPlugin,
    appFeatures: AppFeatures,
    toast: Toast,
    integrationConfig: IntegrationConfig,
    @optional() dialerView?: DialerView,
    @optional() composeText?: ComposeText,
    @optional() callLogTasks?: CallLogTasks,
    @optional('CallsListViewOptions')
    callsListViewOptions?: CallsListViewSpringOptions
  ) {
    super(
      callViewState,
      connectivityManager,
      callHistory,
      rateLimiter,
      call,
      messageStore,
      router,
      appFeatures,
      toast,
      integrationConfig,
      dialerView,
      composeText,
      callLogTasks,
      callsListViewOptions
    );
    this._appCallHistory = callHistory;
    this._appRouter = router;
  }

  private readonly _appCallHistory: CallHistory;

  private readonly _appRouter: RouterPlugin;

  override getUIFunctions(
    props: CallsListViewSpringProps,
  ): UIFunctions<CallsListPanelSpringProps> {
    const functions = super.getUIFunctions(props);
    const baseUseActionsHandler = functions.useActionsHandler;
    const useActionsHandler: CallsListPanelSpringProps['useActionsHandler'] =
      (call, info, location) => {
        const baseHandler = baseUseActionsHandler(call, info, location);
        return async (actionType) => {
          if (actionType === 'viewDetail') {
            const telephonySessionId = call.telephonySessionId;
            const callLog =
              this._appCallHistory.getHistoryByTelephonySessionId(
                telephonySessionId,
              );
            if (callLog) {
              await this._appRouter.push(
                `/history/${telephonySessionId}`,
              );
              return;
            }
          }
          await baseHandler(actionType);
        };
      };
    return {
      ...functions,
      useActionsHandler,
    };
  }

  override component(props: CallsListViewSpringProps) {
    const component = super.component(props);
    if (!React.isValidElement(component)) {
      return component;
    }
    return <CallsListPage {...component.props} />;
  }
}
