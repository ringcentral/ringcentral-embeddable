import { ObjectMap } from '@ringcentral-integration/core/lib/ObjectMap';

export const voicemailDropStatus = ObjectMap.prefixKeys(
  [
    'waitingForGreetingEnd',
    'greetingDetectionFailed',
    'sending',
    'finished',
    'terminated',
  ],
  'webphone-voicemail-drop',
);

export default voicemailDropStatus;
