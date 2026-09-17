/* eslint-disable */
import { messageTypes } from '../../../enums';

export default {
  default: 'Standaard',
  us: 'Binnenlands Noord-Amerika',
  [messageTypes.NO_AGENT]: 'Aan dit RC-account is geen EV-agentaccount toegewezen. Neem contact op met uw beheerder.',
  [messageTypes.CONNECT_ERROR]: 'Authenticatiefout. Probeer het later opnieuw.',
  [messageTypes.UNEXPECTED_AGENT]: 'Aan dit RC-account is een onverwacht EV-agentaccount toegewezen. Neem contact op met uw beheerder.',
  [messageTypes.INVALID_BROWSER]: 'WebSocket wordt niet ondersteund door uw browser.',
  [messageTypes.CONNECT_TIMEOUT]: 'Time-out voor autorisatie. Probeer het later opnieuw.',
  [messageTypes.OPEN_SOCKET_ERROR]: 'Socket-verbindingsfout. Probeer het later opnieuw.',
  [messageTypes.FORCE_LOGOUT]: 'Uw aanmeldsessie is beëindigd.',
  [messageTypes.LOGOUT_FAIL_WITH_CALL_CONNECTED]: 'Kan niet uitloggen terwijl er een gesprek actief is.',
} as const;
