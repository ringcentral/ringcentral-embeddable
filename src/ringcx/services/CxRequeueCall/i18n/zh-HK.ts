/* eslint-disable */
import { requeueEvents } from '../../../enums';

export default {
  [requeueEvents.START]: '呼叫佇列傳輸正在進行中。',
  [requeueEvents.SUCCESS]: '呼叫佇列傳輸已完成。',
  [requeueEvents.FAILURE]: '呼叫佇列傳輸失敗。',
} as const;
