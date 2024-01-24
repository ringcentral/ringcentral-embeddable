import { Module } from '@ringcentral-integration/commons/lib/di';
import { RcUIModuleV2, state, action } from '@ringcentral-integration/core';

@Module({
  name: 'MainViewUI',
  deps: [
    'Locale',
    'RouterInteraction',
    'MessageStore',
    'AppFeatures',
    'GlipGroups',
    'GlipCompany',
    'GenericMeeting',
    'ThirdPartyService',
    'Brand',
  ],
})
export class MainViewUI extends RcUIModuleV2 {
  constructor(deps) {
    super({ deps });
  }

  getUIProps() {
    const {
      locale,
      messageStore,
      appFeatures,
      routerInteraction,
      glipGroups,
      glipCompany,
      genericMeeting,
      brand,
      thirdPartyService,
    } = this._deps;

    const unreadCounts = messageStore.unreadCounts || 0;
    const showCall = appFeatures.ready && appFeatures.isCallingEnabled;
    const showMessages = appFeatures.ready && appFeatures.hasReadMessagesPermission;
    const showMeeting = (
      appFeatures.ready &&
      appFeatures.hasMeetingsPermission
    );

    const { currentLocale } = locale;
    const showContacts = appFeatures.ready && appFeatures.isContactsEnabled;
    const showHistory = appFeatures.ready && appFeatures.hasReadExtensionCallLog;
    const settingsUnreadCount = thirdPartyService.showAuthRedDot ? 1 : 0;
    return {
      currentLocale,
      unreadCounts,
      showCall,
      showHistory,
      showMessages,
      showMeeting,
      isRCV: genericMeeting.isRCV,
      showContacts,
      showGlip: (appFeatures.hasGlipPermission && !!glipCompany.name),
      glipUnreadCounts: glipGroups.unreadCounts,
      currentPath: routerInteraction.currentPath,
      rcvProductName: brand.rcvProductName,
      settingsUnreadCount,
    };
  }
  
  getUIFunctions() {
    return {
      goTo: (path) => {
        if (path) {
          this._deps.routerInteraction.push(path);
        }
      },
    };
  }
}