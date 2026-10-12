// After a force login, connectWebRTC waits out a reconnect debounce before it
// registers the Engage roles. A logout that lands during that wait has nothing
// to tear down yet, so the connect has to notice on its own and skip the roles;
// otherwise the phone keeps advertising an agent session that no longer exists.

let mockReleaseSleep;

jest.mock('../../src/ringcx/lib/utils', () => ({
  ...jest.requireActual('../../src/ringcx/lib/utils'),
  sleep: jest.fn(
    () =>
      new Promise((resolve) => {
        mockReleaseSleep = resolve;
      }),
  ),
}));
jest.mock('../../src/ringcx/services/CxAuth', () => ({ CxAuth: class {} }));
jest.mock('../../src/ringcx/services/CxClient', () => ({ CxClient: class {} }));
jest.mock('../../src/ringcx/services/CxPresence', () => ({
  CxPresence: class {},
}));
jest.mock('../../src/ringcx/services/CxAgentSession', () => ({
  CxAgentSession: class {},
}));
jest.mock('../../src/ringcx/services/CxSubscription', () => ({
  CxSubscription: class {},
}));
jest.mock('../../src/app/services/WebphoneAlerting', () => ({
  WebphoneAlerting: class {},
}));

import { sleep } from '../../src/ringcx/lib/utils';
import { CxIntegratedSoftphone } from '../../src/ringcx/services/CxIntegratedSoftphone/CxIntegratedSoftphone';

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function createSoftphone({ isForceLogin = true } = {}) {
  let agentLogout;
  const serverCallbacks = [];
  const cxAgentSession = {
    isIntegratedSoftphone: true,
    isForceLogin,
    isReconnected: false,
    onReConfigFail: jest.fn(),
    onConfigSuccess: jest.fn(),
  };
  const webphone = {
    connected: true,
    engageAgentEptEnabled: false,
    setEngageAgentEptEnabled: jest.fn(async () => undefined),
    connect: jest.fn(async () => undefined),
  };
  const softphone = new CxIntegratedSoftphone(
    { setOffhookFlags: jest.fn() },
    { addBeforeLogoutHandler: jest.fn() },
    {
      beforeAgentLogout: jest.fn((callback) => {
        agentLogout = callback;
      }),
    },
    { subscribe: jest.fn(), emit: jest.fn() },
    cxAgentSession,
    { isOffhook: false },
    { enable: jest.fn() },
    {
      shared: true,
      isServer: true,
      onServer: jest.fn((callback) => serverCallbacks.push(callback)),
    },
    { setRingCxSoftphoneRinging: jest.fn(async () => undefined) },
    webphone,
  );
  serverCallbacks.forEach((callback) => callback());
  softphone.askAudioPermission = jest.fn(async () => true);
  return { softphone, webphone, logoutAgent: () => agentLogout() };
}

beforeEach(() => {
  sleep.mockClear();
  mockReleaseSleep = undefined;
});

describe('CxIntegratedSoftphone.connectWebRTC after a force login', () => {
  test('skips the Engage roles when the agent is logged out during the debounce', async () => {
    const { softphone, webphone, logoutAgent } = createSoftphone();

    const connecting = softphone.connectWebRTC();
    await flush();
    expect(sleep).toHaveBeenCalledTimes(1);

    await logoutAgent();
    mockReleaseSleep();
    await connecting;

    expect(webphone.setEngageAgentEptEnabled).not.toHaveBeenCalled();
    expect(webphone.connect).not.toHaveBeenCalled();
    expect(softphone.sipRegistering).toBe(false);
    expect(softphone.sipRegisterSuccess).toBe(false);
  });

  test('registers the Engage roles when the session outlives the debounce', async () => {
    const { softphone, webphone } = createSoftphone();

    const connecting = softphone.connectWebRTC();
    await flush();
    mockReleaseSleep();
    await connecting;

    expect(webphone.setEngageAgentEptEnabled).toHaveBeenCalledWith(true);
    expect(softphone.sipRegisterSuccess).toBe(true);
    expect(softphone.sipRegistering).toBe(false);
  });

  test('is not held back by a logout that happened before it started', async () => {
    const { softphone, webphone, logoutAgent } = createSoftphone({
      isForceLogin: false,
    });

    await logoutAgent();
    await softphone.connectWebRTC();

    expect(sleep).not.toHaveBeenCalled();
    expect(webphone.setEngageAgentEptEnabled).toHaveBeenCalledWith(true);
  });
});
