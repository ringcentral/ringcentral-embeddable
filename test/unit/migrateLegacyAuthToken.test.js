jest.mock('localforage', () => {
  const instances = new Map();
  const createInstance = jest.fn(({ name }) => {
    if (!instances.has(name)) {
      const data = new Map();
      instances.set(name, {
        data,
        getItem: jest.fn(async (key) => (data.has(key) ? data.get(key) : null)),
        setItem: jest.fn(async (key, value) => {
          data.set(key, value);
          return value;
        }),
      });
    }
    return instances.get(name);
  });
  return {
    __esModule: true,
    default: { createInstance },
    instances,
  };
});

const localforage = require('localforage');
const {
  migrateLegacyAuthToken,
} = require('../../src/lib/migrateLegacyAuthToken');

const PREFIX = 'rc-widget';
const TOKEN_KEY = `sdk-${PREFIX}platform`;
const AUTH_PROXY_TOKEN_KEY = `sdk-auth-proxy-${PREFIX}platform`;
const LEGACY_TOKEN = JSON.stringify({
  access_token: 'legacy-access-token',
  refresh_token: 'legacy-refresh-token',
  code_verifier: 'legacy-code-verifier',
});
const NEW_TOKEN = JSON.stringify({
  access_token: 'new-access-token',
  refresh_token: 'new-refresh-token',
});

const getStore = (name = PREFIX) => localforage.instances.get(name);

describe('migrateLegacyAuthToken', () => {
  beforeEach(() => {
    localStorage.clear();
    localforage.instances.clear();
    localforage.default.createInstance.mockClear();
  });

  test('moves the legacy token into the prefix store and removes it from localStorage', async () => {
    localStorage.setItem(TOKEN_KEY, LEGACY_TOKEN);

    await migrateLegacyAuthToken(PREFIX);

    expect(localforage.default.createInstance).toHaveBeenCalledWith({
      name: PREFIX,
    });
    expect(getStore().data.get(TOKEN_KEY)).toBe(LEGACY_TOKEN);
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  test('keeps the new build token and leaves the legacy token untouched', async () => {
    localStorage.setItem(TOKEN_KEY, LEGACY_TOKEN);
    localforage.default.createInstance({ name: PREFIX }).data.set(
      TOKEN_KEY,
      NEW_TOKEN,
    );

    await migrateLegacyAuthToken(PREFIX);

    expect(getStore().setItem).not.toHaveBeenCalled();
    expect(getStore().data.get(TOKEN_KEY)).toBe(NEW_TOKEN);
    expect(localStorage.getItem(TOKEN_KEY)).toBe(LEGACY_TOKEN);
  });

  test('migrates the auth proxy token', async () => {
    localStorage.setItem(AUTH_PROXY_TOKEN_KEY, LEGACY_TOKEN);

    await migrateLegacyAuthToken(PREFIX);

    expect(getStore().data.get(AUTH_PROXY_TOKEN_KEY)).toBe(LEGACY_TOKEN);
    expect(getStore().data.has(TOKEN_KEY)).toBe(false);
    expect(localStorage.getItem(AUTH_PROXY_TOKEN_KEY)).toBeNull();
  });

  test('uses the custom prefix for both the store and the token keys', async () => {
    localStorage.setItem('sdk-custom-prefixplatform', LEGACY_TOKEN);
    localStorage.setItem(TOKEN_KEY, LEGACY_TOKEN);

    await migrateLegacyAuthToken('custom-prefix');

    expect(getStore('custom-prefix').data.get('sdk-custom-prefixplatform')).toBe(
      LEGACY_TOKEN,
    );
    expect(getStore()).toBeUndefined();
    expect(localStorage.getItem(TOKEN_KEY)).toBe(LEGACY_TOKEN);
  });

  test('keeps the legacy token when copying it fails', async () => {
    localStorage.setItem(TOKEN_KEY, LEGACY_TOKEN);
    const store = localforage.default.createInstance({ name: PREFIX });
    store.setItem.mockRejectedValueOnce(new Error('IndexedDB unavailable'));

    await expect(migrateLegacyAuthToken(PREFIX)).rejects.toThrow(
      'IndexedDB unavailable',
    );

    expect(localStorage.getItem(TOKEN_KEY)).toBe(LEGACY_TOKEN);
  });

  test('does not open the store without a legacy token', async () => {
    await migrateLegacyAuthToken(PREFIX);

    expect(localforage.default.createInstance).not.toHaveBeenCalled();
  });

  test('does nothing without a prefix', async () => {
    localStorage.setItem('sdk-platform', LEGACY_TOKEN);

    await migrateLegacyAuthToken('');

    expect(localforage.default.createInstance).not.toHaveBeenCalled();
    expect(localStorage.getItem('sdk-platform')).toBe(LEGACY_TOKEN);
  });
});
