// Run in SharedWorker

import EventEmitter from "ringcentral-web-phone-beta-2/event-emitter";
import RcMessage from "ringcentral-web-phone-beta-2/rc-message/rc-message";
import InboundMessage from "ringcentral-web-phone-beta-2/sip-message/inbound";
import OutboundMessage from "ringcentral-web-phone-beta-2/sip-message/outbound/index";
import RequestMessage from "ringcentral-web-phone-beta-2/sip-message/outbound/request";
import ResponseMessage from "ringcentral-web-phone-beta-2/sip-message/outbound/response";
import type { SipClient, SipClientOptions, SipInfo } from "ringcentral-web-phone-beta-2/types";
import {
  branch,
  fakeDomain,
  fakeEmail,
  generateAuthorization,
  uuid,
} from "ringcentral-web-phone-beta-2/utils";

const maxExpires = 60;

type SipClientStatus =
  'registering' |
  'registered' |
  'unregistering' |
  'unregistered' |
  'registrationError';

type TransportStatus =
  'connecting' |
  'connected' |
  'disconnecting' |
  'reconnecting' |
  'disconnected' |
  'error';

class Logger {
  public log(message: string, ...args: any[]) {
    console.log('[INFO] ', message, ...args);
  }

  public warn(message: string, ...args: any[]) {
    console.warn('[WARN] ', message, ...args);
  }

  public error(message: string, ...args: any[]) {
    console.error('[ERROR] ', message, ...args);
  }
}

const logger = new Logger();

class Transport extends EventEmitter {
  public wsc: WebSocket;
  public logger: Logger;
  public status: TransportStatus = 'disconnected';
  private wsServers: {
    server: string,
    isError: boolean,
    backup: boolean,
  }[] = [];
  private currentServer: {
    server: string,
    isError: boolean,
    backup: boolean,
  } | null = null;
  private connectTimeoutHandle: NodeJS.Timeout;
  private _connectPromise: Promise<void> | null = null;
  private reconnectionAttempts: number = 0;
  private maxReconnectionAttempts = 10;
  private reconnectionTimeout = 4;
  private connectionTimeout = 5;
  // private disconnectPromise: Promise<void> | null = null;
  private onMessage: (event: MessageEvent) => void;
  private onClose: () => void;
  private reconnectTimeoutHandle: NodeJS.Timeout;

  constructor({
    sipInfo,
  }) {
    super();
    this.logger = logger;
    this.currentServer = null;
    this.reconnectionAttempts = 0;
    this.maxReconnectionAttempts = this.wsServers.length === 1 ? 15 : 10;
    this.reconnectionTimeout = this.wsServers.length === 1 ? 10 : 4;
    this.connectionTimeout = 5;

    if (sipInfo.outboundProxy) {
      this.wsServers.push({
        server: sipInfo.outboundProxy,
        isError: false,
        backup: false,
      });
    }
    if (sipInfo.outboundProxyBackup) {
      this.wsServers.push({
        server: sipInfo.outboundProxyBackup,
        isError: false,
        backup: true,
      });
    }
    if (this.wsServers.length === 0) {
      throw new Error('No available servers');
    }
    this.onMessage = (event) => {
      this.emit('message', event);
    };
    this.onClose = () => {
      this.wsc.removeEventListener('message', this.onMessage);
      this.wsc.removeEventListener('close', this.onClose);
      this.wsc = null;
      this.currentServer = null;
      this.reconnectionAttempts = 0;
      this.logger.log('Transport closed');
      this.setStatus('disconnected');
    };
  }

  public setStatus(status: TransportStatus) {
    this.status = status;
    this.emit('status', status);
  }

  public async connect(forceMain = false): Promise<void> {
    if (this._connectPromise) {
      return this._connectPromise;
    }
    try {
      this._connectPromise = this._connect(forceMain);
      await this._connectPromise;
      this.setStatus('connected');
      this._connectPromise = null;
    } catch (e) {
      this.logger.error('Connect failed', e);
      this.setStatus('reconnecting');
      this._connectPromise = null;
      await this.reconnect();
    }
  }

