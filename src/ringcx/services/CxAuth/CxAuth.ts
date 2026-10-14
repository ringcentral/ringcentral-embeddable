import {
  Auth,
  Client,
} from '@ringcentral-integration/micro-auth/src/app/services';
import { Locale, Toast } from '@ringcentral-integration/micro-core/src/app/services';
import { BlockPlugin } from '@ringcentral-integration/micro-core/src/app/plugins';

import { sleep } from '../../lib/utils';
import format from '@ringcentral-integration/phone-number/lib/format';
import {
  action,
  computed,
  injectable,
  RcModule,
  state,
  storage,
  StoragePlugin,
  PortManager,
  delegate,
} from '@ringcentral-integration/next-core';
import { EventEmitter } from 'events';

import { CxLoginStatus, evAuthEvent, messageTypes } from '../../enums';
import type { CxAgentConfig, CxAgentData } from '../CxClient/interfaces';
import { CxCallbackTypes } from '../CxClient/enums';
import { CxTypeError } from '../../lib/CxTypeError';
import { sortByName } from '../../lib/sortByName';
import { CxClient } from '../CxClient';
import { CxSubscription } from '../CxSubscription';

import type {
  AuthenticateWithTokenParams,
  LoginAgentParams,
  OpenSocketParams,
  StartAgentLoginOptions,
} from './CxAuth.interface';
import i18n, { t } from './i18n';
import { track } from '../Analytics/track';
import { trackEvents } from '../../lib/trackEvents';
import { canRejoinEvSession } from '../../utils/canRejoinEvSession';

const DEFAULT_COUNTRIES = ['USA', 'CAN'];
const AGENT_CONFIG_TIMEOUT_MS = 10 * 1000;

/**
 * CxAuth module - Authentication and agent login management
 * Handles agent connection, authentication tokens, agent selection
 */
@injectable({
  name: 'CxAuth',
})
class CxAuth extends RcModule {
  private _eventEmitter = new EventEmitter();

  public canUserLogoutFn: () => Promise<boolean> = async () => true;
  private _connectOrReauthenticatePromise: Promise<void> | null = null;
  private _refreshEvTokenPromise: Promise<boolean> | null = null;

  constructor(
    private cxClient: CxClient,
    private auth: Auth,
    private client: Client,
    private cxSubscription: CxSubscription,
    private locale: Locale,
    private toast: Toast,
    private block: BlockPlugin,
    private storage: StoragePlugin,
    private portManager: PortManager,
  ) {
    super();
    this.storage.enable(this);
    if (this.portManager?.shared) {
      // The Agent SDK lives on the server port, so its socket and login
      // survive main tab changes and need no re-authentication then.
      this.portManager.onServer(() => {
        this.initialize();
      });
    } else {
      this.initialize();
    }
  }

  @state
  loginStatus: CxLoginStatus = CxLoginStatus.NO_AUTH;

  @storage
  @state
  agent: CxAgentData | null = null;

  @storage
  @state
  agentId = '';

  @storage
  @state
  isFreshAgentLogin = true;

  /**
   * Whether the agent setup flow may take over the router. A start the user
   * asked for owns the route until the flow has moved the app into the agent
   * pages; a session restored in the background never does.
   */
  @state
  setupNavigationRequested = false;

  get isAuthing(): boolean {
    return this.loginStatus === CxLoginStatus.AUTHING;
  }

  get isEvLogged(): boolean {
    return this.loginStatus === CxLoginStatus.AUTH_SUCCESS;
  }

  get isReauthing(): boolean {
    return this.loginStatus === CxLoginStatus.REAUTHING;
  }

  @action
  _setAgentId(agentId: string) {
    this.agentId = agentId;
  }

  @action
  _setLoginStatus(status: CxLoginStatus) {
    this.loginStatus = status;
  }

  @action
  _setSetupNavigationRequested(requested: boolean) {
    this.setupNavigationRequested = requested;
  }

  /**
   * Marks the requested setup navigation as done, so later background events
   * of the same session cannot pull the user out of the tab they are on.
   */
  completeSetupNavigation(): void {
    if (this.setupNavigationRequested) {
      this._setSetupNavigationRequested(false);
    }
  }

  @delegate('server')
  async setAgentId(agentId: string): Promise<void> {
    this._setAgentId(agentId);
  }

  @action
  setAgent(agent: CxAgentData | null) {
    this.agent = agent;
  }

  @action
  _completeLogin(agent: CxAgentData) {
    this.agent = agent;
    this.loginStatus = CxLoginStatus.AUTH_SUCCESS;
  }

