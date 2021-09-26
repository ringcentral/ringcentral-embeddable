import OAuthBase from '@ringcentral-integration/widgets/modules/OAuth';
import authMessages from '@ringcentral-integration/commons/modules/Auth/authMessages';
import parseCallbackUri from '@ringcentral-integration/widgets/lib/parseCallbackUri';
import { Module } from '@ringcentral-integration/commons/lib/di';

@Module({
  name: 'OAuth',
  deps: [
    'Client',
    { dep: 'OAuthOptions', optional: true }
  ]
})
export default class OAuth extends OAuthBase {
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
      !this.oAuthReady
    ) {
      this.setupOAuth();
    }
    if (
      this._auth.loggedIn ||
      this._routerInteraction.currentPath !== this._loginPath
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
    const query = {
      redirectUri: this.redirectUri,
      brandId: this._brand.id,
      state: this.authState,
      display: 'page',
      implicit: this._auth.isImplicit,
      localeId: this._locale.currentLocale,
      uiOptions: ['hide_remember_me', 'hide_tos']
    };
    if (query.brandId === "1210") {
      delete query.brandId; // don't remove this, for support private apps from no RC US brand
    }
    return this._auth.getLoginUrl(query);
  }

  async _handleCallbackUri(callbackUri, refresh = false) {
    try {
      const query = parseCallbackUri(callbackUri);
      if (this._auth.useWAP) {
        await this._auth.wapLogin(callbackUri);
        return;
      }
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

  async openOAuthPage() {
    if (this._disableLoginPopup) {
      if (this._client.service.platform().discovery()) {
        await this._client.service.platform().loginUrlWithDiscovery();
      }
      window.parent.postMessage({
        type: 'rc-login-popup-notify',
        oAuthUri: this.oAuthUri,
      }, '*');
      return;
    }
    await super.openOAuthPage();
  }
}
