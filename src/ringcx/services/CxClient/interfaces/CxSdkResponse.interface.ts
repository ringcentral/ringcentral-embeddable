import type {
  AgentTypesType,
  DirectTransferNotificationTypes,
  DirectTransferStatues,
  DirectTransferTypes,
  OriginAgentTypesType,
} from '../../../enums';

export type CxTokenType = 'Bearer';
export type CxOkFail = 'OK' | 'FAILURE';
export type CxSessionType = 'AGENT' | 'OUTBOUND' | 'INBOUND';

export type CxBaseCall = {
  uii: string;
  agentId: string;
  dialDest: string;
  queueDts: string; // 2019-11-11 12:35:23
  queueTime: string;
  ani: string;
  dnis: string;
  /**
   * E.164 forms of `ani`/`dnis`. The agent library reads them from the
   * `ani_e164`/`dnis_e164` fields of the NEW-CALL, CALL-CANCELED and
   * INTERACTION-PREVIEW notifications, and `CxCallDataSource.addNewCall` spreads
   * the whole raw call, so they reach us even though the documented call schema
   * omits them.
   */
  aniE164?: string;
  dnisE164?: string;
  callType: 'INBOUND' | 'OUTBOUND';
  appUrl: string;
  isMonitoring: boolean;
  allowHold: boolean;
  allowTransfer: boolean;
  allowManualInternationalTransfer: boolean;
  allowDirectAgentTransfer: string;
  allowHangup: boolean;
  allowRequeue: boolean;
  allowEndCallForEveryone: boolean;
  scriptId: string;
  scriptVersion: string;
  surveyId: string;
  surveyPopType: string;
  requeueType: string;
  hangupOnDisposition: boolean;
  queue: CxQueue;
  agentRecording: CxAgentRecording;
  outdialDispositions: CxOutdialDispositions;
  requeueShortcuts: any[];
  baggage: CxBaggage;
  scriptResponse: {};
  lead: CxLead;
  // sessionId: string;
  transferPhoneBook: CxTransferPhoneBookItem[];
  // Dynamic properties set during call lifecycle
  hold?: boolean;
  /**
   * NEW-CALL's segment context. Sub-objects are always present (the agent
   * library defaults them) and leaves default to `''`.
   *
   * Only NEW-CALL's shape is modelled here: the agent library has four
   * divergent `normalizeSegmentContext` variants (new call, call preview, call
   * canceled, chat presented) that must not share one type.
   */
  segmentContext: {
    /** The agent's own leg for this call. */
    segmentId: string;
    preSegmentId: string;
    firstAgentSegmentId: string;
    /** Comma-joined, e.g. `"1,2,3"` — not an array. */
    categoryIds: string;
    agentContext: {
      knowledgeBaseId: string;
      perspectiveRecordingMode: string;
    },
    customerIdentity: {
      id: string;
      ani: string;
      aniE164: string;
    },
    dialog: {
      channelId: string;
      channelType: string;
      dialogDirection: string;
      dialogId: string;
    }
  },
  /** The ADD-SESSION notification this call was last seen on. */
  session?: CxAddSessionNotification;
  endedCall?: boolean;
};

export interface CxACKResponse {
  message: string;
  detail: string;
  uii: string;
  status: CxOkFail;
  type: string;
}

export interface CxEndedCall {
  message: string;
  detail: string;
  uii: string;
  sessionId: string;
  agentId: string;
  callDts: string;
  duration: string;
  termParty: string;
  termReason: string;
  recordingUrl: string;
  dispositionTimeout: string;
}
export interface CxTransferPhoneBookItem {
  name: string;
  destination: string;
  countryId: string;
}

export interface CxLead {
  leadPhone: string;
  showLeadInfo: string;
  /** The lead's `extra_data` fields, flattened to `{ key: text }`. */
  extraData: Record<string, string>;
  /**
   * The agent library spreads the whole `ui_notification.lead` collection, so
   * the lead id and other lead fields can also arrive here.
   */
  leadId?: string;
}

