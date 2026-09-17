/* eslint-disable */
import { messageTypes } from '../../../enums';

export default {
  [messageTypes.OVER_BREAK_TIME]: '휴식 시간이 끝났습니다.',
  [messageTypes.INVALID_STATE_CHANGE]: '상태 변경을 처리할 수 없습니다. OFFLINE, ENGAGED 또는 TRANSITION에서 수동 전환은 허용되지 않습니다.',
  [messageTypes.PENDING_DISPOSITION]: '처리가 보류 중인 동안에는 상태를 변경할 수 없습니다.',
} as const;
