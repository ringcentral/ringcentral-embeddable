import qs from 'qs';
import Auth from 'ringcentral-integration/modules/Auth';
import authMessages from 'ringcentral-integration/modules/Auth/authMessages';
import authErrors from './authErrors';
import parseCallbackUri from '../../lib/parseUri';

export default class ImplicitAuth extends Auth {
  _createProxyFrame = (onLogin) => {
    this._proxyFrame = document.createElement('iframe');
    this._proxyFrame.src = this.proxyUri;
    this._proxyFrame.style.display = 'none';

    document.body.appendChild(this._proxyFrame);
    this._callbackHandler = async ({ origin, data }) => {
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
          try {
            const query = parseCallbackUri(callbackUri);
            if (query.code || query.access_token) {
              await this.login({
                code: query.code,
                accessToken: query.access_token,
                expiresIn: query.expires_in,
                endpointId: query.endpoint_id,
                redirectUri: this.redirectUri,
                tokenType: query.token_type,
              });
              if (typeof onLogin === 'function') {
                onLogin();
              }
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
        } else if (proxyLoaded) {
          clearTimeout(this._retryTimeoutId);
          this._retryTimeoutId = null;
          this.store.dispatch({
            type: this.actionTypes.proxyLoaded,
          });
        }
      }
    };
    window.addEventListener('message', this._callbackHandler);
    this._retryTimeoutId = setTimeout(() => {
      this._retrySetupProxyFrame(onLogin);
    }, this._defaultProxyRetry);
  }

  /**
   * @function
   * @param {String} options.redirectUri
   * @param {String} options.brandId
   * @param {Boolean} options.force
   * @return {String}
   * @description get OAuth page url
   */
  getLoginUrl({ redirectUri, state, brandId, display, prompt, force, implicit = false }) {
    return `${this._client.service.platform().loginUrl({
      redirectUri,
      state,
      brandId,
      display,
      prompt,
      implicit,
    })}${force ? '&force' : ''}`;
  }

  openOAuthPage() {
    if (this.proxyLoaded) {
      this._proxyFrame.contentWindow.postMessage({
        oAuthUri: this._getOAuthUri(),
      }, '*');
    }
  }

  _getOAuthUri() {
    const extendedQuery = qs.stringify({
      force: true,
      localeId: this._locale.currentLocale,
      ui_options: 'hide_remember_me hide_tos',
    });
    return `${this.getLoginUrl({
      redirectUri: this.redirectUri,
      brandId: this._brand.id,
      state: btoa(Date.now()),
      display: 'page',
      implicit: this.isImplicit,
    })}&${extendedQuery}`;
  }

  /**
   * @function
   * @param {String} options.username
   * @param {String} options.password
   * @param {String} options.extension
   * @param {Booleal|Number} options.remember
   * @param {String} params.code,
   * @param {String} params.redirectUri,
   * @return {Promise}
   * @description Login either with username/password or with authorization code
   */
  async login({
    username,
    password,
    extension,
    remember,
    code,
    redirectUri,
    accessToken,
    expiresIn,
    endpointId,
    tokenType
  }) {
    this.store.dispatch({
      type: this.actionTypes.login,
    });
    let ownerId;
    if (accessToken) {
      this._client.service.platform().auth().setData({
        token_type: tokenType,
        access_token: accessToken,
        expires_in: expiresIn,
      });
      const extensionData = await this._client.account().extension().get();
      ownerId = extensionData.id;
    }
    return this._client.service.platform().login({
      username,
      password,
      extension,
      remember,
      code,
      redirectUri,
      endpoint_id: endpointId,
      expires_in: expiresIn,
      access_token: accessToken,
      token_type: tokenType,
      owner_id: ownerId,
    });
  }

  /**
   * @function
   * @description Triggers the beforeLogoutHandlers to run
   *  and then proceed to logout from ringcentral.
   */
  async logout() {
    this.store.dispatch({
      type: this.actionTypes.beforeLogout,
    });
    const handlers = [...this._beforeLogoutHandlers];
    try {
      for (const handler of handlers) {
        const result = await (async () => handler())();
        if (result) {
          this.store.dispatch({
            type: this.actionTypes.cancelLogout,
          });
          return Promise.reject(result);
        }
      }
    } catch (error) {
      this._alert.danger({
        message: authMessages.beforeLogoutError,
        payload: error,
      });
    }
    this.store.dispatch({
      type: this.actionTypes.logout,
    });
    if (this.isImplicit) {
      this._client.service.platform()._cache.clean();
      this.store.dispatch({
        type: this.actionTypes.logoutSuccess,
      });
      return null;
    }
    return this._client.service.platform().logout();
  }

  get isImplicit() {
    return !(
      this._client.service.platform()._appSecret &&
      this._client.service.platform()._appSecret.length > 0
    );
  }
}
