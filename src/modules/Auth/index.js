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
}
