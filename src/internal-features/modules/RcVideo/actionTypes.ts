import { ObjectMap } from '@ringcentral-integration/core/lib/ObjectMap';
import {
  moduleActionTypes,
  ModuleActionTypes,
} from 'ringcentral-integration/enums/moduleActionTypes';

export default ObjectMap.prefixKeys(
  [
    ...ObjectMap.keys(moduleActionTypes),
    'updateMeetingSettings',
    'saveAsDefaultSetting',
    'initCreating',
    'created',
    'resetCreating', // for Office...TODO:
    'initUpdating',
    'updated',
    'resetUpdating',
    'savePersonalMeeting',
    'updateMeetingPreferences',
    'saveMeetingPreferencesState',
  ],
  'RcVideo',
);

export interface RcVideoActionTypes extends ModuleActionTypes {
  updateMeetingSettings: string;
  saveAsDefaultSetting: string;
  initSuccess: string;
  initCreating: string;
  created: string;
  resetCreating: string;
  initUpdating: string;
  updated: string;
  resetUpdating: string;
  savePersonalMeeting: string;
  updateMeetingPreferences: string;
  saveMeetingPreferencesState: string;
}
