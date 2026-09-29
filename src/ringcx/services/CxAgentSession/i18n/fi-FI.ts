/* eslint-disable */
import { dropDownOptions, loginTypes, messageTypes } from '../../../enums';

export default {
  [loginTypes.RC_PHONE]: 'Soi Keskustoimiston puhelimeen',
  [loginTypes.external]: 'Käytä ulkoista puhelinta',
  [loginTypes.integrated]: 'Integroitu ohjelmistopuhelin',
  [dropDownOptions.None]: 'Ei mitään',
  [messageTypes.NOT_INBOUND_QUEUE_SELECTED]: 'Valitse vähintään yksi saapuva jono.',
  [messageTypes.NOT_INBOUND_QUEUE_OR_DIAL_GROUP_SELECTED]: 'Valitse vähintään yksi saapuva jono tai valintaryhmä.',
  [messageTypes.EMPTY_PHONE_NUMBER]: 'Puhelinnumero vaaditaan.',
  [messageTypes.INVALID_PHONE_NUMBER]: 'Virheellinen puhelinnumero.',
  [messageTypes.AGENT_CONFIG_ERROR]: 'Agentin määritys epäonnistui.',
  [messageTypes.UPDATE_AGENT_ERROR]: 'Agentin asetusten päivittäminen epäonnistui.',
  [messageTypes.UPDATE_AGENT_SUCCESS]: 'Agentin asetusten päivitys onnistui.',
  [messageTypes.EXISTING_LOGIN_ENGAGED]: 'Kirjautuminen on tällä hetkellä käytössä. Yritä myöhemmin uudelleen.',
} as const;
