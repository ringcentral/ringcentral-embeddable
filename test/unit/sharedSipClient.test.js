const EventEmitter = require('events');

class TestInboundMessage {
  constructor(rawMessage = '') {
    this.rawMessage = rawMessage;
  }

  toString() {
    return this.rawMessage;
  }

  static fromString(rawMessage) {
    return new TestInboundMessage(rawMessage);
  }
}

class TestOutboundMessage {
  constructor(rawMessage = '') {
    this.rawMessage = rawMessage;
  }

  toString() {
    return this.rawMessage;
  }

  static fromString(rawMessage) {
    return new TestOutboundMessage(rawMessage);
  }
}

class TestPort {
  constructor() {
    this.listeners = new Set();
    this.addEventListener = jest.fn((event, listener) => {
      if (event === 'message') {
        this.listeners.add(listener);
      }
    });
    this.removeEventListener = jest.fn((event, listener) => {
      if (event === 'message') {
        this.listeners.delete(listener);
      }
    });
    this.start = jest.fn();
    this.close = jest.fn();
    this.postMessage = jest.fn();
  }

  dispatch(data) {
    this.listeners.forEach((listener) => listener({ data }));
  }

  resolveLastWorkerRequest(response, error) {
    const message = this.postMessage.mock.calls
      .map(([call]) => call)
      .filter((call) => call.type === 'workerRequest')
      .pop();
    this.dispatch({
      type: 'workerResponse',
      requestId: message.requestId,
      response,
      error,
    });
  }
}

function installSharedSipClientDependencies() {
  let requestSequence = 0;
  jest.doMock('ringcentral-web-phone/event-emitter', () => EventEmitter);
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
    () => TestOutboundMessage,
  );
  jest.doMock(
    'ringcentral-web-phone/sip-message/outbound/response',
    () => TestOutboundMessage,
  );
  jest.doMock('ringcentral-web-phone/utils', () => ({
    uuid: () => {
      requestSequence += 1;
      return `request-${requestSequence}`;
    },
  }));
}

function loadSharedSipClient() {
  jest.resetModules();
  installSharedSipClientDependencies();
  return require('../../src/modules/WebphoneV2/SharedSipClient').SharedSipClient;
}

function createClient() {
  const SharedSipClient = loadSharedSipClient();
  const port = new TestPort();
  const worker = { port };
  const logger = {
    debug: jest.fn(),
    log: jest.fn(),
  };
  const client = new SharedSipClient({
    worker,
    tabId: 'tab-1',
    clientId: 'client-1',
    logger,
  });
  return {
    client,
    logger,
    port,
  };
}

