import type { DispositionItem } from '../../services/CxLeads';
import type {
  CxLeadDetails,
  CxLeadInfoData,
} from '../../services/CxLeadInfo/CxLeadInfo.interface';
import type { ManualPassSubmitParams } from '../ManualPassModal/ManualPassModal.interface';

/**
 * Dial and manual pass for a fetched lead that is not on a call, as the Leads
 * list offers them.
 */
export interface LeadInfoPreviewActions {
  /** Numbers the agent can dial; empty in progressive dial mode. */
  dialNumbers: string[];
  isDialDisabled: boolean;
  onDial: (phoneNumber: string) => void;
  /** Whether the agent may manually pass leads. */
  showManualPass: boolean;
  isManualPassDisabled: boolean;
  onManualPass: (params: ManualPassSubmitParams) => Promise<void>;
  fetchDispositionList: (campaignId: string) => Promise<DispositionItem[]>;
  defaultTimezone: string;
}

export interface LeadInfoPanelProps {
  /** `null` once the lead is gone, until the tab closes. */
  info: CxLeadInfoData | null;
  /** Shown when the host registered a `leadViewerPath`. */
  showViewLeadButton: boolean;
  onViewLead: (lead: CxLeadDetails) => void;
  /** Set for a fetched lead not on a call. */
  previewActions: LeadInfoPreviewActions | null;
  /** Resolves a recording value to a playable URL. */
  loadRecording: (value: string) => Promise<string>;
  /** Set while no tab bar shows the tab, so the panel offers its own back. */
  showCloseButton: boolean;
  onClose: () => void;
}

export interface LeadRecordingPlayerProps {
  value: string;
  loadRecording: (value: string) => Promise<string>;
}
