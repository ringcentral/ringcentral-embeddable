import ProxyFrameOAuth from 'ringcentral-widgets/modules/ProxyFrameOAuth';
import authMessages from 'ringcentral-integration/modules/Auth/authMessages';
import parseCallbackUri from 'ringcentral-widgets/lib/parseCallbackUri';
import { Module } from 'ringcentral-integration/lib/di';
import qs from 'qs';

@Module({
  name: 'OAuth',
  deps: [
    { dep: 'OAuthOptions', optional: true }
  ]
})
export default class OAuth extends ProxyFrameOAuth {
  constructor({
    authorizationCode,
    disableLoginPopup = false,
    ...options
  }) {
    super(options);
    this._authorizationCode = authorizationCode;
    this._disableLoginPopup = disableLoginPopup;
  }

  async _onStateChange() {
    if (
      this.pending &&
      (
        this._auth.ready &&
        this._locale.ready &&
        this._alert.ready &&
        (!this._tabManager || this._tabManager.ready)
      )
    ) {
      this.store.dispatch({
        type: this.actionTypes.init,
      });
      if (!this._auth.loggedIn && this._authorizationCode) {
        await this._slientLoginWithCode()
      }
      this.store.dispatch({
        type: this.actionTypes.initSuccess,
      });
    }
    if (
      this.ready &&
      !this._auth.loggedIn &&
      this._routerInteraction.currentPath === this._loginPath &&
      !this.oAuthReady &&
      !this._proxyFrame
    ) {
      this.setupOAuth();
    }
    if (
      this._proxyFrame &&
      (this._auth.loggedIn ||
        this._routerInteraction.currentPath !== this._loginPath)
    ) {
      this.destroyOAuth();
    }
  }

  async _slientLoginWithCode() {
    try {
      await this._loginWithCallbackQuery({ code: this._authorizationCode });
    } catch (e) {
      console.error(e);
    }
  }

  get oAuthUri() {
    const extendedQuery = qs.stringify({
      localeId: this._locale.currentLocale,
      ui_options: 'hide_remember_me hide_tos',
    });
    return `${this._auth.getLoginUrl({
      redirectUri: this.redirectUri,
      // brandId: this._brand.id,
      state: btoa(Date.now()),
      display: 'page',
      implicit: this._auth.isImplicit,
    })}&${extendedQuery}`;
  }

  async _handleCallbackUri(callbackUri, refresh = false) {
    try {
      if (this._auth.useWAP) {
        await this._auth.wapLogin(callbackUri);
        return;
      }
      const query = parseCallbackUri(callbackUri);
      if (refresh) {
        await this._refreshWithCallbackQuery(query);
      } else {
        await this._loginWithCallbackQuery(query);
      }
    } catch (error) {
      console.error('oauth error: ', error);
      if (error && error.error_description) {
        console.error('oauth error description: ', error.error_description);
      }
      let message;
      switch (error.message) {
        case 'invalid_request':
        case 'unauthorized_client':
        case 'unsupported_response_type':
        case 'invalid_scope':
        case 'login_required':
        case 'interaction_required':
        case 'access_denied':
          message = authMessages.accessDenied;
          break;
        case 'server_error':
        case 'temporarily_unavailable':
        default:
          message = authMessages.internalError;
          break;
      }
      if (message) {
        this._alert.danger({
          message,
          payload: error,
        });
      }
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
      scope: query.scope,
    });
  }

  async openOAuthPage() {
    if (this._disableLoginPopup) {
      window.parent.postMessage({
        type: 'rc-login-popup-notify',
        oAuthUri: this.oAuthUri,
      }, '*');
      return;
    }
    await super.openOAuthPage();
  }
}
