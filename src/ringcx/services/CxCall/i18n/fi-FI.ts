/* eslint-disable */
import { messageTypes } from '../../../enums';
import { callErrors } from '../../../enums/callErrors';

export default {
  [messageTypes.NO_SUPPORT_COUNTRY]: 'Lähteviä puheluita maassa ei vielä tueta.',
  [messageTypes.FAILED_TO_CALL]: 'Linja on varattu tai sillä on odottava sijainti.',
  [messageTypes.INTERCEPT]: 'Manuaalisesti lähtevän puhelusi valintatulos oli INTERCEPT.',
  [messageTypes.COPY_UII_SUCCESS]: 'Puhelutunnus kopioitu',
  [callErrors.noToNumber]: 'Anna kelvollinen puhelinnumero.',
  [callErrors.emergencyNumber]: 'Hätänumeroon soittaminen ei ole käytettävissä. Soita hätäkeskukseen toisella puhelimella',
} as const;
