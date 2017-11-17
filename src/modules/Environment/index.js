import SDK from 'ringcentral';
import Environment from 'ringcentral-integration/modules/Environment';
import isBlank from 'ringcentral-integration/lib/isBlank';
import { Module } from 'ringcentral-integration/lib/di';

import {
  getAppKeyReducer,
  getAppSecretReducer,
} from './getReducer';

@Module({
  deps: [
    'Client',
    'GlobalStorage',
    { dep: 'EnvironmentOptions', optional: true }
  ]
})
export default class DomoEnvironment extends Environment {
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
      if (!isBlank(appKey) && !isBlank(appSecret)) {
        newConfig.appKey = appKey;
        newConfig.appSecret = appSecret;
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
      this._client.service = new SDK(config);
    }
  }

  _changeEnvironment(enabled, server, appKey, appSecret) {
    const newConfig = this._getSdkConfig(
      { enabled, server, appKey, appSecret }
    );
    this._client.service = new SDK(newConfig);
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