  @track(trackEvents.loginAgent)
  @delegate('server')
  async completeLogin(agent: CxAgentData): Promise<void> {
    this._completeLogin(agent);
  }

  @action
  _clearAgentId() {
    this.agentId = '';
  }

  @delegate('server')
  async clearAgentId(): Promise<void> {
    this._clearAgentId();
  }

  /**
   * Leaves the selected agent account before it is configured, so the user
   * can pick another one from the accounts this authentication returned.
   */
  @delegate('server')
  async reselectAgent(): Promise<void> {
    await this.cxClient.closeSocket();
    // The SDK fills its model from the first agent's login phase 1 only and
    // answers later ones with that cached data, so the next account would get
    // the previous account's queues and dial groups.
    this.cxClient.resetUIModel();
    this._clearAgentId();
    this._setLoginStatus(CxLoginStatus.AUTHING);
  }

  get isFreshLogin(): boolean {
    return this.isFreshAgentLogin;
  }

  @action
  setNotFreshLogin(): void {
    this.isFreshAgentLogin = false;
  }

  @action
  private _setFreshAgentLogin(): void {
    this.isFreshAgentLogin = true;
  }

  get isOnlyOneAgent(): boolean {
    return this.agent?.authenticateResponse?.agents?.length === 1;
  }

  /**
   * RingCX authenticated a user with more than one agent account. The login
   * stays `AUTHING` until the user picks one and its socket opens, so the
   * account picker has to be offered from this state.
   */
  get isAgentSelectionPending(): boolean {
    return (
      this.loginStatus === CxLoginStatus.AUTHING &&
      !this.agentId &&
      (this.authenticateResponse?.agents?.length ?? 0) > 1
    );
  }

  get agentConfig() {
    return this.agent?.agentConfig || null;
  }

  get authenticateResponse() {
    return this.agent?.authenticateResponse || null;
  }

  get agentSettings() {
    return this.agentConfig?.agentSettings;
  }

  get outboundManualDefaultRingtime() {
    return this.agentSettings?.outboundManualDefaultRingtime;
  }

  get inboundSettings() {
    return (
      this.agentConfig?.inboundSettings || {
        availableQueues: [] as Array<undefined>,
        availableSkillProfiles: [] as Array<undefined>,
        queues: [] as Array<undefined>,
        skillProfile: {} as any,
        availableRequeueQueues: [] as Array<undefined>,
      }
    );
  }

  get assignedQueue() {
    return this.inboundSettings.queues;
  }

  get agentPermissions() {
    return this.agentConfig?.agentPermissions;
  }

  @computed((that: CxAuth) => [that.inboundSettings.availableQueues])
  get availableQueues() {
    return [
      {
        gateId: '-1',
        gateName: i18n.getString('default', this.locale.currentLocale),
      },
      ...sortByName([...this.inboundSettings.availableQueues], 'gateName'),
    ];
  }

  @computed((that: CxAuth) => [that.inboundSettings.availableRequeueQueues])
  get availableRequeueQueues() {
    const list = sortByName(
      [...this.inboundSettings.availableRequeueQueues],
      'groupName',
    );
    return list.map((queue) => ({
      ...queue,
      gates: Array.isArray(queue.gates) ? queue.gates : [],
    }));
  }

  @computed((that: CxAuth) => [that.agentSettings?.callerIds])
  get callerIds() {
    if (!this.agentSettings?.callerIds) {
      return [];
    }
    return [
      {
        description: i18n.getString('default', this.locale.currentLocale),
        number: '-1',
      },
      ...this.agentSettings.callerIds.map((callerId) => {
        const number =
          format({
            phoneNumber: callerId.number,
            countryCode: 'US',
          }) || callerId.number;
        return {
          ...callerId,
          number,
        };
      }),
    ];
  }

  @computed((that: CxAuth) => [
    that.agentConfig?.applicationSettings?.availableCountries,
    that.locale.currentLocale,
  ])
  get availableCountries() {
    const availableCountries =
      this.agentConfig?.applicationSettings?.availableCountries || [];
    return availableCountries.length > 0
      ? availableCountries
      : [
          {
            countryId: 'USA',
            countryName: i18n.getString('us', this.locale.currentLocale),
          },
        ];
  }

  initialize() {
    this.auth.addAfterLoggedInHandler(() => {
      this.logger.info('AfterLoggedInHandler~~');
      this.clearAgentId();
    });
    this.cxSubscription.subscribe(CxCallbackTypes.LOGOUT, async () => {
      this.toast.info({
        message: t(messageTypes.FORCE_LOGOUT),
      });
      this.logger.info('CxCallbackTypes.LOGOUT~~, newReconnect');
      this._emitLogoutBefore();
      await this.newReconnect();
    });
  }

