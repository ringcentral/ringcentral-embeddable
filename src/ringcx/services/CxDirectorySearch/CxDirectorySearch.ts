import {
  action,
  delegate,
  injectable,
  optional,
  PortManager,
  RcModule,
  state,
} from '@ringcentral-integration/next-core';

import { CxAuth } from '../CxAuth';
import { CxClient } from '../CxClient';
import type {
  DirectoryRecord,
  DirectorySearchScope,
  DirectorySearchScopeState,
  CxDirectorySearchOptions,
  SearchDirectoryResponse,
} from './CxDirectorySearch.interface';

const SEARCH_DEBOUNCE_MS = 400;

/**
 * Shared identity for "this scope has nothing".
 *
 * `useConnector` shallow-compares the object returned by `getUIProps`, so
 * handing back a fresh `[]` per call would re-render every consumer on every
 * unrelated store change -- which also remounts the DialPad and drops its
 * keypress audio.
 */
const EMPTY_RECORDS = Object.freeze([]) as unknown as DirectoryRecord[];

const EMPTY_SCOPE: DirectorySearchScopeState = {
  records: EMPTY_RECORDS,
  mainNumber: '',
  isSearching: false,
};

/**
 * CxDirectorySearch module - debounced RC corporate directory lookup
 *
 * Owns the debounce, the stale-response guard and the result state for every
 * consumer of `CxClient.searchDirectory`. Consumers pass a `scope` key so the
 * dial page and the transfer panel keep independent result lists.
 */
