jest.mock(
  '@ringcentral-integration/micro-auth/src/app/services/DataFetcher',
  () => {
    class DataFetcher {
      constructor(auth) {
        this._auth = auth;
        this.storageData = { cachedData: {}, cachedTimestamps: {} };
      }

      onInit() {
        this.baseOnInit(this.storageData);
      }
    }
    return { DataFetcher };
  },
);

const { DataFetcher } = require('../../src/app/services/DataFetcher');

function createFetcher({ ownerId, cacheOwnerId }) {
  const fetcher = new DataFetcher({ ownerId }, {}, {});
  fetcher.baseOnInit = jest.fn((storageData) => {
    // Snapshot what the upstream init sees.
    fetcher.seenByBase = JSON.parse(JSON.stringify(storageData));
  });
  // Stands in for the value rehydrated from storage.
  fetcher.cacheOwnerId = cacheOwnerId;
  fetcher.storageData = {
    cachedData: { companyContacts: [{ id: 'contact-1' }] },
    cachedTimestamps: { companyContacts: 1000 },
  };
  return fetcher;
}

describe('DataFetcher cache owner', () => {
  test('clears the cache left by another account before sources use it', () => {
    const fetcher = createFetcher({
      ownerId: 'owner-b',
      cacheOwnerId: 'owner-a',
    });

    fetcher.onInit();

    expect(fetcher.storageData).toEqual({
      cachedData: {},
      cachedTimestamps: {},
    });
    expect(fetcher.cacheOwnerId).toBe('owner-b');
    expect(fetcher.baseOnInit).toHaveBeenCalledTimes(1);
    expect(fetcher.seenByBase).toEqual({
      cachedData: {},
      cachedTimestamps: {},
    });
  });

  test('clears a cache whose owner is unknown', () => {
    const fetcher = createFetcher({ ownerId: 'owner-b', cacheOwnerId: null });

    fetcher.onInit();

    expect(fetcher.storageData.cachedData).toEqual({});
    expect(fetcher.cacheOwnerId).toBe('owner-b');
  });

  test('keeps the cache of the same account', () => {
    const fetcher = createFetcher({
      ownerId: 'owner-a',
      cacheOwnerId: 'owner-a',
    });

    fetcher.onInit();

    expect(fetcher.storageData).toEqual({
      cachedData: { companyContacts: [{ id: 'contact-1' }] },
      cachedTimestamps: { companyContacts: 1000 },
    });
    expect(fetcher.cacheOwnerId).toBe('owner-a');
    expect(fetcher.baseOnInit).toHaveBeenCalledTimes(1);
  });
});
