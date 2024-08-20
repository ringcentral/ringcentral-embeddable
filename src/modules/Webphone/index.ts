import {
  trackEvents,
} from '@ringcentral-integration/commons/enums/trackEvents';
import { Module } from '@ringcentral-integration/commons/lib/di';
import proxyActionTypes
  from '@ringcentral-integration/commons/lib/proxy/baseActionTypes';
import { proxify } from '@ringcentral-integration/commons/lib/proxy/proxify';
import {
  Webphone as WebphoneBase,
} from '@ringcentral-integration/commons/modules/Webphone';
import {
  connectionStatus,
} from '@ringcentral-integration/commons/modules/Webphone/connectionStatus';
import {
  EVENTS as EVENTS_BASE,
} from '@ringcentral-integration/commons/modules/Webphone/events';
import {
  action,
  track,
  watch,
  computed,
} from '@ringcentral-integration/core';
import type {
  ObjectMapValue,
} from '@ringcentral-integration/core/lib/ObjectMap';
import { ObjectMap } from '@ringcentral-integration/core/lib/ObjectMap';
import { sleep } from '@ringcentral-integration/utils';

import { MultipleTabsTransport } from '../../lib/MultipleTabsTransport';
import { normalizeSession } from './helper';
import { patchAudioHelper } from './patchAudioHelper';

const EVENTS = ObjectMap.fromKeys([
  ...ObjectMap.keys(EVENTS_BASE),
  'activeWebphoneChanged',
]);

const WEBPHONE_STATE_SYNC_KEY = 'webphone-state-sync';

@Module({
  name: 'NewWebphone',
  deps: [
    'NoiseReduction',
  ]
})
export class Webphone extends WebphoneBase {
  protected _multipleTabsSupport?: boolean;
  protected _forceCurrentWebphoneActive?: boolean;
  protected _multipleTabsTransport: MultipleTabsTransport;
  protected _proxyActionTypes: ObjectMapValue<typeof proxyActionTypes>;
  protected _removedWebphoneAtUnload: boolean = false;

  constructor(deps) {
    super(deps);
    this._ignoreModuleReadiness(deps.noiseReduction);
    this._multipleTabsSupport = deps.webphoneOptions.multipleTabsSupport;
    this._forceCurrentWebphoneActive = deps.webphoneOptions.forceCurrentWebphoneActive;
    if (deps.webphoneOptions.multipleTabsSupport) {
      this._proxyActionTypes = proxyActionTypes;
      this._multipleTabsTransport = new MultipleTabsTransport({
        name: 'webphone-channel',
        tabId: this._deps.tabManager.tabbie.id,
        timeout: 10 * 1000,
        prefix: this._deps.prefix,
        getMainTabId: () => this.activeWebphoneId,
      });
      if (
        !this.isWebphoneActiveTab &&
        this.activeWebphoneId !== '-1' &&
        this.activeWebphoneId !== null
      ) {
        this._enableProxify();
      }
      this._multipleTabsTransport.on(
        this._multipleTabsTransport.events.request,
        this._onMultipleTabsChannelRequest
      );
      this._multipleTabsTransport.on(
        this._multipleTabsTransport.events.broadcast,
        this._onMultipleTabsChannelBroadcast
      );
      Array.from(ObjectMap.keys(EVENTS)).forEach((event) => {
        this._eventEmitter.on(event, (...args) => {
          if (this.isWebphoneActiveTab) {
            this._multipleTabsTransport.broadcast({ event, message: args });
          }
        });
      });
    }
  }

  override async _initModule() {
    super._initModule();
    if (this._multipleTabsSupport) {
      window.addEventListener('beforeunload', () => {
        if (!this._webphone) {
          return;
        }
        if (Object.keys(this.originalSessions).length > 0) {
          this._removedWebphoneAtUnload = true;
          setTimeout(() => {
            this._removedWebphoneAtUnload = false;
          }, 8000);
        }
      });
    }
  }

