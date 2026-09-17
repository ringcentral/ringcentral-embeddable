/* eslint-disable */
import { messageTypes } from '../../../enums';

export default {
  [messageTypes.OFFHOOK_INIT_ERROR]: '内部エラー: オフフック初期化に失敗しました。',
  [messageTypes.OFFHOOK_TERM_ERROR]: '内部エラー: オフフック条件が失敗しました。',
  [messageTypes.ADD_SESSION_ERROR]: '内部エラー: セッションの追加に失敗しました。',
  [messageTypes.DROP_SESSION_ERROR]: '内部エラー: セッションの削除に失敗しました。',
  [messageTypes.HOLD_ERROR]: '内部エラー: 通話の保留/保留解除が失敗しました。',
} as const;
