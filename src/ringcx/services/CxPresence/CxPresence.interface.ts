import type { DialoutStatusesType } from '../../enums';

/**
 * CxPresence options for configuration
 */
export interface CxPresenceOptions {
  // Optional configuration options
}

/**
 * Recording settings interface
 */
export interface CxAgentRecording {
  agentRecording: boolean;
  default: string;
  pause: boolean;
}

/**
 * Call ringing callback type
 */
export type OnCallRingingCallback = (session?: {
  sessionId: string;
  uii?: string;
}) => void;

/**
 * Call answered callback type
 */
export type OnCallAnsweredCallback = (currentCall?: any) => void;

/**
 * Call ended callback type
 */
export type OnCallEndedCallback = (currentCall?: any) => void;