  public async _connect(forceMain): Promise<void> {
    const server = this.currentServer || this.getNextServer(forceMain);
    if (!server) {
      throw new Error('No available servers');
    }
    if (this.status !== 'disconnected' && this.wsc) {
      this.logger.warn('Attempted to connect while connected, disconnecting');
      await this.disconnect();
    }
    this.setStatus('connecting');
    this.wsc = new WebSocket(
      "wss://" + server.server,
      "sip",
    );
    if (this.debug) {
      const wscSend = this.wsc.send.bind(this.wsc);
      this.wsc.send = (message) => {
        this.logger.log(`Sending...(${new Date()})\n` + message);
        return wscSend(message);
      };
    }

    return new Promise<void>((resolve, reject) => {
      const openEventHandler = () => {
        this.wsc.removeEventListener("open", openEventHandler);
        this.wsc.removeEventListener("error", errorEventHandler);
        clearTimeout(this.connectTimeoutHandle);
        this.wsc.addEventListener("message", this.onMessage);
        this.wsc.addEventListener('close', this.onClose);
        resolve();
      };
      const errorEventHandler = (e) => {
        this.wsc.removeEventListener("error", errorEventHandler);
        this.wsc.removeEventListener("message", this.onMessage);
        clearTimeout(this.connectTimeoutHandle);
        reject(e);
      };
      this.connectTimeoutHandle = setTimeout(() => {
        this.wsc.close();
        this.wsc.removeEventListener("open", openEventHandler);
        this.wsc.removeEventListener("error", errorEventHandler);
        this.wsc.removeEventListener("message", this.onMessage);
        reject(new Error('Connection timeout'));
      }, this.connectionTimeout * 1000);
      this.wsc.addEventListener("open", openEventHandler);
      this.wsc.addEventListener("error", errorEventHandler);
    });
  }

  getComputeRandomTimeout(reconnectionAttempts: number, randomMinInterval: number, randomMaxInterval: number) {
    const randomInterval =
        Math.floor(Math.random() * Math.abs(randomMaxInterval - randomMinInterval)) + randomMinInterval;
    const retryOffset = ((reconnectionAttempts - 1) * (randomMinInterval + randomMaxInterval)) / 2;

    return randomInterval + retryOffset;
  }

  public async reconnect(forceMain = false) {
    if (this.reconnectionAttempts > 0) {
      this.logger.warn('Reconnect attempt', this.reconnectionAttempts);
    }
    if (forceMain) {
      await this.disconnect();
      this.currentServer = this.getNextServer(true);
      this.reconnectionAttempts = 0;
      await this.connect();
      return;
    }
    if (this.noAvailableServers()) {
      this.logger.warn('No available servers');
      this.setStatus('error');
      this.reconnectionAttempts = 0;
      this.currentServer = this.getNextServer(true);
      return;
    }
    if ((this.status !== 'reconnecting' && this.status !== 'disconnected') && this.wsc) {
      this.logger.warn('Attempted to reconnect while connected, disconnecting');
      await this.disconnect();
      await this.reconnect();
      return;
    }
    this.reconnectionAttempts++;
    const nextReconnectInterval = this.getComputeRandomTimeout(
      this.reconnectionAttempts,
      (this.reconnectionTimeout - 2) * 1000,
      (this.reconnectionTimeout + 2) * 1000,
    );
    if (this.reconnectionAttempts > this.maxReconnectionAttempts) {
      this.logger.warn('Max reconnection attempts reached for server', this.currentServer.server);
      this.currentServer.isError = true;
      this.reconnectionAttempts = 0;
      this.currentServer = this.getNextServer();
      await this.reconnect();
      return;
    }
    this.logger.warn('Reconnect attempt', this.reconnectionAttempts, 'next reconnect in', nextReconnectInterval);
    if (this.reconnectTimeoutHandle) {
      clearTimeout(this.reconnectTimeoutHandle);
    }
    this.reconnectTimeoutHandle = setTimeout(
      () => {
        this.connect();
      },
      nextReconnectInterval,
    );
  }

  public disconnect() {
    if (this.status === 'disconnected') {
      return;
    }
    this._disconnect();
  }

  public _disconnect() {
    if (!this.wsc) {
      return;
    }
    this.logger.log('Disconnecting');
    this.setStatus('disconnecting');
    this.wsc.close();
    this.currentServer = null;
    this.reconnectionAttempts = 0;
  }

  private noAvailableServers() {
    for (const server of this.wsServers) {
      if (!server.isError) {
        return false;
      }
    }
    return true;
  }

  private getNextServer(forceMain = false) {
    if (forceMain) {
      return this.wsServers[0];
    }
    for (const server of this.wsServers) {
      if (!server.isError) {
        return server;
      }
    }
    return this.wsServers[0];
  }

