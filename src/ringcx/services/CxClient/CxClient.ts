import { waitUntilTo } from '../../lib/utils';
import {
  action,
  inject,
  injectable,
  RcModule,
  state,
  PortManager,
  delegate,
} from '@ringcentral-integration/next-core';
import { EventEmitter } from 'events';

import { AGENT_TYPES, messageTypes } from '../../enums';
import { CxTypeError } from '../../lib/CxTypeError';
import { _encodeSymbol } from '../../lib/constant';
import { registerOnMainTab } from '../../utils/register-on-main-tab';
import { evStatus, CxCallbackTypes } from './enums';
import type {
  ActivityDispositionInfo,
  ActivityLog,
  AgentHistoryParams,
  AgentHistoryResponse,
  CxACKResponse,
  CxAddSessionNotification,
  CxAgentConfig,
  CxAgentOptions,
  CxAgentScriptResult,
  CxAgentSettings,
  CxAuthenticateAgentWithEngageAccessTokenRes,
  CxAuthenticateAgentWithRcAccessTokenRes,
  CxBaseCall,
  CxClientCallMapping,
  CxColdTransferCallResponse,
  CxColdTransferIntlCallResponse,
  CxConfigureAgentOptions,
  CxDirectAgentListResponse,
  CxDispositionCallOptions,
  CxDispositionManualPassOptions,
  CxLogoutAgentResponse,
  CxMessageRes,
  CxOffhookFlags,
  CxOpenSocketResult,
  CxRequeueCallResponse,
  CxRequeueOption,
  CxScriptResponse,
  CxTokenType,
  CxWarmTransferCallResponse,
  CxWarmTransferIntlCallResponse,
  PauseRecord,
  PauseRecordResponse,
  RawEvAuthenticateAgentWithRcAccessTokenRes,
  RecordResponse,
} from './interfaces';
import { Webphone as MicroPhoneWebphone } from '@ringcentral-integration/micro-phone/src/app/services';
import type { Webphone } from '../../../app/services/WebphoneV2';
import { buildSoftphoneSipInfo } from './buildSoftphoneSipInfo';
import type {
  CxAgentIdentity,
  CxClientServiceOptions,
  CxClientTransferParams,
  CxClientHangUpParams,
  CxClientHoldSessionParams,
  CxClientManualOutdialParams,
} from './CxClient.interface';
import type { ReconnectSnapshot as CxReconnectSnapshot } from '../../utils/reconcileReconnectState';
import type { StoredEvSession } from '../../utils/canRejoinEvSession';

const AGENT_SDK_PATH = '/assets/ringcx/agentLibrary.js';

declare global {
  interface Window {
    AgentSDK: any;
    evAuthHost?: string;
  }
}

type ListenerType =
  (typeof CxCallbackTypes)['OPEN_SOCKET' | 'CLOSE_SOCKET' | 'LOGIN'];

/** Snapshot of the SDK's socket bookkeeping, see {@link CxClient.getSocketDiagnostics}. */
export interface CxSocketDiagnostics {
  /** Epoch ms of the last server echo, or null before the first one. */
  lastAlive: number | null;
  msSinceLastAlive: number | null;
  /** Null means the SDK's BEAT timer is not running at all. */
  pingStatIntervalId: unknown;
  statsIntervalId: unknown;
  socketReadyState: number | null;
  /** Growth here on a healthy socket means the SDK thinks it is offline. */
  queuedMsgCount: number | null;
  reconnectAttemptsCounter: number | null;
  isLoggedIn: boolean;
}

/**
 * Mirrors `MAX_RECONNECTION_ATTEMPTS` in the Agent SDK's socket module. Used
 * to predict whether the SDK will keep retrying so the UI can distinguish a
 * recoverable drop from a dead connection.
 */
const MAX_RECONNECTION_ATTEMPTS = 72;

/** Local storage namespace the Agent SDK persists its session token under. */
const SDK_STORAGE_PREFIX = 'agentSDK:';

/**
 * The SDK stores `hash_code` without a timestamp, so the age of the session is
 * tracked alongside it to decide whether a rejoin after reload is worthwhile.
 */
const SESSION_SAVED_AT_KEY = '__evSessionSavedAt__';

type Listener<
  T extends keyof CxClientCallMapping,
  U extends CxClientCallMapping = CxClientCallMapping,
> = (res: U[T]) => void;

/**
 * CxClient module - SDK wrapper for Engage Voice Agent Library
 * Handles WebSocket connections, SIP, and call operations
 */
@injectable({
  name: 'CxClient',
})
class CxClient extends RcModule {
  /** SDK instance */
  private _sdk: any;

  private _onOpen: (response: CxClientCallMapping['openResponse']) => void;

  private _onClose: () => void;

  // eslint-disable-next-line
  private _Sdk = null;

  private _options: CxAgentOptions;

  private _eventEmitter = new EventEmitter();

  private _callbacks: Record<string, Function> = {};

  /**
   * `sipjsId` of the SIP.js user agent created by the most recent `sipInit`.
   * A clean WebSocket close from any other (superseded) user agent is the
   * signal that its queued teardown reached the server late.
   */
  private _latestSipUaId: string | null = null;
  private _sdkLoadPromise: Promise<void> | null = null;

  @state
  appStatus: string = evStatus.START;

  constructor(
    protected _portManager: PortManager,
    @inject('CxClientOptions') protected evClientOptions: CxClientServiceOptions,
    @inject(MicroPhoneWebphone) protected _webphone: Webphone,
  ) {
    super();
    this._options = this.evClientOptions.options;
    const { closeResponse, openResponse } = this.evClientOptions.callbacks;
    this._onOpen = async (res) => {
      // The SDK reuses this callback to report a failed connect attempt, so a
      // response carrying an error must not be mistaken for a live socket.
      if (res?.error) {
        this.logger.info('OPEN_SOCKET error~', res.error);
        await this.setAppStatus(
          res.reconnect ? evStatus.RECONNECTING : evStatus.CONNECT_FAILURE,
        );
        openResponse(res);
        this._eventEmitter.emit(CxCallbackTypes.OPEN_SOCKET, res);
        return;
      }
      await this.setAppStatus(evStatus.CONNECTED);
      this._rememberSessionTimestamp();
      openResponse(res);
      this._eventEmitter.emit(CxCallbackTypes.OPEN_SOCKET, res);
      // ensure for WebSocket keep-alive connection
      this._sdk.terminateStats();
    };
    this._onClose = async () => {
      // The SDK fires this on every failed reconnect attempt, not just on a
      // final give-up, so the two cases are separated here. Reporting a
      // recoverable drop as CLOSED invites the agent to force a fresh login,
      // which discards the session hash code the SDK needs to resume and
      // strands the call in pending disposition server-side.
      const willRetry = this.willAutoReconnect;
      this.logger.info('CxCallbackTypes.CLOSE_SOCKET~', { willRetry });
      await this.setAppStatus(
        willRetry ? evStatus.RECONNECTING : evStatus.CLOSED,
      );
      closeResponse();
      this._eventEmitter.emit(CxCallbackTypes.CLOSE_SOCKET);
    };
    // Used for toggle auth host about Engage Voice backend.
    if (typeof window !== 'undefined' && window.localStorage) {
      const authHost = window.localStorage.getItem('__authHost__');
      if (authHost) {
        this._options.authHost = authHost;
      }
    }
    registerOnMainTab(this._portManager, () => {
      this._initialize();
    });
  }

