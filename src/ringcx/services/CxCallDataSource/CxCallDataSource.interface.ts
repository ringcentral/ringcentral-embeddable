import type { CxBaseCall, CxAddSessionNotification } from '../CxClient/interfaces';

/**
 * CxCallDataSource module interfaces
 */

export interface CxCallDataSourceOptions {
  // Options for CxCallDataSource module
}

export interface CxCallData extends CxBaseCall {
  timestamp?: number;
  gate?: CxRequeueCallGate;
  session?: CxAddSessionNotification;
  endedCall?: any;
  isHold?: boolean;
}

export interface CxRequeueCallGate {
  gateId: string;
  gateGroupId?: string;
}

export interface CallDataState {
  /** current agent ongoing session calls list with callId (encodeUii({ uii, sessionId })) */
  callIds: string[];
  /** other agent ongoing session calls list with callId (encodeUii({ uii, sessionId })) */
  otherCallIds: string[];
  /** ended calls list with callId (encodeUii({ uii, sessionId })) */
  callLogsIds: string[];
  /** mapping data with call session callId (encodeUii({ uii, sessionId })) */
  callsMapping: Record<string, CxCallData>;
  /** mapping data without call session data with uii */
  rawCallsMapping: Record<string, CxCallData>;
}
