import { Module } from '@ringcentral-integration/commons/lib/di';
import { RcUIModuleV2, computed } from '@ringcentral-integration/core';
import { formatNumber } from '@ringcentral-integration/commons/lib/formatNumber';
import { getPhoneNumberLabel } from '../../components/DialerPanel/FromField/helper';

@Module({
  name: 'TextSettingUI',
  deps: [
    'MessageSender',
    'ComposeText',
    'Locale',
    'RegionSettings',
    'AccountInfo',
    'RouterInteraction',
  ],
})
export class TextSettingUI extends RcUIModuleV2 {
  constructor(deps) {
    super({
      deps,
    });
  }

  @computed((that: TextSettingUI) => [
    that._deps.composeText.defaultTextId,
    that._deps.messageSender.senderNumbersList,
    that._deps.locale.currentLocale,
    that._deps.regionSettings.areaCode,
    that._deps.regionSettings.countryCode,
    that._deps.accountInfo.maxExtensionNumberLength,
  ])
  get settingSection() {
    const { composeText, messageSender, locale, regionSettings, accountInfo } = this._deps;
    return {
      id: 'text',
      name: 'Text',
      type: 'section',
      items: [
        {
          id: 'defaultTextId',
          name: 'Default text ID',
          type: 'option',
          value: composeText.defaultTextId,
          options: messageSender.senderNumbersList.map((number) => ({
            id: number.phoneNumber,
            name: formatNumber({
              phoneNumber: number.phoneNumber,
              areaCode: regionSettings.areaCode,
              countryCode: regionSettings.countryCode,
              maxExtensionLength: accountInfo.maxExtensionNumberLength,
            }),
            description: getPhoneNumberLabel(number, locale.currentLocale),
          })),
        },
      ],
    };
  }

  getUIProps() {
    return {
      section: this.settingSection,
    };
  }

  getUIFunctions() {
    return {
      onSave: (newSetting) => {
        this._deps.composeText.setDefaultTextId(newSetting.items[0].value);
        this._deps.composeText.updateSenderNumber(newSetting.items[0].value);
      },
      onBackButtonClick: () => {
        this._deps.routerInteraction.goBack();
      }
    };
  }
}