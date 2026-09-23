import { Locale } from '@ringcentral-integration/micro-core/src/app/services';
import {
  ContactMatcher,
} from '@ringcentral-integration/micro-contacts/src/app/services/ContactMatcher';
import {
  ActivityMatcher,
} from '@ringcentral-integration/micro-contacts/src/app/services/ActivityMatcher';

import {
  action,
  computed,
  injectable,
  optional,
  RcModule,
  state,
  delegate,
  PortManager,
} from '@ringcentral-integration/next-core';

import { hasLoggedCallActivity } from '../../../app/views/CallHistoryView/CallHistoryLogAction';
import { callDirection } from '../../enums';
import { ringCXLogId } from '../../lib/formatRingCXCall';
import { directTransferNotificationTypes } from '../../enums/directTransferNotificationTypes';
import { CxCallbackTypes } from '../CxClient/enums/callbackTypes';
import type { HistoryItemResponse } from '../CxClient/interfaces';
import { CxAuth } from '../CxAuth';
import { CxClient } from '../CxClient';
import { CxPresence } from '../CxPresence';
import { CxSubscription } from '../CxSubscription';
import { CxAgentSession } from '../CxAgentSession';
import { CxCallDisposition } from '../CxCallDisposition';
import { formatHistoryCall } from './formatHistoryCall';
import { getHistoryContactMatchIdentify } from './get-history-contact-match-identify';
import { t } from './i18n';
import type {
  ActivityMatch,
  ContactMatch,
  FormattedCall,
} from './CxCallHistory.interface';

const PAGE_SIZE = 500;

const EMPTY_MATCHES = Object.freeze([]) as unknown as ContactMatch[];
const EMPTY_ACTIVITY_MATCHES = Object.freeze(
  [],
) as unknown as ActivityMatch[];
const EMPTY_CONTACT_MATCH_MAP = Object.freeze({}) as Record<
  string,
  ContactMatch[]
>;
const EMPTY_ACTIVITY_MATCH_MAP = Object.freeze({}) as Record<
  string,
  ActivityMatch[]
>;

/**
 * Minimum gap between focus-triggered refreshes. The list refreshes whenever
 * the window regains focus, which for a docked widget is often.
 */
const REFRESH_THROTTLE_MS = 30 * 1000;

/**
 * `useConnector` shallow-compares what `getUIProps` returns, so an empty page
 * must keep a stable identity or every consumer re-renders on unrelated store
 * changes.
 */
const EMPTY_ITEMS = Object.freeze([]) as unknown as HistoryItemResponse[];

/**
 * CxCallHistory module - server-backed call history.
 *
 * Reads the agent history endpoint rather than the socket's local call log, so
 * the list covers every device the agent has used, not just this browser.
 * Pages are held in `@state` rather than `@storage`: the server keeps only ~48
 * hours, and next-core already mirrors server-port state to every client port,
 * so a second tab inherits the loaded pages without persisting stale rows.
 */
@injectable({
  name: 'CxCallHistory',
})
class CxCallHistory extends RcModule {
  /**
   * Request bookkeeping is intentionally plain rather than `@state`: it is only
   * ever touched on the server port, because every mutator below is
   * `@delegate('server')`. A future mutator that is *not* delegated would keep
   * per-port copies and silently break the stale-response guard.
   */
  private _requestSeq = 0;

  private _requestId = 0;

  private _hasFailed = false;

