import { createSelector } from 'reselect';
import getter from 'ringcentral-integration/lib/getter';
import { Module } from 'ringcentral-integration/lib/di';
import CallLoggerBase from 'ringcentral-integration/modules/CallLogger';

@Module({
  deps: ['ThirdPartyService'],
})
export default class CallLogger extends CallLoggerBase {
  constructor({
    thirdPartyService,
    ...options
  }) {
    super({
      initialState: { autoLog: false },
      readyCheckFunction: () => this._thirdPartyService.callLoggerRegistered,
      logFunction: async (data) => { await this._doLog(data); },
      ...options,
    });
    this._thirdPartyService = thirdPartyService;
  }

  async _doLog({ item, ...options }) {
    delete item.toNumberEntity;
    await this._thirdPartyService.logCall({ call: item, ...options });
  }

  @getter
  allCallMapping = createSelector(
    () => this._callMonitor.calls,
    () => this._callHistory.calls,
    (activeCalls, calls) => {
      const mapping = {};
      activeCalls.forEach((call) => {
        mapping[call.sessionId] = call;
      });
      calls.forEach((call) => {
        mapping[call.sessionId] = call;
      });
      return mapping;
    },
  );

  get logButtonTitle() {
    return this._thirdPartyService.callLoggerTitle;
  }

  get showLogModal() {
    return this._thirdPartyService.showLogModal;
  }
}
