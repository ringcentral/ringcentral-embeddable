import type { CxTransferType } from '../../enums';
import type {
  CxDirectAgentListItem,
  CxTransferMode,
  CxTransferPhoneBookItem,
} from '../../services/CxTransferCall/CxTransferCall.interface';
import type { CxAvailableRequeueQueue } from '../../services/CxClient';
import type { DirectoryRecord } from '../../services/CxDirectorySearch';

/**
 * Options for CxTransferView customization
 */
interface CxTransferViewOptions {
  onCancel?: () => void;
}

/**
 * Props passed to the CxTransferView component
 */
interface CxTransferViewProps {
  id?: string;
}

/**
 * Tab definition for the transfer type tabs.
 * Unavailable tabs are omitted from the rendered tab list.
 */
interface TransferTab {
  value: CxTransferType;
  label: string;
  disabled: boolean;
}

/**
 * CxTransferView UI state props
 */
interface CxTransferViewUIProps {
  transferType: CxTransferType;
  isTransferring: boolean;
  isDisabled: boolean;
  isVoicemailDisabled: boolean;
  allTabs: TransferTab[];
  defaultTab: CxTransferType | null;
  agentList: CxDirectAgentListItem[];
  phoneBook: CxTransferPhoneBookItem[];
  selectedAgentId: string | null;
  selectedPhoneBookIndex: number | null;
  manualEntryNumber: string;
  manualEntryDirectoryRecords: DirectoryRecord[];
  selectedDirectoryRecordId: string | null;
  matchedDirectoryName: string;
  transferDestinationLabel: string;
  isSearchingDirectory: boolean;
  showManualEntryKeypad: boolean;
  queueGroups: CxAvailableRequeueQueue[];
  selectedQueueGroupId: string;
  selectedGateId: string;
}

/**
 * CxTransferView UI action functions
 */
interface CxTransferViewUIFunctions {
  onTabChange: (type: CxTransferType) => void;
  onSelectAgent: (agentId: string) => void;
  onSelectPhoneBookContact: (index: number) => void;
  onManualEntryChange: (value: string) => void;
  onManualEntryKeypadPress: (key: string) => void;
  onManualEntryBackspace: () => void;
  onManualEntryClear: () => void;
  onSelectDirectoryRecord: (record: DirectoryRecord) => void;
  onQueueGroupChange: (groupId: string) => void;
  onGateChange: (gateId: string) => void;
  onTransfer: (mode: CxTransferMode) => Promise<void>;
  onBack: () => void;
  fetchAgentList: () => void;
}

export type {
  CxTransferViewOptions,
  CxTransferViewProps,
  TransferTab,
  CxTransferViewUIProps,
  CxTransferViewUIFunctions,
};
