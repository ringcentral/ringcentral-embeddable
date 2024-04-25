import { Module } from '@ringcentral-integration/commons/lib/di';
import {
  ComposeTextUI as ComposeTextUIBase,
} from '@ringcentral-integration/widgets/modules/ComposeTextUI';

@Module({
  name: 'ComposeTextUI',
  deps: [
    'ThirdPartyService',
    'RouterInteraction',
    'SmsTemplates',
  ]
})
export class ComposeTextUI extends ComposeTextUIBase {
  getUIProps(props) {
    const baseProps = super.getUIProps(props);
    const {
      thirdPartyService,
      appFeatures,
      smsTemplates,
    } = this._deps;
    return {
      ...baseProps,
      additionalToolbarButtons: thirdPartyService.additionalSMSToolbarButtons,
      showTemplate: appFeatures.showSmsTemplate,
      templates: smsTemplates.templates,
    };
  }

  getUIFunctions(props) {
    const baseFuncs = super.getUIFunctions(props);
    const {
      thirdPartyService,
    } = this._deps;
    return {
      ...baseFuncs,
      onClickAdditionalToolbarButton: (buttonId) => {
        thirdPartyService.onClickAdditionalButton(buttonId);
      },
      goBack: () => {
        this._deps.routerInteraction.goBack();
      },
    };
  }
}
