import callDirections from '@ringcentral-integration/commons/enums/callDirections';
import type { NormalizedSession } from '@ringcentral-integration/commons/interfaces/Webphone.interface';
import { sleep } from '@ringcentral-integration/commons/utils';
import {
  AppFeatures,
  Auth,
  Client,
  track,
  type WebSocketSubscription as Subscription,
} from '@ringcentral-integration/micro-auth/src/app/services';
import { ContactMatcher } from '@ringcentral-integration/micro-contacts/src/app/services';
import { Toast } from '@ringcentral-integration/micro-core/src/app/services';
import { Webphone as MicroPhoneWebphone } from '@ringcentral-integration/micro-phone/src/app/services';
import {
  action,
  computed,
  delegate,
  inject,
  injectable,
  optional,
  PortManager,
  RcModule,
  state,
  storage,
  StoragePlugin,
  watch,
} from '@ringcentral-integration/next-core';
import { dynamicLoad } from '@ringcentral/mfe-react';

import { createHostTelephonySessionSubscription } from './create-host-telephony-session-subscription';
import { SMART_NOTES_CONFIG } from './SmartNotes.constants';
import {
  createSmartNoteCallMetadata,
  createSmartNoteSession,
  mergeSmartNoteRecords,
  normalizeSmartNoteHtml,
  smartNoteHtmlToText,
} from './SmartNotes.helper';
import type {
  SmartNoteClientConstructor,
  SmartNoteClientInstance,
  SmartNoteContact,
  SmartNoteQueryResult,
  SmartNoteSession,
  SmartNotesPluginConfig,
  SmartNotesPresentation,
  SmartNotesRemoteModule,
  SmartNoteTextRecord,
  SmartNoteTranscript,
  SmartNoteTranscriptRecord,
  WebphoneSmartNoteSession,
} from './SmartNotes.interface';

import { setupActiveTabDelegate } from '../../../lib/delegateInActiveTab';
import { TabManager } from '../TabManager';
import type { Webphone } from '../WebphoneV2';

type SmartNoteUpdateHandler = (
  telephonySessionId: string,
) => Promise<void> | void;

@injectable({
  name: 'SmartNotes',
})
export class SmartNotes extends RcModule {
  private _smartNoteClientConstructor: SmartNoteClientConstructor | null = null;
  private readonly _smartNoteClientMap = new Map<
    string,
    SmartNoteClientInstance
  >();
  private _smartNoteMfeRemoteEntry = '';
  private _smartNoteIframeUri = '';
  private _clientInitializationPromise: Promise<boolean> | null = null;
  private _webphoneHooksAdded = false;
  private _autoStartTimeout: ReturnType<typeof setTimeout> | null = null;
  private _onSmartNoteUpdate?: SmartNoteUpdateHandler;
  private _stopWatchingSubscription: (() => void) | null = null;
  private readonly _telephonySessionSubscription =
    createHostTelephonySessionSubscription();

  constructor(
    private readonly _client: Client,
    private readonly _auth: Auth,
    private readonly _appFeatures: AppFeatures,
    @inject(MicroPhoneWebphone) private readonly _webphone: Webphone,
    private readonly _contactMatcher: ContactMatcher,
    private readonly _storage: StoragePlugin,
    private readonly _toast: Toast,
    private readonly _tabManager: TabManager,
    private readonly _portManager: PortManager,
    @optional('Subscription') private readonly _subscription?: Subscription,
  ) {
    super();
    this._storage.enable(this);
    // Notes render next to the call, so the widget is owned by the tab that owns
    // the webphone rather than the app's main tab. This repoints every
    // `@delegate('mainClient')` method on this module at that tab.
    setupActiveTabDelegate(this, this._portManager, {
      channelName: 'smartNotesWebphoneClient',
      isTargetClient: () => this._isNotesOwner,
      resolveTargetClientId: () =>
        this._webphone.webphoneOwnerClientId ??
        this._portManager.activeTabId ??
        this._portManager.mainClientId,
    });
    this._setupRuntime();
  }

