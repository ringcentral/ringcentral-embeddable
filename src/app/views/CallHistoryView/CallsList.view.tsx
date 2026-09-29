import {
  AppFeatures,
  ConnectivityManager,
  RateLimiter,
} from '@ringcentral-integration/micro-auth/src/app/services';
import { ContactMatcher as ContactMatcherBase } from '@ringcentral-integration/micro-contacts/src/app/services';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import { Toast } from '@ringcentral-integration/micro-core/src/app/services';
import {
  ComposeText,
  MessageStore,
} from '@ringcentral-integration/micro-message/src/app/services';
import {
  Call,
  CallHistory,
  CallLogger,
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
  computed,
  inject,
  injectable,
  optional,
  RouterPlugin,
  type UIFunctions,
  useConnector,
} from '@ringcentral-integration/next-core';
import React from 'react';

import { useCallDisplayNameWithMatches } from '../../components/MatchedContactsTag';
import {
  type ContactMatcher,
  refreshContactMatch,
} from '../../services/ContactMatcher';
import { MatchedContactSelection } from '../../services/MatchedContactSelection';
import { ThirdParty } from '../../services/ThirdParty';

import {
  addCallHistoryLoggedContact,
  addCallHistoryLogStatus,
  createCallHistoryLogActions,
  insertCallHistoryLogActions,
  logCallFromHistory,
} from './CallHistoryLogAction';
import { CallsListPage } from './CallsListPage';
import i18n from './i18n';

