import { SimpleCallControlUI as SimpleCallControlUIBase }  from '@ringcentral-integration/widgets/modules/SimpleCallControlUI';
import { Module } from '@ringcentral-integration/commons/lib/di';

@Module({
  name: 'NewSimpleCallControlUI',
  deps: [
    'PhoneNumberFormat',
    'RegionSettings',
    'AccountInfo',
    'ExtensionInfo',
  ],
})
export class SimpleCallControlUI extends SimpleCallControlUIBase {
  getUIFunctions(options) {
    const functions = super.getUIFunctions(options);
    return {
      ...functions,
      updateSessionMatchedContact: (telephonySessionId, contact) => {
        this._deps.contactMatcher.setCallMatched({
          telephonySessionId,
          toEntityId: contact.id
        });
      },
      formatPhone: (phoneNumber: string) =>
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