  override onInitOnce() {
    super.onInitOnce();
    if (this._multipleTabsSupport) {
      if (!this.isWebphoneActiveTab) {
        this._syncStateFromStorage();
      }
      this._initMultipleTabsStateSyncing();
      watch(
        this,
        () => [
          this.activeSessionId,
          this.ringSessionId,
          this.lastEndedSessions,
          this.sessions,
          this.connectionStatus,
          this.connectRetryCounts,
          this.errorCode,
          this.statusCode,
          this.device,
        ],
        () => {
          if (!this.isWebphoneActiveTab) {
            return;
          }
          this._syncStateToStorage();
        },
        {
          multiple: true,
        },
      );
    }
    watch(
      this,
      () => this.shouldSetRingtoneSinkId,
      () => {
        if (
          this.ready &&
          this._webphone &&
          this._webphone.userAgent &&
          this._webphone.userAgent.audioHelper &&
          this._webphone.userAgent.audioHelper.setDeviceId
        ) {
          this._webphone.userAgent.audioHelper.setDeviceId(
            this._deps.audioSettings.ringtoneDeviceId,
          );
        }
      },
    );
  }

  _initMultipleTabsStateSyncing() {
    window.addEventListener('storage', (e) => {
      if (e.key === WEBPHONE_STATE_SYNC_KEY) {
        this._syncStateFromStorage();
      }
    });
  }

  _syncStateToStorage() {
    localStorage.setItem(
      WEBPHONE_STATE_SYNC_KEY,
      JSON.stringify({
        activeSessionId: this.activeSessionId,
        ringSessionId: this.ringSessionId,
        lastEndedSessions: this.lastEndedSessions,
        sessions: this.sessions,
        connectionStatus: this.connectionStatus,
        connectRetryCounts: this.connectRetryCounts,
        errorCode: this.errorCode,
        statusCode: this.statusCode,
        device: this.device,
      }),
    );
  }

  @action
  _syncStateFromStorage() {
    const rawData = localStorage.getItem(WEBPHONE_STATE_SYNC_KEY);
    if (!rawData) {
      return;
    }
    const data = JSON.parse(rawData);
    this.activeSessionId = data.activeSessionId;
    this.ringSessionId = data.ringSessionId;
    this.lastEndedSessions = data.lastEndedSessions;
    this.sessions = data.sessions;
    this.connectionStatus = data.connectionStatus;
    this.connectRetryCounts = data.connectRetryCounts;
    this.errorCode = data.errorCode;
    this.statusCode = data.statusCode;
    this.device = data.device;
  }

  // override normalizeSession for call queue name
  @proxify
  async clearSessionCaching() {
    this._clearSessionCaching(
      // @ts-expect-error
      [...Object.values(this.originalSessions)].map(normalizeSession),
    );
  }

  // override normalizeSession for call queue name
  @track((that: Webphone) =>
    that.isOnTransfer ? [trackEvents.coldTransferCall] : null,
  )
  _updateSessions() {
    this._updateSessionsState(
      // @ts-expect-error
      [...Object.values(this.originalSessions)].map(normalizeSession),
    );
  }

  get activeWebphoneId() {
    return localStorage.getItem(this._activeWebphoneKey);
  }

  get isWebphoneActiveTab() {
    return this.activeWebphoneId === this._deps.tabManager.tabbie.id;
  }

  _enableProxify() {
    this._transport = this._multipleTabsTransport;
  }

  _disableProxify() {
    this._transport = null;
  }

  get multipleTabsTransport() {
    return this._multipleTabsTransport;
  }

  get proxifyTransport() {
    return this._transport;
  }

  _onMultipleTabsChannelRequest = async ({
    requestId,
    payload: { type, functionPath, args },
  }) => {
    if (type !== this._proxyActionTypes.execute) {
      return;
    }
    if (functionPath.indexOf(this.modulePath) === -1) {
      return;
    }
    const funcName = functionPath.replace(`${this.modulePath}.`, '');
    if (funcName === 'connect') {
      if (!this.connected && !this.connecting) {
        this.connect(...args);
      }
      this._multipleTabsTransport.response({
        requestId: requestId,
        result: 'ok',
        error: null,
      });
    } else {
      let result, error;
      try {
        result = await this[funcName](...args);
      } catch (e) {
        error = e.message;
      }
      this._multipleTabsTransport.response({ requestId: requestId, result, error });
    }
  }

  _onMultipleTabsChannelBroadcast = ({ event, message }) => {
    if (EVENTS[event]) {
      this._eventEmitter.emit(EVENTS[event], ...message);
    }
  }

  override _createOtherWebphoneInstanceListener() {
    if ((!this._multipleTabsSupport && !this._disconnectOnInactive) || !this._deps.tabManager) {
      return;
    }
    window.addEventListener('storage', (e) => {
      this._onStorageChangeEvent(e);
    });
  }

