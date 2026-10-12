// The SIP edge tells instances of one extension apart by `P-rc-endpoint-id`,
// so every REGISTER carries it, not only the Engage (CX offhook) ones. When
// another registration takes this phone over, the edge answers 403 "instance
// id is intercepted"; the webphone then provisions again under a new SIP
// instance id once, and reports a dedicated error if that is refused too.

const { Webphone } = require('../../src/app/services/WebphoneV2/Webphone');
const {
  createSipInstanceId,
  isSipInstanceInterception,
  WEBPHONE_INSTANCE_INTERCEPTED_ERROR,
} = require('../../src/app/services/WebphoneV2/WebphoneV2');

const INTERCEPTED = new Error(
  'Registration failed: SIP/2.0 403 Forbidden, instance id is intercepted by another registration',
);
const FORBIDDEN = new Error('Registration failed: SIP/2.0 403 Forbidden');
const UNAUTHORIZED = new Error('Registration failed: SIP/2.0 401 Unauthorized');

function create({ endpointId = 'endpoint-1', webPhoneFactory } = {}) {
  const webphone = new Webphone(
    { addBeforeLogoutHandler: jest.fn(), loggedIn: true, endpointId },
    {},
    { enable: jest.fn() },
    { factory: jest.fn(), isLocalMediaOwner: false },
    { inputDeviceId: '' },
    {
      shared: true,
      isServer: true,
      isClient: false,
      isWorkerMode: true,
      onClient: jest.fn(),
      onServer: jest.fn(),
    },
    { success: jest.fn(), danger: jest.fn(), warning: jest.fn() },
    undefined,
    undefined,
    webPhoneFactory ? { webPhoneFactory } : undefined,
  );
  webphone.logger = {
    debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn(),
  };
  return webphone;
}

/** Installs the REGISTER hook on a fake SIP client and returns its sender. */
function installOn(webphone) {
  const webPhone = { sipClient: { send: jest.fn(async () => undefined) } };
  webphone._installSipRequestCorrelation(webPhone);
  const headersAfterSending = (subject) => {
    const message = { subject, headers: {} };
    webPhone.sipClient.send(message, false);
    return message.headers;
  };
  return {
    register: () =>
      headersAfterSending('REGISTER sip:sip.ringcentral.com SIP/2.0'),
    invite: () =>
      headersAfterSending('INVITE sip:101@sip.ringcentral.com SIP/2.0'),
  };
}

describe('REGISTER identity headers', () => {
  test('carries the endpoint id without the Engage roles for a RingEX phone', () => {
    const webphone = create();
    webphone.engageAgentEptEnabled = false;

    const headers = installOn(webphone).register();

    expect(headers['P-rc-endpoint-id']).toBe('endpoint-1');
    expect(headers).not.toHaveProperty('P-RC-Supported-Ept-Roles');
    expect(webphone._registeredEngageAgentEpt).toBe(false);
  });

  test('adds the Engage roles alongside the endpoint id for a CX agent', () => {
    const webphone = create();
    webphone.engageAgentEptEnabled = true;

    const headers = installOn(webphone).register();

    expect(headers['P-rc-endpoint-id']).toBe('endpoint-1');
    expect(headers['P-RC-Supported-Ept-Roles']).toBe('rc-engage-agent-ept');
    expect(webphone._registeredEngageAgentEpt).toBe(true);
  });

  test('sends neither header before the session has an endpoint id', () => {
    const webphone = create({ endpointId: null });
    webphone.engageAgentEptEnabled = true;

    const headers = installOn(webphone).register();

    expect(headers).toEqual({});
    expect(webphone._registeredEngageAgentEpt).toBe(false);
  });

  test('leaves other SIP requests untouched', () => {
    const webphone = create();
    webphone.engageAgentEptEnabled = true;

    expect(installOn(webphone).invite()).toEqual({});
  });
});

