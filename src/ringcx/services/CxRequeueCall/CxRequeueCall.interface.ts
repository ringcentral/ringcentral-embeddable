/**
 * CxRequeueCall module interfaces
 */

export interface CxRequeueCallOptions {
  // Options for CxRequeueCall module
}

export interface CxRequeueCallStatus {
  selectedQueueGroupId?: string;
  selectedGateId?: string;
  stayOnCall?: boolean;
  requeuing?: boolean;
}
