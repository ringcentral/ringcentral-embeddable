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
  name: 'ContactAppsUI',
  deps: [
    'ThirdPartyService',
  ],
})
export class ContactAppsUI extends RcUIModuleV2 {
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
      currentContact: options?.params?.contact,
      apps: thirdPartyService.apps,
    };
  }

  getUIFunctions() {
    return {
      
    };
  }
}