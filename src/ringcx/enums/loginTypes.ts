import { ObjectMap } from '@ringcentral-integration/core/lib/ObjectMap';

export const loginTypes = ObjectMap.fromKeys([
  'integrated',
  'external',
  'RC_PHONE',
]);

export type LoginTypes = keyof typeof loginTypes;