  /**
   * Whether this port should own the notes widget.
   *
   * Follows webphone ownership, falling back to the visible tab while no tab
   * has claimed the webphone yet, so notes still work for calls on another
   * device.
   */
  private get _isNotesOwner(): boolean {
    if (!this._portManager.shared) return true;
    if (!this._portManager.isClient) return false;
    if (this._webphone.isWebphoneOwner) return true;
    return (
      !this._webphone.webphoneOwnerClientId && this._portManager.isActiveTab
    );
  }

  /** Server-side smart-notes REST calls, which need no MFE and no DOM. */
  private get _notesPlatform() {
    return (
      this._client.service as unknown as {
        platform: () => {
          get: (
            url: string,
            query?: Record<string, unknown>,
          ) => Promise<{ json: () => Promise<any> }>;
          post: (
            url: string,
            body?: Record<string, unknown>,
          ) => Promise<{ json: () => Promise<any> }>;
        };
      }
    ).platform();
  }

  private async _apiQuerySmartNotes(
    telephonySessionIds: string[],
  ): Promise<{ records: Array<{ telephonySessionId: string }> }> {
    const response = await this._notesPlatform.post(
      '/ai/rio/v1/call-summary/note-brief/query',
      { telephonySessionIds },
    );
    return response.json();
  }

  private async _apiGetNotes(
    telephonySessionId: string,
  ): Promise<{ status: string; data?: string }> {
    const response = await this._notesPlatform.get(
      '/ai/rio/v1/call-summary/notes',
      { telephonySessionId },
    );
    return response.json();
  }

  private async _apiGetTranscripts(
    telephonySessionId: string,
  ): Promise<SmartNoteTranscript> {
    const response = await this._notesPlatform.get(
      `/ai/rio/v1/transcripts/${telephonySessionId}`,
    );
    return response.json();
  }

  @state
  session: SmartNoteSession | null = null;

  @state
  presentation: SmartNotesPresentation = 'independent';

  get showSmartNote(): boolean {
    return true;
  }

  @state
  showSmartNoteReadOnly = false;

  @state
  showSmartNoteReadOnlyReason = '';

  @storage
  @state
  autoStartSmartNote = false;

  @state
  autoStartSmartNoteReadOnly = false;

  @state
  autoStartSmartNoteReadOnlyReason = '';

  @state
  clientInitialized = false;

  @state
  recentNotedCalls: string[] = [];

  @state
  callsQueryResults: SmartNoteQueryResult[] = [];

  @state
  smartNoteTextStore: SmartNoteTextRecord[] = [];

  @state
  transcriptStore: SmartNoteTranscriptRecord[] = [];

  get hasPermission(): boolean {
    return this._appFeatures.hasSmartNotePermission;
  }

  get smartNoteClient(): SmartNoteClientInstance | null {
    if (!this.session) {
      return null;
    }
    return this._smartNoteClientMap.get(this.session.id) ?? null;
  }

  get smartNoteMFERemoteEntry(): string {
    return this._smartNoteMfeRemoteEntry;
  }

  @computed((that: SmartNotes) => [that.callsQueryResults])
  get aiNotedCallMapping(): Record<string, true> {
    return this.callsQueryResults.reduce<Record<string, true>>(
      (mapping, call) => {
        if (call.noted) {
          mapping[call.id] = true;
        }
        return mapping;
      },
      {},
    );
  }

  @computed((that: SmartNotes) => [that.smartNoteTextStore])
  get smartNoteTextMapping(): Record<string, string> {
    return this.smartNoteTextStore.reduce<Record<string, string>>(
      (mapping, item) => {
        mapping[item.id] = item.text;
        return mapping;
      },
      {},
    );
  }

  @computed((that: SmartNotes) => [that.transcriptStore])
  get transcriptMapping(): Record<string, SmartNoteTranscript> {
    return this.transcriptStore.reduce<Record<string, SmartNoteTranscript>>(
      (mapping, item) => {
        mapping[item.id] = item.transcript;
        return mapping;
      },
      {},
    );
  }

