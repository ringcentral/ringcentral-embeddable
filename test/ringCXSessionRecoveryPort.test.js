// CxSessionRecovery watches the agent socket where the SDK lives: the server
// port. In worker mode that is the shared worker, so the network watchdog
// listens on the worker global instead of `window`.

jest.mock('../src/ringcx/services/CxAuth', () => ({ CxAuth: class {} }));
jest.mock('../src/ringcx/services/CxCall', () => ({ CxCall: class {} }));
jest.mock('../src/ringcx/services/CxClient', () => ({ CxClient: class {} }));
jest.mock('../src/ringcx/services/CxPresence', () => ({
  CxPresence: class {},
}));
jest.mock('../src/ringcx/services/CxWorkingState', () => ({
  CxWorkingState: class {},
}));

import { CxCallbackTypes } from '../src/ringcx/services/CxClient/enums';
import { CxSessionRecovery } from '../src/ringcx/services/CxSessionRecovery/CxSessionRecovery';

const SOCKET_WATCHDOG_INTERVAL_MS = 15 * 1000;

function createRecovery() {
  const serverCallbacks = [];
  const portManager = {
    shared: true,
    onServer: jest.fn((callback) => serverCallbacks.push(callback)),
  };
  const cxClient = {
    addListener: jest.fn(),
    getSocketDiagnostics: jest.fn(async () => ({
      isLoggedIn: false,
      lastAlive: null,
      socketReadyState: null,
    })),
  };
  const recovery = new CxSessionRecovery(
    cxClient,
    {},
    {},
    {},
    {},
    {},
    portManager,
  );
  return {
    recovery,
    cxClient,
    runServer: () => serverCallbacks.forEach((callback) => callback()),
  };
}

let globalListeners;

beforeEach(() => {
  jest.useFakeTimers();
  globalListeners = {};
  jest
    .spyOn(globalThis, 'addEventListener')
    .mockImplementation((type, listener) => {
      globalListeners[type] = listener;
    });
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('CxSessionRecovery on the server port', () => {
  test('does nothing until the port becomes the server', () => {
    const { cxClient } = createRecovery();

    jest.advanceTimersByTime(SOCKET_WATCHDOG_INTERVAL_MS);

    expect(cxClient.addListener).not.toHaveBeenCalled();
    expect(cxClient.getSocketDiagnostics).not.toHaveBeenCalled();
    expect(globalThis.addEventListener).not.toHaveBeenCalled();
  });

  test('listens for the reconnect login and samples the socket on the server', () => {
    const { cxClient, runServer } = createRecovery();

    runServer();

    expect(cxClient.addListener).toHaveBeenCalledWith(
      CxCallbackTypes.LOGIN,
      expect.any(Function),
    );
    jest.advanceTimersByTime(SOCKET_WATCHDOG_INTERVAL_MS);
    expect(cxClient.getSocketDiagnostics).toHaveBeenCalledTimes(1);
  });

  test('checks the socket when the global object reports being back online', () => {
    const { cxClient, runServer } = createRecovery();
    runServer();

    expect(Object.keys(globalListeners).sort()).toEqual(['offline', 'online']);
    globalListeners.offline();
    globalListeners.online();

    expect(cxClient.getSocketDiagnostics).toHaveBeenCalledTimes(1);
  });
});