  _initialize() {
    const ffsDomain = localStorage.getItem('FFS_DOMAIN_INITIAL');
    if (!ffsDomain) {
      localStorage.setItem('FFS_DOMAIN_INITIAL', 'https://ffs.ringcentral.com');
    }
    const ffsExternal = localStorage.getItem('FFS_DOMAIN_EXTERNAL');
    if (!ffsExternal) {
      localStorage.setItem('FFS_DOMAIN_EXTERNAL', 'https://ffs.ringcentral.com');
    }
  }

  addListener<T extends ListenerType>(type: T, listener: Listener<T>) {
    this._eventEmitter.addListener(type, listener);
  }

  addListenerOnce<T extends ListenerType>(type: T, listener: Listener<T>) {
    this._eventEmitter.once(type, listener);
  }

  removeListener<T extends ListenerType>(
    type: ListenerType,
    listener: Listener<T>,
  ) {
    this._eventEmitter.removeListener(type, listener);
  }

  @delegate('mainClient')
  async loadCurrentCall(): Promise<CxBaseCall | void> {
    return new Promise<CxBaseCall | void>((resolve) => {
      this._sdk.loadCurrentCall(resolve);
    });
  }

  private get _uiModel(): any {
    return this._sdk?._getUIModel?.().getInstance();
  }

  /**
   * Whether the Agent SDK will keep retrying the socket on its own.
   *
   * Mirrors the SDK's own guard: it only auto-reconnects while the agent is
   * still logged in and it has attempts left.
   */
  get willAutoReconnect(): boolean {
    const model = this._uiModel;
    if (!model?.agentSettings?.isLoggedIn) {
      return false;
    }
    const attempts = model.reconnectAttemptsCounter ?? 0;
    return attempts <= MAX_RECONNECTION_ATTEMPTS;
  }

  /**
   * The server's authoritative view of the agent, captured from the most
   * recent reconnect login response.
   */
  @delegate('mainClient')
  async getReconnectSnapshot(): Promise<CxReconnectSnapshot> {
    const model = this._uiModel;
    const connectionSettings = model?.connectionSettings ?? {};
    return {
      isOnCall: !!model?.agentSettings?.onCall,
      activeCallUii: connectionSettings.activeCallUii || '',
      isPendingDisposition: connectionSettings.isPendingDisp === true ||
        connectionSettings.isPendingDisp === 'true',
    };
  }

  /**
   * Read-only snapshot of the SDK's socket bookkeeping.
   *
   * `lastAlive` only advances when the backend sends an echo instruction, so
   * it is the liveness signal for the agent websocket: a network switch
   * leaves the socket reporting OPEN while nothing gets through, and the
   * SDK's reconnect only starts once the browser finally times the TCP
   * connection out. The socket watchdog samples this snapshot to detect that
   * zombie state and force the reconnect early.
   */
  @delegate('mainClient')
  async getSocketDiagnostics(): Promise<CxSocketDiagnostics> {
    const model = this._uiModel;
    const lastAlive = model?.lastAlive ?? null;
    return {
      lastAlive,
      msSinceLastAlive: lastAlive === null ? null : Date.now() - lastAlive,
      pingStatIntervalId: model?.pingStatIntervalId ?? null,
      statsIntervalId: model?.statsIntervalId ?? null,
      socketReadyState: this._sdk?.socket?.readyState ?? null,
      queuedMsgCount: this._sdk?._queuedMsgs?.length ?? null,
      reconnectAttemptsCounter: model?.reconnectAttemptsCounter ?? null,
      isLoggedIn: !!model?.agentSettings?.isLoggedIn,
    };
  }

