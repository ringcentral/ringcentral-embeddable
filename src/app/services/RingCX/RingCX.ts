import type { SDKConfig } from '@ringcentral-integration/commons/lib/createSdkConfig';
import {
  AppFeatures,
  Auth,
} from '@ringcentral-integration/micro-auth/src/app/services';
import {
  Locale,
  Toast,
} from '@ringcentral-integration/micro-core/src/app/services';
import {
  action,
  computed,
  delegate,
  dynamic,
  inject,
  injectable,
  load,
  optional,
  PortManager,
  RcModule,
  RouterPlugin,
  state,
  storage,
  StoragePlugin,
  watch,
} from '@ringcentral-integration/next-core';

import type { CxExBridgeHint } from '../ActiveCallControl/is-cx-rc-ext-ex-bridge-call';
import type { AppFeatures as EmbeddableAppFeatures } from '../AppFeatures';
import { loadRingCXChunk } from '../load-ringcx-chunk';
import { keepRouterPathOnLoad } from './keep-router-path-on-load';
import { t } from './i18n';
import type {
  CxAgentSessionModule,
  CxAuthModule,
  CxLoginStatus,
  RingCXOptions,
  CxRuntimeOptions,
  CxViewModule,
  StartAgentSessionOptions,
  CxExBridgeDirectory,
} from './RingCX.interface';
import type { CxStage } from './cxStage';

const RINGCX_CLIENT_APP_TYPE = 'RCX_Embeddable';
const CX_DIALOUT_DIALING = 'dialing';
const CX_EX_BRIDGE_PENDING_TIMEOUT_MS = 2 * 60 * 1000;

type CxLiveCallDestination = {
  readonly dialDest?: string;
  readonly dnis?: string;
  readonly dnisE164?: string;
};

type PendingExBridgeDestination = {
  destination: string;
  extensionId: string;
  name: string;
  mainNumber: string;
};

function deriveRingCXAuthHost(server: string): string {
  try {
    const serverUrl = new URL(server);
    serverUrl.hostname = serverUrl.hostname.replace(/^platform\./, 'ringcx.');
    return serverUrl.origin;
  } catch {
    return server;
  }
}

const RC_EXT_SUFFIX = '@RC_EXT';

function readCxRcExtMainNumber(destination: string): string {
  const trimmed = destination.trim();
  if (!trimmed.toUpperCase().endsWith(RC_EXT_SUFFIX)) {
    return '';
  }
  const withoutSuffix = trimmed.slice(0, -RC_EXT_SUFFIX.length);
  const separatorIndex = withoutSuffix.lastIndexOf('*');
  if (separatorIndex <= 0) {
    return '';
  }
  return withoutSuffix.slice(0, separatorIndex);
}

@injectable({
  name: 'RingCX',
})
export class RingCX extends RcModule {
  private _loadPromise: Promise<void> | null = null;

  @dynamic('CxAuth')
  readonly cxAuth?: CxAuthModule;

  @dynamic('CxAgentSession')
  readonly cxAgentSession?: CxAgentSessionModule;

  @dynamic('CxAppView')
  readonly appView?: CxViewModule;

  @dynamic('CxSettingsView')
  readonly settingsView?: CxViewModule;

  @dynamic('CxAnnouncementsView')
  readonly announcementsView?: CxViewModule;

  @dynamic('CxPresence')
  readonly cxPresence?: {
    readonly isOnCall: boolean;
    readonly dialoutStatus?: string;
    readonly calls?: ReadonlyArray<CxLiveCallDestination>;
  };

  @dynamic('CxWorkingState')
  readonly cxWorkingState?: { readonly isPendingDisposition: boolean };

  @state
  stage: CxStage = 'idle';

  @state
  loaded = false;

  @state
  loadRequested = false;

  @state
  lastError: string | null = null;

  /**
   * Whether a configured agent session should be restored on the next load.
   * Only a session that reached `ready` counts, so a setup the user never
   * finished does not drag them back into the config form after a reload.
   */
  @storage
  @state
  sessionWanted = false;

  /**
   * Corporate-directory members registered at CX dialout, before IQ NEW-CALL.
   * Used by {@link exBridgeHints} to hide the RingEX ghost session.
   */
  @state
  pendingExBridgeDestinations: PendingExBridgeDestination[] = [];

  private _exBridgeDestinationTimeouts = new Map<
    string,
    ReturnType<typeof setTimeout>
  >();

