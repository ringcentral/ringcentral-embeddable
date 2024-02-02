import { Module } from '@ringcentral-integration/commons/lib/di';
import { RcUIModuleV2, action, state } from '@ringcentral-integration/core';

import { hasActiveCalls } from '@ringcentral-integration/widgets/lib/hasActiveCalls';

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

  getUIProps(props) {
    return {
      showActiveCalls: props.hasActiveCalls
        ? props.hasActiveCalls({
            callingSettings: this._deps.callingSettings,
            webphone: this._deps.webphone,
            callMonitor: this._deps.callMonitor,
          })
        : hasActiveCalls({
            callingSettings: this._deps.callingSettings,
            webphone: this._deps.webphone,
            callMonitor: this._deps.callMonitor,
          }),
      currentPath: this._deps.routerInteraction.currentPath,
      currentLocale: this._deps.locale.currentLocale,
      disableHistory: !this._deps.appFeatures.ready || !this._deps.appFeatures.hasReadExtensionCallLog,
    };
  }

  getUIFunctions() {
    return {
      goTo: (path) => {
        this._deps.routerInteraction.push(path);
        if (path !== '/calls') {
          this.setCurrentPath(path);
        }
      },
    };
  }
}