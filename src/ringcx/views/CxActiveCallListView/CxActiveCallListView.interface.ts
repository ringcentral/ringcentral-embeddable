import type { CxCallData } from '../../services/CxCallDataSource';

/**
 * Options for CxActiveCallListView customization
 */
interface CxActiveCallListViewOptions {
  onCallSelect?: (callId: string) => void;
}

/**
 * Props passed to the CxActiveCallListView component
 */
interface CxActiveCallListViewProps {
  id?: string;
}

/**
 * UI state props for CxActiveCallListView
 */
interface CxActiveCallListViewUIProps {
  callList: CxCallData[];
  isOnMute: boolean;
  showMuteButton: boolean;
  userName: string;
  isInbound: boolean;
}

/**
 * UI action functions for CxActiveCallListView
 */
interface CxActiveCallListViewUIFunctions {
  goBack: () => void;
  onHangup: (call: CxCallData) => void;
  onHold: (call: CxCallData) => void;
  onUnHold: (call: CxCallData) => void;
  onMute: () => void;
  onUnmute: () => void;
}

export type {
  CxActiveCallListViewOptions,
  CxActiveCallListViewProps,
  CxActiveCallListViewUIProps,
  CxActiveCallListViewUIFunctions,
};