  constructor(
    private readonly _appFeatures: AppFeatures,
    private readonly _auth: Auth,
    private readonly _portManager: PortManager,
    private readonly _router: RouterPlugin,
    private readonly _storage: StoragePlugin,
    private readonly _toast: Toast,
    private readonly _locale: Locale,
    @inject('SdkConfig') private readonly _sdkConfig: SDKConfig,
    @optional('RingCXOptions')
    private readonly _options?: RingCXOptions,
    @optional('Version') private readonly _version?: string,
  ) {
    super();
    this._storage.enable(this);
    // Registered here, and not from a lifecycle hook, so the handler exists on
    // every port before the RingCX chunk is loaded.
    this._auth.addBeforeLogoutHandler(async () => {
      await this.disconnectAgentSessionForSignOut();
    });
  }

  get enabled(): boolean {
    return (this._appFeatures as EmbeddableAppFeatures).isRingCXEnabled;
  }

  /**
   * A CX module exists as soon as the chunk starts wiring itself up, but its
   * state only reaches the store once the load finishes, so host callers must
   * wait for `loaded` before reading through to one.
   */
  get hasActiveCall(): boolean {
    if (!this.loaded) {
      return false;
    }
    return this.cxPresence?.isOnCall ?? false;
  }

  get canEndAgentSession(): boolean {
    if (!this.loaded) {
      return true;
    }
    return !this.hasActiveCall && !this.cxWorkingState?.isPendingDisposition;
  }

  /**
   * Directory id/name for a live or just-dialed CX internal call, used to hide
   * the ghost EX session from Phone UI.
   */
  @computed((that: RingCX) => [that.pendingExBridgeDestinations])
  get exBridgeHints(): readonly CxExBridgeHint[] {
    const hints: CxExBridgeHint[] = [];
    const seen = new Set<string>();
    this.pendingExBridgeDestinations.forEach((pending) => {
      const key = `${pending.extensionId}|${pending.name}|${pending.mainNumber}`;
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      hints.push({
        extensionId: pending.extensionId,
        name: pending.name,
        mainNumber: pending.mainNumber,
      });
    });
    return hints;
  }

  /**
   * Remember the directory member a CX outbound is targeting so RingEX can
   * hide the ghost session that may arrive before IQ NEW-CALL.
   */
  registerExBridgeDestination(
    destination: string,
    directory: CxExBridgeDirectory,
  ): void {
    if (!directory.extensionId && !directory.name) {
      return;
    }
    this._addPendingExBridgeDestination({
      destination,
      extensionId: directory.extensionId.trim(),
      name: directory.name.trim(),
      mainNumber:
        directory.mainNumber.trim() || readCxRcExtMainNumber(destination),
    });
    this._scheduleExBridgeDestinationTimeout(destination);
  }

  /** Drop a previously registered CX `@RC_EXT` destination. */
  clearExBridgeDestination(destination: string): void {
    this._clearExBridgeDestinationTimeout(destination);
    this._removePendingExBridgeDestination(destination);
  }

  override onInitOnce(): void {
    watch(
      this,
      () => this.loadRequested,
      (isLoadRequested: boolean) => {
        if (isLoadRequested) {
          void this.ensureLoaded();
        }
      },
    );
    watch(
      this,
      () => this._sessionStageInputs(),
      () => this._synchronizeStage(),
      { multiple: true },
    );
    watch(
      this,
      () => this._auth.loggedIn,
      (isLoggedIn: boolean) => {
        if (isLoggedIn || !this._isRuntimeOwner()) {
          return;
        }
        // Safety net for a logout that never runs the before-logout handlers,
        // a failed token refresh for example. The teardown is idempotent, so
        // it is harmless right after the handler.
        void this.disconnectAgentSessionForSignOut();
      },
    );
    watch(
      this,
      () => this._hasLivePresenceCalls(),
      (isOnCall: boolean, wasOnCall: boolean) => {
        if (wasOnCall && !isOnCall) {
          this._clearAllPendingExBridgeDestinations();
        }
      },
    );
    if (this.loadRequested) {
      void this.ensureLoaded();
    }
  }

  override onInitSuccess(): void {
    if (
      this._isRuntimeOwner() &&
      this.enabled &&
      this.sessionWanted &&
      this._auth.loggedIn
    ) {
      void this.startAgentSession({ requestedByUser: false });
    }
  }

  async ensureLoaded(): Promise<void> {
    if (this._loadPromise) {
      return this._loadPromise;
    }
    this._loadPromise = this._loadOnThisPort();
    try {
      await this._loadPromise;
    } catch (error) {
      this._loadPromise = null;
      throw error;
    }
  }

