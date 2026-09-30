// The CX SDK and the WebPhone run on the server port. Answering claims call
// media for the port that runs `webphone.answer`, so `sipAnswer` runs where it
// is called; the other offhook controls change server-side state and run on
// the server; microphone prompts go to the tab the agent is using.

jest.mock('@ringcentral-integration/next-core', () => {
  const delegatedMethods = new Map();
  const roleDelegatedMethods = new Map();
  return {
    ...jest.requireActual('./mocks/nextCoreMock'),
    delegatedMethods,
    roleDelegatedMethods,
    delegate: (target) => (_prototype, key, descriptor) => {
      delegatedMethods.set(key, target);
      return descriptor;
    },
    delegateRole: (role) => (_prototype, key, descriptor) => {
      roleDelegatedMethods.set(key, role.role);
      return descriptor;
    },
  };
});

jest.mock('../src/ringcx/services/CxAuth', () => ({ CxAuth: class {} }));
jest.mock('../src/ringcx/services/CxClient', () => ({ CxClient: class {} }));
jest.mock('../src/ringcx/services/CxPresence', () => ({
  CxPresence: class {},
}));
jest.mock('../src/ringcx/services/CxAgentSession', () => ({
  CxAgentSession: class {},
}));
jest.mock('../src/ringcx/services/CxSubscription', () => ({
  CxSubscription: class {},
}));
jest.mock('../src/app/services/WebphoneAlerting', () => ({
  WebphoneAlerting: class {},
}));

import {
  delegatedMethods,
  roleDelegatedMethods,
  RoleUnavailableError,
} from '@ringcentral-integration/next-core';

import { CxCallbackTypes } from '../src/ringcx/services/CxClient/enums';
import { CxIntegratedSoftphone } from '../src/ringcx/services/CxIntegratedSoftphone/CxIntegratedSoftphone';

function createSoftphone({
  cxOffhookSessionId = 'offhook-session',
  shared = true,
} = {}) {
  const serverCallbacks = [];
  const subscriptions = {};
  const portManager = {
    shared,
    isServer: true,
    onServer: jest.fn((callback) => serverCallbacks.push(callback)),
  };
  const cxClient = {
    offhookTerm: jest.fn(async () => undefined),
    setOffhookFlags: jest.fn(async () => undefined),
  };
  const cxSubscription = {
    subscribe: jest.fn((type, handler) => {
      subscriptions[type] = handler;
      return cxSubscription;
    }),
    emit: jest.fn(),
  };
  const cxAgentSession = {
    isIntegratedSoftphone: true,
    onReConfigFail: jest.fn(),
    onConfigSuccess: jest.fn(),
  };
  const cxPresence = { isOffhook: false, showOffHookInitError: true };
  const webphoneAlerting = {
    setRingCxSoftphoneRinging: jest.fn(async () => undefined),
  };
  const webphone = {
    cxOffhookSessionId,
    answer: jest.fn(async () => undefined),
    reject: jest.fn(async () => undefined),
    reconnectWithCurrentHeaders: jest.fn(async () => undefined),
  };
  const softphone = new CxIntegratedSoftphone(
    cxClient,
    { addBeforeLogoutHandler: jest.fn() },
    { beforeAgentLogout: jest.fn() },
    cxSubscription,
    cxAgentSession,
    cxPresence,
    { enable: jest.fn() },
    portManager,
    webphoneAlerting,
    webphone,
  );
  return {
    softphone,
    cxClient,
    cxPresence,
    subscriptions,
    webphone,
    webphoneAlerting,
    runServer: () => serverCallbacks.forEach((callback) => callback()),
  };
}

describe('CxIntegratedSoftphone port routing', () => {
  test('answers on the calling port instead of the main client', () => {
    expect(delegatedMethods.has('sipAnswer')).toBe(false);
    expect(roleDelegatedMethods.has('sipAnswer')).toBe(false);
  });

  test.each([
    'sipHangUp',
    'sipReject',
    'sipTerminate',
    'sipSendDTMF',
    'sipToggleMute',
  ])('runs %s on the server', (method) => {
    expect(delegatedMethods.get(method)).toBe('server');
  });

  test('asks for the microphone in the tab the agent last interacted with', () => {
    expect(
      roleDelegatedMethods.get('_requestAudioPermissionOnLastInteractedClient'),
    ).toBe('lastInteractedClient');
    expect(delegatedMethods.get('_requestAudioPermissionOnMainClient')).toBe(
      'mainClient',
    );
  });
});