  _onStorageChangeEvent(e: StorageEvent) {
    // disconnect to inactive when other tabs' web phone connected
    if (e.key === this._activeWebphoneKey) {
      if (this._multipleTabsSupport) {
        this._onActiveWebphoneIdChanged(e.newValue);
        return;
      }
      if (!this.connected || !document.hidden) {
        return;
      }
      if (e.newValue === this._deps.tabManager?.id) {
        return;
      }
      if (Object.keys(this.originalSessions).length === 0) {
        this._disconnectToInactive();
        return;
      }
      this._disconnectInactiveAfterSessionEnd = true;
    }
  }

  async _onActiveWebphoneIdChanged(newId) {
    if (newId === '-1') {
      let waitTime = 0;
      while (!this._deps.tabManager.tabbie.isFirstTab && waitTime <= 1000) {
        await sleep(200); // wait for active tab changed
        waitTime += 200;
      }
      // connect web phone when active web phone tab is removed and current tab is active
      if (this._deps.tabManager.tabbie.isFirstTab) {
        await this.connect({
          skipDLCheck: true,
          force: true,
          skipTabActiveCheck: true,
        });
      }
      return;
    }
    if (!newId) {
      return;
    }
    this._transport = this._multipleTabsTransport; // enable function proxify
    // clear connectTimeout if current tab is trying to connect and other tab want connect
    if (this._connectTimeout) {
      clearTimeout(this._connectTimeout);
    }
    if (this._webphone) {
      await this._removeWebphone();
    }
  }

  _cleanWebphoneInstanceWhenUnload() {
    if (!this._webphone) {
      if (this.isWebphoneActiveTab) {
        this._setStateOnUnregistered();
      }
      return;
    }
    this._setConnectionStatus(connectionStatus.disconnect);
    this._setActiveSessionId(null);
    this._setStateOnCallRing({
      id: null,
    });
    this._updateSessionsState([]);
    this._setStateOnUnregistered();
    this._removeWebphone();
  }

  // override
  override async connect(options = {}) {
    const newOptions = { ...options };
    if (this._multipleTabsSupport) {
      // Force set current tab as active web phone tab
      if (
        this._forceCurrentWebphoneActive &&
        this.activeWebphoneId !== this._deps.tabManager.tabbie.id
      ) {
        this._setStateOnUnregistered();
        this._setCurrentInstanceAsActiveWebphone();
      }
      // don't connect if there is connection in other tabs
      newOptions.skipTabActiveCheck = true;
      if (
        this.activeWebphoneId &&
        this.activeWebphoneId !== '-1' &&
        this.activeWebphoneId !== this._deps.tabManager.tabbie.id
      ) {
        try {
          await this._multipleTabsTransport.request({
            tabId: this.activeWebphoneId,
            payload: {
              type: this._proxyActionTypes.execute,
              functionPath: `${this.modulePath}.connect`,
              args: [newOptions],
            }
          });
          return;
        } catch (e) {
          console.error(new Error('multipleTabs no response'));
          if (!this._deps.tabManager.tabbie.isFirstTab) {
            return;
          }
          this._setStateOnUnregistered();
          this._setCurrentInstanceAsActiveWebphone();
        }
      }
      if (!this.activeWebphoneId || this.activeWebphoneId === '-1') {
        if (!this._deps.tabManager.tabbie.isFirstTab) {
          return;
        }
        this._setStateOnUnregistered();
        this._setCurrentInstanceAsActiveWebphone();
      }
    }
    return super.connect(newOptions);
  }

  override async _disconnect() {
    if (this._multipleTabsSupport) {
      if (!this.isWebphoneActiveTab) {
        return;
      }
      // for clean false, it is disconnected when tab is closed. Or manually disconnect
      let clean = !this._removedWebphoneAtBeforeUnload && !this._removedWebphoneAtUnload;
      this._removeCurrentInstanceFromActiveWebphone({ clean });
      if (!this._webphone) {
        this._setStateOnUnregistered();
        return;
      }
    }
    return super._disconnect();
  }

