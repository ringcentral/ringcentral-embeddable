import type { ReactNode } from 'react';

/**
 * Call detail metadata item (e.g., DNIS, Call ID, Term Party)
 */
export interface CallInfoItem {
  name: string;
  content: string;
  enableCopy?: boolean;
}

/**
 * Call status for ShinyBar-style status indicator
 */
export type CallInfoStatus = 'active' | 'callEnd';

/**
 * Props for CallInfoHeader component
 *
 * Aligned with BasicCallInfo from @ringcentral-integration/widgets
 */
export interface CallInfoHeaderProps {
  /** Primary display name (contact name or phone number) */
  subject?: string;
  /** Whether the call is inbound */
  isInbound?: boolean;
  /** Whether the call is currently ringing/active (drives status bar animation) */
  isRinging?: boolean;
  /** Call status driving the status bar color */
  status?: CallInfoStatus;
  /** Secondary info strings displayed with "|" separator (e.g., formatted phone, queue name) */
  followInfos?: string[];
  /** Detailed call metadata for the detail panel */
  callInfos?: CallInfoItem[];
  /** Custom class name */
  className?: string;
  /** Data sign for testing */
  'data-sign'?: string;
  /** Additional action buttons (e.g., chevron right for details) */
  actions?: ReactNode;
  /** Click handler - navigates to call detail page */
  onClick?: () => void;
}
