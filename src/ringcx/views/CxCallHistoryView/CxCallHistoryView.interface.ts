import type { ComponentType, ReactNode } from 'react';
import type { StateSnapshot } from 'react-virtuoso';
import type { ViewCallsFilterType } from '@ringcentral-integration/micro-phone/src/app/views/CallsListViewSpring/CallsList.view.interface';
import type { ContactDisplayRenderProps } from '@ringcentral-integration/micro-phone/src/app/hooks/useContactRenderInfo/components';
import type { ContactDisplayInfo } from '@ringcentral-integration/micro-phone/src/app/hooks/useContactRenderInfo/utils';
import type { HistoryAction } from '@ringcentral-integration/next-widgets/components/ActionMenuList/useHistoryActionButtons';
import type { FormattedCall } from '../../services/CxCallHistory/CxCallHistory.interface';

/**
 * CxCallHistoryView options for configuration
 */
interface CxCallHistoryViewOptions {
  // Optional configuration options
}

/**
 * UI state props returned by getUIProps
 */
interface CxCallHistoryViewUIProps {
  viewCalls: FormattedCall[];
  searchInput: string;
  viewCallsFilter: ViewCallsFilterType;
  lastPosition: StateSnapshot | undefined;
  viewCallsFilterSelections: { label: string; value: string }[];
  /** First request in flight with nothing to show yet. */
  isLoading: boolean;
  /** Always false: history is a single request. */
  isLoadingMore: boolean;
  /** More loaded rows remain to reveal. */
  hasMore: boolean;
  /** The last page request failed. */
  error: boolean;
  /**
   * Included so `useConnector` re-renders rows when historical dialing
   * permission or idle state changes (drives the hover `call` action).
   */
  canDial: boolean;
  isDialDisabled: boolean;
}

/**
 * UI action functions returned by getUIFunctions
 */
interface CxCallHistoryViewUIFunctions {
  onSearchInputChange: (value: string) => void;
  setViewCallsFilter: (val: ViewCallsFilterType) => void;
  setLastPosition: (type: ViewCallsFilterType, val?: StateSnapshot) => void;
  onFocus: () => void;
  onLoadMore: () => void;
  onRetry: () => void;
  useCallHistoryItemInfo: (
    call: FormattedCall,
    options: { selectIndex: number; variant: 'list' | 'detail' },
  ) => { info: CallHistoryItemInfo; actions: HistoryAction[] };
  useActionsHandler: (
    call: FormattedCall,
    info: CallHistoryItemInfo,
    location: string,
  ) => (actionType: string) => Promise<void>;
}

/**
 * Shape of info object returned by useCallHistoryItemInfo
 */
interface CallHistoryItemInfo {
  Avatar: ComponentType<{ size?: 'small' | 'medium' | 'large' }>;
  DisplayName: ComponentType<Pick<ContactDisplayRenderProps, 'displayControl'>>;
  Status: ComponentType<{ mode: 'icon' | 'text' }>;
  startTime: string;
  logged: ReactNode;
  answeredByDelegate: boolean;
  ringingElsewhere: boolean;
  renderInfo: ContactDisplayInfo;
  formattedPhoneNumber: string | undefined;
  showViewLogIcon: boolean;
  isConferenceCall: boolean;
  getActionInfo: () => { phoneNumber: string | undefined; name: string };
  copyNumber: () => null;
}

export type {
  CxCallHistoryViewOptions,
  CxCallHistoryViewUIProps,
  CxCallHistoryViewUIFunctions,
  CallHistoryItemInfo,
};
