/* eslint-disable */
import { messageTypes } from '../../../enums';

export default {
  [messageTypes.OVER_BREAK_TIME]: 'La tua pausa è finita.',
  [messageTypes.INVALID_STATE_CHANGE]: 'Impossibile elaborare il cambiamento di stato. La transizione manuale da OFFLINE, IMPEGNATO o TRANSIZIONE non è consentita.',
  [messageTypes.PENDING_DISPOSITION]: 'Impossibile modificare lo stato mentre la disposizione è in sospeso.',
} as const;
