/* eslint-disable */
import { messageTypes } from '../../../enums';

export default {
  [messageTypes.OVER_BREAK_TIME]: '休憩時間が終わりました。',
  [messageTypes.INVALID_STATE_CHANGE]: '状態の変更を処理できません。 OFFLINE、ENGAGED、または TRANSITION からの手動移行は許可されません。',
  [messageTypes.PENDING_DISPOSITION]: '処理の保留中は状態を変更できません。',
} as const;
