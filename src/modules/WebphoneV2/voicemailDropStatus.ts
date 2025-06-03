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

export const VOICEMAIL_DROP_STATUS_MAP = {
  [voicemailDropStatus.waitingForGreetingEnd]: 'Waiting dropping',
  [voicemailDropStatus.sending]: 'Dropping message',
  [voicemailDropStatus.finished]: 'Message dropped',
  [voicemailDropStatus.terminated]: 'Dropping terminated',
  [voicemailDropStatus.greetingDetectionFailed]: 'Dropping failed',
};

export default voicemailDropStatus;
