import type ReadUserCallLogParameters from '@rc-ex/core/lib/definitions/ReadUserCallLogParameters';
import type { ActiveCall } from '@ringcentral-integration/commons/interfaces/Presence.model';
import {
  removeDuplicateIntermediateCalls,
  removeInboundRingOutLegs,
  sortByStartTime,
} from '@ringcentral-integration/commons/lib/callLogHelpers';
import getDateFrom from '@ringcentral-integration/commons/lib/getDateFrom';
import type { WebSocketSubscription as Subscription } from '@ringcentral-integration/micro-auth/src/app/services';
import {
  AppFeatures,
  Auth,
  Client,
  ExtensionInfo,
  ExtensionPhoneNumber,
} from '@ringcentral-integration/micro-auth/src/app/services';
import {
  CallLog as CallLogBase,
  CallMonitor,
  type CallLogOptions,
  type CallLogRecord,
  type CallLogRecords,
  type SyncSuccessOptions,
  processRecords,
} from '@ringcentral-integration/micro-phone/src/app/services';
import {
  action,
  computed,
  delegate,
  inject,
  injectable,
  optional,
  state,
  StoragePlugin,
} from '@ringcentral-integration/next-core';
import { sleep } from '@ringcentral-integration/utils';

import type { AppFeatures as EmbeddableAppFeatures } from '../AppFeatures';

/**
 * The call direction older calls are paged under; `All` pages both.
 */
export type OlderCallsScope = 'All' | 'Inbound' | 'Outbound';

