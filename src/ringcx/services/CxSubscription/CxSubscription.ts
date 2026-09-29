import {
  injectable,
  RcModule,
  PortManager,
  delegate,
} from '@ringcentral-integration/next-core';
import { EventEmitter } from 'events';

import { CxCallbackTypes } from '../CxClient/enums/callbackTypes';
import type {
  CxClientCallBackValueType,
  CxClientCallMapping,
} from '../CxClient/interfaces';
import { CxClient } from '../CxClient';
import { registerOnMainTab } from '../../utils/register-on-main-tab';

function formatSipRequest(data: any) {
  return {
    body: data?.body,
    data: data?.data,
    from: data?.from,
    fromTag: data?.fromTag,
    friendlyName: data?.friendlyName,
    to: data?.to,
    toTag: data?.toTag,
    headers: data?.headers,
    method: data?.method,
    rurl: data?.url,
    callId: data?.callId,
    type: data?.type,
    via: data?.via,
    viaBranch: data?.viaBranch,
  };
}

const SIP_REQUEST_EVENTS: readonly CxClientCallBackValueType[] = [
  CxCallbackTypes.SIP_ENDED,
  CxCallbackTypes.SIP_MUTE,
  CxCallbackTypes.SIP_RINGING,
  CxCallbackTypes.SIP_UNMUTE,
];

/**
 * CxSubscription module - Event subscription system
 * Wraps CxClient callbacks with EventEmitter for easier subscription management
 */
@injectable({
  name: 'CxSubscription',
})
class CxSubscription extends RcModule {
  protected eventEmitters = new EventEmitter();
  protected clientReady = false;
  private _boundEvents = new Set<CxClientCallBackValueType>();
  private _subscribedEvents = new Set<CxClientCallBackValueType>();

  constructor(
    protected cxClient: CxClient,
    protected portManager: PortManager,
  ) {
    super();
    registerOnMainTab(this.portManager, () => {
      this.initialize();
    });
  }

  initialize() {
    this.cxClient.addListener(CxCallbackTypes.OPEN_SOCKET, async () => {
      this.clientReady = true;
      const events = Array.from(this._subscribedEvents);
      const serverEvents = await this.getSubscribedEventsFromServer();
      await this._bindEventsToClient([...events, ...serverEvents] as string[]);
    });
    this.cxClient.addListener(CxCallbackTypes.CLOSE_SOCKET, () => {
      this.clientReady = false;
    });
  }

  /**
   * Bind a single event type to cxClient, forwarding to local eventEmitters
   */
  private _bindEventToClient(event: CxClientCallBackValueType) {
    this._subscribedEvents.add(event);
    if (this._boundEvents.has(event)) return;
    if (this.portManager.isMainTab && this.clientReady) {
      this.cxClient.on(event, (...args: any[]) => {
        if (SIP_REQUEST_EVENTS.includes(event)) {
          const data = args[0]?.data;
          this.emit(event, {
            message: args[0]?.message,
            data: data && data.request ? {
              request: data.request ? formatSipRequest(data.request) : undefined,
            } : data,
          });
          return;
        }
        this.emit(event, ...args);
      });
      this._boundEvents.add(event);
    }
  }

  @delegate('mainClient')
  private async _bindEventsToClient(events: string[]) {
    for (const event of events) {
      this._bindEventToClient(event as CxClientCallBackValueType);
    }
  }

  /**
   * Emit an event with a value
   * We transfer the event from main client to server. Other services should handle the event in server.
   */
  @delegate('server')
  async emit<T extends CxClientCallBackValueType, K extends CxClientCallMapping[T]>(
    event: T,
    ...args: K[]
  ) {
    this.eventEmitters.emit(event, ...args);
  }

  @delegate('server')
  async getSubscribedEventsFromServer() {
    // get from eventEmitters
    return Array.from(this.eventEmitters.eventNames() as CxClientCallBackValueType[]);
  }

  /**
   * Subscribe to an event
   */
  subscribe<
    T extends CxClientCallBackValueType,
    K extends CxClientCallMapping[T],
  >(event: T, listener: (data?: K) => any): this {
    this.eventEmitters.on(event, listener);
    this._bindEventsToClient([event]);
    return this;
  }

  /**
   * Subscribe to an event once
   */
  once<T extends CxClientCallBackValueType, K extends CxClientCallMapping[T]>(
    event: T,
    listener: (data?: K) => any,
  ) {
    this.eventEmitters.once(event, listener);
  }

  /**
   * Unsubscribe from an event
   */
  off<T extends CxClientCallBackValueType, K extends CxClientCallMapping[T]>(
    event: T,
    listener: (data?: K) => any,
  ) {
    this.eventEmitters.off(event, listener);
  }
}

export { CxSubscription };
