import { Module } from '@ringcentral-integration/commons/lib/di';
import { RingCentralExtensions as RingCentralExtensionsBase } from '@ringcentral-integration/commons/modules/RingCentralExtensions';
import type { ApiError } from '@ringcentral/sdk';
import validateIsOffline from '@ringcentral-integration/commons/lib/validateIsOffline';

@Module({
  name: 'NewRingCentralExtensions',
  deps: []
})
export class RingCentralExtensions extends RingCentralExtensionsBase {
  // TODO: fix connection not revoked after token refresh error
  override async _bindEvents() {
    const platform = this._deps.client.service.platform();
    platform.addListener(
      platform.events.refreshError,
      async (error: ApiError) => {
        const isOffline = validateIsOffline(error.message);
        const resStatus = Number(error.response?.status);
        const refreshTokenValid =
          (isOffline || resStatus >= 500) &&
          (await platform.auth().refreshTokenValid());
        if (!refreshTokenValid) {
          if (this.isWebSocketReady && !(this.disconnectOnInactive && !this.isTabActive)) {
            try {
              await this._webSocketExtension?.revoke(true);
              this._exposeConnectionEvents();
              this._clearTokens();
            } catch (e) {
              console.error('Error while revoking connection:', e);
            }
          }
        }
        const isTokenNoFoundError =
          resStatus === 400 &&
          (await error.response?.clone().json())?.errors?.some(
            ({ errorCode = '' } = {}) => errorCode === 'OAU-213',
          );
        if (
          isTokenNoFoundError &&
          (await platform.auth().data()).refresh_token !== ''
        ) {
          // TODO: this logic should be moved to commons/Auth
          platform._cache.clean();
        }
      },
    );
    return super._bindEvents();
  }
}
