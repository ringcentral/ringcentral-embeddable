import type { DirectoryRecord } from '../../services/CxDirectorySearch';

/**
 * CxDialerView options for configuration
 */
export interface CxDialerViewOptions {
  // Optional configuration options
}

/**
 * CxDialerView props
 */
export interface CxDialerViewProps {
  // Component props
}

// The directory types now live with the shared search service; re-exported here
// so existing importers of this file keep working
export type {
  DirectoryAccountMainNumber,
  DirectoryRecordAccount,
  DirectoryRecord,
  SearchDirectoryResponse,
} from '../../services/CxDirectorySearch';

/**
 * UI state props returned by getUIProps
 */
export interface CxDialerViewUIProps {
  toNumber: string;
  hasDialer: boolean;
  isIdle: boolean;
  isOnCall: boolean;
  isPendingDisposition: boolean;
  isHostCallActive: boolean;
  directoryRecords: DirectoryRecord[];
  isSearchingDirectory: boolean;
  isToNumberPhoneNumber: boolean;
  showKeypad: boolean;
  matchedDirectoryName: string;
  dialDestinationLabel: string;
}

/**
 * UI action functions returned by getUIFunctions
 */
export interface CxDialerViewUIFunctions {
  onBackspace: () => void;
  onDial: () => Promise<void>;
  onHangup: () => void;
  onInputChange: (value: string) => void;
  onKeypadPress: (key: string) => void;
  onGoToSettings: () => void;
  onDialDirectoryRecord: (record: DirectoryRecord) => void;
}
