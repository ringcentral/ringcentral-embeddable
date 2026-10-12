/* eslint-disable */
import { dropDownOptions, loginTypes, messageTypes } from '../../../enums';

export default {
  [loginTypes.RC_PHONE]: 'RingCentral 办公室电话',
  [loginTypes.external]: '使用外部电话',
  [loginTypes.integrated]: '集成软件电话',
  [dropDownOptions.None]: '无',
  [messageTypes.NOT_INBOUND_QUEUE_SELECTED]: '请至少选择一个入站队列。',
  [messageTypes.NOT_INBOUND_QUEUE_OR_DIAL_GROUP_SELECTED]: '请至少选择一个入站队列或一个拨号群组。',
  [messageTypes.EMPTY_PHONE_NUMBER]: '需要提供电话号码。',
  [messageTypes.INVALID_PHONE_NUMBER]: '电话号码无效。',
  [messageTypes.AGENT_CONFIG_ERROR]: '代理配置失败。',
  [messageTypes.UPDATE_AGENT_ERROR]: '无法更新代理设置。',
  [messageTypes.UPDATE_AGENT_SUCCESS]: '代理设置已成功更新。',
  [messageTypes.EXISTING_LOGIN_ENGAGED]: '登录名当前正在使用中。请稍后重试。',
  dialGroupUpdated: '您的拨号群组已更新为：{dialGroupName}',
} as const;
