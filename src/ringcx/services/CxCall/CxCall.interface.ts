import type { CxExBridgeDirectory } from '../../../app/services/RingCX/RingCX.interface';

/**
 * CxCall options for configuration
 */
export interface CxCallOptions {
  // Optional configuration options
}

/**
 * Dialout form state
 */
export interface DialoutFormGroup {
  dialoutCallerId: string;
  dialoutQueueId: string;
  dialoutCountryId: string;
  dialoutRingTime: number;
}

export interface CxDialoutOptions {
  skipParse?: boolean;
  directory?: CxExBridgeDirectory;
}

/**
 * Manual outdial parameters
 */
export interface ManualOutdialParams {
  destination: string;
  callerId?: string | null;
  countryId?: string;
  queueId?: string | null;
  ringTime?: number;
  directory?: CxExBridgeDirectory;
}

/**
 * Ring time limits configuration
 */
export interface RingTimeLimit {
  min: number;
  max: number;
}
