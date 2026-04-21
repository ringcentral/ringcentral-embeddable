import type CreateSipRegistrationResponse from '@rc-ex/core/lib/definitions/CreateSipRegistrationResponse';
import type SipRegistrationDeviceInfo from '@rc-ex/core/lib/definitions/SipRegistrationDeviceInfo';
import { trackEvents } from '@ringcentral-integration/commons/enums/trackEvents';
import { SipInstanceManager } from '@ringcentral-integration/commons/lib/SipInstanceManager';
import type { ObjectMapValue } from '@ringcentral-integration/core/lib/ObjectMap';
import type {
  AppFeatures,
  Auth,
  Client,
  ExtensionDevice,
  ExtensionFeatures,
} from '@ringcentral-integration/micro-auth/src/app/services';
import {
  RingCentralExtensions,
  WebSocketSubscription as Subscription,
  track,
} from '@ringcentral-integration/micro-auth/src/app/services';
import type { NumberValidate } from '@ringcentral-integration/micro-contacts/src/app/services';
import {
  Brand,
  type BrowserLogger,
  Toast,
} from '@ringcentral-integration/micro-core/src/app/services';
import type {
  PortManager,
  StoragePlugin,
} from '@ringcentral-integration/next-core';
import {
  action,
  computed,
  delegate,
  dynamic,
  fromWatchValue,
  optional,
  RcModule,
  state,
  storage,
  watch,
} from '@ringcentral-integration/next-core';
import { sleep } from '@ringcentral-integration/utils';
import { EventEmitter } from 'events';
import RingCentralWebphone from 'ringcentral-web-phone';
import type { SipInfo } from 'ringcentral-web-phone/types';
import {
  BehaviorSubject,
  combineLatest,
  firstValueFrom,
  filter,
  map,
  race,
  throwError,
  timeout,
  timer,
} from 'rxjs';

import type { AudioSettings } from '@ringcentral-integration/micro-phone/src/app/services/AudioSettings';

import { AudioDeviceManager, RingtoneHelper } from './AudioDeviceManager';
import { SharedSipClient } from './SharedSipClient';
import { SipClientInServer } from './SipClientInServer';
import type {
  SharedSipClientStartOptions,
  SharedSipClientStatusResponse,
  SharedSipRegistrationStatus,
  SharedSipTransportStatus,
  WebphoneOptions,
  WebphoneSession,
} from './Webphone.interface';
import defaultIncomingAudio from './audio/incoming.mp3';
import defaultOutgoingAudio from './audio/outgoing.mp3';
import { connectionStatus } from './connectionStatus';
import { EVENTS } from './events';
import { t } from './i18n';
import {
  SHARED_SIP_CLIENT_EVENTS,
  SHARED_SIP_CLIENT_REQUESTS,
} from './sharedSipClient.constants';
import { isBrowserSupport } from './webphoneHelper';

export const DEFAULT_AUDIO = 'default';

const AUTO_RETRIES_DELAY = [
  0,
  5 * 1000,
  10 * 1000,
  30 * 1000,
  2 * 60 * 1000,
  5 * 60 * 1000,
  15 * 60 * 1000,
  30 * 60 * 1000,
];

const DEFAULT_WEBSOCKET_RECOVERY_TIMEOUT = 16 * 1000;
const REALTIME_RECOVERY_QUICK_RETRY_LIMIT = 2;

type ToastWebphoneError =
  | 'webphoneCountOverLimit'
  | 'internalServerError'
  | 'serverTimeout'
  | 'unknownError'
  | 'sipProvisionError'
  | 'connectFailed'
  | 'webphoneForbidden'
  | 'requestTimeout';

type WebphoneError =
  | 'provisionUpdate'
  | 'serverConnecting'
  | 'browserNotSupported'
  | ToastWebphoneError;

export class WebphoneBase extends RcModule {
  protected _reconnectDelays = AUTO_RETRIES_DELAY;
  rcWebphoneInstance$ = new BehaviorSubject<RingCentralWebphone | undefined>(
    undefined,
  );

  get _webphone() {
    return this.rcWebphoneInstance$.value;
  }

  protected _sipInstanceManager?: SipInstanceManager;
  protected _sipInstanceId?: string | null;

  protected _connectTimeout?: NodeJS.Timeout | null = null;
  private _realtimeRecoveryRetryTimeout?: NodeJS.Timeout | null = null;
  protected _reconnectAfterSessionEnd?: { reason?: string | null } | null =
    null;
  protected _eventEmitter = new EventEmitter();
  protected _stopWebphoneUserAgentPromise?: Promise<unknown> | null = null;
  protected _removedWebphoneAtBeforeUnload = false;
  protected _audioDeviceManager?: AudioDeviceManager | null = null;
  protected _ringtoneHelper?: RingtoneHelper | null = null;
  protected _sharedSipClient?: SharedSipClient | null = null;
  protected _sipClientInServer?: SipClientInServer | null = null;
  protected _ensureLocalWebphonePromise?: Promise<void> | null = null;

  @dynamic('BrowserLogger')
  protected _browserLogger?: BrowserLogger;

  constructor(
    protected _brand: Brand,
    protected _auth: Auth,
    protected _toast: Toast,
    protected _client: Client,
    protected _numberValidate: NumberValidate,
    protected _appFeatures: AppFeatures,
    protected _extensionFeatures: ExtensionFeatures,
    protected _extensionDevice: ExtensionDevice,
    protected _audioSettings: AudioSettings,
    protected _storage: StoragePlugin,
    protected _portManager: PortManager,
    protected _ringCentralExtensions: RingCentralExtensions,
    @optional('WebphoneOptions')
    protected _webphoneOptions: WebphoneOptions,
    @optional('Subscription')
    protected _subscription?: Subscription,
    @optional('Prefix') protected _prefix?: string,
  ) {
    super();
    this._storage.enable(this);
    this._audioDeviceManager = new AudioDeviceManager(this._audioSettings);
    this._ringtoneHelper = new RingtoneHelper(defaultIncomingAudio);

    if (this._portManager.shared) {
      this._portManager.onServer((transport) => {
        // do something on in server (shared worker)
        this.handleLogout();
        const destroySharedSipClientTransport =
          this._bindSharedSipClientTransport(transport);
        return () => {
          destroySharedSipClientTransport();
          void this.disposeSipClientInServerLocal();
        };
      });
      this._portManager.onClient(() => {
        this.initialize();
        return watch(
          this,
          () => [
            this.ready,
            this.connectionStatus,
            this._portManager.activeTabId,
          ],
          () => {
            void this._ensureLocalWebphoneFromSharedState();
          },
          {
            multiple: true,
          },
        );
      });
    } else {
      this.initialize();
      this.handleLogout();
    }

    if (globalThis.document) {
      this.handleListeners();
      this._sipInstanceManager = new SipInstanceManager(
        `${this._prefix}-webphone-inactive-sip-instance`,
      );
    }
  }

  protected handleLogout() {
    this._auth.addBeforeLogoutHandler(async () => {
      await this._beforeLogout();
    });
  }

  async _beforeLogout() {
    this._sipInstanceId = null;
    await this._disconnect(true);
  }

  @state
  connectionStatus: ObjectMapValue<typeof connectionStatus> =
    connectionStatus.disconnected;

  @state
  connectRetryCounts = 0;

  @state
  realtimeRecoveryRetryCounts = 0;

  @state
  errorCode?: WebphoneError | null = null;

  @state
  statusCode?: number | null = null;

  @state
  device?: SipRegistrationDeviceInfo | null = null;

  @action
  _setConnectionStatus(status: ObjectMapValue<typeof connectionStatus>) {
    this.connectionStatus = status;
  }

  @delegate('server')
  async setConnectionStatus(status: ObjectMapValue<typeof connectionStatus>) {
    this._setConnectionStatus(status);
  }

  @action
  _setStateOnConnectError(
    errorCode?: WebphoneError,
    statusCode?: number | null,
  ) {
    this.connectionStatus = connectionStatus.connectError;
    this.device = null;
    if (errorCode) {
      this.errorCode = errorCode;
    }
    if (statusCode) {
      this.statusCode = statusCode;
    }
  }

