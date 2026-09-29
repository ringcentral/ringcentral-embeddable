/* eslint-disable */
import { messageTypes } from '../../../enums';
import { callErrors } from '../../../enums/callErrors';

export default {
  [messageTypes.NO_SUPPORT_COUNTRY]: '尚不支援該國的出站呼叫。',
  [messageTypes.FAILED_TO_CALL]: '線路正忙或有待處理的處理。',
  [messageTypes.INTERCEPT]: '您的手動出站呼叫的撥號結果為 INTERCEPT。',
  [messageTypes.COPY_UII_SUCCESS]: '呼叫 ID 已複製',
  [callErrors.noToNumber]: '請輸入有效的電話號碼。',
  [callErrors.emergencyNumber]: '緊急通話無法使用。請使用其他電話連絡緊急服務',
} as const;