  dispose() {
    this.removeAllListeners();
    if (this.reconnectTimeoutHandle) {
      clearTimeout(this.reconnectTimeoutHandle);
    }
    this._disconnect();
    this.currentServer = null;
    this.reconnectionAttempts = 0;
  }
}

class SharedWorkerSipClient extends EventEmitter implements SipClient {
  public transport: Transport;
  public logger: Logger;
  public sipInfo: SipInfo;
  public device: { id: string };
  public instanceId: string;
  private debug: boolean;
  public status: SipClientStatus = 'unregistered';
  public clientId: string;

  private timeoutHandle: NodeJS.Timeout;

  public constructor({
    debug = false,
  }: {
    debug?: boolean;
  } = {}) {
    super();
    this.debug = debug;
    this.status = 'unregistered';
    this.logger = logger;
  }

  public setStatus(status: SipClientStatus, error?: Error) {
    this.status = status;
    this.emit('status', status, error?.message);
  }

  public async start({
    sipInfo,
    instanceId,
    device,
    clientId,
    force = false,
    debug,
  }: SipClientOptions) {
    if (
      this.transport &&
      this.sipInfo.authorizationId === sipInfo.authorizationId &&
      this.sipInfo.domain === sipInfo.domain &&
      this.sipInfo.username === sipInfo.username &&
      this.sipInfo.password === sipInfo.password &&
      this.sipInfo.outboundProxy === sipInfo.outboundProxy &&
      this.sipInfo.outboundProxyBackup === sipInfo.outboundProxyBackup &&
      (this.status === 'registered' || this.status === 'registering') &&
      this.clientId === clientId &&
      !force
    ) {
      this.logger.warn('SipClient already started, current status:', this.status);
      return;
    }
    this.logger.log('Starting SipClient');
    this.sipInfo = sipInfo;
    this.device = device;
    this.instanceId = instanceId ?? sipInfo.authorizationId!;
    this.debug = debug || false;
    this.clientId = clientId;
    if (this.transport) {
      this.logger.warn('There is a transport, disposing it');
      this.transport.dispose();
    }
    this.logger.log('Creating new transport');
    this.transport = new Transport({
      sipInfo,
    });
    this.transport.on('message', async (event) => {
      const inboundMessage = InboundMessage.fromString(event.data);
      if (inboundMessage.subject.startsWith("MESSAGE sip:")) {
        const rcMessage = await RcMessage.fromXml(inboundMessage.body);
        if (
          rcMessage.body.Cln &&
          rcMessage.body.Cln !== this.sipInfo.authorizationId
        ) {
          return; // the message is not for this instance
        }
      }
      if (this.debug) {
        this.logger.log(`Receiving...(${new Date()})\n` + event.data);
      }
      this.emit("inboundMessage", inboundMessage);
      if (
        inboundMessage.subject.startsWith("MESSAGE sip:") ||
        inboundMessage.subject.startsWith("BYE sip:") ||
        inboundMessage.subject.startsWith("CANCEL sip:") ||
        inboundMessage.subject.startsWith("INFO sip:") ||
        inboundMessage.subject.startsWith("NOTIFY sip:")
      ) {
        // Auto reply 200 OK to MESSAGE, BYE, CANCEL, INFO, NOTIFY
        await this.reply(
          new ResponseMessage(inboundMessage, { responseCode: 200 }),
        );
      }
    });
    if (this.timeoutHandle) {
      clearInterval(this.timeoutHandle);
    }
    this.setStatus('registering');
    this.transport.on('status', async (status) => {
      this.logger.log('Transport status', status);
      this.emit('transportStatus', status);
      if (status === 'connected') {
        this.logger.log('Transport connected, registering');
        this.register(maxExpires);
      }
    });
    await this.transport.connect();
  }

  public async dispose() {
    if (this.status === 'unregistered' || this.status === 'unregistering') {
      this.logger.warn('SipClient is already disposed, current status:', this.status);
      return;
    }
    this.logger.log('Disposing SipClient');
    try {
      clearTimeout(this.timeoutHandle);
      await this.unregister();
      await this.transport?.dispose();
      this.transport = null;
      this.logger.log('SipClient disposed');
    } catch (e) {
      this.logger.error('SipClient dispose failed', e);
      this.setStatus('registrationError');
      await this.transport?.dispose();
      this.transport = null;
      return;
    }
  }