describe('CxIntegratedSoftphone.sipAnswer', () => {
  test('answers the offhook session on the port it was called on', async () => {
    const { softphone, webphone, webphoneAlerting } = createSoftphone();

    await softphone.sipAnswer();

    expect(webphoneAlerting.setRingCxSoftphoneRinging).toHaveBeenCalledWith(
      false,
    );
    expect(webphone.answer).toHaveBeenCalledWith('offhook-session');
  });

  test('does nothing more than silence the alert without an offhook session', async () => {
    const { softphone, webphone, webphoneAlerting } = createSoftphone({
      cxOffhookSessionId: null,
    });

    await softphone.sipAnswer();

    expect(webphoneAlerting.setRingCxSoftphoneRinging).toHaveBeenCalledWith(
      false,
    );
    expect(webphone.answer).not.toHaveBeenCalled();
  });
});

describe('CxIntegratedSoftphone.sipReject', () => {
  test('suppresses the offhook init error on the presence it runs next to', async () => {
    const { softphone, cxPresence, webphone } = createSoftphone();

    await softphone.sipReject();

    expect(cxPresence.showOffHookInitError).toBe(false);
    expect(webphone.reject).toHaveBeenCalledWith('offhook-session');
  });
});

describe('CxIntegratedSoftphone.requestAudioPermission', () => {
  test('asks the last interacted tab when the app is shared', async () => {
    const { softphone } = createSoftphone();
    softphone._requestAudioPermissionOnLastInteractedClient = jest.fn(
      async () => true,
    );
    softphone._requestAudioPermissionOnMainClient = jest.fn();

    await expect(softphone.requestAudioPermission()).resolves.toBe(true);
    expect(softphone._requestAudioPermissionOnMainClient).not.toHaveBeenCalled();
  });

  test('falls back to the main client while no tab holds the role', async () => {
    const { softphone } = createSoftphone();
    softphone._requestAudioPermissionOnLastInteractedClient = jest.fn(
      async () => {
        throw new RoleUnavailableError('lastInteractedClient');
      },
    );
    softphone._requestAudioPermissionOnMainClient = jest.fn(async () => false);

    await expect(softphone.requestAudioPermission()).resolves.toBe(false);
    expect(softphone._requestAudioPermissionOnMainClient).toHaveBeenCalled();
  });

  test('does not fall back on other failures', async () => {
    const { softphone } = createSoftphone();
    const error = new Error('transport closed');
    softphone._requestAudioPermissionOnLastInteractedClient = jest.fn(
      async () => {
        throw error;
      },
    );
    softphone._requestAudioPermissionOnMainClient = jest.fn();

    await expect(softphone.requestAudioPermission()).rejects.toBe(error);
    expect(softphone._requestAudioPermissionOnMainClient).not.toHaveBeenCalled();
  });
});

describe('CxIntegratedSoftphone offhook init failures', () => {
  function initOnServer() {
    const setup = createSoftphone();
    setup.runServer();
    return setup;
  }

  test('does not reconnect the webphone when the offhook is refused', async () => {
    const { subscriptions, webphone, cxClient } = initOnServer();

    await subscriptions[CxCallbackTypes.OFFHOOK_INIT]({
      status: 'FAILURE',
      message: 'Outdial Failed',
      detail: 'INTERCEPT',
    });

    expect(webphone.reconnectWithCurrentHeaders).not.toHaveBeenCalled();
    expect(cxClient.offhookTerm).not.toHaveBeenCalled();
  });

  test('terminates a stale server-side leg when IQ reports one', async () => {
    const { subscriptions, webphone, cxClient } = initOnServer();

    await subscriptions[CxCallbackTypes.OFFHOOK_INIT]({
      status: 'FAILURE',
      message: 'Login Session is already off-hook available',
    });

    expect(cxClient.offhookTerm).toHaveBeenCalledTimes(1);
    expect(webphone.reconnectWithCurrentHeaders).not.toHaveBeenCalled();
  });
});
