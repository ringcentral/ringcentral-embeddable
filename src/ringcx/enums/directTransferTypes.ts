export const directTransferTypes = {
  WARM: 'WARM',
  COLD: 'COLD',
  CANCEL: 'CANCEL',
  VOICEMAIL: 'VOICEMAIL',
} as const;

export type DirectTransferTypes = keyof typeof directTransferTypes;
