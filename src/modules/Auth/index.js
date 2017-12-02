import { Module } from 'ringcentral-integration/lib/di';
import Auth from 'ringcentral-integration/modules/Auth';
import authMessages from 'ringcentral-integration/modules/Auth/authMessages';

@Module({
  deps: [
    'Client',
    'Alert',
    'Brand',
    'Locale',
    'TabManager',
    'Environment',
    { dep: 'AuthOptions', optional: true }
  ]
})
export default class ImplicitAuth extends Auth {
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
