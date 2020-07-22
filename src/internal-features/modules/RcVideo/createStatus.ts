import { ObjectMap } from '@ringcentral-integration/core/lib/ObjectMap';

export default ObjectMap.prefixKeys(
  ['creating', 'created', 'idle'],
  'videoCreatingStatus',
);