  private _rememberSessionTimestamp(): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    window.localStorage.setItem(SESSION_SAVED_AT_KEY, String(Date.now()));
  }

  /**
   * Read back the session token the SDK persisted on login, together with the
   * timestamp of the last successful socket open. Used to judge whether the
   * server-side session is still fresh enough for a socket-level rejoin to be
   * worth attempting.
   */
  @delegate('mainClient')
  async getStoredSession(): Promise<StoredEvSession | null> {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    const read = (key: string): string => {
      const raw = window.localStorage.getItem(`${SDK_STORAGE_PREFIX}${key}`);
      if (!raw) return '';
      try {
        return String(JSON.parse(raw));
      } catch {
        return raw;
      }
    };
    const hashCode = read('hash_code');
    const agentId = read('agent_id');
    if (!hashCode || !agentId) {
      return null;
    }
    const savedAt = Number(
      window.localStorage.getItem(SESSION_SAVED_AT_KEY) ?? 0,
    );
    return { agentId, hashCode, savedAt };
  }

  /**
   * Prime the SDK to send a Layer 2 reconnect on the next `openSocket()`
   * instead of a fresh login, so the server hands back the existing session
   * along with its call and pending-disposition state.
   *
   * Only possible on an instance that has completed a login in this page:
   * the SDK builds the reconnect message from the in-memory `loginRequest`
   * and routes the response into its Layer 2 branch only while
   * `agentSettings.isLoggedIn` is set. Priming a freshly created instance
   * (a page reload) would make the SDK dereference a null `loginRequest`
   * inside its socket message handler.
   *
   * Returns false when a fresh login is the only option.
   */
  @delegate('mainClient')
  async prepareSessionRejoin(hashCode: string): Promise<boolean> {
    const model = this._uiModel;
    if (!model || !hashCode) {
      return false;
    }
    if (!model.agentSettings?.isLoggedIn || !model.loginRequest) {
      return false;
    }
    model.connectionSettings.hashCode = hashCode;
    model.connectionSettings.reconnect = true;
    this._sdk._isReconnect = true;
    return true;
  }

  /**
   * Drop a call the server still holds and cancel its pending disposition.
   *
   * This is the SDK's own escape hatch for an irreconcilable reconnect: the
   * hangup carries `cancel_pending_disp`, which is the only way to release an
   * agent the server has parked in pending disposition with no call the client
   * can dispose.
   */
  @delegate('mainClient')
  async forceClearPendingDisposition(sessionId = 1): Promise<void> {
    this.logger.warn('forceClearPendingDisposition~~', { sessionId });
    await this._sdk.hangup(sessionId, true);
  }

  get currentCall(): CxBaseCall {
    return this._sdk.getCurrentCall();
  }

  @delegate('mainClient')
  async getCurrentCall(): Promise<CxBaseCall | void> {
    return this._sdk.getCurrentCall();
  }

  @action
  _setAppStatus(status: string) {
    this.appStatus = status;
  }

  @delegate('server')
  async setAppStatus(status: string): Promise<void> {
    this._setAppStatus(status);
  }

  setEnv(authHost: string) {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('__authHost__', authHost);
      window.location.reload();
    }
  }

  setSIPNoLog(value: string) {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('__SIP_NO_LOG__', value);
      window.location.reload();
    }
  }

  @delegate('mainClient')
  async ensureSdkLoaded(): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('The RingCX Agent SDK requires a browser client');
    }
    window.evAuthHost = this._options.authHost;
    if (window.AgentSDK) return;
    if (this._sdkLoadPromise) return this._sdkLoadPromise;
    this._sdkLoadPromise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(
        `script[src="${AGENT_SDK_PATH}"]`,
      );
      const script = existing ?? document.createElement('script');
      const onLoad = () => {
        if (window.AgentSDK) {
          resolve();
        } else {
          reject(new Error('RingCX Agent SDK did not expose AgentSDK'));
        }
      };
      script.addEventListener('load', onLoad, { once: true });
      script.addEventListener(
        'error',
        () => reject(new Error('Unable to load the RingCX Agent SDK')),
        { once: true },
      );
      if (!existing) {
        script.async = true;
        script.src = AGENT_SDK_PATH;
        document.head.appendChild(script);
      }
    });
    return this._sdkLoadPromise;
  }

  @delegate('mainClient')
  async initSDK(): Promise<void> {
    await this.ensureSdkLoaded();
    if (this._sdk) {
      this.logger.info('AgentSDK already initialized~~');
      return;
    }
    this.logger.info('Init AgentSDK~~');
    const options = { ...this._options };
    this._sdk = new window.AgentSDK({
      callbacks: {
        ...this._callbacks,
        [CxCallbackTypes.CLOSE_SOCKET]: this._onClose,
        [CxCallbackTypes.OPEN_SOCKET]: this._onOpen,
        [CxCallbackTypes.ACK]: (res: CxACKResponse) => {
          this._eventEmitter.emit(CxCallbackTypes.ACK, res);
        },
        // The SDK holds exactly one callback per type and reuses the LOGIN
        // slot for the reconnect login it sends on its own after a socket
        // drop. `configureAgent` replaces this slot with its per-call
        // callback, so that callback re-emits here too; anything else that
        // claims the LOGIN slot would cut this bridge off.
        [CxCallbackTypes.LOGIN]: (res: CxClientCallMapping['loginResponse']) => {
          this._eventEmitter.emit(CxCallbackTypes.LOGIN, res);
        },
      },
      ...options,
    });
    window.AgentSDK.shared.HttpService.setApiBase(options.authHost);
    this._watchSoftphoneTransports();
  }

  private get _softphoneService(): any {
    return this._sdk?._SoftphoneService ?? null;
  }

  /**
   * Watch each SIP.js user agent the softphone builds, so a superseded one
   * that later wipes the live registration can be caught (see
   * {@link CxClient._onSoftphoneSocketClose}).
   *
   * The SDK creates a new user agent inside `SoftphoneService.sipInit` and
   * exposes no event for it, so `sipInit` is wrapped to re-run the watcher on
   * each rebuild. The internal reconnect paths all reach the new agent through
   * this same `sipInit`, so wrapping it alone is enough.
   */
  private _watchSoftphoneTransports(): void {
    const service = this._softphoneService;
    if (!service || service.__evWatched) {
      return;
    }
    service.__evWatched = true;
    const originalSipInit = service.sipInit;
    if (typeof originalSipInit === 'function') {
      service.sipInit = (...args: any[]) => {
        const result = originalSipInit.apply(service, args);
        this._watchSipTransport();
        return result;
      };
    }
    this._watchSipTransport();
  }

  /**
   * Record the current SIP.js user agent as the live one and watch its socket
   * for a clean close.
   */
  private _watchSipTransport(): void {
    const ua = this._softphoneService?.getSoftphoneSettings?.()?.webRtc?.ua;
    const transport = ua?.transport;
    if (!transport || typeof transport.on !== 'function' || transport.__evWatched) {
      return;
    }
    transport.__evWatched = true;
    const uaId: string | null = ua.configuration?.sipjsId ?? null;
    // This is the user agent the app now considers live; any other one whose
    // socket later closes is a superseded UA.
    this._latestSipUaId = uaId;
    transport.on('connected', () => {
      // SIP.js swallows its own `disconnected` event for a close it requested
      // (which is exactly the wildcard un-REGISTER teardown we care about), so
      // listen on the raw socket instead.
      const ws = transport.ws;
      if (ws && typeof ws.addEventListener === 'function' && !ws.__evWatched) {
        ws.__evWatched = true;
        ws.addEventListener('close', (event: CloseEvent) => {
          this._onSoftphoneSocketClose(uaId, event.code, event.reason);
        });
      }
    });
  }

  /**
   * Flag a superseded user agent that closed its socket cleanly.
   *
   * A `code` of 1000 means the WebSocket close handshake completed, so the
   * frames the SDK queued on that socket before abandoning it, which for a
   * `sipTerminate` include a wildcard un-REGISTER, were delivered. When that
   * lands after the replacement UA has re-registered it removes the fresh
   * binding, leaving a UA that reports "registered" while the platform can no
   * longer route to it. A `code` of 1006 means the socket died before the
   * queue drained, so no un-REGISTER arrived and the registration is intact.
   *
   * Only a UA other than the current one matters: a close from the live UA is
   * an ordinary teardown, and a deliberate registrar switch tears the old UA
   * down before building the new one, so its close is never from a superseded
   * UA. The suspicion is handed to CxIntegratedSoftphone, which owns softphone
   * recovery, through the subscription bridge.
   */
  private _onSoftphoneSocketClose(
    closedUaId: string | null,
    code: number,
    reason: string,
  ): void {
    if (code !== 1000 || !closedUaId || closedUaId === this._latestSipUaId) {
      return;
    }
    const listener = this._callbacks[CxCallbackTypes.SIP_SUSPECT_REGISTRATION];
    listener?.({
      closedUaId,
      latestUaId: this._latestSipUaId,
      code,
      reason,
    });
  }

  on(eventType: string, callback: (...args: any[]) => void) {
    const _callback = {
      [eventType]: (...args: any[]) => callback(...args),
    };
    this._sdk.setCallbacks(_callback);
    this._callbacks = {
      ...this._callbacks,
      ..._callback,
    };
  }

  getEventCallback(eventType: string) {
    return this._sdk.getCallback(eventType);
  }

  getRefreshedToken() {
    return this._sdk.getRefreshedToken();
  }

  @delegate('mainClient')
  async authenticateAgentWithEngageAccessToken(
    engageAccessToken: string,
  ): Promise<CxAuthenticateAgentWithEngageAccessTokenRes> {
    return new Promise<CxAuthenticateAgentWithEngageAccessTokenRes>(
      async (resolve) => {
        await this.setAppStatus(evStatus.LOGIN);
        this._sdk.authenticateAgentWithEngageAccessToken(
          engageAccessToken,
          (response: CxAuthenticateAgentWithEngageAccessTokenRes) => {
            this._syncSoftphoneAuthToken();
            resolve(response);
          },
        );
      },
    );
  }

  @delegate('mainClient')
  async configureAgent({
    dialDest,
    queueIds,
    chatIds,
    skillProfileId,
    dialGroupId,
    updateFromAdminUI = false,
    isForce = false,
    loginType,
  }: CxConfigureAgentOptions): Promise<CxMessageRes> {
    if (dialDest === 'integrated') {
      this._seedSoftphoneSipInfo();
    }
    return new Promise<CxMessageRes>((resolve) => {
      this.logger.info('configureAgent~~')
      this._sdk.loginAgent(
        dialDest,
        queueIds,
        chatIds,
        skillProfileId,
        dialGroupId,
        updateFromAdminUI,
        isForce,
        loginType,
        (res: any) => {
          this.logger.info('configureAgent response~~');
          // loginAgent() installed this callback as THE SDK LOGIN callback,
          // displacing the bridge set up in initSDK. The SDK fires the same
          // slot for the reconnect login it sends after a socket drop, so the
          // bridge has to be kept alive from here (a settled promise ignores
          // the extra resolve).
          this._eventEmitter.emit(CxCallbackTypes.LOGIN, res);
          resolve({
            type: messageTypes.CONFIGURE_AGENT,
            data: res,
          });
        },
      );
    });
  }

  /**
   * An integrated login blocks on `api/v1/sip/sipRegistrationInfo` whenever
   * `softphoneSettings.sipInfo` is empty, because the SDK needs a username to
   * form the `<username>@RC_SOFTPHONE` dial destination it sends to
   * IntelliQueue. The host webphone already provisioned that same extension
   * identity, so seeding it here removes the request.
   */
  private _seedSoftphoneSipInfo(): void {
    const model = this._sdk?._getUIModel?.().getInstance();
    if (!model || model.softphoneSettings.sipInfo.length > 0) {
      return;
    }
    const sipInfo = buildSoftphoneSipInfo(this._webphone.sipInfo);
    if (!sipInfo) {
      this.logger.warn('seedSoftphoneSipInfo skipped~~ no provisioned username');
      return;
    }
    this.logger.info('seedSoftphoneSipInfo~~', sipInfo[0].username);
    model.softphoneSettings.sipInfo = sipInfo;
  }

  @delegate('mainClient')
  async dispositionManualPass({
    dispId,
    notes,
    callbackDTS,
    leadId,
    requestId,
    externId,
  }: CxDispositionManualPassOptions): Promise<CxDispositionManualPassOptions> {
    return new Promise<CxDispositionManualPassOptions>((resolve) => {
      this._sdk.dispositionManualPass(
        dispId,
        notes,
        (response: CxDispositionManualPassOptions) => {
          resolve(response);
        },
        callbackDTS,
        leadId,
        requestId,
        externId,
      );
    });
  }

  @delegate('mainClient')
  async dispositionCall({
    uii,
    dispId = '',
    notes = '',
    callback,
    callbackDTS,
    contactForwardNumber,
    survey,
    externId,
    leadId,
    requestId = '',
  }: CxDispositionCallOptions) {
    return this._sdk.dispositionCall(
      this.decodeUii(uii),
      dispId,
      notes,
      callback,
      callbackDTS,
      contactForwardNumber,
      survey,
      externId,
      leadId,
      requestId,
    );
  }

  @delegate('mainClient')
  authenticateAgent(
    rcAccessToken: string,
    tokenType: CxTokenType,
  ): Promise<CxAuthenticateAgentWithRcAccessTokenRes> {
    return new Promise<CxAuthenticateAgentWithRcAccessTokenRes>(async (resolve) => {
      await this.setAppStatus(evStatus.LOGIN);
      this._sdk.authenticateAgentWithRcAccessToken(
        rcAccessToken,
        tokenType,
        async (res: RawEvAuthenticateAgentWithRcAccessTokenRes) => {
          if (res.type === 'Authenticate Error' || res.err) {
            return resolve(
              res as unknown as CxAuthenticateAgentWithRcAccessTokenRes,
            );
          }
          res.rcAccessToken = rcAccessToken;
          // There three token types in the app
          // 1. RC token from RingCentral Single Sign-on API
          // 2. Engage token from Engage Auth:
          //     saved in authenticateRequest.engageAccessToken and Session.getAccessToken()
          //     it is used for ringcx HTTP requests, need to exchange with rc token again if expired
          // 3. AGENT SDK token for WebSocket connection:
          //     saved in authenticateRequest.accessToken,
          //     it is used for WebSocket connection
          //     It is refreshed in sdk by hashcode
          // Call authenticateAgentWithEngageAccessToken to pass engage token to AGENT SDK for WebSocket connection
          const engageAccessTokenResponse = await this.authenticateAgentWithEngageAccessToken(res.accessToken);
          if (typeof window !== 'undefined' && window.localStorage) {
            window.AgentSDK.shared.Session.storeAccessTokenResult({
              response: JSON.stringify(engageAccessTokenResponse),
            });
            window.AgentSDK.shared.Session.storeRCAccessTokenResult({
              response: JSON.stringify(engageAccessTokenResponse),
            });
          }
          // Apply locale from regional settings if available
          const locale = (res as any).regionalSettings?.language;
          if (locale) {
            this._eventEmitter.emit('setLocale', locale);
          }
          await this.setAppStatus(evStatus.LOGINED);
          const _agents = (res || {}).agents || [];
          const agents = _agents.map((agent) => ({
            ...agent,
            agentId: agent && agent.agentId ? `${agent.agentId}` : '',
            agentType: AGENT_TYPES[agent.agentType],
          }));
          resolve({
            ...res,
            agents,
          });
        },
      );
    });
  }

  @delegate('mainClient')
  openSocket(agentId: string): Promise<CxOpenSocketResult> {
    const hasSupportWebSocket =
      typeof window !== 'undefined' && 'WebSocket' in window;
    if (!hasSupportWebSocket) {
      throw new CxTypeError({
        type: messageTypes.INVALID_BROWSER,
      });
    }
    return new Promise<CxOpenSocketResult>((resolve) => {
      this.addListenerOnce(CxCallbackTypes.OPEN_SOCKET, (res) => {
        resolve(res);
      });
      this._sdk.openSocket(agentId);
    });
  }

  @delegate('mainClient')
  async getAgentConfig(): Promise<CxAgentConfig | null> {
    return new Promise<CxAgentConfig | null>((resolve) => {
      const timeoutId = setTimeout(() => resolve(null), 10000);
      this._sdk.getAgentConfig((res: CxAgentConfig) => {
        clearTimeout(timeoutId);
        resolve(res);
      });
    });
  }

  @delegate('mainClient')
  async getAndHandleAuthenticateResponse(
    rcAccessToken: string,
    tokenType: CxTokenType,
  ): Promise<CxAuthenticateAgentWithRcAccessTokenRes | { error: string, data?: string }> {
    const authenticateResponse = await waitUntilTo(
      () => {
        return this.authenticateAgent(rcAccessToken, tokenType);
      },
      {
        interval: 0,
        timeout: 120 * 1000,
      },
    ).catch((e) => {
      this.logger.error('getAndHandleAuthenticateResponse error~~', e);
      return {
        error: messageTypes.CONNECT_TIMEOUT
      };
    });
    if ('error' in authenticateResponse) {
      return authenticateResponse;
    }
    // For testing auth error, comment out this code
    // if (!window.testAuthError) {
    //   window.testAuthError = 1;
    //   return {
    //     error: messageTypes.CONNECT_ERROR,
    //     data: authenticateResponse.message,
    //   };
    // }
    if (
      authenticateResponse.type === 'Authenticate Error' ||
      authenticateResponse.message
    ) {
      return {
        error: messageTypes.CONNECT_ERROR,
        data: authenticateResponse.message,
      };
    }
    if (
      !authenticateResponse ||
      !authenticateResponse.agents ||
      !authenticateResponse.agents.length
    ) {
      return {
        error: messageTypes.NO_AGENT,
      };
    }
    if (
      !authenticateResponse.agents[0] ||
      !authenticateResponse.agents[0].agentId
    ) {
      return {
        error: messageTypes.UNEXPECTED_AGENT,
      };
    }
    return authenticateResponse;
  }

  /**
   * when manual close socket, that closeSocket will auto reconnected by agent SDK
   */
  @delegate('mainClient')
  async closeSocket() {
    if (!this.ifSocketExist) {
      return;
    }
    this.logger.info('closeSocket~~');
    await this._sdk.closeSocket();
  }

  get ifSocketExist(): boolean {
    return !!this._sdk.socket;
  }

  /**
   * Abandon a socket that is already known dead, without waiting for the
   * browser's closing handshake.
   *
   * `WebSocket.close()` is graceful: it sends a Close frame and waits for the
   * peer's reply, and over a black-holed TCP path Chrome only gives up after
   * its 60s closing-handshake timeout — the SDK's reconnect starts in
   * `onclose`, so a plain close costs a full extra minute. The SDK's handler
   * takes no event and only flips its own bookkeeping, so it can be driven
   * directly; the orphaned browser socket is detached first so its eventual
   * timeout cannot double-drive the SDK.
   */
  @delegate('mainClient')
  async abandonSocket(): Promise<void> {
    const socket = this._sdk?.socket;
    if (!socket) {
      return;
    }
    this.logger.info('abandonSocket~~');
    const onclose = socket.onclose;
    socket.onopen = null;
    socket.onerror = null;
    socket.onmessage = null;
    socket.onclose = null;
    try {
      socket.close();
    } catch (error) {
      this.logger.info('abandonSocket~~ close failed', error);
    }
    onclose?.call(socket);
  }

  @delegate('mainClient')
  async hangup({ sessionId, resetPendingDisp = false }: CxClientHangUpParams) {
    return this._sdk.hangup(sessionId, resetPendingDisp);
  }

  @delegate('mainClient')
  async logoutAgent(agentId: string): Promise<CxLogoutAgentResponse> {
    const uiModel = this._sdk._getUIModel().getInstance();
    if (!uiModel.agentSettings.isLoggedIn) {
      return {
        message: 'Agent is not logged in',
        status: 'OK',
        detail: 'Agent is not logged in',
      };
    }
    const logoutPromise = new Promise<CxLogoutAgentResponse>((resolve) => {
      this._sdk.logoutAgent(agentId, (result: CxLogoutAgentResponse) => {
        resolve(result);
      });
    });
    return waitUntilTo(() => logoutPromise, {
      interval: 0,
      timeout: 10 * 1000,
    }).catch((e) => {
      this.logger.warn('logoutAgent timeout~~', e);
      return {
        message: 'Logout timed out',
        status: 'TIMEOUT',
        detail: 'logoutAgent did not respond within the timeout period',
      };
    });
  }

  @delegate('mainClient')
  async manualOutdial({
    destination,
    callerId,
    ringTime,
    countryId,
    queueId,
  }: CxClientManualOutdialParams) {
    return this._sdk.manualOutdial(
      destination,
      callerId,
      ringTime,
      countryId,
      queueId,
    );
  }

  @delegate('mainClient')
  async manualOutdialCancel(uii: string) {
    await this._sdk.manualOutdialCancel(uii);
  }

  @delegate('mainClient')
  async offhookInit() {
    // we using CxCallbackTypes.OFFHOOK_INIT to catch data, do not pass callback,
    // that will make the message not come back
    await this._sdk.offhookInit();
  }

  @delegate('mainClient')
  async offhookTerm() {
    await this._sdk.offhookTerm();
  }

  @delegate('mainClient')
  async hold(holdState: boolean) {
    await this._sdk.hold(holdState);
  }

  @delegate('mainClient')
  async pauseRecord(isRecord: boolean): Promise<PauseRecord> {
    return new Promise<PauseRecord>((resolve, reject) => {
      return this._sdk.pauseRecord(
        isRecord,
        (response: PauseRecordResponse) => {
          const formattedResponse = {
            ...response,
            pause: response.pause ? Number(response.pause) : null,
          };
          if (response.status === 'OK') {
            resolve(formattedResponse);
          } else {
            reject(formattedResponse);
          }
        },
      );
    });
  }

  /**
   * toggle call recording on/off base on true|false boolean
   */
  @delegate('mainClient')
  async record(state: boolean): Promise<RecordResponse> {
    return new Promise<RecordResponse>((resolve, reject) => {
      return this._sdk.record(state, (response: RecordResponse) => {
        if (response.status === 'OK') {
          resolve(response);
        } else {
          reject(response);
        }
      });
    });
  }

  @delegate('mainClient')
  async holdSession({ state, sessionId }: CxClientHoldSessionParams) {
    await this._sdk.holdSession(state, sessionId);
  }

  @delegate('mainClient')
  async coldTransferCall({
    dialDest,
    callerId = '',
    sipHeaders = [],
  }: CxClientTransferParams): Promise<CxColdTransferCallResponse> {
    return new Promise<CxColdTransferCallResponse>((resolve, reject) => {
      this._sdk.coldXfer(
        dialDest,
        callerId,
        sipHeaders,
        (data: CxColdTransferCallResponse) => {
          if (data.status === 'OK') {
            resolve(data);
          } else {
            reject(data);
          }
        },
      );
    });
  }

  @delegate('mainClient')
  async warmTransferCall({
    dialDest,
    callerId = '',
    sipHeaders = [],
  }: CxClientTransferParams): Promise<CxWarmTransferCallResponse> {
    return new Promise<CxWarmTransferCallResponse>((resolve, reject) => {
      this._sdk.warmXfer(
        dialDest,
        callerId,
        sipHeaders,
        (data: CxWarmTransferCallResponse) => {
          if (data.status === 'OK') {
            resolve(data);
          } else {
            reject(data);
          }
        },
      );
    });
  }

  @delegate('mainClient')
  async coldTransferIntlCall({
    dialDest,
    callerId = '',
    sipHeaders = [],
    countryId = '',
  }: CxClientTransferParams): Promise<CxColdTransferIntlCallResponse> {
    return new Promise<CxColdTransferIntlCallResponse>((resolve, reject) => {
      this._sdk.internationalColdXfer(
        dialDest,
        callerId,
        sipHeaders,
        countryId,
        (data: CxColdTransferIntlCallResponse) => {
          if (data.status === 'OK') {
            resolve(data);
          } else {
            reject(data);
          }
        },
      );
    });
  }

  @delegate('mainClient')
  async warmTransferIntlCall({
    dialDest,
    callerId = '',
    sipHeaders = [],
    countryId = '',
  }: CxClientTransferParams): Promise<CxWarmTransferIntlCallResponse> {
    return new Promise<CxWarmTransferIntlCallResponse>((resolve, reject) => {
      this._sdk.internationalWarmXfer(
        dialDest,
        callerId,
        sipHeaders,
        countryId,
        (data: CxWarmTransferIntlCallResponse) => {
          if (data.status === 'OK') {
            resolve(data);
          } else {
            reject(data);
          }
        },
      );
    });
  }

  @delegate('mainClient')
  async cancelWarmTransferCall(dialDest: string) {
    await this._sdk.warmXferCancel(dialDest);
  }

  @delegate('mainClient')
  async requeueCall({
    queueId,
    skillId = '',
    maintain = false,
  }: CxRequeueOption): Promise<CxRequeueCallResponse> {
    return new Promise<CxRequeueCallResponse>((resolve, reject) => {
      this._sdk.requeueCall(
        queueId,
        skillId,
        maintain,
        (data: CxRequeueCallResponse) => {
          if (data.status === 'OK') {
            resolve(data);
          } else {
            reject(data);
          }
        },
      );
    });
  }

  @delegate('mainClient')
  async fetchDirectAgentList(): Promise<CxDirectAgentListResponse> {
    return new Promise<CxDirectAgentListResponse>((resolve) => {
      this._sdk.directAgentXferList((data: CxDirectAgentListResponse) => {
        resolve(data);
      });
    });
  }

  encodeUii({ uii, sessionId }: Partial<CxAddSessionNotification>): string {
    return `${uii}${_encodeSymbol}${sessionId}`;
  }

  /**
   * replace sessionId with _encodeSymbol when ringing
   * @param _encodeSymbol '$'
   */
  encodeRingingUii({ uii }: CxBaseCall): string {
    return this.encodeUii({
      uii: this.decodeUii(uii),
      sessionId: _encodeSymbol,
    });
  }

  decodeUii(uii: string): string {
    return uii.split(_encodeSymbol)[0];
  }

  /**
   * get a main call session in some call session with some uii
   * @param uii call uii
   */
  getMainId(uii: string): string {
    return this.encodeUii({
      sessionId: '1',
      uii,
    });
  }

  @delegate('mainClient')
  async rejectDirectAgentTransferCall(uii: string) {
    await this._sdk.rejectDirectAgentXfer(this.decodeUii(uii));
  }

  @delegate('mainClient')
  async coldDirectAgentTransfer(targetAgentId: string) {
    await this._sdk.coldDirectAgentXfer(targetAgentId);
  }

  @delegate('mainClient')
  async warmDirectAgentTransfer(targetAgentId: string) {
    await this._sdk.warmDirectAgentXfer(targetAgentId);
  }

  @delegate('mainClient')
  async sendVoicemailDirectAgentTransfer(targetAgentId: string) {
    await this._sdk.voicemailDirectAgentXfer(targetAgentId);
  }

  @delegate('mainClient')
  async cancelDirectAgentTransfer(targetAgentId: string) {
    await this._sdk.cancelDirectAgentXfer(targetAgentId);
  }

  @delegate('mainClient')
  async setAgentState(agentState: string, agentAuxState: string) {
    return this._sdk.setAgentState(agentState, agentAuxState);
  }

  private _multiLoginRequest(): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this._sdk.multiLoginRequest();
      this.on(CxCallbackTypes.LOGIN, (data) => {
        if (data.status === 'SUCCESS') {
          resolve(data);
        } else {
          reject(data);
        }
      });
      this.on(CxCallbackTypes.GENERIC_NOTIFICATION, (data) => {
        if (data.messageCode === '-99') {
          reject(data);
        }
      });
    });
  }

  @delegate('mainClient')
  async multiLoginRequest(): Promise<{
    success: boolean;
    error?: string;
  }> {
    // temp solution, and wait for ev backend enhancement.
    try {
      await waitUntilTo(() => this._multiLoginRequest(), { timeout: 30000 });
      return { success: true };
    } catch (error) {
      return { success: false, error: '_multiLoginRequest fail or 30s timeout' };
    }
  }

  /**
   * WebRTC related methods
   */
  @delegate('mainClient')
  async sipInit() {
    await this._sdk.sipInit();
  }

  @delegate('mainClient')
  async sipAnswer() {
    await this._sdk.sipAnswer();
  }

  @delegate('mainClient')
  async sipRegister() {
    await this._sdk.sipRegister();
  }

  /**
   * Re-register the softphone without tearing the session down, used when the
   * network changed underneath an established registration.
   */
  @delegate('mainClient')
  async sipForceRegister() {
    await this._sdk.sipForceRegister();
  }

  /**
   * Mirror the app's offhook state onto the softphone SDK's reconnect flags.
   *
   * Both flags default to false and the SDK only ever copies them forward, so
   * without this the SDK reports `autoStartOH: false` after every registrar
   * rotation and the agent's audio leg is never rebuilt.
   */
  @delegate('mainClient')
  async setOffhookFlags({
    maintainOH,
    autoStartOH,
  }: CxOffhookFlags): Promise<void> {
    const settings = this._sdk?._SoftphoneService?.getSoftphoneSettings?.();
    if (!settings) {
      return;
    }
    settings.maintainOH = maintainOH;
    settings.autoStartOH = autoStartOH;
  }

  /**
   * Keep the softphone SDK's private auth model aligned with the Agent SDK.
   *
   * The bundled SDK creates the softphone service before authentication and
   * gives it a separate UIModel. Later authentication refreshes only the main
   * model, so registrar rotation can otherwise fetch sipRegistrationInfo with
   * the token captured by an earlier session even though configureAgent just
   * fetched the same resource successfully with the current token.
   */
  private _syncSoftphoneAuthToken(): void {
    const engageAccessToken =
      this._sdk?.getAuthenticateRequest?.()?.engageAccessToken;
    const softphoneAuthenticateRequest = this._sdk?._SoftphoneService
      ?.getUIModel?.()
      ?.getInstance?.()?.authenticateRequest;
    if (
      !softphoneAuthenticateRequest ||
      typeof engageAccessToken !== 'string'
    ) {
      return;
    }
    softphoneAuthenticateRequest.engageAccessToken = engageAccessToken;
  }

  /**
   * Ask the SDK to rotate the SIP registrar.
   *
   * Depending on whether a reconnect is already under way the SDK either just
   * updates the offhook flags or tears the session down and rebuilds it, and
   * reports which it chose on `SIP_SWITCH_REGISTRAR`.
   */
  @delegate('mainClient')
  async switchSoftphoneRegistrar(maintainOH: boolean): Promise<void> {
    this._syncSoftphoneAuthToken();
    await this._sdk.switchSoftphoneRegistrar(maintainOH);
  }

  /**
   * Rebuild the SIP stack from scratch against the next available registrar.
   *
   * SIP.js is configured with `maxReconnectionAttempts: 0`, so once its
   * transport closes it stays closed; this is the only way back.
   */
  @delegate('mainClient')
  async resetSoftphoneSession({
    maintainOH,
    autoStartOH,
  }: CxOffhookFlags): Promise<void> {
    // The SDK silently refuses the reset unless `isRegistered` is set and no
    // reconnect is marked in flight — states that no longer hold once the
    // transport is dead, which is exactly when a manual retry is offered.
    // Force the entry conditions the same way the SDK's own registration
    // timeout handler does before it rotates the registrar.
    const settings = this._sdk?._SoftphoneService?.getSoftphoneSettings?.();
    if (settings) {
      settings.isRegistered = true;
      settings.attemptingSoftphoneReconnect = false;
    }
    await this._sdk.resetSoftphoneSession({ maintainOH, autoStartOH });
  }

  @delegate('mainClient')
  async sipTerminate() {
    await this._sdk.sipTerminate();
  }

  @delegate('mainClient')
  async sipHangUp() {
    await this._sdk.sipHangUp();
  }

  @delegate('mainClient')
  async sipReject() {
    await this._sdk.sipReject();
  }

  @delegate('mainClient')
  async sipSendDTMF(dtmf: string) {
    await this._sdk.sipSendDTMF(dtmf);
  }

  @delegate('mainClient')
  async sipToggleMute(state: boolean) {
    await this._sdk.sipToggleMute(state);
  }

  /**
   * AgentScript related methods
   */
  @delegate('mainClient')
  getScript(scriptId: string, version: string): Promise<CxScriptResponse> {
    return new Promise<CxScriptResponse>((resolve, reject) => {
      this._sdk.getScript(scriptId, version, (res: CxScriptResponse) => {
        if (res.status) {
          resolve(res);
          return;
        }
        reject(new Error(res.detail || 'Unable to load Agent Script'));
      });
    });
  }

  @delegate('mainClient')
  async saveScriptResult(
    uii: string,
    scriptId: string,
    jsonResult: CxAgentScriptResult,
  ): Promise<CxAgentScriptResult> {
    this._sdk.saveScriptResult(uii, scriptId, jsonResult);
    return jsonResult;
  }

  /**
   * GET - /voice/api/v1/agent/:accountId/knowledgeBaseGroups
   */
  @delegate('mainClient')
  async getKnowledgeBaseGroups(
    knowledgeBaseGroupIds: number[],
  ): Promise<any | null> {
    const uiModel = this._sdk._getUIModel().getInstance();
    const HttpService = this._sdk._HttpService;
    const agentSettings: CxAgentSettings = this._sdk.getAgentSettings();
    const engageAccessToken = `Bearer ${uiModel.authenticateRequest.engageAccessToken}`;
    try {
      const { status, response } = await new HttpService(
        `${uiModel.authHost}/voice/api/v1/`,
      ).httpGet(`agent/${agentSettings.accountId}/knowledgeBaseGroups`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: engageAccessToken,
        },
        queryParams: {
          guid: agentSettings.guid,
          knowledgeBaseGroupIds,
        },
      });
      if (status === 200) {
        return JSON.parse(response);
      }
    } catch (error) {
      this.logger.error('getKnowledgeBaseGroups fail', error);
    }
    return null;
  }

  /**
   * Initialize SIP and register
   */
  @delegate('mainClient')
  sipInitAndRegister({
    agentId,
  }: {
    agentId: string;
  }): Promise<boolean> {
    this.logger.info('cxClient sipInitAndRegister~~');
    const { isSso: ssoLogin } = this._sdk.getApplicationSettings();
    const { dialDest } = this._sdk.getAgentSettings();
    const authenticateRequest = this._sdk.getAuthenticateRequest();
    const authToken = authenticateRequest.engageAccessToken;
    return this._sdk.sipInitAndRegister({
      authToken,
      agentId: Number(agentId),
      callbacks: this._sdk.getCallbacks(),
      authHost: this._options.authHost,
      ssoLogin,
      dialDest,
    });
  }

  /**
   * Get preview dial leads
   */
  @delegate('mainClient')
  async getPreviewDial(): Promise<any> {
    return new Promise((resolve) => {
      this._sdk.previewFetch([], (res: any) => {
        resolve(res);
      });
    });
  }

  /**
   * Dial a preview lead
   */
  @delegate('mainClient')
  async previewDial(requestId: string, leadPhone: string, leadPhoneE164: string) {
    await this._sdk.previewDial(requestId, leadPhone, leadPhoneE164);
  }

  /**
   * Manual pass disposition
   */
  @delegate('mainClient')
  async manualPass({
    dispId,
    notes,
    callback,
    callbackDTS,
    leadId,
    requestId,
    externId,
  }: {
    dispId: string;
    notes: string;
    callback: boolean;
    callbackDTS: string;
    leadId: string;
    requestId: string;
    externId: string;
  }) {
    await this._sdk.dispositionManualPass(
      dispId,
      notes,
      callback,
      callbackDTS,
      leadId,
      requestId,
      externId,
    );
  }

  /**
   * Get campaign dispositions
   */
  @delegate('mainClient')
  async getCampaignDispositions(campaignId: string): Promise<any> {
    return new Promise((resolve) => {
      this._sdk.getCampaignDispositions(campaignId, (res: any) => {
        resolve(res);
      });
    });
  }

  @delegate('mainClient')
  async requestCallSummary(uii: string, sessionId: string, segmentId: string) {
    this._sdk.requestCallSummary(uii, sessionId, segmentId);
  }

  getFullUserDetails() {
    const userDetails = localStorage.getItem('engage-auth:fullUserDetails');
    if (!userDetails) {
      return;
    }
    const userDetailsJson = JSON.parse(userDetails);
    return userDetailsJson;
  }

  /**
   * Identity bits that only exist on the SDK instance / its local storage, so
   * they can only be read on the main client. Fetched in one round trip because
   * consumers (Agent Assistant) need all of them together.
   */
  @delegate('mainClient')
  async getAgentIdentity(): Promise<CxAgentIdentity> {
    const authenticateRequest = this._sdk.getAuthenticateRequest() || {};
    const fullUserDetails = this.getFullUserDetails() || {};
    const toStringValue = (value: unknown) =>
      value === null || value === undefined ? '' : `${value}`;
    return {
      engageAccessToken: toStringValue(authenticateRequest.engageAccessToken),
      platformId: toStringValue(authenticateRequest.platformId),
      mainAccountId: toStringValue(
        authenticateRequest.mainAccountId ?? fullUserDetails.evMainAccountId,
      ),
      rcUserId: toStringValue(fullUserDetails.rcUserId),
    };
  }

  @delegate('mainClient')
  async refreshEvToken() {
    const Session = window.AgentSDK.shared.Session;
    let authenticateRequest = this._sdk.getAuthenticateRequest();
    const engageAccessToken = authenticateRequest.engageAccessToken;
    const sessionToken = Session.getAccessToken();
    if (engageAccessToken !== sessionToken) {
      Session.setAccessToken(engageAccessToken);
    }
    if (Session.isAccessTokenExpired()) {
      // there are no refresh token, so need to exchange with rc token again.
      return false;
    }
    return true;
  }

  @delegate('mainClient')
  async getEvTokenExpiredTime(): Promise<number> {
    const Session = window.AgentSDK.shared.Session;
    return Session.getClaims();
  }

  @delegate('mainClient')
  async clearEvSession() {
    const Session = window.AgentSDK.shared.Session;
    Session.clearSession();
    this.resetUIModel();
  }

  resetUIModel() {
    const instance = this._sdk._getUIModel().getInstance();
    if (instance.pingStatIntervalId) {
      clearInterval(instance.pingStatIntervalId);
    }
    if (instance.statsIntervalId) {
      clearInterval(instance.statsIntervalId);
    }
    instance.connectionSettings = {
      hashCode: '', // used specifically for reconnects
      reconnect: false, // variable tracks the type of login, on init it's false...once connected it's set to true
      isMultiSocket: false,
    };
    instance.softphoneSettings.sipInfo = [];
    instance.applicationSettings.isLoggedInIS = false;
    instance.agentSettings = {
      accountId: null, // account agent belongs to
      agentId: 0,
      agentPassword: '', //agent Password
      agentType: 'AGENT', // AGENT | SUPERVISOR
      altDefaultLoginDest: '',
      availableAgentStatesFromAccount: [],
      availableAgentStates: [],
      allAgentStates: [], // Full List of All Agent States
      callerIds: [],
      callState: null, // display the current state of the call
      corporateDirectory: false,
      consultCall: false, //consult call allow
      currentState: 'OFFLINE', // Agent system/base state
      currentStateLabel: '', // Agent aux state label
      defaultLoginDest: '',
      dialDest: '', // Destination agent is logged in with for offhook session, set on configure response, if multi values in format "xxxx|,,xxxx"
      deskphoneNumber: null,
      email: '',
      externalAgentId: '',
      firstName: '',
      geoTag: '',
      guid: '', // unique key generated on login, used for accessing spring endpoints
      isLoggedIn: false, // agent is logged in to the platform
      isOffhook: false, // track whether or not the agent has an active offhook session
      isMonitoring: false, // track whether or not the offhook session is for monitoring
      includeSupervisorStats: false, // set to true in Agent-JS app when user is on any supervisor views, when true, respond to STATS request with SUPERVISOR stat message
      initLoginState: 'AVAILABLE', // state agent is placed in on successful login
      initLoginStateLabel: 'Available', // state label for agent on successful login
      lastName: '',
      loginDTS: null, // date and time of the final login phase (IQ)
      loginType: 'NO-SELECTION', // Could be INBOUND | OUTBOUND | BLENDED | NO-SELECTION, set on login response
      maxBreakTime: -1,
      maxLunchTime: -1,
      onCall: false, // true if agent is on an active call
      onManualOutdial: false, // true if agent is on a manual outdial call
      outboundManualDefaultRingtime: '30',
      pendingCallbacks: [],
      pendingDialGroupChange: 0, // Set to Dial Group Id if we are waiting to change dial groups until agent ends call
      phoneLoginPin: '',
      realAgentType: 'AGENT',
      supervisors: [], // Used for agent chat
      totalCalls: 0, // Call counter that is incremented every time a new session is received
      transferNumber: '', // May be pre-populated by an external interface, if so, the transfer functionality uses it
      updateDGFromAdminUI: false, // if pending Dial Group change came from AdminUI, set to true (only used if request is pending)
      updateLoginMode: false, // gets set to true when doing an update login (for events control)
      username: '', // Agent's username
      wasMonitoring: false, // used to track if the last call was a monitoring call
      enableCallQuality: false, // Enable/Disable of Report Call Quality Issue
      reportCallQualityIssueTypes: [],
    };
  }

  /**
   * Shared plumbing for the contact-management activity API: resolves the
   * account scope and the auth header, both of which only exist on the main
   * client.
   *
   * Returns `undefined` when there is no RC account scope to query against.
   * Callers should also gate on `allowContactManagement` before invoking.
   */
  private _getActivityRequestContext():
    | { baseUrl: string; headers: Record<string, string> }
    | undefined {
    const fullUserDetails = this.getFullUserDetails();
    const rcAccountId = fullUserDetails?.rcAccountId;
    if (!rcAccountId) {
      return undefined;
    }
    const rcxSubAccountId = this._sdk.getAgentSettings().accountId;
    const authenticateRequest = this._sdk.getAuthenticateRequest();
    return {
      baseUrl: `${this._options.authHost}/api/cm/v1/accounts/${rcAccountId}/rcxSubaccounts/${rcxSubAccountId}/activities`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authenticateRequest.engageAccessToken}`,
      },
    };
  }

  /**
   * Look up activities by any of the identifiers the API accepts
   * (`dialogId`, `segmentId`, `contactId`, ...).
   *
   * A 404 is treated as "no activity" rather than a hard failure so history
   * call-log UI can settle on the empty state instead of spinning forever.
   */
  private async _fetchActivities(
    query: Record<string, string>,
  ): Promise<ActivityLog[]> {
    const context = this._getActivityRequestContext();
    if (!context) {
      return [];
    }
    const searchParams = new URLSearchParams({
      ...query,
      withDisplayInfo: 'false',
    });
    const response = await fetch(`${context.baseUrl}?${searchParams.toString()}`, {
      headers: context.headers,
    });
    if (response.status === 404) {
      return [];
    }
    if (!response.ok) {
      throw new Error(`Failed to get activities: ${response.status}`);
    }
    const activities = await response.json();
    return activities?.records ?? [];
  }

  @delegate('mainClient')
  async getActivityByDialogId(dialogId: string): Promise<ActivityLog | null> {
    if (!dialogId) return null;
    try {
      const records = await this._fetchActivities({ dialogId });
      return records[0] ?? null;
    } catch (error) {
      this.logger.error('getActivityByDialogId fail', error);
      return null;
    }
  }

  /**
   * Look up the activity behind a call-history row.
   *
   * History rows have no live session data, so `segmentId` is the only handle
   * on the recorded disposition/notes for a call this browser never handled.
   * A 404 still resolves to `null`. Other HTTP failures throw so the call-log
   * page can hide summary instead of treating the error as an empty activity.
   */
  @delegate('mainClient')
  async getActivityBySegmentId(segmentId: string): Promise<ActivityLog | null> {
    if (!segmentId) return null;
    try {
      const records = await this._fetchActivities({ segmentId });
      return records[0] ?? null;
    } catch (error) {
      this.logger.error('getActivityBySegmentId fail', error);
      throw error;
    }
  }

  @delegate('mainClient')
  async updateActivity(
    activityId: string,
    params: ActivityDispositionInfo,
  ): Promise<void> {
    const context = this._getActivityRequestContext();
    if (!context || !activityId) {
      return;
    }
    try {
      const response = await fetch(`${context.baseUrl}/${activityId}`, {
        method: 'PUT',
        headers: context.headers,
        body: JSON.stringify(params),
      });
      if (!response.ok) {
        throw new Error(`Failed to update activity: ${response.status}`);
      }
    } catch (error) {
      this.logger.error('updateActivity fail', error);
      throw error;
    }
  }

  @delegate('mainClient')
  async updateActivityDisposition({
    dialogId,
    params,
  }: {
    dialogId: string;
    params: ActivityDispositionInfo;
  }): Promise<void> {
    try {
      const activity = await this.getActivityByDialogId(dialogId);
      if (!activity?.id) return;
      await this.updateActivity(activity.id, params);
    } catch (error) {
      this.logger.error('updateActivityDisposition fail', error);
      throw error;
    }
  }

  /**
   * GET - /platform/api/agent/v1/agent/:agentId/history
   *
   * Cursor-paged, newest first. `before` is the previous page's last
   * `agentSegment.segmentStart`; it is sent empty for the first page, matching
   * the web agent (an empty value is what the server is known to accept).
   */
  @delegate('mainClient')
  async getAgentHistory({
    agentId,
    size = 500,
    before = '',
    archived = true,
    channelClass = 'VOICE',
  }: AgentHistoryParams): Promise<AgentHistoryResponse | undefined> {
    if (!agentId) {
      return;
    }
    const authenticateRequest = this._sdk.getAuthenticateRequest();
    const searchParams = new URLSearchParams({
      size: String(size),
      before: before ?? '',
      archived: String(archived),
      channelClass: String(channelClass),
    });
    try {
      const response = await fetch(
        `${this._options.authHost}/platform/api/agent/v1/agent/${agentId}/history?${searchParams.toString()}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authenticateRequest.engageAccessToken}`,
          },
        },
      );
      if (!response.ok) {
        throw new Error(`Failed to get agent history: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      this.logger.error('getAgentHistory fail', error);
      throw error;
    }
  }

  @delegate('mainClient')
  async searchDirectory(searchString: string) {
    const fullUserDetails = this.getFullUserDetails();
    const rcAccountId = fullUserDetails.rcAccountId;
    if (!rcAccountId) {
      return;
    }
    const rcxSubAccountId = this._sdk.getAgentSettings().accountId;
    const authenticateRequest = this._sdk.getAuthenticateRequest();
    const engageAccessToken = `Bearer ${authenticateRequest.engageAccessToken}`;
    const searchParams = new URLSearchParams();
    searchParams.set('searchString', searchString);
    try {
      const getResponse = await fetch(`${this._options.authHost}/api/v3/accounts/${rcAccountId}/sub-accounts/${rcxSubAccountId}/rc-directory/rc-corporate-directory?${searchParams.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: engageAccessToken,
        },
      });
      if (!getResponse.ok) {
        throw new Error('Failed to search directory');
      }
      // return example
      // {
      //   "rcAccountId": "37233xxxx",
      //   "pbxDirectoryEnable": true,
      //   "mainNumber": "+165043xxxx",
      //   "records": [
      //       {``
      //           "id": "265162xxxxx",
      //           "status": "Enabled",
      //           "firstName": "TestName",
      //           "lastName": "Test",
      //           "extensionNumber": "1111",
      //           "presenceStatus": "Offline",
      //           "phoneNumbers": null,
      //           "type": "User",
      //           "name": null,
      //           "account": {
      //               "id": "372332xxxx",
      //               "mainNumber": {
      //                   "formattedPhoneNumber": "+1 (650) 436xxxx",
      //                   "phoneNumber": "+165043xxxx",
      //                   "type": null,
      //                   "label": null
      //               }
      //           }
      //       }
      //   ]
      // }
      return getResponse.json();
    } catch (error) {
      this.logger.error('searchDirectory fail', error);
      throw error;
    }
  }
}

export { CxClient };
