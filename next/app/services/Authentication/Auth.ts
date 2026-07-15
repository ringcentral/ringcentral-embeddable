import type { SDKConfig } from '@ringcentral-integration/commons/lib/createSdkConfig';
import {
  Analytics,
  Auth as AuthBase,
  type AuthLogoutOptions,
  Client,
  Environment,
  RateLimiter,
  type TokenInfo,
} from '@ringcentral-integration/micro-auth/src/app/services';
import {
  Locale,
  Toast,
} from '@ringcentral-integration/micro-core/src/app/services';
import type { ApiError } from '@ringcentral/sdk';
import {
  inject,
  injectable,
  optional,
  Root,
  StoragePlugin,
} from '@ringcentral-integration/next-core';

import type { EmbeddableAuthOptions } from './Auth.interface';

type AuthProxyClientInfo = {
  owner_id?: string;
  scope?: string;
  endpoint_id?: string;
};

/**
 * Adds the auth-proxy lifecycle behavior that stock micro-auth does not own.
 */
@injectable({
  name: 'Auth',
})
class Auth extends AuthBase {
  private _unbindAuthProxyEvents?: () => void;

  constructor(
    client: Client,
    toast: Toast,
    locale: Locale,
    storage: StoragePlugin,
    root: Root,
    @inject('SdkConfig') sdkConfig: SDKConfig,
    @optional() rateLimiter?: RateLimiter,
    @optional() environment?: Environment,
    @optional() analytics?: Analytics,
    @optional('AuthOptions') authOptions?: EmbeddableAuthOptions,
  ) {
    super(
      client,
      toast,
      locale,
      storage,
      root,
      sdkConfig,
      rateLimiter,
      environment,
      analytics,
      authOptions,
    );
  }

  override async onInit(): Promise<void> {
    await super.onInit();
    this._bindAuthProxyEvents();
  }

  override async fetchToken(): Promise<void> {
    if (!this.useAuthProxy) {
      await super.fetchToken();
      return;
    }

    if (!this._loggedIn) {
      this.setInitLogin({
        loggedIn: false,
        token: {},
      });
      return;
    }

    const platform = this._client.service.platform();
    let token = (await platform.auth().data()) as TokenInfo;
    if (!token.owner_id) {
      const response = await platform.get('/restapi/v1.0/client-info');
      const clientInfo = (await response.json()) as AuthProxyClientInfo;
      await platform.auth().setData(clientInfo);
      token = {
        ...token,
        ...clientInfo,
      };
    }
    this.setInitLogin({
      loggedIn: true,
      token,
    });
  }

  override async logout(
    options: AuthLogoutOptions = { reason: 'Unknown' },
  ): Promise<void> {
    if (this.useAuthProxy) {
      const platform = this._client.service.platform();
      platform.logout = async (): Promise<Response> => {
        try {
          const response = await platform.post('/logout');
          await this._client.service.cache().clean();
          platform.emit(platform.events.logoutSuccess, response);
          return response;
        } catch (error) {
          platform.emit(platform.events.logoutError, error);
          throw error;
        }
      };
    }
    await super.logout(options);
  }

  get useAuthProxy(): boolean {
    return (
      (this._authOptions as EmbeddableAuthOptions | undefined)?.authProxy ??
      false
    );
  }

  private _bindAuthProxyEvents(): void {
    this._unbindAuthProxyEvents?.();
    if (!this.useAuthProxy) {
      return;
    }

    const client = this._client.service.client();
    const onRequestError = (error: ApiError): void => {
      if (error.response?.status === 401 && this.loggedIn) {
        void this.logout({ reason: 'Request error' });
      }
    };
    client.addListener(client.events.requestError, onRequestError);
    this._unbindAuthProxyEvents = () => {
      client.removeListener(client.events.requestError, onRequestError);
    };
  }
}

export { Auth, Auth as EmbeddableAuth };
