/**
 * CxActiveCallControl module interfaces
 */

export interface CxActiveCallControlOptions {
  // Options for CxActiveCallControl module
}

export interface CxClientHangUpParams {
  sessionId: string;
}

export interface CxClientHoldSessionParams {
  sessionId: string;
  state: boolean;
}
