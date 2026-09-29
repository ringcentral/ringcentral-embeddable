/* eslint-disable */
import { messageTypes } from '../../../enums';

export default {
  default: 'Par défaut',
  us: 'Amérique du Nord Domestique',
  [messageTypes.NO_AGENT]: 'Ce compte RC n\'a reçu aucun compte d\'agent EV. Veuillez contacter votre administrateur.',
  [messageTypes.CONNECT_ERROR]: 'Erreur d\'authentification. Veuillez réessayer plus tard.',
  [messageTypes.UNEXPECTED_AGENT]: 'Ce compte RC s\'est vu attribuer un compte d\'agent EV inattendu. Veuillez contacter votre administrateur.',
  [messageTypes.INVALID_BROWSER]: 'WebSocket n\'est pas pris en charge par votre navigateur.',
  [messageTypes.CONNECT_TIMEOUT]: 'Expiration du délai d\'autorisation. Veuillez réessayer plus tard.',
  [messageTypes.OPEN_SOCKET_ERROR]: 'Erreur de connexion au socket. Veuillez réessayer plus tard.',
  [messageTypes.FORCE_LOGOUT]: 'Votre session de connexion a pris fin.',
  [messageTypes.LOGOUT_FAIL_WITH_CALL_CONNECTED]: 'Impossible de se déconnecter lorsqu\'un appel est connecté.',
} as const;
