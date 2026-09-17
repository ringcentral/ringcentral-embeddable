/* eslint-disable */
import { messageTypes } from '../../../enums';

export default {
  [messageTypes.OFFHOOK_INIT_ERROR]: 'Error interno: falló el inicio de descolgado.',
  [messageTypes.OFFHOOK_TERM_ERROR]: 'Error interno: error en el término de descolgado.',
  [messageTypes.ADD_SESSION_ERROR]: 'Error interno: falló al agregar sesión.',
  [messageTypes.DROP_SESSION_ERROR]: 'Error interno: falló al finalizar la sesión.',
  [messageTypes.HOLD_ERROR]: 'Error interno: fallar la llamada en espera o en espera.',
} as const;
