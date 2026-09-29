import type { CallsListPanelSpringProps } from '@ringcentral-integration/micro-phone/src/app/views/CallsListViewSpring/CallsList.view.interface';

import type { ThirdPartyButton } from '../../../app/services/ThirdParty/ThirdParty.interface';

type HistoryCall = CallsListPanelSpringProps['calls'][0];

/**
 * Row actions beyond the history actions, matching the RingEX history rows.
 */
export interface CallHistoryListRowActionProps {
  /** `callAction` buttons the host registered. */
  additionalCallActions?: ThirdPartyButton[];
  onAdditionalCallAction?: (
    buttonId: string,
    call: HistoryCall,
  ) => Promise<void> | void;
  /** Omit to hide the Refresh contact action. */
  onRefreshContact?: (call: HistoryCall) => Promise<void> | void;
  refreshContactDisabled?: boolean;
}

/**
 * Props for the call history list.
 *
 * Extends the shared calls-list props with the paging state the shared
 * `CallsListPage` has no way to express.
 */
export type CallHistoryListProps = CallsListPanelSpringProps &
  CallHistoryListRowActionProps & {
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