  override _removeCurrentInstanceFromActiveWebphone({ clean = false } = {}) {
    if (this._multipleTabsSupport) {
      if (!this.isWebphoneActiveTab) {
        return;
      }
      if (clean) {
        localStorage.removeItem(this._activeWebphoneKey);
        this._enableProxify();
        this._emitActiveWebphoneChangedEvent();
        return;
      }
      localStorage.setItem(this._activeWebphoneKey, '-1');
      localStorage.removeItem(this._activeWebphoneKey);
      this._enableProxify();
      this._emitActiveWebphoneChangedEvent();
      return;
    }
    super._removeCurrentInstanceFromActiveWebphone();
  }

  _emitActiveWebphoneChangedEvent() {
    this._eventEmitter.emit(
      EVENTS.activeWebphoneChanged,
      {
        activeId: this.activeWebphoneId,
        currentActive: this.isWebphoneActiveTab,
      },
    );
  }

  // override
  override  _setCurrentInstanceAsActiveWebphone() {
    if (!this._multipleTabsSupport) {
      super._setCurrentInstanceAsActiveWebphone();
      return;
    }
    if (this._deps.tabManager) {
      localStorage.setItem(this._activeWebphoneKey, this._deps.tabManager.tabbie.id);
      this._disableProxify();
      this._emitActiveWebphoneChangedEvent();
    }
  }

  // override
  override _onTabActive() {
    if (!this._multipleTabsSupport) {
      super._onTabActive();
      return;
    }
  }

  override _onWebphoneUnregistered() {
    if (!this._multipleTabsSupport) {
      this._removeCurrentInstanceFromActiveWebphone();
    }
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
    this._setStateOnConnectError();
    this._eventEmitter.emit(EVENTS.webphoneUnregistered);
  }

  // override
  override _makeWebphoneInactiveOnSessionsEmpty() {
    if (!this._multipleTabsSupport) {
      super._makeWebphoneInactiveOnSessionsEmpty();
      return;
    }
    this._disconnectInactiveAfterSessionEnd = false;
  }


  onActiveWebphoneChanged(handler) {
    if (typeof handler === 'function') {
      this._eventEmitter.on(EVENTS.activeWebphoneChanged, handler);
    }
  }

  // TODO: overide to fix warm transfer host call ended issue, wait fixed in widgets lib
  _onCallEnd(session) {
    const transferSession = this.sessions.find((s) => {
      return (
        s.warmTransferSessionId === session.id
      );
    });
    if (transferSession) {
      const originalTransferSession = this.originalSessions[transferSession.id];
      if (originalTransferSession) {
        delete originalTransferSession.__rc_transferSessionId;
      }
    }
    super._onCallEnd(session);
  }

  async _removeWebphone() {
    this.stopAudio();
    await super._removeWebphone();
  }

  override loadAudio() {
    if (this._webphone?.userAgent?.audioHelper) {
      patchAudioHelper(this._webphone.userAgent.audioHelper);
      this._webphone.userAgent.audioHelper.loadAudio({
        incoming: this.incomingAudio,
        outgoing: this.outgoingAudio,
      });
      this._webphone.userAgent.audioHelper.setDeviceId(
        this._deps.audioSettings.ringtoneDeviceId,
      );
    }
  }

  updateRecordStatus(sessionId, status) {
    const session = this.originalSessions[sessionId];
    if (!session) {
      return;
    }
    session.__rc_recordStatus = status;
    this._updateSessions();
  }

  override _isAvailableToConnect({ force }: { force: boolean }) {
    if (!this.enabled || !this._deps.auth.loggedIn) {
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
    return true;
  }

  override _onAccepted(webphoneSession) {
    super._onAccepted(webphoneSession);
    webphoneSession.on('SessionDescriptionHandler-created', () => {
      // @ts-ignore
      webphoneSession.sessionDescriptionHandler.on('userMedia', (stream) => {
        this._deps.noiseReduction.denoiser(webphoneSession.id, stream);
      });
    });
    webphoneSession.on('terminated', () => {
      this._deps.noiseReduction.reset(webphoneSession.id);
    });
  }

  @computed((that: WebphoneBase) => [
    that.ready,
    that._deps.audioSettings.supportDevices,
    that._deps.audioSettings.ringtoneDeviceId,
  ])
  get shouldSetRingtoneSinkId(): any[] {
    return [
      this.ready,
      this._deps.audioSettings.supportDevices,
      this._deps.audioSettings.ringtoneDeviceId,
    ];
  }
}
