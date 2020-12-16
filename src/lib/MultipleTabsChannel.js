import uuid from 'uuid';
import { EventEmitter } from 'events';

export class MultipleTabsChannel extends EventEmitter {
  constructor({ name, tabId }) {
    super();
    this._tabId = tabId;
    this._broadcastChannel = `${name}-broadcast`;
    this._requestChannel = `${name}-request`;
    this._responseChannel = `${name}-response`;
    this._waitPromises = {};
    this._initStorageListener();
  }

  _initStorageListener() {
    window.addEventListener('storage', this._onStorageMessage);
  }

  dispose() {
    this._waitPromises = {};
    window.removeEventListener('storage', this._onStorageMessage);
  }

  _onStorageMessage = (e) => {
    if (!e.newValue) {
      return;
    }
    if (e.key === this._broadcastChannel) {
      this.emit('broadcast', JSON.parse(e.newValue)); 
      return;
    }
    if (e.key === this._requestChannel) {
      const data = JSON.parse(e.newValue);
      if (data.tabId === this._tabId) {
        this.emit('request', data);
      }
      return;
    }
    if (e.key === this._responseChannel) {
      const data = JSON.parse(e.newValue);
      if (this._waitPromises[data.requestId]) {
        clearTimeout(this._waitPromises[data.requestId].timeout);
        this._waitPromises[data.requestId].resolve(data.message);
        delete this._waitPromises[data.requestId];
      }
    }
  }

  broadcast(channel, message) {
    localStorage.setItem(this._broadcastChannel, JSON.stringify({
      channel,
      message,
    }));
    localStorage.removeItem(this._broadcastChannel);
  }

  request(tabId, message) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject();
      }, 5000);
      const requestId = uuid.v4();
      this._waitPromises[requestId] = {
        timeout,
        resolve,
      };
      localStorage.setItem(this._requestChannel, JSON.stringify({
        message,
        tabId,
        requestId,
      }));
      localStorage.removeItem(this._requestChannel);
    });
  }

  response(requestId, message) {
    localStorage.setItem(this._responseChannel, JSON.stringify({
      message,
      requestId,
    }));
    localStorage.removeItem(this._responseChannel);
  }
}
