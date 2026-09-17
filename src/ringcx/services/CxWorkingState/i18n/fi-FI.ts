/* eslint-disable */
import { messageTypes } from '../../../enums';

export default {
  [messageTypes.OVER_BREAK_TIME]: 'Taukoaikasi on ohi.',
  [messageTypes.INVALID_STATE_CHANGE]: 'Tilamuutosta ei voida käsitellä. Manuaalinen siirtyminen OFFLINE-, KILPAILU- tai SIIRTYMÄ-tilasta ei ole sallittu.',
  [messageTypes.PENDING_DISPOSITION]: 'Tilaa ei voi muuttaa, kun käsittely on kesken.',
} as const;
