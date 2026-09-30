// The RingCX Agent SDK runs on the server port: the shared worker in worker
// mode, where it is loaded with `importScripts`, and the server tab otherwise,
// where it is loaded with a script tag. Either way `evAuthHost` has to be set
// before the bundle evaluates, because the bundle reads it as its API origin.

const AUTH_HOST = 'https://ringcx.example.test';
const SDK_URL = 'https://app.example.com/assets/ringcx/agentLibrary.js';

function loadModule() {
  let loadAgentSdk;
  jest.isolateModules(() => {
    ({ loadAgentSdk } = require('../src/ringcx/services/CxClient/loadAgentSdk'));
  });
  return loadAgentSdk;
}

function getSdkScripts() {
  return Array.from(document.querySelectorAll('script')).filter(
    (script) => script.src === SDK_URL,
  );
}

function stubWorkerScope(importScripts) {
  jest.spyOn(globalThis, 'document', 'get').mockReturnValue(undefined);
  globalThis.importScripts = importScripts;
}

afterEach(() => {
  jest.restoreAllMocks();
  delete globalThis.AgentSDK;
  delete globalThis.evAuthHost;
  delete globalThis.importScripts;
  getSdkScripts().forEach((script) => script.remove());
});

describe('loadAgentSdk', () => {
  test('points the loaded SDK at the auth host without loading it again', async () => {
    const loadAgentSdk = loadModule();
    globalThis.AgentSDK = jest.fn();

    await loadAgentSdk(AUTH_HOST);

    expect(globalThis.evAuthHost).toBe(AUTH_HOST);
    expect(getSdkScripts()).toHaveLength(0);
  });

  describe('on a page', () => {
    test('sets the auth host before injecting one script for concurrent loads', async () => {
      const loadAgentSdk = loadModule();

      const first = loadAgentSdk(AUTH_HOST);
      const second = loadAgentSdk(AUTH_HOST);
      const [script] = getSdkScripts();

      expect(globalThis.evAuthHost).toBe(AUTH_HOST);
      expect(getSdkScripts()).toHaveLength(1);
      expect(script.async).toBe(true);
      expect(script.parentNode).toBe(document.head);
      globalThis.AgentSDK = jest.fn();
      script.dispatchEvent(new Event('load'));
      await expect(first).resolves.toBeUndefined();
      await expect(second).resolves.toBeUndefined();
    });

    test('rejects when the script does not expose AgentSDK and allows a retry', async () => {
      const loadAgentSdk = loadModule();

      const failed = loadAgentSdk(AUTH_HOST);
      getSdkScripts()[0].dispatchEvent(new Event('load'));
      await expect(failed).rejects.toThrow(
        'RingCX Agent SDK did not expose AgentSDK',
      );

      const retried = loadAgentSdk(AUTH_HOST);
      // The retry waits on the script tag that is already in the page.
      expect(getSdkScripts()).toHaveLength(1);
      globalThis.AgentSDK = jest.fn();
      getSdkScripts()[0].dispatchEvent(new Event('load'));
      await expect(retried).resolves.toBeUndefined();
    });

    test('rejects when the script fails to load', async () => {
      const loadAgentSdk = loadModule();

      const loading = loadAgentSdk(AUTH_HOST);
      getSdkScripts()[0].dispatchEvent(new Event('error'));

      await expect(loading).rejects.toThrow(
        'Unable to load the RingCX Agent SDK',
      );
    });
  });

  describe('in the shared worker', () => {
    test('imports the bundle synchronously after setting the auth host', async () => {
      const loadAgentSdk = loadModule();
      const importScripts = jest.fn(() => {
        expect(globalThis.evAuthHost).toBe(AUTH_HOST);
        globalThis.AgentSDK = jest.fn();
      });
      stubWorkerScope(importScripts);

      await loadAgentSdk(AUTH_HOST);

      expect(importScripts).toHaveBeenCalledTimes(1);
      expect(importScripts).toHaveBeenCalledWith(SDK_URL);
    });

    test('rejects when the import fails and allows a retry', async () => {
      const loadAgentSdk = loadModule();
      const importScripts = jest.fn(() => {
        throw new Error('NetworkError');
      });
      stubWorkerScope(importScripts);

      await expect(loadAgentSdk(AUTH_HOST)).rejects.toThrow('NetworkError');

      importScripts.mockImplementation(() => {
        globalThis.AgentSDK = jest.fn();
      });
      await expect(loadAgentSdk(AUTH_HOST)).resolves.toBeUndefined();
      expect(importScripts).toHaveBeenCalledTimes(2);
    });

    test('rejects when the imported bundle does not expose AgentSDK', async () => {
      const loadAgentSdk = loadModule();
      stubWorkerScope(jest.fn());

      await expect(loadAgentSdk(AUTH_HOST)).rejects.toThrow(
        'RingCX Agent SDK did not expose AgentSDK',
      );
    });

    test('rejects in a module worker, which has no importScripts', async () => {
      const loadAgentSdk = loadModule();
      stubWorkerScope(undefined);

      await expect(loadAgentSdk(AUTH_HOST)).rejects.toThrow(
        'The RingCX Agent SDK requires a page or a classic worker',
      );
    });
  });
});
