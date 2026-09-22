import { SleepDetector } from '@ringcentral-integration/micro-core/src/app/services';
import {
  injectable,
  optional,
  StoragePlugin,
  takeUntilAppDestroy,
  watch,
} from '@ringcentral-integration/next-core';
import {
  WebSocketSubscription as WebSocketSubscriptionBase,
  Client,
  RingCentralExtensions,
  WebSocketSubscriptionOptions,
} from '@ringcentral-integration/micro-auth/src/app/services';
import { webSocketReadyStates } from '@ringcentral-integration/micro-auth/src/app/services/RingCentralExtensions/webSocketReadyStates';

type RecoveredSubject = {
  next(): void;
};

type WebSocketSubscriptionInternals = {
  _clearTokens(): void;
  _debouncedUpdateSubscription: { cancel(): void };
  _removeSubscription(): Promise<void>;
  _revokeSubscription(): Promise<void>;
  _updateSubscription(): Promise<void>;
  _updateSubscriptionPromise?: Promise<void>;
  _webSocketRecovered: boolean;
  _recovered$: RecoveredSubject;
  _handleSleepDetected(): Promise<void>;
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
    @optional() protected _sleepDetector?: SleepDetector,
    @optional('WebSocketSubscriptionOptions')
    protected _webSocketSubscriptionOptions?: WebSocketSubscriptionOptions,
  ) {
    super(
      _client,
      _storage,
      _ringCentralExtensions,
      _sleepDetector,
      _webSocketSubscriptionOptions,
    );
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
          if (internals._webSocketRecovered) {
            return;
          }
          if (
            this._ringCentralExtensions.webSocketExtension?.connectionDetails
              ?.recoveryState === 'Failed'
          ) {
            // TODO: bugfixes in widgets lib: when websocket is failed to recover, make it as new channel
            this.logger.warn(
              'WebSocket failed to recover, making it as new channel',
            );
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

    this._ringCentralExtensions.webSocketRecovered$
      .pipe(takeUntilAppDestroy)
      .subscribe(async () => {
        if (!this.ready) {
          return;
        }
        internals._webSocketRecovered = true;
        await internals._updateSubscriptionPromise?.catch(() => undefined);
        await internals._revokeSubscription();
        await internals._updateSubscription();
        internals._webSocketRecovered = false;
        internals._recovered$.next();
      });

    this._sleepDetector?.detect$
      .pipe(takeUntilAppDestroy)
      .subscribe(() => {
        if (this.ready) {
          void internals._handleSleepDetected();
        }
      });
  }
}
