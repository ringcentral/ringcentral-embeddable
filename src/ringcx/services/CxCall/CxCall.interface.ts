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

/**
 * Manual outdial parameters
 */
export interface ManualOutdialParams {
  destination: string;
  callerId?: string | null;
  countryId?: string;
  queueId?: string | null;
  ringTime?: number;
}

/**
 * Ring time limits configuration
 */
export interface RingTimeLimit {
  min: number;
  max: number;
}
