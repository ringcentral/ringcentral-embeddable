/* eslint-disable */
import { requeueEvents } from '../../../enums';

export default {
  [requeueEvents.START]: 'Transfert de la file d\'attente des appels en cours.',
  [requeueEvents.SUCCESS]: 'Transfert de la file d\'attente des appels terminé.',
  [requeueEvents.FAILURE]: 'Le transfert de la file d\'attente des appels a échoué.',
} as const;
