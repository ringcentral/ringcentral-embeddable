/* eslint-disable */
import { messageTypes } from '../../../enums';

export default {
  default: '預設值',
  us: '北美國內',
  [messageTypes.NO_AGENT]: '此 RC 帳戶尚未指派任何 EV 代理帳戶。請聯絡您的管理員。',
  [messageTypes.CONNECT_ERROR]: '身份驗證錯誤。請稍後重試。',
  [messageTypes.UNEXPECTED_AGENT]: '此 RC 帳戶已被指派了意外的 EV 代理帳戶。請聯絡您的管理員。',
  [messageTypes.INVALID_BROWSER]: '您的瀏覽器不支援 WebSocket。',
  [messageTypes.CONNECT_TIMEOUT]: '授權逾時。請稍後重試。',
  [messageTypes.OPEN_SOCKET_ERROR]: '套接字連線錯誤。請稍後重試。',
  [messageTypes.FORCE_LOGOUT]: '您的登入工作階段已終止。',
  [messageTypes.LOGOUT_FAIL_WITH_CALL_CONNECTED]: '通話連線時無法登出。',
} as const;
