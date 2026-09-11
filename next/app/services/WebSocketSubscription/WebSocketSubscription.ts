import { injectable, optional, StoragePlugin, watch } from '@ringcentral-integration/next-core';
import {
  WebSocketSubscription as WebSocketSubscriptionBase,
  Client,
  RingCentralExtensions,
  WebSocketSubscriptionOptions,
} from '@ringcentral-integration/micro-auth/src/app/services';
import { webSocketReadyStates } from '@ringcentral-integration/micro-auth/src/app/services/RingCentralExtensions/webSocketReadyStates';

type WebSocketSubscriptionInternals = {
  _clearTokens(): void;
  _debouncedUpdateSubscription: { cancel(): void };
  _removeSubscription(): Promise<void>;
  _revokeSubscription(): Promise<void>;
  _updateSubscription(): Promise<void>;
};

@injectable({
  name: 'WebSocketSubscription',
})
// @ts-expect-error The recovery hook intentionally overrides a private upstream method.
export class WebSocketSubscription extends WebSocketSubscriptionBase {
  constructor(
    protected _client: Client,
    protected _storage: StoragePlugin,
    protected _ringCentralExtensions: RingCentralExtensions,
    @optional('WebSocketSubscriptionOptions')
    protected _webSocketSubscriptionOptions?: WebSocketSubscriptionOptions,
  ) {
    super(_client, _storage, _ringCentralExtensions, _webSocketSubscriptionOptions);
  }

  override async _bindEvents() {
    const internals = this as unknown as WebSocketSubscriptionInternals;
    watch(
      this,
      () => this._ringCentralExtensions.webSocketReadyState,
      async (wsState) => {
        if (!this.ready || !wsState) {
          return;
        }
        internals._debouncedUpdateSubscription.cancel();
        if (wsState === webSocketReadyStates.ready) {
          if (
            this._ringCentralExtensions.webSocketExtension?.connectionDetails?.recoveryState === 'Failed'
          ) {
            // TODO: bugfixes in widgets lib: when websocket is failed to recover, make it as new channel
            this.logger.warn('WebSocket failed to recover, making it as new channel');
            internals._clearTokens();
          }
          await internals._updateSubscription();
        } else if (wsState === webSocketReadyStates.closing) {
          // when websocket is going to close, revoke subscription beforehand
          await internals._revokeSubscription();
        } else {
          await internals._removeSubscription();
        }
      },
    );
  }
}
