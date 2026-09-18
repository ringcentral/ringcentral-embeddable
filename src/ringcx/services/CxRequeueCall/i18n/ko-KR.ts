/* eslint-disable */
import { requeueEvents } from '../../../enums';

export default {
  [requeueEvents.START]: '통화 대기열 전송이 진행 중입니다.',
  [requeueEvents.SUCCESS]: '통화 대기열 전송이 완료되었습니다.',
  [requeueEvents.FAILURE]: '통화 대기열 전송에 실패했습니다.',
} as const;
