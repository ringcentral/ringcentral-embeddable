export const CxCallbackTypes = {
  ACK: 'acknowledgeResponse',
  ADD_SESSION: 'addSessionNotification',
  AGENT_DEBUG_EMAIL_NOTIF: 'agentDebugEmailNotification',
  AGENT_STATE: 'agentStateResponse',
  AUTHENTICATE: 'authenticateResponse',
  BARGE_IN: 'bargeInResponse',
  CALLBACK_CANCEL: 'callbackCancelResponse',
  CALLBACK_PENDING: 'callbacksPendingResponse',
  CALL_NOTES: 'callNotesResponse',
  CAMPAIGN_DISPOSITIONS: 'campaignDispositionsResponse',
  CHAT: 'chatResponse', // internal chat
  CHAT_ACTIVE: 'chatActiveNotification', // external chat
  CHAT_ADD_SESSION: 'addChatSessionNotification', // external chat
  CHAT_CANCELLED: 'chatCancelledNotification', // external chat
  CHAT_CLIENT_RECONNECT: 'chatClientReconnectNotification',
  CHAT_INACTIVE: 'chatInactiveNotification', // external chat
  CHAT_LIST: 'chatListResponse', // external chat
  CHAT_MESSAGE: 'chatMessageNotification', // external chat
  CHAT_NEW: 'chatNewNotification', // external chat
  CHAT_PRESENTED: 'chatPresentedNotification', // external chat
  CHAT_ROOM_STATE: 'chatRoomStateResponse',
  CHAT_STATE: 'chatStateResponse', // external chat
  CHAT_STOP_MONITOR: 'stopAgentChatMonitorNotification', // external chat
  CHAT_TYPING: 'chatTypingNotification', // external chat
  CLOSE_SOCKET: 'closeResponse',
  COACH_CALL: 'coachResponse',
  CONFIG: 'configureResponse',
  DIAL_GROUP_CHANGE: 'dialGroupChangeNotification',
  DIAL_GROUP_CHANGE_PENDING: 'dialGroupChangePendingNotification',
  DIRECT_AGENT_TRANSFER: 'directAgentTransferResponse',
  DIRECT_AGENT_TRANSFER_LIST: 'directAgentTransferListResponse',
  DIRECT_AGENT_TRANSFER_NOTIF: 'directAgentTransferNotification',
  DROP_SESSION: 'dropSessionNotification',
  EARLY_UII: 'earlyUiiNotification',
  END_CALL: 'endCallNotification',
  GATES_CHANGE: 'gatesChangeNotification',
  GENERIC_NOTIFICATION: 'genericNotification',
  GENERIC_RESPONSE: 'genericResponse',
  HOLD: 'holdResponse',
  LEAD_HISTORY: 'leadHistoryResponse',
  LEAD_INSERT: 'leadInsertResponse',
  LEAD_SEARCH: 'leadSearchResponse',
  LEAD_UPDATE: 'leadUpdateResponse',
  LOGIN: 'loginResponse',
  LOGIN_PHASE_1: 'loginPhase1Response',
  LOGIN_MULTISOCKET: 'multiSocketResponse',
  LOGOUT: 'logoutResponse',
  LOG_CONSOLE_RESULTS: 'logConsoleResultsResponse',
  LOG_RESULTS: 'logResultsResponse',
  NEW_CALL: 'newCallNotification',
  OFFHOOK_INIT: 'offhookInitResponse',
  OFFHOOK_TERM: 'offhookTermNotification',
  OPEN_SOCKET: 'openResponse',
  PAUSE_RECORD: 'pauseRecordResponse',
  PENDING_CHAT_DISP: 'pendingChatDispNotification',
  PENDING_DISP: 'pendingDispNotification',
  PREVIEW_FETCH: 'previewFetchResponse',
  PREVIEW_LEAD_STATE: 'previewLeadStateNotification',
  RECORD: 'recordResponse',
  REQUEUE: 'requeueResponse',
  REVERSE_MATCH: 'reverseMatchNotification',
  SAFE_MODE_FETCH: 'safeModeFetchResponse',
  SAFE_MODE_SEARCH: 'safeModeSearchResponse',
  SCRIPT_CONFIG: 'scriptConfigResponse',
  SILENT_MONITOR: 'monitorResponse',
  STATS_AGENT: 'agentStats',
  STATS_AGENT_DAILY: 'agentDailyStats',
  STATS_CAMPAIGN: 'campaignStats',
  STATS_CHAT_QUEUE: 'chatQueueStats',
  STATS_QUEUE: 'queueStats',
  SUMMARY: 'dispositionSummary',
  SUMMARY_ERROR: 'dispositionSummaryError',
  SUPERVISOR_LIST: 'supervisorListResponse',
  TCPA_SAFE_LEAD_STATE: 'tcpaSafeLeadStateNotification',
  WEBRTC_INFO: 'webRtcInfoResponse',
  XFER_COLD: 'coldXferResponse',
  XFER_WARM: 'warmXferResponse',
  SEARCH_DIR: 'searchDirectoryResponse',
  EXTENSION_PRESENCE: 'extensionPresenceInfo',

  // SOFTPHONE Callbacks
  SIP_CONNECTED: 'sipConnectedNotification',
  SIP_DIAL_DEST_CHANGED: 'sipDialDestChangedNotification',
  SIP_ENDED: 'sipEndedNotification',
  SIP_MUTE: 'sipMuteResponse',
  SIP_REGISTERED: 'sipRegisteredNotification',
  SIP_REGISTRATION_FAILED: 'sipRegistrationFailedNotification',
  SIP_RINGING: 'sipRingingNotification',
  SIP_SWITCH_REGISTRAR: 'sipSwitchRegistrarNotification',
  SIP_UNMUTE: 'sipUnmuteResponse',
  SIP_UNREGISTERED: 'sipUnregisteredNotification',
  SIP_UNSTABLE_CONNECTION: 'sipUnstableConnectionNotification',
  // Synthetic, fired by CxClient rather than the SDK: a superseded SIP.js
  // user agent's WebSocket closed cleanly, which can mean its queued wildcard
  // un-REGISTER reached the server and wiped the live registration.
  SIP_SUSPECT_REGISTRATION: 'sipSuspectRegistrationNotification',
} as const;
