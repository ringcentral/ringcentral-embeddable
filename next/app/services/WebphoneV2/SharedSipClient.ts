import type { PortManager } from '@ringcentral-integration/next-core';
import EventEmitter from 'ringcentral-web-phone/event-emitter';
import InboundMessage from 'ringcentral-web-phone/sip-message/inbound';
import OutboundMessage from 'ringcentral-web-phone/sip-message/outbound/index';
import type RequestMessage from 'ringcentral-web-phone/sip-message/outbound/request';
import type ResponseMessage from 'ringcentral-web-phone/sip-message/outbound/response';
import type { SipClient, SipInfo } from 'ringcentral-web-phone/types';

import type {
  SharedSipClientStartOptions,
  SharedSipClientStatusResponse,
  SharedSipRegistrationStatus,
  SharedSipTransportStatus,
} from './Webphone.interface';
import {
  SHARED_SIP_CLIENT_EVENTS,
  SHARED_SIP_CLIENT_REQUESTS,
} from './sharedSipClient.constants';

type LoggerLike = Pick<Console, 'debug' | 'error' | 'log' | 'warn'>;

export class SharedSipClient extends EventEmitter implements SipClient {
  public disposed = false;
  public wsc = new EventTarget() as WebSocket;
  public instanceId: string;
  public sipInfo: SipInfo;
  public device: { id: string };
  public sharedState: Record<string, any> = {};
  public activeTabId: string | null = null;

  private debug = false;
  private readonly clientId: string;
  private readonly logger: LoggerLike;
  private readonly portManager: PortManager;
  private readonly destroyers: Array<() => void> = [];

  constructor({
    clientId,
    logger = console,
    portManager,
  }: {
    clientId: string;
    logger?: LoggerLike;
    portManager: PortManager;
  }) {
    super();
    this.clientId = clientId;
    this.logger = logger;
    this.portManager = portManager;
    this.bindServerEvents();
  }

  private bindServerEvents() {
    const transport = this.portManager.transport;
    if (!transport) {
      throw new Error('SharedSipClient requires a client transport');
    }

    this.destroyers.push(
      // @ts-ignore
      transport.listen(
        SHARED_SIP_CLIENT_EVENTS.inboundMessage,
        async ({ message }) => {
          if (this.disposed) {
            return;
          }
          if (this.debug) {
            this.logger.debug('inboundMessage', message);
          }
          this.emit('inboundMessage', InboundMessage.fromString(message));
        },
      ),
      // @ts-ignore
      transport.listen(
        SHARED_SIP_CLIENT_EVENTS.outboundMessage,
        async ({ message }) => {
          if (this.disposed) {
            return;
          }
          if (this.debug) {
            this.logger.debug('outboundMessage', message);
          }
          this.emit('outboundMessage', OutboundMessage.fromString(message));
        },
      ),
      // @ts-ignore
      transport.listen(
        SHARED_SIP_CLIENT_EVENTS.status,
        async ({
          error,
          status,
        }: {
          error?: string;
          status: SharedSipRegistrationStatus;
        }) => {
          if (this.disposed) {
            return;
          }
          this.emit('status', status, error);
        },
      ),
      // @ts-ignore
      transport.listen(
        SHARED_SIP_CLIENT_EVENTS.transportStatus,
        async ({ status }: { status: SharedSipTransportStatus }) => {
          if (this.disposed) {
            return;
          }
          if (status === 'disconnected' || status === 'error') {
            this.wsc.dispatchEvent(new Event('close'));
          }
          this.emit('transportStatus', status);
        },
      ),
      // @ts-ignore
      transport.listen(
        SHARED_SIP_CLIENT_EVENTS.sharedStateChanged,
        async ({ state }: { state: Record<string, any> }) => {
          if (this.disposed) {
            return;
          }
          this.sharedState = {
            ...this.sharedState,
            ...state,
          };
          this.emit('sharedStateChanged', this.sharedState);
        },
      ),
      // @ts-ignore
      transport.listen(
        SHARED_SIP_CLIENT_EVENTS.activeTabIdChanged,
        async ({ activeTabId }: { activeTabId: string | null }) => {
          if (this.disposed) {
            return;
          }
          this.activeTabId = activeTabId;
          this.emit('activeTabIdChanged', activeTabId);
        },
      ),
    );
  }

