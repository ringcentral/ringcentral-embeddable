import Enum from 'ringcentral-integration/lib/Enum';
import moduleActionTypes from 'ringcentral-integration/enums/moduleActionTypes';

export default new Enum([
  ...Object.keys(moduleActionTypes),
  'updateCurrentConversationId',
  'updateSearchInput',
  'updateTypeFilter',
  'fetchOldConverstaions',
  'fetchOldConverstaionsSuccess',
  'fetchOldConverstaionsError',
  'fetchOldMessagesSuccess',
  'fetchOldMessagesError',
  'fetchOldMessages',
  'updateMessageText',
  'removeMessageText',
  'reply',
  'replySuccess',
  'replyError',
  'deleteConversation',
], 'conversations');
