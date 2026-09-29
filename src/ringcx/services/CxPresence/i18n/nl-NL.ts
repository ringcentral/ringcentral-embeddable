/* eslint-disable */
import { messageTypes } from '../../../enums';

export default {
  [messageTypes.OFFHOOK_INIT_ERROR]: 'Interne fout: initiëren van de haak van de haak is mislukt.',
  [messageTypes.OFFHOOK_TERM_ERROR]: 'Interne fout: term van de haak van de haak is mislukt.',
  [messageTypes.ADD_SESSION_ERROR]: 'Interne fout: sessie toevoegen mislukt.',
  [messageTypes.DROP_SESSION_ERROR]: 'Interne fout: sessie beëindigen is mislukt.',
  [messageTypes.HOLD_ERROR]: 'Interne fout: oproep in wacht/uit wacht mislukt.',
} as const;