/**
 * One past dial attempt of a lead, from LEAD-HISTORY's `previous_dial`. The
 * agent library turns an empty field into `''`.
 */
export interface CxLeadHistoryRecord {
  passNumber: string;
  /** SQL date-time (`YYYY-MM-DD HH:mm:ss`) in server time. */
  passDts: string;
  agentName: string;
  agentDisposition: string;
  agentNotes: string;
  /** System disposition, such as `ANSWER` or `VOICEMAIL-LEFT`. */
  passDisposition: string;
  passUii: string;
  duration: string;
}

/**
 * Lead fields LEAD-UPDATE can change. The agent library sends exactly these,
 * snake-cased; `externId` is not editable but is sent back as it is.
 */
export interface CxLeadUpdateFields {
  firstName: string;
  midName: string;
  lastName: string;
  suffix: string;
  title: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  email: string;
  gateKeeper: string;
  externId: string;
  auxData1: string;
  auxData2: string;
  auxData3: string;
  auxData4: string;
  auxData5: string;
}

export interface CxLeadUpdateRequest {
  leadId: string;
  /** E.164 numbers, at most 6. */
  phoneNumbers: string[];
  fields: CxLeadUpdateFields;
}

/**
 * Outcome of a LEAD-UPDATE, returned as a value since delegated errors do
 * not cross ports. `message` is the server's error detail.
 */
export interface CxLeadUpdateResult {
  ok: boolean;
  message?: string;
}

/**
 * Lead fields NEW-CALL's baggage carries when the call has a lead: preview,
 * progressive and predictive calls, and inbound calls whose baggage names one.
 * Booleans come from the `@show_lead_passes`/`@show_list_name` attributes.
 */
export interface CxBaggageLead {
  leadId?: string;
  externId?: string;
  firstName?: string;
  midName?: string;
  lastName?: string;
  leadPasses?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  auxData1?: string;
  auxData2?: string;
  auxData3?: string;
  auxData4?: string;
  auxData5?: string;
  /** Campaign aux labels, as `{ aux_1_label: 'Label' }`. */
  customLabels?: Record<string, string>;
  showLeadPasses?: boolean;
  showListName?: boolean;
}

export interface CxScriptResponse {
  message: string;
  detail: string;
  status: boolean;
  scriptId: string;
  scriptName?: string;
  version: string;
  json: string; // format as: CxScriptResponseJSON
}

export interface CxBaggage extends CxBaggageLead {
  ani: string;
  dnis: string;
  uii: string;
  sourceId: string;
  sourceName: string;
  sourceDesc: string;
  sourceType: string;
  agentFirstName: string;
  agentLastName: string;
  agentExternalId: string;
  agentType: string;
  agentEmail: string;
  agentUserName: string;
  ivrCrmCaseId: string;
  ivrCrmRecordId: string;
  ivrCrmObjectValue: string;
  ivrCrmObjectType: string;
  ivrAlertSubject_1: string;
  ivrAlertBody_1: string;
  ivrAlertSubject_2: string;
  ivrAlertBody_2: string;
  ivrAlertSubject_3: string;
  ivrAlertBody_3: string;
}

export interface CxReceivedTransferCall {
  message: string;
  detail: string;
  status: DirectTransferNotificationTypes;
  agentId: string;
  uii: string;
  ani: string;
  dnis: string;
  sourceType: string;
  sourceId: string;
  sourceName: string;
  voicemailUrl: string;
}

export interface CxAgentRecording {
  default: 'ON' | 'OFF';
  pause: number;
  agentRecording: boolean;
}

export interface CxQueue {
  isCampaign: boolean;
  number: string;
  name: string;
  description: string;
}

export interface CxOutdialDispositions {
  type: string;
  dispositions: CxDisposition[];
}

export interface CxDisposition {
  contactForwarding: boolean;
  dispositionId: string;
  isComplete: boolean;
  isDefault: boolean;
  requireNote: boolean;
  saveSurvey: boolean;
  timeout: string;
  xfer: boolean;
  disposition: string;
}

