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
      pageId: params.pageId,
    };
  }

  getUIFunctions() {
    const {
      routerInteraction,
      thirdPartyService,
    } = this._deps;
    return {
      onBackButtonClick() {
        routerInteraction.goBack();
      },
      onSave(pageId, formData) {
        thirdPartyService.onClickButtonInCustomizedPage(pageId, 'submit', formData);
      },
      onFormDataChange(pageId, formData, keys) {
        thirdPartyService.onCustomizedPageInputChanged({
          pageId,
          formData,
          keys,
        });
      },
      onButtonClick(id) {
        thirdPartyService.onClickButtonInCustomizedPage(id, 'button');
      },
    };
  }
}