const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

const createDeferred = () => {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
};

describe('app entry legacy auth migration', () => {
  const originalWorkerUrl = process.env.WORKER_URL;
  const originalPrefix = process.env.PREFIX;
  let events;
  let migration;
  let SharedWorkerMock;

  const loadEntry = ({ search = '' } = {}) => {
    window.history.replaceState({}, '', `/app.html${search}`);
    jest.isolateModules(() => {
      require('../../src/app');
    });
  };

  beforeEach(() => {
    jest.resetModules();
    localStorage.clear();
    events = [];
    migration = createDeferred();
    process.env.WORKER_URL = 'worker.js';
    process.env.PREFIX = 'rc-widget';
    jest.doMock('../../src/lib/migrateLegacyAuthToken', () => ({
      migrateLegacyAuthToken: jest.fn((prefix) => {
        events.push(`migrate:${prefix}`);
        return migration.promise;
      }),
    }));
    jest.doMock('../../src/appMain', () => {
      events.push('appMain');
      return {};
    });
    SharedWorkerMock = jest.fn(function SharedWorker() {
      events.push('worker');
      this.addEventListener = jest.fn();
    });
    window.SharedWorker = SharedWorkerMock;
  });

  afterEach(() => {
    process.env.WORKER_URL = originalWorkerUrl;
    process.env.PREFIX = originalPrefix;
    delete window.SharedWorker;
    delete window.__rc_shared_worker__;
    jest.dontMock('../../src/lib/migrateLegacyAuthToken');
    jest.dontMock('../../src/appMain');
  });

  test('starts the worker and app only after the migration resolves', async () => {
    loadEntry();
    await flushPromises();

    expect(events).toEqual(['migrate:rc-widget']);

    migration.resolve();
    await flushPromises();

    expect(events).toEqual(['migrate:rc-widget', 'worker', 'appMain']);
  });

  test('uses the prefix URL parameter over the build prefix', async () => {
    loadEntry({ search: '?prefix=custom-prefix' });
    migration.resolve();
    await flushPromises();

    expect(events[0]).toBe('migrate:custom-prefix');
  });

  test('still starts the app when the migration fails', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    migration = {
      promise: Promise.reject(new Error('IndexedDB unavailable')),
    };
    migration.promise.catch(() => {});

    loadEntry();
    await flushPromises();

    expect(events).toEqual(['migrate:rc-widget', 'worker', 'appMain']);
    expect(warn).toHaveBeenCalledWith(
      'migrate legacy storage fail',
      expect.any(Error),
    );
    warn.mockRestore();
  });
});
