import { ObjectMap } from '@ringcentral-integration/core/lib/ObjectMap';

/**
 * Adapter message types used for parent-iframe communication.
 * Must be an ObjectMap instance so AdapterCore can call ObjectMap.prefixValues().
 */
export const adapterMessageTypes = ObjectMap.prefixKeys(
  [
    'init',
    'register',
    'syncClosed',
    'syncMinimized',
    'syncSize',
    'syncPosition',
    'syncPresence',
    'pushPresence',
    'clickToDial',
    'setEnvironment',
    'logout',
    'dialLead',
    'newCall',
    'ringCall',
    'endCall',
    'sipRingCall',
    'sipEndCall',
    'sipRegistered',
    'sipUnregistered',
    'sipUnstable',
    'sipFailed',
    'callLead',
    'loadLeads',
    'viewLead',
    'manualPassLead',
    'pushAdapterState',
    'checkPopupWindow',
    'popUpWindow',
    'loginPopup',
    'searchAndScreenPop',
    'pushLocale',
    'sideWidgetOpenNotify',
    'setSideWidgetExtended',
  ],
  'rc-ev',
);

export type AdapterMessageType =
  typeof adapterMessageTypes[keyof typeof adapterMessageTypes];
