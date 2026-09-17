/* eslint-disable */
import { messageTypes } from '../../../enums';
import { callErrors } from '../../../enums/callErrors';

export default {
  [messageTypes.NO_SUPPORT_COUNTRY]: 'その国への発信通話はまだサポートされていません。',
  [messageTypes.FAILED_TO_CALL]: '回線が話し中であるか、保留中の処理があります。',
  [messageTypes.INTERCEPT]: '手動発信通話のダイヤル結果は INTERCEPT でした。',
  [messageTypes.COPY_UII_SUCCESS]: 'コール ID がコピーされました',
  [callErrors.noToNumber]: '有効な電話番号を入力してください。',
  [callErrors.emergencyNumber]: '緊急通話は利用できません。別の電話を使用して緊急サービスに連絡してください',
} as const;