export interface CxClientOptions {
  options: CxAgentOptions;
  callbacks?: {
    closeResponse: () => void;
    openResponse: (response: CxOpenSocketResult) => void;
  };
}

export type Deps = {
  evClientOptions: CxClientOptions;
};

export interface CxHoldResponse {
  message: string;
  detail: string;
  status: CxOkFail;
  holdState: boolean;
  sessionId: string;
  uii: string;
  holdStartedAt: number | null;
}

export interface CxDropSessionNotification {
  message: string;
  detail: string;
  status: CxOkFail;
  transferEnd: {
    sessionId: string;
    destination: string;
    uii: string;
  };
  sessionId: string;
  uii: string;
}

/**
 * A leg of a transfer/conference, tracked by the agent library for the
 * lifetime of the call and cleared on END-CALL.
 */
export interface CxTransferSession {
  sessionId: string;
  useAgentNameAsDestination: boolean;
  /** `agentName` when `useAgentNameAsDestination`, otherwise `phone`. */
  destination: string;
  /** `phone_e164`; empty when the agent name is used as the destination. */
  destinationE164: string;
  uii: string;
  /** Added by the HOLD request handler, not by ADD-SESSION. */
  onHold?: boolean;
  holdStartedAt?: number | null;
}

/**
 * ADD-SESSION notification.
 *
 * Mirrors `addSession.notification.js` in `@ringcx/agent-sdk`. Absent fields
 * arrive as `''` rather than `undefined`, and the wire literals `"TRUE"` /
 * `"FALSE"` are coerced to real booleans, which is why the flag fields are
 * `boolean | string`.
 *
 * `segmentId` identifies **this session's** leg, not the call: one uii can
 * produce several sessions, each with its own segment id.
 */
export interface CxAddSessionNotification {
  message: string;
  detail: string;
  status: CxOkFail;
  type: string;
  errorCode: string;
  errorParams: Record<string, unknown>;
  sessionId: string;
  uii: string;
  dialogId: string;
  phone: string;
  sessionType: CxSessionType;
  sessionLabel: string;
  allowControl: boolean | string;
  monitoring: boolean | string;
  agentId: string;
  agentName: string;
  recordingUrl: string;
  segmentId: string;
  summary: boolean | string;
  monitoringType: string;
  transferSessions: {
    [P: string]: CxTransferSession;
  };
}

export interface CxOpenSocketResult {
  reconnect?: boolean;
  error?: string;
}

/**
 * Formatted LOGIN response from the Agent SDK.
 *
 * `isReconnect` is only present on a successful Layer 2 reconnect, which is
 * also the only response that carries the server's session state
 * (`is_on_call` / `active_call_uii` / `is_pending_disp`) into the SDK model.
 */
export interface CxLoginResponse {
  status?: string;
  message?: string;
  isReconnect?: boolean;
}

export interface CxAgentInfo {
  type: string;
  data: CxAgentData;
}

export interface CxAgentData {
  authenticateResponse: CxAuthenticateAgentWithRcAccessTokenRes;
  agentConfig: CxAgentConfig;
}

export interface CxAgentOptions {
  authHost: string;
  localTesting: boolean;
  allowMultiSocket: boolean;
  isSecureSocket: boolean;
}

export type CxCallback = (messageType: any, response: any) => void;

export type CxMessageRes = {
  type: string;
  data: CxAgentConfig;
};

export interface CxOffhookInitResponse {
  detail: string;
  message: string;
  monitoring: boolean;
  status: string;
}

export interface CxOffhookTermResponse {
  detail: string;
  message: string;
  monitoring: boolean;
  status: string;
}

export interface CxEarlyUiiResponse {
  agentId: string;
  detail: string;
  message: string;
  status: CxOkFail;
  uii: string;
  /**
   * The pre-routing segment. Often `''` — not every deployment sends it — and
   * it can differ from the segment ADD-SESSION later reports for the agent's
   * own leg, so the two are not interchangeable.
   */
  segmentId: string;
}

