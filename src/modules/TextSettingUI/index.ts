import { Module } from '@ringcentral-integration/commons/lib/di';
import { RcUIModuleV2 } from '@ringcentral-integration/core';
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

  getUIProps() {
    const {
      composeText,
      messageSender,
      locale,
      regionSettings,
      accountInfo,
    } = this._deps;
    return {
      section: {
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
      },
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