import Enum from 'ringcentral-integration/lib/Enum';
import moduleActionTypes from 'ringcentral-integration/enums/moduleActionTypes';

export default new Enum([
  ...Object.keys(moduleActionTypes),
  'register',
  'fetchSuccess',
  'registerActivities',
  'loadActivitiesSuccess',
  'loadActivities',
  'registerConferenceInvite',
  'registerCallLogger',
  'registerAuthorization',
  'updateAuthorizationStatus',
], 'thirdPartyService');
