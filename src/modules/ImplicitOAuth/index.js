import { Module } from 'ringcentral-integration/lib/di';
import ProxyFrameOAuth from 'ringcentral-widgets/modules/ProxyFrameOAuth';
import authMessages from 'ringcentral-widgets/lib/OAuthBase/oAuthMessages';
import qs from 'qs';

import authErrors from './authErrors';
import parseCallbackUri from '../../lib/parseUri';

@Module({
  name: 'ImplicitOAuth',
  deps: [
    { dep: 'ImplicitOAuthOptions', optional: true },
  ],
})
export default class ImplicitOAuth extends ProxyFrameOAuth {
  _callbackHandler = async ({ origin, data }) => {
    // TODO origin check
    if (data) {
      const {
        callbackUri,
        proxyLoaded,
        fromLocalStorage,
        popWindowError,
      } = data;
      if (popWindowError) {
        this._alert.danger({
          message: authErrors.popWindowError,
          ttl: 0,
        });
      }
      if (
        callbackUri &&
        (
          fromLocalStorage !== true ||
          (!this._tabManager || this._tabManager.active)
        )
      ) {
        this._handleCallbackUri(callbackUri);
      } else if (proxyLoaded) {
        clearTimeout(this._retryTimeoutId);
        this._retryTimeoutId = null;
        this.store.dispatch({
          type: this.actionTypes.setupOAuth,
        });
      }
    }
  };

  async _handleCallbackUri(callbackUri) {
    try {
      const query = parseCallbackUri(callbackUri);
      if (query.code || query.access_token) {
        await this._auth.login({
          code: query.code,
          accessToken: query.access_token,
          expiresIn: query.expires_in,
          endpointId: query.endpoint_id,
          redirectUri: this.redirectUri,
          tokenType: query.token_type,
        });
      }
    } catch (error) {
      let message;
      switch (error.message) {
        case 'invalid_request':
        case 'unauthorized_client':
        case 'access_denied':
        case 'unsupported_response_type':
        case 'invalid_scope':
          message = authMessages.accessDenied;
          break;
        case 'server_error':
        case 'temporarily_unavailable':
        default:
          message = authMessages.internalError;
          break;
      }

      this._alert.danger({
        message,
        payload: error,
      });
    }
  }

  get oAuthUri() {
    const extendedQuery = qs.stringify({
      force: true,
      localeId: this._locale.currentLocale,
      ui_options: 'hide_remember_me hide_tos',
    });
    return `${this._auth.getLoginUrl({
      redirectUri: this.redirectUri,
      brandId: this._brand.id,
      state: btoa(Date.now()),
      display: 'page',
      implicit: this._auth.isImplicit,
    })}&${extendedQuery}`;
  }

  get name() {
    return 'ImplicitOAuth';
  }
}
