import { Module } from '@ringcentral-integration/commons/lib/di';
import {
  RcUIModuleV2,
  track,
} from '@ringcentral-integration/core';
import { findSettingItem } from '../ThirdPartyService/helper';

@Module({
  name: 'ThirdPartySettingSectionUI',
  deps: [
    'RouterInteraction',
    'ThirdPartyService',
  ],
})
export class ThirdPartySettingSectionUI extends RcUIModuleV2 {
  constructor(deps) {
    super({
      deps,
    });
  }

  getUIProps({
    params,
  }) {
    const { thirdPartyService } = this._deps;
    const section = findSettingItem(thirdPartyService.settings, params.sectionId);
    return {
      section,
    };
  }

  getUIFunctions() {
    const {
      routerInteraction,
    } = this._deps;
    return {
      onSave: (newSection) => {
        return this._onSave(newSection);
      },
      onBackButtonClick: () => routerInteraction.goBack(),
    };
  }

  @track(() => ['Save Third Party Setting Section'])
  _onSave(newSection) {
    return this._deps.thirdPartyService.onUpdateSetting(newSection);
  }
}