  @delegate('server')
  async setStateOnConnectError(
    errorCode?: WebphoneError,
    statusCode?: number | null,
  ) {
    this._setStateOnConnectError(errorCode, statusCode);
  }

  @action
  _setStateOnConnectFailed(errorCode?: WebphoneError, statusCode?: number) {
    this.connectionStatus = connectionStatus.connectFailed;
    this.device = null;
    if (errorCode) {
      this.errorCode = errorCode;
    }
    if (statusCode) {
      this.statusCode = statusCode;
    }
  }

  @delegate('server')
  async setStateOnConnectFailed(
    errorCode?: WebphoneError,
    statusCode?: number,
  ) {
    this._setStateOnConnectFailed(errorCode, statusCode);
  }

  @action
  _setStateOnConnect() {
    this.connectionStatus = connectionStatus.connecting;
    this.device = null;
    this.connectRetryCounts += 1;
  }

  @delegate('server')
  async setStateOnConnect() {
    this._setStateOnConnect();
  }

  @action
  _setStateOnReconnect() {
    this.connectionStatus = connectionStatus.reconnecting;
    this.device = null;
    this.connectRetryCounts += 1;
  }

  @delegate('server')
  async setStateOnReconnect() {
    this._setStateOnReconnect();
  }

  @track(trackEvents.webRTCRegistration)
  @action
  _setStateOnRegistered(device: SipRegistrationDeviceInfo) {
    this.connectionStatus = connectionStatus.connected;
    this.device = device;
    this.errorCode = null;
    this.statusCode = null;
    this.connectRetryCounts = 0;
  }

  @delegate('server')
  async setStateOnRegistered(device: SipRegistrationDeviceInfo) {
    this._setStateOnRegistered(device);
  }

  @action
  _setStateOnUnregistered() {
    this.connectionStatus = connectionStatus.disconnected;
    this.device = null;
    this.connectRetryCounts = 0;
  }

  @delegate('server')
  async setStateOnUnregistered() {
    this._setStateOnUnregistered();
  }

  @action
  _setStateWhenUnregisteredOnInactive() {
    this.connectionStatus = connectionStatus.inactive;
    this.device = null;
    this.connectRetryCounts = 0;
  }

  @delegate('server')
  async setStateWhenUnregisteredOnInactive() {
    this._setStateWhenUnregisteredOnInactive();
  }

  @action
  _setStoreOnDisconnect() {
    if (!this.disconnected) {
      // page unload event async change state with `disconnecting`
      // ensure that the `disconnected` state is not reset to `disconnecting`
      this.connectionStatus = connectionStatus.disconnecting;
    }
    this.device = null;
  }

  @delegate('server')
  async setStoreOnDisconnect() {
    this._setStoreOnDisconnect();
  }

  @action
  _setDevice(device?: { id: string } | null) {
    this.device = device;
  }

  @delegate('server')
  async setDevice(device?: { id: string } | null) {
    this._setDevice(device);
  }

  @action
  _setRetryCounts(retryCounts: number) {
    this.connectRetryCounts = retryCounts;
  }

  @delegate('server')
  async setRetryCounts(retryCounts: number) {
    this._setRetryCounts(retryCounts);
  }

  @action
  _setRealtimeRecoveryRetryCounts(retryCounts: number) {
    this.realtimeRecoveryRetryCounts = retryCounts;
  }

