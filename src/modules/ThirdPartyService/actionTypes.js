import {
  moduleActionTypes,
} from '@ringcentral-integration/commons/enums/moduleActionTypes';
import { ObjectMap } from '@ringcentral-integration/core/lib/ObjectMap';

const actionTypes = ObjectMap.prefixKeys([
  ...ObjectMap.keys(moduleActionTypes),
  'register',
  'syncContacts',
  'syncContactsError',
  'fetchContactsSuccess',
  'syncContactsSuccess',
  'registerActivities',
  'loadActivitiesSuccess',
  'loadActivities',
  'registerConferenceInvite',
  'registerMeetingInvite',
  'registerCallLogger',
  'registerMessageLogger',
  'registerAuthorization',
  'updateAuthorizationStatus',
  'registerFeedback',
  'registerSettings',
  'updateSetting',
  'registerMeetingLogger',
  'registerAdditionalButtons',
], 'thirdPartyService');

export default actionTypes;
