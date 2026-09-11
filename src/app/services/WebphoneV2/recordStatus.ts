import { ObjectMap } from '@ringcentral-integration/core/lib/ObjectMap';

export const recordStatus = ObjectMap.prefixKeys(
  ['idle', 'pending', 'recording', 'noAccess'],
  'webphone-record',
);

export default recordStatus;
