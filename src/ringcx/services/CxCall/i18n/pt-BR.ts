/* eslint-disable */
import { messageTypes } from '../../../enums';
import { callErrors } from '../../../enums/callErrors';

export default {
  [messageTypes.NO_SUPPORT_COUNTRY]: 'As chamadas de saída para o país ainda não são suportadas.',
  [messageTypes.FAILED_TO_CALL]: 'A linha está ocupada ou com disposição pendente.',
  [messageTypes.INTERCEPT]: 'O resultado da discagem da sua chamada de saída manual foi INTERCEPT.',
  [messageTypes.COPY_UII_SUCCESS]: 'ID de chamada copiado',
  [callErrors.noToNumber]: 'Insira um número de telefone válido.',
  [callErrors.emergencyNumber]: 'Chamadas de emergência não estão disponíveis.',
} as const;
