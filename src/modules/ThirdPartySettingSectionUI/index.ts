import { Module } from '@ringcentral-integration/commons/lib/di';
import {
  RcUIModuleV2,
  track,
} from '@ringcentral-integration/core';

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
    const section = thirdPartyService.settings.find((setting) => (
      setting.id === params.sectionId &&
      setting.type === 'section'
    ));
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
        this._onSave(newSection);
      },
      onBackButtonClick: () => routerInteraction.goBack(),
    };
  }

  @track(() => ['Save Third Party Setting Section'])
  _onSave(newSection) {
    console.log('newSection', newSection);
  }
}
