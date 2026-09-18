/* eslint-disable */
import { requeueEvents } from '../../../enums';

export default {
  [requeueEvents.START]: 'Puhelujonon siirto käynnissä.',
  [requeueEvents.SUCCESS]: 'Puhelujonon siirto suoritettu.',
  [requeueEvents.FAILURE]: 'Puhelujonon siirto epäonnistui.',
} as const;
