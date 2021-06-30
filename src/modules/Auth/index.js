import uuid from 'uuid';
import Auth from 'ringcentral-integration/modules/Auth';
import { Module } from 'ringcentral-integration/lib/di';
import loginStatus from 'ringcentral-integration/modules/Auth/loginStatus';
import moduleStatuses from 'ringcentral-integration/enums/moduleStatuses';

const LoginStatusChangeEvent = 'loginStatusChange';

@Module({
  name: 'NewAuth',
  deps: [{ dep: 'AuthOptions', optional: true }]
})
export default class NewAuth extends Auth {
  constructor(options) {
    super(options);
    this._useWAP = !!options.authProxy;
    this._endpointIdKey = `${this.prefix}-auth-endpointId`
  }

  _bindEvents() {
    super._bindEvents();
    if (this._unbindAdditionEvents) this._unbindAdditionEvents();
    const client = this._client.service.client();
    const onRequestUnauthorized = (error) => {
      if (this.useWAP && error.response && error.response.status === 401) {
        if (this.state.loginStatus === loginStatus.loggedIn) {
          this.logout();
        }
      }
    }
    client.addListener(client.events.requestError, onRequestUnauthorized);
    this._unbindAdditionEvents = () => {
      client.removeListener(client.events.requestError, onRequestUnauthorized);
    };
  }

  initialize() {
    let loggedIn;
    this.store.subscribe(async () => {
      if (
        this.status === moduleStatuses.pending &&
        this._locale.ready &&
        (!this._tabManager || this._tabManager.ready) &&
        (!this._environment || this._environment.ready)
      ) {
        this.store.dispatch({
          type: this.actionTypes.init,
        });
        const platform = this._client.service.platform();
        loggedIn = await platform.loggedIn();
        this._bindEvents();
        this.store.dispatch({
          type: this.actionTypes.initSuccess,
          loggedIn,
          token: loggedIn ? (await this._getTokenFromSDK()) : null,
        });
      }
      if (this._tabManager && this._tabManager.ready && this.ready) {
        if (
          (loggedIn && this.loginStatus === loginStatus.notLoggedIn) ||
          (!loggedIn && this.loginStatus === loginStatus.loggedIn)
        ) {
          loggedIn = !loggedIn;
          this._tabManager.send(LoginStatusChangeEvent, loggedIn);
        } else if (
          this._tabManager.event &&
          this._tabManager.event.name === LoginStatusChangeEvent &&
          this._tabManager.event.args[0] !== loggedIn
        ) {
          /* eslint { "prefer-destructuring": 0 } */
          loggedIn = this._tabManager.event.args[0];
          this.store.dispatch({
            type: this.actionTypes.tabSync,
            loggedIn,
            token: loggedIn
              ? (await this._getTokenFromSDK())
              : null,
          });
        }
      }
      if (
        this.ready &&
        this._environment &&
        this._environment.changeCounter !== this._lastEnvironmentCounter
      ) {
        this._lastEnvironmentCounter = this._environment.changeCounter;
        this._bindEvents();
      }
    });
  }

  async _getTokenFromSDK() {
    const platform = this._client.service.platform();
    const token = await platform.auth().data();
    if (!this.useWAP) {
      return token;
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
    }
  }

  async logout(options) {
    if (this.useWAP) {
      const platform = this._client.service.platform();
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
    localStorage.removeItem(this._endpointIdKey);
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

  // TODO: override to fix discovery issue
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
    scope,
    tokenUri,
    discoveryUri,
  }) {
    this.store.dispatch({
      type: this.actionTypes.login,
    });
    let ownerId;
    if (accessToken) {
      await this._client.service.platform().auth().setData({
        token_type: tokenType,
        access_token: accessToken,
        expires_in: expiresIn,
        refresh_token_expires_in: expiresIn,
        scope,
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
      token_uri: tokenUri,
      discovery_uri: discoveryUri,
    });
  }

  get ownerId() {
    return super.ownerId && super.ownerId.toString();
  }

  get useWAP() {
    return this._useWAP;
  }

  get endpointId() {
    const cachedEndpointId = localStorage.getItem(this._endpointIdKey);
    if (cachedEndpointId) {
      return cachedEndpointId;
    }
    return super.endpointId;
  }

  changeEndpointId() {
    return localStorage.setItem(this._endpointIdKey, uuid.v4());
  }
}
