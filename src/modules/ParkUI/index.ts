import { Module } from '@ringcentral-integration/commons/lib/di';
import { RcUIModuleV2 } from '@ringcentral-integration/core';

@Module({
  name: 'ParkUI',
  deps: [
    'MonitoredExtensions',
    'RouterInteraction',
  ],
})
export class ParkUI extends RcUIModuleV2 {
  constructor(deps) {
    super({ deps });
  }

  getUIProps() {
    const {
      monitoredExtensions,
    } = this._deps;
    return {
      parkLocations: monitoredExtensions.parkLocations,
    };
  }

  getUIFunctions() {
    const {
      monitoredExtensions,
      routerInteraction,
    } = this._deps;
    return {
      onBackButtonClick: () => {
        routerInteraction.goBack();
      },
    };
  }
}