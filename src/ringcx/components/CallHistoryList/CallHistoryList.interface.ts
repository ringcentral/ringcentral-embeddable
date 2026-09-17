import type { CallsListPanelSpringProps } from '@ringcentral-integration/micro-phone/src/app/views/CallsListViewSpring/CallsList.view.interface';

/**
 * Props for the call history list.
 *
 * Extends the shared calls-list props with the paging state the shared
 * `CallsListPage` has no way to express.
 */
export type CallHistoryListProps = CallsListPanelSpringProps & {
  /** The first page is loading and there is nothing to show yet. */
  isLoading?: boolean;
  /** A further page is loading; the footer shows a spinner. */
  isLoadingMore?: boolean;
  /** More loaded rows remain to reveal. */
  hasMore?: boolean;
  /** The last request failed; the footer offers a retry. */
  error?: boolean;
  onLoadMore?: () => void;
  onRetry?: () => void;
};
