import type { CxClientCallMapping } from './interfaces';

/**
 * CxClient options for configuration (extends the base options with required callbacks)
 */
export interface CxClientServiceOptions {
  options: {
    authHost: string;
    localTesting: boolean;
    allowMultiSocket: boolean;
    isSecureSocket: boolean;
  };
  callbacks: {
    closeResponse: () => void;
    openResponse: (response: CxClientCallMapping['openResponse']) => void;
  };
}

/**
 * Identity values that live on the Agent SDK instance (or its local storage)
 * rather than in module state, so they are only readable on the main client.
 */
export interface CxAgentIdentity {
  /** Engage token used for RingCX HTTP requests. */
  engageAccessToken: string;
  /** Engage platform id, e.g. `aws91-l26`. */
  platformId: string;
  mainAccountId: string;
  /** RingCentral extension id of the logged in agent. */
  rcUserId: string;
}

/**
 * Transfer call parameters
 */
export interface CxClientTransferParams {
  dialDest: string;
  callerId?: string;
  sipHeaders?: string[];
  countryId?: string;
}

/**
 * Hangup call parameters
 */
export interface CxClientHangUpParams {
  sessionId: string;
  resetPendingDisp?: boolean;
}

/**
 * Hold session parameters
 */
export interface CxClientHoldSessionParams {
  state: boolean;
  sessionId: string;
}

/**
 * Manual outdial parameters
 */
export interface CxClientManualOutdialParams {
  destination: string;
  callerId: string;
  ringTime: number;
  queueId: string;
  countryId: string;
}
