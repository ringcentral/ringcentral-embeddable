import {
  RingCentralExtensions as RingCentralExtensionsBase,
  Auth,
  Client,
  RingCentralExtensionsOptions,
} from '@ringcentral-integration/micro-auth/src/app/services';
import {
  injectable,
  optional,
  StoragePlugin,
  PortManager,
  delegate,
} from '@ringcentral-integration/next-core';
import { SleepDetector } from '@ringcentral-integration/micro-core/src/app/services';

type RingCentralExtensionsInternals = {
  _exposeConnectionEvents(): void;
  _installWebSocketExtension(): Promise<void>;
  _webSocketExtension: {
    rc?: unknown;
    recover(): Promise<void>;
    wsTokenExpiresAt: number;
  };
};

@injectable({
  name: 'RingCentralExtensions',
})
export class RingCentralExtensions extends RingCentralExtensionsBase {
  constructor(
    protected _auth: Auth,
    protected _client: Client,
    protected _storage: StoragePlugin,
    protected _portManager: PortManager,
    @optional() protected _sleepDetector?: SleepDetector,
    @optional('RingCentralExtensionsOptions')
    protected _ringCentralExtensionsOptions?: RingCentralExtensionsOptions,
  ) {
    super(_auth, _client, _storage, _portManager, _sleepDetector, _ringCentralExtensionsOptions);
  }

  @delegate('server')
  override async recoverWebSocketConnection() {
    if (!this.ready) {
      return;
    }
    if (!this._auth.loggedIn) {
      return;
    }
    // detect if not yet installed
    const internals = this as unknown as RingCentralExtensionsInternals;
    if (!internals._webSocketExtension.rc) {
      // install and establish connection
      await internals._installWebSocketExtension();
    } else {
      // recover directly
      try {
        await internals._webSocketExtension.recover();
      } catch (error) {
        if (
          typeof error === 'object' &&
          error !== null &&
          'wsgError' in error
        ) {
          this.logger.warn('WebSocket connection error, resetting ws token');
          // TODO: fix in widget lib, reset ws token, and try again
          internals._webSocketExtension.wsTokenExpiresAt = 0;
          await internals._webSocketExtension.recover();
        }
      }
    }
    internals._exposeConnectionEvents();
  }
}
