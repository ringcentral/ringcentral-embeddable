import type { ReactNode } from 'react';

import type { Lead as ServiceLead } from '../../services/CxLeads';

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
  /** Callback when manual pass is clicked; the list shows the pass form */
  onManualPass?: (lead: Lead) => void;
  /** Whether to show view lead button */
  showViewLeadButton?: boolean;
  /** Whether to show manual pass button */
  showManualPassButton?: boolean;
  /** Whether manual pass is disabled */
  disableManualPass?: boolean;
  /** Custom hover actions */
  hoverActions?: ReactNode;
  /** Custom class name */
  className?: string;
  /** Data sign for testing */
  'data-sign'?: string;
}
