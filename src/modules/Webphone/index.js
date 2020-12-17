
import WebphoneBase from 'ringcentral-integration/modules/Webphone';
import { Module } from 'ringcentral-integration/lib/di';
import { ObjectMap } from '@ringcentral-integration/core/lib/ObjectMap';

import { MultipleTabsTransport } from '../../lib/MultipleTabsTransport';

import { multipleTabsProxify, PROXIFY_FUNCTIONS } from './multipleTabsProxify';

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
    prefix,
    globalStorage,
    ...options
  }) {
    super({
      prefix,
      ...options,
    });
    this._globalStorage = globalStorage;
    this._multipleTabsSupport = multipleTabsSupport;
    this._webphoneStateStorageKey = `${prefix}-webphone-state`;
    if (multipleTabsSupport) {
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
      });
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
          this._multipleTabsTransport.broadcast({ event, message: args });
        });
      });
    }
  }

  _onMultipleTabsChannelRequest = async (request) => {
    if (request.payload.type === 'execute') {
      if (request.payload.funcName === 'connect') {
        if (!this.connected && !this.connecting) {
          this.connect(...request.payload.args);
        }
        this._multipleTabsTransport.response({
          requestId: request.requestId,
          result: 'ok',
          error: null,
        });
      } else if (PROXIFY_FUNCTIONS.indexOf(request.payload.funcName) > -1) {
        let result, error;
        try {
          result = await this[request.payload.funcName](...request.payload.args);
          if (typeof result === 'object') {
            result = {}; // session object can't be stringified
          }
        } catch (e) {
          error = e.message;
        }
        this._multipleTabsTransport.response({ requestId: request.requestId, result, error });
      }
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
  async connect(options = {}) {
    const newOptions = { ...options };
    if (this._multipleTabsSupport) {
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
              type: 'execute',
              funcName: 'connect',
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
      if (
        this.activeWebphoneId &&
        this.activeWebphoneId !== this._tabManager.id
      ) {
        return;
      }
      if (this.isWebphoneActiveTab) {
        this._removeCurrentInstanceFromActiveWebphone({ clean: true });
      }
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
    }
  }

  _removeCurrentInstanceFromActiveWebphone({ clean = false } = {}) {
    if (this._multipleTabsSupport) {
      if (clean) {
        localStorage.removeItem(this._activeWebphoneKey);
        return;
      }
      if (this.isWebphoneActiveTab) {
        localStorage.setItem(this._activeWebphoneKey, '-1');
      }
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

  @multipleTabsProxify
  async makeCall(...args) {
    return super.makeCall(...args);
  }

  @multipleTabsProxify
  async answer(...args) {
    return super.answer(...args);
  }

  @multipleTabsProxify
  async reject(...args) {
    return super.reject(...args);
  }

  @multipleTabsProxify
  async resume(...args) {
    return super.resume(...args);
  }

  @multipleTabsProxify
  async forward(...args) {
    return super.forward(...args);
  }

  @multipleTabsProxify
  async mute(...args) {
    return super.mute(...args);
  }

  @multipleTabsProxify
  async unmute(...args) {
    return super.unmute(...args);
  }

  @multipleTabsProxify
  async hold(...args) {
    return super.hold(...args);
  }

  @multipleTabsProxify
  async unhold(...args) {
    return super.unhold(...args);
  }

  @multipleTabsProxify
  async startRecord(...args) {
    return super.startRecord(...args);
  }

  @multipleTabsProxify
  async stopRecord(...args) {
    return super.stopRecord(...args);
  }

  @multipleTabsProxify
  async park(...args) {
    return super.park(...args);
  }

  @multipleTabsProxify
  async transfer(...args) {
    return super.transfer(...args);
  }

  @multipleTabsProxify
  async transferWarm(...args) {
    return super.transferWarm(...args);
  }

  @multipleTabsProxify
  async flip(...args) {
    return super.flip(...args);
  }

  @multipleTabsProxify
  async sendDTMF(...args) {
    return super.sendDTMF(...args);
  }

  @multipleTabsProxify
  async hangup(...args) {
    return super.hangup(...args);
  }

  @multipleTabsProxify
  async toVoiceMail(...args) {
    return super.toVoiceMail(...args);
  }

  @multipleTabsProxify
  async replyWithMessage(...args) {
    return super.replyWithMessage(...args);
  }

  @multipleTabsProxify
  async switchCall(...args) {
    return super.switchCall(...args);
  }

  @multipleTabsProxify
  async updateSessionMatchedContact(...args) {
    return super.updateSessionMatchedContact(...args);
  }

  @multipleTabsProxify
  setSessionCaching(...args) {
    return super.updateSessionMatchedContact(...args);
  }

  @multipleTabsProxify
  async clearSessionCaching(...args) {
    return super.clearSessionCaching(...args);
  }

  @multipleTabsProxify
  async toggleMinimized(...args) {
    return super.toggleMinimized(...args);
  }

  get webphoneState() {
    if (!this._multipleTabsSupport) {
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

  get isWebphoneActiveTab() {
    return this.activeWebphoneId === this._tabManager.id;
  }
}
