/* eslint-disable */
import { messageTypes } from '../../../enums';

export default {
  [messageTypes.OFFHOOK_INIT_ERROR]: '内部错误：摘机初始化失败。',
  [messageTypes.OFFHOOK_TERM_ERROR]: '内部错误：摘机术语失败。',
  [messageTypes.ADD_SESSION_ERROR]: '内部错误：添加会话失败。',
  [messageTypes.DROP_SESSION_ERROR]: '内部错误：删除会话失败。',
  [messageTypes.HOLD_ERROR]: '内部错误：保持/取消保持呼叫失败。',
} as const;
