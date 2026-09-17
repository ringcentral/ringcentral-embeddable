/* eslint-disable */
import { messageTypes } from '../../../enums';
import { callErrors } from '../../../enums/callErrors';

export default {
  [messageTypes.NO_SUPPORT_COUNTRY]: 'Ausgehende Anrufe für das Land werden noch nicht unterstützt.',
  [messageTypes.FAILED_TO_CALL]: 'Die Leitung ist besetzt oder es steht eine Disposition aus.',
  [messageTypes.INTERCEPT]: 'Das Wählergebnis für Ihren manuellen ausgehenden Anruf war INTERCEPT.',
  [messageTypes.COPY_UII_SUCCESS]: 'Anruf-ID kopiert',
  [callErrors.noToNumber]: 'Geben Sie eine gültige Telefonnummer ein.',
  [callErrors.emergencyNumber]: 'Der Notruf ist nicht erreichbar.',
} as const;
