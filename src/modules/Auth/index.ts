import { Auth as AuthBase } from '@ringcentral-integration/commons/modules/Auth';
import { Module } from '@ringcentral-integration/commons/lib/di';
import { loginStatus } from '@ringcentral-integration/commons/modules/Auth/loginStatus';

@Module({
  name: 'NewAuth',
  deps: [{ dep: 'AuthOptions', optional: true }]
})
export class Auth extends AuthBase {
  protected _useWAP: boolean;
  protected _unbindAdditionEvents?: () => void;

  constructor(deps) {
    super(deps);
    this._useWAP = !!deps.authOptions.authProxy;
  }

  _bindEvents() {
    super._bindEvents();
    if (this._unbindAdditionEvents) this._unbindAdditionEvents();
    const client = this._deps.client.service.client();
    const onRequestUnauthorized = (error) => {
      if (this.useWAP && error.response && error.response.status === 401) {
        if (this.loginStatus === loginStatus.loggedIn) {
          this.logout();
        }
      }
    }
    client.addListener(client.events.requestError, onRequestUnauthorized);
    this._unbindAdditionEvents = () => {
      client.removeListener(client.events.requestError, onRequestUnauthorized);
    };
  }

  override async onStateChange() {
    await super.onStateChange();
    if (
      this.ready &&
      this._deps.tabManager &&
      this._deps.tabManager.ready &&
      !this._deps.tabManager.autoMainTab &&
      this._deps.tabManager.event &&
      this._deps.tabManager.event.name === 'LOGOUT_REQUEST' &&
      this._deps.tabManager.active
    ) {
      this.logout({ fromLogoutRequest: true });
    }
  }

  async fetchToken() {
    const token = await this._getTokenFromSDK();
    this.setInitLogin({
      loggedIn: this._loggedIn,
      token,
    });
  }

  async _getTokenFromSDK() {
    const platform = this._deps.client.service.platform();
    const token = await platform.auth().data();
    if (!this.useWAP) {
      if (this._loggedIn) {
        return token;
      }
      return null;
    }
    if (token.owner_id) {
      return token;
    }
    const response = await platform.get('/restapi/v1.0/client-info');
    const clientInfo = await response.json();
    const clientData = {
      owner_id: clientInfo.owner_id,
      scope: clientInfo.scope,
      endpoint_id: clientInfo.endpoint_id,
    };
    await platform.auth().setData(clientData);
    return {
      ...token,
      ...clientData,
    };
  }

  override async logout(options = {}) {
    if (
      this._deps.tabManager &&
      !this._deps.tabManager.autoMainTab &&
      !this._deps.tabManager.active
    ) {
      if (!options.fromLogoutRequest) {
        this._deps.tabManager.send('LOGOUT_REQUEST');
      }
      return;
    }
    if (this.useWAP) {
      const platform = this._deps.client.service.platform();
      platform.logout = async () => {
        try {
          const res = await platform.post(platform._revokeEndpoint);
          await platform._cache.clean();
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
      const platform = this._deps.client.service.platform();
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

  async jwtLogin(jwt) {
    this.setLogin();
    return this._deps.client.service.platform().login({
      jwt,
    });
  }

  get ownerId() {
    return super.ownerId && super.ownerId.toString();
  }

  get useWAP() {
    return this._useWAP;
  }
}
