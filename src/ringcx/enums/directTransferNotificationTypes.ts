export const directTransferNotificationTypes = {
  MISSED: 'MISSED',
  CANCELLED: 'CANCELLED',
  PENDING: 'PENDING',
  VOICEMAIL: 'VOICEMAIL',
} as const;

export type DirectTransferNotificationTypes =
  keyof typeof directTransferNotificationTypes;
