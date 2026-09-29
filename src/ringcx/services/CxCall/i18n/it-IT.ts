/* eslint-disable */
import { messageTypes } from '../../../enums';
import { callErrors } from '../../../enums/callErrors';

export default {
  [messageTypes.NO_SUPPORT_COUNTRY]: 'Le chiamate in uscita per il Paese non sono ancora supportate.',
  [messageTypes.FAILED_TO_CALL]: 'La linea è occupata o ha una disposizione in sospeso.',
  [messageTypes.INTERCEPT]: 'Il risultato della chiamata per la chiamata in uscita manuale è stato INTERCETTAZIONE.',
  [messageTypes.COPY_UII_SUCCESS]: 'ID chiamata copiato',
  [callErrors.noToNumber]: 'Inserisci un numero di telefono valido.',
  [callErrors.emergencyNumber]: 'Chiamate di emergenza non disponibili.',
} as const;
