import { computed } from '@ringcentral-integration/core';
import { Module } from '@ringcentral-integration/commons/lib/di';
import { CallLogger as CallLoggerBase } from '@ringcentral-integration/commons/modules/CallLogger';
import { isRinging } from '@ringcentral-integration/commons/lib/callLogHelpers';
import { callLoggerTriggerTypes } from '@ringcentral-integration/commons/enums/callLoggerTriggerTypes';
import { getTranscriptText } from '../ThirdPartyService/helper';

@Module({
  name: 'CallLogger',
  deps: ['ThirdPartyService', 'CallLog', 'SmartNotes'],
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
    this._deps.smartNotes.onSmartNoteUpdate(this.onCallNoteUpdated);
  }

  async _doLog({ item, ...options }) {
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
    let calls = this._deps.callHistory.calls.filter(call => {
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
    const aiNotes = {};
    const transcripts = {};
    calls = calls.slice((page - 1) * perPage, page * perPage);
    if (this._deps.smartNotes.hasPermission) {
      let telephonySessionIds = calls.map((call) => call.telephonySessionId);
      // only query 10 calls at a time
      if (telephonySessionIds.length > 10) {
        telephonySessionIds = telephonySessionIds.slice(0, 10);
      }
      await this._deps.smartNotes.queryNotedCalls(telephonySessionIds);
      for (const telephonySessionId of telephonySessionIds) {
        aiNotes[telephonySessionId] = await this._deps.smartNotes.fetchSmartNoteText(telephonySessionId);
        transcripts[telephonySessionId] = await this._deps.smartNotes.fetchTranscript(telephonySessionId);
      }
    }
    return {
      calls: calls.map((call) => {
        const transcript = transcripts[call.telephonySessionId] ? getTranscriptText(transcripts[call.telephonySessionId], call) : null;
        if (!call.recording) {
          return {
            ...call,
            aiNote: aiNotes[call.telephonySessionId],
            transcript,
          };
        }
        return {
          ...call,
          recording: {
            ...call.recording,
            link: this._deps.thirdPartyService.getRecordingLink(call.recording),
          },
          aiNote: aiNotes[call.telephonySessionId],
          transcript,
        };
      }),
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

  get hideEditLogButton() {
    return this._deps.thirdPartyService.callLoggerHideEditLogButton;
  }

  onCallNoteUpdated = (telephonySessionId) => {
    if (!this.ready) {
      return;
    }
    const call = this._deps.callHistory.calls.find(call => call.telephonySessionId === telephonySessionId);
    if (!call) {
      return;
    }
    this._onCallUpdated(call, callLoggerTriggerTypes.callLogSync);
  }
}
