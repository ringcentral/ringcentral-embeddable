import { computed } from '@ringcentral-integration/core';
import { Module } from '@ringcentral-integration/commons/lib/di';
import { CallLogger as CallLoggerBase } from '@ringcentral-integration/commons/modules/CallLogger';
import { isRinging } from '@ringcentral-integration/commons/lib/callLogHelpers';

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

  async _shouldLogUpdatedCall(call) {
    const isActive = await this._ensureActive();
    if (isActive && (this.logOnRinging || !isRinging(call))) {
      if (this.autoLog) return true;
      await this._deps.activityMatcher.triggerMatch();
      const activityMatches =
        this._deps.activityMatcher.dataMapping[call.sessionId] || [];
      const isLogging = !!this.loggingMap[call.sessionId];
      return activityMatches.length > 0 || isLogging;
    }
    return false;
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

  async getRecentUnloggedCalls({
    perPage = 100,
    page = 1,
  }) {
    await this._deps.activityMatcher.triggerMatch();
    const calls = this._deps.callHistory.calls.filter(call => {
      if (!call.action) {
        // not real call log, from endedCalls
        return false;
      }
      const activityMatches = this._deps.activityMatcher.dataMapping[call.sessionId] || [];
      if (
        activityMatches.length > 0 &&
        activityMatches.find((match) => match.type !== 'status')
      ) {
        return false;
      }
      // no recent 20s ended call, those calls will be handled by presenceUpdate triggerType
      if (call.startTime + call.duration * 1000 > Date.now() - 20 * 1000) {
        return false;
      }
      return true;
    });
    return {
      calls: calls.slice((page - 1) * perPage, page * perPage),
      hasMore: calls.length > page * perPage,
    };
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
