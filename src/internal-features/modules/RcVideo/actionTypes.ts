import { ObjectMap } from '@ringcentral-integration/core/lib/ObjectMap';
import { moduleActionTypes } from 'ringcentral-integration/enums/moduleActionTypes';

const actionTypes = ObjectMap.prefixKeys(
  [
    ...ObjectMap.keys(moduleActionTypes),
    'updateMeetingSettings',
    'saveAsDefaultSetting',
    'saveLastVideoSetting',
    'initCreating',
    'created',
    'resetCreating', // for Office...TODO:
    'initUpdating',
    'updated',
    'resetUpdating',
    'saveMeetings',
    'cleanMeetings',
    'savePersonalMeeting',
    'saveUpcomingMeetings',
    'cleanUpcomingMeetings',
  ],
  'RcVideo',
  moduleActionTypes,
);

export default actionTypes;

export interface RcVideoActionTypes {
  updateMeetingSettings: string;
  saveAsDefaultSetting: string;
  saveLastVideoSetting: string;
  initSuccess: string;
  init: string;
  initCreating: string;
  created: string;
  resetCreating: string;
  initUpdating: string;
  updated: string;
  resetUpdating: string;
  saveMeetings: string;
  cleanMeetings: string;
  savePersonalMeeting: string;
  saveUpcomingMeetings: string;
  cleanUpcomingMeetings: string;
}
