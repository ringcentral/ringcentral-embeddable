import uuid from 'uuid';
import { ObjectMap } from '@ringcentral-integration/core/lib/ObjectMap';

import TransportBase from 'ringcentral-integration/lib/TransportBase';

export class MultipleTabsTransport extends TransportBase {
  constructor({ name, tabId, timeout = 5 * 1000, prefix, getMainTabId }) {
    super({ name, timeout, prefix });
    this._tabId = tabId;
    this._getMainTabId = getMainTabId;
    this._broadcastChannel = `${prefix ? `${prefix}-` : ''}${name}-broadcast`;
    this._requestChannel = `${prefix ? `${prefix}-` : ''}${name}-request`;
    this._responseChannel = `${prefix ? `${prefix}-` : ''}${name}-response`;
    this._requests = new Map();
    this._events = {
      ...ObjectMap.prefixKeys(
        ['request', 'response', 'push', 'timeout', 'broadcast'],
        `${prefix ? `${prefix}-` : ''}${name}`,
      ),
    };
    this._initStorageListener();
  }

  _initStorageListener() {
    window.addEventListener('storage', this._onStorageMessage);
  }

  dispose() {
    this._requests = new Map();;
    window.removeEventListener('storage', this._onStorageMessage);
  }

  _onStorageMessage = (e) => {
    if (!e.newValue) {
      return;
    }
    if (e.key === this._requestChannel) {
      const data = JSON.parse(e.newValue);
      if (data.tabId === this._tabId) {
        this.emit(this._events.request, data);
      }
      return;
    }
    if (e.key === this._responseChannel) {
      const data = JSON.parse(e.newValue);
      if (data.requestId && this._requests.has(data.requestId)) {
        if (data.error) {
          this._requests.get(data.requestId).reject(new Error(data.error));
        } else {
          this._requests.get(data.requestId).resolve(data.result);
        }
      }
      return;
    }
    if (e.key === this._broadcastChannel) {
      const data = JSON.parse(e.newValue);
      this.emit(this._events.broadcast, data);
    }
  }

  _safeStringify(data) {
    // remove Circular object
    const seen = new WeakSet();
    return JSON.stringify(
      data,
      (key, value) => {
        if (typeof value === "object" && value !== null) {
          if (seen.has(value)) {
            return;
          }
          seen.add(value);
        }
        return value;
      }
    );
  }

  request({ tabId, payload }) {
    const requestId = uuid.v4();
    let toTabId = tabId;
    if (!toTabId) {
      toTabId = this._getMainTabId();
    }
    let promise = new Promise((resolve, reject) => {
      this._requests.set(requestId, {
        resolve,
        reject,
      });
      localStorage.setItem(this._requestChannel, this._safeStringify({
        payload,
        tabId: toTabId,
        requestId,
      }));
      localStorage.removeItem(this._requestChannel);
    });
    let timeout = setTimeout(() => {
      timeout = null;
      this._requests.get(requestId).reject(new Error(this._events.timeout));
    }, this._timeout);
    promise = promise
      .then((result) => {
        if (timeout !== undefined && timeout !== null) clearTimeout(timeout);
        this._requests.delete(requestId);
        return Promise.resolve(result);
      })
      .catch((error) => {
        if (timeout !== undefined && timeout !== null) clearTimeout(timeout);
        this._requests.delete(requestId);
        return Promise.reject(error);
      });
    return promise;
  }

  response({ requestId, result, error }) {
    localStorage.setItem(this._responseChannel, this._safeStringify({
      requestId,
      result,
      error,
    }));
    localStorage.removeItem(this._responseChannel);
  }

  broadcast({ event, message }) {
    localStorage.setItem(this._broadcastChannel, this._safeStringify({
      event,
      message
    }));
    localStorage.removeItem(this._broadcastChannel);
  }

  get events() {
    return this._events;
  }
}
