import { Module } from 'ringcentral-integration/lib/di';
import proxyActionTypes from 'ringcentral-integration/lib/proxy/baseActionTypes';

import ConferenceCallBase from 'ringcentral-integration/modules/ConferenceCall';
import getConferenceCallReducer from 'ringcentral-integration/modules/ConferenceCall/getConferenceCallReducer';

@Module({
  name: 'ConferenceCall',
  deps: [
    'GlobalStorage',
    'TabManager',
    { dep: 'ConferenceCallOptions', optional: true },
  ],
})
export default class ConferenceCall extends ConferenceCallBase {
  constructor({
    globalStorage,
    tabManager,
    multipleTabsSupport,
    prefix,
    ...options
  }) {
    super({
      prefix,
      ...options,
    });
    this._multipleTabsSupport = multipleTabsSupport;
    this._conferenceCallStorageKey = `${prefix}-conference-call-state`
    if (this._multipleTabsSupport) {
      this._globalStorage = globalStorage;
      this._tabManager = tabManager;
      this._proxyActionTypes = proxyActionTypes;
      this._reducer = null;
      this._globalStorage.registerReducer({
        key: this._conferenceCallStorageKey,
        reducer: getConferenceCallReducer(this.actionTypes),
      });
      this._multipleTabsTransport = this._webphone.multipleTabsTransport;
      this._multipleTabsTransport.on(
        this._multipleTabsTransport.events.broadcast,
        this._onMultipleTabsChannelBroadcast
      );
      this._multipleTabsTransport.on(
        this._multipleTabsTransport.events.request,
        this._onMultipleTabsChannelRequest,
      );
      this._eventEmitter.on(this.actionTypes.mergeSucceeded, (...args) => {
        if (this._webphone.isWebphoneActiveTab) {
          this._multipleTabsTransport.broadcast({
            event: this.actionTypes.mergeSucceeded,
            message: args,
          });
        }
      });
    }
  }

  _onMultipleTabsChannelBroadcast = ({ event, message }) => {
    if (event === this.actionTypes.mergeSucceeded && this._tabManager.active) {
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

  get _transport() {
    if (!this._multipleTabsSupport) {
      return null;
    }
    return this._webphone.proxifyTransport;
  }

  get state() {
    if (!this._multipleTabsSupport) {
      return super.state;
    }
    return this._globalStorage.getItem(this._conferenceCallStorageKey);
  }
}
