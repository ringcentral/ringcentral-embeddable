/* eslint-disable */
import { dropDownOptions, loginTypes, messageTypes } from '../../../enums';

export default {
  [loginTypes.RC_PHONE]: 'RingCentral Office-Telefon',
  [loginTypes.external]: 'Externes Telefon verwenden',
  [loginTypes.integrated]: 'Integriertes Softphone',
  [dropDownOptions.None]: 'Keine',
  [messageTypes.NOT_INBOUND_QUEUE_SELECTED]: 'Bitte wählen Sie mindestens eine Eingangswarteschlange aus.',
  [messageTypes.EMPTY_PHONE_NUMBER]: 'Telefonnummer ist erforderlich.',
  [messageTypes.INVALID_PHONE_NUMBER]: 'Ungültige Telefonnummer.',
  [messageTypes.AGENT_CONFIG_ERROR]: 'Agent-Konfiguration fehlgeschlagen.',
  [messageTypes.UPDATE_AGENT_ERROR]: 'Die Agent-Einstellungen konnten nicht aktualisiert werden.',
  [messageTypes.UPDATE_AGENT_SUCCESS]: 'Agent-Einstellungen erfolgreich aktualisiert.',
  [messageTypes.EXISTING_LOGIN_ENGAGED]: 'Login wird derzeit verwendet. Bitte versuchen Sie es später noch einmal.',
} as const;
