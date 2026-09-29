/* eslint-disable */
import { messageTypes } from '../../../enums';

export default {
  [messageTypes.OVER_BREAK_TIME]: '您的休息時間結束了。',
  [messageTypes.INVALID_STATE_CHANGE]: '無法處理狀態變更。不允許從 OFFLINE、ENGAGED 或 TRANSITION 手動轉換。',
  [messageTypes.PENDING_DISPOSITION]: '處置待處理時無法變更狀態。',
} as const;
