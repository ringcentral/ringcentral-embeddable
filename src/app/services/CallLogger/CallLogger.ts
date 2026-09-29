import type { HistoryCall } from "@ringcentral-integration/micro-phone/src/app/services/CallHistory";
import type { Entity } from "@ringcentral-integration/commons/interfaces/Entity.interface";
import type { CallLoggerOptions } from "@ringcentral-integration/micro-phone/src/app/services/CallLogger/CallLogger.interface";
import {
  ActivityMatcher,
  ContactMatcher,
} from "@ringcentral-integration/micro-contacts/src/app/services";
import {
  CallHistory,
  CallLogger as CallLoggerBase,
  CallMonitor,
} from "@ringcentral-integration/micro-phone/src/app/services";
import {
  delegate,
  inject,
  injectable,
  optional,
  StoragePlugin,
} from "@ringcentral-integration/next-core";

import { SmartNotes } from "../SmartNotes";
import { ThirdParty } from "../ThirdParty";
import { getTranscriptText } from "../ThirdParty/ThirdParty.helper";
import type {
  ThirdPartyCall,
  ThirdPartyRecording,
} from "../ThirdParty/ThirdParty.interface";

const RECENT_CALL_GRACE_PERIOD = 20_000;
const DEFAULT_PAGE_SIZE = 100;
const DEFAULT_PAGE = 1;
const MAXIMUM_SMART_NOTE_CALLS = 10;

type UnloggedCallsQuery = {
  perPage?: number;
  page?: number;
};

export type CompatibleActivityMatch = {
  contact?: string | { id?: string };
  contactId?: string;
  note?: string;
  status?: string;
  type?: string;
  [key: string]: unknown;
};

export type CompatibleCall = Omit<
  HistoryCall,
  "activityMatches" | "recording"
> & {
  activityMatches?: CompatibleActivityMatch[];
  aiNote?: string | null;
  source?: "ringcentral" | "ringcx";
  ringcx?: {
    notes?: string;
    recordingUrl?: string;
    disposition?: { id?: string; name?: string };
    [key: string]: unknown;
  };
  callSelectionInfo?: {
    displayedSelection: Entity;
    selections: Entity[];
  };
  transcript?: string | null;
  recording?:
    | (ThirdPartyRecording & {
        link?: string | null;
      })
    | null;
};

type UnloggedCallsResult = {
  calls: CompatibleCall[];
  hasMore: boolean;
};

/**
 * Restores the host-facing call lookup APIs that are not provided by the
 * upstream next CallLogger service.
 */
@injectable({
  name: "CallLogger",
})
class CallLogger extends CallLoggerBase {
  constructor(
    storage: StoragePlugin,
    callHistory: CallHistory,
    callMonitor: CallMonitor,
    @inject("CallLoggerOptions") callLoggerOptions: CallLoggerOptions,
    @inject(ThirdParty) private readonly _thirdParty: ThirdParty,
    @inject(SmartNotes) private readonly _smartNotes: SmartNotes,
    @optional() activityMatcher?: ActivityMatcher,
    @optional() contactMatcher?: ContactMatcher
  ) {
    super(
      storage,
      callHistory,
      callMonitor,
      callLoggerOptions,
      activityMatcher,
      contactMatcher
    );
    this._ignoreModuleReadiness(this._smartNotes);
  }

  get logButtonTitle(): string | null {
    return this._thirdParty.callLoggerTitle;
  }

  get showLogModal(): boolean {
    return this._thirdParty.showLogModal;
  }

  get autoLogReadOnly(): boolean {
    return this._thirdParty.callLoggerAutoSettingReadOnly;
  }

  get autoLogReadOnlyReason(): string {
    return this._thirdParty.callLoggerAutoSettingReadOnlyReason;
  }

  get autoLogOnCallSync(): boolean {
    return this._thirdParty.callLoggerAutoLogOnCallSync;
  }

  get hideEditLogButton(): boolean {
    return this._thirdParty.callLoggerHideEditLogButton;
  }

  override onInit(): void {
    const readOnlyValue = this._thirdParty.callLoggerAutoSettingReadOnlyValue;
    if (
      this.autoLogReadOnly &&
      typeof readOnlyValue === "boolean" &&
      readOnlyValue !== this.autoLog
    ) {
      this._setAutoLog(readOnlyValue);
    }
  }

