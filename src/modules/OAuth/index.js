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
    authMode,
    ...options
  }) {
    super(options);
    this._authMode = authMode;
  }

  async setupOAuth() {
    await super.setupOAuth();
    if (this.authMode === 'sso') {
      this._createSSOIframe();
    }
  }

  async destroyOAuth() {
    await super.destroyOAuth();
    if (this.authMode === 'sso') {
      this._clearSSOIframe();
    }
  }

  _createSSOIframe() {
    this._clearSSOIframe();
    this._ssoFrame = document.createElement('iframe');
    this._ssoFrame.src = this.implictRefreshOAuthUri;
    this._ssoFrame.name = 'SSOIframe';
    this._ssoFrame.style.zIndex = 100;
    this._ssoFrame.style.display = 'block';
    this._ssoFrame.style.width = '100%';
    this._ssoFrame.style.height = '100%';
    this._ssoFrame.style.position = 'absolute';
    this._ssoFrame.style.background = '#ffffff';
    this._ssoFrame.style.border = 'none';
    document.body.appendChild(this._ssoFrame);
  }

  _clearSSOIframe() {
    if (this._ssoFrame) {
      document.body.removeChild(this._ssoFrame);
      this._ssoFrame = null;
    }
  }

  get oAuthUri() {
    const extendedQuery = qs.stringify({
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

  get authMode() {
    return this._authMode;
  }

  async _handleCallbackUri(callbackUri, refresh = false) {
    try {
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
          message = authMessages.accessDenied;
          break;
        case 'access_denied': {
          if (this.authMode === 'sso' && this._ssoFrame) {
            this._clearSSOIframe();
          } else {
            message = authMessages.accessDenied;
          }
          break;
        }
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
}
