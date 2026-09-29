export const transferTypes = {
  internal: 'internal',
  phoneBook: 'phoneBook',
  manualEntry: 'manualEntry',
  queue: 'queue',
} as const;

export type CxTransferType = keyof typeof transferTypes;
