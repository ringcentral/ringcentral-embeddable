import url from 'url';
import qs from 'qs';
import Auth from 'ringcentral-integration/modules/Auth';
import authMessages from 'ringcentral-integration/modules/Auth/authMessages';

function parseCallbackUri(callbackUri) {
  const { query, hash } = url.parse(callbackUri, true);
  const hashObject = qs.parse(hash.replace(/^#/, ''));
  if (query.error) {
    const error = new Error(query.error);
    for (const key in query) {
      if (query::Object.prototype.hasOwnProperty(key)) {
        error[key] = query[key];
      }
    }
    throw error;
  }

  return {
    ...query,
    ...hashObject,
  };
}

function getImplicitOwnerId() {
  return Math.round(Math.random() * 1e10).toString();
}

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
        } = data;
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
      implicit: this._isImplicit(),
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
      owner_id: getImplicitOwnerId(),
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
    if (this._isImplicit()) {
      this._client.service.platform()._cache.clean();
      this.store.dispatch({
        type: this.actionTypes.logoutSuccess,
      });
      return null;
    }
    return this._client.service.platform().logout();
  }

  _isImplicit() {
    return !(
      this._client.service.platform()._appSecret &&
      this._client.service.platform()._appSecret.length > 0
    );
  }
}