  @delegate('server')
  async setRealtimeRecoveryRetryCounts(retryCounts: number) {
    this._setRealtimeRecoveryRetryCounts(retryCounts);
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

  @storage
  @state
  data: {
    incomingAudioFile?: string | null;
    incomingAudioDataUrl?: string | null;
    outgoingAudioFile?: string | null;
    outgoingAudioDataUrl?: string | null;
  } = {
    incomingAudioFile: DEFAULT_AUDIO,
    incomingAudioDataUrl: null,
    outgoingAudioFile: DEFAULT_AUDIO,
    outgoingAudioDataUrl: null,
  };

  @action
  _setRingtoneIntoStorage(
    incomingAudioFile?: string | null,
    incomingAudioDataUrl?: string | null,
    outgoingAudioFile?: string | null,
    outgoingAudioDataUrl?: string | null,
  ) {
    this.data.incomingAudioFile = incomingAudioFile;
    this.data.incomingAudioDataUrl = incomingAudioDataUrl;
    this.data.outgoingAudioFile = outgoingAudioFile;
    this.data.outgoingAudioDataUrl = outgoingAudioDataUrl;
  }

  @action
  _setIncomingAudioIntoStorage(fileName: string, dataUrl: string) {
    this.data.incomingAudioFile = fileName;
    this.data.incomingAudioDataUrl = dataUrl;
  }

  @action
  _resetIncomingAudio() {
    this.data.incomingAudioFile = DEFAULT_AUDIO;
    this.data.incomingAudioDataUrl = null;
  }

  @action
  _setOutgoingAudioIntoStorage(fileName: string, dataUrl: string) {
    this.data.outgoingAudioFile = fileName;
    this.data.outgoingAudioDataUrl = dataUrl;
  }

  @action
  _resetOutgoingAudio() {
    this.data.outgoingAudioFile = DEFAULT_AUDIO;
    this.data.outgoingAudioDataUrl = null;
  }

  protected initialize() {
    if (!this.disconnected) {
      this.setStateOnUnregistered();
    }
    watch(
      this,
      () => this.shouldUpdateRingtoneVolume,
      () => {
        if (this.ready && this._ringtoneHelper) {
          this._ringtoneHelper.setVolume(this._audioSettings.ringtoneVolume);
        }
      },
    );
    watch(
      this,
      () => this._audioSettings.callVolume,
      () => {
        if (this.ready) {
          this.webphoneSessions.forEach((session) => {
            if (session.audioElement) {
              session.audioElement.volume = this._audioSettings.callVolume;
            }
          });
        }
      },
    );
    watch(
      this,
      () => this.shouldSetSinkId,
      () => {
        if (
          this.ready &&
          this._audioSettings.supportDevices
        ) {
          this.webphoneSessions.forEach((session) => {
            if (
              session.audioElement &&
              typeof session.audioElement.setSinkId === 'function'
            ) {
              session.audioElement.setSinkId(
                this._audioSettings.outputDeviceId,
              );
            }
          });
        }
      },
    );
    watch(
      this,
      () => this.shouldSetRingtoneSinkId,
      () => {
        if (
          this.ready &&
          this._audioSettings.supportDevices &&
          this._ringtoneHelper
        ) {
          this._ringtoneHelper.setDeviceId(this._audioSettings.ringtoneDeviceId);
        }
      },
    );
  }

  protected handleListeners() {
    if (globalThis.document) {
      window.addEventListener('beforeunload', () => {
        if (!this._webphone) {
          return;
        }
        if (this.webphoneSessions.length > 0) {
          return;
        }
        this._removedWebphoneAtBeforeUnload = true;
        // disconnect webphone at beforeunload if there are not active sessions
        this._disconnect();
        // set timeout to reconnect web phone is before unload cancel
        setTimeout(() => {
          this._removedWebphoneAtBeforeUnload = false;
          this.connect({
            force: true,
            skipConnectDelay: true,
            skipDLCheck: true,
          });
        }, 4000);
      });
      window.addEventListener('pagehide', () => {
        // mark current instance id as inactive, so app can reuse it after refresh
        if (this._sipInstanceId && !this._sharedSipClient) {
          this._sipInstanceManager!.setInstanceInactive(
            this._sipInstanceId,
            this._auth.endpointId!,
          );
          this._sipInstanceId = null;
        }
        // disconnect if web phone is not disconnected at beforeunload
        if (!this._removedWebphoneAtBeforeUnload) {
          this._disconnect();
        }
      });
    }
  }

  @computed((that: WebphoneBase) => [
    that.ready,
    that._audioSettings.ringtoneVolume,
  ])
  get shouldUpdateRingtoneVolume(): any[] {
    return [this.ready, this._audioSettings.ringtoneVolume];
  }

  @computed((that: WebphoneBase) => [
    that.ready,
    that._audioSettings.supportDevices,
    that._audioSettings.ringtoneDeviceId,
  ])
  get shouldSetRingtoneSinkId(): any[] {
    return [
      this.ready,
      this._audioSettings.supportDevices,
      this._audioSettings.ringtoneDeviceId,
    ];
  }

  @computed((that: WebphoneBase) => [
    that.ready,
    that._audioSettings.supportDevices,
    that._audioSettings.outputDeviceId,
  ])
  get shouldSetSinkId(): any[] {
    return [
      this.ready,
      this._audioSettings.supportDevices,
      this._audioSettings.outputDeviceId,
    ];
  }

  override _shouldInit() {
    return (
      this._auth.loggedIn &&
      this._appFeatures.ready &&
      this._extensionFeatures.ready &&
      this._numberValidate.ready &&
      this._audioSettings.ready &&
      this.pending
    );
  }

  override _shouldReset() {
    return (
      (!this._auth.loggedIn ||
        !this._appFeatures.ready ||
        !this._extensionFeatures.ready ||
        !this._numberValidate.ready ||
        !this._audioSettings.ready) &&
      this.ready
    );
  }

  @delegate('server')
  async _sipProvision(): Promise<CreateSipRegistrationResponse | undefined> {
    try {
      const response = await this._client.service
        .platform()
        .post('/restapi/v1.0/client-info/sip-provision', {
          sipInfo: [{ transport: 'WSS' }],
        });
      return response.json();
    } catch (error: any) {
      console.error(error, this.connectRetryCounts);
      if (
        error &&
        error.message &&
        error.message.indexOf('Feature [WebPhone] is not available') > -1
      ) {
        this._extensionFeatures.fetchData();
        return;
      }
      this._onConnectError({
        errorCode: 'sipProvisionError',
        statusCode: null,
        ttl: 0,
      });
      return;
    }
  }

  /**
   * Check if the user has a digital line to make outbound calls
   *
   * @returns `true` if DL check passed, false if DL check failed
   */
  validateDeviceLines() {
    if (!this._auth.loggedIn) return false;

    this.logger.log('validateDeviceLines', this._extensionDevice.data);

    // when DL check failed, will not have data in extensionDevice
    if (!this._extensionDevice.data) {
      this._toast.warning({
        message: t('checkDLError', {
          brandName: this._brand.name as string,
        }),
        group: `${this.identifier}_dl_failed`,
        allowDuplicates: false,
      });
      return false;
    }

    const phoneLines = this._extensionDevice.phoneLines;
    if (phoneLines.length === 0) {
      this._toast.warning({
        message: t('noOutboundCallWithoutDL'),
        group: `${this.identifier}_dl_failed`,
      });
      return false;
    }

    return true;
  }

  @delegate('server')
  async _fetchDL() {
    await this._extensionDevice.fetchData();
  }

  async _removeWebphone() {
    if (!this._webphone && !this._sharedSipClient) {
      return;
    }
    try {
      if (this._webphone) {
        for (const callSession of this._webphone.callSessions) {
          try {
            if (callSession.state === 'answered') {
              await callSession.hangup();
            } else if (callSession.direction === 'inbound') {
              await (callSession as WebphoneSession).decline();
            } else if (callSession.remotePeer) {
              await (callSession as WebphoneSession).cancel();
            } else {
              callSession.dispose();
            }
          } catch (error) {
            this.logger.error('Fail to disconnect call session', error);
          }
        }
        this._webphone.removeAllListeners();
        await this._webphone.sipClient.dispose();
      } else if (this._sharedSipClient) {
        await this._sharedSipClient.dispose();
      }
    } catch (e) {
      console.error(e);
    }
    this._sharedSipClient = null;
    this.rcWebphoneInstance$.next(undefined);
  }

  protected _ensureSessionCompatibility(session: WebphoneSession) {
    session.id = session.callId;
    session.data = {
      ...(session.data ?? {}),
      sessionId: session.sessionId,
    };
    session.__rc_callId = session.callId;
    if (!Object.getOwnPropertyDescriptor(session, 'localHold')) {
      Object.defineProperty(session, 'localHold', {
        configurable: true,
        enumerable: true,
        get() {
          return Boolean(session.__rc_localHold);
        },
        set(value: boolean) {
          session.__rc_localHold = value;
        },
      });
    }
    return session;
  }

  @delegate('server')
  protected async _webphoneLogConnector(
    level: 'debug' | 'log' | 'warn' | 'error',
    category: string,
    label: string,
    content: string,
  ) {
    // TODO: filter by log level
    this._browserLogger?.log(category, label, content);
  }

  protected async _syncSharedState() {
    if (!this._sharedSipClient) {
      return;
    }
    const sharedState = await this._sharedSipClient.syncSharedState();
    this._onSharedStateUpdated(sharedState);
  }

  protected _onSharedStateUpdated(_state: Record<string, any>) {
    // override
  }

  protected _onActiveTabIdChanged(_activeTabId: string | null) {
    // override
  }

  protected async _canBeActiveTabs() {
    return this._portManager.isActiveTab;
  }

  protected async _onTabActive() {
    await this._setSharedSipClientActive();
  }

  protected _isAuthoritativeWebphoneClient() {
    if (!this._portManager.shared) {
      return true;
    }
    return this.isWebphoneActiveTab || (!this.activeWebphoneId && this._portManager.isActiveTab);
  }

  protected get activeWebphoneId() {
    return this._sharedSipClient?.activeTabId ?? this._sipClientInServer?.activeTabId ?? null;
  }

  protected get isWebphoneActiveTab() {
    if (!this._portManager.shared) {
      return !!this._webphone;
    }
    return this.activeWebphoneId === this._portManager.clientId;
  }

  protected async _setSharedSipClientActive() {
    if (!this._sharedSipClient) {
      return;
    }
    if (this.isWebphoneActiveTab) {
      return;
    }
    const canBeActiveTabs = await this._canBeActiveTabs();
    this.logger.log('setSharedSipClientActive', canBeActiveTabs);
    if (canBeActiveTabs) {
      this.logger.log('setSharedSipClientActive', this._portManager.clientId);
      this._sharedSipClient.setActive(this._portManager.clientId ?? null);
    }
  }

  protected _canReuseSharedSipStatus(
    statusResponse: SharedSipClientStatusResponse,
  ) {
    const hasReusableStatus =
      statusResponse.status === 'registered' ||
      statusResponse.status === 'registering';
    const hasReusableTransport =
      statusResponse.transportStatus === 'connecting' ||
      statusResponse.transportStatus === 'connected' ||
      statusResponse.transportStatus === 'reconnecting';
    return {
      canReuse:
        (hasReusableStatus || hasReusableTransport) &&
        !!statusResponse.device &&
        !!statusResponse.sipInfo,
      hasReusableStatus,
      hasReusableTransport,
    };
  }

  private _getSharedSipClientStatusResponse(): SharedSipClientStatusResponse {
    if (this._sipClientInServer) {
      return this._sipClientInServer.getStatus();
    }
    return {
      activeTabId: null,
      sharedState: {},
      status: 'init',
      transportStatus: 'disconnected',
    };
  }

  private _emitSharedSipClientEvent(name: string, payload: Record<string, any>) {
    const transport = this._portManager.transports.server;
    if (!transport) {
      return;
    }
    // @ts-ignore
    transport.emit({ name, respond: false }, payload);
  }

  private _ensureSipClientInServer() {
    if (this._sipClientInServer) {
      return this._sipClientInServer;
    }
    const sipClient = new SipClientInServer({
      logger: this.logger,
    });
    sipClient.on('inboundMessage', (message) => {
      this._emitSharedSipClientEvent(SHARED_SIP_CLIENT_EVENTS.inboundMessage, {
        message: message.toString(),
      });
    });
    sipClient.on('outboundMessage', (message) => {
      this._emitSharedSipClientEvent(SHARED_SIP_CLIENT_EVENTS.outboundMessage, {
        message: message.toString(),
      });
    });
    sipClient.on(
      'status',
      (status: SharedSipRegistrationStatus, error?: string) => {
        this._emitSharedSipClientEvent(SHARED_SIP_CLIENT_EVENTS.status, {
          error,
          status,
        });
      },
    );
    sipClient.on('transportStatus', (status: SharedSipTransportStatus) => {
      this._emitSharedSipClientEvent(
        SHARED_SIP_CLIENT_EVENTS.transportStatus,
        {
          status,
        },
      );
    });
    sipClient.on('sharedStateChanged', (state: Record<string, any>) => {
      this._emitSharedSipClientEvent(
        SHARED_SIP_CLIENT_EVENTS.sharedStateChanged,
        {
          state,
        },
      );
    });
    sipClient.on('activeTabIdChanged', (activeTabId: string | null) => {
      this._emitSharedSipClientEvent(
        SHARED_SIP_CLIENT_EVENTS.activeTabIdChanged,
        {
          activeTabId,
        },
      );
    });
    this._sipClientInServer = sipClient;
    return sipClient;
  }

  private _bindSharedSipClientTransport(transport?: any) {
    if (!transport) {
      return () => {};
    }
    const destroyers = [
      // @ts-ignore
      transport.listen(
        SHARED_SIP_CLIENT_REQUESTS.start,
        async (options: SharedSipClientStartOptions) => {
          const sipClient = this._ensureSipClientInServer();
          await sipClient.start(options);
          return sipClient.getStatus();
        },
      ),
      // @ts-ignore
      transport.listen(
        SHARED_SIP_CLIENT_REQUESTS.request,
        async ({ data }: { data: string }) => {
          const sipClient = this._ensureSipClientInServer();
          const response = await sipClient.request(data);
          return response.toString();
        },
      ),
      // @ts-ignore
      transport.listen(
        SHARED_SIP_CLIENT_REQUESTS.reply,
        async ({ data }: { data: string }) => {
          const sipClient = this._ensureSipClientInServer();
          await sipClient.reply(data);
        },
      ),
      // @ts-ignore
      transport.listen(
        SHARED_SIP_CLIENT_REQUESTS.register,
        async ({ data }: { data: number }) => {
          const sipClient = this._ensureSipClientInServer();
          await sipClient.register(data);
        },
      ),
      // @ts-ignore
      transport.listen(SHARED_SIP_CLIENT_REQUESTS.unregister, async () => {
        const sipClient = this._ensureSipClientInServer();
        await sipClient.unregister();
      }),
      // @ts-ignore
      transport.listen(SHARED_SIP_CLIENT_REQUESTS.dispose, async () => {
        await this.disposeSipClientInServer();
      }),
      // @ts-ignore
      transport.listen(SHARED_SIP_CLIENT_REQUESTS.getStatus, async () => {
        return this._getSharedSipClientStatusResponse();
      }),
      // @ts-ignore
      transport.listen(
        SHARED_SIP_CLIENT_REQUESTS.getSharedState,
        async () => {
          return this._getSharedSipClientStatusResponse().sharedState;
        },
      ),
      // @ts-ignore
      transport.listen(
        SHARED_SIP_CLIENT_REQUESTS.setSharedState,
        async ({ state }: { state: Record<string, any> }) => {
          const sipClient = this._ensureSipClientInServer();
          sipClient.setSharedState(state);
          return sipClient.getStatus();
        },
      ),
      // @ts-ignore
      transport.listen(
        SHARED_SIP_CLIENT_REQUESTS.getActiveTabId,
        async () => {
          return this._getSharedSipClientStatusResponse().activeTabId;
        },
      ),
      // @ts-ignore
      transport.listen(
        SHARED_SIP_CLIENT_REQUESTS.setActiveTabId,
        async ({ activeTabId }: { activeTabId: string | null }) => {
          const sipClient = this._ensureSipClientInServer();
          sipClient.setActiveTabId(activeTabId);
          return sipClient.getStatus();
        },
      ),
    ];
    return () => {
      destroyers.forEach((destroyer) => {
        try {
          destroyer?.();
        } catch (error) {
          this.logger.error(
            'Failed to remove shared sip client transport listener',
            error,
          );
        }
      });
    };
  }

  @delegate('server')
  protected async disposeSipClientInServer() {
    await this.disposeSipClientInServerLocal();
  }

  protected async disposeSipClientInServerLocal() {
    if (!this._sipClientInServer) {
      return;
    }
    await this._sipClientInServer.dispose();
    this._sipClientInServer.removeAllListeners();
    this._sipClientInServer = null;
  }

  private _mapSipClientError(error?: unknown): {
    errorCode: ToastWebphoneError;
    statusCode: number | null;
  } {
    const message =
      typeof error === 'string' ? error : ((error as Error | undefined)?.message ?? '');
    if (message.includes('SIP/2.0 603')) {
      return {
        errorCode: 'webphoneCountOverLimit',
        statusCode: 603,
      };
    }
    if (message.includes('SIP/2.0 403')) {
      return {
        errorCode: 'webphoneForbidden',
        statusCode: 403,
      };
    }
    if (message.includes('SIP/2.0 500')) {
      return {
        errorCode: 'internalServerError',
        statusCode: 500,
      };
    }
    if (message.includes('SIP/2.0 504')) {
      return {
        errorCode: 'serverTimeout',
        statusCode: 504,
      };
    }
    return {
      errorCode: 'unknownError',
      statusCode: null,
    };
  }

  private _ensureSharedSipClient() {
    if (!this._portManager.shared) {
      return null;
    }
    if (this._sharedSipClient) {
      return this._sharedSipClient;
    }
    const sharedSipClient = new SharedSipClient({
      clientId: this._webphoneOptions?.appKey ?? '',
      logger: this.logger,
      portManager: this._portManager,
    });
    sharedSipClient.on(
      'status',
      async (status: SharedSipRegistrationStatus, error?: string) => {
        if (sharedSipClient.disposed) {
          return;
        }
        this.logger.log('shared sip client status', status, {
          connectionStatus: this.connectionStatus,
          connectRetryCounts: this.connectRetryCounts,
          isAuthoritative: this._isAuthoritativeWebphoneClient(),
          error,
        });
        if (!this._isAuthoritativeWebphoneClient()) {
          return;
        }
        if (status === 'registered') {
          const statusResponse = await sharedSipClient.getStatus();
          if (statusResponse.device && statusResponse.sipInfo) {
            await this._onWebphoneRegistered({
              device: statusResponse.device,
              sipInfo: [statusResponse.sipInfo],
            });
          }
          return;
        }
        if (status === 'unregistered') {
          await this._onWebphoneUnregistered();
          return;
        }
        if (status === 'registering' && !this.connected) {
          if (this.connectError || this.connectFailed) {
            await this.setStateOnReconnect();
          } else if (!this.connecting && !this.reconnecting) {
            await this.setStateOnConnect();
          }
          return;
        }
        if (status === 'registrationError') {
          const { errorCode, statusCode } = this._mapSipClientError(error);
          await this._onConnectError({
            errorCode,
            statusCode,
            ttl: 0,
          });
        }
      },
    );
    sharedSipClient.on(
      'transportStatus',
      async (status: SharedSipTransportStatus) => {
        if (sharedSipClient.disposed) {
          return;
        }
        this.logger.log('shared sip client transport status', status, {
          connectionStatus: this.connectionStatus,
          connectRetryCounts: this.connectRetryCounts,
          isAuthoritative: this._isAuthoritativeWebphoneClient(),
        });
        if (!this._isAuthoritativeWebphoneClient()) {
          return;
        }
        if (status === 'connecting') {
          if (this.connecting || this.reconnecting) {
            this.logger.log('shared sip client transport connecting: skipping, already', this.connectionStatus);
            return;
          }
          if (this.connected || this.connectError || this.connectFailed) {
            await this.setStateOnReconnect();
          } else {
            await this.setStateOnConnect();
          }
          return;
        }
        if (status === 'error') {
          await this._onConnectError({
            errorCode: 'connectFailed',
            statusCode: null,
            ttl: 0,
          });
          return;
        }
        if (
          status === 'disconnected' &&
          !this.disconnecting &&
          !this.inactiveDisconnecting &&
          !this.disconnected &&
          !this.inactive
        ) {
          await this._onConnectError({
            errorCode: 'connectFailed',
            statusCode: null,
            ttl: 0,
          });
        }
      },
    );
    sharedSipClient.on('sharedStateChanged', (state: Record<string, any>) => {
      this._onSharedStateUpdated(state);
    });
    sharedSipClient.on('activeTabIdChanged', (activeTabId: string | null) => {
      this._onActiveTabIdChanged(activeTabId);
    });
    this._sharedSipClient = sharedSipClient;
    return sharedSipClient;
  }

  protected async _disposeLocalWebphoneInstance(force = false) {
    if (!this._webphone && !this._sharedSipClient) {
      return;
    }
    try {
      if (force) {
        await this._removeWebphone();
        return;
      }
      this._webphone?.removeAllListeners();
      await this._sharedSipClient?.dispose();
    } catch (error) {
      this.logger.error('Failed to dispose local webphone instance', error);
    }
    this._sharedSipClient = null;
    this.rcWebphoneInstance$.next(undefined);
  }

  protected async _ensureLocalWebphoneFromSharedState() {
    if (
      !this._portManager.shared ||
      !this.ready ||
      !this._auth.loggedIn ||
      this._webphone ||
      this._ensureLocalWebphonePromise ||
      this.disconnecting ||
      this.inactiveDisconnecting ||
      this.disconnected
    ) {
      return;
    }
    this._ensureLocalWebphonePromise = (async () => {
      const sharedSipClient = this._ensureSharedSipClient();
      if (!sharedSipClient) {
        return;
      }
      try {
        const statusResponse = await sharedSipClient.getStatus();
        const { canReuse } = this._canReuseSharedSipStatus(statusResponse);
        if (!canReuse || !statusResponse.device || !statusResponse.sipInfo) {
          return;
        }
        this._sipInstanceId = statusResponse.instanceId;
        await this._createWebphone(
          {
            device: statusResponse.device,
            sipInfo: [statusResponse.sipInfo],
          },
          false,
        );
      } catch (error) {
        this.logger.error(
          'Failed to ensure local webphone from shared state',
          error,
        );
      } finally {
        this._ensureLocalWebphonePromise = null;
      }
    })();
    await this._ensureLocalWebphonePromise;
  }

  async _createWebphone(
    provisionData: CreateSipRegistrationResponse,
    force = false,
  ) {
    this.logger.log(`_createWebphone`, provisionData);

    await this._removeWebphone();
    if (!this._sipInstanceId) {
      this._sipInstanceId = this._sipInstanceManager!.getInstanceId(
        this._auth.endpointId!,
      );
    }
    const sharedSipClient = this._ensureSharedSipClient();
    const webphone = new RingCentralWebphone({
      sipInfo: provisionData.sipInfo?.[0] as SipInfo,
      instanceId: this._sipInstanceId,
      debug: (this._webphoneOptions.webphoneLogLevel ?? 0) > 1,
      deviceManager: this._audioDeviceManager ?? undefined,
      ...(this._webphoneOptions.webphoneSDKOptions ?? {}),
      sipClient: sharedSipClient ?? undefined,
    });
    this.rcWebphoneInstance$.next(webphone);
    this.loadAudio();
    webphone.on('inboundCall', (session) => {
      this.logger.log(`invite`, session);
      this._ensureSessionCompatibility(session as WebphoneSession);
      this._onInvite(session as WebphoneSession);
    });
    webphone.on('outboundCall', (session) => {
      this._ensureSessionCompatibility(session as WebphoneSession);
    });
    webphone.sipClient.on('inboundMessage', (inboundMessage) => {
      if (inboundMessage.headers.Event !== 'check-sync') {
        return;
      }
      if (!this._isAuthoritativeWebphoneClient()) {
        return;
      }
      if (Object.keys(this.originalSessions).length > 0) {
        this._reconnectAfterSessionEnd = {
          reason: t('provisionUpdate'),
        };
        return;
      }
      this._toast.warning({
        message: t('provisionUpdate'),
        allowDuplicates: false,
        group: this.identifier,
      });
      this.connect({
        force: true,
        skipDLCheck: true,
        skipConnectDelay: true,
      });
    });
    try {
      if (sharedSipClient) {
        await sharedSipClient.start({
          clientId: this._webphoneOptions?.appKey ?? '',
          debug: (this._webphoneOptions?.webphoneLogLevel ?? 0) > 1,
          device: provisionData.device!,
          force,
          instanceId: this._sipInstanceId,
          sipInfo: provisionData.sipInfo?.[0] as SipInfo,
        });
        await this._syncSharedState();
        await this._setSharedSipClientActive();
        if (!sharedSipClient.activeTabId) {
          await sharedSipClient.syncActiveTabId();
        }
        const statusResponse = await sharedSipClient.getStatus();
        if (statusResponse.status === 'registered') {
          if (statusResponse.device && statusResponse.sipInfo) {
            await this._onWebphoneRegistered({
              device: statusResponse.device,
              sipInfo: [statusResponse.sipInfo],
            });
          }
        }
      } else {
        await webphone.start();
        await this._onWebphoneRegistered(provisionData);
      }
    } catch (error: any) {
      this.logger.error('Webphone Register Error:', error);
      const { errorCode, statusCode } = this._mapSipClientError(error);
      await this._onConnectError({ errorCode, statusCode });
      return;
    }
    const onSipTransportClosed = async () => {
      if (
        this.disconnecting ||
        this.inactiveDisconnecting ||
        this.disconnected ||
        this.inactive
      ) {
        return;
      }
      await this.setRetryCounts(20);
      this._onConnectError({
        errorCode: 'connectFailed',
        ttl: 0,
      });
    };
    webphone.sipClient.wsc?.addEventListener('close', onSipTransportClosed);
  }

  private async _waitModuleReady(module?: RcModule, timeoutMs: number = 30000) {
    if (!module || module.ready) return;
    try {
      await firstValueFrom(
        module.ready$.pipe(
          filter((ready) => Boolean(ready)),
          timeout({
            each: timeoutMs,
            with: () =>
              throwError(
                () => new Error(`Module ready timeout after ${timeoutMs}ms`),
              ),
          }),
        ),
      );
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        this.logger.warn(
          `[${this.identifier}] > waitModuleReady failed`,
          error,
        );
      }
    }
  }

