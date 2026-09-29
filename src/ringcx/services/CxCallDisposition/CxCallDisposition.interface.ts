/**
 * CxCallDisposition options for configuration
 */
export interface CxCallDispositionOptions {
  // Optional configuration options
}

/**
 * Call disposition data
 */
export interface CxCallDispositionData {
  dispositionId: string | null;
  notes: string;
  summary: string;
}

/**
 * Call disposition mapping
 */
export interface CxCallDispositionMapping {
  [callId: string]: CxCallDispositionData;
}

/**
 * Disposition state
 */
export interface CxDispositionState {
  disposed: boolean;
}

/**
 * Disposition state mapping
 */
export interface CxDispositionStateMapping {
  [callId: string]: CxDispositionState;
}

export interface CxCallSummaryState {
  segmentId: string;
  orderedPhases: Record<number, string>;
  summary: string;
  isFinal: boolean;
  isLoading: boolean;
  isEditedAfterFinal: boolean;
}

export interface CxCallSummaryStateMapping {
  [callId: string]: CxCallSummaryState;
}
