/* eslint-disable */
import { messageTypes } from '../../../enums';

export default {
  default: 'Padrão',
  us: 'América do Norte Doméstica',
  [messageTypes.NO_AGENT]: 'Esta conta RC não recebeu nenhuma conta de agente EV. Entre em contato com seu administrador.',
  [messageTypes.CONNECT_ERROR]: 'Erro de autenticação. Tente novamente mais tarde.',
  [messageTypes.UNEXPECTED_AGENT]: 'Esta conta RC recebeu uma conta de agente EV inesperada. Entre em contato com seu administrador.',
  [messageTypes.INVALID_BROWSER]: 'WebSocket não é compatível com seu navegador.',
  [messageTypes.CONNECT_TIMEOUT]: 'Tempo limite de autorização. Tente novamente mais tarde.',
  [messageTypes.OPEN_SOCKET_ERROR]: 'Erro de conexão do soquete. Tente novamente mais tarde.',
  [messageTypes.FORCE_LOGOUT]: 'A sessão de login foi encerrada.',
  [messageTypes.LOGOUT_FAIL_WITH_CALL_CONNECTED]: 'Não é possível sair enquanto uma chamada está conectada.',
} as const;