  /**
   * Check realtime channel readiness status and log warnings if not ready
   * @returns true if both websocket and subscription are ready, false otherwise
   */
  private _checkRealtimeReadiness({
    ringCentralExtensions,
    subscription,
    shouldWaitForSubscription,
    timeoutMs,
  }: {
    ringCentralExtensions: RingCentralExtensions;
    subscription?: Subscription;
    shouldWaitForSubscription: boolean;
    timeoutMs: number;
  }): boolean {
    const websocketReady = ringCentralExtensions.isWebSocketReady;
    const subscriptionReady =
      !shouldWaitForSubscription || Boolean(subscription?.subscriptionReady);

    const isReady = websocketReady && subscriptionReady;

    if (!isReady && process.env.NODE_ENV !== 'test') {
      this.logger.warn(
        `[${this.identifier}] > realtime channel not ready after ${timeoutMs}ms`,
        {
          websocketReady,
          subscriptionReady,
          shouldWaitForSubscription,
        },
      );
    }

    return isReady;
  }

  protected async _awaitRealtimeRecovery({
    recover = true,
    timeout = this._webphoneOptions?.webSocketRecoveryTimeout ??
      DEFAULT_WEBSOCKET_RECOVERY_TIMEOUT,
  }: {
    recover?: boolean;
    timeout?: number;
  } = {}) {
    if (process.env.NODE_ENV === 'test') return true;
    const startTime = Date.now();
    const ringCentralExtensions = this._ringCentralExtensions;
    if (!ringCentralExtensions) {
      return true;
    }

    // Wait for module ready with a portion of the total timeout (1/4 or max 5s)
    const moduleReadyTimeout = Math.min(timeout / 4, 5000);
    await this._waitModuleReady(ringCentralExtensions, moduleReadyTimeout);

    if (recover && !ringCentralExtensions.isWebSocketReady) {
      try {
        await ringCentralExtensions.recoverWebSocketConnection();
      } catch (error) {
        if (process.env.NODE_ENV !== 'test') {
          this.logger.warn(
            `[${this.identifier}] > recoverWebSocketConnection failed`,
            error,
          );
        }
      }
    }

    const subscription = this._subscription;
    if (subscription) {
      const elapsed = Date.now() - startTime;
      const remainingTimeout = Math.max(timeout - elapsed, 1000);
      await this._waitModuleReady(subscription, remainingTimeout);
    }

    const shouldWaitForSubscription =
      !!subscription &&
      (subscription.filters.length > 0 ||
        Boolean(subscription.subscriptionInfo));

    const readinessStreams = [
      fromWatchValue(
        ringCentralExtensions,
        () => ringCentralExtensions.isWebSocketReady,
      ).pipe(
        filter(Boolean),
        map(() => true),
      ),
    ];

    if (shouldWaitForSubscription && subscription) {
      readinessStreams.push(
        fromWatchValue(subscription, () => subscription.subscriptionReady).pipe(
          filter(Boolean),
          map(() => true),
        ),
      );
    }

    // Calculate remaining timeout for the final readiness check
    const elapsed = Date.now() - startTime;
    const remainingTimeout = Math.max(timeout - elapsed, 0);

    if (remainingTimeout === 0) {
      return this._checkRealtimeReadiness({
        ringCentralExtensions,
        subscription,
        shouldWaitForSubscription,
        timeoutMs: timeout,
      });
    }

    const readiness$ = combineLatest(readinessStreams).pipe(map(() => true));

    const isReady = await firstValueFrom(
      race([readiness$, timer(remainingTimeout).pipe(map(() => false))]),
    );

    if (!isReady) {
      return this._checkRealtimeReadiness({
        ringCentralExtensions,
        subscription,
        shouldWaitForSubscription,
        timeoutMs: timeout,
      });
    }

    return true;
  }