  private async requestServer<T = any>(name: string, payload?: any): Promise<T> {
    const transport = this.portManager.transport;
    if (!transport) {
      throw new Error('SharedSipClient requires a client transport');
    }
    // @ts-ignore
    return transport.emit(name, payload);
  }

  public async start(options?: SharedSipClientStartOptions) {
    if (options) {
      this.sipInfo = options.sipInfo;
      this.instanceId = options.instanceId ?? options.sipInfo.authorizationId;
      this.device = options.device;
      this.debug = options.debug || false;
    }
    if (!this.sipInfo || !this.device) {
      throw new Error('SharedSipClient requires sip client options');
    }
    await this.requestServer(SHARED_SIP_CLIENT_REQUESTS.start, {
      clientId: this.clientId,
      debug: this.debug,
      device: this.device,
      force: options?.force,
      instanceId: this.instanceId,
      sipInfo: this.sipInfo,
    });
  }

  public async request(message: RequestMessage) {
    const response = await this.requestServer<string>(
      SHARED_SIP_CLIENT_REQUESTS.request,
      { data: message.toString() },
    );
    return InboundMessage.fromString(response);
  }

  public async reply(message: ResponseMessage) {
    await this.requestServer(SHARED_SIP_CLIENT_REQUESTS.reply, {
      data: message.toString(),
    });
  }

  public async register(expires: number) {
    await this.requestServer(SHARED_SIP_CLIENT_REQUESTS.register, {
      data: expires,
    });
  }

  public async unregister() {
    await this.requestServer(SHARED_SIP_CLIENT_REQUESTS.unregister);
  }

  public async dispose() {
    this.disposed = true;
    this.destroyers.splice(0).forEach((destroy) => {
      try {
        destroy();
      } catch (error) {
        this.logger.error('Failed to remove SharedSipClient listener', error);
      }
    });
    this.removeAllListeners();
  }

  public async disposeInServer() {
    await this.requestServer(SHARED_SIP_CLIENT_REQUESTS.dispose);
  }

  public async getStatus() {
    const response = await this.requestServer<SharedSipClientStatusResponse>(
      SHARED_SIP_CLIENT_REQUESTS.getStatus,
    );
    this.activeTabId = response.activeTabId ?? null;
    this.device = response.device;
    this.instanceId = response.instanceId;
    this.sharedState = response.sharedState ?? {};
    this.sipInfo = response.sipInfo;
    return response;
  }

  public async syncSharedState() {
    const response = await this.requestServer<Record<string, any>>(
      SHARED_SIP_CLIENT_REQUESTS.getSharedState,
    );
    this.sharedState = response ?? {};
    return this.sharedState;
  }

  public async setSharedState(state: Record<string, any>) {
    this.sharedState = {
      ...this.sharedState,
      ...state,
    };
    await this.requestServer(SHARED_SIP_CLIENT_REQUESTS.setSharedState, {
      state,
    });
  }

  public async syncActiveTabId() {
    const activeTabId = await this.requestServer<string | null>(
      SHARED_SIP_CLIENT_REQUESTS.getActiveTabId,
    );
    this.activeTabId = activeTabId;
    return this.activeTabId;
  }

  public setActive(activeTabId: string | null) {
    this.activeTabId = activeTabId;
    void this.requestServer(SHARED_SIP_CLIENT_REQUESTS.setActiveTabId, {
      activeTabId,
    });
  }

  get active() {
    return this.activeTabId === this.portManager.clientId;
  }
}
