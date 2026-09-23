import React, { useMemo, useRef } from 'react';
import {
  action,
  computed,
  inject,
  injectable,
  optional,
  RcViewModule,
  RouterPlugin,
  state,
  useConnector,
  watch,
} from '@ringcentral-integration/next-core';
import type { UIFunctions, UIProps } from '@ringcentral-integration/next-core';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import type { ViewCallsFilterType } from '@ringcentral-integration/micro-phone/src/app/views/CallsListViewSpring/CallsList.view.interface';
import type { HistoryAction } from '@ringcentral-integration/next-widgets/components/ActionMenuList/useHistoryActionButtons';
import { LogInfo } from '@ringcentral-integration/micro-phone/src/app/hooks/useContactRenderInfo/components';
import { IncomingCallMd, OutgoingCallMd } from '@ringcentral/spring-icon';
import { Icon } from '@ringcentral/spring-ui';
import type { StateSnapshot } from 'react-virtuoso';
import dayjs from 'dayjs';

import { CxCallHistory } from '../../services/CxCallHistory';
import { CxAuth } from '../../services/CxAuth';
import { CxCall } from '../../services/CxCall';
import {
  HostCallLogger,
  type CallLogger,
} from '../../../app/services/CallLogger';
import { ThirdParty } from '../../../app/services/ThirdParty';
import type { RingCXAdapterBridge } from '../../interfaces/RingCXAdapterBridge.interface';
import {
  createCallHistoryLogActions,
  hasLoggedCallActivity,
} from '../../../app/views/CallHistoryView/CallHistoryLogAction';
import hostCallHistoryI18n from '../../../app/views/CallHistoryView/i18n';
import { callDirection } from '../../enums';
import { CallHistoryList } from '../../components/CallHistoryList';
import { useCxContactRenderInfo } from '../../hooks/useCxContactRenderInfo';
import { formatPhoneNumber } from '../../lib/FormatPhoneNumber/formatPhoneNumber';
import { canDialHistoryCall } from '../../services/CxCallHistory/can-dial-history-call';
import type { FormattedCall } from '../../services/CxCallHistory/CxCallHistory.interface';
import { cxPath } from '../../routes';
import type {
  CxCallHistoryViewOptions,
  CxCallHistoryViewUIProps,
  CxCallHistoryViewUIFunctions,
} from './CxCallHistoryView.interface';
import i18n from './i18n';

/** Rows shown before the first scroll; further rows come from the loaded page. */
const DISPLAY_BATCH_SIZE = 20;

/**
 * CxCallHistoryView module - Call history display
 * Shows call history list with filter and action menu using Spring UI
 */
@injectable({
  name: 'CxCallHistoryView',
})
class CxCallHistoryView extends RcViewModule {
  constructor(
    private cxCallHistory: CxCallHistory,
    private cxAuth: CxAuth,
    private cxCall: CxCall,
    private _router: RouterPlugin,
    @inject(HostCallLogger) private _callLogger: CallLogger,
    private _thirdParty: ThirdParty,
    @optional('RingCXAdapterBridge')
    private _bridge?: RingCXAdapterBridge,
    @optional('CxCallHistoryViewOptions')
    private callHistoryViewOptions?: CxCallHistoryViewOptions,
  ) {
    super();
  }

  override onInitOnce() {
    // Match only revealed rows. Depend on stable query-key strings — not the
    // `displayedCalls` array — so enriching from match results does not
    // re-trigger matching.
    watch(
      this,
      () =>
        [
          this.displayedContactMatchQueryKey,
          this.cxCallHistory.isContactMatcherEnabled,
        ] as const,
      ([queryKey, isEnabled]) => {
        if (isEnabled && queryKey) {
          this.cxCallHistory.matchCalls(this.displayedCalls);
        }
      },
      { multiple: true },
    );
    watch(
      this,
      () =>
        [
          this.displayedActivityMatchQueryKey,
          this.cxCallHistory.isCallLogMatcherEnabled,
        ] as const,
      ([queryKey, isEnabled]) => {
        if (isEnabled && queryKey) {
          this.cxCallHistory.matchCallLogs(this.displayedCalls);
        }
      },
      { multiple: true },
    );
  }

