export const dialoutStatuses = {
  dialing: 'dialing',
  idle: 'idle',
  callConnected: 'callConnected',
} as const;

export type DialoutStatusesType = keyof typeof dialoutStatuses;
