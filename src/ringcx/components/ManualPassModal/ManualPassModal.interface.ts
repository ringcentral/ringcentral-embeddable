import type { DispositionItem } from '../../services/CxLeads';

/**
 * Manual pass submission parameters
 */
export interface ManualPassSubmitParams {
  /** Disposition ID */
  dispositionId: string;
  /** Notes for the pass */
  notes: string;
  /** Whether to schedule a callback */
  callback: boolean;
  /** Callback date/time string for server */
  callbackDTS: string;
}

/**
 * Props for ManualPassModal component
 */
export interface ManualPassModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback when form is submitted */
  onSubmit: (params: ManualPassSubmitParams) => Promise<void>;
  /** Function to fetch disposition list */
  fetchDispositionList: (campaignId: string) => Promise<DispositionItem[]>;
  /** Campaign ID for fetching dispositions */
  campaignId: string;
  /** Default timezone for callback scheduling */
  defaultTimezone: string;
  /** Whether form submission is disabled */
  disabled?: boolean;
}
