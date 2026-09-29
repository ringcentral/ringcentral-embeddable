/* eslint-disable */
import { messageTypes } from '../../../enums';

export default {
  default: '기본값',
  us: '북미 국내',
  [messageTypes.NO_AGENT]: '이 RC 계정에는 EV 에이전트 계정이 할당되지 않았습니다. 관리자에게 문의하세요.',
  [messageTypes.CONNECT_ERROR]: '인증 오류입니다. 나중에 다시 시도해 주세요.',
  [messageTypes.UNEXPECTED_AGENT]: '이 RC 계정에 예상치 못한 EV 에이전트 계정이 할당되었습니다. 관리자에게 문의하세요.',
  [messageTypes.INVALID_BROWSER]: '귀하의 브라우저는 WebSocket을 지원하지 않습니다.',
  [messageTypes.CONNECT_TIMEOUT]: '승인 시간이 초과되었습니다. 나중에 다시 시도해 주세요.',
  [messageTypes.OPEN_SOCKET_ERROR]: '소켓 연결 오류입니다. 나중에 다시 시도해 주세요.',
  [messageTypes.FORCE_LOGOUT]: '로그온 세션이 종료되었습니다.',
  [messageTypes.LOGOUT_FAIL_WITH_CALL_CONNECTED]: '통화가 연결된 상태에서는 로그아웃할 수 없습니다.',
} as const;
