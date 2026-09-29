/* eslint-disable */
import { messageTypes } from '../../../enums';

export default {
  default: '默认',
  us: '北美国内',
  [messageTypes.NO_AGENT]: '此 RC 帐户尚未分配任何 EV 代理帐户。请联系您的管理员。',
  [messageTypes.CONNECT_ERROR]: '身份验证错误。请稍后重试。',
  [messageTypes.UNEXPECTED_AGENT]: '此 RC 帐户已被分配了意外的 EV 代理帐户。请联系您的管理员。',
  [messageTypes.INVALID_BROWSER]: '您的浏览器不支持 WebSocket。',
  [messageTypes.CONNECT_TIMEOUT]: '授权超时。请稍后重试。',
  [messageTypes.OPEN_SOCKET_ERROR]: '套接字连接错误。请稍后重试。',
  [messageTypes.FORCE_LOGOUT]: '您的登录会话已终止。',
  [messageTypes.LOGOUT_FAIL_WITH_CALL_CONNECTED]: '通话连接时无法注销。',
} as const;
