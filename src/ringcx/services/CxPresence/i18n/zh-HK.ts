/* eslint-disable */
import { messageTypes } from '../../../enums';

export default {
  [messageTypes.OFFHOOK_INIT_ERROR]: '內部錯誤：摘機初始化失敗。',
  [messageTypes.OFFHOOK_TERM_ERROR]: '內部錯誤：摘機術語失敗。',
  [messageTypes.ADD_SESSION_ERROR]: '內部錯誤：新增會話失敗。',
  [messageTypes.DROP_SESSION_ERROR]: '內部錯誤：刪除會話失敗。',
  [messageTypes.HOLD_ERROR]: '內部錯誤：保持/取消保持呼叫失敗。',
} as const;