export interface CxAgentConfig {
  message: string;
  detail: string;
  status: string;
  agentSettings: CxAgentSettings;
  agentPermissions: CxAgentPermissions;
  applicationSettings: CxApplicationSettings;
  chatSettings: CxChatSettings;
  connectionSettings: CxConnectionSettings;
  inboundSettings: CxInboundSettings;
  outboundSettings: CxOutboundSettings;
  scriptSettings: CxScriptSettings;

  holdState?: boolean;
  sessionId?: string;
  uii?: string;
}

export interface CxScriptSettings {
  availableScripts: CxAvailableScript[];
  loadedScripts: CxAllowLeadUpdatesByCampaign;
}

export interface CxAvailableScript {
  scriptId: string;
  scriptName: string;
}

export interface CxOutboundSettings {
  availableCampaigns: any[];
  availableOutdialGroups: any[];
  insertCampaigns: any[];
  defaultDialGroup: string;
  outdialGroup: CxAllowLeadUpdatesByCampaign;
  previewDialLeads: any[];
  tcpaSafeLeads: any[];
  campaignDispositions: any[];
}

export interface CxInboundSettings {
  availableQueues: CxAvailableQueue[];
  availableSkillProfiles: CxAvailableSkillProfile[];
  queues: any[];
  skillProfile: CxAvailableSkillProfile;
  availableRequeueQueues: CxAvailableRequeueQueue[];
}

export interface CxAvailableSkillProfile {
  profileId: string;
  profileName: string;
  isDefault?: string;
  profileDesc?: string;
}

export interface CxAvailableRequeueQueue {
  gateGroupId: string;
  groupName: string;
  gates: CxGate[];
  skills: CxSkill[];
}

export interface CxSkill {
  skillDesc: string;
  skillId: string;
  skillName: string;
}

export interface CxGate {
  gateDesc: string;
  gateId: string;
  gateName: string;
}

export interface CxAvailableQueue {
  defaultDestOverride?: string;
  gateDesc?: string;
  gateId: string;
  gateName: string;
}

export interface CxConnectionSettings {
  hashCode?: any;
  reconnect: boolean;
}

export interface CxChatSettings {
  availableChatQueues: any[];
  availableChatRooms: CxAvailableChatRoom[];
  chatQueues: any[];
  alias: string;
  availableChatRequeueQueues: any[];
}

export interface CxAvailableChatRoom {
  roomDesc: string;
  roomId: string;
  roomName: string;
}

export interface CxApplicationSettings {
  availableCountries: CxAvailableCountry[];
  isLoggedInIS: boolean;
  socketConnected: boolean;
  socketDest: string;
  isTcpaSafeMode: boolean;
  pciEnabled: boolean;
}

export interface CxAvailableCountry {
  countryId: string;
  countryName: string;
  /** country dialing code, eg. `49` for Germany */
  countryCode?: string;
  rcCountryId?: string;
}

export interface CxAgentPermissions {
  allowBlended: boolean;
  allowCallControl: boolean;
  allowChat: boolean;
  allowCrossQueueRequeue: boolean;
  allowInbound: boolean;
  allowLeadInserts: boolean;
  allowLeadSearch: boolean;
  allowLoginControl: boolean;
  allowLoginUpdates: boolean;
  allowManualCalls: boolean;
  allowManualPass: boolean;
  allowManualIntlCalls: boolean;
  allowManualOutboundGates: boolean;
  allowOffHook: boolean;
  allowOutbound: boolean;
  allowPreviewLeadFilters: boolean;
  /**
   * Campaign id to `"0"` (no updates), `"1"` (all fields) or `"2"` (all but
   * the phone), from each campaign's `@allow_lead_updates`.
   */
  allowLeadUpdatesByCampaign: Record<string, string>;
  disableSupervisorMonitoring: boolean;
  progressiveEnabled: boolean;
  requireFetchedLeadsCalled: boolean;
  showLeadHistory: boolean;
  allowAutoAnswer: boolean;
  defaultAutoAnswerOn: boolean;
  allowHistoricalDialing: boolean;
  allowAgentStats: boolean;
  allowCampaignStats: boolean;
  allowGateStats: boolean;
  allowChatStats: boolean;
  /**
   * Whether the agent may use Contact Management APIs, including
   * `/api/cm/v1/.../activities`.
   */
  allowContactManagement: boolean;
  /**
   * Account permission (`allow_warm_xfer_on_hold`): put the customer on hold
   * before a warm transfer opens the consult leg.
   */
  allowWarmXferOnHold: boolean;
  /**
   * Account permission (`allow_warm_xfer_auto_unhold`): take the customer off
   * hold again once the agent leaves the consult leg.
   */
  allowWarmXferAutoUnhold: boolean;
  /** Account permission (`enable_agent_assist`) gating the AI Assistant. */
  enableAgentAssist: boolean;
}

