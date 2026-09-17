/* eslint-disable */
import { messageTypes } from '../../../enums';

export default {
  default: 'Predefinição',
  us: 'América do Norte Doméstica',
  [messageTypes.NO_AGENT]: 'Esta conta RC não recebeu nenhuma conta de agente EV. Entre em contacto com o seu administrador.',
  [messageTypes.CONNECT_ERROR]: 'Erro de autenticação. Tente novamente mais tarde.',
  [messageTypes.UNEXPECTED_AGENT]: 'Esta conta RC recebeu uma conta de agente EV inesperada. Entre em contacto com o seu administrador.',
  [messageTypes.INVALID_BROWSER]: 'O WebSocket não é compatível com o seu browser.',
  [messageTypes.CONNECT_TIMEOUT]: 'Tempo limite de autorização. Tente novamente mais tarde.',
  [messageTypes.OPEN_SOCKET_ERROR]: 'Erro de ligação do socket. Tente novamente mais tarde.',
  [messageTypes.FORCE_LOGOUT]: 'A sua sessão de início de sessão foi terminada.',
  [messageTypes.LOGOUT_FAIL_WITH_CALL_CONNECTED]: 'Não é possível sair enquanto uma chamada está ligada.',
} as const;
