import { Module } from '@ringcentral-integration/commons/lib/di';
import { RcUIModuleV2 } from '@ringcentral-integration/core';

@Module({
  name: 'PhoneNumberFormatSettingUI',
  deps: [
    'PhoneNumberFormat',
    'RouterInteraction',
    'AccountInfo',
    'RegionSettings',
    'ExtensionInfo',
  ],
})
export class PhoneNumberFormatSettingUI extends RcUIModuleV2 {
  constructor(deps) {
    super({ deps });
  }

  getUIProps() {
    const {
      phoneNumberFormat,
      accountInfo,
      regionSettings,
      extensionInfo,
    } = this._deps;
  
    const mainCompanyNumber = accountInfo.mainCompanyNumber;
    return {
      section: {
        id: 'phoneNumberFormat',
        name: 'Phone Number Format',
        items: [{
          id: 'phoneNumberFormat',
          name: 'Select phone number format',
          type: 'option',
          value: phoneNumberFormat.formatType,
          options: phoneNumberFormat.supportedFormats.map((format) => {
            const example = phoneNumberFormat.formatWithType({
              phoneNumber: mainCompanyNumber,
              areaCode: regionSettings.areaCode,
              countryCode: regionSettings.countryCode,
              maxExtensionLength: accountInfo.maxExtensionNumberLength,
              isMultipleSiteEnabled: extensionInfo.isMultipleSiteEnabled,
              siteCode: extensionInfo.site?.code,
              isEDPEnabled: extensionInfo.isEDPEnabled,
            }, format.id);
            return ({
              id: format.id,
              name: format.name,
              description: `Eg. ${example}`,
            })
          }),
        }]
      },
    };
  }

  getUIFunctions() {
    const { phoneNumberFormat, routerInteraction } = this._deps;
    return {
      onSave: (newSetting) => {
        phoneNumberFormat.setFormatType(newSetting.items[0].value);
      },
      onBackButtonClick: () => {
        routerInteraction.goBack();
      }
    };
  }
}