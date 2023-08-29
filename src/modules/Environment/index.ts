import { SDK } from '@ringcentral/sdk';
import { Environment as EnvironmentBase } from '@ringcentral-integration/commons/modules/Environment';
import { isBlank } from '@ringcentral-integration/commons/lib/isBlank';
import { Module } from '@ringcentral-integration/commons/lib/di';
import { action, state, globalStorage } from '@ringcentral-integration/core';

import lockRefresh from '../../lib/lockRefresh';

@Module({
  name: 'DemoEnvironment',
  deps: [
    'Client',
    'GlobalStorage',
    'SdkConfig',
    { dep: 'EnvironmentOptions', optional: true }
  ]
})
export class Environment extends EnvironmentBase {
  @globalStorage
  @state
  clientId = '';

  @globalStorage
  @state
  clientSecret = '';

  getSdkConfig() {
    const newConfig = {
      ...this._deps.sdkConfig,
    };
    if (this.enabled) {
      newConfig.server = this.server;
      newConfig.discoveryServer = this.server;
      if (!isBlank(this.clientId)) {
        newConfig.clientId = this.clientId;
        if (!isBlank(this.clientSecret)) {
          newConfig.clientSecret = this.clientSecret;
        } else {
          delete newConfig.clientSecret;
        }
      }
    }
    return newConfig;
  }

  changeEnvironment() {
    const sdkConfig = this.getSdkConfig();
    this._deps.client.service = lockRefresh(new SDK(sdkConfig));
  }

  @action
  setEnvData({ server, recordingHost, enabled, clientId, clientSecret }) {
    this.server = server;
    this.recordingHostState = recordingHost;
    this.enabled = enabled;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  async setData({
    server,
    recordingHost,
    enabled,
    clientId,
    clientSecret,
    environmentChanged = false,
  }) {
    // `recordingHost` change no need to set to SDK
    const isEnvChanged =
      environmentChanged ||
      this.enabled !== enabled ||
      (enabled && this.server !== server) ||
      (enabled && this.clientId !== clientId) ||
      (enabled && this.clientSecret !== clientSecret);

    this.setEnvData({
      server,
      recordingHost,
      enabled,
      clientId,
      clientSecret,
    });

    if (isEnvChanged) {
      // apply changes
      this.changeEnvironment();
      // notify change at last
      this.updateChangeCounter();
    }
  }
}
