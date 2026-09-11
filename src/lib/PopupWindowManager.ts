function createRequestId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default class PopupWindowManager {
  private _requests = new Map<
    string,
    {
      resolve: (value: boolean) => void;
      reject: (error: Error) => void;
    }
  >();

  private _channel: BroadcastChannel | null = null;

  constructor({
    prefix,
    isPopupWindow,
  }: {
    prefix: string;
    isPopupWindow: boolean;
  }) {
    this._isPopupWindow = isPopupWindow;
    if (typeof BroadcastChannel !== 'undefined') {
      this._channel = new BroadcastChannel(`${prefix}-popup-win-manager`);
      this._channel.addEventListener('message', this._onChannelMessage);
    }
  }

  private _isPopupWindow = false;

  private _onChannelMessage = ({
    data,
  }: MessageEvent<{ type?: string }>) => {
    const type = data?.type;
    if (type === 'ping' && this._isPopupWindow) {
      this._channel?.postMessage({
        type: 'pong',
      });
      return;
    }

    if (type === 'pong' && this._requests.size > 0) {
      this._requests.forEach((request) => {
        request.resolve(true);
      });
    }
  };

  async checkPopupWindowOpened() {
    if (!this._channel) {
      return false;
    }

    const requestId = createRequestId();
    let promise = new Promise<boolean>((resolve, reject) => {
      this._requests.set(requestId, {
        resolve,
        reject,
      });
      this._channel?.postMessage({
        type: 'ping',
      });
    });

    let timeout: number | null = window.setTimeout(() => {
      timeout = null;
      this._requests.get(requestId)?.reject(new Error('Timeout'));
    }, 800);

    promise = promise
      .then((result) => {
        if (timeout !== null) {
          window.clearTimeout(timeout);
        }
        this._requests.delete(requestId);
        return result;
      })
      .catch(() => {
        if (timeout !== null) {
          window.clearTimeout(timeout);
        }
        this._requests.delete(requestId);
        return false;
      });

    return promise;
  }
}
