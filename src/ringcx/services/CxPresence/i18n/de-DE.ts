/* eslint-disable */
import { messageTypes } from '../../../enums';

export default {
  [messageTypes.OFFHOOK_INIT_ERROR]: 'Interner Fehler: Offhook-Init fehlgeschlagen.',
  [messageTypes.OFFHOOK_TERM_ERROR]: 'Interner Fehler: Offhook-Term fehlgeschlagen.',
  [messageTypes.ADD_SESSION_ERROR]: 'Interner Fehler: Das Hinzufügen der Sitzung ist fehlgeschlagen.',
  [messageTypes.DROP_SESSION_ERROR]: 'Interner Fehler: Sitzungsabbruch fehlgeschlagen.',
  [messageTypes.HOLD_ERROR]: 'Interner Fehler: Anruf halten/enthalten fehlgeschlagen.',
} as const;
