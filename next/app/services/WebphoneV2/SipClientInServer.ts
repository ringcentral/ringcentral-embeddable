import EventEmitter from 'ringcentral-web-phone/event-emitter';
import RcMessage from 'ringcentral-web-phone/rc-message/rc-message';
import InboundMessage from 'ringcentral-web-phone/sip-message/inbound';
import OutboundMessage from 'ringcentral-web-phone/sip-message/outbound/index';
import RequestMessage from 'ringcentral-web-phone/sip-message/outbound/request';
import ResponseMessage from 'ringcentral-web-phone/sip-message/outbound/response';
import type { SipClient, SipInfo } from 'ringcentral-web-phone/types';
import {
  branch,
  fakeDomain,
  fakeEmail,
  generateAuthorization,
  uuid,
} from 'ringcentral-web-phone/utils';

import type {
  SharedSipClientStartOptions,
  SharedSipClientStatusResponse,
  SharedSipRegistrationStatus,
  SharedSipTransportStatus,
} from './Webphone.interface';

type LoggerLike = Pick<Console, 'debug' | 'error' | 'log' | 'warn'>;

const maxExpires = 60;

class Transport extends EventEmitter {
  public wsc: WebSocket | null = null;
  public status: SharedSipTransportStatus = 'disconnected';
  public debug?: boolean;

  private disposed = false;
  private readonly logger: LoggerLike;
  private wsServers: {
    backup: boolean;
    isError: boolean;
    server: string;
  }[] = [];
  private currentServer: {
    backup: boolean;
    isError: boolean;
    server: string;
  } | null = null;
  private connectTimeoutHandle: NodeJS.Timeout | null = null;
  private _connectPromise: Promise<void> | null = null;
  private reconnectionAttempts = 0;
  private maxReconnectionAttempts = 10;
  private reconnectionTimeout = 4;
  private connectionTimeout = 5;
  private reconnectTimeoutHandle: NodeJS.Timeout | null = null;
  private readonly onMessage: (event: MessageEvent) => void;
  private readonly onClose: (event: CloseEvent) => void;

  constructor({
    logger,
    sipInfo,
  }: {
    logger: LoggerLike;
    sipInfo: SipInfo;
  }) {
    super();
    this.logger = logger;
    if (sipInfo.outboundProxy) {
      this.wsServers.push({
        backup: false,
        isError: false,
        server: sipInfo.outboundProxy,
      });
    }
    if (sipInfo.outboundProxyBackup) {
      this.wsServers.push({
        backup: true,
        isError: false,
        server: sipInfo.outboundProxyBackup,
      });
    }
    if (this.wsServers.length === 0) {
      throw new Error('No available servers');
    }
    this.maxReconnectionAttempts = this.wsServers.length === 1 ? 15 : 10;
    this.reconnectionTimeout = this.wsServers.length === 1 ? 10 : 4;
    this.onMessage = (event) => {
      this.emit('message', event);
    };
    this.onClose = () => {
      this.logger.warn('Transport closed');
      this.emit('close');
      // Clean up the closed WebSocket
      if (this.wsc) {
        this.wsc.removeEventListener('message', this.onMessage);
        this.wsc.removeEventListener('close', this.onClose);
        this.wsc = null;
      }
      if (!this.disposed) {
        // Auto-reconnect on unexpected close (e.g. after sleep/wake)
        this.reconnectionAttempts = 0;
        this.wsServers.forEach((s) => { s.isError = false; });
        this.setStatus('reconnecting');
        void this.reconnect();
      } else if (this.status !== 'disconnected') {
        this.setStatus('disconnected');
      }
    };
  }

  public setStatus(status: SharedSipTransportStatus) {
    this.logger.log('Transport status change:', this.status, '->', status);
    this.status = status;
    this.emit('status', status);
  }

  public async connect(forceMain = false): Promise<void> {
    this.logger.log('Transport connect', { forceMain, currentStatus: this.status, hasPromise: !!this._connectPromise });
    if (this._connectPromise) {
      this.logger.log('Transport connect: reusing existing connect promise');
      return this._connectPromise;
    }
    try {
      this._connectPromise = this._connect(forceMain);
      await this._connectPromise;
      this.reconnectionAttempts = 0;
      this.setStatus('connected');
      this._connectPromise = null;
    } catch (error) {
      this.logger.error('Transport connect failed', error);
      this.setStatus('reconnecting');
      this._connectPromise = null;
      await this.reconnect();
    }
  }