  /**
   * @param requestedByUser The user asked for the session, so the setup flow
   * may open its own pages. A session restored on load must stay in the
   * background instead.
   */
  @delegate('server')
  async startAgentSession({
    requestedByUser = true,
  }: StartAgentSessionOptions = {}): Promise<void> {
    if (!this.enabled || !this._auth.loggedIn) {
      return;
    }
    this._requestLoad();
    try {
      await this._loadOnRuntimePorts();
      if (!this.cxAuth) {
        throw new Error('RingCX authentication module was not registered');
      }
      await this.cxAuth.startAgentLogin({ requestedByUser });
      this._synchronizeStage();
    } catch (error) {
      this._setError(error);
      this._toast.danger({
        message: t('agentSessionStartFailed'),
      });
    }
  }

  @delegate('server')
  async endAgentSession(): Promise<void> {
    try {
      await this.cxAuth?.logout();
    } finally {
      this._resetSession();
    }
  }

  /**
   * Disconnect the agent session because the RC user is signing out. The
   * session goes down even while a call or a disposition is in progress, and a
   * failure here never holds the RC logout back.
   */
  @delegate('server')
  async disconnectAgentSessionForSignOut(): Promise<void> {
    if (!this.enabled || !this.loaded || !this.cxAuth || this.stage === 'idle') {
      this._resetSession();
      return;
    }
    try {
      await this.cxAuth.logoutForUserSignOut();
    } catch (error) {
      this.logger.error('RingCX sign-out teardown failed', error);
    } finally {
      this._resetSession();
    }
  }

  @action
  private _requestLoad(): void {
    this.loadRequested = true;
    this.stage = 'loading';
    this.lastError = null;
  }

  @action
  private _markLoaded(): void {
    this.loaded = true;
  }

  @action
  private _setSessionWanted(sessionWanted: boolean): void {
    this.sessionWanted = sessionWanted;
  }

  @action
  private _setStage(stage: CxStage): void {
    this.stage = stage;
    if (stage !== 'error') {
      this.lastError = null;
    }
  }

  @action
  private _setError(error: unknown): void {
    this.stage = 'error';
    this.lastError =
      error instanceof Error ? error.message : 'Unknown RingCX error';
  }

  @action
  private _resetSession(): void {
    this.stage = 'idle';
    this.sessionWanted = false;
    this.lastError = null;
    this._exBridgeDestinationTimeouts.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    this._exBridgeDestinationTimeouts.clear();
    this.pendingExBridgeDestinations.splice(
      0,
      this.pendingExBridgeDestinations.length,
    );
  }

  @action
  private _addPendingExBridgeDestination(
    pending: PendingExBridgeDestination,
  ): void {
    if (
      this.pendingExBridgeDestinations.some(
        (item) => item.destination === pending.destination,
      )
    ) {
      return;
    }
    this.pendingExBridgeDestinations.push(pending);
  }

  @action
  private _removePendingExBridgeDestination(destination: string): void {
    const destinationIndex = this.pendingExBridgeDestinations.findIndex(
      (item) => item.destination === destination,
    );
    if (destinationIndex < 0) {
      return;
    }
    this.pendingExBridgeDestinations.splice(destinationIndex, 1);
  }

  @action
  private _clearPendingExBridgeDestinationState(): void {
    this.pendingExBridgeDestinations.splice(
      0,
      this.pendingExBridgeDestinations.length,
    );
  }

  private _clearAllPendingExBridgeDestinations(): void {
    this._exBridgeDestinationTimeouts.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    this._exBridgeDestinationTimeouts.clear();
    this._clearPendingExBridgeDestinationState();
  }

  private _scheduleExBridgeDestinationTimeout(destination: string): void {
    this._clearExBridgeDestinationTimeout(destination);
    const timeoutId = setTimeout(() => {
      this._expireExBridgeDestination(destination);
    }, CX_EX_BRIDGE_PENDING_TIMEOUT_MS);
    this._exBridgeDestinationTimeouts.set(destination, timeoutId);
  }

  private _clearExBridgeDestinationTimeout(destination: string): void {
    const timeoutId = this._exBridgeDestinationTimeouts.get(destination);
    if (!timeoutId) {
      return;
    }
    clearTimeout(timeoutId);
    this._exBridgeDestinationTimeouts.delete(destination);
  }