describe('SIP instance id', () => {
  test('is a UUID', () => {
    expect(createSipInstanceId()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  test('is created once and reused by every new SIP client', () => {
    const webPhoneFactory = jest.fn(() => ({ sipClient: {} }));
    const webphone = create({ webPhoneFactory });

    webphone._createWebPhone({ authorizationId: 'device-auth' });
    webphone._createWebPhone({ authorizationId: 'device-auth' });

    const [first, second] = webPhoneFactory.mock.calls.map(
      ([options]) => options.instanceId,
    );
    expect(first).toEqual(expect.any(String));
    expect(first).not.toBe('device-auth');
    expect(second).toBe(first);
    expect(webphone.sipInstanceId).toBe(first);
  });

  test('recognizes only the interception refusal', () => {
    expect(isSipInstanceInterception(INTERCEPTED)).toBe(true);
    expect(isSipInstanceInterception(FORBIDDEN)).toBe(false);
    expect(isSipInstanceInterception(UNAUTHORIZED)).toBe(false);
  });
});

describe('connect after a rejected REGISTER', () => {
  function prepare() {
    const webphone = create();
    webphone.sipInstanceId = 'old-instance';
    const cache = { endpointId: 'endpoint-1', sipInfo: {}, device: null };
    webphone._provision = jest.fn(async () => cache);
    webphone._start = jest.fn(async () => undefined);
    return { webphone, cache };
  }

  const retry = (webphone, error, usedCache) =>
    webphone._retryConnectionAfterFailure(
      error,
      webphone._lifecycleEpoch,
      usedCache,
    );

  test('provisions again under a new instance id after a 403, even with a fresh provision', async () => {
    const { webphone, cache } = prepare();

    await retry(webphone, INTERCEPTED, false);

    expect(webphone.sipInstanceId).not.toBe('old-instance');
    expect(webphone._provision).toHaveBeenCalledTimes(1);
    expect(webphone._start).toHaveBeenCalledWith(cache, webphone._lifecycleEpoch);
  });

  test('reports the takeover when the retry is intercepted too', async () => {
    const { webphone } = prepare();
    webphone._start = jest.fn(async () => {
      throw INTERCEPTED;
    });

    await expect(retry(webphone, INTERCEPTED, false)).rejects.toBe(INTERCEPTED);

    expect(webphone.connectionStatus).toBe('connectFailed');
    expect(webphone.statusCode).toBe(403);
    expect(webphone.errorCode).toBe(WEBPHONE_INSTANCE_INTERCEPTED_ERROR);
  });

  test('keeps the generic registration error for any other 403', async () => {
    const { webphone } = prepare();
    webphone._start = jest.fn(async () => {
      throw FORBIDDEN;
    });

    await expect(retry(webphone, FORBIDDEN, false)).rejects.toBe(FORBIDDEN);

    expect(webphone.errorCode).toBe('webphoneRegistrationFailed');
  });

  test('does not retry a 401 against a fresh provision', async () => {
    const { webphone } = prepare();

    await expect(retry(webphone, UNAUTHORIZED, false)).rejects.toBe(
      UNAUTHORIZED,
    );

    expect(webphone.sipInstanceId).toBe('old-instance');
    expect(webphone._provision).not.toHaveBeenCalled();
    expect(webphone.connectionStatus).toBe('connectFailed');
  });

  test('retries a 401 with a fresh provision but the same instance id', async () => {
    const { webphone } = prepare();

    await retry(webphone, UNAUTHORIZED, true);

    expect(webphone.sipInstanceId).toBe('old-instance');
    expect(webphone._provision).toHaveBeenCalledTimes(1);
  });

  test('clears the takeover error once a later attempt starts connecting', () => {
    const { webphone } = prepare();
    webphone._setConnectionState('connectFailed', INTERCEPTED);

    webphone._setConnectionState('connecting');

    expect(webphone.errorCode).toBeNull();
  });
});
