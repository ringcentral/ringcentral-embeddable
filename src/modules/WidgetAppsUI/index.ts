import { Module } from '@ringcentral-integration/commons/lib/di';
import { RcUIModuleV2 } from '@ringcentral-integration/core';

@Module({
  name: 'WidgetAppsUI',
  deps: [
    'ThirdPartyService',
    'Theme',
    'SideDrawerUI',
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
      pinAppIds: thirdPartyService.pinAppIds,
    };
  }

  getUIFunctions() {
    const {
      thirdPartyService,
      theme,
      sideDrawerUI,
    } = this._deps;
    return {
      onLoadApp: (data) => {
        return thirdPartyService.loadAppPage({
          ...data,
          theme: theme.themeType,
        });
      },
      toggleAppPin: (appId) => {
        thirdPartyService.toggleAppPin(appId);
      },
      openAppTab: (app, contact) => {
        sideDrawerUI.openAppTab(app, contact);
      },
    };
  }
}
