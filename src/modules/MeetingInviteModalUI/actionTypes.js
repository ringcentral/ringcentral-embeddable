import { ObjectMap } from '@ringcentral-integration/core/lib/ObjectMap';
import { moduleActionTypes } from 'ringcentral-integration/enums/moduleActionTypes';

export const actionTypes = ObjectMap.prefixKeys(
  [...ObjectMap.keys(moduleActionTypes), 'newMeeting', 'close'],
  'meetingInviteModalUI',
);
export default actionTypes;
