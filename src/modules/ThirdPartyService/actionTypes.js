import Enum from 'ringcentral-integration/lib/Enum';
import moduleActionTypes from 'ringcentral-integration/enums/moduleActionTypes';

export default new Enum([
  ...Object.keys(moduleActionTypes),
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
  'registerAuthorization',
  'updateAuthorizationStatus',
], 'thirdPartyService');
