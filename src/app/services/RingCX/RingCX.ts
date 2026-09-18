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

import { loadRingCXChunk } from '../load-ringcx-chunk';
import { keepRouterPathOnLoad } from './keep-router-path-on-load';
import type { AppFeatures as EmbeddableAppFeatures } from '../AppFeatures';
import { t } from './i18n';
import type {
  CxAgentSessionModule,
  CxAuthModule,
  RingCXOptions,
  CxRuntimeOptions,
  CxViewModule,
  StartAgentSessionOptions,
} from './RingCX.interface';
import type { CxStage } from './cxStage';

const RINGCX_CLIENT_APP_TYPE = 'RCX_Embeddable';

function deriveRingCXAuthHost(server: string): string {
  try {
    const serverUrl = new URL(server);
    serverUrl.hostname = serverUrl.hostname.replace(/^platform\./, 'ringcx.');
    return serverUrl.origin;
  } catch {
    return server;
  }
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
  readonly cxPresence?: { readonly isOnCall: boolean };

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
      () =>
        [
          this.cxAuth?.loginStatus,
          this.cxAuth?.isOnlyOneAgent,
          this.cxAgentSession?.configured,
          this.cxAgentSession?.configSuccess,
        ] as const,
      () => this._synchronizeStage(),
      { multiple: true },
    );
    watch(
      this,
      () => this._auth.loggedIn,
      (isLoggedIn: boolean) => {
        if (!isLoggedIn) {
          this._resetSession();
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
      agentAssistantPageUrl: process.env.AGENT_ASSISTANT_PAGE_URL ?? '',
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

  private _synchronizeStage(): void {
    const loginStatus = this.cxAuth?.loginStatus;
    if (!this.loaded || !this.cxAuth || !this.cxAgentSession) {
      if (this.loadRequested) {
        this._setStage('loading');
      }
      return;
    }
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
