import { ObjectMap } from '@ringcentral-integration/core/lib/ObjectMap';

export const thirdPartyMessageTypes = ObjectMap.prefixKeys(
  [
    'register',
    'matchContacts',
    'matchCallLogs',
    'logCall',
    'viewLead',
    'init',
  ],
  'rc-ev',
);

export type ThirdPartyMessageType =
  typeof thirdPartyMessageTypes[keyof typeof thirdPartyMessageTypes];
