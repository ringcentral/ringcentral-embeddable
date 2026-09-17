import { ObjectMap } from '@ringcentral-integration/core/lib/ObjectMap';

export enum CxLoginStatus {
  NO_AUTH = 'noAuth',
  AUTHING = 'authing',
  AUTH_SUCCESS = 'authSuccess',
  REAUTHING = 'reauthing',
  UNAUTHING = 'unauthing',
  AUTH_FAILURE = 'authFailure',
}

export const evAuthEvent = ObjectMap.prefixKeys(
  [
    'AUTH_SUCCESS',
    'LOGIN_SUCCESS',
    'LOGOUT_BEFORE',
    'LOGOUT_AFTER',
    'LOGGING_OUT',
    'NOT_AUTH',
    'BEFORE_LOGOUT_COMPLETE',
  ],
  'auth',
);
