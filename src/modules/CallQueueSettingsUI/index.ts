import { Module } from '@ringcentral-integration/commons/lib/di';
import { RcUIModuleV2 } from '@ringcentral-integration/core';

@Module({
  name: 'CallQueueSettingsUI',
  deps: [
    'CallQueuePresence',
    'RouterInteraction',
  ],
})
export class CallQueueSettingsUI extends RcUIModuleV2 {
  constructor(deps) {
    super({
      deps,
    });
  }

  getUIProps() {
    const {
      callQueuePresence,
    } = this._deps;
    return {
      presences: callQueuePresence.presences,
    };
  }

  getUIFunctions() {
    const {
      callQueuePresence,
      routerInteraction,
    } = this._deps;
    return {
      sync: async () => {
        await callQueuePresence.sync();
      },
      updatePresence: async (queueId, acceptCalls) => {
        await callQueuePresence.updatePresence(queueId, acceptCalls);
      },
      onBackButtonClick: () => {
        routerInteraction.goBack();
      },
    };
  }
}
