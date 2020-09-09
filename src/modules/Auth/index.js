import Auth from 'ringcentral-integration/modules/Auth';
import { Module } from 'ringcentral-integration/lib/di';
import loginStatus from 'ringcentral-integration/modules/Auth/loginStatus';

@Module({
  name: 'NewAuth',
  deps: [{ dep: 'AuthOptions', optional: true }]
})
export default class NewAuth extends Auth {
  constructor(options) {
    super(options);
    this._useWAP = !!options.authProxy;
    // this.addBeforeLogoutHandler(this._beforeLogoutHandler);
  }

  // _beforeLogoutHandler = async () => {
  //   const apiServer = this._client.service.platform()._server;
  //   let oAuthDomain = 'ringcentral.com';
  //   if (apiServer.indexOf('devtest') > -1) {
  //     oAuthDomain = 'devtest.ringcentral.com';
  //   }
  //   try {
  //     await fetch(
  //       `https://service.${oAuthDomain}/mobile/api/proxy.html?cmd=login.logout&_=${Date.now()}`,
  //       { credentials: 'include' }
  //     );
  //   } catch (e) {
  //     console.error(e);
  //   }
  //   try {
  //     await fetch(
  //       `https://login.${oAuthDomain}/api/logout?_=${Date.now()}`,
  //       { credentials: 'include' }
  //     );
  //   } catch (e) {
  //     console.error(e);
  //   }
  // }

  _bindEvents() {
    super._bindEvents();
    if (this._unbindAdditionEvents) this._unbindAdditionEvents();
    // const platform = this._client.service.platform();
    const client = this._client.service.client();
    // const onLoginFailed = (error) => {
    //   console.error(error);
    //   this._beforeLogoutHandler();
    // };
    const onRequestUnauthorized = (error) => {
      if (this.useWAP && error.response && error.response.status === 401) {
        if (this.state.loginStatus === loginStatus.loggedIn) {
          this.logout();
        }
      }
    }
    // platform.addListener(platform.events.loginError, onLoginFailed);
    client.addListener(client.events.requestError, onRequestUnauthorized);
    this._unbindAdditionEvents = () => {
      // platform.removeListener(platform.events.loginError, onLoginFailed);
      client.removeListener(client.events.requestError, onRequestUnauthorized);
    };
  }

  async logout(options) {
    if (this.useWAP) {
      const platform = this._client.service.platform();
      platform.logout = async () => {
        try {
          const res = await platform.post(platform._revokeEndpoint);
          platform.emit(platform.events.logoutSuccess, res);
        } catch (e) {
          platform.emit(platform.events.logoutError, e);
          throw e;
        }
      };
    }
    return super.logout(options);
  }

  async wapLogin(callbackUri) {
    if (callbackUri.indexOf('error') === -1) {
      const platform = this._client.service.platform();
      const response = await platform.get('/restapi/v1.0/client-info');
      const clientInfo = await response.json();
      await platform.auth().setData({
        owner_id: clientInfo.owner_id,
        scope: clientInfo.scope,
        endpoint_id: clientInfo.endpoint_id,
      })
      platform.emit(platform.events.loginSuccess);
    }
  }

  get ownerId() {
    return super.ownerId && super.ownerId.toString();
  }

  get useWAP() {
    return this._useWAP;
  }
}