  /**
   * Sorted unique ContactMatcher keys for the currently revealed rows.
   */
  @computed((that: CxCallHistoryView) => [that.displayedCalls])
  get displayedContactMatchQueryKey(): string {
    const queries = this.displayedCalls
      .map((call) => this.cxCallHistory.getCallContactMatchIdentify(call))
      .filter((query): query is string => !!query);
    return Array.from(new Set(queries)).sort().join('|');
  }

  /**
   * Sorted unique ActivityMatcher keys for the currently revealed rows.
   */
  @computed((that: CxCallHistoryView) => [that.displayedCalls])
  get displayedActivityMatchQueryKey(): string {
    const queries = this.displayedCalls.flatMap((call) =>
      this.cxCallHistory.getCallActivityMatchQueries(call),
    );
    return Array.from(new Set(queries)).sort().join('|');
  }

  @state
  viewCallsFilter: ViewCallsFilterType = 'all';

  @state
  lastPositions: Record<string, StateSnapshot | undefined> = {};

  /** How many filtered rows the list currently exposes. */
  @state
  visibleCount = DISPLAY_BATCH_SIZE;

  @action
  private _setViewCallsFilter(val: ViewCallsFilterType) {
    this.viewCallsFilter = val;
  }

  @action
  private _setVisibleCount(count: number) {
    this.visibleCount = count;
  }

  setViewCallsFilter = (val: ViewCallsFilterType) => {
    this._setVisibleCount(DISPLAY_BATCH_SIZE);
    this._setViewCallsFilter(val);
  };

  @action
  private _setLastPosition(type: ViewCallsFilterType, val?: StateSnapshot) {
    const index = type || 'undefined';
    this.lastPositions[index] = val;
  }

  setLastPosition = (type: ViewCallsFilterType, val?: StateSnapshot) => {
    this._setLastPosition(type, val);
  };

  /**
   * Get calls with first call name updated from activity call if call ended
   */
  @computed((that: CxCallHistoryView) => [
    that.cxCallHistory.latestCalls,
    that.cxCallHistory.formattedCalls,
  ])
  get callsWithActivityUpdate(): FormattedCall[] {
    return this.cxCallHistory.latestCalls ?? [];
  }

  /**
   * Filter calls based on viewCallsFilter
   */
  @computed((that: CxCallHistoryView) => [
    that.callsWithActivityUpdate,
    that.viewCallsFilter,
  ])
  get viewCalls(): FormattedCall[] {
    const calls = this.callsWithActivityUpdate;
    switch (this.viewCallsFilter) {
      case 'outgoing':
        return calls.filter(
          (call) => call.direction === callDirection.outbound,
        );
      case 'incoming':
        return calls.filter(
          (call) => call.direction === callDirection.inbound,
        );
      case 'all':
      default:
        return calls;
    }
  }

  @computed((that: CxCallHistoryView) => [that.viewCalls, that.visibleCount])
  get displayedCalls(): FormattedCall[] {
    return this.viewCalls.slice(0, this.visibleCount);
  }

  get hasMoreToShow(): boolean {
    return this.visibleCount < this.viewCalls.length;
  }

  private _revealNextBatch(): void {
    this._setVisibleCount(
      Math.min(this.visibleCount + DISPLAY_BATCH_SIZE, this.viewCalls.length),
    );
  }

  /** Reveal the next local batch. Does not fetch from the server. */
  loadMore(): void {
    this._revealNextBatch();
  }

  async dialHistoryCall(phoneNumber: string): Promise<void> {
    if (
      !canDialHistoryCall({
        phoneNumber,
        allowHistoricalDialing:
          this.cxAuth.agentPermissions?.allowHistoricalDialing,
        isIdle: this.cxCall.isIdle,
      })
    ) {
      return;
    }
    await this.cxCall.dialout(phoneNumber, {
      skipParse: phoneNumber.endsWith('@RC_EXT'),
    });
  }

  /**
   * Navigate to call history detail page
   */
  goToCallDetail(callId: string) {
    this._pinHistoryRoute();
    this._router.push(cxPath.historyDetail(callId));
  }

  /**
   * The History tab is only kept in the location state, so a page pushed from
   * the list must first put the tab in the path. Otherwise Back returns to the
   * agent home on its default tab.
   */
  private _pinHistoryRoute(): void {
    const historyPath = cxPath.home('history');
    if (this._router.currentPath !== historyPath) {
      this._router.replace(historyPath);
    }
  }

