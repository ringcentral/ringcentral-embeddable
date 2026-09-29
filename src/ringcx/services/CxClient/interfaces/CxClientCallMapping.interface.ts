import type {
  CxACKResponse,
  CxAddSessionNotification,
  CxAgentConfig,
  CxAgentStateResponse,
  CxBaseCall,
  CxDispositionSummaryErrorResponse,
  CxDispositionSummaryPhaseResponse,
  CxDirectAgentTransferResponse,
  CxDropSessionNotification,
  CxEndedCall,
  CxHoldResponse,
  CxLoginResponse,
  CxOffhookInitResponse,
  CxOpenSocketResult,
  CxReceivedTransferCall,
} from './CxSdkResponse.interface';

export type CxSipRingingData = {
  message: string;
  // This type from sip.js => IncomingRequest
  data: string;
};

/**
 * Reports which repair the SDK chose when asked to rotate the SIP registrar:
 * `RESET` rebuilds the session, `UPDATE` only refreshes the offhook flags.
 */
export type CxSipSwitchRegistrarData = {
  message: string;
  status: 'RESET' | 'UPDATE';
};

/**
 * A superseded SIP.js user agent's WebSocket closed. `code` 1000 means the
 * close handshake completed, so anything the SDK had queued on that socket,
 * including a wildcard un-REGISTER, was delivered after the replacement
 * registration and may have wiped it.
 */
export type CxSipSuspectRegistrationData = {
  closedUaId: string | null;
  latestUaId: string | null;
  code: number;
  reason: string;
};

/**
 * Fired once the softphone has re-registered, carrying the offhook flags the
 * SDK was holding when the registration dropped.
 */
export type CxSipDialDestChangedData = {
  message: string;
  dialDest: string;
  maintainOH: boolean;
  autoStartOH: boolean;
};

export interface CxClientCallMapping {
  acknowledgeResponse: CxACKResponse;
  addSessionNotification: CxAddSessionNotification;
  agentDebugEmailNotification: any;
  agentStateResponse: CxAgentStateResponse;
  authenticateResponse: any;
  bargeInResponse: any;
  callbackCancelResponse: any;
  callbacksPendingResponse: any;
  callNotesResponse: any;
  campaignDispositionsResponse: any;
  chatResponse: any;
  chatActiveNotification: any;
  addChatSessionNotification: any;
  chatCancelledNotification: any;
  chatClientReconnectNotification: any;
  chatInactiveNotification: any;
  chatListResponse: any;
  chatMessageNotification: any;
  chatNewNotification: any;
  chatPresentedNotification: any;
  chatRoomStateResponse: any;
  chatStateResponse: any;
  stopAgentChatMonitorNotification: any;
  chatTypingNotification: any;
  closeResponse: any;
  coachResponse: any;
  configureResponse: any;
  dialGroupChangeNotification: any;
  dialGroupChangePendingNotification: any;
  directAgentTransferResponse: CxDirectAgentTransferResponse;
  directAgentTransferListResponse: any;
  directAgentTransferNotification: CxReceivedTransferCall;
  dropSessionNotification: CxDropSessionNotification;
  earlyUiiNotification: any;
  endCallNotification: CxEndedCall;
  gatesChangeNotification: any;
  genericNotification: any;
  genericResponse: any;
  holdResponse: CxHoldResponse;
  leadHistoryResponse: any;
  leadInsertResponse: any;
  leadSearchResponse: any;
  leadUpdateResponse: any;
  loginResponse: CxLoginResponse;
  loginPhase1Response: CxAgentConfig;
  multiSocketResponse: any;
  logoutResponse: any;
  logConsoleResultsResponse: any;
  logResultsResponse: any;
  newCallNotification: CxBaseCall;
  offhookInitResponse: CxOffhookInitResponse;
  offhookTermNotification: any;
  /** `error` is present when the SDK reuses this callback for a failed connect. */
  openResponse: CxOpenSocketResult;
  pauseRecordResponse: any;
  pendingChatDispNotification: any;
  pendingDispNotification: any;
  previewFetchResponse: any;
  previewLeadStateNotification: any;
  recordResponse: any;
  requeueResponse: any;
  reverseMatchNotification: any;
  safeModeFetchResponse: any;
  safeModeSearchResponse: any;
  scriptConfigResponse: any;
  monitorResponse: any;
  agentStats: any;
  agentDailyStats: any;
  campaignStats: any;
  chatQueueStats: any;
  queueStats: any;
  dispositionSummary: CxDispositionSummaryPhaseResponse;
  dispositionSummaryError: CxDispositionSummaryErrorResponse;
  supervisorListResponse: any;
  tcpaSafeLeadStateNotification: { leadState: any };
  webRtcInfoResponse: any;
  coldXferResponse: any;
  warmXferResponse: any;
  searchDirectoryResponse: any;
  extensionPresenceInfo: any;
  sipConnectedNotification: any;
  sipDialDestChangedNotification: CxSipDialDestChangedData;
  sipEndedNotification: any;
  sipMuteResponse: any;
  sipRegisteredNotification: any;
  sipRegistrationFailedNotification: any;
  sipRingingNotification: CxSipRingingData;
  sipSwitchRegistrarNotification: CxSipSwitchRegistrarData;
  sipUnmuteResponse: any;
  sipUnregisteredNotification: any;
  sipUnstableConnectionNotification: any;
  sipSuspectRegistrationNotification: CxSipSuspectRegistrationData;
}

export type CxClientCallBackValueType = keyof CxClientCallMapping;
