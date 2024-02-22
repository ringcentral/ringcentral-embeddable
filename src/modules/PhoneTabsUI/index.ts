import { Module } from '@ringcentral-integration/commons/lib/di';
import { RcUIModuleV2, action, state } from '@ringcentral-integration/core';
import i18n from '../../components/MainViewPanel/i18n';

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

  getUIProps() {
    const {
      routerInteraction,
      currentLocale,
    } = this._deps;
    return {
      currentPath: routerInteraction.currentPath,
      // disableHistory: !this._deps.appFeatures.ready || !this._deps.appFeatures.hasReadExtensionCallLog,
      tabs: [{
        value: '/dialer',
        label: i18n.getString('dialpadLabel', currentLocale),
      }, {
        value: '/history',
        label: i18n.getString('callsLabel', currentLocale),
      }, {
        value: '/history/recordings',
        label: i18n.getString('recordingsLabel', currentLocale),
      }],
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