  private async _waitForConnectPrerequisites() {
    this.logger.log('wait for loggedIn');
    await firstValueFrom(this._auth.isLoggedIn$);
    await firstValueFrom(this._extensionFeatures.dataReady$);
  }

  private _getReusableSipProvision(
    statusResponse?: SharedSipClientStatusResponse | null,
  ): CreateSipRegistrationResponse | undefined {
    if (!statusResponse) {
      return;
    }
    const { canReuse } = this._canReuseSharedSipStatus(statusResponse);
    if (!canReuse || !statusResponse.device || !statusResponse.sipInfo) {
      return;
    }
    this._sipInstanceId = statusResponse.instanceId;
    return {
      device: statusResponse.device,
      sipInfo: [statusResponse.sipInfo],
    };
  }

  private async _resolveSipProvision({
    force = false,
    getStatus,
    onStatusError,
  }: {
    force?: boolean;
    getStatus?:
      | (() =>
          | SharedSipClientStatusResponse
          | Promise<SharedSipClientStatusResponse>)
      | null;
    onStatusError?: (error: unknown) => void;
  }): Promise<CreateSipRegistrationResponse | undefined> {
    if (!force && getStatus) {
      try {
        const statusResponse = await getStatus();
        const reusableProvision =
          this._getReusableSipProvision(statusResponse);
        if (reusableProvision) {
          return reusableProvision;
        }
      } catch (error) {
        onStatusError?.(error);
      }
    }
    return this._sipProvision();
  }

