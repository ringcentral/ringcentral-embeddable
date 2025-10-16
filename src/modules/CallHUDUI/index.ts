import { Module } from '@ringcentral-integration/commons/lib/di';
import { RcUIModuleV2, state, action, computed } from '@ringcentral-integration/core';
import { sessionStatus } from '@ringcentral-integration/commons/modules/Webphone/sessionStatus';

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
    'Call',
    'DialerUI',
    'CallingSettings',
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
    const list = [{
      id: 'User',
      unreadCount: 0,
    }];
    if (this._deps.monitoredExtensions.parkLocations.length > 0) {
      const unreadCount = this._deps.monitoredExtensions.parkLocations.reduce((acc, item) => {
        const activeCalls = item.presence?.activeCalls?.length || 0;
        return acc + (activeCalls > 0 ? 1 : 0);
      }, 0);
      list.push({
        id: 'ParkLocation',
        unreadCount,
      });
    }
    if (this._deps.monitoredExtensions.groupCallPickupList.length > 0) {
      const unreadCount = this._deps.monitoredExtensions.groupCallPickupList.reduce((acc, item) => {
        const activeCalls = item.presence?.activeCalls?.length || 0;
        return acc + (activeCalls > 0 ? 1 : 0);
      }, 0);
      list.push({
        id: 'GroupCallPickup',
        unreadCount,
      });
    }
    return list;
  }

  getUIProps() {
    const {
      locale,
      call,
      webphone,
    } = this._deps;
    const hasActiveSession = (
      webphone.activeSession &&
      webphone.activeSession.callStatus === sessionStatus.connected &&
      !webphone.activeSession.isOnHold &&
      !webphone.activeSession.voicemailDropStatus
    );
    return {
      type: this.type,
      typeList: this.typeList,
      searchInput: this.searchInput,
      extensions: this.extensions,
      currentLocale: locale.currentLocale,
      disableClickToDial: !(call && call.isIdle),
      canPark: hasActiveSession,
    };
  }
  
  getUIFunctions() {
    const {
      phoneNumberFormat,
      regionSettings,
      accountInfo,
      extensionInfo,
      dialerUI,
      call,
      routerInteraction,
      webphone,
      composeTextUI,
      composeText,
      callingSettings,
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
      onClickToDial: (recipient: any) => {
        if (call && call.isIdle) {
          routerInteraction.push('/dialer');
          dialerUI.call({
            recipient,
          });
        }
      },
      onPark: async (extension) => {
        if (webphone.activeSession) {
          await webphone.parkToLocation(webphone.activeSession.id, extension);
        }
      },
      onText: async (text) => {
        if (text) {
          composeTextUI.gotoComposeText();
          composeText.updateMessageText(text);
        }
      },
      pickParkLocation: async (extension, activeCall) => {
        await webphone.pickParkLocation(extension.id, activeCall, callingSettings.fromNumber);
      },
      pickGroupCall: async (extension, activeCall) => {
        await webphone.pickGroupCall(extension.id, activeCall, callingSettings.fromNumber);
      },
    };
  }
}