  @delegate('server')
  async startAgentLogin({
    requestedByUser = false,
  }: StartAgentLoginOptions = {}): Promise<void> {
    if (
      !this.auth.loggedIn ||
      this.loginStatus !== CxLoginStatus.NO_AUTH
    ) {
      return;
    }
    this._setSetupNavigationRequested(requestedByUser);
    if (this._connectOrReauthenticatePromise) {
      return this._connectOrReauthenticatePromise;
    }
    this._connectOrReauthenticatePromise = this._connectOrReauthenticate();
    try {
      await this._connectOrReauthenticatePromise;
    } finally {
      this._connectOrReauthenticatePromise = null;
    }
  }

  private async _connectOrReauthenticate(): Promise<void> {
    if (this.loginStatus !== CxLoginStatus.REAUTHING) {
      this._setLoginStatus(CxLoginStatus.AUTHING);
    }
    await this.block.next(async () => {
      this.logger.info('connectOrReauthenticate~~, agentId', this.agentId);
      if (this.agentId) {
        // A reload lands here. A socket-level rejoin is not possible on a
        // freshly created SDK instance (its Layer 2 reconnect needs the
        // in-memory login state), so this is always a fresh login. A call or
        // disposition the server still holds is recovered through the
        // persisted activity call id and the server's PENDING_DISP push.
        await this.loginAgent();
      } else {
        // Without a selected agent nothing stored belongs to this login, and
        // an earlier account list would open the picker before this
        // authentication answers.
        this.setAgent(null);
        await this.authenticateWithToken();
      }
    });
  }

  /**
   * A failing agent logout must not leave the socket and the stored session
   * behind, so each stage reports its own error and the state still lands on
   * `NO_AUTH`.
   */
  private _logout = async (): Promise<void> => {
    this._setSetupNavigationRequested(false);
    this._setLoginStatus(CxLoginStatus.UNAUTHING);
    this._emitLogoutBefore();
    try {
      const logoutAgentResponse = await this.logoutAgent(this.agentId);
      if (logoutAgentResponse.message !== 'OK') {
        this.logger.info('logoutAgent failed~~', logoutAgentResponse.message);
      }
      this.setAgent(null);
      await this.clearAgentId();
    } catch (error) {
      this.logger.error('logout error~~', error);
    }
    try {
      await this.cxClient.clearEvSession();
      await this.cxClient.closeSocket();
    } catch (error) {
      this.logger.error('closeSocket error~~', error);
    }
    this._setLoginStatus(CxLoginStatus.NO_AUTH);
  };

  onceLogout(cb: () => any) {
    return this.cxSubscription.once(CxCallbackTypes.LOGOUT, cb);
  }

  @delegate('server')
  async logout(): Promise<void> {
    if (!(await this.canUserLogoutFn())) {
      return;
    }
    await this.block.next(this._logout);
  }

  /**
   * Tear the session down because the RC user is signing out. Unlike
   * {@link logout}, the next agent login must start from a fresh setup.
   */
  @delegate('server')
  async logoutForUserSignOut(): Promise<void> {
    this.logger.info('logoutForUserSignOut~~');
    await this._logout();
    this._setFreshAgentLogin();
  }

  @delegate('server')
  async logoutAgent(agentId: string = this.agentId) {
    return this.cxClient.logoutAgent(agentId);
  }

  beforeAgentLogout(callback: () => void) {
    this._eventEmitter.on(evAuthEvent.LOGOUT_BEFORE, callback);
  }

  /**
   * Full re-authentication. Clearing the EV session wipes the SDK's session
   * hash code, so the next login is a fresh one and any call the server still
   * holds is orphaned in pending disposition.
   *
   * Prefer {@link retryConnection} for connection problems; reserve this for
   * cases where the session is genuinely invalid, such as a forced logout.
   */
  @delegate('server')
  async newReconnect(isBlock = true) {
    this.logger.info('newReconnect~~');
    this._setLoginStatus(CxLoginStatus.REAUTHING);
    await this.cxClient.clearEvSession();
    await this.cxClient.closeSocket();
    const fn = () => this.loginAgent();
    return isBlock ? this.block.next(fn) : fn();
  }

