/* eslint-disable */
import { messageTypes } from '../../../enums';

export default {
  [messageTypes.OVER_BREAK_TIME]: '您的休息时间结束了。',
  [messageTypes.INVALID_STATE_CHANGE]: '无法处理状态更改。不允许从 OFFLINE、ENGAGED 或 TRANSITION 手动转换。',
  [messageTypes.PENDING_DISPOSITION]: '处置待处理时无法更改状态。',
} as const;
