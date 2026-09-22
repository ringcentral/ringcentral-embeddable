import {
  computed,
  injectable,
  optional,
  RcModule,
} from '@ringcentral-integration/next-core';
import {
  ContactMatcher,
} from '@ringcentral-integration/micro-contacts/src/app/services/ContactMatcher';
import {
  ActivityMatcher,
} from '@ringcentral-integration/micro-contacts/src/app/services/ActivityMatcher';

import type { CxAddSessionNotification, CxBaseCall } from '../CxClient/interfaces';
import { CxClient } from '../CxClient';
import { CxPresence } from '../CxPresence';
import { CxCallDataSource } from '../CxCallDataSource';
import { makeCallsUniqueIdentifies } from '../../lib/callUniqueIdentifies';
import { getCallAni } from '../../lib/getCxCallNumbers';
import type {
  CxCallMonitorOptions,
  CxCallData,
  OnCallRingingCallback,
  OnCallAnsweredCallback,
  OnCallEndedCallback,
} from './CxCallMonitor.interface';

/**
 * CxCallMonitor module - Call monitoring with contact/activity matching
 * Enriches call data with contact and activity matches
 */
@injectable({
  name: 'CxCallMonitor',
})
class CxCallMonitor extends RcModule {
  constructor(
    private cxClient: CxClient,
    private cxPresence: CxPresence,
    private cxCallDataSource: CxCallDataSource,
    @optional() private contactMatcher?: ContactMatcher,
    @optional() private activityMatcher?: ActivityMatcher,
    @optional('CxCallMonitorOptions') private evCallMonitorOptions?: CxCallMonitorOptions,
  ) {
    super();
    this._registerMatcherQuerySources();
  }

  /**
   * Register query sources with matchers
   */
  private _registerMatcherQuerySources(): void {
    this.contactMatcher?.addQuerySource({
      getQueriesFn: () => this.uniqueIdentifies,
      readyCheckFn: () => this.cxPresence.ready,
    });
    this.activityMatcher?.addQuerySource({
      getQueriesFn: () => this.callIds,
      readyCheckFn: () => this.cxPresence.ready,
    });
  }

  /**
   * Force match contact for a call
   */
  async getMatcher(call: CxCallData): Promise<void> {
    const phoneNumber = getCallAni(call);
    if (this.contactMatcher && phoneNumber) {
      await this.contactMatcher.forceMatchNumber({ phoneNumber });
    }
  }

  /**
   * Check if agent is currently on a call
   */
  get isOnCall(): boolean {
    return this.calls.length > 0;
  }

  /**
   * Current agent calls
   */
  get calls(): CxBaseCall[] {
    return this.cxPresence.calls || [];
  }

  /**
   * Other agent calls (transfer scenarios)
   */
  get otherCalls(): CxBaseCall[] {
    return this.cxPresence.otherCalls || [];
  }

  /**
   * Call logs (ended calls)
   */
  get callLogs(): CxBaseCall[] {
    return this.cxPresence.callLogs || [];
  }

  /**
   * Current agent call IDs
   */
  get callIds(): string[] {
    return this.cxPresence.callIds || [];
  }

  /**
   * Other call IDs
   */
  get otherCallIds(): string[] {
    return this.cxPresence.otherCallIds || [];
  }

  /**
   * Call log IDs
   */
  get callLogsIds(): string[] {
    return this.cxPresence.callLogsIds || [];
  }

  /**
   * Raw calls data mapping from presence
   */
  get callsDataMapping(): Record<string, CxBaseCall> {
    return this.cxPresence.callsMapping || {};
  }

  /**
   * Contact matches from ContactMatcher
   */
  get contactMatches(): Record<string, any[]> {
    return (this.contactMatcher?.dataMapping as Record<string, any[]>) || {};
  }

  /**
   * Activity matches from ActivityMatcher
   */
  get activityMatches(): Record<string, any[]> {
    return this.activityMatcher?.dataMapping || {};
  }

  /**
   * Calls mapping enriched with contact and activity matches
   */
  @computed((that: CxCallMonitor) => [
    that.callsDataMapping,
    that.contactMatches,
    that.activityMatches,
  ])
  get callsMapping(): Record<string, CxCallData> {
    const { callsDataMapping, contactMatches, activityMatches } = this;

    return Object.entries(callsDataMapping).reduce<Record<string, CxCallData>>(
      (mapping, [key, call]) => {
        const contactMatchIdentify = getCallAni(call);

        const id = call.session ? this.getCallId(call.session) : null;
        const recordingUrl = call.session?.recordingUrl;
        const { agentFirstName, agentLastName } = call.baggage || {};

        const agentName =
          agentFirstName && agentLastName
            ? `${agentFirstName} ${agentLastName}`
            : null;

        return {
          ...mapping,
          [key]: {
            ...call,
            recordingUrl,
            agentName,
            contactMatches: contactMatches[contactMatchIdentify] || [],
            activityMatches:
              id && activityMatches[id] ? activityMatches[id] : [],
          } as CxCallData,
        };
      },
      {},
    );
  }

  /**
   * Unique identifiers for contact matching
   */
  @computed((that: CxCallMonitor) => [that.calls])
  get uniqueIdentifies(): string[] {
    return makeCallsUniqueIdentifies(this.calls);
  }

  /**
   * Get main call by UII
   */
  getMainCall(uii: string): CxBaseCall | undefined {
    return this.cxPresence.getMainCall(uii);
  }

  /**
   * Check if calls are limited
   */
  get callsLimited(): boolean {
    return this.cxCallDataSource.callsLimited;
  }

  /**
   * Limit calls in data source
   */
  async limitCalls() {
    await this.cxCallDataSource.limitCalls();
  }

  /**
   * Get call ID from session info
   */
  getCallId({ uii, sessionId }: Partial<CxAddSessionNotification>): string {
    return this.cxClient.encodeUii({ uii, sessionId });
  }

  /**
   * Get active call list for a given call ID
   */
  getActiveCallList(
    callIds: string[],
    otherCallIds: string[],
    callsMapping: Record<string, CxCallData>,
    id: string,
  ): CxCallData[] {
    return this.cxPresence.getActiveCallList(
      callIds,
      otherCallIds,
      callsMapping,
      id,
    ) as CxCallData[];
  }

  /**
   * Update activity matches
   */
  async updateActivityMatches({ forceMatch = false } = {}): Promise<void> {
    if (this.activityMatcher) {
      await this.activityMatcher.match({
        queries: this.activityMatcher._getQueries(),
        ignoreCache: forceMatch,
      });
    }
  }

  /**
   * Register callback for call ringing events
   */
  onCallRinging(callback: OnCallRingingCallback): this {
    this.cxPresence.onCallRinging(callback);
    return this;
  }

  /**
   * Register callback for call answered events
   */
  onCallAnswered(callback: OnCallAnsweredCallback): this {
    this.cxPresence.onCallAnswered(callback);
    return this;
  }

  /**
   * Register callback for call ended events
   */
  onCallEnded(callback: OnCallEndedCallback): this {
    this.cxPresence.onCallEnded(callback);
    return this;
  }
}

export { CxCallMonitor };