interface CxAllowLeadUpdatesByCampaign {}

export interface CxAgentSettings {
  accountId?: any;
  agentId: string;
  agentType: string;
  altDefaultLoginDest: string;
  availableAgentStates: CxAvailableAgentState[];
  callerIds: CxCallerId[];
  callState?: any;
  currentState: string;
  currentStateLabel: string;
  defaultLoginDest: string;
  dialDest: string;
  email: string;
  externalAgentId: string;
  firstName: string;
  guid: string;
  isLoggedIn: boolean;
  isOffhook: boolean;
  isMonitoring: boolean;
  initLoginState: string;
  initLoginStateLabel: string;
  isOutboundPrepay: boolean;
  lastName: string;
  loginDTS: string;
  loginType: string;
  maxBreakTime: string;
  maxLunchTime: string;
  onCall: boolean;
  onManualOutdial: boolean;
  outboundManualDefaultRingtime: string;
  pendingCallbacks: any[];
  pendingDialGroupChange: number;
  phoneLoginPin: string;
  realAgentType: string;
  supervisors: any[];
  totalCalls: number;
  transferNumber: string;
  updateDGFromAdminUI: boolean;
  updateLoginMode: boolean;
  username: string;
  wasMonitoring: boolean;
  agentPassword: string;
  autoAnswerCalls: boolean;
}

export interface CxCallerId {
  description: string;
  number: string;
}

export interface CxAvailableAgentState {
  agentAuxState: string;
  agentState: string;
  rank: string;
}

export interface RawEvAuthenticateAgentWithRcAccessTokenRes {
  platformId: string;
  rcAccessToken: string;
  tokenType: string;
  authType: string;
  accessToken: string;
  refreshToken?: any;
  socketUrl: string;
  socketPort: number;
  agents: RawEvAgent[];
  // Authenticate Error
  err?: string;
  message?: string;
  type?: string;
}

export type CxAuthenticateAgentWithRcAccessTokenRes = Omit<
  RawEvAuthenticateAgentWithRcAccessTokenRes,
  'agents'
> & {
  agents: CxAgents;
};

export interface CxAuthenticateAgentWithEngageAccessTokenRes {
  platformId: string;
  tokenType: string;
  engageAccessToken: string;
  authType: string;
  accessToken: string;
  refreshToken: null;
  socketUrl: string;
  socketPort: number;
  agents: RawEvAgent[];
}

export type CxAgent = Omit<RawEvAgent, 'agentType'> & {
  agentType: AgentTypesType;
};

export type CxAgents = CxAgent[];

export interface RawEvAgent {
  agentId: string;
  firstName: string;
  lastName: string;
  email?: any;
  username: string;
  agentType: OriginAgentTypesType;
  rcUserId: number;
  accountId: string;
  accountName: string;
  agentGroupId?: any;
  externalAgentId?: any;
  location?: any;
  team?: any;
  allowLoginControl: boolean;
  allowLoginUpdates: boolean;
  password?: any;
  agentRank?: any;
  initLoginBaseState?: any;
  ghostRnaAction?: any;
  enableSoftphone?: any;
  altDefaultLoginDest?: any;
  phoneLoginPin?: any;
  manualOutboundDefaultCallerId?: any;
  directAgentExtension?: any;
  maxChats?: any;
}

