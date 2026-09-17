import type { CxAddSessionNotification, CxBaseCall } from '../CxClient/interfaces';

/**
 * CxCallMonitor module interfaces
 */

export interface CxCallMonitorOptions {
  // Options for CxCallMonitor module
}

export interface CxCallData extends CxBaseCall {
  contactMatches?: any[];
  activityMatches?: any[];
  recordingUrl?: string;
  agentName?: string | null;
}

export type OnCallRingingCallback = (session?: CxAddSessionNotification) => void;
export type OnCallAnsweredCallback = (currentCall?: CxCallData) => void;
export type OnCallEndedCallback = (currentCall?: CxCallData) => void;