  override _shouldInit(): boolean {
    return Boolean(
      super._shouldInit() && this._auth.loggedIn && this.hasPermission,
    );
  }

  override _shouldReset(): boolean {
    return Boolean(
      super._shouldReset() ||
        (this.ready && (!this._auth.loggedIn || !this.hasPermission)),
    );
  }

  override async onInit(): Promise<void> {
    if (this._isRuntimeOwner()) {
      await this._initializeInMainClient();
    }
  }

  override async onReset(): Promise<void> {
    if (!this._isRuntimeOwner()) {
      return;
    }
    try {
      await this._resetMainClient();
    } finally {
      this._clearStates();
    }
  }

  private _isRuntimeOwner(): boolean {
    return !this._portManager.shared || this._portManager.isServer;
  }

  private _setupRuntime(): void {
    if (this._portManager.shared) {
      this._portManager.onClient(() => this._bindClient());
      return;
    }
    this._bindClient();
  }

  private _bindClient(): () => void {
    if (!globalThis.window) {
      return () => {};
    }
    this._bindWebphoneHooks();
    this._bindTelephonySessionWatch();
    const removeMainTabListener = this._portManager.onMainTab(() => {
      if (this._auth.loggedIn && this.hasPermission) {
        void this._initializeInMainClient();
      }
    });
    return () => {
      removeMainTabListener();
      this._clearAutoStartTimeout();
      this._unbindTelephonySessionWatch();
    };
  }

  private _bindTelephonySessionWatch(): void {
    if (this._stopWatchingSubscription || !this._subscription) {
      return;
    }
    this._telephonySessionSubscription.handleMessage(this._subscription.message);
    this._stopWatchingSubscription = watch(
      this,
      () => this._subscription?.message,
      (message) => {
        this._telephonySessionSubscription.handleMessage(message);
      },
    );
  }

  private _unbindTelephonySessionWatch(): void {
    this._stopWatchingSubscription?.();
    this._stopWatchingSubscription = null;
    this._telephonySessionSubscription.dispose();
  }

  private _bindWebphoneHooks(): void {
    if (this._webphoneHooksAdded) {
      return;
    }
    this._webphone.onCallStart((session: NormalizedSession) => {
      void this._setWebphoneSession(session);
    });
    this._webphone.onCallResume((session: NormalizedSession) => {
      void this._setWebphoneSession(session);
    });
    this._webphone.onCallEnd((session: NormalizedSession) => {
      const telephonySessionId = session.partyData?.sessionId;
      if (!telephonySessionId || !this.hasPermission || !this.showSmartNote) {
        return;
      }
      void this.setSessionDisconnected({
        id: telephonySessionId,
        status: 'Disconnected',
        direction: session.direction,
      });
    });
    this._webphoneHooksAdded = true;
  }

  private async _setWebphoneSession(
    webphoneSession: NormalizedSession,
  ): Promise<void> {
    if (!this.hasPermission || !this.showSmartNote) {
      return;
    }
    const session = webphoneSession as WebphoneSmartNoteSession;
    const smartNoteSession = createSmartNoteSession(
      session,
      this._getMatchedContact(session),
    );
    if (smartNoteSession) {
      await this.setSession(smartNoteSession);
    }
  }

  private _getMatchedContact(
    session: WebphoneSmartNoteSession,
  ): SmartNoteContact | undefined {
    const phoneNumber =
      session.direction === callDirections.outbound ? session.to : session.from;
    const matches = this._contactMatcher.dataMapping[phoneNumber ?? ''] as
      | SmartNoteContact[]
      | undefined;
    return matches?.[0];
  }

  @delegate('mainClient')
  private async _initializeInMainClient(): Promise<boolean> {
    const initialized = await this._ensureClientInitialized();
    await this.setClientInitialized(initialized);
    return initialized;
  }

  private async _ensureClientInitialized(): Promise<boolean> {
    if (this._smartNoteClientConstructor) {
      return true;
    }
    if (!globalThis.window || !this.hasPermission) {
      return false;
    }
    if (!this._clientInitializationPromise) {
      this._clientInitializationPromise = this._loadSmartNoteClient();
    }
    try {
      return await this._clientInitializationPromise;
    } finally {
      this._clientInitializationPromise = null;
    }
  }

