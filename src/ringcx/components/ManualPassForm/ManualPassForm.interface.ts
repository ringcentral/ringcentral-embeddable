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
 * Props for ManualPassForm
 */
export interface ManualPassFormProps {
  /** Callback when the form is closed without passing */
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
  /** The lead being passed, named where the form is not next to it */
  leadName?: string;
  /**
   * Shows the titled header with a back button; off under a side widget tab
   * bar, which already names the form.
   */
  showHeader?: boolean;
}
