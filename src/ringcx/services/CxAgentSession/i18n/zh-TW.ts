/* eslint-disable */
import { dropDownOptions, loginTypes, messageTypes } from '../../../enums';

export default {
  [loginTypes.RC_PHONE]: 'RingCentral 辦公室電話',
  [loginTypes.external]: '使用外部電話',
  [loginTypes.integrated]: '整合軟體電話',
  [dropDownOptions.None]: '無',
  [messageTypes.NOT_INBOUND_QUEUE_SELECTED]: '請至少選擇一個入站佇列。',
  [messageTypes.NOT_INBOUND_QUEUE_OR_DIAL_GROUP_SELECTED]: '請至少選擇一個入站佇列或一個撥號組。',
  [messageTypes.EMPTY_PHONE_NUMBER]: '需提供電話號碼。',
  [messageTypes.INVALID_PHONE_NUMBER]: '無效的電話號碼。',
  [messageTypes.AGENT_CONFIG_ERROR]: '代理配置失敗。',
  [messageTypes.UPDATE_AGENT_ERROR]: '無法更新代理程式設定。',
  [messageTypes.UPDATE_AGENT_SUCCESS]: '代理設定已成功更新。',
  [messageTypes.EXISTING_LOGIN_ENGAGED]: '登入名目前正在使用中。請稍後重試。',
} as const;
