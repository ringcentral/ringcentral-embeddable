/* eslint-disable */
import { messageTypes } from '../../../enums';

export default {
  [messageTypes.OFFHOOK_INIT_ERROR]: 'Erro interno: falha na inicialização fora do gancho.',
  [messageTypes.OFFHOOK_TERM_ERROR]: 'Erro interno: falha no termo fora do gancho.',
  [messageTypes.ADD_SESSION_ERROR]: 'Erro interno: falha ao adicionar sessão.',
  [messageTypes.DROP_SESSION_ERROR]: 'Erro interno: falha na eliminação da sessão.',
  [messageTypes.HOLD_ERROR]: 'Erro interno: falha na chamada reter/liberar.',
} as const;
