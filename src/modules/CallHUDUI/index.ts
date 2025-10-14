import { Module } from '@ringcentral-integration/commons/lib/di';
import { RcUIModuleV2, state, action, computed } from '@ringcentral-integration/core';

@Module({
  name: 'CallHUDUI',
  deps: [
    'Locale',
    'PhoneNumberFormat',
    'RegionSettings',
    'AccountInfo',
    'ExtensionInfo',
    'MonitoredExtensions',
    'Webphone',
    'RouterInteraction',
    'ComposeText',
    'ComposeTextUI',
  ],
})
export class CallHUDUI extends RcUIModuleV2 {
  constructor(deps) {
    super({ deps });
  }

  @state
  type = 'User'; // User, GroupCallPickup, ParkLocation

  @action
  setType(type: string) {
    this.type = type;
  }

  @state
  searchInput = '';

  @action
  setSearchInput(searchInput: string) {
    this.searchInput = searchInput;
  }

  @computed((that: CallHUDUI) => [
    that.type,
    that.searchInput,
    that._deps.monitoredExtensions.monitoredExtensions,
  ])
  get extensions() {
    let typeList = this._deps.monitoredExtensions.monitoredExtensions.filter(
      (item) => item.extension.type === this.type
    );
    if (this.searchInput) {
      const searchString = this.searchInput.toLowerCase();
      typeList = typeList.filter((item) => {
        return (
          item.extension?.name?.toLowerCase().includes(searchString)
          || item.extension?.extensionNumber?.toLowerCase().includes(searchString)
        );
      });
    }
    return typeList;
  }

  @computed((that: CallHUDUI) => [
    that._deps.monitoredExtensions.monitoredExtensions,
  ])
  get typeList() {
    const list = ['User'];
    if (this._deps.monitoredExtensions.monitoredExtensions.some((item) => item.extension.type === 'GroupCallPickup')) {
      list.push('GroupCallPickup');
    }
    if (this._deps.monitoredExtensions.monitoredExtensions.some((item) => item.extension.type === 'ParkLocation')) {
      list.push('ParkLocation');
    }
    return list;
  }

  getUIProps() {
    const {
      locale,
    } = this._deps;
    return {
      type: this.type,
      typeList: this.typeList,
      searchInput: this.searchInput,
      extensions: this.extensions,
      currentLocale: locale.currentLocale,
    };
  }
  
  getUIFunctions() {
    const {
      phoneNumberFormat,
      regionSettings,
      accountInfo,
      extensionInfo,
    } = this._deps;
    return {
      onTypeChange: (type: string) => {
        this.setType(type);
      },
      onSearchInputChange: (searchInput: string) => {
        this.setSearchInput(searchInput);
      },
      formatPhone: (phoneNumber: string) => {
        return phoneNumberFormat.format({
          phoneNumber,
          areaCode: regionSettings.areaCode,
          countryCode: regionSettings.countryCode,
          maxExtensionLength: accountInfo.maxExtensionNumberLength,
          isMultipleSiteEnabled: extensionInfo.isMultipleSiteEnabled,
          siteCode: extensionInfo.site?.code,
        });
      },
    };
  }
}