/* eslint-disable */
import { messageTypes } from '../../../enums';

export default {
  [messageTypes.OFFHOOK_INIT_ERROR]: 'Sisäinen virhe: offhook-init epäonnistui.',
  [messageTypes.OFFHOOK_TERM_ERROR]: 'Sisäinen virhe: offhook-termi epäonnistui.',
  [messageTypes.ADD_SESSION_ERROR]: 'Sisäinen virhe: istunnon lisäys epäonnistui.',
  [messageTypes.DROP_SESSION_ERROR]: 'Sisäinen virhe: pudotusistunto epäonnistui.',
  [messageTypes.HOLD_ERROR]: 'Sisäinen virhe: puhelun pito/poistaminen epäonnistui.',
} as const;
