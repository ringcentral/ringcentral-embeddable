import localforage from 'localforage';

/** SDK cache key (without cache prefix) that holds the platform auth token. */
const PLATFORM_CACHE_KEY = 'platform';

type LegacyTokenItem = {
  key: string;
  value: string;
};

const getLegacyTokenKeys = (prefix: string): string[] => [
  `sdk-${prefix}${PLATFORM_CACHE_KEY}`,
  `sdk-auth-proxy-${prefix}${PLATFORM_CACHE_KEY}`,
];

function readLegacyTokenItems(prefix: string): LegacyTokenItem[] {
  return getLegacyTokenKeys(prefix).reduce<LegacyTokenItem[]>(
    (items, key) => {
      const value = localStorage.getItem(key);
      return value ? [...items, { key, value }] : items;
    },
    [],
  );
}

async function moveLegacyTokenItem(
  storage: LocalForage,
  { key, value }: LegacyTokenItem,
): Promise<void> {
  // A token saved by the new build wins; leave the legacy one untouched.
  if (await storage.getItem<string>(key)) {
    return;
  }
  await storage.setItem(key, value);
  // Only reached after a successful copy, so a failed migration keeps the
  // legacy token for the next attempt.
  localStorage.removeItem(key);
}

/**
 * Moves SDK auth tokens saved by the legacy (2.x/3.0) app in `localStorage`
 * into the IndexedDB store that the next-core SDK client reads, so users stay
 * logged in after upgrading on the same origin.
 *
 * A legacy token is copied only when the new store has no token under the
 * same key, and is removed from `localStorage` once copied, so a later logout
 * in the new build is not undone by importing it again.
 *
 * The storage instance mirrors micro-auth `createStorage(prefix)`, and the
 * keys keep the SDK `cachePrefix` (`sdk-${prefix}` / `sdk-auth-proxy-${prefix}`).
 * It must resolve before the shared worker or the window app starts, because
 * the SDK reads the token only once on initialization.
 */
export async function migrateLegacyAuthToken(prefix: string): Promise<void> {
  if (typeof localStorage === 'undefined' || !prefix) {
    return;
  }
  const legacyItems = readLegacyTokenItems(prefix);
  if (legacyItems.length === 0) {
    return;
  }
  const storage = localforage.createInstance({ name: prefix });
  await Promise.all(
    legacyItems.map((item) => moveLegacyTokenItem(storage, item)),
  );
}
