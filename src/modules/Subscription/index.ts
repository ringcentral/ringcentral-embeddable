import { Module } from '@ringcentral-integration/commons/lib/di';

import {
  RcModuleV2,
  state,
  action,
  watch,
} from '@ringcentral-integration/core';
import type { MessageBase } from '@ringcentral-integration/commons/modules/Subscription/Subscription.interface';

@Module({
  name: 'GenericSubscription',
  deps: [
    'Auth',
    'WebSocketReadyController',
    'PubnubReadyController',
    'PubnubSubscription',
    'WebSocketSubscription',
  ],
})
export class GenericSubscription extends RcModuleV2 {
  constructor(deps) {
    super({
      deps,
    });
    this._ignoreModuleReadiness(deps.webSocketReadyController);
    this._ignoreModuleReadiness(deps.pubnubReadyController);
    this._ignoreModuleReadiness(deps.pubnubSubscription);
    this._ignoreModuleReadiness(deps.webSocketSubscription);
  }

  onInitOnce() {
    const appScope = this._deps.auth.token?.scope ?? '';
    if (appScope.indexOf('SubscriptionWebSocket') > -1) {
      this._deps.webSocketReadyController.setReady();
      this.setType('WebSocket');
      watch(
        this,
        () => this._deps.webSocketSubscription.message,
        (message) => {
          this.setMessage(message);
        },
      );
    } else {
      this._deps.pubnubReadyController.setReady();
      this.setType('Pubnub');
      watch(
        this,
        () => this._deps.pubnubSubscription.message,
        (message) => {
          this.setMessage(message);
        },
      );
      console.warn('PubnubSubscription is deprecated, please use WebSocketsSubscription instead.');
    }
  }

  override _shouldInit() {
    return super._shouldInit() && this._deps.auth.loggedIn;
  }

  @state
  message: MessageBase = null;

  @state
  type = null;

  get ready() {
    if (!this.type) {
      return false;
    }
    if (this.type === 'WebSocket') {
      return this._deps.webSocketSubscription.ready;
    }
    return this._deps.pubnubSubscription.ready;
  }

  @action
  setType(type: string) {
    this.type = type;
  }

  @action
  setMessage(message: MessageBase) {
    this.message = message;
  }

  async subscribe(events = []) {
    if (!this.type) {
      return;
    }
    if (this.type === 'WebSocket') {
      return this._deps.webSocketSubscription.subscribe(events);
    }
    return this._deps.pubnubSubscription.subscribe(events);
  }

  async unsubscribe(events = []) {
    if (!this.type) {
      return;
    }
    if (this.type === 'WebSocket') {
      return this._deps.webSocketSubscription.unsubscribe(events);
    }
    return this._deps.pubnubSubscription.unsubscribe(events);
  }

  get filters() {
    if (!this.type) {
      return [];
    }
    if (this.type === 'WebSocket') {
      return this._deps.webSocketSubscription.filters;
    }
    return this._deps.pubnubSubscription.filters;
  }

  get onlyOneTabConnected() {
    if (this.type === 'WebSocket') {
      return this._deps.webSocketSubscription.onlyOneTabConnected;
    }
    return false
  }

  get subscriptionStatus() {
    if (!this.type) {
      return null;
    }
    if (this.type === 'WebSocket') {
      return this._deps.webSocketSubscription.subscriptionStatus;
    }
    return this._deps.pubnubSubscription.subscriptionStatus;
  }

  get cachedSubscription() {
    if (!this.type) {
      return null;
    }
    if (this.type === 'WebSocket') {
      return this._deps.webSocketSubscription.cachedSubscription;
    }
    return this._deps.pubnubSubscription.cachedSubscription;
  }

  get subscriptionInfo() {
    if (!this.type) {
      return null;
    }
    if (this.type === 'WebSocket') {
      return this._deps.webSocketSubscription.subscriptionInfo;
    }
    return this._deps.pubnubSubscription.subscriptionInfo;
  }

  get subscriptionChannel() {
    if (!this.type) {
      return null;
    }
    if (this.type === 'WebSocket') {
      return this._deps.webSocketSubscription.subscriptionChannel;
    }
    return this._deps.pubnubSubscription.subscriptionChannel;
  }
}