  protected async _setStateOnStartConnect(force = false) {
    this.logger.log('_setStateOnStartConnect', { force, connectionStatus: this.connectionStatus, connectRetryCounts: this.connectRetryCounts });
    if (this.connectError || force) {
      await this.setStateOnReconnect();
      return;
    }
    if (!this.connected) {
      await this.setStateOnConnect();
    }
  }

  private async _prepareRealtimeRecoveryForConnect() {
    this._clearRealtimeRecoveryRetryTimeout();

    const shouldRecover =
      !!this._ringCentralExtensions &&
      !this._ringCentralExtensions.isWebSocketReady;

    const realtimeReady = await this._awaitRealtimeRecovery({
      recover: shouldRecover,
    });

    if (!realtimeReady) {
      this.logger.warn('WSG WebSocket connection not ready');

      const nextRealtimeRetryCounts = this.realtimeRecoveryRetryCounts + 1;
      await this.setRealtimeRecoveryRetryCounts(nextRealtimeRetryCounts);

      if (nextRealtimeRetryCounts <= REALTIME_RECOVERY_QUICK_RETRY_LIMIT) {
        // First few attempts: quick retry without showing error
        this.logger.log(
          `WebSocket timeout, quick retry (attempt ${nextRealtimeRetryCounts})`,
        );
        this.connect({
          skipDLCheck: true,
          skipConnectDelay: true,
          skipTimeout: false,
        });
      } else {
        // After multiple failures: show error and retry in background
        this.logger.warn(
          `WebSocket timeout after ${nextRealtimeRetryCounts} attempts, showing error and retrying in background`,
        );
        await this.setStateOnConnectError('connectFailed', null);
        this.showErrorToast({
          errorCode: 'serverConnecting',
          isConnecting: false,
        });

        // Delayed background retry
        const retryDelay = this._getConnectTimeoutTtl();
        this.logger.log(`Will retry in ${retryDelay}ms`);
        this._scheduleRealtimeRecoveryRetry(retryDelay);
      }
      return false;
    }

    await this.setRealtimeRecoveryRetryCounts(0);
    return true;
  }

  protected async _connectInBrowser({
    force = false,
    skipTimeout = true,
    skipConnectDelay = false,
    skipDLCheck = false,
  } = {}) {
    const connectDelay = this._webphoneOptions!.connectDelay ?? 0;

    this.logger.log('connect to webphone delay', {
      skipConnectDelay,
      connectDelay,
    });

    if (!skipConnectDelay && connectDelay > 0) {
      await sleep(connectDelay);
    }
    if (!skipDLCheck) {
      // in new project, we don't need to check device lines every time when make call, only validate device lines use ExtensionDevice
      if (process.env.THEME_SYSTEM !== 'spring-ui') {
        await this._fetchDL();
      }

      this.validateDeviceLines();
    }

    this.logger.log('before connect check the connect status', {
      connectionStatus: this.connectionStatus,
      loggedIn: this._auth.loggedIn,
    });

    if (this.disconnected || this.disconnecting || !this._auth.loggedIn) {
      return;
    }
    if (this._connectTimeout) {
      clearTimeout(this._connectTimeout);
    }

    this.logger.log('before connect check the connect status', {
      connectionStatus: this.connectionStatus,
      loggedIn: this._auth.loggedIn,
      skipTimeout,
    });

    if (force || skipTimeout) {
      await this._connect(force);
      return;
    }

    const connectTimeoutTTL = this._getConnectTimeoutTtl();

    this.logger.log('before connect timeout TTL', {
      connectTimeoutTTL,
    });
    this._connectTimeout = setTimeout(() => {
      this._connectTimeout = null;
      void this._connect(force);
    }, connectTimeoutTTL);
  }

  // eslint-disable-next-line
  async _onInvite(session: WebphoneSession) {
    // override
  }

  /**
   * Server-only connect flow. Skips browser-only logic (browser support
   * check, toasts, device line validation, WebRTC) and connects only the
   * shared SIP client running in the SharedWorker.
   */
  protected async _serverConnect({ force = false } = {}) {
    this.logger.log('_serverConnect', { force });
    await this._waitForConnectPrerequisites();
    const isAvailableToConnect = this._isAvailableToConnect({
      force,
      skipSharedActiveTabCheck: true,
    });
    this.logger.log('_serverConnect available', isAvailableToConnect);
    if (!isAvailableToConnect) return;
    await this._setStateOnStartConnect(force);
    try {
      await this._connectSipServer(force);
    } catch (error) {
      this.logger.error('Server SIP connect error:', error);
      await this.setStateOnConnectError('connectFailed', null);
    }
  }

