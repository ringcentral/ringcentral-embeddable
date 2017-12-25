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

  async _handleCallbackUri(callbackUri, refresh = false) {
    try {
      const query = parseCallbackUri(callbackUri);
      if (refresh) {
        await this._refreshWithCallbackQuery(query);
      } else {
        await this._loginWithCallbackQuery(query);
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
    if (this._auth.isImplicit && this._auth.loggedIn) {
      this._createImplicitRefreshTimeout();
    }
  }

  async _loginWithCallbackQuery(query) {
    if (!(query.code || query.access_token)) {
      return;
    }
    await this._auth.login({
      code: query.code,
      accessToken: query.access_token,
      expiresIn: query.expires_in,
      endpointId: query.endpoint_id,
      redirectUri: this.redirectUri,
      tokenType: query.token_type,
    });
  }

  async _refreshWithCallbackQuery(query) {
    if (!query.access_token) {
      return;
    }
    await this._auth.refreshImplicitToken({
      tokenType: query.token_type,
      accessToken: query.access_token,
      expiresIn: query.expires_in,
      endpointId: query.endpoint_id,
    });
  }

  _createImplicitRefreshTimeout() {
    if (this._implicitRefreshTimeoutId) {
      clearTimeout(this._implicitRefreshTimeoutId);
    }
    const authData = this._client.service.platform().auth().data();
    const refreshTokenExpiresIn = authData.refresh_token_expires_in;
    if (!refreshTokenExpiresIn) {
      return;
    }
    const refreshTokenTimeoutTime = (parseInt(refreshTokenExpiresIn, 10) * 1000) / 3;
    if (refreshTokenTimeoutTime < 2000) {
      return;
    }
    this._implicitRefreshTimeoutId = setTimeout(() => {
      this._createImplicitRefreshIframe();
      this._implicitRefreshTimeoutId = null;
    }, refreshTokenTimeoutTime);
  }

  _createImplicitRefreshIframe() {
    this._clearImplicitRefreshIframe();
    this._implicitRefreshFrame = document.createElement('iframe');
    this._implicitRefreshFrame.src = this.implictRefreshOAuthUri;
    this._implicitRefreshFrame.style.display = 'none';
    document.body.appendChild(this._implicitRefreshFrame);
    this._implictitRefreshCallBack = ({ origin, data }) => {
      const { refreshCallbackUri } = data;
      if (refreshCallbackUri && this._auth.loggedIn) {
        // console.log(refreshCallbackUri);
        this._handleCallbackUri(refreshCallbackUri, true);
        this._clearImplicitRefreshIframe();
      }
    };
    window.addEventListener('message', this._implictitRefreshCallBack);
  }

  _clearImplicitRefreshIframe() {
    if (this._implicitRefreshFrame) {
      document.body.removeChild(this._implicitRefreshFrame);
      this._implicitRefreshFrame = null;
      window.removeEventListener('message', this._implictitRefreshCallBack);
      this._callbackHandler = null;
    }
  }

  get implictRefreshOAuthUri() {
    return `${this._auth.getLoginUrl({
      redirectUri: this.redirectUri,
      brandId: this._brand.id,
      state: btoa(Date.now()),
      display: 'page',
      prompt: 'none',
      implicit: this._auth.isImplicit,
    })}`;
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
