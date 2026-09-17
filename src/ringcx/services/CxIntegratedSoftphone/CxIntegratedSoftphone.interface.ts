/**
 * CxIntegratedSoftphone options for configuration
 */
export interface CxIntegratedSoftphoneOptions {
  // Optional configuration options
}

/**
 * SIP registration state
 */
export type SipState = 'idle' | 'registering' | 'registered' | 'failed';

/**
 * Props for showing the ringing modal
 */
export interface ShowRingingModalProps {
  displayName: string;
  queueName: string;
  isInbound: boolean;
}
