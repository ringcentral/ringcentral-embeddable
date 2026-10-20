/**
 * CxLeads options for configuration
 */
export type CxLeadEventAction = 'loaded' | 'passed' | 'dialed' | 'updated';

export interface CxLeadEvent {
  action: CxLeadEventAction;
  leads?: Lead[];
  lead?: Lead;
  destination?: string;
}

export interface CxLeadsOptions {
  // Optional configuration options
}

/**
 * PREVIEW-LEAD-STATE notification, sent as a fetched lead is dialed
 */
export interface CxPreviewLeadState {
  requestId: string;
  leadState: string;
  /** Number the server dialed for the lead */
  number?: string;
  callType?: string;
  suppressEntireLead?: boolean;
}

/**
 * Lead data
 */
export interface Lead {
  leadId: string;
  requestId: string;
  externId: string;
  firstName?: string;
  midName?: string;
  lastName?: string;
  destination: string | string[];
  destinationE164?: string;
  leadState: string;
  completed?: boolean;
  dialedList?: string[];
  campaignId?: string;
  ani?: string;
  aniE164?: string;
  city?: string;
  countryCode?: string;
  countryId?: string;
  dnis?: string;
  dnisE164?: string;
  email?: string;
  leadPriority?: string;
  leadPasses?: string;
  state?: string;
  title?: string;
  suffix?: string;
  zip?: string;
  validUntil?: string;
  gateKeeper?: string;
  listDesc?: string;
  showListName?: boolean;
  showLeadPasses?: boolean;
  address1?: string;
  address2?: string;
  auxData1?: string;
  auxData2?: string;
  auxData3?: string;
  auxData4?: string;
  auxData5?: string;
  /** The lead's `extra_data` fields, flattened to `{ key: text }`. */
  extraData?: Record<string, string>;
  [key: string]: any;
}

/**
 * Manual pass parameters
 */
export interface ManualPassParams {
  lead: Lead;
  dispositionId: string;
  notes: string;
  callback: boolean;
  callbackDTS: string;
}

/**
 * Disposition item for manual pass
 */
export interface DispositionItem {
  value: string;
  label: string;
}
