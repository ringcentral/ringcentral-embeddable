import { Module } from '@ringcentral-integration/commons/lib/di';
import { RcUIModuleV2, computed } from '@ringcentral-integration/core';

@Module({
  name: 'PhoneNumberFormatSettingUI',
  deps: [
    'PhoneNumberFormat',
    'RouterInteraction',
    'AccountInfo',
    'RegionSettings',
    'ExtensionInfo',
    'Alert',
  ],
})
export class PhoneNumberFormatSettingUI extends RcUIModuleV2 {
  constructor(deps) {
    super({ deps });
  }

  @computed((that: PhoneNumberFormatSettingUI) => [
    that._deps.phoneNumberFormat.formatType,
    that._deps.phoneNumberFormat.template,
    that._deps.accountInfo.mainCompanyNumber,
    that._deps.regionSettings.areaCode,
    that._deps.regionSettings.countryCode,
    that._deps.accountInfo.maxExtensionNumberLength,
    that._deps.extensionInfo.isMultipleSiteEnabled,
    that._deps.extensionInfo.site?.code,
    that._deps.extensionInfo.isEDPEnabled,
  ])
  get settingSection() {
    const {
      phoneNumberFormat,
      accountInfo,
      regionSettings,
      extensionInfo,
    } = this._deps;
  
    const mainCompanyNumber = accountInfo.mainCompanyNumber;
    return {
      id: 'phoneNumberFormat',
      name: 'Phone number format setting',
      items: [{
        id: 'phoneNumberFormat',
        name: 'Select phone number format',
        type: 'option',
        value: phoneNumberFormat.formatType,
        options: phoneNumberFormat.supportedFormats.map((format) => {
          let example = '';
          if (
            format.id !== 'customized' ||
            phoneNumberFormat.template
          ) {
            example = phoneNumberFormat.formatWithType({
              phoneNumber: mainCompanyNumber,
              areaCode: regionSettings.areaCode,
              countryCode: regionSettings.countryCode,
              maxExtensionLength: accountInfo.maxExtensionNumberLength,
              isMultipleSiteEnabled: extensionInfo.isMultipleSiteEnabled,
              siteCode: extensionInfo.site?.code,
              isEDPEnabled: extensionInfo.isEDPEnabled,
            }, format.id);
          }
          return ({
            id: format.id,
            name: format.name,
            description: example ? `Eg. ${example}` : '',
          });
        }),
      }, {
        id: 'template',
        name: 'Custom template',
        type: 'string',
        value: phoneNumberFormat.template || '',
        showWhen: {
          phoneNumberFormat: {
            value: 'customized',
            operator: 'equal',
          },
        },
        placeholder: 'Eg. (###) ###-####',
        helper: 'You can use # and * to represent the digits. x represents masked digit.',
        required: true,
      }]
    };
  }

  getUIProps() {
    return {
      section: this.settingSection,
    };
  }

  getUIFunctions() {
    const { phoneNumberFormat, routerInteraction } = this._deps;
    return {
      onSave: (newSetting) => {
        if (newSetting.items[0].value === 'customized') {
          const template = newSetting.items[1].value;
          if (!template) {
            this._deps.alert.warning({
              message: 'customizedTemplateRequired',
            });
            return;
          }
          const templateCharLength = template.split('').filter((char) => char === '#' || char === '*' || char === 'x').length;
          if (templateCharLength < 10 || templateCharLength > 15) {
            this._deps.alert.warning({
              message: 'customizedTemplateLengthInvalid',
            });
            return;
          }
          phoneNumberFormat.setTemplate(template);
        }
        phoneNumberFormat.setFormatType(newSetting.items[0].value);
      },
      onBackButtonClick: () => {
        routerInteraction.goBack();
      }
    };
  }
}