  private async _loadSmartNoteClient(): Promise<boolean> {
    try {
      const response = await fetch('./plugins.json');
      // plugins.json is optional; without it Smart Notes stays disabled.
      if (response.status === 404) {
        return false;
      }
      if (!response.ok) {
        throw new Error(
          `Failed to load SmartNotes plugins: ${response.status}`,
        );
      }
      const plugins = (await response.json()) as SmartNotesPluginConfig;
      if (!plugins.smartNotesMFE) {
        return false;
      }
      const smartNotesModule = (await dynamicLoad(
        '@ringcentral/smart-note-widget/src/bootstrap',
        plugins.smartNotesMFE,
      )) as unknown as { default: SmartNotesRemoteModule };
      this._smartNoteClientConstructor =
        smartNotesModule.default.SmartNoteClient;
      this._smartNoteMfeRemoteEntry = plugins.smartNotesMFE;
      this._smartNoteIframeUri = plugins.smartNotesIframe ?? '';
      return true;
    } catch (error) {
      this.logger.error('Failed to initialize SmartNotes', error);
      this._smartNoteClientConstructor = null;
      return false;
    }
  }

  @delegate('mainClient')
  private async _resetMainClient(): Promise<void> {
    this._clearAutoStartTimeout();
    const clients = Array.from(this._smartNoteClientMap.values());
    await Promise.allSettled(
      clients.map(async (client) => {
        await client.stop();
        await client.dispose?.();
      }),
    );
    clients.forEach((client) => client.removeAllListeners());
    this._smartNoteClientMap.clear();
    this._telephonySessionSubscription.dispose();
    if (this._smartNoteClientConstructor?.resetCopilotSdk) {
      await this._smartNoteClientConstructor.resetCopilotSdk();
    }
    this._smartNoteClientConstructor = null;
    this._smartNoteMfeRemoteEntry = '';
    this._smartNoteIframeUri = '';
    this._clientInitializationPromise = null;
  }

  @action
  private _clearStates(): void {
    this.session = null;
    this.presentation = 'independent';
    this.clientInitialized = false;
    this.recentNotedCalls = [];
    this.callsQueryResults = [];
    this.smartNoteTextStore = [];
    this.transcriptStore = [];
  }

  @action
  private _setSessionState(
    session: SmartNoteSession | null,
    presentation: SmartNotesPresentation = 'independent',
  ): void {
    this.session = session;
    this.presentation = presentation;
  }

  @action
  private _setShowSmartNoteSettings(readOnly: boolean, reason: string): void {
    this.showSmartNoteReadOnly = readOnly;
    this.showSmartNoteReadOnlyReason = reason;
  }

  @action
  private _setAutoStartSmartNoteSettings(
    autoStart: boolean,
    readOnly: boolean,
    reason: string,
  ): void {
    this.autoStartSmartNote = autoStart;
    this.autoStartSmartNoteReadOnly = readOnly;
    this.autoStartSmartNoteReadOnlyReason = reason;
  }

  @action
  private _setClientInitialized(initialized: boolean): void {
    this.clientInitialized = initialized;
  }

  @action
  private _addRecentNotedCall(telephonySessionId: string): void {
    this.recentNotedCalls = [
      telephonySessionId,
      ...this.recentNotedCalls.filter((id) => id !== telephonySessionId),
    ].slice(0, SMART_NOTES_CONFIG.recentCallLimit);
  }

  @action
  private _addCallsQueryResults(calls: SmartNoteQueryResult[]): void {
    this.callsQueryResults = mergeSmartNoteRecords(
      this.callsQueryResults,
      calls,
      SMART_NOTES_CONFIG.callQueryLimit,
    );
  }

  @action
  private _addSmartNoteTextStore(id: string, text: string): void {
    this.smartNoteTextStore = mergeSmartNoteRecords(
      this.smartNoteTextStore,
      [{ id, text }],
      SMART_NOTES_CONFIG.storeLimit,
    );
  }