  private _expireExBridgeDestination(destination: string): void {
    this._exBridgeDestinationTimeouts.delete(destination);
    if (
      this.hasActiveCall ||
      (this.loaded && this.cxPresence?.dialoutStatus === CX_DIALOUT_DIALING)
    ) {
      return;
    }
    this.clearExBridgeDestination(destination);
  }

  /**
   * Several RingCX modules delegate to the main client while they initialize,
   * so the main client has to own the chunk before the server instantiates
   * them. Otherwise those calls reach a port where the module does not exist.
   */
  private async _loadOnRuntimePorts(): Promise<void> {
    if (this._portManager.shared && this._portManager.isServer) {
      await delegate(this as RingCX, 'ensureLoaded', [], {
        target: 'mainClient',
      });
    }
    await this.ensureLoaded();
  }

  private async _loadOnThisPort(): Promise<void> {
    const chunk = await loadRingCXChunk();
    keepRouterPathOnLoad(this._router);
    await load(this, chunk.getRingCXModules(this._buildRuntimeOptions()));
    this._markLoaded();
    this._synchronizeStage();
  }

  private _buildRuntimeOptions(): CxRuntimeOptions {
    return {
      agentAssistantClientId: process.env.AGENT_ASSISTANT_CLIENT_ID ?? '',
      agentAssistantPageUrl: process.env.AGENT_ASSISTANT_PAGE_URL ?? '',
      agentScriptPageUrl: process.env.AGENT_SCRIPT_PAGE_URL ?? '',
      authHost: this._resolveAuthHost(),
      clientAppType: RINGCX_CLIENT_APP_TYPE,
      clientAppVersion: this._version ?? '',
      currentLocale: this._locale.currentLocale,
      enableAgentScript: this._options?.enableAgentScript ?? false,
      hideCallNote: this._options?.hideCallNote ?? false,
    };
  }

  /**
   * The `evServer` option wins over the build-time `RINGCX_AUTH_HOST`
   * override, which wins over the mapping from the RC platform server.
   */
  private _resolveAuthHost(): string {
    const configuredServer = this._options?.evServer;
    if (configuredServer) {
      return deriveRingCXAuthHost(configuredServer);
    }
    return (
      process.env.RINGCX_AUTH_HOST ||
      deriveRingCXAuthHost(this._sdkConfig.server ?? '')
    );
  }

  /**
   * Dynamic CX modules are attached before their reducers exist. Reading
   * their state in that window throws, so the first row stays inert until
   * `loaded`. `watch({ multiple: true })` also requires this array on the
   * first read, which happens in `onInitOnce` before the chunk is loaded.
   */
  private _sessionStageInputs(): readonly [
    boolean,
    CxLoginStatus | null,
    boolean,
    boolean,
    boolean,
  ] {
    if (!this.loaded || !this.cxAuth || !this.cxAgentSession) {
      return [false, null, false, false, false];
    }
    return [
      true,
      this.cxAuth.loginStatus,
      this.cxAuth.isOnlyOneAgent,
      this.cxAgentSession.configured,
      this.cxAgentSession.configSuccess,
    ];
  }

  private _hasLivePresenceCalls(): boolean {
    if (!this.loaded) {
      return false;
    }
    return (this.cxPresence?.calls?.length ?? 0) > 0;
  }

  private _synchronizeStage(): void {
    if (!this.loaded || !this.cxAuth || !this.cxAgentSession) {
      if (this.loadRequested) {
        this._setStage('loading');
      }
      return;
    }
    const loginStatus = this.cxAuth.loginStatus;
    if (loginStatus === 'authFailure') {
      this._setStage('error');
      return;
    }
    if (loginStatus === 'authing' || loginStatus === 'reauthing') {
      this._setStage('authenticating');
      return;
    }
    if (loginStatus !== 'authSuccess') {
      this._setStage('idle');
      return;
    }
    if (!this.cxAuth.isOnlyOneAgent && !this.cxAuth.agentId) {
      this._setStage('chooseAccount');
      this._setSessionWanted(false);
      return;
    }
    // A stored configuration does not make a session live: the agent still has
    // to be configured with the RingCX server in this run, so the stage waits
    // for that instead of jumping straight to the agent pages.
    if (!this.cxAgentSession.configSuccess) {
      this._setStage('sessionConfig');
      // Authenticated with no configuration to restore means the next load
      // opens the Agent tab start screen.
      if (!this.cxAgentSession.configured) {
        this._setSessionWanted(false);
      }
      return;
    }
    this._setStage('ready');
    this._setSessionWanted(true);
  }

  private _isRuntimeOwner(): boolean {
    return !this._portManager.shared || this._portManager.isServer;
  }
}
