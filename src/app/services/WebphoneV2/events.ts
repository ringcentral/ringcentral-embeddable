import {
  ObjectMap,
  ObjectMapKey,
} from '@ringcentral-integration/core/lib/ObjectMap';

export const EVENTS = ObjectMap.fromKeys([
  'callRing',
  'callStart',
  'callEnd',
  'callHold',
  'callResume',
  'beforeCallResume',
  'beforeCallEnd',
  'callInit',
  'webphoneRegistered',
  'webphoneUnregistered',
  'activeWebphoneChanged',
  'callVoicemailDropped',
]);

/** Event *names* emitted by the webphone; the payload type lives in WebphoneApi.interface. */
export type WebphoneCallEventName = ObjectMapKey<typeof EVENTS>;