  @action
  private _removeSmartNoteTextStore(id: string): void {
    this.smartNoteTextStore = this.smartNoteTextStore.filter(
      (item) => item.id !== id,
    );
  }

  @action
  private _addTranscriptStore(
    id: string,
    transcript: SmartNoteTranscript,
  ): void {
    this.transcriptStore = mergeSmartNoteRecords(
      this.transcriptStore,
      [{ id, transcript }],
      SMART_NOTES_CONFIG.storeLimit,
    );
  }

  @delegate('server')
  async setClientInitialized(initialized: boolean): Promise<void> {
    this._setClientInitialized(initialized);
  }

  @track((that: SmartNotes) => [
    that.showSmartNote
      ? SMART_NOTES_CONFIG.trackEvents.enable
      : SMART_NOTES_CONFIG.trackEvents.disable,
  ])
  @delegate('server')
  async toggleShowSmartNote(): Promise<void> {
    this._setShowSmartNoteSettings(
      this.showSmartNoteReadOnly,
      this.showSmartNoteReadOnlyReason,
    );
  }

  @delegate('server')
  async setShowSmartNote(
    _show: boolean,
    readOnly = false,
    reason = '',
  ): Promise<void> {
    this._setShowSmartNoteSettings(readOnly, reason);
  }

  @track((that: SmartNotes) => [
    that.autoStartSmartNote
      ? SMART_NOTES_CONFIG.trackEvents.disableAutoStart
      : SMART_NOTES_CONFIG.trackEvents.enableAutoStart,
  ])
  @delegate('server')
  async toggleAutoStartSmartNote(): Promise<void> {
    this._setAutoStartSmartNoteSettings(
      !this.autoStartSmartNote,
      this.autoStartSmartNoteReadOnly,
      this.autoStartSmartNoteReadOnlyReason,
    );
  }

  @delegate('server')
  async setAutoStartSmartNote(
    autoStart: boolean,
    readOnly = false,
    reason = '',
  ): Promise<void> {
    this._setAutoStartSmartNoteSettings(autoStart, readOnly, reason);
  }

  @delegate('server')
  async addRecentNotedCall(telephonySessionId: string): Promise<void> {
    this._addRecentNotedCall(telephonySessionId);
  }

  @delegate('server')
  async addCallsQueryResults(calls: SmartNoteQueryResult[]): Promise<void> {
    this._addCallsQueryResults(calls);
  }

  @delegate('server')
  async addSmartNoteTextStore(id: string, text: string): Promise<void> {
    this._addSmartNoteTextStore(id, text);
  }

  @delegate('server')
  async removeSmartNoteTextStore(id: string): Promise<void> {
    this._removeSmartNoteTextStore(id);
  }

  @delegate('server')
  async addTranscriptStore(
    id: string,
    transcript: SmartNoteTranscript,
  ): Promise<void> {
    this._addTranscriptStore(id, transcript);
  }

  @delegate('server')
  private async _setSessionStateOnServer(
    session: SmartNoteSession | null,
    presentation: SmartNotesPresentation,
  ): Promise<void> {
    this._setSessionState(session, presentation);
  }

  @delegate('mainClient')
  async setSession(
    session: SmartNoteSession | null,
    presentation: SmartNotesPresentation = 'independent',
  ): Promise<void> {
    if (!session) {
      await this._closeCurrentSession();
      return;
    }
    const initialized = await this._ensureClientInitialized();
    if (!initialized || !this._smartNoteClientConstructor) {
      return;
    }
    const currentClient = this._smartNoteClientMap.get(session.id);
    if (this.session?.id === session.id && currentClient) {
      await currentClient.updateTelephonySessionStatus(session.status);
      await this._setSessionStateOnServer(session, presentation);
      this._clearOtherIdleClients(session.id);
      return;
    }
    const smartNoteClient =
      currentClient ?? this._createSmartNoteClient(session);
    this._smartNoteClientMap.set(session.id, smartNoteClient);
    await this._pauseCurrentClient();
    await this._setSessionStateOnServer(session, presentation);
    this._clearOtherIdleClients(session.id);
    this._autoStartSession(session, smartNoteClient);
  }

