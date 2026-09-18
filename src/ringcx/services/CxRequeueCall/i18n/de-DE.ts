/* eslint-disable */
import { requeueEvents } from '../../../enums';

export default {
  [requeueEvents.START]: 'Anrufwarteschlangenübertragung läuft.',
  [requeueEvents.SUCCESS]: 'Anrufwarteschlangenübertragung abgeschlossen.',
  [requeueEvents.FAILURE]: 'Die Übertragung der Anrufwarteschlange ist fehlgeschlagen.',
} as const;
