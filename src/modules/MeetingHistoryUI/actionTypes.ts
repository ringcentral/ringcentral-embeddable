import { ObjectMap } from '@ringcentral-integration/core/lib/ObjectMap';
import { moduleActionTypes } from '@ringcentral-integration/commons/enums/moduleActionTypes';

const actionTypes = ObjectMap.prefixKeys(
  [
    ...ObjectMap.keys(moduleActionTypes),
    'fetchMeetings',
    'fetchMeetingsSuccess',
    'fetchMeetingsError',
    'cleanMeetingPageToken',
    'updateSearchText',
    'cleanSearchText',
    'updateType',
    'cleanType',
  ],
  'MeetingHistoryUI',
);

export interface MeetingHistoryUIActionTypes {
  fetchMeetings: string;
  fetchMeetingsSuccess: string;
  fetchMeetingsError: string;
  cleanMeetingPageToken: string;
  updateSearchText: string;
  cleanSearchText: string;
  updateType: string;
  cleanType: string;
}

export default actionTypes;
