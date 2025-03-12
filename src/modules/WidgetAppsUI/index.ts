import { Module } from '@ringcentral-integration/commons/lib/di';
import { RcUIModuleV2 } from '@ringcentral-integration/core';

type CurrentContact = {
  id?: string;
  phoneNumber?: string;
  phoneNumbers?: {
    phoneNumber: string;
  }[];
}

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
      onInPageButtonClick(id, formData) {
        thirdPartyService.onClickButtonInCustomizedPage(id, 'button', formData);
      },
    };
  }
}