  /**
   * Connects the SipClientInServer directly on the server.
   * Provisions SIP credentials and starts SIP registration without
   * creating any browser-side RingCentralWebphone instance.
   */
  protected async _connectSipServer(force = false) {
    this.logger.log('_connectSipServer', { force, connectionStatus: this.connectionStatus });
    if (!this._auth.loggedIn) return;
    const sipClientInServer = this._ensureSipClientInServer();
    const sipProvision = await this._resolveSipProvision({
      force,
      getStatus: () => sipClientInServer.getStatus(),
    });
    if (!sipProvision) return;
    if (!this._sipInstanceId) {
      this._sipInstanceId =
        sipProvision.sipInfo?.[0]?.authorizationId ?? null;
    }
    await sipClientInServer.start({
      clientId: this._webphoneOptions?.appKey ?? '',
      debug: (this._webphoneOptions?.webphoneLogLevel ?? 0) > 1,
      device: sipProvision.device!,
      force,
      instanceId: this._sipInstanceId,
      sipInfo: sipProvision.sipInfo?.[0] as SipInfo,
    });
    const statusAfterStart = sipClientInServer.getStatus();
    if (statusAfterStart.status === 'registered') {
      await this.setStateOnRegistered(sipProvision.device!);
    }
  }

  async _connect(force = false) {
    this.logger.log('_connect');

    if (!this._auth.loggedIn) return;

    const sharedSipClient = this._ensureSharedSipClient();
    const sipProvision = await this._resolveSipProvision({
      force,
      getStatus: sharedSipClient ? () => sharedSipClient.getStatus() : null,
      onStatusError: (error) => {
        this.logger.error('Failed to get shared sip client status', error);
      },
    });
    if (sipProvision) {
      await this._createWebphone(sipProvision, force);
    }
  }

  _isAvailableToConnect({
    force,
    skipSharedActiveTabCheck = false,
  }: {
    force: boolean;
    skipSharedActiveTabCheck?: boolean;
  }) {
    this.logger.log('check available to connect', {
      loggedIn: this._auth.loggedIn,
      force,
      enabled: this.enabled,
      connectionStatus: this.connectionStatus,
    });

    if (!this.enabled || !this._auth.loggedIn) {
      return false;
    }
    // do not connect if it is connecting
    // do not reconnect when user disconnected
    if (
      this.connecting ||
      this.disconnecting ||
      this.inactiveDisconnecting ||
      this.reconnecting
    ) {
      return false;
    }
    // do not connect when connected unless force
    if (!force && this.connected) {
      return false;
    }
    if (
      !skipSharedActiveTabCheck &&
      this._sharedSipClient &&
      this._portManager.shared &&
      !this._portManager.isActiveTab
    ) {
      this.logger.log(
        'skip connect in inactive tab when shared sip client already exists',
      );
      return false;
    }
    return true;
  }

  /**
   * connect a web phone.
   * In shared mode on the server, only connects the SIP client.
   * Client tabs create their own RingCentralWebphone instances
   * via _ensureLocalWebphoneFromSharedState() when connection state changes.
   */
  async connect({
    force = false,
    skipTimeout = true,
    skipConnectDelay = false,
    skipDLCheck = false,
  } = {}) {
    this.logger.log('connect', {
      force,
      skipTimeout,
      skipConnectDelay,
      skipDLCheck,
    });
    if (this._portManager.shared && this._portManager.isServer) {
      await this._serverConnect({ force });
      return;
    }
    if (!isBrowserSupport()) {
      await this.setStateOnConnectError('browserNotSupported', null);
      this._toast.warning({
        message: t('browserNotSupported'),
        group: this.identifier,
        ttl: 0,
      });
      return;
    }

    await this._waitForConnectPrerequisites();

    const realtimeReady = await this._prepareRealtimeRecoveryForConnect();
    if (!realtimeReady) {
      return;
    }

    const isAvailableToConnect = this._isAvailableToConnect({ force });

    this.logger.log('isAvailableToConnect', isAvailableToConnect);

    if (!isAvailableToConnect) return;

    await this._setStateOnStartConnect(force);
    await this._connectInBrowser({
      force,
      skipTimeout,
      skipConnectDelay,
      skipDLCheck,
    });
  }

  _getConnectTimeoutTtl() {
    return this._reconnectDelays[
      Math.min(this.connectRetryCounts, this._reconnectDelays.length - 1)
    ];
  }

  private _clearRealtimeRecoveryRetryTimeout() {
    if (this._realtimeRecoveryRetryTimeout) {
      clearTimeout(this._realtimeRecoveryRetryTimeout);
      this._realtimeRecoveryRetryTimeout = null;
    }
  }

  private _scheduleRealtimeRecoveryRetry(delay: number) {
    this._clearRealtimeRecoveryRetryTimeout();
    this._realtimeRecoveryRetryTimeout = setTimeout(async () => {
      this._realtimeRecoveryRetryTimeout = null;
      if (this.connectError && this._auth.loggedIn) {
        this.connect({
          skipConnectDelay: true,
          force: true,
          skipDLCheck: true,
        });
      }
    }, delay);
  }

  showErrorToast({
    errorCode,
    statusCode = this.statusCode,
    ttl,
    isConnecting = false,
  }: {
    errorCode: WebphoneError;
    statusCode?: number | null;
    ttl?: number;
    isConnecting?: boolean;
  }) {
    const message = (() => {
      if (
        errorCode === 'sipProvisionError' ||
        errorCode === 'webphoneForbidden' ||
        errorCode === 'requestTimeout' ||
        errorCode === 'serverTimeout' ||
        errorCode === 'internalServerError' ||
        errorCode === 'unknownError'
      ) {
        if (statusCode && isConnecting) {
          return t('registeringWithStatusCode', {
            errorCode: statusCode,
            brandName: this._brand.name,
          });
        }
        if (statusCode) {
          return t('failWithStatusCode', {
            errorCode: statusCode,
            brandName: this._brand.name,
          });
        }
        if (isConnecting) {
          return t('registeringWithoutStatusCode', {
            brandName: this._brand.name,
          });
        }
        return t('failWithoutStatusCode', {
          brandName: this._brand.name,
        });
      }

      return t(errorCode);
    })();

    return this._toast.danger({
      message,
      ttl,
      allowDuplicates: false,
      group: `${this.identifier}_${isConnecting ? 'connecting' : 'failed'}`,
    });
  }

  async _onConnectError({
    errorCode,
    statusCode,
    ttl,
  }: {
    errorCode: ToastWebphoneError;
    statusCode?: number | null;
    ttl?: number;
  }) {
    this.logger.log('_onConnectError', {
      errorCode,
      statusCode,
      connectionStatus: this.connectionStatus,
      connectRetryCounts: this.connectRetryCounts,
      isAuthoritative: this._isAuthoritativeWebphoneClient(),
    });
    if (!this._isAuthoritativeWebphoneClient()) {
      return;
    }
    if (statusCode === 403 && this._sipInstanceId) {
      // recreate sip instance id if server send 403
      this._sipInstanceId = null;
    }
    if (
      this.connectRetryCounts > 2 ||
      this.reconnecting ||
      this.connected ||
      this.connectError
    ) {
      await this.setStateOnConnectError(errorCode, statusCode);

      this.showErrorToast({ ttl, errorCode, statusCode, isConnecting: false });

      await this._hideConnectingAlert();
      // Need to show unavailable badge and reconnect in background when third retry
      // sleep before next reconnect for slient reconnect in background
      const retryDelay = this._getConnectTimeoutTtl();
      this.logger.log('_onConnectError: sleeping before retry', { retryDelay, connectRetryCounts: this.connectRetryCounts });
      await sleep(retryDelay);
      if (!this.connectError) {
        this.logger.log('_onConnectError: state changed during sleep, aborting retry', { connectionStatus: this.connectionStatus });
        return;
      }
      this.logger.log('_onConnectError: retrying connect after sleep');
      this.connect({ skipConnectDelay: true, force: true, skipDLCheck: true });
      return;
    }
    this.logger.log('_onConnectError: early retry', { connectRetryCounts: this.connectRetryCounts });
    await this.setStateOnConnectFailed(errorCode, statusCode!);
    if (this.connectRetryCounts === 1) {
      this.showErrorToast({ ttl, errorCode, statusCode, isConnecting: true });
      await this._hideConnectFailedAlert();
    }
    this.connect({
      skipDLCheck: true,
      skipConnectDelay: true,
      skipTimeout: false,
    });
  }

