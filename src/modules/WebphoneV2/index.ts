import { Module } from '@ringcentral-integration/commons/lib/di';
import { ObjectMap } from '@ringcentral-integration/core/lib/ObjectMap';
import type { ObjectMapValue } from '@ringcentral-integration/core/lib/ObjectMap';
import { Webphone as WebphoneCommon } from './WebphoneCommon';
import proxyActionTypes from '@ringcentral-integration/commons/lib/proxy/baseActionTypes';
import { watch, computed } from '@ringcentral-integration/core';
import { proxify } from '@ringcentral-integration/commons/lib/proxy/proxify';
import { MultipleTabsTransport } from '../../lib/MultipleTabsTransport';
import type { WebphoneSession } from './Webphone.interface';
import { sessionStatus } from '@ringcentral-integration/commons/modules/Webphone/sessionStatus';
import { voicemailDropStatus } from './voicemailDropStatus';
import { isRing, isDroppingVoicemail } from './webphoneHelper';
import { EVENTS } from './events';

@Module({
  name: 'NewWebphone',
  deps: [
    'NoiseReduction',
    'VoicemailDrop'
  ]
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
      if (event === EVENTS.callEnd) {
        // on call end, check and set active after 1.2s
        setTimeout(() => {
          this._setActive();
        }, 1200);
      }
    }
  }

  async _setActive() {
    await super._setActive();
    if (this._sharedSipClient) {
      if (this._sharedSipClient.active) {
        this._disableProxify();
      } else {
        this._enableProxify();
      }
    }
    this._emitActiveWebphoneChangedEvent();
  }

  override _onActiveTabIdChanged() {
    this._setActive();
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
    webphoneSession.on('mediaStreamSet', (stream) => {
      this._deps.noiseReduction.denoiser(webphoneSession.callId, stream);
    });
    webphoneSession.on('disposed', () => {
      this._deps.noiseReduction.reset(webphoneSession.callId);
    });
  }

  async _stopSessionAudio(webphoneSession) {
    await this._deps.noiseReduction.reset(webphoneSession.callId);
    // stop input and output audio stream
    const peerConnection = webphoneSession.rtcPeerConnection;
    if (peerConnection.removeTrack && peerConnection.getSenders) {
      peerConnection.getSenders().forEach((sender: any) => {
        if (sender.track) {
          sender.track.stop();
        }
      });
    } else {
      const localStream = peerConnection.getLocalStreams()[0];
      localStream.getTracks().forEach((track) => {
        track.stop();
      });
    }
    const receiver = peerConnection.getReceivers().find((r: any) => r.track.kind === 'audio');
    const outputTrack = receiver.track;
    const outputElement = webphoneSession.audioElement;
    // stop media string to the audio element
    if (outputElement && outputElement.srcObject) {
      // check if the outputTrack connected to the output element
      const outputStream = outputElement.srcObject;
      const outputTracks = outputStream.getTracks();
      if (outputTracks.some((t: any) => t.id === outputTrack.id)) {
        // stop playing the output track
        outputElement.srcObject = null;
      }
    }
  }

  onCallVoicemailDropped(handler) {
    if (typeof handler === 'function') {
      this._eventEmitter.on(EVENTS.callVoicemailDropped, handler);
    }
  }

  _onCallVoicemailDropped(webphoneSession) {
    const normalizedSession = this._getNormalizedSession(webphoneSession);
    this._eventEmitter.emit(EVENTS.callVoicemailDropped, normalizedSession, this.activeSession);
  }

  @proxify
  async dropVoicemailMessage(sessionId, messageId) {
    const webphoneSession = this.originalSessions[sessionId];
    if (!webphoneSession || webphoneSession.__rc_callStatus === sessionStatus.finished) {
      return false;
    }
    if (
      webphoneSession.__rc_voicemailDropStatus ||
      webphoneSession.__rc_localHold ||
      !webphoneSession.rtcPeerConnection
    ) {
      return false;
    }
    try {
      const { audioBuffer, audioContext } = await this._deps.voicemailDrop.prepareVoicemailDrop(webphoneSession, messageId);
      await this._stopSessionAudio(webphoneSession);
      webphoneSession.__rc_voicemailDropStatus = voicemailDropStatus.waitingForGreetingEnd;
      webphoneSession.__rc_localHold = true; // prevent the call be held when user start another call
      this._updateSessions();
      this._onCallVoicemailDropped(webphoneSession);
      // run in background
      this._deps.voicemailDrop.dropVoicemailMessage({
        webphoneSession,
        audioBuffer,
        audioContext,
        endCall: () => {
          return this.hangup(webphoneSession.callId);
        },
        updateStatus: (status) => {
          webphoneSession.__rc_voicemailDropStatus = status;
          this._updateSessions();
          this._onCallVoicemailDropped(webphoneSession);
        },
      });
      return true;
    } catch (e) {
      console.error(e);
      this._deps.alert.alert({
        level: 'danger',
        message: 'showCustomAlertMessage',
        payload: {
          alertMessage: e.message || 'Failed to send voicemail message',
        },
      });
      return false;
    }
  }

  override _getActiveSessions() {
    return this.sessions.filter((x) => (!isRing(x) && !isDroppingVoicemail(x.voicemailDropStatus)));
  }
}