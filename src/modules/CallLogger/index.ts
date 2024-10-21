import { computed, watch } from '@ringcentral-integration/core';
import { Module } from '@ringcentral-integration/commons/lib/di';
import { CallLogger as CallLoggerBase } from '@ringcentral-integration/commons/modules/CallLogger';
import { callLoggerTriggerTypes } from '@ringcentral-integration/commons/enums/callLoggerTriggerTypes';

@Module({
  name: 'CallLogger',
  deps: ['ThirdPartyService', 'CallLog'],
})
export class CallLogger extends CallLoggerBase {
  private _logFunction: (data: any) => Promise<void>;
  private _readyCheckFunction: () => boolean;
  private _autoLogHistoryCallsTimer: null | NodeJS.Timeout;

  constructor(deps) {
    super(deps);
    this._logFunction = async (data) => {
      await this._doLog(data);
    };
    this._readyCheckFunction = () => this._deps.thirdPartyService.callLoggerRegistered;
    this._autoLogHistoryCallsTimer = null;
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

  override async onInit() {
    if (super.onInit) {
      await super.onInit();
    }
    if (
      this.autoLogReadOnly &&
      this._deps.thirdPartyService.callLoggerAutoSettingReadOnlyValue !== null &&
      this._deps.thirdPartyService.callLoggerAutoSettingReadOnlyValue !== this._autoLog
    ) {
      this._setAutoLog(this._deps.thirdPartyService.callLoggerAutoSettingReadOnlyValue);
    }
  }

  override onInitOnce() {
    super.onInitOnce();
    watch(
      this,
      () => [this._deps.callLog.calls, this.ready, this.autoLog, this.autoLogOnCallSync],
      () => {
        if (this._autoLogHistoryCallsTimer) {
          clearTimeout(this._autoLogHistoryCallsTimer);
          this._autoLogHistoryCallsTimer = null;
        }
        if (
          !this.ready ||
          !this.autoLog ||
          !this.autoLogOnCallSync ||
          this._deps.callLog.calls.length === 0
        ) {
          return;
        }
        this._autoLogHistoryCallsTimer = setTimeout(() => {
          this._autoLogHistoryCalls();
        }, 10000);
      },
      {
        multiple: true,
      }
    );
  }

  async _autoLogHistoryCalls() {
    if (!this.autoLog || !this.ready || !this.autoLogOnCallSync) {
      return;
    }
    await this._deps.activityMatcher.triggerMatch();
    let historyCalls = this._deps.callHistory.calls.filter(call => {
      if (!call.action) {
        // not real call log, from endedCalls
        return false;
      }
      const activityMatches = this._deps.activityMatcher.dataMapping[call.sessionId] || [];
      if (activityMatches.length > 0) {
        return false;
      }
      // only logged history calls before 1 minutes
      if (call.startTime + call.duration * 1000 > Date.now() - 60 * 1000) {
        return false;
      }
      // only logged history calls within 7 days
      if (call.startTime < Date.now() - 7 * 24 * 60 * 60 * 1000) {
        return false;
      }
      return true;
    });
    if (historyCalls.length === 0) {
      return;
    }
    // only log the latest 20 history call, other calls will be logged next time
    historyCalls = historyCalls.slice(0, 20);
    for (const call of historyCalls) {
      await this._onCallUpdated(
        call,
        callLoggerTriggerTypes.callLogSync,
      );
    }
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

  get autoLogOnCallSync() {
    return this._deps.thirdPartyService.callLoggerAutoLogOnCallSync;
  }
}
