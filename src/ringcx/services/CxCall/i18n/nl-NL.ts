/* eslint-disable */
import { messageTypes } from '../../../enums';
import { callErrors } from '../../../enums/callErrors';

export default {
  [messageTypes.NO_SUPPORT_COUNTRY]: 'Uitgaande oproepen voor het land worden nog niet ondersteund.',
  [messageTypes.FAILED_TO_CALL]: 'De lijn is bezet of heeft een wachtende dispositie.',
  [messageTypes.INTERCEPT]: 'Het belresultaat voor uw handmatige uitgaande gesprek was INTERCEPT.',
  [messageTypes.COPY_UII_SUCCESS]: 'Oproep-ID gekopieerd',
  [callErrors.noToNumber]: 'Voer een geldig telefoonnummer in.',
  [callErrors.emergencyNumber]: 'Noodoproepen zijn niet beschikbaar.',
} as const;
