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

/**
 * Values are prefixed (`webphone-session-connecting`) in this app, unlike the
 * plain union upstream uses for its V1/V2 facade. Consumers, views and the
 * legacy widgets already match on the prefixed form, so the prefix stays and
 * the ported runtime is typed from it.
 */
export type SessionStatus =
  (typeof sessionStatus)[keyof typeof sessionStatus];
