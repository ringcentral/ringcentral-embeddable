/* eslint-disable */
import { messageTypes } from '../../../enums';
import { callErrors } from '../../../enums/callErrors';

export default {
  [messageTypes.NO_SUPPORT_COUNTRY]: '尚不支持该国家/地区的出站呼叫。',
  [messageTypes.FAILED_TO_CALL]: '线路正忙或有待处理的处理。',
  [messageTypes.INTERCEPT]: '您的手动出站呼叫的拨号结果为 INTERCEPT。',
  [messageTypes.COPY_UII_SUCCESS]: '呼叫 ID 已复制',
  [callErrors.noToNumber]: '请输入有效的电话号码。',
  [callErrors.emergencyNumber]: '紧急呼叫功能不可用。',
} as const;
