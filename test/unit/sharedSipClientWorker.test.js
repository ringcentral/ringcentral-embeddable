const EventEmitter = require('events');

class TestInboundMessage {
  constructor(subject = '', headers = {}, body = '') {
    this.subject = subject;
    this.headers = headers;
    this.body = body;
  }

  toString() {
    return this.subject;
  }

  static fromString(rawMessage) {
    const headers = { CSeq: '1' };
    if (rawMessage.includes('WWW-Authenticate')) {
      headers['WWW-Authenticate'] = 'Digest realm="sip.example.com", nonce="nonce-1"';
    }
    if (rawMessage.includes('Contact:') || rawMessage.includes('expires=')) {
      headers.Contact = '<sip:101@sip.example.com>;expires=60';
    }
    return new TestInboundMessage(rawMessage, headers, rawMessage);
  }
}

class TestOutboundMessage {
  constructor(subject = '', headers = {}) {
    this.subject = subject;
    this.headers = headers;
  }

  toString() {
    return this.subject;
  }

  static fromString(rawMessage) {
    return new TestOutboundMessage(rawMessage, { CSeq: '1' });
  }
}

class TestRequestMessage extends TestOutboundMessage {
  constructor(subject = '', headers = {}) {
    super(subject, { CSeq: '1', ...headers });
  }

  fork() {
    return new TestRequestMessage(this.subject, { ...this.headers });
  }
}

class TestResponseMessage extends TestOutboundMessage {
  constructor(_inboundMessage, { responseCode }) {
    super(`SIP/2.0 ${responseCode} OK`, { CSeq: '1' });
  }
}

class TestPort {
  constructor(name) {
    this.name = name;
    this.postMessage = jest.fn();
  }

  async receive(data) {
    await this.onmessage({ data });
  }
}

class TestWebSocket {
  constructor(url, protocol) {
    this.url = url;
    this.protocol = protocol;
    this.listeners = {};
    this.send = jest.fn();
    this.close = jest.fn(() => {
      this.emit('close', {});
    });
    TestWebSocket.instances.push(this);
  }

  addEventListener(type, handler) {
    this.listeners[type] = this.listeners[type] || [];
    this.listeners[type].push(handler);
  }

  removeEventListener(type, handler) {
    this.listeners[type] = (this.listeners[type] || []).filter(
      (item) => item !== handler,
    );
  }

  emit(type, event = {}) {
    (this.listeners[type] || []).forEach((handler) => handler(event));
  }

  static reset() {
    TestWebSocket.instances = [];
  }
}

TestWebSocket.reset();

function installWebSocket() {
  TestWebSocket.reset();
  global.WebSocket = TestWebSocket;
  return TestWebSocket;
}

function installWorkerDependencies() {
  jest.doMock('ringcentral-web-phone/event-emitter', () => EventEmitter);
  jest.doMock(
    'ringcentral-web-phone/rc-message/rc-message',
    () => ({
      fromXml: jest.fn(async () => ({
        body: {},
        headers: {},
      })),
    }),
  );
  jest.doMock(
    'ringcentral-web-phone/sip-message/inbound',
    () => TestInboundMessage,
  );
  jest.doMock(
    'ringcentral-web-phone/sip-message/outbound/index',
    () => TestOutboundMessage,
  );
  jest.doMock(
    'ringcentral-web-phone/sip-message/outbound/request',
    () => TestRequestMessage,
  );
  jest.doMock(
    'ringcentral-web-phone/sip-message/outbound/response',
    () => TestResponseMessage,
  );
  jest.doMock(
    'ringcentral-web-phone/utils',
    () => ({
      branch: () => 'branch-id',
      fakeDomain: 'fake.example.com',
      fakeEmail: 'fake@example.com',
      generateAuthorization: () => 'Digest token',
      uuid: () => 'uuid-value',
    }),
  );
}

function loadWorker() {
  jest.resetModules();
  installWorkerDependencies();
  global.self = global;
  global.onconnect = undefined;
  require('../../src/modules/WebphoneV2/SharedSipClient.worker');
  return {
    connect: global.onconnect,
    sipClient: global.self.sipClient,
  };
}

async function flushPromises(times = 5) {
  for (let i = 0; i < times; i += 1) {
    await Promise.resolve();
  }
}

