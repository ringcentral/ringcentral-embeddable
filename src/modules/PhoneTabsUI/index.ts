import { Module } from '@ringcentral-integration/commons/lib/di';
import { RcUIModuleV2, action, state, computed } from '@ringcentral-integration/core';
import i18n from '../../components/MainViewPanel/i18n';

interface Tab {
  value: string;
  label: string;
}

@Module({
  name: 'DialerAndCallsTabUI',
  deps: [
    'Locale',
    'RouterInteraction',
    'CallingSettings',
    'AppFeatures',
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
    that._deps.locale.currentLocale
  ])
  get tabs() {
    if (!this._deps.appFeatures.ready) {
      return [];
    }
    const tabs: Tab[] = [];
    const { appFeatures, locale } = this._deps;
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
    if (appFeatures.hasReadCallRecordings) {
      tabs.push({
        value: '/history/recordings',
        label: i18n.getString('recordingsLabel', locale.currentLocale),
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
