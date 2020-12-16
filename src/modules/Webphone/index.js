
import WebphoneBase from 'ringcentral-integration/modules/Webphone';
import { Module } from 'ringcentral-integration/lib/di';

import { MultipleTabsChannel } from '../../lib/MultipleTabsChannel';

import {
  getWebphoneStateReducer,
  getModuleStateReducer,
} from './getReducer';

@Module({
  name: 'Webphone',
  deps: [
    'GlobalStorage',
    { dep: 'WebphoneOptions', optional: true },
  ]
})
export default class Webphone extends WebphoneBase {
  constructor({
    onlyAWebphone = false,
    prefix,
    globalStorage,
    ...options
  }) {
    super({
      prefix,
      ...options,
    });
    this._globalStorage = globalStorage;
    this._onlyAWebphone = onlyAWebphone;
    this._webphoneStateStorageKey = `${prefix}-webphone-state`;
    if (onlyAWebphone) {
      this._reducer = getModuleStateReducer(this.actionTypes);
      this._globalStorage.registerReducer({
        key: this._webphoneStateStorageKey,
        reducer: getWebphoneStateReducer(this.actionTypes),
      });
      this._multipleTabsChannel = new MultipleTabsChannel({
        name: `${prefix}-webphone-channel`,
        tabId: this._tabManager.id
      });
      this._multipleTabsChannel.on('request', this._onMultipleTabsChannelRequest);
    }
  }

  _onMultipleTabsChannelRequest = (request) => {
    if (request.message.type === 'connect') {
      console.log(request);
      if (!this.connected && !this.connecting) {
        this.connect(request.message.options);
      }
      this._multipleTabsChannel.response(request.requestId, { result: 'ok' });
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
        if (this._onlyAWebphone) {
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
    if ((!this._onlyAWebphone && !this._disconnectOnInactive) || !this._tabManager) {
      return;
    }
    window.addEventListener('storage', (e) => {
      // disconnect to inactive when other tabs' web phone connected
      if (e.key === this._activeWebphoneKey) {
        if (e.newValue === this._tabManager.id) {
          return;
        }
        if (this._onlyAWebphone) {
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

  _onActiveWebphoneIdChanged(newId) {
    if (newId === '-1') {
      // connect web phone when active web phone tab is removed and current tab is active
      if (this._tabManager.isFirstTab) {
        this.connect({
          skipDLCheck: true,
          force: true,
          skipTabActiveCheck: true,
        });
      }
      return;
    }
    // clear connectTimeout if current tab is trying to connect
    if (this._connectTimeout) {
      clearTimeout(this._connectTimeout);
    }
    if (this._webphone) {
      this._removeWebphone();
    }
  }

  // override
  async connect(options) {
    console.log('===============  options');
    console.log(options);
    const newOptions = { ...options };
    if (this._onlyAWebphone) {
      // don't connect if there is connection in other tabs
      newOptions.skipTabActiveCheck = true;
      if (
        this.activeWebphoneId &&
        this.activeWebphoneId !== '-1' &&
        this.activeWebphoneId !== this._tabManager.id
      ) {
        try {
          await this._multipleTabsChannel.request(this.activeWebphoneId, {
            type: 'connect',
            options,
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
    return super.connect(options);
  }

  // override
  async _disconnect() {
    if (this._onlyAWebphone) {
      if (
        this.activeWebphoneId &&
        this.activeWebphoneId !== this._tabManager.id
      ) {
        return;
      }
      if (this.activeWebphoneId === this._tabManager.id) {
        this._removeCurrentInstanceFromActiveWebphone({ clean: true });
      }
    }
    return super._disconnect();
  }

  // override
  _setCurrentInstanceAsActiveWebphone() {
    if (!this._onlyAWebphone) {
      super._setCurrentInstanceAsActiveWebphone();
      return;
    }
    if (this._tabManager) {
      localStorage.setItem(this._activeWebphoneKey, this._tabManager.id);
    }
  }

  _removeCurrentInstanceFromActiveWebphone({ clean = false } = {}) {
    if (this._onlyAWebphone) {
      if (clean) {
        localStorage.removeItem(this._activeWebphoneKey);
        return;
      }
      if (this.activeWebphoneId === this._tabManager.id) {
        localStorage.setItem(this._activeWebphoneKey, '-1');
      }
      return;
    }
    super._removeCurrentInstanceFromActiveWebphone();
  }

  // override
  _makeWebphoneInactiveOnSessionsEmpty() {
    if (!this._onlyAWebphone) {
      super._makeWebphoneInactiveOnSessionsEmpty();
      return;
    }
    this._disconnectInactiveAfterSessionEnd = false;
  }

  // override
  _onTabActive() {
    if (!this._onlyAWebphone) {
      super._onTabActive();
      return;
    }
  }

  _onWebphoneUnregistered() {
    if (!this._onlyAWebphone) {
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
    this.store.dispatch({
      type: this.actionTypes.connectError,
    });
    this._eventEmitter.emit(EVENTS.webphoneUnregistered);
  }

  get webphoneState() {
    if (!this._onlyAWebphone) {
      return this.state;
    }
    return this._globalStorage.getItem(this._webphoneStateStorageKey);
  }

  get ringSessionId() {
    return this.webphoneState.ringSessionId;
  }

  get activeSessionId() {
    return this.webphoneState.activeSessionId;
  }

  get sessions() {
    return this.webphoneState.sessions;
  }

  get lastEndedSessions() {
    return this.webphoneState.lastEndedSessions;
  }

  get connectionStatus() {
    return this.webphoneState.connectionStatus;
  }

  get connectRetryCounts() {
    return this.webphoneState.connectRetryCounts;
  }

  get errorCode() {
    return this.webphoneState.errorCode;
  }

  get statusCode() {
    return this.webphoneState.statusCode;
  }

  get device() {
    return this.webphoneState.device;
  }

  get activeWebphoneId() {
    return localStorage.getItem(this._activeWebphoneKey);
  }
}
