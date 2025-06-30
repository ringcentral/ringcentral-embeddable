import EventEmitter from "ringcentral-web-phone-beta-2/event-emitter";
import InboundMessage from "ringcentral-web-phone-beta-2/sip-message/inbound";
import OutboundMessage from "ringcentral-web-phone-beta-2/sip-message/outbound/index";
import RequestMessage from "ringcentral-web-phone-beta-2/sip-message/outbound/request";
import ResponseMessage from "ringcentral-web-phone-beta-2/sip-message/outbound/response";
import type { SipClient, SipClientOptions, SipInfo } from "ringcentral-web-phone-beta-2/types";
import { uuid } from "ringcentral-web-phone-beta-2/utils";

export class SharedSipClient extends EventEmitter implements SipClient {
  public disposed = false;
  public worker: SharedWorker;
  public instanceId: string;
  public sipInfo: SipInfo;
  public device: { id: string };
  private debug: boolean;
  private messageListener: (event: MessageEvent) => void;

  public constructor({
    worker,
  }: {
    worker: SharedWorker;
  }) {
    super();
    this.worker = worker;
    this.messageListener = (event) => {
      if (event.data.type === 'inboundMessage') {
        if (this.debug) {
          console.log('inboundMessage', event.data.message);
        }
        this.emit('inboundMessage', InboundMessage.fromString(event.data.message));
      } else if (event.data.type === 'outboundMessage') {
        if (this.debug) {
          console.log('outboundMessage', event.data.message);
        }
        this.emit('outboundMessage', OutboundMessage.fromString(event.data.message));
      } else if (event.data.type === 'status') {
        if (this.debug) {
          console.log('status', event.data.status);
        }
        this.emit('status', event.data.status);
      }
    }
    this.worker.port.addEventListener('message', this.messageListener);
    this.worker.port.start();
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
      }, 5000);
      const messageListener = (event) => {
        if (
          !event.data ||
          event.data.type !== 'workerResponse' ||
          event.data.requestId !== requestId
        ) {
          return;
        }
        if (this.debug) {
          console.log('workerResponse', event.data.response);
        }
        this.worker.port.removeEventListener('message', messageListener);
        clearTimeout(timeoutHandle);
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
  }: SipClientOptions) {
    this.sipInfo = sipInfo;
    this.instanceId = instanceId;
    this.debug = true;
    this.device = device;
    await this.workerRequest({ type: 'startSipClient', data: { sipInfo, device, instanceId, debug } });
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
    await this.register(0);
  }

  public async toggleBackupOutboundProxy(enabled = true) {
    await this.workerRequest({ type: 'toggleBackupOutboundProxy', data: enabled });
  }

  public dispose() {
    this.disposed = true;
    this.worker.port.removeEventListener('message', this.messageListener);
    this.worker.port.postMessage({ type: 'destroyPort' });
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

  public setActive() {
    this.worker.port.postMessage({
      type: 'setActive',
    });
  }
}
