/* eslint-disable */
import { messageTypes } from '../../../enums';

export default {
  [messageTypes.OFFHOOK_INIT_ERROR]: 'Erreur interne : échec de l\'initialisation du décrochage.',
  [messageTypes.OFFHOOK_TERM_ERROR]: 'Erreur interne : échec du terme de décrochage.',
  [messageTypes.ADD_SESSION_ERROR]: 'Erreur interne : échec de l\'ajout de session.',
  [messageTypes.DROP_SESSION_ERROR]: 'Erreur interne : échec de l\'abandon de la session.',
  [messageTypes.HOLD_ERROR]: 'Erreur interne : échec de la mise en attente/reprise de l\'appel.',
} as const;
