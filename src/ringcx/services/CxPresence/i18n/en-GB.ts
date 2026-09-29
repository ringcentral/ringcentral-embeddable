/* eslint-disable */
import { messageTypes } from '../../../enums';

export default {
  [messageTypes.OFFHOOK_INIT_ERROR]: 'Internal error: offhook init failed.',
  [messageTypes.OFFHOOK_TERM_ERROR]: 'Internal error: offhook term failed.',
  [messageTypes.ADD_SESSION_ERROR]: 'Internal error: add session failed.',
  [messageTypes.DROP_SESSION_ERROR]: 'Internal error: drop session failed.',
  [messageTypes.HOLD_ERROR]: 'Internal error: hold/unhold call failed.',
} as const;