  /**
   * Hook that provides call history item info for rendering
   */
  useCallHistoryItemInfo = (
    call: FormattedCall,
    _options: { selectIndex: number; variant: 'list' | 'detail' },
  ) => {
    const { t, currentLocale } = useLocale(i18n);
    const logId = call.localCallId || call.id;
    const logState = useConnector(() => ({
      hideEditLogButton: this._thirdParty.callLoggerHideEditLogButton,
      isLogging: Boolean(this._callLogger.loggingMap?.[logId]),
      logButtonTitle: this._thirdParty.callLoggerTitle,
      ready: this._callLogger.ready,
      showLogInfo: this._thirdParty.callLoggerRegistered,
    }));
    const isLogged = hasLoggedCallActivity(call);
    const isOutbound = call.direction === callDirection.outbound;
    const displayName = isOutbound ? call.toName : call.fromName;
    const phoneNumber = isOutbound
      ? call.to?.phoneNumber
      : call.from?.phoneNumber;
    const matches = isOutbound ? call.toMatches : call.fromMatches;
    const formattedNumber = formatPhoneNumber({ phoneNumber: phoneNumber || '' });
    const { renderInfo, Avatar, DisplayName } = useCxContactRenderInfo({
      phoneNumber,
      matches,
      serverName: displayName !== phoneNumber ? displayName : undefined,
    });
    const resolvedName = renderInfo.matchedContact?.name || displayName;
    const startTime = useMemo(() => {
      if (!call.startTime) return '';
      const now = dayjs();
      const callTime = dayjs(call.startTime);
      if (callTime.isSame(now, 'day')) {
        return callTime.format('h:mm A');
      }
      if (callTime.isSame(now.subtract(1, 'day'), 'day')) {
        return t('yesterday') || 'Yesterday';
      }
      return callTime.format('MM/DD/YYYY');
    }, [call.startTime, t]);
    const Status = useMemo(() => {
      const directionIcon = isOutbound ? OutgoingCallMd : IncomingCallMd;
      return function CallStatus({ mode }: { mode: 'icon' | 'text' }) {
        if (mode === 'icon') {
          return (
            <span className="inline-flex items-center gap-1 text-neutral-b2 truncate">
              <Icon symbol={directionIcon} size="xsmall" />
              <span className="typography-descriptor truncate">
                {isOutbound ? t('outbound') : t('inbound')}
              </span>
            </span>
          );
        }
        return (
          <span className="typography-descriptor text-neutral-b2 truncate">
            {isOutbound ? t('outbound') : t('inbound')}
          </span>
        );
      };
    }, [isOutbound, t]);
    const logged = logState.showLogInfo ? <LogInfo logged={isLogged} /> : null;
    const canDial =
      !!this.cxAuth.agentPermissions?.allowHistoricalDialing &&
      !!call.dialableNumber;
    const isDialDisabled = !this.cxCall.isIdle;
    const actions: HistoryAction[] = useMemo(() => {
      const nextActions: HistoryAction[] = [];
      if (canDial) {
        nextActions.push({
          type: 'call',
          disabled: isDialDisabled,
        });
      }
      const logCall = {
        activityMatches: call.activityMatches,
        type: 'Voice',
      };
      const logActions = createCallHistoryLogActions({
        call: logCall as Parameters<typeof createCallHistoryLogActions>[0]['call'],
        editLogLabel: hostCallHistoryI18n.getString('editLog', currentLocale),
        hideEditLogButton: logState.hideEditLogButton,
        isLogging: logState.isLogging,
        logButtonTitle: logState.logButtonTitle,
        logCallLabel: hostCallHistoryI18n.getString('logCall', currentLocale),
        ready: logState.ready,
        viewLogLabel: hostCallHistoryI18n.getString(
          'viewLogDetails',
          currentLocale,
        ),
      });
      return [...nextActions, ...logActions];
    }, [
      call,
      canDial,
      currentLocale,
      isDialDisabled,
      logState.hideEditLogButton,
      logState.isLogging,
      logState.logButtonTitle,
      logState.ready,
    ]);
    const info = {
      Avatar,
      DisplayName,
      Status,
      startTime,
      logged,
      answeredByDelegate: false,
      ringingElsewhere: false,
      renderInfo,
      formattedPhoneNumber: formattedNumber,
      showViewLogIcon: logState.showLogInfo && isLogged,
      isConferenceCall: false,
      getActionInfo: () => ({
        phoneNumber,
        name: resolvedName || displayName,
      }),
      copyNumber: () => null,
    };
    return { info, actions };
  };

