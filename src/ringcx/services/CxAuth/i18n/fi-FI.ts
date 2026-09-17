/* eslint-disable */
import { messageTypes } from '../../../enums';

export default {
  default: 'Oletus',
  us: 'Pohjois-Amerikka Kotimainen',
  [messageTypes.NO_AGENT]: 'Tälle RC-tilille ei ole määritetty EV-agenttitiliä. Ota yhteyttä järjestelmänvalvojaasi.',
  [messageTypes.CONNECT_ERROR]: 'Todennusvirhe. Yritä myöhemmin uudelleen.',
  [messageTypes.UNEXPECTED_AGENT]: 'Tälle RC-tilille on määritetty odottamaton EV-agenttitili. Ota yhteyttä järjestelmänvalvojaasi.',
  [messageTypes.INVALID_BROWSER]: 'Selaimesi ei tue WebSocketia.',
  [messageTypes.CONNECT_TIMEOUT]: 'Valtuutuksen aikakatkaisu. Yritä myöhemmin uudelleen.',
  [messageTypes.OPEN_SOCKET_ERROR]: 'Socket-yhteysvirhe. Yritä myöhemmin uudelleen.',
  [messageTypes.FORCE_LOGOUT]: 'Kirjautumisistuntosi on lopetettu.',
  [messageTypes.LOGOUT_FAIL_WITH_CALL_CONNECTED]: 'Ei voi kirjautua ulos, kun puhelu on yhdistetty.',
} as const;