  /**
   * Re-establish the socket while keeping the SDK session intact, so the
   * server resumes the existing session and reports back whether the agent is
   * still on a call or owes a disposition.
   *
   * Rejoining is only attempted while the stored session is fresh enough to
   * still exist server-side; otherwise, and when the rejoin attempt itself
   * fails before the socket opens, a full re-authentication runs instead.
   */
  @delegate('server')
  async retryConnection(): Promise<void> {
    this.logger.info('retryConnection~~');
    if (!(await this._canRejoinStoredSession())) {
      await this.newReconnect();
      return;
    }
    this._setLoginStatus(CxLoginStatus.REAUTHING);
    await this.block.next(async () => {
      try {
        await this.cxClient.closeSocket();
        await this.loginAgent({ tryRejoin: true, retryOpenSocket: true });
      } catch (error) {
        this.logger.error('retryConnection~~ failed, reauthenticating', error);
        await this.newReconnect(false);
      }
    });
  }

  private async _canRejoinStoredSession(): Promise<boolean> {
    const stored = await this.cxClient.getStoredSession();
    const { canRejoin, reason } = canRejoinEvSession({
      stored,
      agentId: this.agentId,
      now: Date.now(),
    });
    if (!canRejoin) {
      this.logger.info('retryConnection~~ rejoin not possible', reason);
    }
    return canRejoin;
  }

  @delegate('server')
  async authenticateWithToken({
    shouldEmitAuthSuccess = true,
  }: AuthenticateWithTokenParams = {}) {
    this.logger.info('authenticateWithToken', shouldEmitAuthSuccess);
    try {
      await this.auth.ensureValidAccessToken();
      const rcAccessToken = await this._getRcAccessToken();
      await this.cxClient.initSDK();
      const authenticateResponse =
        await this.cxClient.getAndHandleAuthenticateResponse(
          rcAccessToken,
          'Bearer',
        );
      if ('error' in authenticateResponse) {
        throw new CxTypeError({
          type: authenticateResponse.error,
          data: authenticateResponse.data,
        });
      }
      this.logger.info('authenticateWithToken authenticateResponse~~');
      const agent = { ...this.agent, authenticateResponse } as CxAgentData;
      this.setAgent(agent);
      if (shouldEmitAuthSuccess) {
        this._emitAuthSuccess();
      }
      return authenticateResponse;
    } catch (error: any) {
      this.logger.error('authenticateWithToken error~~', error, error.type);
      switch (error.type) {
        case messageTypes.NO_AGENT:
          this.toast.warning({
            message: t(error.type),
          });
          break;
        case messageTypes.CONNECT_TIMEOUT:
        case messageTypes.UNEXPECTED_AGENT:
          this.toast.danger({
            message: t(error.type),
          });
          break;
        default:
          this.logger.error('authenticateWithToken error~~', error.type, error.message);
          this.toast.danger({
            message: t(messageTypes.CONNECT_ERROR),
          });
      }
      this.logger.error('authenticateWithToken logout~~');
      this._setLoginStatus(CxLoginStatus.AUTH_FAILURE);
      await this._logout();
    }
  }

  /**
   * Read the RC access token from the platform rather than `auth.accessToken`.
   * A refresh triggered by `ensureValidAccessToken` saves the new token on the
   * platform first and only copies it into the Auth state from an async
   * `refreshSuccess` listener, so that state can still hold the expired token
   * when the exchange for an Engage token runs.
   */
  private async _getRcAccessToken(): Promise<string> {
    const { access_token: accessToken } = await this.client.service
      .platform()
      .auth()
      .data();
    return accessToken || this.auth.accessToken;
  }

  @delegate('server')
  async refreshEvToken(): Promise<boolean> {
    if (this._refreshEvTokenPromise) {
      return this._refreshEvTokenPromise;
    }
    this._refreshEvTokenPromise = this._refreshEvToken();
    try {
      return await this._refreshEvTokenPromise;
    } finally {
      this._refreshEvTokenPromise = null;
    }
  }

  private async _refreshEvToken(): Promise<boolean> {
    const result = await this.cxClient.refreshEvToken();
    if (result) {
      return true;
    }
    const authenticateResponse = await this.authenticateWithToken({
      shouldEmitAuthSuccess: false,
    });
    return !!authenticateResponse;
  }

