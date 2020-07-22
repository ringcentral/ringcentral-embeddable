import { ObjectMap } from '@ringcentral-integration/core/lib/ObjectMap';

export default ObjectMap.prefixKeys(
  [
    'saveMeetings',
    'cleanMeetings',
    'saveUpcomingMeetings',
    'cleanUpcomingMeetings',
  ],
  'RcVideo',
);
