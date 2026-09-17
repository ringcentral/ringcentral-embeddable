/* eslint-disable */
import { dropDownOptions, loginTypes, messageTypes } from '../../../enums';

export default {
  [loginTypes.RC_PHONE]: 'Telefono dell\'ufficio RingCentral',
  [loginTypes.external]: 'Usa telefono esterno',
  [loginTypes.integrated]: 'Softphone integrato',
  [dropDownOptions.None]: 'Nessuno',
  [messageTypes.NOT_INBOUND_QUEUE_SELECTED]: 'Seleziona almeno una coda in entrata.',
  [messageTypes.EMPTY_PHONE_NUMBER]: 'Il numero di telefono è obbligatorio.',
  [messageTypes.INVALID_PHONE_NUMBER]: 'Numero di telefono non valido.',
  [messageTypes.AGENT_CONFIG_ERROR]: 'Configurazione dell\'agente non riuscita.',
  [messageTypes.UPDATE_AGENT_ERROR]: 'Impossibile aggiornare le impostazioni dell\'agente.',
  [messageTypes.UPDATE_AGENT_SUCCESS]: 'Impostazioni dell\'agente aggiornate correttamente.',
  [messageTypes.EXISTING_LOGIN_ENGAGED]: 'Il login è attualmente in uso. Per favore riprova più tardi.',
} as const;
