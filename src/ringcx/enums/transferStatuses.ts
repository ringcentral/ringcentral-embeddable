export const transferStatuses = {
  loading: 'loading',
  idle: 'idle',
} as const;

export type TransferStatus = keyof typeof transferStatuses;
