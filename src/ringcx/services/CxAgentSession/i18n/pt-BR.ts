/* eslint-disable */
import { dropDownOptions, loginTypes, messageTypes } from '../../../enums';

export default {
  [loginTypes.RC_PHONE]: 'Telefone do escritório RingCentral',
  [loginTypes.external]: 'Usar telefone externo',
  [loginTypes.integrated]: 'Softphone integrado',
  [dropDownOptions.None]: 'Nenhum',
  [messageTypes.NOT_INBOUND_QUEUE_SELECTED]: 'Selecione pelo menos uma fila de entrada.',
  [messageTypes.NOT_INBOUND_QUEUE_OR_DIAL_GROUP_SELECTED]: 'Selecione pelo menos uma fila de entrada ou um grupo de discagem.',
  [messageTypes.EMPTY_PHONE_NUMBER]: 'O número de telefone é obrigatório.',
  [messageTypes.INVALID_PHONE_NUMBER]: 'Número de telefone inválido.',
  [messageTypes.AGENT_CONFIG_ERROR]: 'Falha na configuração do agente.',
  [messageTypes.UPDATE_AGENT_ERROR]: 'Falha ao atualizar as configurações do agente.',
  [messageTypes.UPDATE_AGENT_SUCCESS]: 'Configurações do agente atualizadas com sucesso.',
  [messageTypes.EXISTING_LOGIN_ENGAGED]: 'O login está em uso no momento. Por favor, tente novamente mais tarde.',
  dialGroupUpdated: 'Seu grupo de discagem foi atualizado para o grupo de discagem: {dialGroupName}',
} as const;
