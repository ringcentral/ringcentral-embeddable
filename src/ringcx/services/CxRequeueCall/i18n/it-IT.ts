/* eslint-disable */
import { requeueEvents } from '../../../enums';

export default {
  [requeueEvents.START]: 'Trasferimento coda di chiamata in corso.',
  [requeueEvents.SUCCESS]: 'Trasferimento della coda di chiamata completato.',
  [requeueEvents.FAILURE]: 'Trasferimento della coda di chiamata non riuscito.',
} as const;