export interface CxDispositionCallOptions {
  uii: string;
  dispId: string;
  notes?: string;
  callback?: boolean;
  callbackDTS?: string;
  contactForwardNumber?: string;
  survey?: string;
  externId?: string;
  leadId?: string;
  requestId?: string;
}

export interface CxDispositionSummaryPhaseResponse {
  final: boolean;
  type: 'SUMMARY';
  status: 'OK'
  summary: string; // summary phase string
  segmentId: number;
  sequenceNo: string;
}

export interface CxDispositionSummaryErrorResponse {
  uii: string;
  requestMessageId: string;
  status: 'ERROR';
  detail: string;
  segmentId: string;
  sessionId: string;
  errorCode: string;
  errorMessage: string;
}

export interface CxLogoutAgentResponse {
  detail: string;
  message: string;
  status: string;
}

export interface CxDirectAgentListItem {
  agentAuxState: string;
  agentId: string;
  agentState: string;
  available: boolean;
  firstName: string;
  lastName: string;
  pendingDisp: boolean;
  stateDuration: string;
  username: string;
}

export interface CxDirectAgentListResponse {
  status: 'true' | 'false';
  message: CxOkFail;
  agents: CxDirectAgentListItem[];
}

export type CxDirectAgentTransferResponse = {
  message: string;
  detail: string;
  status: DirectTransferStatues;
  type: DirectTransferTypes;
};

export interface CxTransferCallResponse {
  agentId: string;
  uii: string;
  sessionId: string;
  status: CxOkFail;
  dialDest: string;
  message: string;
  detail: string;
}

export interface RecordResponse {
  message: string;
  detail: string;
  status: 'FAILURE' | 'OK';
  uii: string;
  state: 'RECORDING' | 'STOPPED';
}

export interface PauseRecordResponse {
  detail: string;
  message: string;
  pause: string;
  state: 'RECORDING' | 'PAUSED';
  status: 'OK' | 'FAILURE';
  uii: string;
}

export type PauseRecord = Omit<PauseRecordResponse, 'pause'> & {
  pause: number;
};

export interface CxColdTransferCallResponse extends CxTransferCallResponse {}

export interface CxWarmTransferCallResponse extends CxTransferCallResponse {}

export interface CxColdTransferIntlCallResponse
  extends CxTransferCallResponse {}

export interface CxWarmTransferIntlCallResponse
  extends CxTransferCallResponse {}

export interface CxRequeueCallResponse {
  message: string;
  detail: string;
  status: CxOkFail;
  agentId: string;
  uii: string;
  queueId: string;
}

export interface CxConfigureAgentOptions {
  dialDest: string;
  queueIds?: string[];
  chatIds?: string[];
  skillProfileId?: string;
  dialGroupId?: string;
  updateFromAdminUI?: boolean;
  isForce?: boolean;
  loginType?: string;
  callback?(): void;
}

export interface CxAgentState {
  agentAuxState: string;
  agentState: string;
}

export interface CxDispositionManualPassOptions {
  dispId: string;
  notes: string;
  callbackDTS?: string;
  leadId?: string;
  requestId?: string;
  externId?: string;
}

export interface CxAgentStateResponse {
  message: string;
  detail: string;
  status: string;
  agentId: string;
  previousState: string;
  currentState: string;
  previousAuxState: string;
  currentAuxState: string;
}

export interface CxAgentScriptResult {
  call: CxBaseCall;
  lead: {};
  model: CxAgentScriptResultModel;
  renderFormValid: boolean;
  scriptComplete: boolean;
}

export interface CxAgentScriptResultModel {
  [callId: string]: { value: any; leadField: string };
}

export interface CxCallDispositionItem {
  dispositionId: string;
  notes: string;
}
