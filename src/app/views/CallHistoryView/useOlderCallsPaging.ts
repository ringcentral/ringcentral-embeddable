import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * How many pages in a row may add no listed call before the list stops
 * loading older calls on its own and offers a button instead. Missed or
 * unlogged calls can be sparse, and the call log list is a Heavy API.
 */
const MAX_UNPRODUCTIVE_AUTO_LOADS = 3;

type UseOlderCallsPagingOptions = {
  callCount: number;
  filter?: string;
  hasMore: boolean;
  loading: boolean;
  onEndReached?: () => void;
};

type OlderCallsPaging = {
  loadMore: () => void;
  setAtBottom: (atBottom: boolean) => void;
  showLoadMore: boolean;
};

/**
 * Loads older calls while the end of the list is visible, so a short or empty
 * filter fills itself, until pages stop adding calls to the list; then the
 * list shows a button that loads one page per click.
 */
export function useOlderCallsPaging({
  callCount,
  filter,
  hasMore,
  loading,
  onEndReached,
}: UseOlderCallsPagingOptions): OlderCallsPaging {
  const [atBottom, setAtBottom] = useState(false);
  const [unproductiveLoads, setUnproductiveLoads] = useState(0);
  // The effects below read the count from a ref, since the state set by an
  // earlier effect in the same commit is not visible to a later one.
  const unproductiveLoadsRef = useRef(0);
  const loadStartCountRef = useRef<number | null>(null);
  const onEndReachedRef = useRef(onEndReached);
  onEndReachedRef.current = onEndReached;
  const isEndVisible = callCount === 0 || atBottom;
  const updateUnproductiveLoads = (count: number): void => {
    unproductiveLoadsRef.current = count;
    setUnproductiveLoads(count);
  };
  useEffect(() => {
    updateUnproductiveLoads(0);
  }, [filter]);
  // Count the pages that end without adding a call to the list.
  useEffect(() => {
    if (loading) {
      loadStartCountRef.current = callCount;
      return;
    }
    const startCount = loadStartCountRef.current;
    if (startCount === null) {
      return;
    }
    loadStartCountRef.current = null;
    updateUnproductiveLoads(
      callCount > startCount ? 0 : unproductiveLoadsRef.current + 1,
    );
    // Only a finished load is counted; the count it ends with is read as is.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);
  // A one-shot `endReached` would be lost if it fired while a previous page
  // was still loading, so re-check whenever the list or loading state changes.
  // The count only drops back to zero on a filter change or a page that adds
  // calls, and both are dependencies already.
  useEffect(() => {
    if (
      unproductiveLoadsRef.current < MAX_UNPRODUCTIVE_AUTO_LOADS &&
      isEndVisible &&
      !loading
    ) {
      onEndReachedRef.current?.();
    }
  }, [isEndVisible, loading, callCount, filter]);
  const loadMore = useCallback(() => {
    onEndReachedRef.current?.();
  }, []);
  return {
    loadMore,
    setAtBottom,
    showLoadMore:
      unproductiveLoads >= MAX_UNPRODUCTIVE_AUTO_LOADS && hasMore && !loading,
  };
}