  private async _connect(forceMain: boolean): Promise<void> {
    this.currentServer = this.currentServer || this.getNextServer(forceMain);
    if (!this.currentServer) {
      throw new Error('No available servers');
    }
    this.logger.log('Connecting to server', this.currentServer.server);
    if (this.status !== 'disconnected' && this.wsc) {
      this.logger.warn('Attempted to connect while connected, disconnecting');
      this.disconnect();
    }
    this.setStatus('connecting');
    this.wsc = new WebSocket(`wss://${this.currentServer.server}`, 'sip');
    if (this.debug) {
      const wscSend = this.wsc.send.bind(this.wsc);
      this.wsc.send = (message) => {
        this.logger.log(`Sending...(${new Date()})\n${message}`);
        return wscSend(message);
      };
    }

    return new Promise<void>((resolve, reject) => {
      const openEventHandler = () => {
        if (this.connectTimeoutHandle) {
          clearTimeout(this.connectTimeoutHandle);
          this.connectTimeoutHandle = null;
        }
        this.wsc?.removeEventListener('open', openEventHandler);
        this.wsc?.removeEventListener('error', errorEventHandler);
        this.wsc?.addEventListener('message', this.onMessage);
        this.wsc?.addEventListener('close', this.onClose);
        resolve();
      };
      const errorEventHandler = (event: Event) => {
        if (this.connectTimeoutHandle) {
          clearTimeout(this.connectTimeoutHandle);
          this.connectTimeoutHandle = null;
        }
        this.wsc?.removeEventListener('error', errorEventHandler);
        this.wsc?.removeEventListener('message', this.onMessage);
        this.wsc = null;
        reject(event);
      };
      if (this.connectTimeoutHandle) {
        clearTimeout(this.connectTimeoutHandle);
      }
      this.connectTimeoutHandle = setTimeout(() => {
        this.logger.log('Connection timeout, closing connection');
        if (this.wsc) {
          this.wsc.removeEventListener('open', openEventHandler);
          this.wsc.removeEventListener('error', errorEventHandler);
          this.wsc.removeEventListener('message', this.onMessage);
          this.wsc.removeEventListener('close', this.onClose);
          this.wsc.close();
          this.wsc = null;
        }
        reject(new Error('Connection timeout'));
      }, this.connectionTimeout * 1000);
      this.wsc.addEventListener('open', openEventHandler);
      this.wsc.addEventListener('error', errorEventHandler);
    });
  }

  private getComputeRandomTimeout(
    reconnectionAttempts: number,
    randomMinInterval: number,
    randomMaxInterval: number,
  ) {
    const randomInterval =
      Math.floor(Math.random() * Math.abs(randomMaxInterval - randomMinInterval)) +
      randomMinInterval;
    const retryOffset =
      ((reconnectionAttempts - 1) *
        (randomMinInterval + randomMaxInterval)) /
      2;

    return randomInterval + retryOffset;
  }

  public async reconnect(forceMain = false) {
    this.logger.log('Transport reconnect', {
      forceMain,
      attempt: this.reconnectionAttempts,
      maxAttempts: this.maxReconnectionAttempts,
      currentServer: this.currentServer?.server,
      status: this.status,
    });
    if (forceMain) {
      this.disconnect();
      this.currentServer = this.getNextServer(true);
      this.reconnectionAttempts = 0;
      await this.connect();
      return;
    }
    if (this.noAvailableServers()) {
      this.logger.warn('No available servers, all servers marked as error');
      this.setStatus('error');
      this.reconnectionAttempts = 0;
      this.currentServer = this.getNextServer(true);
      return;
    }
    if (
      (this.status !== 'reconnecting' && this.status !== 'disconnected') &&
      this.wsc
    ) {
      this.logger.warn(
        'Attempted to reconnect while connected, disconnecting',
      );
      this.disconnect();
      await this.reconnect();
      return;
    }
    this.reconnectionAttempts += 1;
    const nextReconnectInterval = this.getComputeRandomTimeout(
      this.reconnectionAttempts,
      (this.reconnectionTimeout - 2) * 1000,
      (this.reconnectionTimeout + 2) * 1000,
    );
    if (this.reconnectionAttempts > this.maxReconnectionAttempts) {
      this.logger.warn(
        'Max reconnection attempts reached for server',
        this.currentServer?.server,
      );
      if (this.currentServer) {
        this.currentServer.isError = true;
      }
      this.reconnectionAttempts = 0;
      this.currentServer = this.getNextServer();
      await this.reconnect();
      return;
    }
    this.logger.warn(
      'Reconnect attempt',
      this.reconnectionAttempts,
      'next reconnect in',
      nextReconnectInterval,
    );
    if (this.reconnectTimeoutHandle) {
      clearTimeout(this.reconnectTimeoutHandle);
    }
    this.reconnectTimeoutHandle = setTimeout(() => {
      void this.connect();
    }, nextReconnectInterval);
  }

