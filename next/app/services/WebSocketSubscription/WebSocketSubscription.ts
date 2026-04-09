import { injectable, optional, StoragePlugin, watch } from '@ringcentral-integration/next-core';
import {
  WebSocketSubscription as WebSocketSubscriptionBase,
  Client,
  RingCentralExtensions,
  WebSocketSubscriptionOptions,
} from '@ringcentral-integration/micro-auth/src/app/services';
import { webSocketReadyStates } from '@ringcentral-integration/micro-auth/src/app/services/RingCentralExtensions/webSocketReadyStates';

@injectable({
  name: 'WebSocketSubscription',
})
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
    watch(
      this,
      () => this._ringCentralExtensions.webSocketReadyState,
      async (wsState) => {
        if (!this.ready || !wsState) {
          return;
        }
        this._debouncedUpdateSubscription.cancel();
        if (wsState === webSocketReadyStates.ready) {
          if (
            this._ringCentralExtensions.webSocketExtension?.connectionDetails?.recoveryState === 'Failed'
          ) {
            // TODO: bugfixes in widgets lib: when websocket is failed to recover, make it as new channel
            this.logger.warn('WebSocket failed to recover, making it as new channel');
            this._clearTokens();
          }
          await this._updateSubscription();
        } else if (wsState === webSocketReadyStates.closing) {
          // when websocket is going to close, revoke subscription beforehand
          await this._revokeSubscription();
        } else {
          await this._removeSubscription();
        }
      },
    );
  }
}