  public async register(expires: number) {
    try {
      this.setStatus(expires > 0 ? 'registering' : 'unregistering');
      await this._register(expires);
      this.setStatus(expires > 0 ? 'registered' : 'unregistered');
    } catch (e) {
      if (expires > 0) {
        this.logger.error('Registration failed', e);
        this.setStatus('registrationError', e);
      } else {
        this.setStatus('unregistered');
      }
    }
  }

   private async _register(expires: number) {
    const requestMessage = new RequestMessage(
      `REGISTER sip:${this.sipInfo.domain} SIP/2.0`,
      {
        "Call-Id": uuid(),
        Contact:
          `<sip:${fakeEmail};transport=wss>;+sip.instance="<urn:uuid:${this.instanceId}>";expires=${expires}`,
        From:
          `<sip:${this.sipInfo.username}@${this.sipInfo.domain}>;tag=${uuid()}`,
        To: `<sip:${this.sipInfo.username}@${this.sipInfo.domain}>`,
        Via: `SIP/2.0/WSS ${fakeDomain};branch=${branch()}`,
        "Client-id": this.clientId,
      },
    );
    const requestPromise = new Promise<InboundMessage>((resolve, reject) => {
      // if cannot get response in 8 seconds, we close the connection
      const closeHandle = setTimeout(() => {
        this.logger.warn('Registration timeout, disconnecting');
        this.transport?.disconnect();
        reject(new Error('Registration timeout'));
      }, 8000);
      this.request(requestMessage).then((m) => {
        this.logger.log('Registration request resolved, clearing timeout');
        clearTimeout(closeHandle);
        resolve(m);
      }).catch((e) => {
        this.logger.error('Registration request rejected:', e);
        clearTimeout(closeHandle);
        reject(e);
      });
    });
    this.logger.log('Sending registration request');
    let inboundMessage = await requestPromise;
    this.logger.log('Received registration response');
    const wwwAuth = inboundMessage.headers["Www-Authenticate"] ||
      inboundMessage!.headers["WWW-Authenticate"];
    if (wwwAuth) {
      const nonce = wwwAuth.match(/, nonce="(.+?)"/)![1];
      const newMessage = requestMessage.fork();
      newMessage.headers.Authorization = generateAuthorization(
        this.sipInfo,
        nonce,
        "REGISTER",
      );
      inboundMessage = await this.request(newMessage);
    } else if (inboundMessage.subject.startsWith("SIP/2.0 603 ")) {
      throw new Error("Registration failed: " + inboundMessage.subject);
    }
    if (expires > 0) { // not for unregister
      const serverExpires = Number(
        inboundMessage.headers.Contact.match(/;expires=(\d+)/)![1],
      );
      this.timeoutHandle = setTimeout(
        () => {
          this.register(expires);
        },
        (serverExpires - 3) * 1000, // 3 seconds before server expires
      );
    }
  }

  public async unregister() {
    this.logger.log('Unregistering');
    await this.register(0);
    this.logger.log('Unregistered');
  }

  public async request(message: string | RequestMessage): Promise<InboundMessage> {
    return await this._send(message, true);
  }

  public async reply(message: string | ResponseMessage): Promise<void> {
    await this._send(message, false);
  }

  private _send(
    rawMessage: string | OutboundMessage,
    waitForReply = false,
  ): Promise<InboundMessage> {
    let message: OutboundMessage;
    if (typeof rawMessage === 'string') {
      this.transport.wsc.send(rawMessage);
      message = OutboundMessage.fromString(rawMessage);
    } else {
      this.transport.wsc.send(rawMessage.toString());
      message = rawMessage;
    }
    this.emit("outboundMessage", message);
    if (!waitForReply) {
      return new Promise<InboundMessage>((resolve) => {
        resolve(new InboundMessage());
      });
    }
    return new Promise<InboundMessage>((resolve) => {
      const messageListerner = (inboundMessage: InboundMessage) => {
        if (inboundMessage.headers.CSeq !== message.headers.CSeq) {
          return;
        }
        if (inboundMessage.subject.startsWith("SIP/2.0 100 ")) {
          return; // ignore
        }
        this.off("inboundMessage", messageListerner);
        resolve(inboundMessage);
      };
      this.on("inboundMessage", messageListerner);
    });
  }
}

const sipClient = new SharedWorkerSipClient();
let ports: MessagePort[] = [];
let mainPort: MessagePort;
let sharedState = {};

