export const directTransferStatues = {
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  SUCCEEDED: 'SUCCEEDED',
  FAILED: 'FAILED',
} as const;

export type DirectTransferStatues = keyof typeof directTransferStatues;