  private _searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private cxClient: CxClient,
    private cxAuth: CxAuth,
    private cxPresence: CxPresence,
    private cxSubscription: CxSubscription,
    private cxAgentSession: CxAgentSession,
    private cxCallDisposition: CxCallDisposition,
    private locale: Locale,
    private portManager: PortManager,
    @optional() private contactMatcher?: ContactMatcher,
    @optional() private activityMatcher?: ActivityMatcher,
  ) {
    super();
    if (this.portManager?.shared) {
      this.portManager.onServer(() => {
        this.initialize();
      });
    } else {
      this.initialize();
    }
  }

  /** Host has registered a contact match provider. */
  @computed((that: CxCallHistory) => [that.contactMatcher])
  get isContactMatcherEnabled(): boolean {
    return !!this.contactMatcher;
  }

  /** Host has registered a call-log (activity) match provider. */
  @computed((that: CxCallHistory) => [that.activityMatcher])
  get isCallLogMatcherEnabled(): boolean {
    return !!this.activityMatcher;
  }

  /**
   * Contact matches keyed by plain phone number.
   */
  @computed((that: CxCallHistory) => [that.contactMatcher?.dataMapping])
  get contactMatches(): Record<string, ContactMatch[]> {
    return (
      (this.contactMatcher?.dataMapping as Record<string, ContactMatch[]>) ||
      EMPTY_CONTACT_MATCH_MAP
    );
  }

  /**
   * Call-log matches keyed by session / segment id.
   */
  @computed((that: CxCallHistory) => [that.activityMatcher?.dataMapping])
  get activityMatches(): Record<string, ActivityMatch[]> {
    return (
      (this.activityMatcher?.dataMapping as unknown as Record<
        string,
        ActivityMatch[]
      >) ||
      EMPTY_ACTIVITY_MATCH_MAP
    );
  }

  /**
   * Match phones for the calls currently shown in the list or detail.
   *
   * Uses cached `match` (not `forceMatchBatchNumbers`) so filling in names
   * does not re-hit the host. Only queries that are not already cached are
   * sent.
   */
  matchCalls(calls: FormattedCall[]): void {
    if (!this.isContactMatcherEnabled || !this.contactMatcher) {
      return;
    }
    const phoneNumbers = Array.from(
      new Set(
        calls
          .map((call) => this.getCallContactMatchIdentify(call))
          .filter((query): query is string => !!query),
      ),
    );
    if (phoneNumbers.length === 0) {
      return;
    }
    void this.contactMatcher.match({
      queries: phoneNumbers,
      ignoreCache: false,
    });
  }

  /**
   * Match CRM call logs for the calls currently shown in the list or detail.
   */
  matchCallLogs(calls: FormattedCall[]): void {
    if (!this.isCallLogMatcherEnabled || !this.activityMatcher) {
      return;
    }
    const queries = Array.from(
      new Set(calls.flatMap((call) => this.getCallActivityMatchQueries(call))),
    );
    if (queries.length === 0) {
      return;
    }
    void this.activityMatcher.match({
      queries,
      ignoreCache: false,
    });
  }

  /**
   * Stable ContactMatcher query key for a formatted history row.
   */
  getCallContactMatchIdentify(call: FormattedCall): string | undefined {
    const phoneNumber = call.dialableNumber?.replace(/@RC_EXT$/i, '');
    if (!phoneNumber) {
      return undefined;
    }
    return phoneNumber;
  }

  /**
   * ActivityMatcher key for a history row.
   *
   * One id per call leg: the live `uii$sessionId` when this browser handled
   * the call, otherwise the history row id. That is the id `logCall` sends.
   */
  getCallActivityMatchQueries(call: FormattedCall): string[] {
    const id = ringCXLogId({
      id: call.id,
      localCallId: call.localCallId,
      uii: call.uii,
      sessionId: call.sessionId,
    });
    return id ? [id] : [];
  }

  private _getActivityMatchesForCall(
    call: Pick<FormattedCall, 'id' | 'localCallId' | 'uii' | 'sessionId'>,
  ): ActivityMatch[] {
    for (const query of this.getCallActivityMatchQueries(
      call as FormattedCall,
    )) {
      const matches = this.activityMatches[query];
      if (matches?.length) {
        return matches;
      }
    }
    return EMPTY_ACTIVITY_MATCHES;
  }

  @state
  items: HistoryItemResponse[] = EMPTY_ITEMS;

  /**
   * When the loaded page was last fetched. `@state` so client ports see the
   * same value — focus refresh runs on the client and must not treat this as
   * always-stale (a plain field only updated on the server).
   */
  @state
  lastFetchedAt = 0;

  /** First fetch or refresh: the list shows a full-area spinner. */
  @state
  isLoading = false;

  @state
  error = false;

  @state
  searchInput = '';

  @action
  updateSearchInput(value: string) {
    this.searchInput = value;
  }

  /**
   * Kept for the search box's existing contract. Filtering itself is synchronous
   * through `latestCalls`; this only coalesces rapid typing.
   */
  debouncedSearch() {
    if (this._searchDebounceTimer) {
      clearTimeout(this._searchDebounceTimer);
    }
    this._searchDebounceTimer = setTimeout(() => {
      this._searchDebounceTimer = null;
    }, 300);
  }

  @action
  private _startLoad() {
    this.isLoading = true;
    this.error = false;
  }

  @action
  private _finishLoad(error: boolean) {
    this.isLoading = false;
    this.error = error;
  }

  @action
  private _replacePage(items: HistoryItemResponse[]) {
    this.items = items;
    this.lastFetchedAt = Date.now();
  }

  @action
  private _clear() {
    this.items = EMPTY_ITEMS;
    this.isLoading = false;
    this.error = false;
    this.lastFetchedAt = 0;
  }

  /**
   * Take a new request id, invalidating anything already in flight.
   *
   * The guard is an id rather than a comparison of the response against current
   * state: two in-flight fetches are indistinguishable by value.
   */
  private _invalidate(): number {
    this._requestSeq += 1;
    this._requestId = this._requestSeq;
    return this._requestId;
  }

  private _isCurrent(requestId: number): boolean {
    return this._requestId === requestId;
  }

  /**
   * Load the newest page, replacing whatever is loaded.
   *
   * Without `force` an already-populated list is left alone, so simply opening
   * the tab does not refetch.
   */
  @delegate('server')
  async fetchFirstPage(force = false): Promise<void> {
    if (!force && (this.items.length > 0 || this.isLoading)) {
      return;
    }
    await this._perform(this._invalidate());
  }

  @delegate('server')
  async refresh(): Promise<void> {
    await this._perform(this._invalidate());
  }

  @delegate('server')
  async clearAll(): Promise<void> {
    this._invalidate();
    this._hasFailed = false;
    this._clear();
  }

  @delegate('server')
  async retry(): Promise<void> {
    if (!this._hasFailed || this.isLoading) {
      return;
    }
    await this._perform(this._invalidate());
  }

  private async _perform(requestId: number): Promise<void> {
    const agentId = this.cxAuth.agentId;
    if (!agentId) {
      return;
    }
    this._startLoad();
    try {
      const authorized = await this.cxAuth.refreshEvToken();
      if (!this._isCurrent(requestId)) {
        return;
      }
      if (!authorized) {
        this._hasFailed = true;
        this._finishLoad(true);
        return;
      }
      const response = await this.cxClient.getAgentHistory({
        agentId,
        size: PAGE_SIZE,
        before: '',
        archived: true,
        channelClass: 'VOICE',
      });
      if (!this._isCurrent(requestId)) {
        return;
      }
      this._replacePage(response?.items ?? []);
      this._hasFailed = false;
      this._finishLoad(false);
    } catch (error) {
      this.logger.warn('getAgentHistory failed', error);
      if (this._isCurrent(requestId)) {
        this._hasFailed = true;
        this._finishLoad(true);
      }
    }
  }

  @computed((that: CxCallHistory) => [
    that.items,
    that.locale.currentLocale,
    that.cxPresence.callsMapping,
    that.cxCallDisposition.dispositionStateMapping,
    that.contactMatches,
    that.activityMatches,
  ])
  get formattedCalls(): FormattedCall[] {
    return this.items.map((item) => {
      const call = formatHistoryCall(item, {
        currentLocale: this.locale.currentLocale,
        manualLabel: t('manual'),
      });
      const localCallId = call.segmentId
        ? this.cxPresence.getCallIdBySegmentId(call.segmentId)
        : undefined;
      const activityMatches = this._getActivityMatchesForCall({
        id: call.id,
        localCallId,
        uii: call.uii,
        sessionId: call.sessionId,
      });
      // A disposition submitted moments ago is not on the server page yet, so
      // trust the local record / CRM activity match to keep the logged tick.
      const isDisposed =
        call.isDisposed ||
        (!!localCallId && this.cxCallDisposition.isDisposed(localCallId)) ||
        activityMatches.length > 0;
      const contactMatchIdentify = getHistoryContactMatchIdentify(item);
      const contactMatches = contactMatchIdentify
        ? this.contactMatches[contactMatchIdentify] || EMPTY_MATCHES
        : EMPTY_MATCHES;
      const matchName = contactMatches[0]?.name;
      const isOutbound = call.direction === callDirection.outbound;
      return {
        ...call,
        localCallId,
        activityMatches,
        isDisposed,
        isLogged: hasLoggedCallActivity({ activityMatches }),
        fromMatches: contactMatches,
        toMatches: contactMatches,
        fromName:
          !isOutbound && matchName ? matchName : call.fromName,
        toName: isOutbound && matchName ? matchName : call.toName,
      };
    });
  }

  @computed((that: CxCallHistory) => [that.formattedCalls, that.searchInput])
  get latestCalls(): FormattedCall[] {
    if (!this.searchInput || this.searchInput.trim() === '') {
      return this.formattedCalls;
    }
    const searchTerm = this.searchInput.toLowerCase().trim();
    return this.formattedCalls.filter((call) => {
      const fromName = call.fromName?.toLowerCase() || '';
      const toName = call.toName?.toLowerCase() || '';
      const fromPhone = call.from?.phoneNumber?.toLowerCase() || '';
      const toPhone = call.to?.phoneNumber?.toLowerCase() || '';
      return (
        fromName.includes(searchTerm) ||
        toName.includes(searchTerm) ||
        fromPhone.includes(searchTerm) ||
        toPhone.includes(searchTerm)
      );
    });
  }

  getCallById(id?: string): FormattedCall | undefined {
    if (!id) return undefined;
    return this.formattedCalls.find((call) => call.id === id);
  }

  /**
   * Called when the history list mounts while the document is focused.
   *
   * Throttled because switching to the History tab remounts the list and would
   * otherwise refetch on every visit. Uses synced `lastFetchedAt` so the
   * client-side check matches the server fetch time.
   */
  updateLastCheckTimeStamp() {
    if (
      this.lastFetchedAt > 0 &&
      Date.now() - this.lastFetchedAt < REFRESH_THROTTLE_MS
    ) {
      return;
    }
    // Already have rows: refresh in the background. Empty list: first load.
    if (this.items.length > 0) {
      void this.refresh();
      return;
    }
    void this.fetchFirstPage(false);
  }

  initialize() {
    this.cxSubscription.subscribe(
      CxCallbackTypes.DIRECT_AGENT_TRANSFER_NOTIF,
      (data: { status: string; ani?: string }) => {
        if (data.status === directTransferNotificationTypes.VOICEMAIL) {
          // TODO: add `data` for list and alert message about 'Direct Transfer: data.ani, Click to view call detail.'
          this.logger.info('Direct transfer voicemail notification', data);
        }
      },
    );
    this.cxAgentSession.onConfigSuccess(async () => {
      // Still the only caller of limitCalls: local call data is no longer read
      // for history, but active-call modules depend on it and it would
      // otherwise grow without bound.
      if (!this.cxPresence.callsLimited && !this.cxPresence.calls.length) {
        await this.cxPresence.limitCalls();
      }
      await this.fetchFirstPage(true);
    });
    // History is account data; it must not outlive the agent.
    this.cxAuth.beforeAgentLogout(() => {
      this.clearAll();
    });
  }

  /**
   * Second net for the logout listener, which is registered on the server port
   * only. Done locally rather than through the delegated `clearAll` because on
   * teardown the ports may already be going away.
   */
  override async onReset() {
    this._invalidate();
    this._hasFailed = false;
    this._clear();
  }
}

export { CxCallHistory };
