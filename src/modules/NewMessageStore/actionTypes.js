import Enum from 'ringcentral-integration/lib/Enum';
import moduleActionTypes from 'ringcentral-integration/enums/moduleActionTypes';

export default new Enum([
  ...Object.keys(moduleActionTypes),
  'conversationsSync',
  'conversationsFSyncSuccess',
  'conversationsISyncSuccess',
  'conversationsFSyncPageSuccess',
  'conversationsSyncError',
  'conversationSync',
  'conversationSyncPageSuccess',
  'conversationSyncError'
], 'newMessageStore');
