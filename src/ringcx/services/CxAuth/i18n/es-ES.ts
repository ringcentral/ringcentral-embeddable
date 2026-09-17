/* eslint-disable */
import { messageTypes } from '../../../enums';

export default {
  default: 'Predeterminado',
  us: 'Norteamérica Nacional',
  [messageTypes.NO_AGENT]: 'A esta cuenta RC no se le ha asignado ninguna cuenta de agente EV. Por favor contacte a su administrador.',
  [messageTypes.CONNECT_ERROR]: 'Error de autenticación. Vuelva a intentarlo más tarde.',
  [messageTypes.UNEXPECTED_AGENT]: 'A esta cuenta RC se le ha asignado una cuenta de agente EV inesperada. Por favor contacte a su administrador.',
  [messageTypes.INVALID_BROWSER]: 'WebSocket no es compatible con su navegador.',
  [messageTypes.CONNECT_TIMEOUT]: 'Tiempo de espera de autorización. Vuelva a intentarlo más tarde.',
  [messageTypes.OPEN_SOCKET_ERROR]: 'Error de conexión del zócalo. Vuelva a intentarlo más tarde.',
  [messageTypes.FORCE_LOGOUT]: 'Su sesión de inicio de sesión ha finalizado.',
  [messageTypes.LOGOUT_FAIL_WITH_CALL_CONNECTED]: 'No se puede cerrar sesión mientras hay una llamada conectada.',
} as const;
