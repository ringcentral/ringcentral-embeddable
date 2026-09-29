/* eslint-disable */
import { messageTypes } from '../../../enums';

export default {
  [messageTypes.OFFHOOK_INIT_ERROR]: 'Errore interno: inizializzazione offhook non riuscita.',
  [messageTypes.OFFHOOK_TERM_ERROR]: 'Errore interno: termine di sgancio non riuscito.',
  [messageTypes.ADD_SESSION_ERROR]: 'Errore interno: aggiunta sessione non riuscita.',
  [messageTypes.DROP_SESSION_ERROR]: 'Errore interno: eliminazione sessione non riuscita.',
  [messageTypes.HOLD_ERROR]: 'Errore interno: messa in attesa/ripresa della chiamata non riuscita.',
} as const;
