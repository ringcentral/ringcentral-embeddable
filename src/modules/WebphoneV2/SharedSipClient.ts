import EventEmitter from "ringcentral-web-phone/event-emitter";
import InboundMessage from "ringcentral-web-phone/sip-message/inbound";
import OutboundMessage from "ringcentral-web-phone/sip-message/outbound/index";
import RequestMessage from "ringcentral-web-phone/sip-message/outbound/request";
import ResponseMessage from "ringcentral-web-phone/sip-message/outbound/response";
import type { SipClient, SipClientOptions, SipInfo } from "ringcentral-web-phone/types";
import { uuid } from "ringcentral-web-phone/utils";
import { Logger } from "./logger";

export class SharedSipClient extends EventEmitter implements SipClient {
  public disposed = false;
  public worker: SharedWorker;
  public instanceId: string;
  public sipInfo: SipInfo;
  public device: { id: string };
  private debug: boolean;
  private messageListener: (event: MessageEvent) => void;
  public sharedState: Record<string, any> = {};
  public tabId: string;
  public activeTabId: string;
  public clientId: string;
  private _logger: Logger;

  public constructor({
    worker,
    tabId,
    clientId,
    logger,
  }: {
    worker: SharedWorker;
    tabId: string;
    clientId: string;
    logger: Logger;
  }) {
    super();
    this.worker = worker;
    this.tabId = tabId;
    this.clientId = clientId;
    this._logger = logger;
    this.messageListener = (event) => {
      if (event.data.type === 'inboundMessage') {
        if (this.debug) {
          this._logger.debug('inboundMessage', event.data.message);
        }
        this.emit('inboundMessage', InboundMessage.fromString(event.data.message));
      } else if (event.data.type === 'outboundMessage') {
        if (this.debug) {
          this._logger.debug('outboundMessage', event.data.message);
        }
        this.emit('outboundMessage', OutboundMessage.fromString(event.data.message));
      } else if (event.data.type === 'status') {
        if (this.debug) {
          this._logger.debug('status', event.data.status);
        }
        this.emit('status', event.data.status);
      } else if (event.data.type === 'transportStatus') {
        if (this.debug) {
          this._logger.debug('transportStatus', event.data.status);
        }
        this.emit('transportStatus', event.data.status);
      } else if (event.data.type === 'setSharedState') {
        Object.keys(event.data.state).forEach((key) => {
          this.sharedState[key] = event.data.state[key];
        });
        this.emit('sharedStateChanged', this.sharedState);
      } else if (event.data.type === 'setActive') {
        this.activeTabId = event.data.activeTabId;
        this.emit('activeTabIdChanged', this.activeTabId);
      }
    }
    this.worker.port.addEventListener('message', this.messageListener);
    this.worker.port.start();
  }

  public async syncSharedState() {
    const response = await this.workerRequest({ type: 'getSharedState' });
    this.sharedState = response;
    return this.sharedState;
  }

  public setSharedState(state: Record<string, any>) {
    Object.keys(state).forEach((key) => {
      this.sharedState[key] = state[key];
    });
    this.worker.port.postMessage({
      type: 'setSharedState',
      state,
    });
  }

  workerRequest(message: any) {
    return new Promise((resolve, reject) => {
      const requestId = uuid();
      let timeoutHandle: NodeJS.Timeout;
      this.worker.port.postMessage({
        type: 'workerRequest',
        request: message,
        requestId,
      });
      timeoutHandle = setTimeout(() => {
        this.worker.port.removeEventListener('message', messageListener);
        reject(new Error('Timeout'));
      }, 8000);
      const messageListener = (event) => {
        if (
          !event.data ||
          event.data.type !== 'workerResponse' ||
          event.data.requestId !== requestId
        ) {
          return;
        }
        if (this.debug) {
          this._logger.debug('workerResponse', event.data.response);
        }
        this.worker.port.removeEventListener('message', messageListener);
        clearTimeout(timeoutHandle);
        if (event.data.error) {
          reject(new Error(event.data.error));
          return;
        }
        resolve(event.data.response);
      };
      this.worker.port.addEventListener('message', messageListener);
    });
  }

  public async start({
    sipInfo,
    device,
    instanceId,
    debug,
    force,
  }: SipClientOptions) {
    this.sipInfo = sipInfo;
    this.instanceId = instanceId;
    this.debug = true;
    this.device = device;
    await this.workerRequest({
      type: 'startSipClient',
      data: { sipInfo, device, instanceId, debug, clientId: this.clientId, force },
    });
  }

  public async request(message: RequestMessage) {
    const response = await this.workerRequest({ type: 'request', data: message.toString() });
    return InboundMessage.fromString(response);
  }

  public async reply(message: ResponseMessage) {
    await this.workerRequest({ type: 'reply', data: message.toString() });
  }

  public async register(expires: number) {
    await this.workerRequest({ type: 'register', data: expires });
  }

  public async unregister() {
    await this.workerRequest({ type: 'unregister' });
  }

  public dispose() {
    this._logger.log('Disposing SharedSipClient');
    this.disposed = true;
    if (this.worker) {
      this.worker.port.removeEventListener('message', this.messageListener);
      this.worker.port.postMessage({ type: 'destroyPort' });
      this.worker.port.close();
    }
    this.removeAllListeners();
    this.worker = null;
  }

  public async getStatus() {
    const response = await this.workerRequest({ type: 'getSipClientStatus' });
    return response as {
      status: 'init' | 'connecting' | 'connected' | 'disconnected' | 'registering' | 'registered' | 'unregistering' | 'unregistered' | 'error';
      sipInfo: SipInfo;
      device: { id: string };
      instanceId: string;
    };
  }

  get active() {
    return this.activeTabId === this.tabId;
  }

  public setActive(activeTabId: string) {
    this.activeTabId = activeTabId;
    this.worker.port.postMessage({
      type: 'setActive',
      activeTabId,
    });
  }
}
