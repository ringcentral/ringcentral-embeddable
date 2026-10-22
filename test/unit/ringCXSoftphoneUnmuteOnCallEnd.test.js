// With a persistent offhook the same webphone session carries every CX call,
// so a mute set on one call would carry over to the next. As in Agent One,
// every CX call end unmutes the offhook session on the server.

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

import { CxIntegratedSoftphone } from '../../src/ringcx/services/CxIntegratedSoftphone/CxIntegratedSoftphone';

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function createSoftphone({ cxOffhookMuted = true } = {}) {
  const serverCallbacks = [];
  const callEndedHandlers = [];
  const portManager = {
    shared: true,
    isServer: true,
    onServer: jest.fn((callback) => serverCallbacks.push(callback)),
  };
  const cxPresence = {
    isOffhook: false,
    onCallEnded: jest.fn(function onCallEnded(handler) {
      callEndedHandlers.push(handler);
      return this;
    }),
  };
  const webphone = {
    connected: true,
    engageAgentEptEnabled: false,
    cxOffhookSessionId: 'offhook-session',
    cxOffhookMuted,
    mute: jest.fn(async () => undefined),
    unmute: jest.fn(async () => undefined),
  };
  const softphone = new CxIntegratedSoftphone(
    { setOffhookFlags: jest.fn() },
    { addBeforeLogoutHandler: jest.fn() },
    { beforeAgentLogout: jest.fn() },
    { subscribe: jest.fn(), emit: jest.fn() },
    {
      isIntegratedSoftphone: true,
      onReConfigFail: jest.fn(),
      onConfigSuccess: jest.fn(),
    },
    cxPresence,
    { enable: jest.fn() },
    portManager,
    { setRingCxSoftphoneRinging: jest.fn(async () => undefined) },
    webphone,
  );
  serverCallbacks.forEach((callback) => callback());
  const endCall = async (call = { session: { sessionId: 'cx-session' } }) => {
    callEndedHandlers.forEach((handler) => handler(call));
    await flush();
  };
  return { softphone, webphone, portManager, endCall };
}

describe('CxIntegratedSoftphone unmute after a CX call ends', () => {
  test('unmutes the offhook session when it is muted on the server', async () => {
    const { webphone, endCall } = createSoftphone();

    await endCall();

    expect(webphone.unmute).toHaveBeenCalledTimes(1);
    expect(webphone.unmute).toHaveBeenCalledWith('offhook-session');
    expect(webphone.mute).not.toHaveBeenCalled();
  });

  test('leaves an offhook session that is not muted alone', async () => {
    const { webphone, endCall } = createSoftphone({ cxOffhookMuted: false });

    await endCall();

    expect(webphone.unmute).not.toHaveBeenCalled();
  });

  test('does nothing on a port that is not the server', async () => {
    const { webphone, portManager, endCall } = createSoftphone();
    portManager.isServer = false;

    await endCall();

    expect(webphone.unmute).not.toHaveBeenCalled();
  });

  test('swallows a failed unmute with a warning', async () => {
    const { softphone, webphone, endCall } = createSoftphone();
    const error = new Error('unmute failed');
    webphone.unmute.mockRejectedValueOnce(error);

    await expect(endCall()).resolves.toBeUndefined();

    expect(webphone.unmute).toHaveBeenCalledWith('offhook-session');
    expect(softphone.logger.warn).toHaveBeenCalledWith(
      'unmute after CX call ended failed',
      error,
    );
  });
});
