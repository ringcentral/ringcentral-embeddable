export const SHARED_SIP_CLIENT_REQUESTS = {
  start: 'webphoneV2SharedSipClientStart',
  request: 'webphoneV2SharedSipClientRequest',
  reply: 'webphoneV2SharedSipClientReply',
  register: 'webphoneV2SharedSipClientRegister',
  unregister: 'webphoneV2SharedSipClientUnregister',
  dispose: 'webphoneV2SharedSipClientDispose',
  getStatus: 'webphoneV2SharedSipClientGetStatus',
  getSharedState: 'webphoneV2SharedSipClientGetSharedState',
  setSharedState: 'webphoneV2SharedSipClientSetSharedState',
  getActiveTabId: 'webphoneV2SharedSipClientGetActiveTabId',
  setActiveTabId: 'webphoneV2SharedSipClientSetActiveTabId',
} as const;

export const SHARED_SIP_CLIENT_EVENTS = {
  inboundMessage: 'webphoneV2SharedSipClientInboundMessage',
  outboundMessage: 'webphoneV2SharedSipClientOutboundMessage',
  status: 'webphoneV2SharedSipClientStatus',
  transportStatus: 'webphoneV2SharedSipClientTransportStatus',
  sharedStateChanged: 'webphoneV2SharedSipClientSharedStateChanged',
  activeTabIdChanged: 'webphoneV2SharedSipClientActiveTabIdChanged',
} as const;
