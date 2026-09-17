/* eslint-disable */
import { dropDownOptions, loginTypes, messageTypes } from '../../../enums';

export default {
  [loginTypes.RC_PHONE]: 'RingCentral 사무실 전화',
  [loginTypes.external]: '외부 전화 사용',
  [loginTypes.integrated]: '통합 소프트폰',
  [dropDownOptions.None]: '없음',
  [messageTypes.NOT_INBOUND_QUEUE_SELECTED]: '인바운드 대기열을 하나 이상 선택하십시오.',
  [messageTypes.EMPTY_PHONE_NUMBER]: '전화번호가 필요합니다.',
  [messageTypes.INVALID_PHONE_NUMBER]: '잘못된 전화번호입니다.',
  [messageTypes.AGENT_CONFIG_ERROR]: '에이전트 구성에 실패했습니다.',
  [messageTypes.UPDATE_AGENT_ERROR]: '에이전트 설정을 업데이트하지 못했습니다.',
  [messageTypes.UPDATE_AGENT_SUCCESS]: '에이전트 설정이 성공적으로 업데이트되었습니다.',
  [messageTypes.EXISTING_LOGIN_ENGAGED]: '로그인이 현재 사용 중입니다. 나중에 다시 시도해 주세요.',
} as const;