  @delegate('server')
  async openSocketWithSelectedAgentId({
    syncOtherTabs = false,
    retryOpenSocket = false,
  }: OpenSocketParams = {}): Promise<CxAgentConfig | undefined> {
    this.logger.info(
      'openSocketWithSelectedAgentId',
      syncOtherTabs,
      retryOpenSocket,
    );
    try {
      const selectedAgentId = this.agentId;
      if (!selectedAgentId) {
        throw new CxTypeError({
          type: messageTypes.NO_AGENT,
        });
      }
      const openSocketResult = await this.cxClient.openSocket(selectedAgentId);
      await sleep(0);
      if (openSocketResult.error) {
        this.logger.info('retryOpenSocket~~', retryOpenSocket);
        if (retryOpenSocket) {
          const authenticateRes = await this.authenticateWithToken({
            shouldEmitAuthSuccess: false,
          });
          if (!authenticateRes) return;
          const openSocketRes = await this.openSocketWithSelectedAgentId({
            syncOtherTabs,
          });
          return openSocketRes;
        }
        throw new CxTypeError({
          type: messageTypes.OPEN_SOCKET_ERROR,
        });
      }
      this.logger.info('openSocketWithSelectedAgentId getAgentConfig~~');
      const agentConfig = await this.cxClient.getAgentConfig();
      if (!agentConfig) {
        throw new CxTypeError({
          type: messageTypes.CONNECT_TIMEOUT,
        });
      }
      this.logger.info('openSocketWithSelectedAgentId getAgentConfig done~~');
      const agent = { ...this.agent, agentConfig } as CxAgentData;
      await this.completeLogin(agent);
      this._emitLoginSuccess();
      return agentConfig;
    } catch (error: any) {
      switch (error.type) {
        case messageTypes.NO_AGENT:
          this.toast.warning({
            message: t(error.type),
          });
          break;
        case messageTypes.INVALID_BROWSER:
        case messageTypes.OPEN_SOCKET_ERROR:
          this.toast.danger({
            message: t(error.type),
          });
          break;
        default:
          this.toast.danger({
            message: t(messageTypes.CONNECT_ERROR),
          });
      }
      this._setLoginStatus(CxLoginStatus.AUTH_FAILURE);
      await this._logout();
    }
  }

  /**
   * @param tryRejoin Resume the stored server session rather than starting a
   * new one. Leave it off when the caller has deliberately invalidated the
   * session, such as after a forced logout.
   * @param retryOpenSocket On a failed socket open, re-authenticate and try
   * one more time instead of logging the agent out immediately.
   */
  @delegate('server')
  async loginAgent({
    tryRejoin = false,
    retryOpenSocket = false,
  }: LoginAgentParams = {}): Promise<void> {
    this.logger.info('loginAgent~~', { tryRejoin });
    const authenticateRes = await this.authenticateWithToken({
      shouldEmitAuthSuccess: false,
    });
    if (!authenticateRes) return;
    if (tryRejoin) {
      await this._prepareSessionRejoin();
    }
    await this.openSocketWithSelectedAgentId({ retryOpenSocket });
  };

  /**
   * Hand the SDK the stored session token so the next socket open is a Layer 2
   * reconnect. A no-op when the token is missing, stale, belongs to a
   * different agent, or the SDK instance has not completed a login in this
   * page, in which case the caller falls through to a fresh login.
   */
  private async _prepareSessionRejoin(): Promise<boolean> {
    const stored = await this.cxClient.getStoredSession();
    const { canRejoin, reason } = canRejoinEvSession({
      stored,
      agentId: this.agentId,
      now: Date.now(),
    });
    if (!canRejoin) {
      this.logger.info('prepareSessionRejoin~~ skipped', reason);
      return false;
    }
    this.logger.info('prepareSessionRejoin~~ resuming session');
    return this.cxClient.prepareSessionRejoin(stored!.hashCode);
  }

  onceLoginSuccess(callback: () => void) {
    this._eventEmitter.once(evAuthEvent.LOGIN_SUCCESS, callback);
  }

  onLoginSuccess(callback: () => void) {
    this._eventEmitter.on(evAuthEvent.LOGIN_SUCCESS, callback);
  }

  onAuthSuccess(callback: () => void) {
    this._eventEmitter.on(evAuthEvent.AUTH_SUCCESS, callback);
  }

  private _emitLogoutBefore() {
    this._eventEmitter.emit(evAuthEvent.LOGOUT_BEFORE);
  }

  private _emitLoginSuccess() {
    this._eventEmitter.emit(evAuthEvent.LOGIN_SUCCESS);
  }

  private _emitAuthSuccess() {
    this._eventEmitter.emit(evAuthEvent.AUTH_SUCCESS);
  }

  /**
   * Get agent ID
   */
  getAgentId(): string {
    return this.agentId;
  }

  /**
   * Check if i18n is enabled for the agent
   */
  get isI18nEnabled(): boolean {
    return !!(this.agent as any)?.isI18nEnabled;
  }
}

export { CxAuth };
