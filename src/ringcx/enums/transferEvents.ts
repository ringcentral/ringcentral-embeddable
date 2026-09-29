import { ObjectMap } from '@ringcentral-integration/core/lib/ObjectMap';

export const transferEvents = ObjectMap.prefixKeys(
  ['START', 'SUCCESS', 'END', 'ERROR'],
  'transfer',
);

export type TransferEvent = keyof typeof transferEvents;
