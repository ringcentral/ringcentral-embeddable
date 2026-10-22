import { ObjectMap } from '@ringcentral-integration/core/lib/ObjectMap';

export const voicemailDropStatus = ObjectMap.prefixKeys(
  [
    'waitingForGreetingEnd',
    'greetingDetectionFailed',
    'sending',
    'finished',
    'terminated',
    // Stopped on purpose, e.g. the agent took over the call.
    'cancelled',
  ],
  'webphone-voicemail-drop',
);

export const VOICEMAIL_DROP_STATUS_MAP = {
  [voicemailDropStatus.waitingForGreetingEnd]: 'Waiting dropping',
  [voicemailDropStatus.sending]: 'Dropping message',
  [voicemailDropStatus.finished]: 'Message dropped',
  [voicemailDropStatus.terminated]: 'Dropping terminated',
  [voicemailDropStatus.greetingDetectionFailed]: 'Dropping failed',
  [voicemailDropStatus.cancelled]: 'Dropping cancelled',
};

/** Whether a drop with this status is still waiting or playing. */
export const isVoicemailDropRunning = (status?: string | null): boolean =>
  status === voicemailDropStatus.waitingForGreetingEnd ||
  status === voicemailDropStatus.sending;
