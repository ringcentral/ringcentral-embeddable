import type { ReactNode } from 'react';

import type { Lead as ServiceLead, DispositionItem } from '../../services/CxLeads';

/**
 * Lead data interface
 * Compatible with the service Lead type
 */
export type Lead = ServiceLead;

/**
 * Phone number display data
 */
export interface PhoneNumberData {
  /** Formatted phone number for display */
  formatted: string;
  /** Raw destination number */
  destination: string;
}

/**
 * Manual pass submission parameters
 */
export interface ManualPassParams {
  /** The lead to pass */
  lead: Lead;
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
 * Props for LeadItem component
 */
export interface LeadItemProps {
  /** Lead data */
  lead: Lead;
  /** Phone numbers to display */
  phoneNumbers: PhoneNumberData[];
  /** Display name */
  displayName: string;
  /** Whether dialing is allowed */
  allowDial?: boolean;
  /** Whether the agent is currently dialing */
  isDialing?: boolean;
  /** Whether buttons should be disabled */
  disabled?: boolean;
  /** Whether the lead comes from a search result */
  fromSearch?: boolean;
  /**
   * Callback when dial button is clicked. Without it the numbers are shown as
   * text, as the progressive dialer picks the lead to dial.
   */
  onDial?: (destination: string) => void;
  /** Whether the progressive dialer dials this lead next */
  isNext?: boolean;
  /** Callback when view lead button is clicked */
  onViewLead?: (lead: Lead) => void;
  /** Callback when manual pass is submitted */
  onPass?: (params: ManualPassParams) => Promise<void>;
  /** Whether to show view lead button */
  showViewLeadButton?: boolean;
  /** Whether to show manual pass button */
  showManualPassButton?: boolean;
  /** Whether manual pass is disabled */
  disableManualPass?: boolean;
  /** Function to fetch disposition list for ManualPassModal */
  fetchDispositionList?: (campaignId: string) => Promise<DispositionItem[]>;
  /** Default timezone for ManualPassModal callback scheduling */
  defaultTimezone?: string;
  /** Custom hover actions */
  hoverActions?: ReactNode;
  /** Custom class name */
  className?: string;
  /** Data sign for testing */
  'data-sign'?: string;
}
