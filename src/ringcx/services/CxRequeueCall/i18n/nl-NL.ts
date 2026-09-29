/* eslint-disable */
import { requeueEvents } from '../../../enums';

export default {
  [requeueEvents.START]: 'Doorverbinden van wachtrij wordt uitgevoerd.',
  [requeueEvents.SUCCESS]: 'Doorverbinden van wachtrij voltooid.',
  [requeueEvents.FAILURE]: 'Doorverbinden van oproepwachtrij mislukt.',
} as const;
