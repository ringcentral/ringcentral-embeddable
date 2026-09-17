/* eslint-disable */
import { dropDownOptions, loginTypes, messageTypes } from '../../../enums';

export default {
  [loginTypes.RC_PHONE]: 'Telefoon van RingCentraal Kantoor',
  [loginTypes.external]: 'Gebruik externe telefoon',
  [loginTypes.integrated]: 'Geïntegreerde softphone',
  [dropDownOptions.None]: 'Geen',
  [messageTypes.NOT_INBOUND_QUEUE_SELECTED]: 'Selecteer minimaal één inkomende wachtrij.',
  [messageTypes.EMPTY_PHONE_NUMBER]: 'Telefoonnummer is vereist.',
  [messageTypes.INVALID_PHONE_NUMBER]: 'Ongeldig telefoonnummer.',
  [messageTypes.AGENT_CONFIG_ERROR]: 'Agentconfiguratie mislukt.',
  [messageTypes.UPDATE_AGENT_ERROR]: 'Kan agentinstellingen niet bijwerken.',
  [messageTypes.UPDATE_AGENT_SUCCESS]: 'Agentinstellingen zijn succesvol bijgewerkt.',
  [messageTypes.EXISTING_LOGIN_ENGAGED]: 'Inloggen is momenteel in gebruik. Probeer het later opnieuw.',
} as const;