describe('SharedSipClient', () => {
  afterEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
  });

  it('subscribes to worker port events and translates worker messages', () => {
    const { client, logger, port } = createClient();
    const inboundListener = jest.fn();
    const outboundListener = jest.fn();
    const statusListener = jest.fn();
    const transportStatusListener = jest.fn();
    const sharedStateListener = jest.fn();
    const activeTabListener = jest.fn();
    client.on('inboundMessage', inboundListener);
    client.on('outboundMessage', outboundListener);
    client.on('status', statusListener);
    client.on('transportStatus', transportStatusListener);
    client.on('sharedStateChanged', sharedStateListener);
    client.on('activeTabIdChanged', activeTabListener);

    port.dispatch({ type: 'inboundMessage', message: 'INVITE sip:test' });
    port.dispatch({ type: 'outboundMessage', message: 'SIP/2.0 200 OK' });
    port.dispatch({ type: 'status', status: 'registered', error: undefined });
    port.dispatch({ type: 'transportStatus', status: 'connected' });
    port.dispatch({ type: 'setSharedState', state: { sessions: [{ id: '1' }] } });
    port.dispatch({ type: 'setActive', activeTabId: 'tab-2' });

    expect(port.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
    expect(port.start).toHaveBeenCalled();
    expect(inboundListener.mock.calls[0][0].toString()).toBe('INVITE sip:test');
    expect(outboundListener.mock.calls[0][0].toString()).toBe('SIP/2.0 200 OK');
    expect(statusListener).toHaveBeenCalledWith('registered', undefined);
    expect(transportStatusListener).toHaveBeenCalledWith('connected');
    expect(sharedStateListener).toHaveBeenCalledWith({
      sessions: [{ id: '1' }],
    });
    expect(activeTabListener).toHaveBeenCalledWith('tab-2');
    expect(client.activeTabId).toBe('tab-2');
    expect(logger.log).toHaveBeenCalledWith('status', 'registered', undefined);
  });

  it('resolves and rejects worker requests by request id', async () => {
    const { client, port } = createClient();

    const requestPromise = client.workerRequest({ type: 'getSharedState' });
    port.dispatch({
      type: 'workerResponse',
      requestId: 'other-request',
      response: 'ignored',
    });
    port.resolveLastWorkerRequest({ sessions: [] });
    await expect(requestPromise).resolves.toEqual({ sessions: [] });

    const errorPromise = client.workerRequest({ type: 'getSharedState' });
    port.resolveLastWorkerRequest(undefined, 'Worker failed');
    await expect(errorPromise).rejects.toThrow('Worker failed');
  });

  it('forwards SIP lifecycle methods through worker requests', async () => {
    const { client, port } = createClient();
    const sipInfo = {
      authorizationId: 'auth-id',
      domain: 'sip.example.com',
    };
    const device = { id: 'device-id' };

    const startPromise = client.start({
      sipInfo,
      device,
      instanceId: 'instance-id',
      debug: true,
      force: true,
    });
    port.resolveLastWorkerRequest('OK');
    await startPromise;
    expect(client.sipInfo).toBe(sipInfo);
    expect(client.device).toBe(device);
    expect(client.instanceId).toBe('instance-id');
    expect(port.postMessage).toHaveBeenLastCalledWith({
      type: 'workerRequest',
      requestId: 'request-1',
      request: {
        type: 'startSipClient',
        data: {
          sipInfo,
          device,
          instanceId: 'instance-id',
          debug: true,
          clientId: 'client-1',
          force: true,
        },
      },
    });

    const requestPromise = client.request(new TestOutboundMessage('INVITE sip:test'));
    port.resolveLastWorkerRequest('SIP/2.0 200 OK');
    await expect(requestPromise).resolves.toEqual(
      expect.objectContaining({ rawMessage: 'SIP/2.0 200 OK' }),
    );

    const replyPromise = client.reply(new TestOutboundMessage('SIP/2.0 200 OK'));
    port.resolveLastWorkerRequest('OK');
    await expect(replyPromise).resolves.toBeUndefined();

    const registerPromise = client.register(60);
    port.resolveLastWorkerRequest('OK');
    await expect(registerPromise).resolves.toBeUndefined();

    const unregisterPromise = client.unregister();
    port.resolveLastWorkerRequest('OK');
    await expect(unregisterPromise).resolves.toBeUndefined();
  });

  it('syncs shared state and active tab state with the worker', async () => {
    const { client, port } = createClient();

    client.setSharedState({ sessions: [{ id: 'local-session' }] });
    expect(client.sharedState).toEqual({
      sessions: [{ id: 'local-session' }],
    });
    expect(port.postMessage).toHaveBeenCalledWith({
      type: 'setSharedState',
      state: {
        sessions: [{ id: 'local-session' }],
      },
    });

    const syncStatePromise = client.syncSharedState();
    port.resolveLastWorkerRequest({ sessions: [{ id: 'remote-session' }] });
    await expect(syncStatePromise).resolves.toEqual({
      sessions: [{ id: 'remote-session' }],
    });
    expect(client.sharedState).toEqual({
      sessions: [{ id: 'remote-session' }],
    });

    client.setActive('tab-1');
    expect(client.active).toBe(true);
    expect(port.postMessage).toHaveBeenCalledWith({
      type: 'setActive',
      activeTabId: 'tab-1',
    });

    const syncActivePromise = client.syncActiveTabId();
    port.resolveLastWorkerRequest('tab-2');
    await expect(syncActivePromise).resolves.toBe('tab-2');
    expect(client.active).toBe(false);
  });

  it('gets status and disposes the worker port', async () => {
    const { client, port } = createClient();

    const statusPromise = client.getStatus();
    port.resolveLastWorkerRequest({
      status: 'registered',
      instanceId: 'instance-id',
    });
    await expect(statusPromise).resolves.toEqual({
      status: 'registered',
      instanceId: 'instance-id',
    });

    client.dispose();

    expect(client.disposed).toBe(true);
    expect(port.removeEventListener).toHaveBeenCalledWith('message', expect.any(Function));
    expect(port.postMessage).toHaveBeenCalledWith({ type: 'destroyPort' });
    expect(port.close).toHaveBeenCalled();
    expect(client.worker).toBeNull();
  });

  it('rejects in-flight requests when disposed without throwing', async () => {
    const { client, port } = createClient();

    const pendingPromise = client.workerRequest({ type: 'getSharedState' });
    const assertion = expect(pendingPromise).rejects.toThrow(
      'SharedSipClient has been disposed',
    );

    expect(() => client.dispose()).not.toThrow();
    await assertion;

    // The pending request's listener must be torn down so the closed port is
    // no longer referenced.
    expect(port.removeEventListener).toHaveBeenCalledWith(
      'message',
      expect.any(Function),
    );
  });

  it('does not leave the timeout callback dereferencing a nulled worker', async () => {
    jest.useFakeTimers();
    try {
      const { client } = createClient();
      const pendingPromise = client.workerRequest({ type: 'getSharedState' });
      const assertion = expect(pendingPromise).rejects.toThrow(
        'SharedSipClient has been disposed',
      );
      client.dispose();
      await assertion;

      // Advancing past the 8s timeout must not throw a TypeError now that the
      // request was already settled and cleaned up on dispose.
      expect(() => jest.advanceTimersByTime(9000)).not.toThrow();
    } finally {
      jest.useRealTimers();
    }
  });

  it('rejects new requests made after disposal', async () => {
    const { client } = createClient();
    client.dispose();
    await expect(client.workerRequest({ type: 'getSharedState' })).rejects.toThrow(
      'SharedSipClient has been disposed',
    );
  });
});
