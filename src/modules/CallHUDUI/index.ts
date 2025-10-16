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
    'GrantExtensions',
    'Webphone',
    'RouterInteraction',
    'ComposeText',
    'ComposeTextUI',
    'Call',
    'DialerUI',
    'CallingSettings',
    'CompanyContacts',
    'Auth',
  ],
})
export class CallHUDUI extends RcUIModuleV2 {
  constructor(deps) {
    super({ deps });
  }

  @state
  type = 'User'; // User, GroupCallPickup, ParkLocation, Department

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
    if (this._deps.grantExtensions.grantParkLocations.length > 0) {
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
    if (this._deps.monitoredExtensions.callQueuePickupList.length > 0) {
      const unreadCount = this._deps.monitoredExtensions.callQueuePickupList.reduce((acc, item) => {
        const activeCalls = item.presence?.activeCalls?.length || 0;
        return acc + (activeCalls > 0 ? 1 : 0);
      }, 0);
      list.push({
        id: 'Department',
        unreadCount,
      });
    }
    return list;
  }

  @state
  extensionAddFilter = '';

  @action
  setExtensionAddFilter(extensionAddFilter: string) {
    this.extensionAddFilter = extensionAddFilter;
  }

  @computed((that: CallHUDUI) => [
    that._deps.companyContacts.data,
    that._deps.auth.accessToken,
    that.extensionAddFilter,
    that.type,
    that._deps.monitoredExtensions.monitoredExtensions,
  ])
  get availableExtensions() {
    if (!this.extensionAddFilter || this.extensionAddFilter.trim() === '') {
      return [];
    }
    const searchString = this.extensionAddFilter.toLowerCase();
    const addedMap = this._deps.monitoredExtensions.monitoredExtensions.reduce((acc, item) => {
      acc[item.extension.id] = 1;
      return acc;
    }, {});
    addedMap[this._deps.extensionInfo.id] = 1;
    if (this.type === 'ParkLocation') {
      return this._deps.grantExtensions.grantParkLocations.filter(
        (item) => {
          return (
            !addedMap[item.extension.id] &&
            (
              item.extension.extensionNumber?.toLowerCase().includes(searchString)
              || item.extension.name?.toLowerCase().includes(searchString)
            )
          );
        }
      )
      .slice(0, 10)
      .map((item) => {
        return {
          id: item.extension.id,
          name: item.extension.name,
          extensionNumber: item.extension.extensionNumber,
        };
      });
    }
    return (this._deps.companyContacts.data || []).filter(
      (item) => {
        return (
          item.type === 'User' && 
          !addedMap[item.id] &&
          (
            item.extensionNumber?.toLowerCase().includes(searchString)
            || item.name?.toLowerCase().includes(searchString)
            || item.firstName?.toLowerCase().includes(searchString)
            || item.lastName?.toLowerCase().includes(searchString)
            || `${item.firstName || ''} ${item.lastName || ''}`.toLowerCase().includes(searchString)
          )
        );
      }
    )
    .slice(0, 10)
    .map((item) => {
      let name = item.name;
      if (!name && (item.firstName || item.lastName)) {
        name = `${item.firstName || ''} ${item.lastName || ''}`;
      }
      return {
        id: item.id,
        name: name || item.extensionNumber,
        extensionNumber: item.extensionNumber,
        profileImageUrl: item.profileImage?.uri ? `${item.profileImage.uri}?access_token=${this._deps.auth.accessToken}` : undefined,
      };
    });
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
      allExtensions: this.availableExtensions,
      extensionAddFilter: this.extensionAddFilter,
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
      onExtensionAddFilterChange: (extensionAddFilter: string) => {
        this.setExtensionAddFilter(extensionAddFilter);
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
        await webphone.pickGroupCall(extension.id, activeCall, callingSettings.fromNumber, 'gcp');
      },
      pickCallQueueCall: async (extension, activeCall) => {
        await webphone.pickGroupCall(extension.id, activeCall, callingSettings.fromNumber, 'qpk');
      },
      onAddExtensions: async (extensions) => {
        if (extensions.length === 0) {
          return;
        }
        await this._deps.monitoredExtensions.addExtensions(extensions);
      },
      onRemoveExtension: async (extensionId) => {
        await this._deps.monitoredExtensions.removeExtension(extensionId);
      },
    };
  }
}