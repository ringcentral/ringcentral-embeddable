import type { ReactNode } from 'react';

import type {
  CxLeadHistoryRecord,
  CxLeadUpdateFields,
} from '../../services/CxClient/interfaces';
import type {
  CxLeadDetails,
  CxLeadInfoData,
  CxLeadInfoRow,
} from '../../services/CxLeadInfo/CxLeadInfo.interface';

/**
 * Dial and manual pass for a fetched lead that is not on a call, as the Leads
 * list offers them.
 */
export interface LeadInfoPreviewActions {
  /** Numbers the agent can dial; empty in progressive dial mode. */
  dialNumbers: string[];
  /** Numbers already dialed, which cannot be dialed again, as in Agent One. */
  dialedNumbers: string[];
  isDialDisabled: boolean;
  onDial: (phoneNumber: string) => void;
  /** Whether the agent may manually pass leads. */
  showManualPass: boolean;
  isManualPassDisabled: boolean;
  /** Opens the Manual pass side widget tab on this lead. */
  onOpenManualPass: () => void;
}

export interface LeadUpdateSaveRequest {
  phoneNumbers: string[];
  fields: CxLeadUpdateFields;
}

/**
 * Editing a lead whose campaign lets agents update leads.
 */
export interface LeadInfoEditActions {
  /** Opens the Update lead side widget tab on this lead. */
  onOpenEdit: () => void;
}

export interface LeadInfoPanelProps {
  /** `null` once the lead is gone, until the tab closes. */
  info: CxLeadInfoData | null;
  /** Shown when the host registered a `leadViewerPath`. */
  showViewLeadButton: boolean;
  onViewLead: (lead: CxLeadDetails) => void;
  /** Set for a fetched lead not on a call. */
  previewActions: LeadInfoPreviewActions | null;
  /** Set when the lead's campaign lets the agent edit it. */
  editActions: LeadInfoEditActions | null;
  /** Resolves a recording value to a playable URL. */
  loadRecording: (value: string) => Promise<string>;
  /** Set when the agent may see lead history; `null` when it did not load. */
  loadLeadHistory?: (leadId: string) => Promise<CxLeadHistoryRecord[] | null>;
  /** Set while no tab bar shows the tab, so the panel offers its own back. */
  showCloseButton: boolean;
  onClose: () => void;
}

export interface LeadUpdateFormProps {
  /**
   * Shows the titled header with a back button; off under a side widget tab
   * bar, which already names the form.
   */
  showHeader?: boolean;
  lead: CxLeadDetails;
  phoneNumbers: string[];
  auxLabels: Array<string | undefined>;
  canEditPhone: boolean;
  onClose: () => void;
  onSave: (request: LeadUpdateSaveRequest) => Promise<boolean>;
}

export interface LeadInfoCardsProps {
  rows: CxLeadInfoRow[];
  /** Resolves a recording value to a playable URL. */
  loadRecording: (value: string) => Promise<string>;
}

export type LeadHistoryStatus = 'idle' | 'loading' | 'loaded' | 'failed';

/** A lead's history as it loads, see `useLeadHistory`. */
export interface LeadHistoryState {
  status: LeadHistoryStatus;
  records: CxLeadHistoryRecord[];
  /** Loads the history, or loads it again. */
  load: () => Promise<void>;
}

export interface UseLeadHistoryOptions {
  leadId: string;
  loadLeadHistory: (leadId: string) => Promise<CxLeadHistoryRecord[] | null>;
  /** Loads on mount instead of waiting for the agent to ask. */
  autoLoad?: boolean;
}

export interface LeadHistoryCardProps extends UseLeadHistoryOptions {
  /**
   * The history a parent loads and refreshes itself, such as the History
   * pill tab, which names the card and holds Refresh in its tab row. The
   * card then has no header.
   */
  history?: LeadHistoryState;
}

export interface LeadHistoryRefreshProps {
  history: LeadHistoryState;
}

export interface PastCallTabsProps {
  /**
   * The call's disposition and term details, under the Call tab; without
   * them there is no Call tab and the Lead tab opens first.
   */
  callContent?: ReactNode;
  rows: CxLeadInfoRow[];
  leadId: string;
  /** Resolves a recording value to a playable URL. */
  loadRecording: (value: string) => Promise<string>;
  /** Set when the agent may see lead history. */
  loadLeadHistory?: (leadId: string) => Promise<CxLeadHistoryRecord[] | null>;
}

export interface LeadRecordingPlayerProps {
  value: string;
  loadRecording: (value: string) => Promise<string>;
}
