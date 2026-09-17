/* eslint-disable */
import { messageTypes } from '../../../enums';
import { callErrors } from '../../../enums/callErrors';

export default {
  [messageTypes.NO_SUPPORT_COUNTRY]: 'Las llamadas salientes para el país aún no son compatibles.',
  [messageTypes.FAILED_TO_CALL]: 'La línea está ocupada o tiene una disposición pendiente.',
  [messageTypes.INTERCEPT]: 'El resultado del marcado para su llamada saliente manual fue INTERCEPTAR.',
  [messageTypes.COPY_UII_SUCCESS]: 'ID de llamada copiado',
  [callErrors.noToNumber]: 'Indique un número de teléfono válido.',
  [callErrors.emergencyNumber]: 'Las llamadas de emergencia no están disponibles.',
} as const;
