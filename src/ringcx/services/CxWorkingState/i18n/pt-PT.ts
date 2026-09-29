/* eslint-disable */
import { messageTypes } from '../../../enums';

export default {
  [messageTypes.OVER_BREAK_TIME]: 'O seu intervalo acabou.',
  [messageTypes.INVALID_STATE_CHANGE]: 'Não foi possível processar a alteração de estado. A transição manual de OFFLINE, ENGAGED ou TRANSITION não é permitida.',
  [messageTypes.PENDING_DISPOSITION]: 'Não é possível alterar o estado enquanto a disposição estiver pendente.',
} as const;
