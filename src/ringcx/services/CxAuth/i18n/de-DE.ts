/* eslint-disable */
import { messageTypes } from '../../../enums';

export default {
  default: 'Standard',
  us: 'Nordamerika Inland',
  [messageTypes.NO_AGENT]: 'Diesem RC-Konto wurde kein EV-Agentenkonto zugewiesen. Bitte wenden Sie sich an Ihren Administrator.',
  [messageTypes.CONNECT_ERROR]: 'Authentifizierungsfehler. Bitte versuchen Sie es später noch einmal.',
  [messageTypes.UNEXPECTED_AGENT]: 'Diesem RC-Konto wurde ein unerwartetes EV-Agentenkonto zugewiesen. Bitte wenden Sie sich an Ihren Administrator.',
  [messageTypes.INVALID_BROWSER]: 'WebSocket wird von Ihrem Browser nicht unterstützt.',
  [messageTypes.CONNECT_TIMEOUT]: 'Autorisierungszeitüberschreitung. Bitte versuchen Sie es später noch einmal.',
  [messageTypes.OPEN_SOCKET_ERROR]: 'Socket-Verbindungsfehler. Bitte versuchen Sie es später noch einmal.',
  [messageTypes.FORCE_LOGOUT]: 'Ihre Anmeldesitzung wurde beendet.',
  [messageTypes.LOGOUT_FAIL_WITH_CALL_CONNECTED]: 'Abmelden nicht möglich, während ein Anruf verbunden ist.',
} as const;
