import { requeueEvents } from '../../../enums';

export default {
  // Requeue alert messages
  [requeueEvents.START]: 'Call queue transfer in progress.',
  [requeueEvents.SUCCESS]: 'Call queue transfer completed.',
  [requeueEvents.FAILURE]: 'Call queue transfer failed.',
} as const;
