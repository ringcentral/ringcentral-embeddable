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
import { VirtualizedList } from '@ringcentral/spring-ui';
import type { FunctionComponent } from 'react';
import React, { useEffect, useMemo, useRef } from 'react';

import { SmartNotes } from '../../services/SmartNotes';
import type { SmartNotesHistoryCall } from './CallHistorySmartNotesAction';
import { getVisibleTelephonySessionIds } from './CallHistorySmartNotesQuery';
import { CallsListItem } from './CallsListItem';
import i18n from './i18n';

const INITIAL_VISIBLE_CALL_COUNT = 10;

type CallsListProps = {
  calls: SmartNotesHistoryCall[];
  className?: string;
} & Omit<CallsListPanelSpringProps, 'calls' | 'viewCallsFilterSelections'>;

const CallsList: FunctionComponent<CallsListProps> = ({
  calls,
  className,
  lastPosition,
  setLastPosition,
  viewCallsFilter,
  searchInput,
  ...rest
}) => {
  const smartNotes = useContainer<SmartNotes>('SmartNotes');
  const callsRef = useRef(calls);
  callsRef.current = calls;
  const { virtuosoActionsRef, scrollerRef } = useVirtuosoScrollPosition(
    (snapshot) => setLastPosition(viewCallsFilter, snapshot)
  );
  const { t } = useLocale(i18n);
  const queryVisibleSmartNotes = useMemo(
    () =>
      debounce({
        fn: (startIndex: number, endIndex: number): void => {
          const telephonySessionIds = getVisibleTelephonySessionIds(
            callsRef.current,
            startIndex,
            endIndex
          );
          if (telephonySessionIds.length > 0) {
            void smartNotes.queryNotedCalls(telephonySessionIds);
          }
        },
        threshold: 300,
      }),
    [smartNotes]
  );
  useEffect(() => {
    if (calls.length > 0) {
      queryVisibleSmartNotes(
        0,
        Math.min(calls.length, INITIAL_VISIBLE_CALL_COUNT) - 1
      );
    }
  }, [calls.length, queryVisibleSmartNotes]);
  useEffect(
    () => () => {
      queryVisibleSmartNotes.cancel();
    },
    [queryVisibleSmartNotes]
  );
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
        </div>
      </div>
    );
  }
  return (
    <div data-sign="callsList" className="h-full">
      <VirtualizedList
        key={viewCallsFilter}
        className={className}
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

export const CallsListPage: FunctionComponent<CallsListPanelSpringProps> = ({
  calls,
  searchInput,
  onSearchInputChange,
  viewCallsFilter,
  setViewCallsFilter,
  viewCallsFilterSelections,
  onFocus,
  ...rest
}) => {
  useEffectOnDocumentFocus(() => {
    onFocus?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <>
      <Filter
        className="flex-none"
        searchInput={searchInput}
        onSearchInputChange={onSearchInputChange}
        viewCallsFilter={viewCallsFilter}
        setViewCallsFilter={setViewCallsFilter}
        viewCallsFilterSelections={viewCallsFilterSelections}
      />
      <CallsList
        searchInput={searchInput}
        className="flex-auto overflow-y-auto overflow-x-hidden"
        viewCallsFilter={viewCallsFilter as ViewCallsFilterType}
        calls={calls}
        {...rest}
      />
    </>
  );
};
