import type CreateSipRegistrationResponse from '@rc-ex/core/lib/definitions/CreateSipRegistrationResponse';
import type SipRegistrationDeviceInfo from '@rc-ex/core/lib/definitions/SipRegistrationDeviceInfo';
import {
  Auth,
  Client,
} from '@ringcentral-integration/micro-auth/src/app/services';
import {
  action,
  fromWatchValue,
  injectable,
  optional,
  PortManager,
  RcModule,
  state,
  StoragePlugin,
  storage,
  watch,
} from '@ringcentral-integration/next-core';
import { EventEmitter } from 'events';
import WebPhone from 'ringcentral-web-phone-v2';
import ResponseMessage from 'ringcentral-web-phone-v2/sip-message/outbound/response';
import { Observable, Subject, Subscription } from 'rxjs';

import { AudioSettings } from '@ringcentral-integration/micro-phone/src/app/services/AudioSettings';
import type { SessionReplyOptions } from './Webphone.interface';
import type {
  WebphoneCallEvent,
  WebphoneCommandError,
  WebphoneConnectionStatus,
  WebphoneMakeCallParams,
  WebphoneMonitoredPickupParams,
  WebphoneNormalizedSession,
  WebphoneParkToLocationParams,
  WebphonePickupInboundCallParams,
  WebphoneRecoveryEvent,
  WebphoneSwitchCallParams,
} from './WebphoneApi.interface';
import defaultIncomingAudio from './audio/incoming.mp3';
import defaultOutgoingAudio from './audio/outgoing.mp3';
import { recordStatus } from './recordStatus';
import { sessionStatus } from './sessionStatus';
import { isDroppingVoicemail } from './webphoneHelper';
import { formatTransportEventSummary } from './webphoneLogSanitizer';
import {
  WebphoneMedia,
  type WebphoneMediaOwnerLoss,
  type WebphoneWebRtcSessionFactory,
} from '../WebphoneMedia';

import { summarizeSipMessage } from './WebphoneSipLogger';
import {
  applyEndpointIdRegisterHeader,
  applyEngageAgentEptRegisterHeaders,
  CX_OFFHOOK_INVITE_HEADERS,
  ENGAGE_AGENT_EPT_REGISTER_HEADER_NAMES,
  isCxOffhookInvite,
  isRegisterSipMessage,
  listSipHeaderNames,
} from './cxOffhookSip';
import {
  CX_VOICEMAIL_DROP_HINT_TTL,
  findCxVoicemailDropHint,
  type CxVoicemailDropCall,
  type CxVoicemailDropHint,
} from './cxVoicemailDropSip';
import {
  getHeader,
  getTransferIdentity,
  normalizeSession,
  selectSessionIds,
  type WebPhoneSession,
  type WebphoneV2SessionRecord,
} from './WebphoneV2Session';

type WebPhoneOptions = ConstructorParameters<typeof WebPhone>[0];
type SipInfo = WebPhoneOptions['sipInfo'];
type SdkReplyOptions =
  | {
      type: 'callYouBack';
      direction: 'toCaller' | 'fromCaller';
      delay: number;
      unit: 'minutes' | 'hours' | 'days';
    }
  | {
      type: 'callYouBackLater';
      direction: 'toCaller' | 'fromCaller';
    }
  | {
      type: 'onMyWay' | 'onOtherLine' | 'inAMeeting' | 'onOtherLineNoCall';
    };
type InboundWebPhoneSession = WebPhoneSession & {
  answer(): Promise<void>;
  decline(): Promise<void>;
  forward(target: string): Promise<void>;
  toVoicemail(): Promise<void>;
  reply(options: string | SdkReplyOptions): Promise<unknown>;
};
type WebPhoneEventSource = {
  on(eventName: string, listener: (...args: any[]) => void): void;
  off(eventName: string, listener: (...args: any[]) => void): void;
};
type WebphoneSessionMetadata = Pick<
  WebphoneV2SessionRecord,
  | 'displayedFromName'
  | 'displayedFromNumber'
  | 'displayedToName'
  | 'displayedToNumber'
  | 'extendedControls'
  | 'warmTransferSessionId'
>;
type SipClientWithSend = WebPhoneEventSource & {
  send?: (message: unknown, waitForReply?: boolean) => Promise<unknown>;
};

const SIP_STATUS_PATTERN = /SIP\/2\.0\s+(\d{3})/i;
const CLEANUP_TIMEOUT = 5_000;
const SESSION_CLEANUP_TIMEOUT = 2_000;
const COMMAND_DEADLINE = 60_000;
const SUPPORTED_REPLY_TYPES = new Set([0, 1, 2, 4, 5]);
const SESSION_CLOSE_COMMAND = '9';
const RECOVERY_ATTEMPT_TIMEOUT = 10_000;
const SOCKET_RECOVERY_DELAYS = [1_000, 2_000, 5_000, 10_000, 30_000] as const;

/** Failed reconnect attempts before switching outbound proxy. */
const PROXY_ROTATION_ATTEMPTS = 2;
const DEFAULT_AUDIO_FILE = 'default';
const SETUP_TERMINAL_STATES = new Set(['init', 'failed', 'disposed']);
/** Matches the response SIP.js sends for a rejected invitation. */
const LOCAL_DECLINE_RESPONSE_CODE = 480;
const SDK_SESSION_EVENTS = [
  'ringing',
  'answered',
  'failed',
  'disposed',
] as const;

type SipWebSocket = {
  addEventListener(type: 'close', listener: () => void): void;
  removeEventListener(type: 'close', listener: () => void): void;
  close(): void;
};

const waitForCleanup = async (promise: Promise<unknown>, timeout: number) => {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      promise.catch(() => undefined),
      new Promise<void>((resolve) => {
        timeoutHandle = setTimeout(resolve, timeout);
      }),
    ]);
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
};

type CommandResult = {
  code: number;
  description?: string;
};

const toReplyNumber = (value: string | number | undefined, field: string) => {
  if (value === undefined || value === '') {
    throw new Error(`Missing reply field: ${field}`);
  }
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new Error(`Invalid reply field: ${field}`);
  }
  return number;
};

const getReplyOptions = (
  replyOptions: SessionReplyOptions,
): string | SdkReplyOptions => {
  const replyType = Number(replyOptions.replyType);
  if (!SUPPORTED_REPLY_TYPES.has(replyType)) {
    throw new Error(`Unsupported reply type: ${replyOptions.replyType}`);
  }

  if (replyType === 0) return replyOptions.replyText ?? '';
  if (replyType === 1 || replyType === 4) {
    return getCallbackReplyOptions(replyType, replyOptions);
  }
  return { type: replyType === 2 ? 'onMyWay' : 'inAMeeting' };
};

const getCallbackReplyOptions = (
  replyType: number,
  replyOptions: SessionReplyOptions,
): SdkReplyOptions => {
  const direction = toReplyNumber(
    replyOptions.callbackDirection,
    'callbackDirection',
  );
  if (direction !== 0 && direction !== 1) {
    throw new Error('Invalid reply field: callbackDirection');
  }
  const replyDirection = direction === 1 ? 'fromCaller' : 'toCaller';
  if (replyType === 4) {
    return { type: 'callYouBackLater', direction: replyDirection };
  }
  const unit = toReplyNumber(replyOptions.timeUnits, 'timeUnits');
  if (unit < 0 || unit > 2) {
    throw new Error('Invalid reply field: timeUnits');
  }
  return {
    type: 'callYouBack',
    direction: replyDirection,
    delay: toReplyNumber(replyOptions.timeValue, 'timeValue'),
    unit: ['minutes', 'hours', 'days'][unit] as 'minutes' | 'hours' | 'days',
  };
};

const commandError = (result: CommandResult) => {
  const error = new Error(
    result.description ?? `Command failed: ${result.code}`,
  );
  Object.assign(error, result);
  return error;
};

const webphoneCommandError = (
  code: WebphoneCommandError['code'],
  operation: string,
  message: string,
  callId?: string,
) =>
  Object.assign(new Error(message), {
    name: 'WebphoneCommandError',
    code,
    operation,
    ...(callId ? { callId } : {}),
    details: {
      code,
      operation,
      ...(callId ? { callId } : {}),
    },
  });

const hasCallId = (message: unknown, callId: string) =>
  getHeader(message, 'Call-ID')?.toLowerCase() === callId.toLowerCase();

const getSipSubject = (message: unknown) => {
  const subject = (message as { subject?: unknown })?.subject;
  return typeof subject === 'string' ? subject : '';
};

const hasRcCommand = (message: unknown, callId: string, command: string) => {
  if (!hasCallId(message, callId)) return false;
  if (!getSipSubject(message).startsWith('MESSAGE sip:')) return false;
  const body = (message as { body?: unknown })?.body;
  if (typeof body !== 'string') return false;
  // ponytail: match only Cmd header; use SDK XML parsing if server format changes.
  const match = body.match(/<Hdr\b[^>]*\bCmd=(?:"([^"]+)"|'([^']+)')/i);
  return (match?.[1] ?? match?.[2]) === command;
};

export interface WebphoneV2Options {
  readonly webRtcSessionFactory?: WebphoneWebRtcSessionFactory;
  readonly webPhoneFactory?: (options: WebPhoneOptions) => WebPhone;
  /** Defaults to `end`; `recover` is intended for qualification experiments. */
  readonly mediaOwnerLossPolicy?: 'end' | 'recover';
}

export type WebphoneV2ProvisionCache = {
  readonly endpointId: string;
  readonly sipInfo: SipInfo;
  readonly device: SipRegistrationDeviceInfo | null;
};

const toSipInfo = (
  provision: CreateSipRegistrationResponse,
): SipInfo | null => {
  const source = provision.sipInfo?.[0];

  if (
    !source?.authorizationId ||
    !source.domain ||
    !source.outboundProxy ||
    !source.username ||
    !source.password
  ) {
    return null;
  }

  return {
    authorizationId: source.authorizationId,
    domain: source.domain,
    outboundProxy: source.outboundProxy,
    outboundProxyBackup: source.outboundProxyBackup || source.outboundProxy,
    username: source.username,
    password: source.password,
    stunServers: source.stunServers ?? [],
  };
};

export const getSipStatusCode = (error: unknown): number | null => {
  const message = error instanceof Error ? error.message : String(error);
  const match = message.match(SIP_STATUS_PATTERN);
  return match ? Number(match[1]) : null;
};

/**
 * A random UUID for `+sip.instance`, which is sent as `urn:uuid:<id>`.
 */
export const createSipInstanceId = (): string =>
  globalThis.crypto?.randomUUID?.() ??
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    return (char === 'x' ? random : (random % 4) + 8).toString(16);
  });

/**
 * The edge's refusal of a REGISTER because another registration took over
 * this phone, e.g. the same agent signing in somewhere else.
 */
export const isSipInstanceInterception = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);
  return getSipStatusCode(error) === 403 && /intercepted/i.test(message);
};

export const WEBPHONE_INSTANCE_INTERCEPTED_ERROR = 'webphoneInstanceIntercepted';

export const isSipAuthorizationRejection = (error: unknown): boolean => {
  const statusCode = getSipStatusCode(error);
  return statusCode === 401 || statusCode === 403;
};

const getErrorLogContext = (error: unknown) => ({
  errorName: error instanceof Error ? error.name : typeof error,
  statusCode: getSipStatusCode(error),
});

