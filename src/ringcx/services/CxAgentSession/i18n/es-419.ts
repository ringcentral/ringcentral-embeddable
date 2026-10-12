/* eslint-disable */
import { dropDownOptions, loginTypes, messageTypes } from '../../../enums';

export default {
  [loginTypes.RC_PHONE]: 'Teléfono de la oficina central de Ring',
  [loginTypes.external]: 'Usar teléfono externo',
  [loginTypes.integrated]: 'Softphone integrado',
  [dropDownOptions.None]: 'Ninguno',
  [messageTypes.NOT_INBOUND_QUEUE_SELECTED]: 'Seleccione al menos una cola entrante.',
  [messageTypes.NOT_INBOUND_QUEUE_OR_DIAL_GROUP_SELECTED]: 'Seleccione al menos una cola entrante o un grupo de marcado.',
  [messageTypes.EMPTY_PHONE_NUMBER]: 'Se requiere el número de teléfono.',
  [messageTypes.INVALID_PHONE_NUMBER]: 'Número de teléfono no válido.',
  [messageTypes.AGENT_CONFIG_ERROR]: 'Error en la configuración del agente.',
  [messageTypes.UPDATE_AGENT_ERROR]: 'No se pudo actualizar la configuración del agente.',
  [messageTypes.UPDATE_AGENT_SUCCESS]: 'La configuración del agente se actualizó correctamente.',
  [messageTypes.EXISTING_LOGIN_ENGAGED]: 'El inicio de sesión está actualmente en uso. Inténtelo de nuevo más tarde.',
  dialGroupUpdated: 'Su grupo de marcado se ha actualizado al grupo de marcado: {dialGroupName}',
} as const;
