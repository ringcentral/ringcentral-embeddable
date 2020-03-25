import { createEnum } from 'ringcentral-integration/lib/Enum';

export default createEnum(
  [
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
