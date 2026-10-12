/* eslint-disable */
import { dropDownOptions, loginTypes, messageTypes } from '../../../enums';

export default {
  [loginTypes.RC_PHONE]: 'Téléphone du bureau RingCentral',
  [loginTypes.external]: 'Utiliser un téléphone externe',
  [loginTypes.integrated]: 'Téléphone logiciel intégré',
  [dropDownOptions.None]: 'Aucun',
  [messageTypes.NOT_INBOUND_QUEUE_SELECTED]: 'Veuillez sélectionner au moins une file d\'attente entrante.',
  [messageTypes.NOT_INBOUND_QUEUE_OR_DIAL_GROUP_SELECTED]: 'Veuillez sélectionner au moins une file d\'attente entrante ou un groupe de numérotation.',
  [messageTypes.EMPTY_PHONE_NUMBER]: 'Le numéro de téléphone est requis.',
  [messageTypes.INVALID_PHONE_NUMBER]: 'Numéro de téléphone non valide.',
  [messageTypes.AGENT_CONFIG_ERROR]: 'La configuration de l\'agent a échoué.',
  [messageTypes.UPDATE_AGENT_ERROR]: 'Échec de la mise à jour des paramètres de l\'agent.',
  [messageTypes.UPDATE_AGENT_SUCCESS]: 'Paramètres de l\'agent mis à jour avec succès.',
  [messageTypes.EXISTING_LOGIN_ENGAGED]: 'La connexion est actuellement utilisée. Veuillez réessayer plus tard.',
  dialGroupUpdated: 'Votre groupe de composition a été mis à jour. Voici la nouvelle version : {dialGroupName}',
} as const;
