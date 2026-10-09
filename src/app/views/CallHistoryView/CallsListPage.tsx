import NoCalls from '@ringcentral-integration/next-core/assets/no_calls.svg';
import { debounce } from '@ringcentral-integration/commons/lib/debounce-throttle';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import type {
  CallsListPanelSpringProps,
  ViewCallsFilterType,
} from '@ringcentral-integration/micro-phone/src/app/views/CallsListViewSpring/CallsList.view.interface';
import { Filter } from '@ringcentral-integration/micro-phone/src/app/views/CallsListViewSpring/CallsListPage/Filter';
import { useEffectOnDocumentFocus } from '@ringcentral-integration/react-hooks';
import { useVirtuosoScrollPosition } from '@ringcentral-integration/react-hooks';
import { useContainer } from '@ringcentral-integration/next-core';
import {
  Button,
  CircularProgressIndicator,
  VirtualizedList,
} from '@ringcentral/spring-ui';
import type { FunctionComponent, ReactNode } from 'react';
import React, { useEffect, useMemo, useRef } from 'react';

import { SmartNotes } from '../../services/SmartNotes';
import type { ThirdPartyButton } from '../../services/ThirdParty/ThirdParty.interface';
import { getVisibleTelephonySessionIds } from './CallHistorySmartNotesQuery';
import { CallsListItem } from './CallsListItem';
import type { SmartNotesHistoryCall } from './SmartNotesHistoryCall';
import i18n from './i18n';
import { useOlderCallsPaging } from './useOlderCallsPaging';

const INITIAL_VISIBLE_CALL_COUNT = 10;

/**
 * Shown below the list while older calls are loading.
 */
const LoadingOlderFooter = () => (
  <div className="flex justify-center py-2" data-sign="loadingOlderCalls">
    <CircularProgressIndicator size="xsmall" />
  </div>
);

type LoadMoreCallsProps = {
  label: string;
  onClick: () => void;
};

/**
 * Loads one page of older calls, once the list stops loading them on its own.
 */
const LoadMoreCalls: FunctionComponent<LoadMoreCallsProps> = ({
  label,
  onClick,
}) => (
  <div className="flex justify-center py-2" data-sign="loadMoreCalls">
    <Button size="small" variant="text" onClick={onClick}>
      {label}
    </Button>
  </div>
);

type CallsListProps = {
  additionalCallActions: ThirdPartyButton[];
  calls: SmartNotesHistoryCall[];
  className?: string;
  hasMoreOlderCalls?: boolean;
  loadingOlderCalls?: boolean;
  onAdditionalCallAction: (
    buttonId: string,
    resource: unknown,
  ) => Promise<void> | void;
  onEndReached?: () => void;
  onRefreshContact: (phoneNumber: string) => Promise<void> | void;
  refreshContactDisabled: boolean;
} & Omit<CallsListPanelSpringProps, 'calls' | 'viewCallsFilterSelections'>;

