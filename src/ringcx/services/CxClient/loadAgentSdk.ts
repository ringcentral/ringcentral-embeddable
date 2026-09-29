import { getAssetBaseUrl } from '../../../lib/getAssetBaseUrl';

const AGENT_SDK_PATH = '/assets/ringcx/agentLibrary.js';

type ImportScripts = (...urls: string[]) => void;

declare global {
  // The vendored UMD bundle publishes itself on `self`, on a page or in a
  // worker, and reads `evAuthHost` there as its default API origin.
  // eslint-disable-next-line no-var
  var AgentSDK: any;
  // eslint-disable-next-line no-var
  var evAuthHost: string | undefined;
}

let loadPromise: Promise<void> | null = null;

function assertAgentSdkLoaded(): void {
  if (!globalThis.AgentSDK) {
    throw new Error('RingCX Agent SDK did not expose AgentSDK');
  }
}

/**
 * Workers load classic scripts synchronously through `importScripts`.
 */
function importAgentSdkInWorker(sdkUrl: string): Promise<void> {
  const importScripts = (globalThis as { importScripts?: ImportScripts })
    .importScripts;
  if (typeof importScripts !== 'function') {
    return Promise.reject(
      new Error('The RingCX Agent SDK requires a page or a classic worker'),
    );
  }
  try {
    importScripts(sdkUrl);
    assertAgentSdkLoaded();
    return Promise.resolve();
  } catch (error) {
    return Promise.reject(error);
  }
}

function appendAgentSdkScript(sdkUrl: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${sdkUrl}"]`,
    );
    const script = existing ?? document.createElement('script');
    script.addEventListener(
      'load',
      () => {
        try {
          assertAgentSdkLoaded();
          resolve();
        } catch (error) {
          reject(error);
        }
      },
      { once: true },
    );
    script.addEventListener(
      'error',
      () => reject(new Error('Unable to load the RingCX Agent SDK')),
      { once: true },
    );
    if (!existing) {
      script.async = true;
      script.src = sdkUrl;
      document.head.appendChild(script);
    }
  });
}

/**
 * Load the vendored RingCX Agent SDK onto the current global, which is the
 * shared worker in worker mode and the server tab otherwise.
 *
 * `evAuthHost` is set first because the bundle reads it while it evaluates.
 * The SDK path resolves against the app folder rather than the origin, so it
 * still loads when the build is deployed under a sub path; in the worker that
 * folder is the one hosting the worker script, next to the app files.
 */
export function loadAgentSdk(authHost: string): Promise<void> {
  globalThis.evAuthHost = authHost;
  if (globalThis.AgentSDK) {
    return Promise.resolve();
  }
  if (!loadPromise) {
    const sdkUrl = `${getAssetBaseUrl()}${AGENT_SDK_PATH}`;
    const hasDocument = typeof globalThis.document !== 'undefined';
    loadPromise = (
      hasDocument ? appendAgentSdkScript(sdkUrl) : importAgentSdkInWorker(sdkUrl)
    ).catch((error: unknown) => {
      loadPromise = null;
      throw error;
    });
  }
  return loadPromise;
}
