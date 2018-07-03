import { Module } from 'ringcentral-integration/lib/di';
import CallLoggerBase from 'ringcentral-integration/modules/CallLogger';

@Module({
  deps: [],
})
export default class CallLogger extends CallLoggerBase {
  constructor(options) {
    super({
      ...options,
      readyCheckFunction: () => true,
      logFunction: async ({ item, ...options }) => { await this._doLog({ item, ...options }); }
    });
  }

  async _doLog({ item, ...options }) {
    console.log(item);
  }
}
