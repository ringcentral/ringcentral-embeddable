/* eslint-disable */
import { messageTypes } from '../../../enums';

export default {
  [messageTypes.OVER_BREAK_TIME]: 'Ihre Pause ist vorbei.',
  [messageTypes.INVALID_STATE_CHANGE]: 'Statusänderung kann nicht verarbeitet werden. Der manuelle Übergang von OFFLINE, ENGAGED oder TRANSITION ist nicht zulässig.',
  [messageTypes.PENDING_DISPOSITION]: 'Der Status kann nicht geändert werden, während die Disposition aussteht.',
} as const;