  /**
   * starts the ai notes of a call, or resumes them when they were paused; used
   * by the in-call smart notes button, the base call action handler talks to an
   * ai notes client module that this app does not provide
   *
   * @returns the session the notes belong to, so the caller can present it
   */
  @delegate('mainClient')
  async startOrResumeNotes(
    telephonySessionId: string,
  ): Promise<SmartNoteSession | null> {
    if (!this.hasPermission || !this.showSmartNote) {
      return null;
    }
    const session = this._getNotesSession(telephonySessionId);
    if (!session) {
      return null;
    }
    await this.setSession(session);
    const smartNoteClient = this._smartNoteClientMap.get(session.id);
    if (!smartNoteClient) {
      return null;
    }
    try {
      if (smartNoteClient.transcriptionStatus === 'paused') {
        await smartNoteClient.resume();
      } else if (
        smartNoteClient.transcriptionStatus === 'idle' ||
        smartNoteClient.transcriptionStatus === 'stopped'
      ) {
        // a pending auto start would start the same notes a second time
        this._clearAutoStartTimeout();
        await smartNoteClient.start();
      }
    } catch (error) {
      this.logger.error('Failed to start SmartNotes', error);
      await this._showManualStartFailed();
    }
    return session;
  }

  private _getNotesSession(
    telephonySessionId: string,
  ): SmartNoteSession | null {
    const webphoneSession = this._webphone.sessions.find(
      (item) => item.partyData?.sessionId === telephonySessionId,
    ) as WebphoneSmartNoteSession | undefined;
    if (webphoneSession) {
      return createSmartNoteSession(
        webphoneSession,
        this._getMatchedContact(webphoneSession),
      );
    }
    // calls on another device have no local webphone session
    return this.session?.id === telephonySessionId ? this.session : null;
  }

  private _createSmartNoteClient(
    session: SmartNoteSession,
  ): SmartNoteClientInstance {
    const SmartNoteClient = this._smartNoteClientConstructor!;
    const smartNoteClient = new SmartNoteClient({
      sdk: this._client.service,
      telephonySessionId: session.id,
      extensionId: this._auth.ownerId,
      telephonySessionStatus: session.status,
      contact: session.contact
        ? { ...session.contact, phoneNumber: session.phoneNumber }
        : { phoneNumber: session.phoneNumber },
      smartNoteIframeUri: this._smartNoteIframeUri,
      callMetaData: createSmartNoteCallMetadata(session),
      telephonySessionsSubscriptionManager:
        this._telephonySessionSubscription.manager,
    });
    smartNoteClient.on('statusUpdate', (status) => {
      if (status === 'ready') {
        this.trackSmartNoteStart();
      }
    });
    return smartNoteClient;
  }

  private async _closeCurrentSession(): Promise<void> {
    if (!this.session) {
      return;
    }
    const smartNoteClient = this._smartNoteClientMap.get(this.session.id);
    if (smartNoteClient) {
      await smartNoteClient.stop();
      smartNoteClient.removeAllListeners();
      this._smartNoteClientMap.delete(this.session.id);
    }
    await this._setSessionStateOnServer(null, 'independent');
  }

  private async _pauseCurrentClient(): Promise<void> {
    if (!this.session) {
      return;
    }
    const currentClient = this._smartNoteClientMap.get(this.session.id);
    if (currentClient && currentClient.transcriptionStatus !== 'idle') {
      await currentClient.pause();
    }
  }

  private _autoStartSession(
    session: SmartNoteSession,
    client: SmartNoteClientInstance,
  ): void {
    if (session.status !== 'Answered' || !this.autoStartSmartNote) {
      return;
    }
    if (client.transcriptionStatus === 'paused') {
      void client.resume();
      return;
    }
    if (client.transcriptionStatus === 'idle' && this._tabManager.interacting) {
      this._startSmartNote(session);
    }
  }