type CallRecordSummary = {
  type?: string;
  direction?: string;
  result?: string;
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

/**
 * How far back, in days, from the oldest listed call one older calls request
 * looks. Paging only ends after a quiet period this long.
 */
const OLDER_CALLS_LOOKBACK_DAYS = 365;

const OLDER_CALLS_PER_PAGE = 250;

/**
 * The shortest time, in milliseconds, between two older calls requests. The
 * call log list is a Heavy API (10 requests a minute), and the list keeps
 * asking for pages while its end is visible.
 */
const OLDER_CALLS_MIN_INTERVAL = 6 * 1000;

/**
 * How long, in milliseconds, paging waits after a failed request before
 * loading older calls again.
 */
const RETRY_INTERVAL = 30 * 1000;

/**
 * Returns whether a call log record belongs in the call history.
 *
 * Faxes come from the message store instead, and an outbound
 * `IP Phone Offline` record is replaced by a later record of the same call.
 */
function isHistoryCallRecord(record: object): boolean {
  const { type, direction, result } = record as CallRecordSummary;
  if (type === 'Fax') {
    return false;
  }
  return !(direction === 'Outbound' && result === 'IP Phone Offline');
}

/**
 * Returns the earliest start time among the calls, or `fallback` when none is
 * earlier.
 */
function getEarliestStartTime(
  calls: ReadonlyArray<{ startTime?: number }>,
  fallback: number,
): number {
  return calls.reduce(
    (earliest, call) =>
      typeof call.startTime === 'number' && call.startTime < earliest
        ? call.startTime
        : earliest,
    fallback,
  );
}

/**
 * Drops call log records the call history does not show, and loads calls
 * older than the synced day span on demand.
 */
@injectable({
  name: 'CallLog',
})
export class CallLog extends CallLogBase {
  constructor(
    _auth: Auth,
    _client: Client,
    _extensionPhoneNumber: ExtensionPhoneNumber,
    _extensionInfo: ExtensionInfo,
    _callMonitor: CallMonitor,
    @inject('Subscription') _subscription: Subscription,
    _appFeatures: AppFeatures,
    @optional() _storage?: StoragePlugin,
    @optional('CallLogOptions') _callLogOptions?: CallLogOptions,
  ) {
    super(
      _auth,
      _client,
      _extensionPhoneNumber,
      _extensionInfo,
      _callMonitor,
      _subscription,
      _appFeatures,
      _storage,
      _callLogOptions,
    );
  }

  /**
   * The start time of the oldest call fetched so far, so the next page always
   * moves further back, even when a page only repeats listed calls.
   */
  private _olderCallsCursor: number | null = null;

  private _olderCallsFailedAt = 0;

  private _olderCallsRequestedAt = 0;

  /**
   * Calls older than the synced ones, kept in memory only. Once any are
   * loaded, synced calls that expire out of the day span move here too, so the
   * list keeps no gap.
   */
  @state
  olderCalls: CallLogRecord[] = [];

  /**
   * The direction `olderCalls` was paged under; every older call of this
   * direction down to the oldest one is loaded.
   */
  @state
  olderCallsScope: OlderCallsScope = 'All';

  @state
  loadingOlderCalls = false;

  /**
   * `false` once the server has no older calls under the current scope.
   */
  @state
  hasMoreOlderCalls = true;

  /**
   * Whether the list can ask for another page of older calls.
   */
  get canLoadOlderCalls(): boolean {
    return this.hasMoreOlderCalls && this._canLoadOlderCalls;
  }

  @action
  private _appendOlderCalls(records: CallLogRecord[]): void {
    const ids = new Set(this.olderCalls.map((call) => call.id));
    records.forEach((record) => {
      if (record.id && !ids.has(record.id)) {
        ids.add(record.id);
        this.olderCalls.push(record);
      }
    });
  }

  @action
  private _setOlderCallsScope(scope: OlderCallsScope): void {
    this.olderCallsScope = scope;
  }

  @action
  private _setLoadingOlderCalls(loading: boolean): void {
    this.loadingOlderCalls = loading;
  }

  @action
  private _setHasMoreOlderCalls(hasMore: boolean): void {
    this.hasMoreOlderCalls = hasMore;
  }

  @action
  private _clearOlderCalls(scope: OlderCallsScope): void {
    this.olderCalls = [];
    this.olderCallsScope = scope;
    this.hasMoreOlderCalls = true;
  }

  private _resetOlderCalls(scope: OlderCallsScope = 'All'): void {
    this._olderCallsCursor = null;
    this._olderCallsFailedAt = 0;
    this._clearOlderCalls(scope);
  }

  private get _canLoadOlderCalls(): boolean {
    return Boolean(
      this.ready &&
        this._auth.loggedIn &&
        (this._appFeatures as EmbeddableAppFeatures).allowLoadMoreCalls,
    );
  }

  override onReset(): void {
    super.onReset();
    this._resetOlderCalls();
  }

  override syncSuccess(options: SyncSuccessOptions): void {
    this._keepExpiredCallsAsOlder(options.daySpan);
    super.syncSuccess({
      ...options,
      records: options.records?.filter(isHistoryCallRecord),
      supplementRecords: options.supplementRecords?.filter(isHistoryCallRecord),
    });
  }

  /**
   * Moves synced calls about to expire out of the day span into the older
   * calls, so a long-running session keeps them next to the older ones.
   */
  private _keepExpiredCallsAsOlder(daySpan: number): void {
    if (this.olderCalls.length === 0 || !daySpan) {
      return;
    }
    const cutoffTime = getDateFrom(daySpan).getTime();
    const expiredCalls = this.data.list
      .map((id) => this.data.map[id])
      .filter((call) => call && call.startTime <= cutoffTime);
    if (expiredCalls.length > 0) {
      this._appendOlderCalls(expiredCalls);
    }
  }

  /**
   * The upstream list until older calls are loaded; then the synced and older
   * calls together, uncapped and without the day span cutoff, so the synced
   * calls run straight into the older ones.
   */
  @computed
  override get calls(): ActiveCall[] {
    if (this.olderCalls.length === 0) {
      return super.calls;
    }
    const syncedCalls = this.data.list
      .map((id) => this.data.map[id])
      .filter(Boolean);
    const olderCalls = this.olderCalls.filter(
      (call) => !this.data.map[call.id!],
    );
    const visibleCalls = [...syncedCalls, ...olderCalls].filter((call) =>
      this._isCallVisibleInCallLogList(call, null),
    ) as unknown as ActiveCall[];
    return removeInboundRingOutLegs(
      removeDuplicateIntermediateCalls(visibleCalls) as ActiveCall[],
    ).sort(sortByStartTime) as ActiveCall[];
  }

  /**
   * Switches the direction older calls are paged under.
   *
   * Narrowing from `All` keeps the loaded calls, since they hold every
   * direction. Any other switch drops them: they would leave a gap in the
   * calls of the other direction.
   */
  @delegate('server')
  async setOlderCallsScope(scope: OlderCallsScope): Promise<void> {
    if (scope === this.olderCallsScope) {
      return;
    }
    if (this.olderCallsScope === 'All') {
      this._setOlderCallsScope(scope);
      return;
    }
    this._resetOlderCalls(scope);
  }

  /**
   * Loads the page of calls older than the oldest one listed, under the given
   * direction.
   */
  @delegate('server')
  async fetchOlderCalls(scope: OlderCallsScope = 'All'): Promise<void> {
    if (!this._canLoadOlderCalls || this.loadingOlderCalls) {
      return;
    }
    await this.setOlderCallsScope(scope);
    if (
      !this.hasMoreOlderCalls ||
      Date.now() - this._olderCallsFailedAt < RETRY_INTERVAL
    ) {
      return;
    }
    const ownerId = this._auth.ownerId;
    this._setLoadingOlderCalls(true);
    try {
      await sleep(
        this._olderCallsRequestedAt + OLDER_CALLS_MIN_INTERVAL - Date.now(),
      );
      await this._fetchOlderCallsPage(scope, ownerId);
    } catch (error) {
      this._olderCallsFailedAt = Date.now();
      this.logger.error('fetch older calls failed', error);
    } finally {
      this._setLoadingOlderCalls(false);
    }
  }

  private async _fetchOlderCallsPage(
    scope: OlderCallsScope,
    ownerId: string | undefined,
  ): Promise<void> {
    const cursor =
      this._olderCallsCursor ?? getEarliestStartTime(this.calls, Date.now());
    this._olderCallsRequestedAt = Date.now();
    const response = await this._client
      .account()
      .extension()
      .callLog()
      .list(this._getOlderCallsParams(scope, cursor));
    if (ownerId !== this._auth.ownerId || scope !== this.olderCallsScope) {
      return;
    }
    const records = processRecords(
      (response.records ?? []) as unknown as CallLogRecords,
    );
    this._setHasMoreOlderCalls(Boolean(response.navigation?.nextPage));
    this._olderCallsFailedAt = 0;
    const earliestTime = getEarliestStartTime(records, cursor);
    // A page that does not move back, e.g. calls sharing the cursor's start
    // time, must still let the next page go further.
    this._olderCallsCursor = earliestTime < cursor ? earliestTime : cursor - 1;
    this._appendOlderCalls(
      (records as CallLogRecord[]).filter(isHistoryCallRecord),
    );
  }

  private _getOlderCallsParams(
    scope: OlderCallsScope,
    cursor: number,
  ): ReadUserCallLogParameters {
    return {
      type: ['Voice'],
      perPage: OLDER_CALLS_PER_PAGE,
      dateFrom: new Date(
        cursor - OLDER_CALLS_LOOKBACK_DAYS * DAY_IN_MS,
      ).toISOString(),
      dateTo: new Date(cursor).toISOString(),
      ...(scope === 'All' ? {} : { direction: [scope] }),
    };
  }
}
