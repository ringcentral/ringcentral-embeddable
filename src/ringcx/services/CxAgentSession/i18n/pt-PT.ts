/* eslint-disable */
import { dropDownOptions, loginTypes, messageTypes } from '../../../enums';

export default {
  [loginTypes.RC_PHONE]: 'Telefone do escritório RingCentral',
  [loginTypes.external]: 'Utilizar telefone externo',
  [loginTypes.integrated]: 'Softphone integrado',
  [dropDownOptions.None]: 'Nenhum',
  [messageTypes.NOT_INBOUND_QUEUE_SELECTED]: 'Selecione pelo menos uma fila de entrada.',
  [messageTypes.NOT_INBOUND_QUEUE_OR_DIAL_GROUP_SELECTED]: 'Selecione pelo menos uma fila de entrada ou um grupo de marcação.',
  [messageTypes.EMPTY_PHONE_NUMBER]: 'O número de telefone é obrigatório.',
  [messageTypes.INVALID_PHONE_NUMBER]: 'Número de telefone inválido.',
  [messageTypes.AGENT_CONFIG_ERROR]: 'Falha na configuração do agente.',
  [messageTypes.UPDATE_AGENT_ERROR]: 'Falha ao atualizar as definições do agente.',
  [messageTypes.UPDATE_AGENT_SUCCESS]: 'Configurações do agente atualizadas com sucesso.',
  [messageTypes.EXISTING_LOGIN_ENGAGED]: 'O login está atualmente em utilização. Por favor, tente mais tarde.',
} as const;
