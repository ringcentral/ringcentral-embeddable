import { ObjectMap } from '@ringcentral-integration/core/lib/ObjectMap';

const messageTypes = ObjectMap.prefixKeys(
  [
    'syncClosed',
    'syncMinimized',
    'syncSize',
    'syncPosition',
    'pushPresence',
    'pushAdapterState',
    'pushLocale',
    'presenceClicked',
    'presenceItemClicked',
    'clickToDial',
    'clickToSms',
    'pushRingState',
    'pushCalls',
    'pushOnCurrentCallPath',
    'pushOnAllCallsPath',
    'navigateToCurrentCall',
    'navigateToViewCalls',
    'popOut',
    'syncPresence',
  ],
  'rc-adapter',
);

export default messageTypes;
