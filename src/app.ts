/**
 * Shared worker bootstrap owned by the stable app entry.
 *
 * The worker filename contains the build id, so a cached app entry always
 * starts and reports the worker from its own build. `next-core` compares that
 * URI across tabs and reloads clients that are attached to an older worker.
 */
const DISABLE_SHARED_WORKER_KEY = 'disableRcSharedWorker';

const loadWorker = (): void => {
  if (localStorage.getItem(DISABLE_SHARED_WORKER_KEY)) {
    return;
  }
  if (!window.SharedWorker) {
    return;
  }
  if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
    return;
  }
  const workerFilename = process.env.WORKER_URL;
  if (!workerFilename) {
    return;
  }
  const params = new URLSearchParams(window.location.search);
  ['_t', 'fromAdapter', 'fromPopup'].forEach((key) => params.delete(key));
  const search = params.toString();
  const workerUrl = search ? `${workerFilename}?${search}` : workerFilename;
  const name = `worker#${btoa('{}')}`;
  const worker = new SharedWorker(workerUrl, { name });
  window.__rc_shared_worker__ = {
    url: `${workerUrl}?${name}`,
    worker,
  };
  worker.addEventListener('error', (event) => {
    // eslint-disable-next-line no-console
    console.error('load __rc_shared_worker__ worker fail', event);
    window.workerScriptsFail?.renderLoadFail?.();
  });
};

/** Makes webpack emit the shared-worker chunk without starting it directly. */
export const createWorker = (): void => {
  new SharedWorker(
    // @ts-ignore Webpack recognizes this URL form and emits the worker chunk.
    /* webpackChunkName: "worker" */ new URL('./worker.ts', import.meta.url),
  );
};

const resolvePrefix = (): string =>
  new URLSearchParams(window.location.search).get('prefix') ||
  process.env.PREFIX ||
  '';

/**
 * Moves legacy (2.x) localStorage tokens into IndexedDB before anything reads
 * them. The worker has no `localStorage`, so this runs in the window first.
 */
const migrateLegacyStorage = async (): Promise<void> => {
  try {
    const { migrateLegacyAuthToken } = await import(
      /* webpackChunkName: "migrate-legacy" */ './lib/migrateLegacyAuthToken'
    );
    await migrateLegacyAuthToken(resolvePrefix());
  } catch (error: unknown) {
    // Never block app startup on migration.
    console.warn('migrate legacy storage fail', error);
  }
};

const start = async (): Promise<void> => {
  await migrateLegacyStorage();
  loadWorker();
  // Keep the root entry small and bind all runtime chunks to its build directory.
  await import(/* webpackChunkName: "main" */ './appMain');
};

start();
