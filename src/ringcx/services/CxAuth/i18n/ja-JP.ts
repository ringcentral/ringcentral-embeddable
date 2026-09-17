/* eslint-disable */
import { messageTypes } from '../../../enums';

export default {
  default: 'デフォルト',
  us: '北米国内',
  [messageTypes.NO_AGENT]: 'この RC アカウントには EV エージェント アカウントが割り当てられていません。管理者に連絡してください。',
  [messageTypes.CONNECT_ERROR]: '認証エラー。後で再試行してください。',
  [messageTypes.UNEXPECTED_AGENT]: 'この RC アカウントには、予期しない EV エージェント アカウントが割り当てられています。管理者に連絡してください。',
  [messageTypes.INVALID_BROWSER]: 'WebSocket はお使いのブラウザではサポートされていません。',
  [messageTypes.CONNECT_TIMEOUT]: '認証タイムアウト。後で再試行してください。',
  [messageTypes.OPEN_SOCKET_ERROR]: 'ソケット接続エラー。後で再試行してください。',
  [messageTypes.FORCE_LOGOUT]: 'ログオン セッションが終了しました。',
  [messageTypes.LOGOUT_FAIL_WITH_CALL_CONNECTED]: '通話が接続されている間はログアウトできません。',
} as const;