// @ts-ignore
onconnect = (event) => {
  logger.log('port onconnect');
  const port = event.ports[0];
  ports.push(port);
  if (ports.length === 1) {
    logger.log('set first port as mainPort');
    mainPort = port;
  }
  port.onmessage = async(event) => {
    const { type, requestId, request } = event.data;
    if (type === 'destroyPort') {
      logger.log('destroyPort');
      ports = ports.filter((p) => p !== port);
      if (mainPort === port) {
        mainPort = ports[0] || null;
        logger.log('mainPort is destroyed, set new mainPort');
      }
      if (ports.length === 0) {
        logger.log('No ports left, disposing SipClient');
        await sipClient.dispose();
      }
      return;
    }
    if (type === 'setActive') {
      const activeTabId = event.data.activeTabId;
      logger.log('setActive', activeTabId);
      mainPort = port;
      if (!ports.find((p) => p === port)) {
        logger.warn('no port found when active, add port to ports');
        ports.push(port);
      }
      
      ports.forEach((p) => {
        if (p === port) {
          return;
        }
        p.postMessage({
          type: 'setActive',
          activeTabId,
        });
      });
    }
    if (type === 'setSharedState') {
      const state = event.data.state;
      if (state) {
        Object.keys(state).forEach((key) => {
          sharedState[key] = state[key];
        });
        ports.forEach((p) => {
          if (p === port) {
            return;
          }
          p.postMessage({
            type: 'setSharedState',
            state,
          });
        });
      }
      return;
    }
    if (type === 'workerRequest') {
      if (request.type === 'getSharedState') {
        port.postMessage({
          type: 'workerResponse',
          requestId,
          response: sharedState,
        });
        return;
      }
      if (request.type === 'getSipClientStatus') {
        port.postMessage({
          type: 'workerResponse',
          requestId,
          response: {
            status: sipClient.status,
            sipInfo: sipClient.sipInfo,
            device: sipClient.device,
            instanceId: sipClient.instanceId,
          },
        });
        return;
      }
      if (request.type === 'startSipClient') {
        if (!mainPort) {
          logger.warn('No main port, set current port as main port');
          mainPort = port;
          if (!ports.find((p) => p === port)) {
            ports.push(port);
          }
        }
        logger.log('Received startSipClient request');
        await sipClient.start(request.data);
        port.postMessage({
          type: 'workerResponse',
          requestId,
          response: 'OK',
        });
        return;
      }
      if (request.type === 'request') {
        const response = await sipClient.request(request.data);
        port.postMessage({
          type: 'workerResponse',
          requestId,
          response: response.toString(),
        });
        return;
      }
      if (request.type === 'reply') {
        await sipClient.reply(request.data);
        port.postMessage({
          type: 'workerResponse',
          requestId,
          response: 'OK',
        });
        return;
      }
      if (request.type === 'register') {
        logger.log('Received register request');
        await sipClient.register(request.data);
        port.postMessage({
          type: 'workerResponse',
          requestId,
          response: 'OK',
        });
        return;
      }
      if (request.type === 'unregister') {
        logger.log('Received unregister request');
        await sipClient.dispose();
        port.postMessage({
          type: 'workerResponse',
          requestId,
          response: 'OK',
        });
        return;
      }
      port.postMessage({
        type: 'workerResponse',
        requestId,
        response: 'NOT_SUPPORTED',
      });
    }
  };
};

sipClient.on('inboundMessage', (message) => {
  let port = mainPort;
  if (!port) {
    port = ports[0];
  }
  if (!port) {
    logger.warn('No main port, skipping inboundMessage');
    return;
  }
  logger.log('Received inboundMessage, sending to main port');
  port.postMessage({
    type: 'inboundMessage',
    message: message.toString(),
  });
});

sipClient.on('outboundMessage', (message) => {
  let port = mainPort;
  if (!port) {
    port = ports[0];
  }
  if (!port) {
    logger.warn('No main port, skipping outboundMessage');
    return;
  }
  logger.log('Sending outboundMessage to main port');
  port.postMessage({
    type: 'outboundMessage',
    message: message.toString(),
  });
});

sipClient.on('status', (status, error) => {
  logger.log('sipClient status changed, sync to ports', status, error);
  ports.forEach((port) => {
    port.postMessage({
      type: 'status',
      status,
      error,
    });
  });
});

sipClient.on('transportStatus', (status) => {
  logger.log('sipClient transportStatus changed, sync to ports', status);
  ports.forEach((port) => {
    port.postMessage({
      type: 'transportStatus',
      status,
    });
  });
});