type HistoryActiveCallsView = {
  component: React.ComponentType;
  hasCalls: boolean;
};

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
    @inject(ContactMatcherBase) contactMatcher: ContactMatcher,
    matchedContactSelection: MatchedContactSelection,
    callLogger: CallLogger,
    thirdParty: ThirdParty,
    @inject('HistoryActiveCallsView')
    historyActiveCallsView: HistoryActiveCallsView,
    @optional() dialerView?: DialerView,
    @optional() composeText?: ComposeText,
    @optional() callLogTasks?: CallLogTasks,
    @optional('CallsListViewOptions')
    callsListViewOptions?: CallsListViewSpringOptions,
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
      callsListViewOptions,
    );
    this._appCallHistory = callHistory;
    this._appConnectivityManager = connectivityManager;
    this._appContactMatcher = contactMatcher;
    this._appRateLimiter = rateLimiter;
    this._appRouter = router;
    this._matchedContactSelection = matchedContactSelection;
    this._appCallLogger = callLogger;
    this._thirdParty = thirdParty;
    this._historyActiveCallsView = historyActiveCallsView;

    // `useCallHistoryItemInfo` is an instance field on the base class, and the
    // framework pages read `DisplayName` off its result. Wrapping it here adds
    // the match picker to the history list, the call detail page, the post-call
    // screen and the dialer's recent calls in one place.
    const baseUseCallHistoryItemInfo = this.useCallHistoryItemInfo;
    this.useCallHistoryItemInfo = (call, options = {}) => {
      const callWithLogStatus = addCallHistoryLogStatus(call);
      const callWithContactSelection =
        addCallHistoryLoggedContact(callWithLogStatus);
      const result = baseUseCallHistoryItemInfo(
        callWithContactSelection,
        options,
      );
      const { t } = useLocale(i18n);
      const logState = useConnector(() => ({
        hideEditLogButton: this._thirdParty.callLoggerHideEditLogButton,
        isLogging: Boolean(this._appCallLogger.loggingMap[call.sessionId]),
        logButtonTitle: this._thirdParty.callLoggerTitle,
        ready: this._appCallLogger.ready,
      }));
      const DisplayName = useCallDisplayNameWithMatches(
        result.info.DisplayName,
        call.sessionId,
        result.info.renderInfo?.metadata?.matches,
        call.activityMatches,
      );
      const logActions = createCallHistoryLogActions({
        call,
        editLogLabel: t('editLog'),
        logCallLabel: t('logCall'),
        viewLogLabel: t('viewLogDetails'),
        ...logState,
      });
      const actions = insertCallHistoryLogActions(
        result.actions,
        logActions,
      ).map((action) =>
        action.type === 'viewEntity'
          ? { ...action, label: t('viewContactDetails') }
          : action,
      );
      return {
        ...result,
        actions,
        info: { ...result.info, DisplayName },
      };
    };

    // `useActionsHandler` is an instance field on the base class, and
    // `CallDetailView` reuses this very field, so wrapping it here covers both
    // the history list and the call detail page.
    const baseUseActionsHandler = this.useActionsHandler;
    this.useActionsHandler = (call, info, location) => {
      const baseHandler = baseUseActionsHandler(call, info, location);
      return async (actionType) => {
        if (actionType === 'call') {
          this._handOffSelectionToOutboundCall(call, info);
        }
        if (actionType === 'viewLog' || actionType === 'createLog') {
          await this._logCall(actionType, call, info);
          return;
        }
        return baseHandler(actionType);
      };
    };
  }

  private readonly _appCallHistory: CallHistory;

  private readonly _appConnectivityManager: ConnectivityManager;

  private readonly _appContactMatcher: ContactMatcher;

  private readonly _appRouter: RouterPlugin;

  private readonly _appCallLogger: CallLogger;

  private readonly _appRateLimiter: RateLimiter;

  private readonly _thirdParty: ThirdParty;

  private readonly _historyActiveCallsView: HistoryActiveCallsView;

  private readonly _matchedContactSelection: MatchedContactSelection;

  override get displayCRMLog(): boolean {
    return this._thirdParty.callLoggerRegistered;
  }

  @computed
  override get latestCalls() {
    return super.latestCalls.map(addCallHistoryLogStatus);
  }

  private async _logCall(
    actionType: 'createLog' | 'viewLog',
    call: Parameters<CallsListView['useActionsHandler']>[0],
    info: Parameters<CallsListView['useActionsHandler']>[1],
  ): Promise<void> {
    await logCallFromHistory({
      actionType,
      call,
      callLogger: this._appCallLogger,
      info,
      router: this._appRouter,
      thirdParty: this._thirdParty,
    });
  }

  private readonly _refreshContact = async (
    phoneNumber: string,
  ): Promise<void> => {
    await refreshContactMatch(this._appContactMatcher, phoneNumber);
  };

  private readonly _onAdditionalCallAction = async (
    buttonId: string,
    resource: unknown,
  ): Promise<void> => {
    await this._thirdParty.onClickAdditionalButton(buttonId, resource);
  };

  /**
   * Passes the contact this record resolved to on to the call about to be
   * placed.
   *
   * Without it the new call is a new session with no pick of its own, so the
   * display would drop back to guessing `Maybe: <name>` for a contact the user
   * had already resolved.
   *
   * A record resolves to a contact two ways, and both have to be handed off:
   * the user picked one from the match list, or the call was logged against one
   * — `addCallHistoryLoggedContact` renders that as the record's selection just
   * the same, and from the row it is indistinguishable from a pick. The
   * `Maybe: <name>` guess is deliberately not handed off: it is not a resolved
   * contact, and passing it on would present a guess as a certainty.
   */
  private _handOffSelectionToOutboundCall(
    call: Parameters<CallsListView['useActionsHandler']>[0],
    info: { renderInfo?: { dialToPhoneNumber?: string } },
  ) {
    const sessionId = call.sessionId;
    const phoneNumber = info.renderInfo?.dialToPhoneNumber;
    if (!sessionId || !phoneNumber) {
      return;
    }
    const entityId =
      this._matchedContactSelection.getSelectedEntityId('call', sessionId) ??
      addCallHistoryLoggedContact(call).callSelectionInfo?.displayedSelection
        ?.id;
    void this._matchedContactSelection.setPendingOutbound(
      entityId ? { entityId, phoneNumber } : null,
    );
  }

  override getUIFunctions(
    props: CallsListViewSpringProps,
  ): UIFunctions<CallsListPanelSpringProps> {
    const functions = super.getUIFunctions(props);
    const baseUseActionsHandler = functions.useActionsHandler;
    const useActionsHandler: CallsListPanelSpringProps['useActionsHandler'] = (
      call,
      info,
      location,
    ) => {
      const baseHandler = baseUseActionsHandler(call, info, location);
      return async (actionType) => {
        if (actionType === 'viewDetail') {
          const telephonySessionId = call.telephonySessionId;
          const callLog =
            this._appCallHistory.getHistoryByTelephonySessionId(
              telephonySessionId,
            );
          if (callLog) {
            await this._appRouter.push(`/history/${telephonySessionId}`);
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
    const actionState = useConnector(() => ({
      hasActiveCalls: this._historyActiveCallsView.hasCalls,
      additionalCallActions: this._thirdParty.additionalCallActions,
      refreshContactDisabled:
        this._appConnectivityManager.isOfflineMode ||
        this._appConnectivityManager.isVoipOnlyMode ||
        this._appRateLimiter.restricted,
    }));
    const component = super.component(props);
    if (!React.isValidElement<CallsListPanelSpringProps>(component)) {
      return component;
    }
    return (
      <CallsListPage
        {...component.props}
        activeCallsContent={<this._historyActiveCallsView.component />}
        additionalCallActions={actionState.additionalCallActions}
        hasActiveCalls={actionState.hasActiveCalls}
        onAdditionalCallAction={this._onAdditionalCallAction}
        onRefreshContact={this._refreshContact}
        refreshContactDisabled={actionState.refreshContactDisabled}
      />
    );
  }
}
