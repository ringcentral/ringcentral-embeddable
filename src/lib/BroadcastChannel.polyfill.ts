import { EventEmitter } from 'events';

let environment;
if (typeof window !== 'undefined') {
  environment = window;
}
if (typeof global !== 'undefined') {
  environment = global.window || global;
}

export class BroadcastChannelWithStorage extends EventEmitter {
  private _name: string;
  public onmessage?: ({ data } : { data: any }) => void;
  public onmessageerror?: (e: Error) => void;

  constructor(name: string) {
    super();
    this._name = name;
    this._initStorageListener();
  }

  _initStorageListener() {
    environment.addEventListener('storage', this._onStorageMessage);
  }

  _onStorageMessage = (e) => {
    if (!e.newValue) {
      return;
    }
    if (e.key === this._name) {
      try {
        const data = JSON.parse(e.newValue);
        this.emit('message', { data });
        if (typeof this.onmessage === 'function') {
          this.onmessage({ data });
        }
      } catch (e) {
        this.emit('messageerror', e);
        if (typeof this.onmessageerror === 'function') {
          this.onmessageerror(e);
        }
      }
    }
  }

  postMessage(message: any) {
    localStorage.setItem(this._name, JSON.stringify(message));
    localStorage.removeItem(this._name);
  }
  
  close() {
    environment.removeEventListener('storage', this._onStorageMessage);
  }

  addEventListener(event: 'message' | 'messageerror', listener: ({ data }: { data: any}) => void) {
    this.on(event, listener);
  }

  removeEventListener(event: 'message' | 'messageerror', listener: ({ data }: { data: any}) => void) {
    this.off(event, listener);
  }

  get name() {
    return this._name;
  }
}

if (environment && !environment.BroadcastChannel) {
  environment.BroadcastChannel = BroadcastChannelWithStorage;
}
