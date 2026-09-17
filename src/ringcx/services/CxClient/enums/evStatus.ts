import { ObjectMap } from '@ringcentral-integration/core/lib/ObjectMap';

export const evStatus = ObjectMap.fromKeys([
  'START',
  'CONNECTING',
  'CONNECTED',
  'CONNECT_FAILURE',
  'LOGIN',
  'LOGINED',
  'LOGIN_FAILURE',
  /**
   * The socket dropped but the Agent SDK is still retrying with the stored
   * session hash code, so the session is recoverable and must not be cleared.
   */
  'RECONNECTING',
  'CLOSED',
]);
