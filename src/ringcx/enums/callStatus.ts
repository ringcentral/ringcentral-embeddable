import { ObjectMap } from '@ringcentral-integration/core/lib/ObjectMap';

export const callStatus = ObjectMap.prefixKeys(
  ['RINGING', 'ANSWERED', 'ENDED'],
  'call',
);
