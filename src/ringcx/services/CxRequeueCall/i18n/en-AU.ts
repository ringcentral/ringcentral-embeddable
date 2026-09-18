/* eslint-disable */
import { requeueEvents } from '../../../enums';

export default {
  [requeueEvents.START]: 'Call queue transfer in progress.',
  [requeueEvents.SUCCESS]: 'Call queue transfer completed.',
  [requeueEvents.FAILURE]: 'Call queue transfer failed.',
} as const;

