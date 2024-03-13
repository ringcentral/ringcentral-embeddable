import { Module } from '@ringcentral-integration/commons/lib/di';
import { RcUIModuleV2 } from '@ringcentral-integration/core';

@Module({
  name: 'CustomizedPageUI',
  deps: [
    'ThirdPartyService',
    'RouterInteraction',
  ],
})
export class CustomizedPageUI extends RcUIModuleV2 {
  constructor(deps) {
    super({
      deps,
    });
  }

  getUIProps({
    params,
  }) {
    const {
      thirdPartyService,
    } = this._deps;
    const page = thirdPartyService.getCustomizedPage(params.pageId);
    return {
      pageTitle: page && page.pageTitle || 'Customized Page',
      saveButtonLabel: page && page.saveButtonLabel,
      fields: page && page.fields || [],
      saveButtonLoading: false,
    };
  }

  getUIFunctions({
    params,
  }) {
    const {
      routerInteraction,
      thirdPartyService,
    } = this._deps;

    const page = thirdPartyService.getCustomizedPage(params.pageId);
    return {
      onBackButtonClick() {
        routerInteraction.goBack();
      },
      onSave() {
        thirdPartyService.onClickButtonInCustomizedPage(page && page.id);
      },
      onFieldInputChange(input, key) {
        thirdPartyService.onCustomizedPageInputChanged({
          pageId: page && page.id,
          input,
          key
        });
      }
    };
  }
}