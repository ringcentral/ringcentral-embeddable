/* eslint-disable */
import { messageTypes } from '../../../enums';

export default {
  [messageTypes.OVER_BREAK_TIME]: 'Votre temps de pause est terminé.',
  [messageTypes.INVALID_STATE_CHANGE]: 'Impossible de traiter le changement d\'état. La transition manuelle depuis HORS LIGNE, ENGAGE ou TRANSITION n\'est pas autorisée.',
  [messageTypes.PENDING_DISPOSITION]: 'Impossible de changer d\'état pendant que la disposition est en attente.',
} as const;
