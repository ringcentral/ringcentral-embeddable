/* eslint-disable */
import { dropDownOptions, loginTypes, messageTypes } from '../../../enums';

export default {
  [loginTypes.RC_PHONE]: 'RingCentral Office の電話',
  [loginTypes.external]: '外付け電話を使用する',
  [loginTypes.integrated]: '統合ソフトフォン',
  [dropDownOptions.None]: 'なし',
  [messageTypes.NOT_INBOUND_QUEUE_SELECTED]: '少なくとも 1 つの受信キューを選択してください。',
  [messageTypes.NOT_INBOUND_QUEUE_OR_DIAL_GROUP_SELECTED]: '少なくとも 1 つの受信キューまたはダイヤルグループを選択してください。',
  [messageTypes.EMPTY_PHONE_NUMBER]: '電話番号は必須です。',
  [messageTypes.INVALID_PHONE_NUMBER]: '電話番号が無効です。',
  [messageTypes.AGENT_CONFIG_ERROR]: 'エージェントの構成に失敗しました。',
  [messageTypes.UPDATE_AGENT_ERROR]: 'エージェント設定を更新できませんでした。',
  [messageTypes.UPDATE_AGENT_SUCCESS]: 'エージェント設定が正常に更新されました。',
  [messageTypes.EXISTING_LOGIN_ENGAGED]: 'ログインは現在使用中です。後でもう一度試してください。',
} as const;
