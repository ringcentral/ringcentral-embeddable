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
      title: page && page.title || '',
      schema: page && page.schema || {},
      uiSchema: page && page.uiSchema || {},
      formData: page && page.formData || [],
      submitButtonLoading: false,
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
      onSave(formData) {
        thirdPartyService.onClickButtonInCustomizedPage(page && page.id, formData);
      },
      onFormDataChange(formData, keys) {
        thirdPartyService.onCustomizedPageInputChanged({
          pageId: page && page.id,
          formData,
          keys,
        });
      }
    };
  }
}