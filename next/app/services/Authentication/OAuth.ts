import {
  Auth,
  Client,
  OAuth as OAuthBase,
} from '@ringcentral-integration/micro-auth/src/app/services';
import {
  Brand,
  Locale,
  Toast,
} from '@ringcentral-integration/micro-core/src/app/services';
import {
  injectable,
  optional,
  PortManager,
  RouterPlugin,
} from '@ringcentral-integration/next-core';

import type { TabManager } from '../TabManager';

import { Authentication } from './Authentication';
import type { EmbeddableOAuthOptions } from './Authentication.interface';

type AuthenticationCallbackQuery = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  endpoint_id?: string;
  code?: string;
  scope?: string;
  token_uri?: string;
  discovery_uri?: string;
  code_verifier?: string;
  jwt?: string;
};

/**
 * Restores Embeddable-specific authentication behavior around micro-auth.
 */
@injectable({
  name: 'OAuth',
})
class OAuth extends OAuthBase {
  constructor(
    client: Client,
    router: RouterPlugin,
    portManager: PortManager,
    auth: Auth,
    toast: Toast,
    locale: Locale,
    brand: Brand,
    protected _authentication: Authentication,
    @optional('TabManager') tabManager?: TabManager,
    @optional('OAuthOptions') oAuthOptions?: EmbeddableOAuthOptions,
  ) {
    super(
      client,
      router,
      portManager,
      auth,
      toast,
      locale,
      brand,
      tabManager,
      oAuthOptions,
    );
  }

  protected override async onInitOnce(): Promise<void> {
    await this._loginFromOptions();
  }

  protected override async _loginWithCallbackQuery(
    query: AuthenticationCallbackQuery,
  ): Promise<void> {
    if (this._embeddableOptions.authProxy) {
      await this._authentication.completeAuthProxyLogin();
      return;
    }
    if (query.jwt) {
      await this._authentication.loginWithJwt(query.jwt);
      return;
    }
    if (query.code && query.code_verifier) {
      await this._authentication.loginWithAuthorizationCode({
        code: query.code,
        codeVerifier: query.code_verifier,
        redirectUri: this.redirectUri,
      });
      return;
    }
    await super._loginWithCallbackQuery(query);
  }

  override async openOAuthPage(): Promise<void> {
    if (!this._embeddableOptions.disableLoginPopup) {
      await super.openOAuthPage();
      return;
    }
    if (!this.oAuthReady) {
      return;
    }

    await this._client.checkLoginUrlWithDiscovery();
    const oAuthUri = await this.getOAuthUri();
    window.parent.postMessage(
      {
        type: 'rc-login-popup-notify',
        oAuthUri,
      },
      '*',
    );
  }

  private get _embeddableOptions(): EmbeddableOAuthOptions {
    return this._oAuthOptions ?? {};
  }

  private async _loginFromOptions(): Promise<void> {
    const {
      authorizationCode,
      authorizationCodeVerifier,
      externalAuthId,
      jwt,
    } = this._embeddableOptions;
    if (!authorizationCode && !jwt) {
      return;
    }
    if (
      !this._auth.notLoggedIn &&
      (!externalAuthId || externalAuthId === this._storedExternalAuthId)
    ) {
      return;
    }

    try {
      if (authorizationCode) {
        await this._authentication.loginWithAuthorizationCode({
          code: authorizationCode,
          codeVerifier: authorizationCodeVerifier,
          redirectUri: this.redirectUri,
        });
      } else if (jwt) {
        await this._authentication.loginWithJwt(jwt);
      }
      this._storedExternalAuthId = externalAuthId ?? '';
    } catch (error) {
      this.logger.error('Automatic authentication failed', error);
    }
  }

  private get _storedExternalAuthId(): string | null {
    try {
      return window.localStorage.getItem(
        `${this._embeddableOptions.prefix}-external-auth-id`,
      );
    } catch (error) {
      this.logger.warn(
        'Unable to read external authentication identity',
        error,
      );
      return null;
    }
  }

  private set _storedExternalAuthId(externalAuthId: string) {
    try {
      window.localStorage.setItem(
        `${this._embeddableOptions.prefix}-external-auth-id`,
        externalAuthId,
      );
    } catch (error) {
      this.logger.warn(
        'Unable to persist external authentication identity',
        error,
      );
    }
  }
}

export { OAuth, OAuth as EmbeddableOAuth };
