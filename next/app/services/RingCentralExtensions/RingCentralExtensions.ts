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
    if (!this._webSocketExtension.rc) {
      // install and establish connection
      await this._installWebSocketExtension();
    } else {
      // recover directly
      try {
        await this._webSocketExtension.recover();
      } catch (error) {
        if (error.wsgError) {
          this.logger.warn('WebSocket connection error, resetting ws token');
          // TODO: fix in widget lib, reset ws token, and try again
          this._webSocketExtension.wsTokenExpiresAt = 0;
          await this._webSocketExtension.recover();
        }
      }
    }
    this._exposeConnectionEvents();
  }
}
