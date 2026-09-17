/* eslint-disable */
import { messageTypes } from '../../../enums';
import { callErrors } from '../../../enums/callErrors';

export default {
  [messageTypes.NO_SUPPORT_COUNTRY]: 'Les appels sortants pour le pays ne sont pas encore pris en charge.',
  [messageTypes.FAILED_TO_CALL]: 'La ligne est occupée ou a une disposition en attente.',
  [messageTypes.INTERCEPT]: 'Le résultat de la numérotation pour votre appel sortant manuel était INTERCEPT.',
  [messageTypes.COPY_UII_SUCCESS]: 'ID d\'appel copié',
  [callErrors.noToNumber]: 'Veuillez entrer un numéro de téléphone valide.',
  [callErrors.emergencyNumber]: 'Les appels d’urgence ne sont pas disponibles.',
} as const;
