/* eslint-disable */
import { requeueEvents } from '../../../enums';

export default {
  [requeueEvents.START]: 'Transferencia de cola de llamadas en curso.',
  [requeueEvents.SUCCESS]: 'Transferencia de cola de llamadas completada.',
  [requeueEvents.FAILURE]: 'Falló la transferencia de la cola de llamadas.',
} as const;
