import Auth from 'ringcentral-integration/modules/Auth';
import { Module } from 'ringcentral-integration/lib/di';

@Module({
  name: 'NewAuth',
  deps: []
})
export default class NewAuth extends Auth {
  constructor(options) {
    super(options);
    this.addBeforeLogoutHandler(this._beforeLogoutHandler);
  }

  _beforeLogoutHandler = async () => {
    const apiServer = this._client.service.platform()._server;
    let oAuthDomain = 'ringcentral.com';
    if (apiServer.indexOf('devtest') > -1) {
      oAuthDomain = 'devtest.ringcentral.com';
    }
    try {
      await fetch(
        `https://service.${oAuthDomain}/mobile/api/proxy.html?cmd=login.logout&_=${Date.now()}`,
        { credentials: 'include' }
      );
    } catch (e) {
      console.error(e);
    }
    try {
      await fetch(
        `https://login.${oAuthDomain}/api/logout?_=${Date.now()}`,
        { credentials: 'include' }
      );
    } catch (e) {
      console.error(e);
    }
  }

  _bindEvents() {
    super._bindEvents();
    if (this._unbindLogoutEvents) this._unbindLogoutEvents();
    const platform = this._client.service.platform();
    const onLoginFailed = (error) => {
      console.error(error);
      this._beforeLogoutHandler();
    };
    platform.addListener(platform.events.loginError, onLoginFailed);
    this._unbindLogoutEvents = () => {
      platform.removeListener(platform.events.loginError, onLoginFailed);
    };
  }

  get ownerId() {
    return super.ownerId && super.ownerId.toString();
  }

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
    tokenType,
    scope
  }) {
    this.store.dispatch({
      type: this.actionTypes.login,
    });
    let ownerId;
    if (accessToken) {
      this._client.service
        .platform()
        .auth()
        .setData({
          token_type: tokenType,
          access_token: accessToken,
          expires_in: expiresIn,
          refresh_token_expires_in: expiresIn,
          scope,
        });
      const extensionData = await this._client
        .account()
        .extension()
        .get();
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
}
