import uuid from 'uuid';

export default class PopupWindowManager {
  constructor({ prefix, isPopupWindow }) {
    this._requests = new Map();
    this._isPopupWindow = isPopupWindow;
    this._channel = new BroadcastChannel(`${prefix}-popup-win-manager`);
    this._channel.addEventListener('message', this._onChannelMessage);
  }

  _onChannelMessage = ({ data: { type } }) => {
    if (type === 'ping' && this._isPopupWindow) {
      this._channel.postMessage({
        type: 'pong',
      });
    }
    if (type === 'pong' && this._requests.size > 0) {
      this._requests.forEach((request) => {
        request.resolve(true);
      });
    }
  }

  async checkPopupWindowOpened() {
    const requestId = uuid.v4();
    let promise = new Promise((resolve, reject) => {
      this._requests.set(requestId, {
        resolve,
        reject,
      });
      this._channel.postMessage({
        type: 'ping',
      });
    });
    let timeout = setTimeout(() => {
      timeout = null;
      this._requests.get(requestId).reject(new Error('Timeout'));
    }, 800);
    promise = promise
      .then((result) => {
        if (timeout !== undefined && timeout !== null) clearTimeout(timeout);
        this._requests.delete(requestId);
        return Promise.resolve(result);
      })
      .catch(() => {
        if (timeout !== undefined && timeout !== null) clearTimeout(timeout);
        this._requests.delete(requestId);
        return Promise.resolve(false);
      });
    return promise;
  }
}
