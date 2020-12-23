import uuid from 'uuid';
import { ObjectMap } from '@ringcentral-integration/core/lib/ObjectMap';

import TransportBase from 'ringcentral-integration/lib/TransportBase';

import './BroadcastChannel.polyfill';

export class MultipleTabsTransport extends TransportBase {
  constructor({ name, tabId, timeout = 5 * 1000, prefix, getMainTabId }) {
    super({ name, timeout, prefix });
    this._tabId = tabId;
    this._getMainTabId = getMainTabId;
    this._channel = new BroadcastChannel(`${prefix ? `${prefix}-` : ''}${name}`);
    this._requests = new Map();
    this._events = {
      ...ObjectMap.prefixKeys(
        ['request', 'response', 'push', 'timeout', 'broadcast'],
        `${prefix ? `${prefix}-` : ''}${name}`,
      ),
    };
    this._channel.addEventListener('message', this._onChannelMessage);
  }

  _onChannelMessage = ({ data: { type, data } }) => {
    if (type === this._events.request) {
      if (data.tabId === this._tabId) {
        const payload = JSON.parse(data.payload)
        this.emit(this._events.request, { requestId: data.requestId, payload });
      }
      return;
    }
    if (type === this._events.response) {
      const requestId = data && data.requestId;
      if (requestId && this._requests.has(requestId)) {
        const error = JSON.parse(data.error);
        if (error) {
          this._requests.get(requestId).reject(new Error(error));
        } else {
          this._requests.get(requestId).resolve(JSON.parse(data.result));
        }
      }
      return;
    }
    if (type === this._events.broadcast) {
      this.emit(this._events.broadcast, JSON.parse(data));
    }
  }

  dispose() {
    this._requests = new Map();;
    this._channel.removeEventListener('message', this._onChannelMessage);
    this._channel.close();
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
      this._channel.postMessage({
        type: this._events.request,
        data: {
          tabId: toTabId,
          payload: this._safeStringify(payload),
          requestId,
        },
      });
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
    this._channel.postMessage({
      type: this._events.response,
      data: {
        requestId,
        result: this._safeStringify(result),
        error: this._safeStringify(error),
      },
    });
  }

  broadcast(data) {
    this._channel.postMessage({
      type: this._events.broadcast,
      data: this._safeStringify(data),
    });
  }

  get events() {
    return this._events;
  }
}