  async _onWebphoneRegistered(provisionData: CreateSipRegistrationResponse) {
    if (this._isAuthoritativeWebphoneClient()) {
      await this.setStateOnRegistered(provisionData.device!);
      await this._hideRegisterErrorAlert();
    }
    await this._awaitRealtimeRecovery();
    this._eventEmitter.emit(EVENTS.webphoneRegistered);
  }

  async _onWebphoneUnregistered() {
    if (
      this.disconnecting ||
      this.inactiveDisconnecting ||
      this.disconnected ||
      this.inactive ||
      !!this._stopWebphoneUserAgentPromise
    ) {
      // unregister by our app
      return;
    }
    // unavailable, unregistered by some errors
    if (this._isAuthoritativeWebphoneClient()) {
      await this.setStateOnConnectError();
    }
    this._eventEmitter.emit(EVENTS.webphoneUnregistered);
  }

  async _disconnectToInactive() {
    await this.setConnectionStatus(connectionStatus.inactiveDisconnecting);
    await this.setDevice(null);
    await this._removeWebphone();
    await this.setStateWhenUnregisteredOnInactive();
  }

  private async _hideConnectingAlert() {
    await this._toast.dismissByGroup([`${this.identifier}_connecting`]);
  }

  private async _hideConnectFailedAlert() {
    await this._toast.dismissByGroup([`${this.identifier}_failed`]);
  }

  private async _hideRegisterErrorAlert() {
    const identifier = this.identifier;
    await this._toast.dismissByGroup([
      identifier!,
      `${identifier}_failed`,
      `${identifier}_connecting`,
    ]);
  }

  async _disconnect(force = false) {
    if (this.disconnected || this.disconnecting) {
      return;
    }
    if (this._sharedSipClient && !force) {
      if (this.isWebphoneActiveTab) {
        this._sharedSipClient.setActive(null);
      }
      this._webphone?.removeAllListeners();
      await this._sharedSipClient.dispose();
      this._sharedSipClient = null;
      this.rcWebphoneInstance$.next(undefined);
      return;
    }
    if (this._connectTimeout) {
      clearTimeout(this._connectTimeout);
    }
    // this method will send event through webphone socket to ensure the webphone is disconnected, we must ensure not await this method to avoid the `_removeWebphone` event not trigger in sync when pagehide
    this.setStoreOnDisconnect();
    if (this._portManager.shared) {
      await this._disposeLocalWebphoneInstance(force);
      await this.disposeSipClientInServer();
    } else if (this._webphone || this._sharedSipClient) {
      await this._removeWebphone();
    }
    await this.setStateOnUnregistered();
  }

  async disconnect() {
    this._sipInstanceId = null;
    await this._disconnect(true);
  }

  loadAudio() {
    if (this._ringtoneHelper) {
      this._ringtoneHelper.loadAudio(this.incomingAudio);
      this._ringtoneHelper.setDeviceId(this._audioSettings.ringtoneDeviceId);
    }
  }

  stopRingtone() {
    this._ringtoneHelper?.stop();
  }

  @delegate('mainClient')
  async setOutgoingAudio({
    fileName,
    dataUrl,
  }: {
    fileName: string;
    dataUrl: string;
  }) {
    // TODO: validate filePath?
    this._setOutgoingAudioIntoStorage(fileName, dataUrl);
    this.loadAudio();
  }

  @delegate('mainClient')
  async resetOutgoingAudio() {
    this._resetOutgoingAudio();
    this.loadAudio();
  }

  @delegate('mainClient')
  async setIncomingAudio({
    fileName,
    dataUrl,
  }: {
    fileName: string;
    dataUrl: string;
  }) {
    // TODO: validate filePath?
    this._setIncomingAudioIntoStorage(fileName, dataUrl);
    this.loadAudio();
  }

  @delegate('server')
  async setIncomingAudioIntoStorage({
    fileName,
    dataUrl,
  }: {
    fileName: string;
    dataUrl: string;
  }) {
    this._setIncomingAudioIntoStorage(fileName, dataUrl);
  }

  @delegate('mainClient')
  async loadClientAudio() {
    this.loadAudio();
  }

  @delegate('mainClient')
  async resetIncomingAudio() {
    this._resetIncomingAudio();
    this.loadAudio();
  }

  @delegate('mainClient')
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
      incomingAudioFile === DEFAULT_AUDIO &&
      incomingAudio === defaultIncomingAudio;
    const isOutgoingDefault =
      outgoingAudioFile === DEFAULT_AUDIO &&
      outgoingAudio === defaultOutgoingAudio;
    this._setRingtoneIntoStorage(
      isIncomingDefault ? DEFAULT_AUDIO : incomingAudioFile,
      isIncomingDefault ? null : incomingAudio,
      isOutgoingDefault ? DEFAULT_AUDIO : outgoingAudioFile,
      isOutgoingDefault ? null : outgoingAudio,
    );
    this.loadAudio();
  }

  /**
   * !! It can only be called in a non-shared shared worker.
   */
  get originalSessions() {
    return this.webphoneSessions.reduce(
      (sessions, session) => {
        sessions[session.callId] = this._ensureSessionCompatibility(
          session as WebphoneSession,
        );
        return sessions;
      },
      {} as Record<string, WebphoneSession>,
    );
  }

  get webphoneSessions() {
    return (this._webphone?.callSessions ?? []) as WebphoneSession[];
  }

  // for backward compatibility v1
  get _sessions() {
    return new Map(Object.entries(this.originalSessions));
  }

  get enabled() {
    return this._appFeatures.isWebPhoneEnabled;
  }

  get disconnecting() {
    return this.connectionStatus === connectionStatus.disconnecting;
  }

  get inactiveDisconnecting() {
    return this.connectionStatus === connectionStatus.inactiveDisconnecting;
  }

  get inactive() {
    return this.connectionStatus === connectionStatus.inactive;
  }

  get connecting() {
    return this.connectionStatus === connectionStatus.connecting;
  }

  get reconnecting() {
    return this.connectionStatus === connectionStatus.reconnecting;
  }

  get connected() {
    return this.connectionStatus === connectionStatus.connected;
  }

  get disconnected() {
    return this.connectionStatus === connectionStatus.disconnected;
  }

  get connectFailed() {
    return this.connectionStatus === connectionStatus.connectFailed;
  }

  get connectError() {
    return this.connectionStatus === connectionStatus.connectError;
  }

  /*
   * Together with `CallingSettings` module to check if webphone is
   * Unavailable.
   */
  get isUnavailable() {
    return (
      this.ready &&
      this._auth.loggedIn &&
      (!this._audioSettings.userMedia ||
        this.reconnecting ||
        this.connectError ||
        this.inactive)
    );
  }

  get incomingAudio() {
    // support turn off ringtone
    if (this.incomingAudioDataUrl === '') {
      return '';
    }
    return this.incomingAudioDataUrl || this.defaultIncomingAudio;
  }

  get outgoingAudio() {
    return this.outgoingAudioDataUrl || this.defaultOutgoingAudio;
  }

  get defaultIncomingAudio() {
    return defaultIncomingAudio;
  }

  get defaultOutgoingAudio() {
    return defaultOutgoingAudio;
  }

  get defaultIncomingAudioFile() {
    return DEFAULT_AUDIO;
  }

  get defaultOutgoingAudioFile() {
    return DEFAULT_AUDIO;
  }
}
