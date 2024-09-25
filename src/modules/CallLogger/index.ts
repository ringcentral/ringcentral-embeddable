import { computed } from '@ringcentral-integration/core';
import { Module } from '@ringcentral-integration/commons/lib/di';
import { CallLogger as CallLoggerBase } from '@ringcentral-integration/commons/modules/CallLogger';

@Module({
  name: 'CallLogger',
  deps: ['ThirdPartyService'],
})
export class CallLogger extends CallLoggerBase {
  constructor(deps) {
    super(deps);
    this._logFunction = async (data) => {
      await this._doLog(data);
    };
    this._readyCheckFunction = () => this._deps.thirdPartyService.callLoggerRegistered;
  }

  async _doLog({ item, ...options }) {
    delete item.toNumberEntity;
    await this._deps.thirdPartyService.logCall({ call: item, ...options });
  }

  @computed(that => [that._deps.callMonitor.calls, that._deps.callHistory.calls])
  get allCallMapping() {
    const mapping = {};
    this._deps.callMonitor.calls.forEach((call) => {
      mapping[call.sessionId] = call;
    });
    this._deps.callHistory.calls.forEach((call) => {
      mapping[call.sessionId] = call;
    });
    return mapping;
  }

  get logButtonTitle() {
    return this._deps.thirdPartyService.callLoggerTitle;
  }

  get showLogModal() {
    return this._deps.thirdPartyService.showLogModal;
  }

  get autoLogReadOnly() {
    return this._deps.thirdPartyService.callLoggerAutoSettingReadOnly;
  }

  get autoLogReadOnlyReason() {
    return this._deps.thirdPartyService.callLoggerAutoSettingReadOnlyReason;
  }
}
