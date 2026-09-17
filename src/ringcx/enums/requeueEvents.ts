import { ObjectMap } from '@ringcentral-integration/core/lib/ObjectMap';

export const requeueEvents = ObjectMap.prefixKeys(
  ['START', 'SUCCESS', 'FAILURE'],
  'requeue',
);

export type RequeueEvent = keyof typeof requeueEvents;
