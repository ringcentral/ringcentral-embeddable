import { Module } from '@ringcentral-integration/commons/lib/di';
import proxyActionTypes from '@ringcentral-integration/commons/lib/proxy/baseActionTypes';
import { action, watch } from '@ringcentral-integration/core';
import { ConferenceCall as ConferenceCallBase } from '@ringcentral-integration/commons/modules/ConferenceCall';
import { mergeEvents } from '@ringcentral-integration/commons/modules/ConferenceCall/lib';
import { MultipleTabsTransport } from '../../lib/MultipleTabsTransport';

const CONFERENCE_STATE_SYNC_KEY = 'conference-state-sync';

@Module({
  name: 'ConferenceCall',
  deps: [
    'TabManager',
  ],
})
export class ConferenceCall extends ConferenceCallBase {
  protected _multipleTabsSupport?: boolean;
  protected _multipleTabsTransport: MultipleTabsTransport;

  constructor(deps) {
    super(deps);
    this._multipleTabsSupport = deps.conferenceCallOptions.multipleTabsSupport;
    if (this._multipleTabsSupport && deps.webphone.multipleTabsSupport) {
      this._proxyActionTypes = proxyActionTypes;
      this._multipleTabsTransport = deps.webphone.multipleTabsTransport;
      this._multipleTabsTransport.on(
        this._multipleTabsTransport.events.broadcast,
        this._onMultipleTabsChannelBroadcast
      );
      this._multipleTabsTransport.on(
        this._multipleTabsTransport.events.request,
        this._onMultipleTabsChannelRequest,
      );
      this._eventEmitter.on(mergeEvents.mergeSucceeded, (...args) => {
        if (this._deps.webphone.isWebphoneActiveTab) {
          this._multipleTabsTransport.broadcast({
            event: mergeEvents.mergeSucceeded,
            message: args,
          });
        }
      });
      this._transport = this._deps.webphone.proxifyTransport;
      this._deps.webphone.onActiveWebphoneChanged(() => {
        this._transport = this._deps.webphone.proxifyTransport;
      });
    }
  }

  onInitOnce() {
    if (this._multipleTabsSupport) {
      this._syncStateFromStorage();
      this._initMultipleTabsStateSyncing();
      watch(
        this,
        () => [
          this.conferences,
          this.conferenceCallStatus,
          this.mergingPair,
          this.currentConferenceId,
          this.isMerging,
        ],
        () => {
          if (!this._deps.webphone.isWebphoneActiveTab) {
            return;
          }
          this._syncStateToStorage();
        },
        {
          multiple: true,
        },
      );
    }
  }

  _initMultipleTabsStateSyncing() {
    window.addEventListener('storage', (e) => {
      if (e.key === CONFERENCE_STATE_SYNC_KEY) {
        this._syncStateFromStorage();
      }
    });
  }

  _syncStateToStorage() {
    localStorage.setItem(
      CONFERENCE_STATE_SYNC_KEY,
      JSON.stringify({
        conferences: this.conferences,
        conferenceCallStatus: this.conferenceCallStatus,
        mergingPair: this.mergingPair,
        currentConferenceId: this.currentConferenceId,
        isMerging: this.isMerging,
      }),
    );
  }

  @action
  _syncStateFromStorage() {
    const rawData = localStorage.getItem(CONFERENCE_STATE_SYNC_KEY);
    if (!rawData) {
      return;
    }
    const data = JSON.parse(rawData);
    this.conferences = data.conferences;
    this.conferenceCallStatus = data.conferenceCallStatus;
    this.mergingPair = data.mergingPair;
    this.currentConferenceId = data.currentConferenceId;
    this.isMerging = data.isMerging;
  }

  _onMultipleTabsChannelBroadcast = ({ event, message }) => {
    if (event === mergeEvents.mergeSucceeded) {
      this._eventEmitter.emit(event, ...message);
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
    let result, error;
    try {
      result = await this[funcName](...args);
    } catch (e) {
      console.error(e);
      error = e.message;
    }
    this._multipleTabsTransport.response({ requestId: requestId, result, error });
  }

  _shouldReset() {
    return super._shouldReset() && this._deps.webphone.disconnected;
  }
}
