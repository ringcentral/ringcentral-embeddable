/* eslint-disable */
import { requeueEvents } from '../../../enums';

export default {
  [requeueEvents.START]: 'コールキュー転送が進行中です。',
  [requeueEvents.SUCCESS]: 'コール キューの転送が完了しました。',
  [requeueEvents.FAILURE]: 'コールキューの転送に失敗しました。',
} as const;
