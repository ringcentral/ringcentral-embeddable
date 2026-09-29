/* eslint-disable */
import { messageTypes } from '../../../enums';

export default {
  [messageTypes.OFFHOOK_INIT_ERROR]: '내부 오류: 오프훅 초기화에 실패했습니다.',
  [messageTypes.OFFHOOK_TERM_ERROR]: '내부 오류: 오프훅 기간이 실패했습니다.',
  [messageTypes.ADD_SESSION_ERROR]: '내부 오류: 세션 추가에 실패했습니다.',
  [messageTypes.DROP_SESSION_ERROR]: '내부 오류: 세션 삭제에 실패했습니다.',
  [messageTypes.HOLD_ERROR]: '내부 오류: 통화 보류/보류 해제에 실패했습니다.',
} as const;
