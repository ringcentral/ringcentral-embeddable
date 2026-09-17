/**
 * CxLeads options for configuration
 */
export interface CxLeadsOptions {
  // Optional configuration options
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
