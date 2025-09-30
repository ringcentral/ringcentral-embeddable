import { Module } from '@ringcentral-integration/commons/lib/di';
import { TransferUI as TransferUIBase } from '@ringcentral-integration/widgets/modules/TransferUI';

@Module({
  deps: [
    'PhoneNumberFormat',
    'RegionSettings',
    'AccountInfo',
    'ExtensionInfo',
  ],
})
export class TransferUI extends TransferUIBase {
  getUIFunctions(props) {
    const parentUIFunctions = super.getUIFunctions(props);
    return {
      ...parentUIFunctions,
      formatPhone: (phoneNumber) =>
        this._deps.phoneNumberFormat.format({
          phoneNumber,
          areaCode: this._deps.regionSettings.areaCode,
          countryCode: this._deps.regionSettings.countryCode,
          maxExtensionLength: this._deps.accountInfo.maxExtensionNumberLength,
          isMultipleSiteEnabled: this._deps.extensionInfo.isMultipleSiteEnabled,
          siteCode: this._deps.extensionInfo.site?.code,
        }),
    };
  }
}