@injectable({
  name: 'CxDirectorySearch',
})
class CxDirectorySearch extends RcModule {
  constructor(
    private cxClient: CxClient,
    private cxAuth: CxAuth,
    private portManager: PortManager,
    @optional('CxDirectorySearchOptions')
    private evDirectorySearchOptions?: CxDirectorySearchOptions,
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

  @state
  searches: Record<string, DirectorySearchScopeState> = {};

  /**
   * Debounce timers and request ids are deliberately plain fields rather than
   * `@state`: they are only ever touched on the server port, because every
   * mutator below is `@delegate('server')`. Keeping them out of the store also
   * avoids a client re-render per keystroke for bookkeeping the UI never reads.
   * A future mutator that is *not* delegated would keep per-port copies of this
   * bookkeeping and silently break the stale-response guard.
   */
  private _timers: Record<string, ReturnType<typeof setTimeout>> = {};

  private _requestIds: Record<string, number> = {};

  private _requestSeq = 0;

  getRecords(scope: DirectorySearchScope): DirectoryRecord[] {
    return this.searches[scope]?.records ?? EMPTY_RECORDS;
  }

  getMainNumber(scope: DirectorySearchScope): string {
    return this.searches[scope]?.mainNumber ?? '';
  }

  isSearching(scope: DirectorySearchScope): boolean {
    return this.searches[scope]?.isSearching ?? false;
  }

  hasResults(scope: DirectorySearchScope): boolean {
    return this.getRecords(scope).length > 0;
  }

  /**
   * The record whose extension is exactly `input`, if the current results hold
   * one.
   *
   * A bare extension typed on the keypad is not dialable on its own -- it only
   * routes as `<mainNumber>*<ext>@RC_EXT` -- so callers use this to turn keypad
   * input into a real destination, and to name the person behind the digits.
   */
  findExactExtensionMatch(
    scope: DirectorySearchScope,
    input: string,
  ): DirectoryRecord | null {
    const trimmed = input.trim();
    if (!trimmed) {
      return null;
    }
    return (
      this.getRecords(scope).find(
        (record) => record.extensionNumber === trimmed,
      ) ?? null
    );
  }

  /**
   * Build the EV destination for a directory record:
   * `<accountMainNumber>*<extension>@RC_EXT`.
   *
   * The record's own account main number wins; the response-level `mainNumber`
   * is the fallback for records that omit it.
   */
  buildRecordDestination(
    scope: DirectorySearchScope,
    record: DirectoryRecord,
  ): string | null {
    const mainNumber =
      record.account?.mainNumber?.phoneNumber || this.getMainNumber(scope);
    if (!mainNumber || !record.extensionNumber) {
      return null;
    }
    return `${mainNumber}*${record.extensionNumber}@RC_EXT`;
  }

  @action
  private _setScope(
    scope: string,
    next: Partial<DirectorySearchScopeState>,
  ): void {
    this.searches[scope] = {
      ...(this.searches[scope] ?? EMPTY_SCOPE),
      ...next,
    };
  }

  @action
  private _dropScope(scope: string): void {
    delete this.searches[scope];
  }

  @action
  private _dropAllScopes(): void {
    this.searches = {};
  }

  /**
   * Debounce a directory search for `scope`.
   *
   * Every call takes a new request id, which is what invalidates anything
   * already scheduled or in flight for this scope. The guard is deliberately
   * not "does the response still match the caller's input": the input lives in
   * the caller's module, and comparing strings cannot tell two searches for the
   * same text apart, nor spot a value that changed and changed back while a
   * request was open.
   */
  @delegate('server')
  async search(
    scope: DirectorySearchScope,
    searchString: string,
  ): Promise<void> {
    this._invalidate(scope);
    const trimmed = searchString.trim();
    if (!trimmed) {
      this._dropScope(scope);
      return;
    }
    const requestId = this._requestIds[scope];
    this._timers[scope] = setTimeout(() => {
      delete this._timers[scope];
      this._perform(scope, trimmed, requestId);
    }, SEARCH_DEBOUNCE_MS);
  }

  /**
   * Drop any pending or in-flight search for `scope`, keeping current results.
   *
   * The searching flag is lowered here because nothing else will: once the
   * in-flight request is stale, `_perform` no longer touches the scope, and a
   * flag left raised keeps the transfer panel's buttons disabled for good.
   */
  @delegate('server')
  async cancel(scope: DirectorySearchScope): Promise<void> {
    this._invalidate(scope);
    if (this.isSearching(scope)) {
      this._setScope(scope, { isSearching: false });
    }
  }

  /**
   * Drop any pending or in-flight search for `scope` along with its results
   */
  @delegate('server')
  async clear(scope: DirectorySearchScope): Promise<void> {
    this._invalidate(scope);
    this._dropScope(scope);
  }

  @delegate('server')
  async clearAll(): Promise<void> {
    Object.keys(this.searches).forEach((scope) => this._invalidate(scope));
    this._dropAllScopes();
  }

  /**
   * Take a new request id and kill the pending timer: everything older for this
   * scope is now stale.
   */
  private _invalidate(scope: string): void {
    if (this._timers[scope]) {
      clearTimeout(this._timers[scope]);
      delete this._timers[scope];
    }
    this._requestSeq += 1;
    this._requestIds[scope] = this._requestSeq;
  }

  private _isCurrent(scope: string, requestId: number): boolean {
    return this._requestIds[scope] === requestId;
  }

  private async _perform(
    scope: DirectorySearchScope,
    searchString: string,
    requestId: number,
  ): Promise<void> {
    this._setScope(scope, { isSearching: true });
    try {
      const authorized = await this.cxAuth.refreshEvToken();
      if (!authorized) {
        return;
      }
      // Ignore stale responses if the scope was re-searched or cleared while
      // authenticating
      if (!this._isCurrent(scope, requestId)) {
        return;
      }
      const response: SearchDirectoryResponse =
        await this.cxClient.searchDirectory(searchString);
      // Ignore stale responses if the scope was re-searched or cleared while
      // searching
      if (!this._isCurrent(scope, requestId)) {
        return;
      }
      this._setScope(scope, {
        records: response?.records ?? [],
        mainNumber: response?.mainNumber ?? '',
      });
    } catch (error) {
      this.logger.warn('searchDirectory failed', error);
      if (this._isCurrent(scope, requestId)) {
        this._dropScope(scope);
      }
    } finally {
      if (this._isCurrent(scope, requestId)) {
        this._setScope(scope, { isSearching: false });
      }
    }
  }

  initialize(): void {
    // Directory results are account data; they must not outlive the agent
    this.cxAuth.beforeAgentLogout(() => {
      this.clearAll();
    });
  }

  /**
   * Second net for the logout listener above, which is registered on the server
   * port only while `_emitLogoutBefore` can also fire from the main client port.
   *
   * Does the work locally rather than through the delegated `clearAll`: on
   * teardown the ports may already be going away, and a round trip that fails
   * would leave the timers running.
   */
  override async onReset() {
    Object.keys(this._requestIds).forEach((scope) => this._invalidate(scope));
    this._dropAllScopes();
  }
}

export { CxDirectorySearch };
