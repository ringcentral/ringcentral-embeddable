import { messageTypes } from '../../../enums';

export default {
  default: 'Default',
  us: 'North America Domestic',
  // Auth alert messages
  [messageTypes.NO_AGENT]:
    'This RC account has not been assigned any EV agent account. Please contact your admin.',
  [messageTypes.CONNECT_ERROR]: 'Authentication error. Please retry later.',
  [messageTypes.UNEXPECTED_AGENT]:
    'This RC account has been assigned an unexpected EV agent account. Please contact your admin.',
  [messageTypes.INVALID_BROWSER]: 'WebSocket is not supported by your browser.',
  [messageTypes.CONNECT_TIMEOUT]: 'Authorization timeout. Please retry later.',
  [messageTypes.OPEN_SOCKET_ERROR]:
    'Socket connection error. Please retry later.',
  [messageTypes.FORCE_LOGOUT]: 'Your logon session has been terminated.',
  [messageTypes.LOGOUT_FAIL_WITH_CALL_CONNECTED]:
    'Cannot logout while a call is connected.',
} as const;