describe('SharedSipClient worker', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    delete global.self;
    delete global.onconnect;
    delete global.WebSocket;
    jest.resetModules();
    jest.restoreAllMocks();
  });

  it('syncs shared state and active tab changes across worker ports', async () => {
    const { connect } = loadWorker();
    const firstPort = new TestPort('first');
    const secondPort = new TestPort('second');
    connect({ ports: [firstPort] });
    connect({ ports: [secondPort] });

    await firstPort.receive({
      type: 'setSharedState',
      state: {
        sessions: [{ id: 'session-1' }],
      },
    });
    await secondPort.receive({
      type: 'workerRequest',
      requestId: 'get-state',
      request: { type: 'getSharedState' },
    });

    expect(secondPort.postMessage).toHaveBeenCalledWith({
      type: 'setSharedState',
      state: {
        sessions: [{ id: 'session-1' }],
      },
    });
    expect(secondPort.postMessage).toHaveBeenCalledWith({
      type: 'workerResponse',
      requestId: 'get-state',
      response: {
        sessions: [{ id: 'session-1' }],
      },
    });

    await secondPort.receive({
      type: 'setActive',
      activeTabId: 'tab-2',
    });
    await firstPort.receive({
      type: 'workerRequest',
      requestId: 'get-active',
      request: { type: 'getActiveTabId' },
    });

    expect(firstPort.postMessage).toHaveBeenCalledWith({
      type: 'setActive',
      activeTabId: 'tab-2',
    });
    expect(firstPort.postMessage).toHaveBeenCalledWith({
      type: 'workerResponse',
      requestId: 'get-active',
      response: 'tab-2',
    });
  });

  it('routes SIP client events to worker ports and disposes when ports close', async () => {
    const { connect, sipClient } = loadWorker();
    const firstPort = new TestPort('first');
    const secondPort = new TestPort('second');
    const disposeSpy = jest.spyOn(sipClient, 'dispose');
    connect({ ports: [firstPort] });
    connect({ ports: [secondPort] });
    await secondPort.receive({
      type: 'setActive',
      activeTabId: 'tab-2',
    });
    firstPort.postMessage.mockClear();
    secondPort.postMessage.mockClear();

    sipClient.emit('inboundMessage', new TestInboundMessage('INVITE sip:test'));
    sipClient.emit('outboundMessage', new TestOutboundMessage('SIP/2.0 200 OK'));
    sipClient.emit('status', 'registered');
    sipClient.emit('transportStatus', 'connected');

    expect(secondPort.postMessage).toHaveBeenCalledWith({
      type: 'inboundMessage',
      message: 'INVITE sip:test',
    });
    expect(secondPort.postMessage).toHaveBeenCalledWith({
      type: 'outboundMessage',
      message: 'SIP/2.0 200 OK',
    });
    expect(firstPort.postMessage).toHaveBeenCalledWith({
      type: 'status',
      status: 'registered',
      error: undefined,
    });
    expect(secondPort.postMessage).toHaveBeenCalledWith({
      type: 'transportStatus',
      status: 'connected',
    });

    await secondPort.receive({ type: 'destroyPort' });
    firstPort.postMessage.mockClear();
    sipClient.emit('outboundMessage', new TestOutboundMessage('MESSAGE sip:test'));
    expect(firstPort.postMessage).toHaveBeenCalledWith({
      type: 'outboundMessage',
      message: 'MESSAGE sip:test',
    });

    await firstPort.receive({ type: 'destroyPort' });
    expect(disposeSpy).toHaveBeenCalled();
  });

  it('returns worker responses for status and unsupported requests', async () => {
    const { connect } = loadWorker();
    const port = new TestPort('only');
    connect({ ports: [port] });

    await port.receive({
      type: 'workerRequest',
      requestId: 'status',
      request: { type: 'getSipClientStatus' },
    });
    await port.receive({
      type: 'workerRequest',
      requestId: 'unsupported',
      request: { type: 'missingRequest' },
    });

    expect(port.postMessage).toHaveBeenCalledWith({
      type: 'workerResponse',
      requestId: 'status',
      response: {
        status: 'unregistered',
        sipInfo: undefined,
        device: undefined,
        instanceId: undefined,
      },
    });
    expect(port.postMessage).toHaveBeenCalledWith({
      type: 'workerResponse',
      requestId: 'unsupported',
      response: 'NOT_SUPPORTED',
    });
  });

  it('handles worker SIP request and reply requests through the shared client', async () => {
    const { connect, sipClient } = loadWorker();
    const port = new TestPort('only');
    const send = jest.fn();
    connect({ ports: [port] });
    sipClient.transport = {
      wsc: { send },
    };

    const requestPromise = port.receive({
      type: 'workerRequest',
      requestId: 'sip-request',
      request: {
        type: 'request',
        data: 'INVITE sip:test SIP/2.0',
      },
    });
    expect(send).toHaveBeenCalledWith('INVITE sip:test SIP/2.0');

    sipClient.emit(
      'inboundMessage',
      new TestInboundMessage('SIP/2.0 100 Trying', { CSeq: '1' }),
    );
    sipClient.emit(
      'inboundMessage',
      new TestInboundMessage('SIP/2.0 200 OK', { CSeq: '1' }),
    );
    await requestPromise;

    expect(port.postMessage).toHaveBeenCalledWith({
      type: 'workerResponse',
      requestId: 'sip-request',
      response: 'SIP/2.0 200 OK',
    });

    await port.receive({
      type: 'workerRequest',
      requestId: 'sip-reply',
      request: {
        type: 'reply',
        data: 'SIP/2.0 200 OK',
      },
    });
    expect(send).toHaveBeenCalledWith('SIP/2.0 200 OK');
    expect(port.postMessage).toHaveBeenCalledWith({
      type: 'workerResponse',
      requestId: 'sip-reply',
      response: 'OK',
    });

    send.mockImplementationOnce(() => {
      throw new Error('send failed');
    });
    await port.receive({
      type: 'workerRequest',
      requestId: 'sip-request-error',
      request: {
        type: 'request',
        data: 'MESSAGE sip:test SIP/2.0',
      },
    });
    expect(port.postMessage).toHaveBeenCalledWith({
      type: 'workerResponse',
      requestId: 'sip-request-error',
      error: 'send failed',
    });
  });

  it('registers with digest challenge responses and skips unregister when disconnected', async () => {
    const { sipClient } = loadWorker();
    const send = jest.fn();
    sipClient.sipInfo = {
      authorizationId: 'auth-id',
      domain: 'sip.example.com',
      outboundProxy: 'primary.example.com',
      password: 'password',
      username: '101',
    };
    sipClient.clientId = 'client-id';
    sipClient.device = { id: 'device-id' };
    sipClient.instanceId = 'instance-id';
    sipClient.transport = {
      status: 'connected',
      wsc: { send },
    };

    const registerPromise = sipClient.register(60);
    expect(sipClient.status).toBe('registering');
    expect(send).toHaveBeenCalledWith(
      expect.stringContaining('REGISTER sip:sip.example.com SIP/2.0'),
    );

    sipClient.emit(
      'inboundMessage',
      new TestInboundMessage('SIP/2.0 401 Unauthorized', {
        CSeq: '1',
        'WWW-Authenticate': 'Digest realm="sip.example.com", nonce="nonce-1"',
      }),
    );
    await flushPromises();
    expect(send).toHaveBeenCalledTimes(2);
    expect(send).toHaveBeenLastCalledWith(
      expect.stringContaining('REGISTER sip:sip.example.com SIP/2.0'),
    );

    sipClient.emit(
      'inboundMessage',
      new TestInboundMessage('SIP/2.0 200 OK', {
        CSeq: '1',
        Contact: '<sip:101@sip.example.com>;expires=60',
      }),
    );
    await registerPromise;

    expect(sipClient.status).toBe('registered');
    clearTimeout(sipClient.timeoutHandle);

    sipClient.transport.status = 'disconnected';
    await sipClient.unregister();
    expect(sipClient.status).toBe('unregistered');
  });

  it('starts the SIP client through the worker transport and auto-replies to SIP messages', async () => {
    const WebSocketMock = installWebSocket();
    const { connect, sipClient } = loadWorker();
    const port = new TestPort('only');
    connect({ ports: [port] });

    const startPromise = port.receive({
      type: 'workerRequest',
      requestId: 'start-sip',
      request: {
        type: 'startSipClient',
        data: {
          sipInfo: {
            authorizationId: 'auth-id',
            domain: 'sip.example.com',
            outboundProxy: 'primary.example.com',
            outboundProxyBackup: 'backup.example.com',
            password: 'password',
            username: '101',
          },
          instanceId: 'instance-id',
          device: { id: 'device-id' },
          clientId: 'client-id',
          debug: true,
        },
      },
    });
    const socket = WebSocketMock.instances[0];
    expect(socket.url).toBe('wss://primary.example.com');
    expect(socket.protocol).toBe('sip');
    socket.emit('open');
    await startPromise;

    expect(port.postMessage).toHaveBeenCalledWith({
      type: 'workerResponse',
      requestId: 'start-sip',
      response: 'OK',
    });
    expect(port.postMessage).toHaveBeenCalledWith({
      type: 'transportStatus',
      status: 'connected',
    });
    expect(socket.send).toHaveBeenCalledWith(
      expect.stringContaining('REGISTER sip:sip.example.com SIP/2.0'),
    );

    socket.emit('message', {
      data: 'SIP/2.0 200 OK\r\nContact: <sip:101@sip.example.com>;expires=60',
    });
    await flushPromises();
    expect(sipClient.status).toBe('registered');
    clearTimeout(sipClient.timeoutHandle);

    const RcMessage = require('ringcentral-web-phone/rc-message/rc-message');
    port.postMessage.mockClear();
    RcMessage.fromXml.mockResolvedValueOnce({
      body: { Cln: 'another-auth-id' },
      headers: {},
    });
    socket.emit('message', {
      data: 'MESSAGE sip:test SIP/2.0',
    });
    await flushPromises();
    expect(port.postMessage).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'inboundMessage' }),
    );

    RcMessage.fromXml.mockResolvedValueOnce({
      body: { Cln: 'auth-id' },
      headers: {},
    });
    socket.send.mockClear();
    socket.emit('message', {
      data: 'MESSAGE sip:test SIP/2.0',
    });
    await flushPromises();
    expect(port.postMessage).toHaveBeenCalledWith({
      type: 'inboundMessage',
      message: 'MESSAGE sip:test SIP/2.0',
    });
    expect(socket.send).toHaveBeenCalledWith('SIP/2.0 200 OK');

    socket.emit('close');
    await flushPromises();
    expect(sipClient.transport.status).toBe('disconnected');
    expect(port.postMessage).toHaveBeenCalledWith({
      type: 'transportStatus',
      status: 'disconnected',
    });

    await sipClient.dispose();
    expect(sipClient.transport).toBeNull();
  });

  it('handles transport connection failures, reconnect branches, and disposal guards', async () => {
    const WebSocketMock = installWebSocket();
    const { connect, sipClient } = loadWorker();
    const port = new TestPort('only');
    connect({ ports: [port] });

    await expect(port.receive({
      type: 'workerRequest',
      requestId: 'start-without-server',
      request: {
        type: 'startSipClient',
        data: {
          sipInfo: {
            authorizationId: 'auth-id',
            domain: 'sip.example.com',
            password: 'password',
            username: '101',
          },
          instanceId: 'instance-id',
          device: { id: 'device-id' },
          clientId: 'client-id',
        },
      },
    })).rejects.toThrow('No available servers');

    const startPromise = port.receive({
      type: 'workerRequest',
      requestId: 'start-error',
      request: {
        type: 'startSipClient',
        data: {
          sipInfo: {
            authorizationId: 'auth-id',
            domain: 'sip.example.com',
            outboundProxy: 'primary.example.com',
            outboundProxyBackup: 'backup.example.com',
            password: 'password',
            username: '101',
          },
          instanceId: 'instance-id',
          device: { id: 'device-id' },
          clientId: 'client-id',
          debug: true,
        },
      },
    });
    WebSocketMock.instances[0].emit('error', new Error('connect failed'));
    await startPromise;
    expect(sipClient.transport.status).toBe('reconnecting');
    expect(port.postMessage).toHaveBeenCalledWith({
      type: 'transportStatus',
      status: 'reconnecting',
    });

    sipClient.transport.dispose();
    sipClient.transport.dispose();

    const restartPromise = port.receive({
      type: 'workerRequest',
      requestId: 'start-ok',
      request: {
        type: 'startSipClient',
        data: {
          sipInfo: {
            authorizationId: 'auth-id',
            domain: 'sip.example.com',
            outboundProxy: 'primary.example.com',
            outboundProxyBackup: 'backup.example.com',
            password: 'password',
            username: '101',
          },
          instanceId: 'instance-id',
          device: { id: 'device-id' },
          clientId: 'client-id',
          force: true,
        },
      },
    });
    WebSocketMock.instances[1].emit('open');
    await restartPromise;
    WebSocketMock.instances[1].emit('message', {
      data: 'SIP/2.0 200 OK\r\nContact: <sip:101@sip.example.com>;expires=60',
    });
    await flushPromises();
    clearTimeout(sipClient.timeoutHandle);

    sipClient.transport.wsServers.forEach((server) => {
      server.isError = true;
    });
    await sipClient.transport.reconnect();
    expect(sipClient.transport.status).toBe('error');

    sipClient.transport.wsServers.forEach((server) => {
      server.isError = false;
    });
    sipClient.transport.currentServer = sipClient.transport.wsServers[0];
    sipClient.transport.status = 'reconnecting';
    sipClient.transport.reconnectionAttempts =
      sipClient.transport.maxReconnectionAttempts + 1;
    await sipClient.transport.reconnect();
    expect(sipClient.transport.currentServer).toBe(sipClient.transport.wsServers[1]);
    sipClient.transport.dispose();
  });

  it('maps registration failures and worker reply failures', async () => {
    const { connect, sipClient } = loadWorker();
    const port = new TestPort('only');
    const send = jest.fn();
    connect({ ports: [port] });
    sipClient.sipInfo = {
      authorizationId: 'auth-id',
      domain: 'sip.example.com',
      outboundProxy: 'primary.example.com',
      password: 'password',
      username: '101',
    };
    sipClient.clientId = 'client-id';
    sipClient.device = { id: 'device-id' };
    sipClient.instanceId = 'instance-id';
    sipClient.transport = {
      status: 'connected',
      wsc: { send },
      dispose: jest.fn(async () => {}),
    };

    const forbiddenPromise = sipClient.register(60);
    sipClient.emit(
      'inboundMessage',
      new TestInboundMessage('SIP/2.0 403 Forbidden', { CSeq: '1' }),
    );
    await forbiddenPromise;
    expect(sipClient.status).toBe('registrationError');

    const declinePromise = sipClient.register(60);
    sipClient.emit(
      'inboundMessage',
      new TestInboundMessage('SIP/2.0 603 Decline', { CSeq: '1' }),
    );
    await declinePromise;
    expect(sipClient.status).toBe('registrationError');

    const missingContactPromise = sipClient.register(60);
    sipClient.emit(
      'inboundMessage',
      new TestInboundMessage('SIP/2.0 200 OK', { CSeq: '1' }),
    );
    await missingContactPromise;
    expect(sipClient.status).toBe('registrationError');

    send.mockImplementationOnce(() => {
      throw new Error('reply failed');
    });
    await port.receive({
      type: 'workerRequest',
      requestId: 'reply-error',
      request: {
        type: 'reply',
        data: 'SIP/2.0 200 OK',
      },
    });
    expect(port.postMessage).toHaveBeenCalledWith({
      type: 'workerResponse',
      requestId: 'reply-error',
      error: 'reply failed',
    });

    sipClient.status = 'registered';
    sipClient.unregister = jest.fn(async () => {
      throw new Error('unregister failed');
    });
    await sipClient.dispose();
    expect(sipClient.status).toBe('registrationError');
    expect(sipClient.transport).toBeNull();
  });

  it('handles worker register and unregister requests', async () => {
    const { connect, sipClient } = loadWorker();
    const port = new TestPort('only');
    connect({ ports: [port] });
    sipClient.register = jest.fn(async () => {});
    sipClient.dispose = jest.fn(async () => {});

    await port.receive({
      type: 'workerRequest',
      requestId: 'register',
      request: {
        type: 'register',
        data: 60,
      },
    });
    await port.receive({
      type: 'workerRequest',
      requestId: 'unregister',
      request: {
        type: 'unregister',
      },
    });

    expect(sipClient.register).toHaveBeenCalledWith(60);
    expect(sipClient.dispose).toHaveBeenCalled();
    expect(port.postMessage).toHaveBeenCalledWith({
      type: 'workerResponse',
      requestId: 'register',
      response: 'OK',
    });
    expect(port.postMessage).toHaveBeenCalledWith({
      type: 'workerResponse',
      requestId: 'unregister',
      response: 'OK',
    });
  });
});