  /**
   * Hook that handles actions from the call history list
   */
  useActionsHandler = (
    call: FormattedCall,
    _info: ReturnType<typeof this.useCallHistoryItemInfo>['info'],
    _location: string,
  ) => {
    return async (actionType: string) => {
      switch (actionType) {
        case 'call':
          if (call.dialableNumber) {
            void this.dialHistoryCall(call.dialableNumber);
          }
          break;
        case 'createLog':
        case 'viewLog':
          this._pinHistoryRoute();
          void this._bridge?.logFromHistory?.(call, actionType);
          break;
        case 'viewDetail':
          this.goToCallDetail(call.id);
          break;
        default:
          this.logger.warn(`Unknown action type: ${actionType}`);
      }
    };
  };

  /**
   * Get reactive UI state props for the component
   */
  getUIProps(t: (key: string) => string): UIProps<CxCallHistoryViewUIProps> {
    const index = this.viewCallsFilter || 'undefined';
    return {
      viewCalls: this.displayedCalls,
      searchInput: this.cxCallHistory.searchInput,
      isLoading: this.cxCallHistory.isLoading,
      isLoadingMore: false,
      hasMore: this.hasMoreToShow,
      error: this.cxCallHistory.error,
      canDial: !!this.cxAuth.agentPermissions?.allowHistoricalDialing,
      isDialDisabled: !this.cxCall.isIdle,
      viewCallsFilter: this.viewCallsFilter,
      lastPosition: this.lastPositions[index],
      viewCallsFilterSelections: [
        { label: t('callsFilterAll'), value: 'all' },
        { label: t('callsFilterOutgoing'), value: 'outgoing' },
        { label: t('callsFilterIncoming'), value: 'incoming' },
      ],
    };
  }

  /**
   * Get stable UI action functions for the component
   */
  getUIFunctions(): UIFunctions<CxCallHistoryViewUIFunctions> {
    return {
      onSearchInputChange: (value: string) => {
        this._setVisibleCount(DISPLAY_BATCH_SIZE);
        this.cxCallHistory.updateSearchInput(value);
        this.cxCallHistory.debouncedSearch();
      },
      setViewCallsFilter: this.setViewCallsFilter,
      setLastPosition: this.setLastPosition,
      onFocus: () => {
        this.cxCallHistory.updateLastCheckTimeStamp();
      },
      onLoadMore: () => {
        this.loadMore();
      },
      onRetry: () => {
        void this.cxCallHistory.retry();
      },
      useCallHistoryItemInfo: this.useCallHistoryItemInfo as any,
      useActionsHandler: this.useActionsHandler as any,
    };
  }

  component() {
    const { t } = useLocale(i18n);
    const { current: uiFunctions } = useRef(this.getUIFunctions());

    const {
      viewCalls,
      searchInput,
      viewCallsFilter,
      lastPosition,
      viewCallsFilterSelections,
      isLoading,
      isLoadingMore,
      hasMore,
      error,
    } = useConnector(() => this.getUIProps(t));

    return (
      <div className="flex flex-col h-full bg-neutral-base">
        <CallHistoryList
          calls={viewCalls as any}
          searchInput={searchInput}
          onSearchInputChange={uiFunctions.onSearchInputChange}
          viewCallsFilter={viewCallsFilter}
          setViewCallsFilter={uiFunctions.setViewCallsFilter}
          viewCallsFilterSelections={viewCallsFilterSelections}
          useCallHistoryItemInfo={uiFunctions.useCallHistoryItemInfo}
          useActionsHandler={uiFunctions.useActionsHandler}
          setLastPosition={uiFunctions.setLastPosition}
          lastPosition={lastPosition}
          onFocus={uiFunctions.onFocus}
          isLoading={isLoading}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
          error={error}
          onLoadMore={uiFunctions.onLoadMore}
          onRetry={uiFunctions.onRetry}
        />
      </div>
    );
  }
}

export { CxCallHistoryView };
