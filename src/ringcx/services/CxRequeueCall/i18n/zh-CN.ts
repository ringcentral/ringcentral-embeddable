/* eslint-disable */
import { requeueEvents } from '../../../enums';

export default {
  [requeueEvents.START]: '呼叫队列传输正在进行中。',
  [requeueEvents.SUCCESS]: '呼叫队列传输已完成。',
  [requeueEvents.FAILURE]: '呼叫队列传输失败。',
} as const;
