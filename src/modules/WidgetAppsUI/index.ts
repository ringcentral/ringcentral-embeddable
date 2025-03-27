import { Module } from '@ringcentral-integration/commons/lib/di';
import { RcUIModuleV2 } from '@ringcentral-integration/core';
import { set } from 'lodash';

@Module({
  name: 'WidgetAppsUI',
  deps: [
    'ThirdPartyService',
  ],
})
export class WidgetAppsUI extends RcUIModuleV2 {
  constructor(deps) {
    super({
      deps,
    });
  }

  getUIProps(options) {
    const {
      thirdPartyService,
    } = this._deps;
    return {
      apps: thirdPartyService.apps,
      defaultAppId: thirdPartyService.defaultAppId,
    };
  }

  getUIFunctions() {
    const {
      thirdPartyService,
    } = this._deps;
    return {
      onLoadApp: (data) => {
        return thirdPartyService.loadAppPage(data);
      },
      setDefaultAppId: (appId) => {
        thirdPartyService.setDefaultAppId(appId);
      },
    };
  }
}
