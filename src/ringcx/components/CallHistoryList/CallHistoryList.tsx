import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import { useEffectOnDocumentFocus } from '@ringcentral-integration/react-hooks';
import { useVirtuosoScrollPosition } from '@ringcentral-integration/react-hooks';
import { Filter } from '@ringcentral-integration/micro-phone/src/app/views/CallsListViewSpring/CallsListPage/Filter';
import i18n from '@ringcentral-integration/micro-phone/src/app/views/CallsListViewSpring/CallsListPage/i18n';
import { Button, CircularProgressIndicator } from '@ringcentral/spring-ui';
import { VirtualizedList } from '@ringcentral/spring-ui';
import React, { useCallback, useMemo } from 'react';

import historyI18n from '../../views/CxCallHistoryView/i18n';
import type { CallHistoryListProps } from './CallHistoryList.interface';
import { CallHistoryListItem } from './CallHistoryListItem';

/**
 * Call history list with local incremental reveal.
 *
 * A local fork of micro-phone's `CallsListPage`, which cannot be reused as-is:
 * it spreads its extra props onto each row rather than onto the virtualized
 * list, so an `endReached` handler passed to it is silently dropped. The filter
 * bar and row renderer are still the shared ones, so rows look identical.
 */
export const CallHistoryList: React.FC<CallHistoryListProps> = ({
  calls,
  searchInput,
  onSearchInputChange,
  viewCallsFilter,
  setViewCallsFilter,
  viewCallsFilterSelections,
  lastPosition,
  setLastPosition,
  onFocus,
  isLoading,
  isLoadingMore,
  hasMore,
  error,
  onLoadMore,
  onRetry,
  ...rest
}) => {
  const { t } = useLocale(i18n);
  const { t: historyT } = useLocale(historyI18n);
  const { virtuosoActionsRef, scrollerRef } = useVirtuosoScrollPosition(
    (snapshot) => setLastPosition(viewCallsFilter, snapshot),
  );

  useEffectOnDocumentFocus(() => {
    onFocus?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const searchMode = !!searchInput && searchInput.length > 0;

  const handleEndReached = useCallback(() => {
    if (hasMore && !isLoadingMore && !isLoading && !error) {
      onLoadMore?.();
    }
  }, [hasMore, isLoadingMore, isLoading, error, onLoadMore]);

  /**
   * Memoized because Virtuoso remounts the footer whenever the component
   * identity changes, which would restart the spinner on every render.
   */
  const Footer = useMemo(() => {
    return function CallHistoryListFooter() {
      if (isLoadingMore) {
        return (
          <div
            className="flex justify-center py-3"
            data-sign="callsListLoadingMore"
          >
            <CircularProgressIndicator size="small" />
          </div>
        );
      }
      if (error) {
        return (
          <div
            className="flex flex-col items-center gap-1 py-3"
            data-sign="callsListLoadError"
          >
            <span className="typography-descriptor text-neutral-b2">
              {historyT('loadFailed')}
            </span>
            <Button variant="text" size="small" onClick={() => onRetry?.()}>
              {historyT('retry')}
            </Button>
          </div>
        );
      }
      return null;
    };
  }, [isLoadingMore, error, historyT, onRetry]);

  const renderBody = (): React.ReactNode => {
    if (isLoading && calls.length === 0) {
      return (
        <div
          className="flex-auto flex justify-center items-center"
          data-sign="callsListLoading"
        >
          <CircularProgressIndicator size="medium" />
        </div>
      );
    }

    if (error && calls.length === 0) {
      return (
        <div
          className="flex-auto flex flex-col justify-center items-center gap-2"
          data-sign="callsListLoadError"
        >
          <span className="typography-descriptor text-neutral-b2">
            {historyT('loadFailed')}
          </span>
          <Button variant="text" size="small" onClick={() => onRetry?.()}>
            {historyT('retry')}
          </Button>
        </div>
      );
    }

    if (calls.length === 0) {
      return (
        <div
          data-sign="no-calls"
          className="flex-auto flex justify-center items-center overflow-auto"
        >
          <div className="flex-col flex justify-center items-center gap-4">
            <div className="text-center typography-subtitle text-neutral-b2 mt-4">
              {searchMode ? t('noSearchResults') : t('noCalls')}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div data-sign="callsList" className="h-full">
        <VirtualizedList
          key={viewCallsFilter}
          className="flex-auto overflow-y-auto overflow-x-hidden"
          data={calls}
          virtuosoActions={virtuosoActionsRef}
          scrollerRef={scrollerRef}
          // null is not a valid type for restoreStateFrom
          restoreStateFrom={lastPosition || undefined}
          endReached={handleEndReached}
          increaseViewportBy={400}
          components={{ Footer }}
        >
          {(index: number, call: any) => (
            <CallHistoryListItem
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
      {renderBody()}
    </>
  );
};

CallHistoryList.displayName = 'CallHistoryList';