  public disconnect() {
    this._disconnect();
  }

  private _disconnect() {
    if (!this.wsc) {
      this.logger.warn('Transport is already disconnected');
      return;
    }
    if (this.connectTimeoutHandle) {
      clearTimeout(this.connectTimeoutHandle);
      this.connectTimeoutHandle = null;
    }
    if (this.status !== 'disconnected') {
      this.setStatus('disconnected');
    }
    this.wsc.removeEventListener('message', this.onMessage);
    this.wsc.removeEventListener('close', this.onClose);
    this.wsc.close();
    this.wsc = null;
    this.currentServer = null;
    this.reconnectionAttempts = 0;
  }

  private noAvailableServers() {
    return this.wsServers.every((server) => server.isError);
  }

  private getNextServer(forceMain = false) {
    if (forceMain) {
      return this.wsServers[0];
    }
    return this.wsServers.find((server) => !server.isError) ?? this.wsServers[0];
  }

  dispose() {
    if (this.disposed) {
      this.logger.warn('Transport is already disposed');
      return;
    }
    this.disposed = true;
    if (this.reconnectTimeoutHandle) {
      clearTimeout(this.reconnectTimeoutHandle);
    }
    this.removeAllListeners();
    this._disconnect();
  }
}

export class SipClientInServer
  extends EventEmitter
  implements SipClient
{
  public disposed = false;
  public wsc: WebSocket;
  public transport: Transport | null = null;
  public sipInfo: SipInfo;
  public device: { id: string };
  public instanceId: string;
  public sharedState: Record<string, any> = {};
  public activeTabId: string | null = null;
  public clientId: string;
  public status: SharedSipRegistrationStatus = 'init';

  private debug = false;
  private timeoutHandle: NodeJS.Timeout | null = null;
  private readonly logger: LoggerLike;

  constructor({ logger = console }: { logger?: LoggerLike } = {}) {
    super();
    this.logger = logger;
  }

  public setStatus(status: SharedSipRegistrationStatus, error?: Error) {
    this.logger.log('SipClient status change:', this.status, '->', status, error ? `error: ${error.message}` : '');
    this.status = status;
    this.emit('status', status, error?.message);
  }

  public setSharedState(state: Record<string, any>) {
    Object.keys(state).forEach((key) => {
      this.sharedState[key] = state[key];
    });
    this.emit('sharedStateChanged', this.sharedState);
  }

  public setActiveTabId(activeTabId: string | null) {
    this.activeTabId = activeTabId;
    this.emit('activeTabIdChanged', activeTabId);
  }

  public getStatus(): SharedSipClientStatusResponse {
    return {
      activeTabId: this.activeTabId,
      device: this.device,
      instanceId: this.instanceId,
      sharedState: this.sharedState,
      sipInfo: this.sipInfo,
      status: this.status,
      transportStatus: this.transport?.status ?? 'disconnected',
    };
  }

  public async start(options?: SharedSipClientStartOptions) {
    if (!options && !this.sipInfo) {
      throw new Error('SipClientInServer requires sip client options');
    }
    const {
      clientId = this.clientId,
      debug = this.debug,
      device = this.device,
      force = false,
      instanceId = this.instanceId,
      sipInfo = this.sipInfo,
    } = options ?? {};

    if (
      this.transport &&
      this.sipInfo?.authorizationId === sipInfo.authorizationId &&
      this.sipInfo?.domain === sipInfo.domain &&
      this.sipInfo?.username === sipInfo.username &&
      this.sipInfo?.password === sipInfo.password &&
      this.sipInfo?.outboundProxy === sipInfo.outboundProxy &&
      this.sipInfo?.outboundProxyBackup === sipInfo.outboundProxyBackup &&
      (this.status === 'registered' || this.status === 'registering') &&
      this.clientId === clientId &&
      !force
    ) {
      this.logger.warn(
        'SipClient already started, current status:',
        this.status,
      );
      return;
    }

    this.sipInfo = sipInfo;
    this.device = device;
    this.instanceId = instanceId ?? sipInfo.authorizationId;
    this.debug = debug || false;
    this.clientId = clientId;

    if (this.transport) {
      this.logger.warn('There is a transport, disposing it');
      this.transport.dispose();
    }

    this.transport = new Transport({
      logger: this.logger,
      sipInfo,
    });
    this.transport.debug = this.debug;
    this.wsc = this.transport.wsc as unknown as WebSocket;
    this.transport.on('message', async (event: MessageEvent) => {
      const inboundMessage = InboundMessage.fromString(event.data);
      if (inboundMessage.subject.startsWith('MESSAGE sip:')) {
        const rcMessage = await RcMessage.fromXml(inboundMessage.body);
        if (rcMessage.body.Cln && rcMessage.body.Cln !== this.sipInfo.authorizationId) {
          return;
        }
      }
      if (this.debug) {
        this.logger.log(`Receiving...(${new Date()})\n${event.data}`);
      }
      this.emit('inboundMessage', inboundMessage);
      if (
        inboundMessage.subject.startsWith('MESSAGE sip:') ||
        inboundMessage.subject.startsWith('BYE sip:') ||
        inboundMessage.subject.startsWith('CANCEL sip:') ||
        inboundMessage.subject.startsWith('INFO sip:') ||
        inboundMessage.subject.startsWith('NOTIFY sip:') ||
        inboundMessage.subject.startsWith('UPDATE sip:')
      ) {
        await this.reply(
          new ResponseMessage(inboundMessage, { responseCode: 200 }),
        );
      }
    });
    this.transport.on('status', async (status: SharedSipTransportStatus) => {
      this.logger.log('SipClient received transport status:', status, '| current registration status:', this.status);
      this.emit('transportStatus', status);
      if (status === 'connected') {
        this.wsc = this.transport?.wsc as unknown as WebSocket;
        this.logger.log('SipClient transport connected, starting registration');
        await this.register(maxExpires);
      }
      if (
        (status === 'disconnected' || status === 'reconnecting') &&
        this.timeoutHandle
      ) {
        this.logger.log('SipClient clearing re-registration timer due to transport', status);
        clearTimeout(this.timeoutHandle);
        this.timeoutHandle = null;
      }
    });
    this.setStatus('registering');
    this.logger.log('SipClient starting transport connect');
    await this.transport.connect();
  }

  public async dispose() {
    if (
      this.status === 'unregistered' ||
      this.status === 'unregistering' ||
      this.status === 'init'
    ) {
      this.logger.warn(
        'SipClient is already disposed, current status:',
        this.status,
      );
      return;
    }
    this.disposed = true;
    try {
      if (this.timeoutHandle) {
        clearTimeout(this.timeoutHandle);
        this.timeoutHandle = null;
      }
      await this.unregister();
      this.transport?.dispose();
      this.transport = null;
      this.setStatus('unregistered');
    } catch (error) {
      this.logger.error('SipClient dispose failed', error);
      this.setStatus('registrationError');
      this.transport?.dispose();
      this.transport = null;
    }
  }

  public async register(expires: number) {
    this.logger.log('SipClient register', { expires, transportStatus: this.transport?.status });
    try {
      this.setStatus(expires > 0 ? 'registering' : 'unregistering');
      await this._register(expires);
      this.setStatus(expires > 0 ? 'registered' : 'unregistered');
    } catch (error) {
      if (expires > 0) {
        this.logger.error('Registration failed', error);
        this.setStatus('registrationError', error as Error);
      } else {
        this.logger.warn('Unregister failed, setting unregistered anyway', error);
        this.setStatus('unregistered');
      }
    }
  }

  private async _register(expires: number) {
    if (expires === 0 && this.transport?.status === 'disconnected') {
      this.logger.log('Transport is disconnected, skipping unregister');
      return;
    }
    const requestMessage = new RequestMessage(
      `REGISTER sip:${this.sipInfo.domain} SIP/2.0`,
      {
        'Call-Id': uuid(),
        Contact:
          `<sip:${fakeEmail};transport=wss>;+sip.instance="<urn:uuid:${this.instanceId}>";expires=${expires}`,
        From: `<sip:${this.sipInfo.username}@${this.sipInfo.domain}>;tag=${uuid()}`,
        To: `<sip:${this.sipInfo.username}@${this.sipInfo.domain}>`,
        Via: `SIP/2.0/WSS ${fakeDomain};branch=${branch()}`,
        'Client-id': this.clientId,
      },
    );
    const requestPromise = new Promise<InboundMessage>((resolve, reject) => {
      const closeHandle = setTimeout(() => {
        this.logger.warn('Registration timeout');
        reject(new Error('Registration timeout'));
      }, 8000);
      this.request(requestMessage)
        .then((message) => {
          clearTimeout(closeHandle);
          resolve(message);
        })
        .catch((error) => {
          clearTimeout(closeHandle);
          reject(error);
        });
    });
    let inboundMessage = await requestPromise;
    const wwwAuth =
      inboundMessage.headers['Www-Authenticate'] ||
      inboundMessage.headers['WWW-Authenticate'];
    if (wwwAuth) {
      const nonce = wwwAuth.match(/, nonce="(.+?)"/)?.[1];
      if (!nonce) {
        throw new Error('Registration failed: invalid nonce');
      }
      const newMessage = requestMessage.fork();
      newMessage.headers.Authorization = generateAuthorization(
        this.sipInfo,
        nonce,
        'REGISTER',
      );
      inboundMessage = await this.request(newMessage);
    } else if (inboundMessage.subject.startsWith('SIP/2.0 603 ')) {
      throw new Error(`Registration failed: ${inboundMessage.subject}`);
    } else if (inboundMessage.subject.startsWith('SIP/2.0 403 ')) {
      throw new Error(`Registration failed: ${inboundMessage.subject}`);
    }
    if (expires > 0) {
      if (!inboundMessage.headers.Contact) {
        throw new Error(`Registration failed: ${inboundMessage.subject}`);
      }
      const serverExpires = Number(
        inboundMessage.headers.Contact.match(/;expires=(\d+)/)?.[1],
      );
      if (this.timeoutHandle) {
        clearTimeout(this.timeoutHandle);
      }
      this.timeoutHandle = setTimeout(() => {
        void this.register(expires);
      }, (serverExpires - 3) * 1000);
    }
  }

  public async unregister() {
    await this.register(0);
  }

  public async request(message: string | RequestMessage) {
    return this._send(message, true);
  }

  public async reply(message: string | ResponseMessage) {
    await this._send(message, false);
  }

  private _send(
    rawMessage: string | OutboundMessage,
    waitForReply = false,
  ): Promise<InboundMessage> {
    if (!this.transport?.wsc) {
      throw new Error('SipClient transport is not connected');
    }
    let message: OutboundMessage;
    if (typeof rawMessage === 'string') {
      this.transport.wsc.send(rawMessage);
      message = OutboundMessage.fromString(rawMessage);
    } else {
      this.transport.wsc.send(rawMessage.toString());
      message = rawMessage;
    }
    this.emit('outboundMessage', message);
    if (!waitForReply) {
      return Promise.resolve(new InboundMessage());
    }
    return new Promise<InboundMessage>((resolve) => {
      const messageListener = (inboundMessage: InboundMessage) => {
        if (inboundMessage.headers.CSeq !== message.headers.CSeq) {
          return;
        }
        if (inboundMessage.subject.startsWith('SIP/2.0 100 ')) {
          return;
        }
        this.off('inboundMessage', messageListener);
        resolve(inboundMessage);
      };
      this.on('inboundMessage', messageListener);
    });
  }
}
