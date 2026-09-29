/* eslint-disable */
import { messageTypes } from '../../../enums';

export default {
  [messageTypes.OVER_BREAK_TIME]: 'Je pauze is voorbij.',
  [messageTypes.INVALID_STATE_CHANGE]: 'Kan statuswijziging niet verwerken. Handmatige overgang van OFFLINE, ENGAGED of OVERGANG is niet toegestaan.',
  [messageTypes.PENDING_DISPOSITION]: 'Kan de status niet wijzigen terwijl de dispositie in behandeling is.',
} as const;