  /**
   * Returns recent calls that have not yet been logged to a third-party
   * activity, preserving the legacy pagination and enrichment contract.
   */
  @delegate("server")
  async getRecentUnloggedCalls({
    perPage = DEFAULT_PAGE_SIZE,
    page = DEFAULT_PAGE,
  }: UnloggedCallsQuery = {}): Promise<UnloggedCallsResult> {
    await this._activityMatcher?.triggerMatch();
    const unloggedCalls = this._callHistory.calls.filter((call) =>
      this._isUnloggedCall(call)
    );
    const pageCalls = unloggedCalls.slice((page - 1) * perPage, page * perPage);
    await this._querySmartNotes(pageCalls);
    return {
      calls: await Promise.all(
        pageCalls.map((call) => this._enrichCall(call, false))
      ),
      hasMore: unloggedCalls.length > page * perPage,
    };
  }

  /**
   * Finds and enriches one historical call by either supported identifier.
   */
  @delegate("server")
  async getCall(
    sessionId?: string,
    telephonySessionId?: string
  ): Promise<CompatibleCall | null> {
    const call = this._callHistory.calls.find(
      (item) =>
        item.sessionId === sessionId ||
        item.telephonySessionId === telephonySessionId
    );
    if (!call) {
      return null;
    }
    await this._querySmartNotes([call]);
    return this._enrichCall(call, true);
  }

  private _isUnloggedCall(call: HistoryCall): boolean {
    if (!call.action) {
      return false;
    }
    const activityMatches =
      (this._activityMatcher?.dataMapping[call.sessionId ?? ""] as unknown as
        | CompatibleActivityMatch[]
        | undefined) ?? [];
    const hasLoggedActivity = activityMatches.some(
      (match: { type?: string }) => match.type !== "status"
    );
    if (hasLoggedActivity) {
      return false;
    }
    const endTime = (call.startTime ?? 0) + (call.duration ?? 0) * 1_000;
    return endTime <= Date.now() - RECENT_CALL_GRACE_PERIOD;
  }

  private async _querySmartNotes(calls: HistoryCall[]): Promise<void> {
    if (!this._smartNotes.hasPermission) {
      return;
    }
    const telephonySessionIds = calls
      .map((call) => call.telephonySessionId)
      .filter((id): id is string => Boolean(id))
      .slice(0, MAXIMUM_SMART_NOTE_CALLS);
    if (telephonySessionIds.length > 0) {
      await this._smartNotes.queryNotedCalls(telephonySessionIds);
    }
  }

  private async _enrichCall(
    call: HistoryCall,
    includeActivityMatches: boolean
  ): Promise<CompatibleCall> {
    const telephonySessionId = call.telephonySessionId;
    const aiNote =
      this._smartNotes.hasPermission && telephonySessionId
        ? await this._smartNotes.fetchSmartNoteText(telephonySessionId)
        : null;
    const transcript =
      this._smartNotes.hasPermission && telephonySessionId
        ? await this._smartNotes.fetchTranscript(telephonySessionId)
        : null;
    return {
      ...call,
      ...(includeActivityMatches
        ? {
            activityMatches:
              (this._activityMatcher?.dataMapping[
                call.sessionId ?? ""
              ] as unknown as CompatibleActivityMatch[] | undefined) ?? [],
          }
        : {}),
      aiNote,
      recording: call.recording
        ? {
            ...call.recording,
            link: this._thirdParty.getRecordingLink(call.recording),
            contentUri: this._thirdParty.getRecordingContentUri(call.recording),
          }
        : includeActivityMatches
        ? null
        : call.recording,
      transcript: transcript
        ? getTranscriptText(transcript, call as ThirdPartyCall)
        : null,
    };
  }
}

export { CallLogger, CallLogger as EmbeddableCallLogger };

/**
 * Dependency-injection token for the host call logger.
 *
 * App config binds the micro-phone `CallLogger` class to this local class.
 * Inject `HostCallLogger`, not `CallLogger`, or a second module named
 * `CallLogger` is created when the RingCX chunk loads.
 */
export { CallLogger as HostCallLogger } from "@ringcentral-integration/micro-phone/src/app/services";
