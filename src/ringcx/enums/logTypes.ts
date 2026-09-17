import { ObjectMap } from '@ringcentral-integration/core/lib/ObjectMap';

export const logTypes = ObjectMap.fromKeys([
  'CALL_DISPOSITION_FAILURE',
  'CALL_DISPOSITION_SUCCESS',
  'CALL_LOG_CREATE_SUCCESS',
  'CALL_LOG_CREATE_FAILURE',
]);
