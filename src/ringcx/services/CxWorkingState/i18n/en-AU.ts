/* eslint-disable */
import { messageTypes } from '../../../enums';

export default {
  [messageTypes.OVER_BREAK_TIME]: 'Your break time is over.',
  [messageTypes.INVALID_STATE_CHANGE]: 'Unable to process state change. Manual transition from OFFLINE, ENGAGED, or TRANSITION is not allowed.',
  [messageTypes.PENDING_DISPOSITION]: 'Cannot change state while disposition is pending.',
} as const;

