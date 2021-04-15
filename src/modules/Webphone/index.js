
import WebphoneBase from 'ringcentral-integration/modules/Webphone';
import { Module } from 'ringcentral-integration/lib/di';
import proxify from 'ringcentral-integration/lib/proxy/proxify';
import sleep from 'ringcentral-integration/lib/sleep';
import moduleStatuses from 'ringcentral-integration/enums/moduleStatuses';
import { ObjectMap } from '@ringcentral-integration/core/lib/ObjectMap';
import proxyActionTypes from 'ringcentral-integration/lib/proxy/baseActionTypes';

import { MultipleTabsTransport } from '../../lib/MultipleTabsTransport';

import {
  getWebphoneStateReducer,
  getModuleStateReducer,
} from './getReducer';

const EVENTS = ObjectMap.fromKeys([
  'callRing',
  'callStart',
  'callEnd',
  'callHold',
  'callResume',
  'beforeCallResume',
  'beforeCallEnd',
  'callInit',
  'activeWebphoneChanged',
]);

@Module({
  name: 'Webphone',
  deps: [
    'GlobalStorage',
    { dep: 'WebphoneOptions', optional: true },
  ]
})
export default class Webphone extends WebphoneBase {
  constructor({
    multipleTabsSupport = false,
    forceCurrentWebphoneActive = false,
    prefix,
    globalStorage,
    ...options
  }) {
    super({
      prefix,
      ...options,
    });
    this._multipleTabsSupport = multipleTabsSupport;
    this._forceCurrentWebphoneActive = forceCurrentWebphoneActive;
    this._webphoneStateStorageKey = `${prefix}-webphone-state`;
    if (this._multipleTabsSupport) {
      this._globalStorage = globalStorage;
      this._proxyActionTypes = proxyActionTypes;
      this._reducer = getModuleStateReducer(this.actionTypes);
      this._globalStorage.registerReducer({
        key: this._webphoneStateStorageKey,
        reducer: getWebphoneStateReducer(this.actionTypes),
      });
      this._multipleTabsTransport = new MultipleTabsTransport({
        name: 'webphone-channel',
        tabId: this._tabManager.id,
        timeout: 10 * 1000,
        prefix,
        getMainTabId: () => this.activeWebphoneId,
      });
      if (
        !this._forceCurrentWebphoneActive &&
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
    if (EVENTS[event] && this._tabManager.active) {
      this._eventEmitter.emit(EVENTS[event], ...message);
    }
  }

  // override initialize to instead unload with beforeunload
  initialize() {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      if (document.readyState === 'loading') {
        window.addEventListener('load', () => {
          this._prepareVideoElement();
        });
      } else {
        this._prepareVideoElement();
      }
      window.addEventListener('beforeunload', () => {
        if (this._webphone) {
          // set timeout to reconnect web phone is before unload cancel
          setTimeout(() => {
            this.connect({
              force: true,
              skipConnectDelay: true,
              skipDLCheck: true,
            });
          }, 3000);
        }
        if (this._multipleTabsSupport) {
          this._cleanWebphoneInstanceWhenUnload();
        } else {
          this._disconnect();
        }
      });
      window.addEventListener('unload', () => {
        this._removeCurrentInstanceFromActiveWebphone();
      });
    }
    this.store.subscribe(() => this._onStateChange());
    this._auth.addBeforeLogoutHandler(async () => {
      await this._disconnect();
    });
    this._createOtherWebphoneInstanceListener();
  }

  _cleanWebphoneInstanceWhenUnload() {
    if (!this._webphone) {
      return;
    }
    this.store.dispatch({ type: this.actionTypes.disconnect });
    this.store.dispatch({ type: this.actionTypes.destroySessions });
    this.store.dispatch({ type: this.actionTypes.unregistered });
    this._removeWebphone();
  }

  _createOtherWebphoneInstanceListener() {
    if ((!this._multipleTabsSupport && !this._disconnectOnInactive) || !this._tabManager) {
      return;
    }
    window.addEventListener('storage', (e) => {
      // disconnect to inactive when other tabs' web phone connected
      if (e.key === this._activeWebphoneKey) {
        if (e.newValue === this._tabManager.id) {
          return;
        }
        if (this._multipleTabsSupport) {
          this._onActiveWebphoneIdChanged(e.newValue);
          return;
        }
        if (!this.connected || !document.hidden) {
          return;
        }
        if (this.sessions.length === 0) {
          this._disconnectToInactive();
          return;
        }
        this._disconnectInactiveAfterSessionEnd = true;
      }
      // unhold active calls in current tab
      if (e.key === this._activeWebphoneActiveCallKey) {
        this._holdOtherSession(e.newValue);
      }
    });
  }

  async _onActiveWebphoneIdChanged(newId) {
    if (newId === '-1') {
      await sleep(200); // wait 200ms for tabManager get right first tab
      // connect web phone when active web phone tab is removed and current tab is active
      if (this._tabManager.isFirstTab) {
        await this.connect({
          skipDLCheck: true,
          force: true,
          skipTabActiveCheck: true,
        });
      }
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

  // override
  async connect(options = {}) {
    const newOptions = { ...options };
    if (this._multipleTabsSupport) {
      // Force set current tab as active web phone tab
      if (
        this._forceCurrentWebphoneActive &&
        this.activeWebphoneId !== this._tabManager.id
      ) {
        this.store.dispatch({
          type: this.actionTypes.unregistered,
        });
        this._setCurrentInstanceAsActiveWebphone();
      }
      // don't connect if there is connection in other tabs
      newOptions.skipTabActiveCheck = true;
      if (
        this.activeWebphoneId &&
        this.activeWebphoneId !== '-1' &&
        this.activeWebphoneId !== this._tabManager.id
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
          if (!this._tabManager.isFirstTab) {
            return;
          }
          this.store.dispatch({
            type: this.actionTypes.unregistered,
          });
          this._setCurrentInstanceAsActiveWebphone();
        }
      }
      if (!this.activeWebphoneId || this.activeWebphoneId === '-1') {
        if (!this._tabManager.isFirstTab) {
          return;
        }
        this._setCurrentInstanceAsActiveWebphone();
      }
    }
    return super.connect(newOptions);
  }

  // override
  async _disconnect() {
    if (this._multipleTabsSupport) {
      if (!this.isWebphoneActiveTab) {
        return;
      }
      this._removeCurrentInstanceFromActiveWebphone({ clean: true });
    }
    return super._disconnect();
  }

  // override
  _setCurrentInstanceAsActiveWebphone() {
    if (!this._multipleTabsSupport) {
      super._setCurrentInstanceAsActiveWebphone();
      return;
    }
    if (this._tabManager) {
      localStorage.setItem(this._activeWebphoneKey, this._tabManager.id);
      this._disableProxify();
      this._emitActiveWebphoneChangedEvent();
    }
  }

  _removeCurrentInstanceFromActiveWebphone({ clean = false } = {}) {
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
      this._enableProxify();
      this._emitActiveWebphoneChangedEvent();
      return;
    }
    super._removeCurrentInstanceFromActiveWebphone();
  }

  // override
  _makeWebphoneInactiveOnSessionsEmpty() {
    if (!this._multipleTabsSupport) {
      super._makeWebphoneInactiveOnSessionsEmpty();
      return;
    }
    this._disconnectInactiveAfterSessionEnd = false;
  }

  // override
  _onTabActive() {
    if (!this._multipleTabsSupport) {
      super._onTabActive();
      return;
    }
  }

  _onWebphoneUnregistered() {
    if (!this._multipleTabsSupport) {
      this._removeCurrentInstanceFromActiveWebphone();
    }
    super._onWebphoneUnregistered();
  }

  onActiveWebphoneChanged(handler) {
    if (typeof handler === 'function') {
      this._eventEmitter.on(EVENTS.activeWebphoneChanged, handler);
    }
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

  get state() {
    if (!this._multipleTabsSupport) {
      return super.state;
    }
    return this._globalStorage.getItem(this._webphoneStateStorageKey);
  }

  get status() {
    return super.state.status;
  }

  get ready() {
    return super.state.status === moduleStatuses.ready;
  }

  get pending() {
    return super.state.status === moduleStatuses.pending;
  }

  get videoElementPrepared() {
    return super.state.videoElementPrepared;
  }

  get activeWebphoneId() {
    return localStorage.getItem(this._activeWebphoneKey);
  }

  get isWebphoneActiveTab() {
    return this.activeWebphoneId === this._tabManager.id;
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

  // TODO: fix 603 reconnect issue in widgets lib
  async _onConnectError(options) {
    if (options.statusCode === 603) {
      try {
        await this._auth.changeEndpointId();
      } catch (e) {
        // ignore
      }
    }
    await super._onConnectError(options);
  }
}
