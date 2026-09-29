/* eslint-disable */
import { messageTypes } from '../../../enums';

export default {
  [messageTypes.OVER_BREAK_TIME]: 'Tu tiempo de descanso ha terminado.',
  [messageTypes.INVALID_STATE_CHANGE]: 'No se puede procesar el cambio de estado. No se permite la transición manual de SIN CONEXIÓN, COMPROMETIDO o TRANSICIÓN.',
  [messageTypes.PENDING_DISPOSITION]: 'No se puede cambiar el estado mientras la disposición está pendiente.',
} as const;
