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

import { useCallDisplayNameWithMatches } from '../../components/MatchedContactsTag';
import { MatchedContactSelection } from '../../services/MatchedContactSelection';

import { CallsListPage } from './CallsListPage';

@injectable({
  name: 'CallsListView',
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
    matchedContactSelection: MatchedContactSelection,
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
    this._matchedContactSelection = matchedContactSelection;

    // `useCallHistoryItemInfo` is an instance field on the base class, and the
    // framework pages read `DisplayName` off its result. Wrapping it here adds
    // the match picker to the history list, the call detail page, the post-call
    // screen and the dialer's recent calls in one place.
    const baseUseCallHistoryItemInfo = this.useCallHistoryItemInfo;
    this.useCallHistoryItemInfo = (call, options) => {
      const result = baseUseCallHistoryItemInfo(call, options);
      const DisplayName = useCallDisplayNameWithMatches(
        result.info.DisplayName,
        call.sessionId,
        result.info.renderInfo?.metadata?.matches,
      );
      return { ...result, info: { ...result.info, DisplayName } };
    };

    // `useActionsHandler` is an instance field on the base class, and
    // `CallDetailView` reuses this very field, so wrapping it here covers both
    // the history list and the call detail page.
    const baseUseActionsHandler = this.useActionsHandler;
    this.useActionsHandler = (call, info, location) => {
      const baseHandler = baseUseActionsHandler(call, info, location);
      return async (actionType, data) => {
        if (actionType === 'call') {
          this._handOffSelectionToOutboundCall(call, info);
        }
        return baseHandler(actionType, data);
      };
    };
  }

  private readonly _appCallHistory: CallHistory;

  private readonly _appRouter: RouterPlugin;

  private readonly _matchedContactSelection: MatchedContactSelection;

  /**
   * Passes the contact chosen on this record to the call about to be placed.
   *
   * Without it the new call is a new session with no pick of its own, so the
   * display would drop back to guessing `Maybe: <name>` for a contact the user
   * had already resolved.
   */
  private _handOffSelectionToOutboundCall(
    call: { sessionId?: string },
    info: { renderInfo?: { dialToPhoneNumber?: string } }
  ) {
    const sessionId = call.sessionId;
    const phoneNumber = info.renderInfo?.dialToPhoneNumber;
    if (!sessionId || !phoneNumber) {
      return;
    }
    const entityId = this._matchedContactSelection.getSelectedEntityId(
      'call',
      sessionId,
    );
    void this._matchedContactSelection.setPendingOutbound(
      entityId ? { entityId, phoneNumber } : null,
    );
  }

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
