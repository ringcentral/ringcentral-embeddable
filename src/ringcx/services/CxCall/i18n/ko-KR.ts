/* eslint-disable */
import { messageTypes } from '../../../enums';
import { callErrors } from '../../../enums/callErrors';

export default {
  [messageTypes.NO_SUPPORT_COUNTRY]: '해당 국가의 발신 전화는 아직 지원되지 않습니다.',
  [messageTypes.FAILED_TO_CALL]: '회선이 통화 중이거나 보류 중인 처리가 있습니다.',
  [messageTypes.INTERCEPT]: '수동 아웃바운드 통화에 대한 다이얼 결과는 INTERCEPT입니다.',
  [messageTypes.COPY_UII_SUCCESS]: '통화 ID 복사됨',
  [callErrors.noToNumber]: '올바른 전화번호를 입력하세요.',
  [callErrors.emergencyNumber]: '긴급 전화를 사용할 수 없습니다. 응급 서비스에 연락하려면 다른 전화를 사용하세요',
} as const;
