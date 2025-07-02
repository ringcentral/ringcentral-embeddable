import { Module } from '@ringcentral-integration/commons/lib/di';
import { ObjectMap } from '@ringcentral-integration/core/lib/ObjectMap';
import type { ObjectMapValue } from '@ringcentral-integration/core/lib/ObjectMap';
import { Webphone as WebphoneCommon } from './WebphoneCommon';
import proxyActionTypes from '@ringcentral-integration/commons/lib/proxy/baseActionTypes';
import { watch, computed } from '@ringcentral-integration/core';
import { MultipleTabsTransport } from '../../lib/MultipleTabsTransport';
import type { WebphoneSession } from './Webphone.interface';
import { EVENTS } from './events';

@Module({
  name: 'NewWebphone',
  deps: ['NoiseReduction']
})
export class Webphone extends WebphoneCommon {
  protected _multipleTabsTransport: MultipleTabsTransport;
  protected _proxyActionTypes: ObjectMapValue<typeof proxyActionTypes>;

  constructor(deps) {
    super(deps);
    this._ignoreModuleReadiness(deps.noiseReduction);
    this._enableSharedState = true;
    this._proxyActionTypes = proxyActionTypes;
    this._multipleTabsTransport = new MultipleTabsTransport({
      name: 'webphone-channel-v2',
      tabId: this._deps.tabManager.tabbie.id,
      timeout: 10 * 1000,
      prefix: this._deps.prefix,
      getMainTabId: () => this._sharedSipClient?.activeTabId,
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
      if (event === EVENTS.activeWebphoneChanged) {
        return;
      }
      this._eventEmitter.on(event, (...args) => {
        if (this.isWebphoneActiveTab && this._sharedSipClient) {
          this._multipleTabsTransport.broadcast({ event, message: args });
        }
      });
    });
  }

  override onInitOnce() {
    super.onInitOnce();
    watch(
      this,
      () => this.shouldSetRingtoneSinkId,
      () => {
        if (
          this.ready &&
          this._ringtoneHelper
        ) {
          this._ringtoneHelper.setDeviceId(this._deps.audioSettings.ringtoneDeviceId);
        }
      },
    );
  }

  _enableProxify() {
    this._transport = this._multipleTabsTransport;
  }

  _disableProxify() {
    this._transport = null;
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
    let result, error;
      try {
        result = await this[funcName](...args);
      } catch (e) {
        error = e.message;
      }
      this._multipleTabsTransport.response({ requestId: requestId, result, error });
  }

  _onMultipleTabsChannelBroadcast = ({ event, message }) => {
    if (EVENTS[event]) {
      this._eventEmitter.emit(EVENTS[event], ...message);
    }
  }

  async _setActive() {
    await super._setActive();
    if (this._sharedSipClient?.active) {
      this._disableProxify();
    }
    this._emitActiveWebphoneChangedEvent();
  }

  override _onActiveTabIdChanged(activeTabId: string) {
    if (this._sharedSipClient?.active) {
      this._disableProxify();
    } else {
      this._enableProxify();
    }
    this._emitActiveWebphoneChangedEvent();
  }

  _emitActiveWebphoneChangedEvent() {
    this._eventEmitter.emit(
      EVENTS.activeWebphoneChanged,
      {
        activeId: this._sharedSipClient?.activeTabId,
        currentActive: this.isWebphoneActiveTab,
      },
    );
  }

  updateRecordStatus(sessionId, status) {
    const session = this.originalSessions[sessionId];
    if (!session) {
      return;
    }
    session.__rc_recordStatus = status;
    this._updateSessions();
  }

  onActiveWebphoneChanged(handler) {
    if (typeof handler === 'function') {
      this._eventEmitter.on(EVENTS.activeWebphoneChanged, handler);
    }
  }

  get multipleTabsTransport() {
    return this._multipleTabsTransport;
  }

  get proxifyTransport() {
    return this._transport;
  }

  @computed((that: Webphone) => [
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

  override _bindSessionEvents(webphoneSession: WebphoneSession) {
    super._bindSessionEvents(webphoneSession);
    webphoneSession.on('userMedia', (stream) => {
      this._deps.noiseReduction.denoiser(webphoneSession.id, stream);
    });
    webphoneSession.on('disposed', () => {
      this._deps.noiseReduction.reset(webphoneSession.id);
    });
  }
}