  private _startSmartNote(session: SmartNoteSession, retry = false): void {
    this._clearAutoStartTimeout();
    const delay = retry
      ? SMART_NOTES_CONFIG.autoStartRetryDelay
      : SMART_NOTES_CONFIG.autoStartDelay;
    this._autoStartTimeout = setTimeout(() => {
      void this._executeAutoStart(session, retry);
    }, delay);
  }

  private async _executeAutoStart(
    session: SmartNoteSession,
    retry: boolean,
  ): Promise<void> {
    const client = this._smartNoteClientMap.get(session.id);
    if (!client || client.transcriptionStatus !== 'idle') {
      return;
    }
    try {
      await client.start();
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      const canRetry =
        !retry && (message.includes('CC-102') || message.includes('CC-104'));
      if (canRetry) {
        this._startSmartNote(session, true);
        return;
      }
      this.logger.error('Failed to auto start SmartNotes', error);
      await this._showAutoStartFailed();
    }
  }

  private _clearAutoStartTimeout(): void {
    if (this._autoStartTimeout) {
      clearTimeout(this._autoStartTimeout);
      this._autoStartTimeout = null;
    }
  }

  @delegate('server')
  private async _showManualStartFailed(): Promise<void> {
    this._toast.warning({
      message: 'The AI assistant could not be started. Try again.',
      ttl: 10000,
    });
  }

  @delegate('server')
  private async _showAutoStartFailed(): Promise<void> {
    this._toast.warning({
      message:
        'Failed to auto start AI assistant. Start it manually after the call is answered.',
      ttl: 10000,
    });
  }

  private _clearOtherIdleClients(sessionId: string): void {
    this._smartNoteClientMap.forEach((client, id) => {
      if (
        id !== sessionId &&
        (client.transcriptionStatus === 'idle' ||
          client.transcriptionStatus === 'stopped')
      ) {
        client.removeAllListeners();
        this._smartNoteClientMap.delete(id);
      }
    });
  }

  @delegate('mainClient')
  async setSessionDisconnected(session: SmartNoteSession): Promise<void> {
    const smartNoteClient = this._smartNoteClientMap.get(session.id);
    if (!smartNoteClient) {
      if (this.session?.id === session.id) {
        await this._setSessionStateOnServer(null, 'independent');
      }
      return;
    }
    if (
      this.session?.id === session.id &&
      this.session.status === 'Disconnected'
    ) {
      return;
    }
    if (smartNoteClient.transcriptions.length > 1) {
      await this.addRecentNotedCall(session.id);
    }
    if (this.session?.id === session.id) {
      if (smartNoteClient.transcriptionStatus === 'idle') {
        smartNoteClient.removeAllListeners();
        this._smartNoteClientMap.delete(session.id);
        await this._setSessionStateOnServer(null, 'independent');
      } else {
        await smartNoteClient.updateTelephonySessionStatus('Disconnected');
        await this._setSessionStateOnServer(
          { ...this.session, ...session },
          this.presentation,
        );
      }
      return;
    }
    if (smartNoteClient.transcriptionStatus !== 'idle') {
      await smartNoteClient.updateTelephonySessionStatus('Disconnected');
    }
    smartNoteClient.removeAllListeners();
    this._smartNoteClientMap.delete(session.id);
  }

  private async _queryNotedCallMapping(
    telephonySessionIds: string[],
  ): Promise<Record<string, boolean>> {
    const existingMapping = this.callsQueryResults.reduce<
      Record<string, boolean>
    >((mapping, call) => {
      mapping[call.id] = call.noted;
      return mapping;
    }, {});
    const unqueriedIds = telephonySessionIds.filter(
      (id) => typeof existingMapping[id] === 'undefined',
    );
    if (unqueriedIds.length === 0) {
      return existingMapping;
    }
    const queryResult = await this._apiQuerySmartNotes(unqueriedIds);
    const recentNotedCalls = new Set(this.recentNotedCalls);
    const queriedCalls = unqueriedIds.map((id) => ({
      id,
      noted:
        queryResult.records.some(
          (record) => record.telephonySessionId === id,
        ) || recentNotedCalls.has(id),
    }));
    await this.addCallsQueryResults(queriedCalls);
    queriedCalls.forEach(({ id, noted }) => {
      existingMapping[id] = noted;
    });
    return existingMapping;
  }

