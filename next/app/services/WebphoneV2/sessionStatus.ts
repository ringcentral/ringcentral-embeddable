import { ObjectMap } from '@ringcentral-integration/core/lib/ObjectMap';

export const sessionStatus = ObjectMap.prefixKeys(
  [
    'setup',
    'connecting',
    'connected',
    'onHold',
    'onMute',
    'replaced',
    'finished',
  ],
  'webphone-session',
);

export default sessionStatus;