const CallsList: FunctionComponent<CallsListProps> = ({
  calls,
  className,
  lastPosition,
  setLastPosition,
  viewCallsFilter,
  searchInput,
  hasMoreOlderCalls = false,
  loadingOlderCalls = false,
  onEndReached,
  ...rest
}) => {
  const smartNotes = useContainer<SmartNotes>('SmartNotes');
  const { loadMore, setAtBottom, showLoadMore } = useOlderCallsPaging({
    callCount: calls.length,
    filter: viewCallsFilter,
    hasMore: hasMoreOlderCalls,
    loading: loadingOlderCalls,
    onEndReached,
  });
  const callsRef = useRef(calls);
  callsRef.current = calls;
  const { virtuosoActionsRef, scrollerRef } = useVirtuosoScrollPosition(
    (snapshot) => setLastPosition(viewCallsFilter, snapshot),
  );
  const { t } = useLocale(i18n);
  const loadMoreLabel = t('loadMore');
  const Footer = useMemo(() => {
    if (loadingOlderCalls) {
      return LoadingOlderFooter;
    }
    if (!showLoadMore) {
      return undefined;
    }
    return () => <LoadMoreCalls label={loadMoreLabel} onClick={loadMore} />;
  }, [loadingOlderCalls, showLoadMore, loadMoreLabel, loadMore]);
  const queryVisibleSmartNotes = useMemo(
    () =>
      debounce({
        fn: (startIndex: number, endIndex: number): void => {
          const telephonySessionIds = getVisibleTelephonySessionIds(
            callsRef.current,
            startIndex,
            endIndex,
          );
          if (telephonySessionIds.length > 0) {
            void smartNotes.queryNotedCalls(telephonySessionIds);
          }
        },
        threshold: 300,
      }),
    [smartNotes],
  );
  useEffect(() => {
    if (calls.length > 0) {
      queryVisibleSmartNotes(
        0,
        Math.min(calls.length, INITIAL_VISIBLE_CALL_COUNT) - 1,
      );
    }
  }, [calls.length, queryVisibleSmartNotes]);
  useEffect(
    () => () => {
      queryVisibleSmartNotes.cancel();
    },
    [queryVisibleSmartNotes],
  );
  if (calls.length === 0 && loadingOlderCalls) {
    return (
      <div
        data-sign="loadingOlderCalls"
        className="flex-auto flex justify-center items-center"
      >
        <CircularProgressIndicator size="small" />
      </div>
    );
  }
  if (calls.length === 0) {
    return (
      <div
        data-sign="no-calls"
        className="flex-auto flex justify-center items-center overflow-auto"
      >
        <div className="flex flex-col justify-center items-center gap-4">
          <NoCalls />
          <div className="text-center typography-mainText text-neutral-b2 mt-4">
            {searchInput ? t('noSearchResults') : t('noCalls')}
          </div>
          {showLoadMore ? (
            <LoadMoreCalls label={loadMoreLabel} onClick={loadMore} />
          ) : null}
        </div>
      </div>
    );
  }
  return (
    <div data-sign="callsList" className="min-h-0 flex-auto">
      <VirtualizedList
        key={viewCallsFilter}
        className={className}
        components={{ Footer }}
        atBottomStateChange={setAtBottom}
        data={calls}
        virtuosoActions={virtuosoActionsRef}
        scrollerRef={scrollerRef}
        restoreStateFrom={lastPosition || undefined}
        rangeChanged={({ startIndex, endIndex }) =>
          queryVisibleSmartNotes(startIndex, endIndex)
        }
      >
        {(index, call) => (
          <CallsListItem
            key={call.id || call.telephonySessionId}
            call={call}
            index={index}
            {...rest}
          />
        )}
      </VirtualizedList>
    </div>
  );
};

type CallsListPageProps = CallsListPanelSpringProps &
  Pick<
    CallsListProps,
    | 'additionalCallActions'
    | 'hasMoreOlderCalls'
    | 'loadingOlderCalls'
    | 'onAdditionalCallAction'
    | 'onEndReached'
    | 'onRefreshContact'
    | 'refreshContactDisabled'
  > & {
    activeCallsContent: ReactNode;
    hasActiveCalls: boolean;
  };

export const CallsListPage: FunctionComponent<CallsListPageProps> = ({
  calls,
  searchInput,
  onSearchInputChange,
  viewCallsFilter,
  setViewCallsFilter,
  viewCallsFilterSelections,
  onFocus,
  activeCallsContent,
  hasActiveCalls,
  ...rest
}) => {
  const { t } = useLocale(i18n);
  useEffectOnDocumentFocus(() => {
    onFocus?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="flex h-full min-h-0 flex-col">
      {activeCallsContent}
      <Filter
        className="flex-none"
        searchInput={searchInput}
        onSearchInputChange={onSearchInputChange}
        viewCallsFilter={viewCallsFilter}
        setViewCallsFilter={setViewCallsFilter}
        viewCallsFilterSelections={viewCallsFilterSelections}
      />
      {hasActiveCalls && calls.length > 0 ? (
        <div className="flex-none px-4 py-2 typography-subtitleMiniSemiBold text-neutral-b2">
          {t('historyCalls')}
        </div>
      ) : null}
      {calls.length > 0 || !hasActiveCalls ? (
        <CallsList
          searchInput={searchInput}
          className="flex-auto overflow-y-auto overflow-x-hidden"
          viewCallsFilter={viewCallsFilter as ViewCallsFilterType}
          calls={calls}
          {...rest}
        />
      ) : null}
    </div>
  );
};
