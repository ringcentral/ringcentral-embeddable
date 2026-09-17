import { ObjectMap } from '@ringcentral-integration/core/lib/ObjectMap';

export const CxSoftphoneEvents = ObjectMap.prefixKeys(
  [
    'REGISTERED',
    'NEW_CALL',
    'CALL_CONNECTED',
    'CALL_TERMINATED',
    'CALL_ANSWERED',
    'CALL_REJECTED',
    'AUDIO_STREAM_REJECTED',
    'RESET',
    'UPDATE_OFFHOOK_FLAGS',
  ],
  'softphone',
);

export type CxSoftphoneEvents = keyof typeof CxSoftphoneEvents;
