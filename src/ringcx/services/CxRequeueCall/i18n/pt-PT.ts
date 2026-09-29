/* eslint-disable */
import { requeueEvents } from '../../../enums';

export default {
  [requeueEvents.START]: 'Transferência da fila de chamadas em curso.',
  [requeueEvents.SUCCESS]: 'Transferência da fila de chamadas concluída.',
  [requeueEvents.FAILURE]: 'Falha na transferência da fila de chamadas.',
} as const;
