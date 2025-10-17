import { Module } from '@ringcentral-integration/commons/lib/di';
import { RcUIModuleV2, action, state, computed } from '@ringcentral-integration/core';
import i18n from '../../components/MainViewPanel/i18n';

interface Tab {
  value: string;
  label: string;
  unreadCounts?: number;
}

@Module({
  name: 'DialerAndCallsTabUI',
  deps: [
    'Locale',
    'RouterInteraction',
    'CallingSettings',
    'AppFeatures',
    'MessageStore',
    'MonitoredExtensions',
    { dep: 'Webphone', optional: true },
    { dep: 'CallMonitor', optional: true },
    { dep: 'PhoneTabsUIOptions', optional: true },
  ],
})
export class PhoneTabsUI extends RcUIModuleV2 {
  constructor(deps) {
    super({
      deps,
    });
  }

  @state
  currentPath = '/dialer';

  @action
  setCurrentPath(path: string) {
    this.currentPath = path;
  }

  @computed((that: PhoneTabsUI) => [
    that._deps.appFeatures.ready,
    that._deps.appFeatures.isCallingEnabled,
    that._deps.appFeatures.hasReadExtensionCallLog,
    that._deps.appFeatures.hasReadCallRecordings,
    that._deps.appFeatures.hasVoicemailPermission,
    that._deps.messageStore.voiceUnreadCounts,
    that._deps.monitoredExtensions.hasPermission,
    that._deps.monitoredExtensions.activeExtensionLength,
    that._deps.locale.currentLocale,
  ])
  get tabs() {
    if (!this._deps.appFeatures.ready) {
      return [];
    }
    const tabs: Tab[] = [];
    const { appFeatures, locale, messageStore, monitoredExtensions } = this._deps;
    if (appFeatures.isCallingEnabled) {
      tabs.push({
        value: '/dialer',
        label: i18n.getString('dialpadLabel', locale.currentLocale),
      });
    }
    if (appFeatures.hasReadExtensionCallLog) {
      tabs.push({
        value: '/history',
        label: i18n.getString('callsLabel', locale.currentLocale),
      });
    }
    if (appFeatures.hasVoicemailPermission) {
      tabs.push({
        value: '/messages/voicemail',
        label: i18n.getString('voicemailLabel', locale.currentLocale),
        unreadCounts: messageStore.voiceUnreadCounts,
      });
    }
    if (appFeatures.hasReadCallRecordings) {
      tabs.push({
        value: '/history/recordings',
        label: i18n.getString('recordingsLabel', locale.currentLocale),
      });
    }
    if (monitoredExtensions.hasPermission) {
      tabs.push({
        value: '/HUD',
        label: 'HUD',
        unreadCounts: monitoredExtensions.activeExtensionLength,
      });
    }
    return tabs;
  }

  getUIProps() {
    const {
      routerInteraction,
    } = this._deps;
    return {
      currentPath: routerInteraction.currentPath,
      // disableHistory: !this._deps.appFeatures.ready || !this._deps.appFeatures.hasReadExtensionCallLog,
      tabs: this.tabs,
      variant: 'moreMenu',
    };
  }

  getUIFunctions() {
    return {
      goTo: (path) => {
        this._deps.routerInteraction.push(path);
        this.setCurrentPath(path);
      },
    };
  }
}