const requireNonEmptyValue = (value: unknown, name: string) => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Invalid ${name}`);
  }
  return value.trim();
};

@injectable({
  name: 'WebphoneV2',
})
export class WebphoneV2 extends RcModule {
  @state
  connectionStatus: WebphoneConnectionStatus = 'disconnected';

  @state
  connectRetryCounts = 0;

  @state
  errorCode: string | null = null;

  @state
  statusCode: number | null = null;

  @state
  device: SipRegistrationDeviceInfo | null = null;

  @storage
  @state
  sipInfo: SipInfo | null = null;

  @storage
  @state
  provisionedDevice: SipRegistrationDeviceInfo | null = null;

  @storage
  @state
  sipInfoEndpointId: string | null = null;

  /**
   * The `+sip.instance` this browser registers with.
   *
   * The SDK falls back to `sipInfo.authorizationId`, which every client
   * provisioned with the same device shares. Whichever of them registers last
   * takes that instance over, and the edge then refuses any fresh REGISTER
   * from the others with `403 instance id is intercepted by another
   * registration`, leaving their phone down until reload. Persisted because
   * RFC 5626 expects an instance id to survive restarts, so a reload replaces
   * its own binding instead of adding a contact.
   */
  @storage
  @state
  sipInstanceId: string | null = null;

  @storage
  @state
  data = {
    incomingAudioFile: DEFAULT_AUDIO_FILE,
    incomingAudioDataUrl: null as string | null,
    outgoingAudioFile: DEFAULT_AUDIO_FILE,
    outgoingAudioDataUrl: null as string | null,
  };

  @state
  sessions: WebphoneNormalizedSession[] = [];

  @state
  activeSessionId: string | null = null;

  @state
  ringSessionId: string | null = null;

  /**
   * Persisted so the first connect after a reload already registers with the
   * roles the restored agent session needs, instead of registering without
   * them and being torn down again by session auto config.
   */
  @storage
  @state
  engageAgentEptEnabled = false;

  @state
  cxOffhookSessionId: string | null = null;

  @state
  cxOffhookConnected = false;

  @state
  cxOffhookRinging = false;

  @state
  cxOffhookMuted = false;

  @state
  cxOffhookTelephonySessionIds: string[] = [];

  /**
   * Live RingCX voicemail-drop calls, hidden ones (matched, not dropping yet)
   * and dropping ones alike. None of them is the agent's call to act on.
   */
  @state
  cxVoicemailDropCalls: CxVoicemailDropCall[] = [];

  /**
   * Pending RingCX voicemail drops. Only the server matches INVITEs against
   * them, but they are state so call lists can hide a telephony or presence
   * event of the transferred call that arrives before its INVITE.
   */
  @state
  cxVoicemailDropHints: CxVoicemailDropHint[] = [];

  private _webPhone: WebPhone | null = null;

  /**
   * Whether the last REGISTER sent on the current connection carried the
   * Engage EPT roles. Only meaningful while {@link connected} is true.
   */
  private _registeredEngageAgentEpt = false;

  private _connectPromise?: Promise<void>;

  private _lifecycleEpoch = 0;

  private _recoveryTimer?: ReturnType<typeof setTimeout>;

  private _socketRecoveryAttempt = 0;

  private _socketCleanup = new WeakMap<WebPhone, () => void>();

  // Divergence from upstream: `protected` so this app's `Webphone` subclass can
  // add the repo-specific APIs (forward flag, voicemail drop) without forking
  // the runtime itself.
  protected _sessionRecords = new Map<string, WebphoneV2SessionRecord>();

  private _sessionQueues = new Map<string, Promise<void>>();

  private _webPhoneCleanup = new WeakMap<WebPhone, () => void>();

  private _mediaOwnerLossSubscription?: Subscription;

  private _mediaOwnerRecoveryPromise?: Promise<void>;

  private _pendingMediaOwnerLoss?: WebphoneMediaOwnerLoss;

  private _pendingOutboundMetadata?: WebphoneSessionMetadata;

  // Divergence from upstream: `protected` so this app's subclass can mirror
  // call events from the server to clients. Upstream gets that from
  // `WebphoneFacade`, which this app does not have.
  protected _eventEmitter = new EventEmitter();

  protected _callEventsSubject = new Subject<WebphoneCallEvent>();

  private _recoveryEventsSubject = new Subject<WebphoneRecoveryEvent>();

  private _inviteSubject = new Subject<WebphoneNormalizedSession>();

  private _ignoreSubject = new Subject<string>();

  private _registered = false;

  readonly sessions$: Observable<readonly WebphoneNormalizedSession[]> =
    fromWatchValue(this, () => this.sessions);

  readonly callEvents$ = this._callEventsSubject.asObservable();

  readonly recoveryEvents$ = this._recoveryEventsSubject.asObservable();

  readonly invite$ = this._inviteSubject.asObservable();

  readonly ignore$ = this._ignoreSubject.asObservable();

  constructor(
    protected _auth: Auth,
    protected _client: Client,
    protected _storage: StoragePlugin,
    protected _webphoneMedia: WebphoneMedia,
    protected _audioSettings: AudioSettings,
    protected _portManager: PortManager,
    @optional('WebphoneV2Options')
    protected _options?: WebphoneV2Options,
  ) {
    super();
    this._storage.enable(this);
    watch(
      this,
      () => this._audioSettings.inputDeviceId,
      (deviceId) => {
        if (!deviceId) return;
        void this.changeInputDevice(deviceId).catch((error) => {
          this.logger.error('Webphone V2 input device change failed', {
            ...getErrorLogContext(error),
          });
        });
      },
    );
    this._auth.addBeforeLogoutHandler(() => this.disconnect());
    if (this._portManager.shared) {
      const bindBeforeUnload = () => {
        this._bindBeforeUnload();
        return () => this._unbindBeforeUnload();
      };
      this._portManager.onClient(bindBeforeUnload);
      if (!this._portManager.isWorkerMode) {
        this._portManager.onServer(bindBeforeUnload);
      }
    }
  }

  override async onInit() {
    if (!this._portManager.shared) this._bindBeforeUnload();
    this.logger.info('Webphone V2 initialized', {
      mediaOwnerLossPolicy: this._options?.mediaOwnerLossPolicy ?? 'end',
    });
    this._mediaOwnerLossSubscription ??=
      this._webphoneMedia.ownerLoss$?.subscribe((loss) => {
        this.logger.warn('Webphone V2 media owner lost', {
          ownerRevision: loss.ownerRevision,
          affectedCallCount: loss.callIds.length,
          policy: this._options?.mediaOwnerLossPolicy ?? 'end',
        });
        void this._handleMediaOwnerLoss(loss).catch((error) => {
          this.logger.error('Webphone V2 media owner loss handling failed', {
            ...getErrorLogContext(error),
          });
        });
      });
  }

  override async onReset() {
    this.logger.info('Webphone V2 reset');
    if (!this._portManager.shared) this._unbindBeforeUnload();
    this._mediaOwnerLossSubscription?.unsubscribe();
    this._mediaOwnerLossSubscription = undefined;
    this._pendingMediaOwnerLoss = undefined;
  }

  private _handleBeforeUnload = (event: BeforeUnloadEvent) => {
    // `sessions` leaves out the hidden RingCX offhook leg and voicemail-drop
    // calls, but closing the tab that carries their media ends them all the
    // same.
    const sessionCount =
      this.sessions.length +
      (this.cxOffhookSessionId ? 1 : 0) +
      this.cxVoicemailDropCalls.filter((call) => call.hidden).length;
    const isLocalMediaOwner = this._webphoneMedia.isLocalMediaOwner;
    const isAuthoritativeBrowser =
      !this._portManager.shared ||
      (!this._portManager.isWorkerMode && this._portManager.isServer);
    const hasOtherConnectedClients =
      this._webphoneMedia.hasOtherConnectedClients;
    const policy = this._options?.mediaOwnerLossPolicy ?? 'end';
    const blocks =
      sessionCount > 0 &&
      (isAuthoritativeBrowser ||
        (isLocalMediaOwner &&
          (policy !== 'recover' || !hasOtherConnectedClients)));
    this.logger.info('Webphone V2 beforeunload evaluated', {
      sessionCount,
      isAuthoritativeBrowser,
      isLocalMediaOwner,
      hasOtherConnectedClients,
      policy,
      blocks,
    });
    if (!blocks) return;
    event.preventDefault();
    event.returnValue = true;
  };

  private _bindBeforeUnload() {
    globalThis.window?.addEventListener(
      'beforeunload',
      this._handleBeforeUnload,
    );
  }

  private _unbindBeforeUnload() {
    globalThis.window?.removeEventListener(
      'beforeunload',
      this._handleBeforeUnload,
    );
  }

  get connected() {
    return this.connectionStatus === 'connected';
  }

  get connecting() {
    return this.connectionStatus === 'connecting';
  }

  get disconnected() {
    return this.connectionStatus === 'disconnected';
  }

  get disconnecting() {
    return this.connectionStatus === 'disconnecting';
  }

  get enabled() {
    return !!this._auth.loggedIn;
  }

  get reconnecting() {
    return this.connectionStatus === 'reconnecting';
  }

  get inactive() {
    return this.connectionStatus === 'inactive';
  }

  get inactiveDisconnecting() {
    return this.connectionStatus === 'inactiveDisconnecting';
  }

  get connectFailed() {
    return this.connectionStatus === 'connectFailed';
  }

  get connectError() {
    return this.connectionStatus === 'connectError';
  }

  get isUnavailable() {
    return !this.connected;
  }

  get incomingAudioFile() {
    return this.data.incomingAudioFile;
  }

  get incomingAudioDataUrl() {
    return this.data.incomingAudioDataUrl;
  }

  get outgoingAudioFile() {
    return this.data.outgoingAudioFile;
  }

  get outgoingAudioDataUrl() {
    return this.data.outgoingAudioDataUrl;
  }

  get incomingAudio() {
    if (this.incomingAudioDataUrl === '') return '';
    return this.incomingAudioDataUrl || this.defaultIncomingAudio;
  }

  get outgoingAudio() {
    return this.outgoingAudioDataUrl || this.defaultOutgoingAudio;
  }

  get defaultIncomingAudio() {
    return defaultIncomingAudio;
  }

  get defaultIncomingAudioFile() {
    return DEFAULT_AUDIO_FILE;
  }

  get defaultOutgoingAudio() {
    return defaultOutgoingAudio;
  }

  get defaultOutgoingAudioFile() {
    return DEFAULT_AUDIO_FILE;
  }

  get realtimeRecoveryRetryCounts() {
    return this._socketRecoveryAttempt;
  }

  get activeSession() {
    return (
      this.sessions.find((session) => session.id === this.activeSessionId) ??
      null
    );
  }

  get ringSession() {
    return (
      this.sessions.find((session) => session.id === this.ringSessionId) ?? null
    );
  }

  get ringSessions() {
    return this.sessions.filter(
      (session) =>
        session.direction === 'Inbound' &&
        session.callStatus === sessionStatus.connecting,
    );
  }

  get onHoldSessions() {
    return this.sessions.filter((session) => session.isOnHold);
  }

  get hasCallSessions() {
    return this.sessions.length > 0;
  }

  get sessionPhoneNumbers() {
    return [
      ...new Set(
        this.sessions.flatMap((session) => [session.from, session.to]),
      ),
    ];
  }

  get ringingCallOnView() {
    return this.ringSessions.find((session) => !session.minimized) ?? null;
  }

  get isOnTransfer() {
    return this.sessions.some((session) => session.isOnTransfer);
  }

  @action
  private _setIncomingAudio(fileName: string, dataUrl: string | null) {
    this.data.incomingAudioFile = fileName;
    this.data.incomingAudioDataUrl = dataUrl;
  }

  @action
  private _setRingtone(
    incomingAudioFile: string,
    incomingAudioDataUrl: string | null,
    outgoingAudioFile: string,
    outgoingAudioDataUrl: string | null,
  ) {
    this.data.incomingAudioFile = incomingAudioFile;
    this.data.incomingAudioDataUrl = incomingAudioDataUrl;
    this.data.outgoingAudioFile = outgoingAudioFile;
    this.data.outgoingAudioDataUrl = outgoingAudioDataUrl;
  }

  async setIncomingAudioIntoStorage({
    fileName,
    dataUrl,
  }: {
    fileName: string;
    dataUrl: string;
  }) {
    this._setIncomingAudio(fileName, dataUrl);
  }

  async loadClientAudio() {
    // V2 alerting owns the browser audio element and reads incomingAudio on demand.
  }

  async setRingtone({
    incomingAudio,
    incomingAudioFile,
    outgoingAudio,
    outgoingAudioFile,
  }: {
    incomingAudio: string;
    incomingAudioFile: string;
    outgoingAudio: string;
    outgoingAudioFile: string;
  }) {
    const isIncomingDefault =
      incomingAudioFile === DEFAULT_AUDIO_FILE &&
      incomingAudio === defaultIncomingAudio;
    const isOutgoingDefault =
      outgoingAudioFile === DEFAULT_AUDIO_FILE &&
      outgoingAudio === defaultOutgoingAudio;
    this._setRingtone(
      isIncomingDefault ? DEFAULT_AUDIO_FILE : incomingAudioFile,
      isIncomingDefault ? null : incomingAudio,
      isOutgoingDefault ? DEFAULT_AUDIO_FILE : outgoingAudioFile,
      isOutgoingDefault ? null : outgoingAudio,
    );
  }

  /**
   * @deprecated V2 has one authoritative runtime and no main-tab mapping.
   * Remove after V1 retirement.
   */
  useWebphoneMainTab() {
    // V2 has one authoritative runtime; retain V1-compatible no-op until V1 retirement.
  }

  /**
   * @deprecated V2 ignores tab ownership and `forceDisconnect`, returning
   * `false` so callers keep the authoritative session instead of triggering
   * pickup. Remove after V1 retirement.
   */
  async switchWebphoneInstance() {
    return false;
  }

  @action
  private _replaceLiveState(
    sessions: WebphoneNormalizedSession[],
    activeSessionId: string | null,
    ringSessionId: string | null,
  ) {
    this.sessions = sessions;
    this.activeSessionId = activeSessionId;
    this.ringSessionId = ringSessionId;
  }

  @action
  private _setEngageAgentEptEnabled(enabled: boolean) {
    this.engageAgentEptEnabled = enabled;
  }

  @action
  private _setCxOffhookState({
    sessionId,
    connected,
    ringing,
    muted,
    telephonySessionIds,
  }: {
    sessionId: string | null;
    connected: boolean;
    ringing: boolean;
    muted: boolean;
    telephonySessionIds: string[];
  }) {
    this.cxOffhookSessionId = sessionId;
    this.cxOffhookConnected = connected;
    this.cxOffhookRinging = ringing;
    this.cxOffhookMuted = muted;
    this.cxOffhookTelephonySessionIds = telephonySessionIds;
  }

  private _syncCxOffhookState() {
    const record = [...this._sessionRecords.values()].find(
      (candidate) => candidate.isCxOffhook && !candidate.finalized,
    );
    const telephonySessionId = record?.normalized.partyData?.sessionId;
    this._setCxOffhookState({
      sessionId: record?.normalized.id ?? null,
      connected: record?.session.state === 'answered',
      ringing: record?.normalized.callStatus === sessionStatus.connecting,
      muted: record?.normalized.isOnMute ?? false,
      telephonySessionIds: telephonySessionId ? [telephonySessionId] : [],
    });
  }

  @action
  private _setCxVoicemailDropCalls(calls: CxVoicemailDropCall[]) {
    this.cxVoicemailDropCalls = calls;
  }

  @action
  private _setCxVoicemailDropHints(hints: CxVoicemailDropHint[]) {
    this.cxVoicemailDropHints = hints;
  }

  /**
   * Hidden until the drop starts. From then on the call shows in `sessions`
   * with its drop status, like a RingEX voicemail drop.
   */
  private _isHiddenCxVoicemailDrop(record: WebphoneV2SessionRecord) {
    return (
      Boolean(record.isCxVoicemailDrop) &&
      !record.finalized &&
      !record.normalized.voicemailDropStatus
    );
  }

  private _syncCxVoicemailDropState() {
    const calls = [...this._sessionRecords.values()]
      .filter((record) => record.isCxVoicemailDrop && !record.finalized)
      .map((record) => ({
        sessionId: record.normalized.id,
        telephonySessionId: record.normalized.partyData?.sessionId ?? null,
        messageId: record.cxVoicemailDropMessageId ?? '',
        ringing: record.normalized.callStatus === sessionStatus.connecting,
        hidden: this._isHiddenCxVoicemailDrop(record),
      }));
    if (calls.length === 0 && this.cxVoicemailDropCalls.length === 0) {
      return;
    }
    this._setCxVoicemailDropCalls(calls);
  }

  /**
   * Hidden calls raise no call events at all. A voicemail-drop call is not the
   * agent's call either: it reports through `callVoicemailDropped` instead, so
   * hosts do not see it ring, start or end, or log it.
   */
  private _isSilentToCallEvents(record?: WebphoneV2SessionRecord) {
    return Boolean(record?.isCxOffhook || record?.isCxVoicemailDrop);
  }

  /**
   * Registers a pending RingCX voicemail drop. The next inbound INVITE from
   * `customerNumber` to `extensionNumber` within the TTL is hidden and kept for
   * a silent answer instead of ringing.
   *
   * Runs on the server, where `WebPhone` sees the INVITEs. The hint removes
   * itself when the TTL runs out.
   * @returns the hint id, for {@link clearCxVoicemailDropHint}.
   */
  async registerCxVoicemailDropHint({
    customerNumber,
    extensionNumber,
    messageId,
    ttl = CX_VOICEMAIL_DROP_HINT_TTL,
  }: {
    customerNumber: string;
    extensionNumber: string;
    messageId: string;
    ttl?: number;
  }): Promise<string> {
    const now = Date.now();
    const id = `${now}-${Math.random().toString(36).slice(2)}`;
    this._setCxVoicemailDropHints([
      ...this.cxVoicemailDropHints.filter((hint) => hint.expiresAt >= now),
      { id, customerNumber, extensionNumber, messageId, expiresAt: now + ttl },
    ]);
    setTimeout(() => {
      void this.clearCxVoicemailDropHint(id);
    }, ttl);
    this.logger.info('Webphone V2 CX voicemail drop hint registered', { ttl });
    return id;
  }

  /** Drops a hint that will not be answered, e.g. after a failed transfer. */
  async clearCxVoicemailDropHint(hintId: string) {
    this._removeCxVoicemailDropHint(hintId);
  }

  private _removeCxVoicemailDropHint(hintId: string) {
    if (!this.cxVoicemailDropHints.some((hint) => hint.id === hintId)) {
      return;
    }
    this._setCxVoicemailDropHints(
      this.cxVoicemailDropHints.filter((hint) => hint.id !== hintId),
    );
  }

  /** Takes the hint the INVITE answers out of the list, so it matches once. */
  private _consumeCxVoicemailDropHint(inviteMessage: unknown) {
    const hint = findCxVoicemailDropHint({
      hints: this.cxVoicemailDropHints,
      inviteMessage,
    });
    if (hint) {
      this._removeCxVoicemailDropHint(hint.id);
    }
    return hint;
  }

  /**
   * Turns down an inbound INVITE on this device only, with a plain SIP final
   * response.
   *
   * The call keeps ringing on the user's other devices, which is what "Ignore"
   * means. `InboundCallSession.decline()` cannot be used for that: it sends the
   * call-control reject command, which ends the call for every device and
   * routes it to voicemail.
   *
   * It is also the only way to refuse a RingCX offhook INVITE: that INVITE
   * carries no `P-rc` header, so the SDK drops the call-control MESSAGE without
   * putting anything on the wire and the wait for CANCEL never resolves.
   *
   * The SDK only reaps a session on BYE or CANCEL, so this one has to be
   * retired here.
   */
  private async _declineLocally(record: WebphoneV2SessionRecord) {
    const { session } = record;
    await session.webPhone.sipClient.reply(
      new ResponseMessage(session.sipMessage, {
        responseCode: LOCAL_DECLINE_RESPONSE_CODE,
      }),
    );
    const { callSessions } = session.webPhone;
    const index = callSessions.findIndex(
      (candidate) => candidate.callId === session.callId,
    );
    if (index !== -1) {
      callSessions.splice(index, 1);
    }
    session.dispose();
  }

  private async _hangupCxOffhookSessions() {
    for (const record of [...this._sessionRecords.values()]) {
      if (!record.isCxOffhook || record.finalized) {
        continue;
      }
      try {
        await record.session.hangup();
      } catch (error) {
        this.logger.warn(
          'Webphone V2 CX offhook hangup failed',
          getErrorLogContext(error),
        );
      }
    }
  }

  /**
   * Brings the live registration in line with the requested EPT roles.
   *
   * A reconnect only happens when there is a registration advertising the
   * wrong roles. When nothing is registered yet the flag alone is enough,
   * because whichever path connects next reads it while building the
   * REGISTER; that is the reload case, where the flag is restored from
   * storage before the host webphone connects.
   */
  async setEngageAgentEptEnabled(enabled: boolean) {
    this._setEngageAgentEptEnabled(enabled);
    if (!enabled) {
      await this._hangupCxOffhookSessions();
    }
    // A connect started before this call may still be choosing its headers.
    await this._connectPromise?.catch(() => undefined);
    const matchesRegistration =
      !this.connected || this._registeredEngageAgentEpt === enabled;
    if (matchesRegistration) {
      return;
    }
    await this.reconnectWithCurrentHeaders();
  }

  /**
   * Rebuilds the SIP UA so the next REGISTER advertises the current EPT roles.
   *
   * The registrar decides which roles an endpoint supports when it registers,
   * so toggling CX offhook needs a fresh connection rather than a refresh
   * REGISTER on the live UA. The cached provision is dropped first so the new
   * registration is built from a fresh `client-info/sip-provision` device
   * rather than replayed from the previous one.
   */
  async reconnectWithCurrentHeaders() {
    if (!this._auth.loggedIn) {
      return;
    }
    if (this.sessions.length > 0) {
      this.logger.warn('Webphone V2 reconnecting while RingEX sessions are live', {
        sessionCount: this.sessions.length,
      });
    }
    await this.disconnect();
    this._clearProvisionCache();
    await this.connect();
  }

  protected _publishLiveState() {
    const sessions = [...this._sessionRecords.values()]
      .filter(
        (record) =>
          !record.finalized &&
          !record.isCxOffhook &&
          !this._isHiddenCxVoicemailDrop(record),
      )
      .map((record) => record.normalized)
      .sort((left, right) => right.lastActiveTime - left.lastActiveTime);
    const selected = selectSessionIds(sessions);
    this._replaceLiveState(
      sessions,
      selected.activeSessionId,
      selected.ringSessionId,
    );
    this._syncCxOffhookState();
    this._syncCxVoicemailDropState();
  }

  private _publishCallEvent(
    type: WebphoneCallEvent['type'],
    session: WebphoneNormalizedSession,
  ) {
    if (this._isSilentToCallEvents(this._getSession(session.id))) {
      return;
    }
    const event: WebphoneCallEvent = {
      type,
      session,
      activeSession: this.activeSession,
      ringSession: this.ringSession,
    };
    this._callEventsSubject.next(event);
    if (type === 'callRing') {
      this._eventEmitter.emit(type, session, this.ringSession);
      return;
    }
    this._eventEmitter.emit(
      type,
      session,
      this.activeSession,
      ...(type === 'callEnd' ? [this.ringSession] : []),
    );
  }

  private _bindSession(
    session: WebPhoneSession,
    initialEvent: 'callInit' | 'callRing',
    metadata: WebphoneSessionMetadata = {},
  ) {
    const callId = session.callId;
    const existing = this._sessionRecords.get(callId);
    if (existing) {
      Object.assign(existing, metadata);
      existing.normalized = normalizeSession({
        session: existing.session,
        previous: existing.normalized,
        record: existing,
      });
      this._publishLiveState();
      return existing;
    }
    const inviteMessage = (
      session as WebPhoneSession & { sipMessage?: unknown }
    ).sipMessage;
    const isCxOffhook =
      session.direction === 'inbound' && isCxOffhookInvite(inviteMessage);
    // The offhook check runs first: an offhook INVITE is never a drop call.
    const cxVoicemailDropHint =
      session.direction === 'inbound' && !isCxOffhook
        ? this._consumeCxVoicemailDropHint(inviteMessage)
        : undefined;
    const isCxVoicemailDrop = Boolean(cxVoicemailDropHint);
    if (session.direction === 'inbound') {
      this.logger.info('Webphone V2 inbound INVITE classified', {
        isCxOffhook,
        isCxVoicemailDrop,
        headerNames: listSipHeaderNames(inviteMessage),
        hasCallControlApiIds: Boolean(
          getHeader(inviteMessage, CX_OFFHOOK_INVITE_HEADERS.callControlApiIds),
        ),
      });
    }
    const record: WebphoneV2SessionRecord = {
      session,
      normalized: normalizeSession({ session }),
      revision: 0,
      finalized: false,
      isCxOffhook,
      isCxVoicemailDrop,
      cxVoicemailDropMessageId: cxVoicemailDropHint?.messageId,
      ...metadata,
    };
    record.normalized = normalizeSession({
      session,
      previous: record.normalized,
      record,
    });
    this._sessionRecords.set(callId, record);
    this.logger.debug('Webphone V2 session bound', {
      direction: session.direction,
      initialEvent,
      isCxOffhook,
      sessionCount: this._sessionRecords.size,
    });
    for (const eventName of SDK_SESSION_EVENTS) {
      session.on(eventName, () => {
        this._enqueueSessionEvent(callId, eventName);
      });
    }
    this._publishLiveState();
    if (isCxOffhook) {
      // RingCX decides whether to answer or present the invitation when this
      // ringing state reaches CxIntegratedSoftphone.
      return record;
    }
    if (isCxVoicemailDrop) {
      // Waits in `cxVoicemailDropCalls` for `CxVoicemailDropRunner` to answer
      // it silently.
      return record;
    }
    this._publishCallEvent(initialEvent, record.normalized);
    if (initialEvent === 'callInit')
      this._inviteSubject.next(record.normalized);
    return record;
  }

  private _enqueueSessionEvent(callId: string, eventName: string) {
    const previous = this._sessionQueues.get(callId) ?? Promise.resolve();
    const next = previous.then(() =>
      this._processSessionEvent(callId, eventName),
    );
    this._sessionQueues.set(
      callId,
      next.catch(() => undefined),
    );
    void next.catch((error) => {
      this.logger.error('Webphone V2 session event failed', {
        ...getErrorLogContext(error),
      });
    });
  }

  private async _processSessionEvent(callId: string, eventName: string) {
    const record = this._sessionRecords.get(callId);
    if (!record) return;
    if (record.finalized) {
      if (record.pendingCleanup) await this._cleanupRetainedSession(record);
      return;
    }
    record.revision += 1;
    if (eventName === 'failed' || eventName === 'disposed') {
      this._finalizeSessionFromEvent(record);
      return;
    }
    record.normalized = normalizeSession({
      session: record.session,
      previous: record.normalized,
      record,
    });
    this._publishLiveState();
    await this._publishSessionEvent(record, eventName);
  }

  private _finalizeSessionFromEvent(record: WebphoneV2SessionRecord) {
    const isOutboundSetup =
      record.session.direction === 'outbound' &&
      (record.normalized.callStatus === sessionStatus.setup ||
        record.normalized.callStatus === sessionStatus.connecting);
    this._finalizeSession(
      record,
      record.pendingSetupErrorCode ??
        (isOutboundSetup ? 'callSetupFailed' : undefined),
    );
  }

  private async _publishSessionEvent(
    record: WebphoneV2SessionRecord,
    eventName: string,
  ) {
    if (this._isSilentToCallEvents(record)) {
      this._publishLiveState();
      return;
    }
    if (eventName === 'ringing') {
      this._publishCallEvent('callProgress', record.normalized);
      if (record.cancelRequested) {
        await this._cancelOutboundSession(record, record.pendingSetupErrorCode);
      }
      return;
    }
    if (eventName === 'answered') {
      this._publishCallEvent('callStart', record.normalized);
      void this._playExtendedControls(record);
    }
  }

  private _releaseSession(record: WebphoneV2SessionRecord) {
    if (record.cleanupDeadlineHandle) {
      clearTimeout(record.cleanupDeadlineHandle);
      record.cleanupDeadlineHandle = undefined;
    }
    this._sessionRecords.delete(record.normalized.id);
    this._sessionQueues.delete(record.normalized.id);
    record.pendingCleanup = undefined;
    record.pendingCleanupPromise = undefined;
    record.pendingCleanupErrorHandler = undefined;
  }

  private _disposeSessionMedia(record: WebphoneV2SessionRecord) {
    const disposePromise = this._webphoneMedia.disposeByCallId(
      record.session.callId,
    );
    if (disposePromise) {
      void disposePromise.catch((error) => {
        this.logger.error('Webphone V2 local call media cleanup failed', {
          ...getErrorLogContext(error),
        });
      });
    }
  }

  private _disposeSdkSession(record: WebphoneV2SessionRecord) {
    const callSessions = record.session.webPhone?.callSessions;
    const sessionIndex = callSessions?.indexOf(record.session) ?? -1;
    if (sessionIndex !== -1) callSessions?.splice(sessionIndex, 1);
    try {
      record.session.dispose();
    } catch (error) {
      this.logger.error('Webphone V2 SDK session disposal failed', {
        ...getErrorLogContext(error),
      });
    }
  }

  private _forceReleaseSession(record: WebphoneV2SessionRecord) {
    if (!record.pendingCleanup) return;
    const errorHandler = record.pendingCleanupErrorHandler;
    record.pendingCleanupErrorHandler = undefined;
    this._disposeSessionMedia(record);
    this._disposeSdkSession(record);
    this._releaseSession(record);
    try {
      errorHandler?.(
        new Error(`Webphone ${record.normalized.id} cleanup timed out`),
      );
    } catch (error) {
      this.logger.error('Webphone V2 cleanup error handler failed', {
        ...getErrorLogContext(error),
      });
    }
  }

  private _cleanupRetainedSession(
    record: WebphoneV2SessionRecord,
  ): Promise<void> {
    if (!record.pendingCleanup) return Promise.resolve();
    if (record.pendingCleanupPromise) return record.pendingCleanupPromise;
    const cleanupPromise = this._runRetainedCleanup(record);
    record.pendingCleanupPromise = cleanupPromise;
    void cleanupPromise
      .finally(() => {
        if (record.pendingCleanupPromise === cleanupPromise) {
          record.pendingCleanupPromise = undefined;
        }
      })
      .catch(() => undefined);
    return cleanupPromise;
  }

  private async _runRetainedCleanup(record: WebphoneV2SessionRecord) {
    if (
      record.session.state === 'failed' ||
      record.session.state === 'disposed'
    ) {
      this._releaseSession(record);
      return;
    }

    const stateAtStart = record.session.state;
    if (stateAtStart === 'init') return;

    try {
      if (
        stateAtStart === 'ringing' &&
        record.session.direction === 'outbound'
      ) {
        await this._withDeadline(
          (
            record.session as WebPhoneSession & { cancel(): Promise<void> }
          ).cancel(),
          `cancel ${record.normalized.id}`,
          SESSION_CLEANUP_TIMEOUT,
        );
        const stateAfterCancel = record.session.state as string;
        if (stateAfterCancel === 'answered') {
          await this._withDeadline(
            record.session.hangup(),
            `hangup call ${record.normalized.id}`,
            SESSION_CLEANUP_TIMEOUT,
          );
          this._disposeSdkSession(record);
          this._releaseSession(record);
        } else if (
          stateAfterCancel === 'failed' ||
          stateAfterCancel === 'disposed'
        ) {
          this._releaseSession(record);
        }
        return;
      }

      await this._withDeadline(
        record.session.hangup(),
        `hangup call ${record.normalized.id}`,
        SESSION_CLEANUP_TIMEOUT,
      );
      this._disposeSdkSession(record);
      this._releaseSession(record);
    } catch (error) {
      const errorHandler = record.pendingCleanupErrorHandler;
      record.pendingCleanupErrorHandler = undefined;
      try {
        errorHandler?.(error);
      } catch (handlerError) {
        this.logger.error(
          'Webphone V2 cleanup error handler failed',
          getErrorLogContext(handlerError),
        );
      }
      this.logger.error('Webphone V2 session cleanup failed', {
        ...getErrorLogContext(error),
      });
    }
  }

  private _finalizeSession(
    record: WebphoneV2SessionRecord,
    errorCode?: WebphoneNormalizedSession['errorCode'],
    retainForCleanup = false,
  ) {
    if (record.finalized) return;
    this.logger.info('Webphone V2 session finalized', {
      direction: record.session.direction,
      errorCode: errorCode ?? record.normalized.errorCode ?? null,
      retainForCleanup,
      sessionCount: this._sessionRecords.size,
    });
    record.finalized = true;
    record.revision += 1;
    const terminalSession = {
      ...normalizeSession({
        session: record.session,
        previous: record.normalized,
        record,
      }),
      callStatus: sessionStatus.finished,
      removed: true,
      errorCode: errorCode ?? record.normalized.errorCode,
    };
    record.normalized = terminalSession;
    const isSetupTerminalSession =
      !retainForCleanup &&
      record.session.direction === 'outbound' &&
      SETUP_TERMINAL_STATES.has(record.session.state);
    if (isSetupTerminalSession) {
      this._disposeSessionMedia(record);
      this._disposeSdkSession(record);
    }
    if (retainForCleanup) {
      record.pendingCleanup = true;
      this._disposeSessionMedia(record);
      record.cleanupDeadlineHandle = setTimeout(() => {
        this._forceReleaseSession(record);
      }, SESSION_CLEANUP_TIMEOUT);
    } else {
      this._releaseSession(record);
    }
    this._publishLiveState();
    if (!this._isSilentToCallEvents(record)) {
      this._publishCallEvent('callEnd', terminalSession);
    }
  }

  private _finalizeSessions(webPhone?: WebPhone) {
    for (const record of [...this._sessionRecords.values()]) {
      if (
        webPhone &&
        record.session.webPhone &&
        record.session.webPhone !== webPhone
      ) {
        continue;
      }
      if (record.finalized) {
        this._releaseSession(record);
        continue;
      }
      this._finalizeSession(record);
    }
  }

  private _handleMediaOwnerLoss(loss: WebphoneMediaOwnerLoss) {
    this._pendingMediaOwnerLoss = this._mergeMediaOwnerLoss(
      this._pendingMediaOwnerLoss,
      loss,
    );
    if (this._mediaOwnerRecoveryPromise) return this._mediaOwnerRecoveryPromise;
    this._mediaOwnerRecoveryPromise = this._drainMediaOwnerLosses().finally(
      () => {
        this._mediaOwnerRecoveryPromise = undefined;
      },
    );
    return this._mediaOwnerRecoveryPromise;
  }

  private async _drainMediaOwnerLosses() {
    while (this._pendingMediaOwnerLoss) {
      const loss = this._pendingMediaOwnerLoss;
      this._pendingMediaOwnerLoss = undefined;
      this.logger.info('Webphone V2 processing media owner loss', {
        ownerRevision: loss.ownerRevision,
        affectedCallCount: loss.callIds.length,
        policy: this._options?.mediaOwnerLossPolicy ?? 'end',
      });
      if (this._options?.mediaOwnerLossPolicy === 'recover') {
        await this._recoverMediaOwnerLoss(loss);
      } else {
        await this._endMediaOwnerLoss(loss);
      }
    }
  }

  private _mergeMediaOwnerLoss(
    pending: WebphoneMediaOwnerLoss | undefined,
    next: WebphoneMediaOwnerLoss,
  ): WebphoneMediaOwnerLoss {
    if (!pending) return next;
    return {
      ownerRevision: next.ownerRevision,
      callIds: [...new Set([...pending.callIds, ...next.callIds])],
    };
  }

  private _getMediaOwnerLossRecords(loss: WebphoneMediaOwnerLoss) {
    const callIds = new Set(loss.callIds);
    return [...this._sessionRecords.values()].filter(
      (record) => !record.finalized && callIds.has(record.session.callId),
    );
  }

  private async _endMediaOwnerLoss(loss: WebphoneMediaOwnerLoss) {
    const records = this._getMediaOwnerLossRecords(loss);
    this.logger.warn('Webphone V2 ending calls after media owner loss', {
      affectedCallCount: records.length,
    });
    for (const record of records) {
      this._finalizeSession(record, 'mediaOwnerLost', true);
      void this._cleanupRetainedSession(record);
    }
  }

  private async _recoverMediaOwnerLoss(loss: WebphoneMediaOwnerLoss) {
    const records = this._getMediaOwnerLossRecords(loss).sort(
      (left, right) =>
        Number(left.normalized.isOnHold) - Number(right.normalized.isOnHold),
    );
    if (!records.length) {
      this.logger.debug('Webphone V2 media owner loss had no live calls');
      return;
    }

    try {
      this.logger.info('Webphone V2 rebinding media owner', {
        affectedCallCount: records.length,
      });
      await this._withDeadline(
        this._webphoneMedia.rebindMediaOwner(),
        'media owner recovery',
      );
    } catch (error) {
      this.logger.error('Webphone V2 media owner recovery failed', {
        ...getErrorLogContext(error),
        affectedCallCount: records.length,
      });
      await this._endMediaOwnerLoss(loss);
      return;
    }

    let recoveredCallCount = 0;
    for (const record of records) {
      if (record.finalized) continue;
      try {
        await this._withDeadline(
          record.session.reInvite(!record.normalized.isOnHold),
          `media recovery ${record.normalized.id}`,
        );
        recoveredCallCount += 1;
      } catch (error) {
        this.logger.error('Webphone V2 media session recovery failed', {
          ...getErrorLogContext(error),
          onHold: record.normalized.isOnHold,
        });
        this._finalizeSession(record, 'mediaOwnerLost', true);
        void this._cleanupRetainedSession(record);
      }
    }
    if (recoveredCallCount > 0) {
      this._recoveryEventsSubject.next({ recoveredCallCount });
    }
  }

  private _handleSipUpdate(message: unknown) {
    const method = getHeader(message, 'CSeq');
    if (!method?.toUpperCase().includes('UPDATE')) return;
    const callId = getHeader(message, 'Call-ID');
    const assertedIdentity = getHeader(message, 'P-Asserted-Identity');
    if (!callId || !assertedIdentity) return;
    const record = [...this._sessionRecords.values()].find(
      (candidate) =>
        !candidate.finalized &&
        candidate.session.direction === 'inbound' &&
        candidate.session.callId.toLowerCase() === callId.toLowerCase(),
    );
    const identity = getTransferIdentity(assertedIdentity);
    if (!record || !identity) return;
    const currentNumber = record.normalized.fromNumber;
    if (identity.number === currentNumber) {
      if (identity.name && identity.name !== record.normalized.fromUserName) {
        record.displayedFromName = identity.name;
        record.normalized = {
          ...record.normalized,
          fromUserName: identity.name,
        };
        this._publishLiveState();
      }
      return;
    }
    record.receivedTransferFromNumber ??= currentNumber;
    record.receivedTransferFromName ??= record.normalized.fromUserName;
    record.displayedFromNumber = identity.number;
    record.displayedFromName = identity.name;
    record.normalized = {
      ...record.normalized,
      from: identity.number,
      fromNumber: identity.number,
      fromUserName: identity.name,
      isReceivedTransfer: true,
      receivedTransferFromNumber: record.receivedTransferFromNumber,
      receivedTransferFromName: record.receivedTransferFromName,
    };
    this._publishLiveState();
  }

  private _attachWebPhoneListeners(webPhone: WebPhone) {
    const source = webPhone as unknown as WebPhoneEventSource;
    if (typeof source.on !== 'function') return;
    const sipClientSource =
      webPhone.sipClient as unknown as WebPhoneEventSource;
    const inboundCall = (session: WebPhoneSession) =>
      this._bindSession(session, 'callRing');
    const outboundCall = (session: WebPhoneSession) =>
      this._bindSession(session, 'callInit', this._pendingOutboundMetadata);
    const inboundMessage = (message: unknown) => {
      this.logger.debug(
        formatTransportEventSummary(
          'SIP message',
          summarizeSipMessage('inbound', message),
        ),
      );
      this._handleSipUpdate(message);
    };
    const outboundMessage = (message: unknown) => {
      this.logger.debug(
        formatTransportEventSummary(
          'SIP message',
          summarizeSipMessage('outbound', message),
        ),
      );
    };
    source.on('inboundCall', inboundCall);
    source.on('outboundCall', outboundCall);
    sipClientSource.on('inboundMessage', inboundMessage);
    sipClientSource.on('outboundMessage', outboundMessage);
    this._webPhoneCleanup.set(webPhone, () => {
      source.off('inboundCall', inboundCall);
      source.off('outboundCall', outboundCall);
      sipClientSource.off('inboundMessage', inboundMessage);
      sipClientSource.off('outboundMessage', outboundMessage);
    });
  }

  private _emitRegistration(
    event: 'webphoneRegistered' | 'webphoneUnregistered',
  ) {
    if (event === 'webphoneRegistered') {
      if (this._registered) return;
      this._registered = true;
    } else {
      if (!this._registered) return;
      this._registered = false;
    }
    this._eventEmitter.emit(event);
  }

  private _getSession(sessionId: string) {
    return [...this._sessionRecords.values()].find(
      (record) => record.normalized.id === sessionId,
    );
  }

  private _requireSession(sessionId: string) {
    const record = this._getSession(sessionId);
    if (!record || record.finalized) {
      throw new Error(`Webphone session ${sessionId} is unavailable`);
    }
    return record;
  }

  private _runDestructiveCommand<T>(
    record: WebphoneV2SessionRecord,
    command: string,
    operation: () => Promise<T> | T,
  ) {
    if (record.destructiveCommand) {
      return Promise.reject(
        new Error(
          `Webphone session ${record.normalized.id} is busy: ${command}`,
        ),
      );
    }
    const commandPromise = Promise.resolve().then(operation);
    record.destructiveCommand = commandPromise;
    void commandPromise.then(
      () => {
        if (record.destructiveCommand === commandPromise) {
          record.destructiveCommand = undefined;
        }
      },
      () => {
        if (record.destructiveCommand === commandPromise) {
          record.destructiveCommand = undefined;
        }
      },
    );
    return commandPromise;
  }

  private _updateSession(
    record: WebphoneV2SessionRecord,
    update: Partial<WebphoneNormalizedSession>,
  ) {
    if (record.finalized) return;
    record.revision += 1;
    record.normalized = {
      ...record.normalized,
      ...update,
      lastActiveTime: Date.now(),
    };
    this._publishLiveState();
  }

  private async _withDeadline<T>(
    operation: Promise<T>,
    name: string,
    timeout = COMMAND_DEADLINE,
  ) {
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        operation,
        new Promise<T>((_, reject) => {
          timeoutHandle = setTimeout(
            () => reject(new Error(`Webphone ${name} timed out`)),
            timeout,
          );
        }),
      ]);
    } finally {
      if (timeoutHandle) clearTimeout(timeoutHandle);
    }
  }

  private _installSipRequestCorrelation(webPhone: WebPhone) {
    const sipClient = webPhone.sipClient as unknown as SipClientWithSend;
    const send = sipClient.send;
    if (typeof send !== 'function') return;
    const originalSend = send.bind(sipClient);

    sipClient.send = (message, waitForReply = false) => {
      if (isRegisterSipMessage(message)) {
        const endpointId = this._auth.endpointId;
        const withEpt = this.engageAgentEptEnabled && !!endpointId;
        if (withEpt) {
          applyEngageAgentEptRegisterHeaders(message, endpointId);
        } else if (endpointId) {
          applyEndpointIdRegisterHeader(message, endpointId);
        }
        this._registeredEngageAgentEpt = withEpt;
        if (this.engageAgentEptEnabled) {
          this.logger.info('Webphone V2 REGISTER EPT headers', {
            engageAgentEptEnabled: this.engageAgentEptEnabled,
            applied: withEpt,
            headerNames: withEpt
              ? [...ENGAGE_AGENT_EPT_REGISTER_HEADER_NAMES]
              : [],
          });
        }
      }
      if (!waitForReply) return originalSend(message, false);
      const callId = getHeader(message, 'Call-ID');
      const cseq = getHeader(message, 'CSeq')?.trim().split(/\s+/)[0];
      if (!callId || !cseq) return originalSend(message, true);

      return new Promise<unknown>((resolve, reject) => {
        const handler = (response: unknown) => {
          const responseCseq = getHeader(response, 'CSeq')
            ?.trim()
            .split(/\s+/)[0];
          if (
            !hasCallId(response, callId) ||
            responseCseq !== cseq ||
            getSipSubject(response).startsWith('SIP/2.0 100 ')
          ) {
            return;
          }
          sipClient.off('inboundMessage', handler);
          resolve(response);
        };
        sipClient.on('inboundMessage', handler);
        void Promise.resolve()
          .then(() => originalSend(message, false))
          .catch((error) => {
            sipClient.off('inboundMessage', handler);
            reject(error);
          });
      });
    };
  }

  private async _withSessionSipCompletion<T>(
    operation: () => Promise<T>,
    matches: (message: unknown) => boolean,
    name: string,
  ) {
    const sipClient = this._webPhone?.sipClient as
      | WebPhoneEventSource
      | undefined;
    if (!sipClient) return this._withDeadline(operation(), name);

    let resolveCompletion!: () => void;
    let rejectCompletion!: (error: unknown) => void;
    const completion = new Promise<void>((resolve, reject) => {
      resolveCompletion = resolve;
      rejectCompletion = reject;
    });
    const handler = (message: unknown) => {
      try {
        if (matches(message)) resolveCompletion();
      } catch (error) {
        rejectCompletion(error);
      }
    };
    sipClient.on('inboundMessage', handler);
    try {
      const [result] = await this._withDeadline(
        Promise.all([Promise.resolve().then(operation), completion]),
        name,
      );
      return result;
    } finally {
      sipClient.off('inboundMessage', handler);
    }
  }

  private async _holdOtherSessions(currentSessionId: string | null) {
    for (const record of this._sessionRecords.values()) {
      if (
        record.normalized.id === currentSessionId ||
        record.finalized ||
        record.normalized.isOnHold ||
        // Divergence from upstream: never auto-hold a call that is playing a
        // pre-recorded voicemail. Holding it stops the recorded audio reaching
        // the callee, who then gets a silent message. Legacy achieved the same
        // by marking the session `__rc_localHold` up front — its comment reads
        // "prevent the call be held when user start another call" — while still
        // reporting `isOnHold: false` to the UI.
        isDroppingVoicemail(record.normalized.voicemailDropStatus) ||
        record.isCxOffhook ||
        // Held before its drop status lands, the callee's mailbox would record
        // hold music instead of the message.
        record.isCxVoicemailDrop ||
        record.normalized.callStatus === sessionStatus.connecting ||
        record.normalized.callStatus === sessionStatus.setup
      ) {
        continue;
      }
      await this._withDeadline(
        record.session.hold(),
        `hold ${record.normalized.id}`,
      );
      this._updateSession(record, { isOnHold: true });
      this._publishCallEvent('callHold', record.normalized);
    }
  }

  private async _playExtendedControls(record: WebphoneV2SessionRecord) {
    const controls = record.extendedControls;
    if (!controls) return;
    for (const control of controls) {
      if (record.finalized) return;
      if (control === ',') {
        await new Promise((resolve) => setTimeout(resolve, 2_000));
        continue;
      }
      record.session.sendDtmf(control, 100);
    }
  }

  private async _createOutboundSession(
    toNumber: string,
    fromNumber?: string,
    headers?: Record<string, string>,
    metadata?: WebphoneSessionMetadata,
  ) {
    if (!this._webPhone) throw new Error('Webphone is not connected');
    await this._holdOtherSessions(null);
    await this.ensureMediaOwner();
    const existingSessions = new Set(this._webPhone.callSessions);
    const source = this._webPhone as unknown as WebPhoneEventSource;
    let emittedSession: WebPhoneSession | undefined;
    const captureOutboundCall = (session: WebPhoneSession) => {
      emittedSession = session;
    };
    source.on('outboundCall', captureOutboundCall);
    const previousOutboundMetadata = this._pendingOutboundMetadata;
    this._pendingOutboundMetadata = metadata;
    let callPromise: Promise<unknown>;
    try {
      callPromise = this._webPhone.call(toNumber, fromNumber, { headers });
    } finally {
      this._pendingOutboundMetadata = previousOutboundMetadata;
      source.off('outboundCall', captureOutboundCall);
    }
    const session =
      emittedSession ??
      this._webPhone.callSessions.find(
        (candidate) => !existingSessions.has(candidate),
      );
    if (!session) {
      await this._withDeadline(callPromise, 'outbound call');
      throw new Error('SDK did not emit an outbound session');
    }
    const record = this._bindSession(session, 'callInit', metadata)!;
    this._watchOutboundCall(callPromise, record);
    return record;
  }

  private _watchOutboundCall(
    callPromise: Promise<unknown>,
    record: WebphoneV2SessionRecord,
  ) {
    const timeoutHandle = setTimeout(() => {
      if (record.finalized || record.session.state === 'answered') return;
      record.pendingSetupErrorCode = 'callSetupTimeout';
      record.cancelRequested = true;
      this._finalizeSession(record, 'callSetupTimeout', true);
      void this._cleanupRetainedSession(record);
    }, COMMAND_DEADLINE);
    void callPromise.then(
      () => {
        clearTimeout(timeoutHandle);
        if (record.pendingCleanup) {
          if (record.session.state === 'init') {
            this._forceReleaseSession(record);
            return;
          }
          void this._cleanupRetainedSession(record);
          return;
        }
        if (record.finalized) return;
        if (record.session.state === 'init') {
          this._finalizeSession(
            record,
            record.pendingSetupErrorCode ?? 'callSetupFailed',
          );
          return;
        }
        if (record.cancelRequested && record.session.state === 'ringing') {
          void this._cancelOutboundSession(
            record,
            record.pendingSetupErrorCode,
          );
        }
      },
      (error) => {
        clearTimeout(timeoutHandle);
        this.logger.error('Webphone V2 outbound call failed', {
          ...getErrorLogContext(error),
        });
        if (record.pendingCleanup) {
          this._forceReleaseSession(record);
          return;
        }
        if (!record.finalized) {
          this._finalizeSession(
            record,
            record.pendingSetupErrorCode ?? 'callSetupFailed',
          );
        }
      },
    );
  }

  private async _cancelOutboundSession(
    record: WebphoneV2SessionRecord,
    errorCode?: WebphoneNormalizedSession['errorCode'],
  ) {
    if (
      (record.finalized && !record.pendingCleanup) ||
      record.session.direction !== 'outbound'
    ) {
      return;
    }
    if (record.pendingCleanup) {
      await this._cleanupRetainedSession(record);
      return;
    }
    record.cancelRequested = true;
    if (record.session.state === 'init') return;
    const pendingCancelErrorHandler = record.pendingCancelErrorHandler;
    try {
      await this._withDeadline(
        (
          record.session as WebPhoneSession & { cancel(): Promise<void> }
        ).cancel(),
        `cancel ${record.normalized.id}`,
      );
    } catch (error) {
      if (pendingCancelErrorHandler) pendingCancelErrorHandler(error);
      this.logger.error('Webphone V2 outbound cancel failed', {
        ...getErrorLogContext(error),
      });
    } finally {
      record.pendingCancelErrorHandler = undefined;
      if (!record.pendingCleanup) {
        this._finalizeSession(record, errorCode);
      }
    }
  }

  async makeCall({
    toNumber,
    fromNumber,
    extendedControls,
    transferSessionId,
  }: WebphoneMakeCallParams) {
    if (!this.connected) await this.connect();
    const record = await this._createOutboundSession(
      toNumber,
      fromNumber,
      undefined,
      {
        extendedControls: extendedControls?.join(''),
        warmTransferSessionId: transferSessionId,
      },
    );
    return { id: record.normalized.id };
  }

  async answer(sessionId: string) {
    const record = this._requireSession(sessionId);
    await this._answerInbound(record, { holdOthers: true });
  }

  /**
   * Answers a hidden RingCX voicemail-drop call with no microphone and no
   * speaker, leaving every other call as it is.
   *
   * The media is marked silent before the SDK asks for the SDP answer, so the
   * agent's microphone never reaches the callee, not even briefly.
   */
  async answerCxVoicemailDrop(sessionId: string) {
    const record = this._requireSession(sessionId);
    if (!this._isHiddenCxVoicemailDrop(record)) {
      return;
    }
    await this._webphoneMedia.markCallSilent(record.normalized.callId);
    await this._answerInbound(record, { holdOthers: false });
  }

  private async _answerInbound(
    record: WebphoneV2SessionRecord,
    { holdOthers }: { holdOthers: boolean },
  ) {
    const sessionId = record.normalized.id;
    if (
      record.normalized.direction !== 'Inbound' ||
      record.normalized.callStatus !== sessionStatus.connecting
    ) {
      return;
    }
    await this._runDestructiveCommand(record, 'answer', async () => {
      if (holdOthers) {
        await this._holdOtherSessions(sessionId);
      }
      await this.ensureMediaOwner();
      const session = record.session as InboundWebPhoneSession;
      let resolveAnswered!: () => void;
      const answered = new Promise<void>((resolve) => {
        resolveAnswered = resolve;
      });
      session.on('answered', resolveAnswered);
      try {
        const operation = Promise.resolve().then(() => session.answer());
        // The SDK emits `answered` before its Cmd=7 tail resolves.
        await this._withDeadline(
          Promise.race([answered, operation.then(() => answered)]),
          `answer ${sessionId}`,
        );
      } finally {
        session.off('answered', resolveAnswered);
      }
    });
  }

  async reject(sessionId: string) {
    const record = this._requireSession(sessionId);
    if (record.normalized.direction !== 'Inbound') return;
    if (record.isCxOffhook) {
      await this._runDestructiveCommand(record, 'reject', () =>
        this._declineLocally(record),
      );
      return;
    }
    // A queue call has to be ignored through call control, otherwise the queue
    // keeps offering it to this device.
    if (record.normalized.callQueueName) {
      await this._runDestructiveCommand(record, 'reject', () =>
        this._withDeadline(
          (record.session as InboundWebPhoneSession).decline(),
          `decline ${sessionId}`,
        ),
      );
      return;
    }
    await this._runDestructiveCommand(record, 'reject', async () => {
      await this._declineLocally(record);
      this._ignoreSubject.next(sessionId);
    });
  }

  async resume(sessionId: string) {
    return this.unhold(sessionId);
  }

  async forward(sessionId: string, forwardNumber: string) {
    const record = this._requireSession(sessionId);
    await this._runDestructiveCommand(record, 'forward', async () => {
      await this._withSessionSipCompletion(
        () => (record.session as InboundWebPhoneSession).forward(forwardNumber),
        (message) =>
          hasCallId(message, record.session.callId) &&
          getSipSubject(message).startsWith('CANCEL sip:'),
        `forward ${sessionId}`,
      );
      this._updateSession(record, { isForwarded: true });
      this._finalizeSession(record);
    });
  }

  async mute(sessionId: string, errorHandler?: (error: unknown) => void) {
    try {
      const record = this._requireSession(sessionId);
      record.session.mute();
      this._updateSession(record, { isOnMute: true });
    } catch (error) {
      errorHandler?.(error);
      throw error;
    }
  }

  async unmute(sessionId: string) {
    const record = this._requireSession(sessionId);
    record.session.unmute();
    this._updateSession(record, { isOnMute: false });
  }

  async hold(sessionId: string, errorHandler?: (error: unknown) => void) {
    try {
      const record = this._requireSession(sessionId);
      if (record.normalized.isOnHold) return;
      // Divergence from upstream: a call playing a pre-recorded voicemail must
      // never be held — the callee would hear hold music instead of the
      // message. Guarding here rather than only in `_holdOtherSessions` closes
      // every caller at once, including micro-phone's own view-level auto-hold
      // (`CallView/Call.view.tsx` holds the previously active call when a new
      // outbound call appears) and user-initiated holds. Legacy achieved this
      // by pre-setting `__rc_localHold` so that check saw the call as already
      // held.
      if (
        isDroppingVoicemail(record.normalized.voicemailDropStatus) ||
        record.isCxVoicemailDrop
      ) {
        this.logger.info('Webphone hold skipped while dropping voicemail', {
          sessionId,
        });
        return;
      }
      await this._withDeadline(record.session.hold(), `hold ${sessionId}`);
      this._updateSession(record, { isOnHold: true });
      this._publishCallEvent('callHold', record.normalized);
    } catch (error) {
      errorHandler?.(error);
      throw error;
    }
  }

  async unhold(sessionId: string, errorHandler?: (error: unknown) => void) {
    try {
      const record = this._requireSession(sessionId);
      if (!record.normalized.isOnHold) return;
      await this._holdOtherSessions(sessionId);
      this._eventEmitter.emit(
        'beforeCallResume',
        record.normalized,
        this.activeSession,
      );
      await this._withDeadline(record.session.unhold(), `unhold ${sessionId}`);
      this._updateSession(record, { isOnHold: false });
      this._publishCallEvent('callResume', record.normalized);
    } catch (error) {
      errorHandler?.(error);
      throw error;
    }
  }

  async startRecord(sessionId: string) {
    const record = this._requireSession(sessionId);
    if (record.normalized.callStatus === sessionStatus.connecting) return;
    const previousStatus = record.normalized.recordStatus;
    this._updateSession(record, { recordStatus: recordStatus.pending });
    try {
      const result = await this._withDeadline(
        record.session.startRecording(),
        `start recording ${sessionId}`,
      );
      if (result.code !== 0) throw commandError(result);
      this._updateSession(record, { recordStatus: recordStatus.recording });
    } catch (error) {
      this._updateSession(record, {
        recordStatus:
          (error as { code?: number }).code === -5
            ? recordStatus.noAccess
            : previousStatus,
      });
      throw error;
    }
  }

  async stopRecord(sessionId: string, errorHandler?: (error: unknown) => void) {
    let previousStatus: WebphoneNormalizedSession['recordStatus'] =
      recordStatus.recording;
    try {
      const record = this._requireSession(sessionId);
      previousStatus = record.normalized.recordStatus;
      this._updateSession(record, { recordStatus: recordStatus.pending });
      const result = await this._withDeadline(
        record.session.stopRecording(),
        `stop recording ${sessionId}`,
      );
      if (result.code !== 0) throw commandError(result);
      this._updateSession(record, { recordStatus: recordStatus.idle });
    } catch (error) {
      const record = this._getSession(sessionId);
      if (record) this._updateSession(record, { recordStatus: previousStatus });
      errorHandler?.(error);
      throw error;
    }
  }

  /**
   * DIVERGENCE from micro/next: the park extension is returned instead of
   * discarded. This app shows the park location to the user (park view result
   * page and the `parked` toast), so the destination has to travel back out.
   */
  async park(sessionId: string): Promise<string | undefined> {
    const record = this._requireSession(sessionId);
    return this._runDestructiveCommand(record, 'park', async () => {
      const result = await this._withDeadline(
        record.session.park(),
        `park ${sessionId}`,
      );
      if (result.code !== 0) throw commandError(result);
      this._finalizeSession(record);
      const parkExtension = result['park extension'];
      return parkExtension ? `*${parkExtension}` : undefined;
    });
  }

  /**
   * DIVERGENCE from micro/next: the return type admits `undefined` so the
   * app-level subclass can report "no destination" (see `Webphone`) instead of
   * letting a failed park surface as an unhandled rejection in the park view.
   */
  async parkToLocation({
    sessionId,
    location,
  }: WebphoneParkToLocationParams): Promise<string | undefined> {
    const validSessionId = requireNonEmptyValue(sessionId, 'sessionId');
    const locationId = requireNonEmptyValue(location?.id, 'location.id');
    let record: WebphoneV2SessionRecord;
    try {
      record = this._requireSession(validSessionId);
    } catch (error) {
      throw webphoneCommandError(
        'missingSession',
        'parkToLocation',
        error instanceof Error ? error.message : String(error),
      );
    }
    if (record.normalized.callStatus !== sessionStatus.connected) {
      throw webphoneCommandError(
        'terminalSession',
        'parkToLocation',
        `Webphone session ${validSessionId} is not connected`,
        record.session.callId,
      );
    }
    return this._runDestructiveCommand(record, 'parkToLocation', async () => {
      try {
        await this._withDeadline(
          record.session.transfer(`prk${locationId}`),
          `park to location ${validSessionId}`,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw webphoneCommandError(
          message.endsWith('timed out') ? 'deadlineExceeded' : 'unknown',
          'parkToLocation',
          message,
          record.session.callId,
        );
      }
      this._finalizeSession(record);
      return (
        location.name?.trim() || location.extensionNumber?.trim() || locationId
      );
    });
  }

  async transfer(transferNumber: string, sessionId: string) {
    const record = this._requireSession(sessionId);
    await this._runDestructiveCommand(record, 'transfer', async () => {
      this._updateSession(record, { isOnTransfer: true });
      try {
        await this._withDeadline(
          record.session.transfer(transferNumber),
          `transfer ${sessionId}`,
        );
        this._finalizeSession(record);
      } catch (error) {
        this._updateSession(record, { isOnTransfer: false });
        throw error;
      }
    });
  }

  async startWarmTransfer(transferNumber: string, sessionId: string) {
    const record = this._requireSession(sessionId);
    return this._runDestructiveCommand(
      record,
      'startWarmTransfer',
      async () => {
        const wasOnHold = record.normalized.isOnHold;
        this._updateSession(record, { isOnTransfer: true, isOnHold: true });
        if (!wasOnHold) this._publishCallEvent('callHold', record.normalized);
        try {
          const result = await this._withDeadline(
            record.session.warmTransfer(transferNumber),
            `warm transfer ${sessionId}`,
          );
          const newRecord = this._bindSession(result.newSession, 'callInit', {
            warmTransferSessionId: sessionId,
          });
          return { id: newRecord.normalized.id };
        } catch (error) {
          let sourceIsHeld = wasOnHold;
          try {
            if (!wasOnHold) {
              await this._withDeadline(
                record.session.unhold(),
                `unhold warm transfer source ${sessionId}`,
              );
              sourceIsHeld = false;
            }
          } catch (recoveryError) {
            this.logger.error(
              'Webphone V2 warm transfer recovery failed',
              getErrorLogContext(recoveryError),
            );
          }
          this._updateSession(record, {
            isOnTransfer: false,
            isOnHold: sourceIsHeld,
          });
          throw error;
        }
      },
    );
  }

  async completeWarmTransfer(newSessionId: string) {
    const newRecord = this._requireSession(newSessionId);
    const oldSessionId = newRecord.warmTransferSessionId;
    if (!oldSessionId) throw new Error(`Warm transfer source is unavailable`);
    const oldRecord = this._requireSession(oldSessionId);
    await this._runDestructiveCommand(newRecord, 'completeWarmTransfer', () =>
      this._runDestructiveCommand(
        oldRecord,
        'completeWarmTransfer',
        async () => {
          await this._withDeadline(
            oldRecord.session.completeWarmTransfer(newRecord.session),
            `complete warm transfer ${newSessionId}`,
          );
          this._updateSession(oldRecord, { isOnTransfer: false });
          this._updateSession(newRecord, { isOnTransfer: false });
        },
      ),
    );
  }

  async flip(flipValue: string, sessionId: string) {
    const record = this._requireSession(sessionId);
    await this._withDeadline(
      record.session.flip(flipValue),
      `flip ${sessionId}`,
    );
    this._updateSession(record, { isOnFlip: true });
  }

  async sendDTMF(dtmfValue: string, sessionId: string) {
    const record = this._requireSession(sessionId);
    record.session.sendDtmf(dtmfValue, 100);
  }

  async hangup(sessionId: string, errorHandler?: (error: unknown) => void) {
    const record = this._requireSession(sessionId);
    await this._runDestructiveCommand(record, 'hangup', () => {
      this._eventEmitter.emit(
        'beforeCallEnd',
        record.normalized,
        this.activeSession,
      );
      const outboundSetup =
        record.session.direction === 'outbound' &&
        record.session.state !== 'answered';
      if (outboundSetup) {
        record.cancelRequested = true;
        record.pendingCancelErrorHandler = errorHandler;
        record.pendingCleanupErrorHandler = errorHandler;
        this._finalizeSession(record, undefined, true);
        void this._cleanupRetainedSession(record);
        return;
      }
      if (record.session.direction === 'outbound') {
        record.pendingCleanupErrorHandler = errorHandler;
        this._finalizeSession(record, undefined, true);
        void this._cleanupRetainedSession(record);
        return;
      }
      record.pendingCleanupErrorHandler = errorHandler;
      this._finalizeSession(record, undefined, true);
      void this._cleanupRetainedSession(record);
    });
  }

  async toVoiceMail(sessionId: string) {
    const record = this._requireSession(sessionId);
    const session = record.session as InboundWebPhoneSession;
    if (typeof session.toVoicemail !== 'function') {
      throw new Error(
        `Webphone session ${sessionId} cannot be sent to voicemail`,
      );
    }
    await this._runDestructiveCommand(record, 'toVoiceMail', async () => {
      this._updateSession(record, { isToVoicemail: true });
      try {
        await this._withDeadline(
          session.toVoicemail(),
          `voicemail ${sessionId}`,
        );
      } catch (error) {
        this._updateSession(record, { isToVoicemail: false });
        throw error;
      }
    });
  }

  async replyWithMessage(sessionId: string, replyOptions: SessionReplyOptions) {
    const record = this._requireSession(sessionId);
    if (record.session.direction !== 'inbound') {
      throw new Error(`Webphone session ${sessionId} cannot receive a reply`);
    }
    return this._runDestructiveCommand(record, 'replyWithMessage', async () => {
      const options = getReplyOptions(replyOptions);
      await this._withSessionSipCompletion(
        () => (record.session as InboundWebPhoneSession).reply(options),
        (message) =>
          hasRcCommand(message, record.session.callId, SESSION_CLOSE_COMMAND),
        `reply with message ${sessionId}`,
      );
      this._updateSession(record, { isReplied: true });
      return true;
    });
  }

  async switchCall(
    activeCall: WebphoneSwitchCallParams,
    _homeCountryId: string,
  ) {
    const headers = {
      Replaces: `${activeCall.id};to-tag=${activeCall.sipData.fromTag};from-tag=${activeCall.sipData.toTag}`,
      'RC-call-type': 'replace',
    };
    const toNumber =
      activeCall.direction === 'Outbound'
        ? activeCall.to.phoneNumber
        : activeCall.from.phoneNumber;
    const fromNumber =
      activeCall.direction === 'Outbound'
        ? activeCall.from.phoneNumber
        : activeCall.to.phoneNumber;
    const record = await this._createOutboundSession(
      toNumber,
      fromNumber,
      headers,
    );
    return record.session.sessionId;
  }

  async pickupInboundCall({
    sessionId,
    toNumber,
    fromNumber,
    serverId,
  }: WebphonePickupInboundCallParams) {
    const record = await this._createOutboundSession(toNumber, fromNumber, {
      'RC-call-type': `inbound-pickup; session-id: ${sessionId}; server-id: ${serverId}`,
    });
    return {
      id: record.normalized.id,
      sessionId: record.session.sessionId,
      partyId: record.session.partyId,
    };
  }

  private async _pickMonitoredCall(
    params: WebphoneMonitoredPickupParams,
    prefix: 'prk' | 'gcp' | 'qpk',
  ): Promise<{ id: string } | null> {
    const extensionId = requireNonEmptyValue(
      params?.extensionId,
      'extensionId',
    );
    const fromNumber = requireNonEmptyValue(params?.fromNumber, 'fromNumber');
    const activeCall = params?.activeCall;
    if (!activeCall) throw new Error('Invalid activeCall');
    if (
      activeCall.direction !== 'Inbound' &&
      activeCall.direction !== 'Outbound'
    ) {
      throw new Error('Invalid activeCall.direction');
    }
    const telephonySessionId = requireNonEmptyValue(
      activeCall.telephonySessionId,
      'activeCall.telephonySessionId',
    );
    // DIVERGENCE from micro/next: `sipData` is optional here. Presence data
    // for a monitored extension does not always carry it, and the previous
    // service picked the call without a `Replaces` header in that case.
    const fromTag = activeCall.sipData?.fromTag;
    const toTag = activeCall.sipData?.toTag;
    const localParty =
      activeCall.direction === 'Inbound' ? activeCall.to : activeCall.from;
    const remoteParty =
      activeCall.direction === 'Inbound' ? activeCall.from : activeCall.to;
    const displayedFromNumber = requireNonEmptyValue(
      localParty?.phoneNumber,
      'activeCall local phoneNumber',
    );
    const displayedToNumber = requireNonEmptyValue(
      remoteParty?.phoneNumber,
      'activeCall remote phoneNumber',
    );
    const headers: Record<string, string> =
      fromTag && toTag
        ? {
            Replaces: `${telephonySessionId};to-tag=${fromTag};from-tag=${toTag};early-only`,
            'RC-call-type': 'replace',
          }
        : {};
    let record: WebphoneV2SessionRecord;
    try {
      record = await this._createOutboundSession(
        `${prefix}${extensionId}`,
        fromNumber,
        headers,
        {
          displayedFromName: localParty.name,
          displayedFromNumber,
          displayedToName: remoteParty.name,
          displayedToNumber,
        },
      );
    } catch (error) {
      this.logger.warn('Webphone V2 monitored pickup failed', {
        ...getErrorLogContext(error),
      });
      return null;
    }
    return { id: record.normalized.id };
  }

  async pickParkLocation(params: WebphoneMonitoredPickupParams) {
    return this._pickMonitoredCall(params, 'prk');
  }

  async pickGroupCall(params: WebphoneMonitoredPickupParams) {
    return this._pickMonitoredCall(params, 'gcp');
  }

  async pickCallQueueCall(params: WebphoneMonitoredPickupParams) {
    return this._pickMonitoredCall(params, 'qpk');
  }

  async updateSessionMatchedContact(
    sessionId: string,
    contact: { id: string },
  ) {
    this._updateSession(this._requireSession(sessionId), {
      contactMatch: contact,
    });
  }

  async changeInputDevice(deviceId: string, _sessionIds?: readonly string[]) {
    const records = this._getCommandRecords();
    await Promise.all(
      records.map((record) =>
        this._withDeadline(
          record.session.changeInputDevice(deviceId),
          `change input device ${record.normalized.id}`,
        ),
      ),
    );
  }

  async changeOutputDevice(deviceId: string, sessionIds?: readonly string[]) {
    const records = this._getCommandRecords(sessionIds);
    await Promise.all(
      records.map((record) =>
        this._withDeadline(
          record.session.changeOutputDevice(deviceId),
          `change output device ${record.normalized.id}`,
        ),
      ),
    );
  }

  private _getCommandRecords(sessionIds?: readonly string[]) {
    if (!sessionIds) {
      return [...this._sessionRecords.values()].filter(
        (record) => !record.finalized,
      );
    }
    return sessionIds.map((sessionId) => this._requireSession(sessionId));
  }

  async toggleMinimized(sessionId: string) {
    const record = this._requireSession(sessionId);
    this._updateSession(record, { minimized: !record.normalized.minimized });
  }

  onCallInit(handler: (...args: any[]) => void) {
    this._eventEmitter.on('callInit', handler);
    return () => this._eventEmitter.off('callInit', handler);
  }

  onCallRing(handler: (...args: any[]) => void) {
    this._eventEmitter.on('callRing', handler);
    return () => this._eventEmitter.off('callRing', handler);
  }

  onCallStart(handler: (...args: any[]) => void) {
    this._eventEmitter.on('callStart', handler);
    return () => this._eventEmitter.off('callStart', handler);
  }

  onBeforeCallEnd(handler: (...args: any[]) => void) {
    this._eventEmitter.on('beforeCallEnd', handler);
    return () => this._eventEmitter.off('beforeCallEnd', handler);
  }

  onCallEnd(handler: (...args: any[]) => void) {
    this._eventEmitter.on('callEnd', handler);
    return () => this._eventEmitter.off('callEnd', handler);
  }

  onCallHold(handler: (...args: any[]) => void) {
    this._eventEmitter.on('callHold', handler);
    return () => this._eventEmitter.off('callHold', handler);
  }

  onBeforeCallResume(handler: (...args: any[]) => void) {
    this._eventEmitter.on('beforeCallResume', handler);
    return () => this._eventEmitter.off('beforeCallResume', handler);
  }

  onCallResume(handler: (...args: any[]) => void) {
    this._eventEmitter.on('callResume', handler);
    return () => this._eventEmitter.off('callResume', handler);
  }

  onWebphoneRegistered(handler: () => void) {
    this._eventEmitter.on('webphoneRegistered', handler);
    return () => this._eventEmitter.off('webphoneRegistered', handler);
  }

  onWebphoneUnregistered(handler: () => void) {
    this._eventEmitter.on('webphoneUnregistered', handler);
    return () => this._eventEmitter.off('webphoneUnregistered', handler);
  }

  @action
  protected _setConnectionState(
    connectionStatus: WebphoneConnectionStatus,
    error?: unknown,
  ) {
    const previousStatus = this.connectionStatus;
    this.connectionStatus = connectionStatus;
    if (connectionStatus === 'connected') this.connectRetryCounts = 0;
    this.statusCode = getSipStatusCode(error);
    if (!error) {
      this.errorCode = null;
    } else {
      this.errorCode = isSipInstanceInterception(error)
        ? WEBPHONE_INSTANCE_INTERCEPTED_ERROR
        : 'webphoneRegistrationFailed';
    }
    if (previousStatus !== connectionStatus) {
      const context = {
        from: previousStatus,
        to: connectionStatus,
        statusCode: this.statusCode,
      };
      if (
        connectionStatus === 'connectFailed' ||
        connectionStatus === 'connectError'
      ) {
        this.logger.warn('Webphone V2 connection state changed', context);
      } else {
        this.logger.info('Webphone V2 connection state changed', context);
      }
    }
  }

  @action
  protected _setLiveDevice(device: SipRegistrationDeviceInfo | null) {
    this.device = device;
  }

  @action
  protected _beginConnect() {
    this._setConnectionState('connecting');
    this.connectRetryCounts += 1;
  }

  @action
  protected _setProvisionCache(cache: WebphoneV2ProvisionCache) {
    this.sipInfo = cache.sipInfo;
    this.provisionedDevice = cache.device;
    this.sipInfoEndpointId = cache.endpointId;
  }

  @action
  protected _clearProvisionCache() {
    this.sipInfo = null;
    this.provisionedDevice = null;
    this.sipInfoEndpointId = null;
  }

  @action
  protected _setSipInstanceId(instanceId: string | null) {
    this.sipInstanceId = instanceId;
  }

  protected _getSipInstanceId(): string {
    if (!this.sipInstanceId) {
      this._setSipInstanceId(createSipInstanceId());
    }
    return this.sipInstanceId!;
  }

  protected _getCachedProvision(): WebphoneV2ProvisionCache | null {
    const endpointId = this._auth.endpointId;
    if (!endpointId || !this.sipInfo || this.sipInfoEndpointId !== endpointId) {
      if (this.sipInfo || this.provisionedDevice || this.sipInfoEndpointId) {
        this._clearProvisionCache();
      }
      return null;
    }

    return {
      endpointId,
      sipInfo: this.sipInfo,
      device: this.provisionedDevice,
    };
  }

  protected async _provision(epoch: number): Promise<WebphoneV2ProvisionCache> {
    const endpointId = this._auth.endpointId;
    if (!endpointId) {
      throw new Error('Cannot provision Webphone without an endpoint ID');
    }

    const response = await this._client.service
      .platform()
      .post('/restapi/v1.0/client-info/sip-provision', {
        sipInfo: [{ transport: 'WSS' }],
      });
    const provision = (await response.json()) as CreateSipRegistrationResponse;
    const sipInfo = toSipInfo(provision);
    if (!sipInfo) {
      throw new Error('SIP provisioning response has no usable sipInfo');
    }

    const cache = {
      endpointId,
      sipInfo,
      device: provision.device ?? null,
    } satisfies WebphoneV2ProvisionCache;
    this._assertLifecycle(epoch);
    this._setProvisionCache(cache);
    return cache;
  }

  protected _createWebPhone(sipInfo: SipInfo) {
    const options: WebPhoneOptions = {
      sipInfo,
      instanceId: this._getSipInstanceId(),
      autoAnswer: false,
    };
    const webRtcSessionFactory =
      this._options?.webRtcSessionFactory ?? this._webphoneMedia.factory;
    if (webRtcSessionFactory)
      options.webRtcSessionFactory = webRtcSessionFactory;
    const webPhone = this._options?.webPhoneFactory
      ? this._options.webPhoneFactory(options)
      : new WebPhone(options);
    this._applyOutboundProxyPreference(webPhone, sipInfo);
    this._installSipRequestCorrelation(webPhone);
    return webPhone;
  }

  /**
   * Points a fresh SIP client at the backup outbound proxy when the main one
   * keeps failing.
   *
   * Each recovery builds a new `DefaultSipClient`, which always starts on the
   * main proxy, so the preference has to be re-applied before `start()`. The
   * deleted `SipClientInServer.Transport` used to rotate servers itself; this
   * restores that behaviour on top of the SDK's own
   * `toggleBackupOutboundProxy`.
   */
  protected _applyOutboundProxyPreference(webPhone: WebPhone, sipInfo: SipInfo) {
    if (!sipInfo?.outboundProxyBackup) return;
    const useBackup = this._shouldUseBackupOutboundProxy();
    const client = webPhone.sipClient as unknown as {
      toggleBackupOutboundProxy?: (enabled?: boolean) => void;
    };
    if (typeof client?.toggleBackupOutboundProxy !== 'function') return;
    client.toggleBackupOutboundProxy(useBackup);
    this.logger.info('Webphone V2 outbound proxy selected', {
      useBackup,
      socketRecoveryAttempt: this._socketRecoveryAttempt,
    });
  }

  /**
   * Alternates proxies every {@link PROXY_ROTATION_ATTEMPTS} failed attempts,
   * so a main-proxy outage cannot strand the webphone indefinitely.
   */
  protected _shouldUseBackupOutboundProxy() {
    if (this._socketRecoveryAttempt < PROXY_ROTATION_ATTEMPTS) return false;
    const round = Math.floor(
      this._socketRecoveryAttempt / PROXY_ROTATION_ATTEMPTS,
    );
    return round % 2 === 1;
  }

  protected async _disposeWebPhone(webPhone = this._webPhone) {
    if (!webPhone) return;
    this._webPhoneCleanup.get(webPhone)?.();
    this._webPhoneCleanup.delete(webPhone);
    const removeSocketCloseHandler = this._socketCleanup.get(webPhone);
    removeSocketCloseHandler?.();
    this._socketCleanup.delete(webPhone);
    if (this._webPhone === webPhone) {
      this._webPhone = null;
    }

    const disposePromise = Promise.resolve().then(() => webPhone.dispose());
    await waitForCleanup(disposePromise, CLEANUP_TIMEOUT);
    this._finalizeSessions(webPhone);
    this._closeWebSocket(webPhone);
  }

  protected _closeWebSocket(webPhone: WebPhone) {
    const socket = (webPhone.sipClient as unknown as { wsc?: SipWebSocket })
      ?.wsc;
    try {
      socket?.close();
    } catch {
      // Cleanup must remain best effort.
    }
  }

  protected _attachSocketCloseHandler(webPhone: WebPhone) {
    const socket = (webPhone.sipClient as unknown as { wsc?: SipWebSocket })
      ?.wsc;
    if (!socket) return;

    const onClose = () => {
      if (
        this._webPhone !== webPhone ||
        !this.connected ||
        !this._auth.loggedIn
      ) {
        return;
      }
      const removeSocketCloseHandler = this._socketCleanup.get(webPhone);
      removeSocketCloseHandler?.();
      this._socketCleanup.delete(webPhone);
      this._lifecycleEpoch += 1;
      const epoch = this._lifecycleEpoch;
      this._socketRecoveryAttempt = 0;
      this._emitRegistration('webphoneUnregistered');
      this._setConnectionState('reconnecting');
      void this._recoverAfterSocketClose(epoch, webPhone);
    };

    socket.addEventListener('close', onClose);
    const removeSocketCloseHandler = () => {
      socket.removeEventListener('close', onClose);
    };
    this._socketCleanup.set(webPhone, removeSocketCloseHandler);
  }

  protected async _recoverAfterSocketClose(epoch: number, webPhone: WebPhone) {
    await this._disposeWebPhone(webPhone);
    this._scheduleSocketRecovery(epoch);
  }

  protected _scheduleSocketRecovery(epoch: number) {
    if (epoch !== this._lifecycleEpoch || !this._auth.loggedIn) return;

    const delay =
      SOCKET_RECOVERY_DELAYS[
        Math.min(this._socketRecoveryAttempt, SOCKET_RECOVERY_DELAYS.length - 1)
      ];
    this._socketRecoveryAttempt += 1;
    this._recoveryTimer = setTimeout(() => {
      this._recoveryTimer = undefined;
      if (epoch !== this._lifecycleEpoch || !this._auth.loggedIn) return;
      if (this.connected) return;
      if (this._connectPromise) {
        void this._runRecoveryAttempt(epoch);
        return;
      }

      this._setConnectionState('reconnecting');
      void this._runRecoveryAttempt(epoch);
    }, delay);
  }

  protected async _runRecoveryAttempt(epoch: number) {
    if (!this._isCurrentLifecycle(epoch)) return;
    const connectPromise = this._ensureRecoveryConnection();
    if (!connectPromise) return;

    const outcome = await this._waitForRecoveryOutcome(connectPromise);

    if (outcome.type === 'timeout') {
      await this._handleRecoveryTimeout(epoch, connectPromise);
      return;
    }

    if (
      outcome.type === 'failed' &&
      this._isCurrentLifecycle(epoch) &&
      !isSipAuthorizationRejection(outcome.error)
    ) {
      this._scheduleSocketRecovery(epoch);
    }
  }

  private _ensureRecoveryConnection() {
    if (this._connectPromise) return this._connectPromise;
    const connectResult = this.connect();
    connectResult?.catch(() => undefined);
    return this._connectPromise ?? connectResult;
  }

  private async _waitForRecoveryOutcome(connectPromise: Promise<void>) {
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        connectPromise.then(
          () => ({ type: 'settled' as const }),
          (error: unknown) => ({ type: 'failed' as const, error }),
        ),
        new Promise<{ type: 'timeout' }>((resolve) => {
          timeoutHandle = setTimeout(
            () => resolve({ type: 'timeout' }),
            RECOVERY_ATTEMPT_TIMEOUT,
          );
        }),
      ]);
    } finally {
      if (timeoutHandle) clearTimeout(timeoutHandle);
    }
  }

  private async _handleRecoveryTimeout(
    epoch: number,
    connectPromise: Promise<void>,
  ) {
    if (
      !this._isCurrentLifecycle(epoch) ||
      this._connectPromise !== connectPromise
    ) {
      return;
    }
    const timedOutWebPhone = this._webPhone;
    this._lifecycleEpoch += 1;
    const recoveryEpoch = this._lifecycleEpoch;
    this._connectPromise = undefined;
    await this._disposeWebPhone(timedOutWebPhone);
    if (!this._isCurrentLifecycle(recoveryEpoch) || this.connected) return;
    if (this._connectPromise) {
      void this._runRecoveryAttempt(recoveryEpoch);
      return;
    }
    if (this._webPhone) return;
    this._setConnectionState('reconnecting');
    this._scheduleSocketRecovery(recoveryEpoch);
  }

  protected _assertLifecycle(epoch: number) {
    if (epoch !== this._lifecycleEpoch || !this._auth.loggedIn) {
      throw new Error('Webphone connection cancelled');
    }
  }

  protected _isCurrentLifecycle(epoch: number) {
    return epoch === this._lifecycleEpoch && !!this._auth.loggedIn;
  }

  protected async _start(cache: WebphoneV2ProvisionCache, epoch: number) {
    this._assertLifecycle(epoch);
    this.logger.info('Webphone V2 starting SIP runtime');
    const webPhone = this._createWebPhone(cache.sipInfo);
    this._webPhone = webPhone;
    this._attachWebPhoneListeners(webPhone);
    try {
      await webPhone.start();
      this._assertLifecycle(epoch);
    } catch (error) {
      await this._disposeWebPhone(webPhone);
      throw error;
    }
    if (this._webPhone !== webPhone) {
      await this._disposeWebPhone(webPhone);
      throw new Error('Webphone connection superseded');
    }
    this._attachSocketCloseHandler(webPhone);
    this._setLiveDevice(cache.device);
    this._setConnectionState('connected');
    this._emitRegistration('webphoneRegistered');
    this._socketRecoveryAttempt = 0;
  }

  protected async _connect(epoch: number) {
    if (!this._auth.loggedIn) return;
    if (this.connected) return;

    let cache = this._getCachedProvision();
    let usedCache = !!cache;
    if (!cache) {
      cache = await this._provision(epoch);
      usedCache = false;
    }
    this._assertLifecycle(epoch);

    try {
      await this._start(cache, epoch);
    } catch (error) {
      await this._retryConnectionAfterFailure(error, epoch, usedCache);
    }
  }

  private async _retryConnectionAfterFailure(
    error: unknown,
    epoch: number,
    usedCache: boolean,
  ) {
    if (!this._isCurrentLifecycle(epoch)) throw error;
    if (!isSipAuthorizationRejection(error)) {
      this._setConnectionState('connectFailed', error);
      throw error;
    }
    this._clearProvisionCache();
    // A 403 is also how the edge refuses an instance id that another
    // registration has taken over, so a fresh one earns one more attempt even
    // when the provision itself was already fresh.
    const rotatedInstanceId = getSipStatusCode(error) === 403;
    if (rotatedInstanceId) {
      this.logger.warn('Webphone V2 rotating SIP instance id after 403');
      this._setSipInstanceId(createSipInstanceId());
    }
    if (!usedCache && !rotatedInstanceId) {
      this._setConnectionState('connectFailed', error);
      throw error;
    }
    try {
      const cache = await this._provision(epoch);
      this._assertLifecycle(epoch);
      await this._start(cache, epoch);
    } catch (retryError) {
      if (!this._isCurrentLifecycle(epoch)) throw retryError;
      if (isSipAuthorizationRejection(retryError)) this._clearProvisionCache();
      this._setConnectionState('connectFailed', retryError);
      throw retryError;
    }
  }

  async connect() {
    if (!this._auth.loggedIn) return;
    if (this.connected || this.disconnecting) return;
    this.logger.info('Webphone V2 connect requested');
    if (!this._connectPromise) {
      const epoch = this._lifecycleEpoch;
      this._beginConnect();
      const connectPromise = this._connect(epoch)
        .catch((error) => {
          if (epoch === this._lifecycleEpoch) {
            this._setConnectionState('connectFailed', error);
          }
          throw error;
        })
        .finally(() => {
          if (this._connectPromise === connectPromise) {
            this._connectPromise = undefined;
          }
        });
      this._connectPromise = connectPromise;
    }
    return this._connectPromise;
  }

  async ensureMediaOwner() {
    await this._webphoneMedia.ensureMediaOwner();
  }

  async disconnect() {
    if (this.disconnecting || this.disconnected) return;
    this.logger.info('Webphone V2 disconnect requested');
    this._lifecycleEpoch += 1;
    if (this._recoveryTimer) {
      clearTimeout(this._recoveryTimer);
      this._recoveryTimer = undefined;
    }
    this._socketRecoveryAttempt = 0;
    this._setConnectionState('disconnecting');
    const connectPromise = this._connectPromise;
    const cleanupPromise = Promise.all([
      connectPromise?.catch(() => undefined),
      this._disposeWebPhone(),
    ]);
    await waitForCleanup(cleanupPromise, CLEANUP_TIMEOUT);
    if (this._connectPromise === connectPromise) {
      this._connectPromise = undefined;
    }
    this._setLiveDevice(null);
    this._emitRegistration('webphoneUnregistered');
    this._setConnectionState('disconnected');
  }
}