  // Runs in the SharedWorker: this is a plain REST query, so it needs neither
  // the smart-notes MFE nor a DOM, and it works in every tab.
  @delegate('server')
  async queryNotedCalls(telephonySessionIds: string[]): Promise<void> {
    if (!this.hasPermission) {
      return;
    }
    try {
      await this._queryNotedCallMapping(telephonySessionIds);
    } catch (error) {
      this.logger.error('Failed to query SmartNotes calls', error);
    }
  }

  private async _fetchNotesUntilFinished(
    telephonySessionId: string,
    retryCount = 0,
  ): Promise<{ status: string; data?: string }> {
    const result = await this._apiGetNotes(telephonySessionId);
    if (
      result.status !== 'InProgress' ||
      retryCount >= SMART_NOTES_CONFIG.noteFetchRetryCount
    ) {
      return result;
    }
    await sleep(SMART_NOTES_CONFIG.noteFetchRetryDelay);
    return this._fetchNotesUntilFinished(telephonySessionId, retryCount + 1);
  }

  @delegate('server')
  async fetchSmartNoteText(telephonySessionId: string): Promise<string | null> {
    if (!telephonySessionId || !this.hasPermission) {
      return null;
    }
    const cachedText = this.smartNoteTextMapping[telephonySessionId];
    if (cachedText) {
      return cachedText;
    }
    try {
      const notedMapping = await this._queryNotedCallMapping([
        telephonySessionId,
      ]);
      if (!notedMapping[telephonySessionId]) {
        return null;
      }
      const note = await this._fetchNotesUntilFinished(telephonySessionId);
      const text = smartNoteHtmlToText(normalizeSmartNoteHtml(note.data ?? ''));
      await this.addSmartNoteTextStore(telephonySessionId, text);
      return text;
    } catch (error) {
      this.logger.error('Failed to fetch SmartNotes text', error);
      return null;
    }
  }

  @delegate('server')
  async fetchTranscript(
    telephonySessionId: string,
  ): Promise<SmartNoteTranscript | null> {
    if (!telephonySessionId || !this.hasPermission) {
      return null;
    }
    const cachedTranscript = this.transcriptMapping[telephonySessionId];
    if (cachedTranscript) {
      return cachedTranscript;
    }
    try {
      const notedMapping = await this._queryNotedCallMapping([
        telephonySessionId,
      ]);
      if (!notedMapping[telephonySessionId]) {
        return null;
      }
      const transcript = await this._apiGetTranscripts(telephonySessionId);
      await this.addTranscriptStore(telephonySessionId, transcript);
      return transcript;
    } catch (error) {
      this.logger.error('Failed to fetch SmartNotes transcript', error);
      return null;
    }
  }

  @delegate('server')
  private async _notifySmartNoteUpdate(
    telephonySessionId: string,
  ): Promise<void> {
    this._removeSmartNoteTextStore(telephonySessionId);
    await this._onSmartNoteUpdate?.(telephonySessionId);
  }

  @delegate('mainClient')
  async onSmartNoteSave(): Promise<void> {
    if (this.session) {
      await this._notifySmartNoteUpdate(this.session.id);
    }
  }

  onSmartNoteUpdate(handler: SmartNoteUpdateHandler): () => void {
    this._onSmartNoteUpdate = handler;
    return () => {
      if (this._onSmartNoteUpdate === handler) {
        this._onSmartNoteUpdate = undefined;
      }
    };
  }

  @track(() => [SMART_NOTES_CONFIG.trackEvents.view])
  @delegate('mainClient')
  async viewSmartNote(
    session: SmartNoteSession,
    presentation: SmartNotesPresentation = 'independent',
  ): Promise<void> {
    await this.setSession(session, presentation);
  }

  @track(() => [SMART_NOTES_CONFIG.trackEvents.start])
  trackSmartNoteStart(): void {}
}
