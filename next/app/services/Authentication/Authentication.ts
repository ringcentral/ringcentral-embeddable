import {
  Auth,
  Client,
} from '@ringcentral-integration/micro-auth/src/app/services';
import {
  delegate,
  injectable,
  RcModule,
} from '@ringcentral-integration/next-core';

/**
 * Performs embeddable authentication exchanges in the shared-app server.
 */
@injectable({
  name: 'Authentication',
})
export class Authentication extends RcModule {
  constructor(protected _auth: Auth, protected _client: Client) {
    super();
  }

  /**
   * Exchanges an authorization code, including an externally supplied PKCE
   * verifier when the host owns the authorization window.
   */
  @delegate('server')
  async loginWithAuthorizationCode({
    code,
    codeVerifier,
    redirectUri,
  }: {
    code: string;
    codeVerifier?: string;
    redirectUri: string;
  }): Promise<void> {
    if (!codeVerifier) {
      await this._auth.login({
        code,
        redirectUri,
      });
      return;
    }

    this._auth.setLogin();
    await this._client.service.platform().login({
      code,
      code_verifier: codeVerifier,
      redirect_uri: redirectUri,
    });
  }

  /**
   * Exchanges a JWT without exposing the SDK client outside the server.
   */
  @delegate('server')
  async loginWithJwt(jwt: string): Promise<void> {
    this._auth.setLogin();
    await this._client.service.platform().login({ jwt });
  }

  /**
   * Completes a successful auth-proxy callback by hydrating SDK token identity.
   */
  @delegate('server')
  async completeAuthProxyLogin(): Promise<void> {
    const platform = this._client.service.platform();
    const response = await platform.get('/restapi/v1.0/client-info');
    const clientInfo = (await response.json()) as {
      owner_id?: string;
      scope?: string;
      endpoint_id?: string;
    };
    await platform.auth().setData(clientInfo);
    platform.emit(platform.events.loginSuccess, response);
  }
}
