// "Ignore" must only stop the ring on this device. The SDK's `decline()` sends
// the call-control reject command, which ends the call for every device and
// routes it to voicemail, so a normal call is turned down with a local SIP 480
// instead. Queue calls still go through `decline()`, as in legacy.

const { WebphoneV2 } = require('../../src/app/services/WebphoneV2/WebphoneV2');

function create() {
  const webphone = new WebphoneV2(
    { addBeforeLogoutHandler: jest.fn() },
    {},
    { enable: jest.fn() },
    { factory: jest.fn(), isLocalMediaOwner: true },
    { inputDeviceId: '' },
    {
      shared: true,
      isServer: true,
      isClient: false,
      isWorkerMode: true,
      onClient: jest.fn(),
      onServer: jest.fn(),
    },
    {},
  );
  webphone.logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  return webphone;
}

function addInboundSession(webphone, normalized = {}, extra = {}) {
  const session = {
    callId: 'call-1',
    sipMessage: {
      headers: {
        Via: 'SIP/2.0/WSS host;branch=z9hG4bK1',
        From: '<sip:caller@sip.ringcentral.com>;tag=from',
        To: '<sip:callee@sip.ringcentral.com>',
        'Call-Id': 'call-1',
        CSeq: '1 INVITE',
      },
    },
    decline: jest.fn(async () => {}),
    dispose: jest.fn(),
    webPhone: {
      sipClient: { reply: jest.fn(async () => {}) },
      callSessions: [],
    },
  };
  session.webPhone.callSessions.push(session);
  webphone._sessionRecords.set('wp-1', {
    session,
    normalized: { id: 'wp-1', direction: 'Inbound', ...normalized },
    finalized: false,
    ...extra,
  });
  return session;
}

describe('WebphoneV2.reject', () => {
  test('ignores a normal call on this device only', async () => {
    const webphone = create();
    const session = addInboundSession(webphone);
    const ignored = jest.fn();
    webphone.ignore$.subscribe(ignored);

    await webphone.reject('wp-1');

    expect(session.decline).not.toHaveBeenCalled();
    expect(session.webPhone.sipClient.reply).toHaveBeenCalledTimes(1);
    const [response] = session.webPhone.sipClient.reply.mock.calls[0];
    expect(response.subject).toBe('SIP/2.0 480 Temporarily Unavailable');
    expect(response.headers['Call-Id']).toBe('call-1');
    expect(session.webPhone.callSessions).toHaveLength(0);
    expect(session.dispose).toHaveBeenCalled();
    expect(ignored).toHaveBeenCalledWith('wp-1');
  });

  test('ignores a queue call through call control', async () => {
    const webphone = create();
    const session = addInboundSession(webphone, {
      callQueueName: 'Sales - ',
    });
    const ignored = jest.fn();
    webphone.ignore$.subscribe(ignored);

    await webphone.reject('wp-1');

    expect(session.decline).toHaveBeenCalledTimes(1);
    expect(session.webPhone.sipClient.reply).not.toHaveBeenCalled();
    expect(ignored).not.toHaveBeenCalled();
  });

  test('turns down a RingCX offhook leg with a local SIP 480', async () => {
    const webphone = create();
    const session = addInboundSession(webphone, {}, { isCxOffhook: true });

    await webphone.reject('wp-1');

    expect(session.decline).not.toHaveBeenCalled();
    const [response] = session.webPhone.sipClient.reply.mock.calls[0];
    expect(response.subject).toBe('SIP/2.0 480 Temporarily Unavailable');
  });

  test('does nothing for an outbound call', async () => {
    const webphone = create();
    const session = addInboundSession(webphone, { direction: 'Outbound' });

    await webphone.reject('wp-1');

    expect(session.decline).not.toHaveBeenCalled();
    expect(session.webPhone.sipClient.reply).not.toHaveBeenCalled();
  });
});
