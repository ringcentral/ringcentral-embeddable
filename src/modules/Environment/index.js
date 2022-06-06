import { SDK } from '@ringcentral/sdk';
import Environment from '@ringcentral-integration/commons/modules/Environment';
import isBlank from '@ringcentral-integration/commons/lib/isBlank';
import { Module } from '@ringcentral-integration/commons/lib/di';

import hackSend from '../../lib/hackSend';
import lockRefresh from '../../lib/lockRefresh';

import {
  getAppKeyReducer,
  getAppSecretReducer,
} from './getReducer';

@Module({
  name: 'DemoEnvironment',
  deps: [
    'Client',
    'GlobalStorage',
    'SdkConfig',
    { dep: 'EnvironmentOptions', optional: true }
  ]
})
export default class DemoEnvironment extends Environment {
  constructor({
    client,
    globalStorage,
    sdkConfig,
    ...options
  }) {
    super({
      client,
      globalStorage,
      sdkConfig,
      ...options,
    });
    this._appKeyStorageKey = 'environmentAppKey';
    this._appSecretStorageKey = 'environmentAppSecret';

    this._globalStorage.registerReducer({
      key: this._appKeyStorageKey,
      reducer: getAppKeyReducer({ types: this.actionTypes }),
    });
    this._globalStorage.registerReducer({
      key: this._appSecretStorageKey,
      reducer: getAppSecretReducer({ types: this.actionTypes }),
    });
  }

  _getSdkConfig({ enabled, server, appKey, appSecret }) {
    const newConfig = {
      ...this._sdkConfig,
    };
    if (enabled) {
      newConfig.server = server;
      if (this._sdkConfig.enableDiscovery) {
        newConfig.discoveryServer = server;
      }
      if (!isBlank(appKey)) {
        newConfig.clientId = appKey;
        if (!isBlank(appSecret)) {
          newConfig.clientSecret = appSecret;
        } else {
          delete newConfig.clientSecret;
        }
      }
    }
    return newConfig;
  }

  _initClientService() {
    if (this.enabled) {
      const config = this._getSdkConfig(
        {
          enabled: this.enabled,
          server: this.server,
          appKey: this.appKey,
          appSecret: this.appSecret
        }
      );
      if (!!window.ActiveXObject || 'ActiveXObject' in window) {
        // if the browser is IE , no cache
        this._client.service = hackSend(new SDK(config));
      } else {
        this._client.service = lockRefresh(new SDK(config));
      }
    }
  }

  _changeEnvironment(enabled, server, appKey, appSecret) {
    const newConfig = this._getSdkConfig(
      { enabled, server, appKey, appSecret }
    );
    if (!!window.ActiveXObject || 'ActiveXObject' in window) {
      // if the browser is IE , no cache
      this._client.service = hackSend(new SDK(newConfig));
    } else {
      this._client.service = lockRefresh(new SDK(newConfig));
    }
  }

  async setData({ server, recordingHost, enabled, appKey, appSecret }) {
    const environmentChanged =
      this.enabled !== enabled ||
      (enabled && this.server !== server) ||
      (enabled && this.appKey !== appKey) ||
      (enabled && this.appSecret !== appSecret)
      ;
    if (environmentChanged) { // recordingHost changed no need to set to SDK
      this._changeEnvironment(enabled, server, appKey, appSecret);
    }

    this.store.dispatch({
      type: this.actionTypes.setData,
      server,
      recordingHost,
      enabled,
      environmentChanged,
      appKey,
      appSecret,
    });
  }

  get appKey() {
    return this._globalStorage.getItem(this._appKeyStorageKey);
  }

  get appSecret() {
    return this._globalStorage.getItem(this._appSecretStorageKey);
  }
}
