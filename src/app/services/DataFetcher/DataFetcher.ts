import { Auth } from '@ringcentral-integration/micro-auth/src/app/services';
import {
  DataFetcher as DataFetcherBase,
  type DataFetcherOptions,
} from '@ringcentral-integration/micro-auth/src/app/services/DataFetcher';
import { SleepDetector } from '@ringcentral-integration/micro-core/src/app/services';
import {
  action,
  injectable,
  optional,
  state,
  storage,
  StoragePlugin,
} from '@ringcentral-integration/next-core';

/**
 * Drops cached data that belongs to another account.
 *
 * The upstream cache lives in shared (non-user) storage and is only cleared
 * when a running app sees a logout. If the app starts already signed out (for
 * example, the session expired while it was closed), the previous account's
 * data survives and is served to the next account until its TTL expires.
 */
@injectable({
  name: 'DataFetcher',
})
export class DataFetcher extends DataFetcherBase {
  /** Owner of the data in `storageData`; `null` when unknown. */
  @storage
  @state
  cacheOwnerId: string | null = null;

  constructor(
    _auth: Auth,
    _storage: StoragePlugin,
    _sleepDetector: SleepDetector,
    @optional('DataFetcherOptions')
    _dataFetcherOptions?: DataFetcherOptions,
  ) {
    super(_auth, _storage, _sleepDetector, _dataFetcherOptions);
  }

  override onInit(): void {
    // Runs before any source reads the cache: sources start once ready.
    const ownerId = this._auth.ownerId ?? null;
    if (this.cacheOwnerId !== ownerId) {
      this._resetCache(ownerId);
    }
    super.onInit();
  }

  @action
  protected _resetCache(ownerId: string | null): void {
    this.storageData.cachedData = {};
    this.storageData.cachedTimestamps = {};
    this.cacheOwnerId = ownerId;
  }
}
