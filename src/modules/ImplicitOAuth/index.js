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
  constructor(options) {
    super(options);
    this._loggedIn = false;
  }

  initialize() {
    this.store.subscribe(() => this._onStateChange());
    this._checkGrantType();
  }

  async _checkGrantType() {
    try {
      const response = await fetch(this.oAuthUri);
      if (response.status === 400 && !response.redirected) {
        console.error(
`Grant type or redirect uri of this app is invalid, \
please use appKey with ${this._auth.isImplicit ? 'implicit flow' : 'authorization code'} grant \
or add '${this.redirectUri}' to your app in RingCentral Platform Wesite.`
        );
      }
    } catch (error) {
      //
    }
  }

  _onStateChange() {
    super._onStateChange();
    if (this._auth.loggedIn !== this._loggedIn) {
      this._loggedIn = this._auth.loggedIn;
      if (this._loggedIn && this._auth.isImplicit) {
        console.log('new login, start refresh token timeout');
        this._createImplicitRefreshTimeout();
      }
      if (!this._loggedIn && this._auth.isImplicit) {
        this._clearImplicitRefreshIframe();
        if (this._implicitRefreshTimeoutId) {
          clearTimeout(this._implicitRefreshTimeoutId);
        }
      }
    }
  }

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
      if (query.error && query.error_description) {
        this._alert.danger({
          message: authErrors.oAuthCallBackError,
          payload: {
            error: query.error,
            description: query.error_description,
          },
          ttl: 0,
        });
        return;
      }
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
    const authData = this._auth.token;
    const refreshTokenExpiresIn = authData.expiresIn;
    const expireTime = authData.expireTime;
    if (!refreshTokenExpiresIn || !expireTime) {
      return;
    }
    let refreshTokenTimeoutTime = (parseInt(refreshTokenExpiresIn, 10) * 1000) / 3;
    if (refreshTokenTimeoutTime + Date.now() > expireTime) {
      refreshTokenTimeoutTime = expireTime - Date.now() - 5000;
      if (refreshTokenTimeoutTime < 0) {
        return;
      }
    }
    this._implicitRefreshTimeoutId = setTimeout(() => {
      if (!this._auth.loggedIn) {
        return;
      }
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
