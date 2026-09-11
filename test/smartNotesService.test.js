import { EventEmitter } from 'events';

import { sleep } from '@ringcentral-integration/commons/utils';
import { dynamicLoad } from '@ringcentral/mfe-react';

import { SmartNotes } from '../src/app/services/SmartNotes/SmartNotes';

jest.mock('@ringcentral/mfe-react', () => ({
  dynamicLoad: jest.fn(),
}));

jest.mock('@ringcentral-integration/commons/utils', () => ({
  ...jest.requireActual('@ringcentral-integration/commons/utils'),
  sleep: jest.fn(async () => {}),
}));

class FakeSmartNoteClient extends EventEmitter {
  constructor(options) {
    super();
    this.options = options;
    this.transcriptionStatus = 'idle';
    this.transcriptions = [];
    this.pause = jest.fn(async () => {});
    this.resume = jest.fn(async () => {});
    this.start = jest.fn(async () => {});
    this.stop = jest.fn(async () => {});
    this.updateTelephonySessionStatus = jest.fn(async () => {});
    this.removeAllListeners = jest.fn(() => {
      EventEmitter.prototype.removeAllListeners.call(this);
    });
    FakeSmartNoteClient.instances.push(this);
  }

  static reset() {
    FakeSmartNoteClient.instances = [];
    FakeSmartNoteClient.querySmartNotes = jest.fn(async () => ({ records: [] }));
    FakeSmartNoteClient.getNotes = jest.fn(async () => ({
      status: 'Completed',
      data: '',
    }));
    FakeSmartNoteClient.getTranscripts = jest.fn(async () => ({
      transcripts: [],
    }));
  }
}

FakeSmartNoteClient.reset();

function createDependencies(overrides = {}) {
  const handlers = {};
  const dependencies = {
    client: { service: { name: 'sdk' } },
    auth: { loggedIn: true, ownerId: 'owner-id' },
    appFeatures: { hasSmartNotePermission: true },
    webphone: {
      sessions: [],
      onCallStart: jest.fn((handler) => {
        handlers.callStart = handler;
      }),
      onCallResume: jest.fn((handler) => {
        handlers.callResume = handler;
      }),
      onCallEnd: jest.fn((handler) => {
        handlers.callEnd = handler;
      }),
    },
    contactMatcher: {
      dataMapping: {
        '+16505550123': [
          { id: 'contact-1', name: 'Matched Contact', phoneNumber: '+16505550123' },
        ],
      },
    },
    storage: { enable: jest.fn() },
    toast: { warning: jest.fn() },
    tabManager: { interacting: true },
    portManager: {
      shared: false,
      isServer: true,
      onClient: jest.fn(),
      onMainTab: jest.fn(() => jest.fn()),
    },
    handlers,
    ...overrides,
  };
  return dependencies;
}

function createSmartNotes(overrides = {}) {
  const dependencies = createDependencies(overrides);
  const smartNotes = new SmartNotes(
    dependencies.client,
    dependencies.auth,
    dependencies.appFeatures,
    dependencies.webphone,
    dependencies.contactMatcher,
    dependencies.storage,
    dependencies.toast,
    dependencies.tabManager,
    dependencies.portManager,
  );
  smartNotes.logger = { error: jest.fn() };
  return { dependencies, smartNotes };
}

function createSession(overrides = {}) {
  return {
    id: 'session-1',
    status: 'Answered',
    phoneNumber: '+16505550123',
    contact: { id: 'contact-1', name: 'Customer' },
    direction: 'Outbound',
    startTime: '2026-01-01T10:00:00.000Z',
    ...overrides,
  };
}

function createWebphoneSession(overrides = {}) {
  return {
    direction: 'Outbound',
    from: '+16505550100',
    fromUserName: 'Agent',
    to: '+16505550123',
    toUserName: 'Customer',
    partyData: { sessionId: 'session-1' },
    startTime: Date.parse('2026-01-01T10:00:00.000Z'),
    ...overrides,
  };
}

async function flushPromises() {
  for (let index = 0; index < 10; index += 1) {
    await Promise.resolve();
  }
}

describe('SmartNotes service', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    FakeSmartNoteClient.reset();
    dynamicLoad.mockReset();
    dynamicLoad.mockResolvedValue({
      default: { SmartNoteClient: FakeSmartNoteClient },
    });
    global.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        smartNotesIframe: 'https://example.com/smart-notes.html',
        smartNotesMFE: 'https://example.com/remote-entry.js',
      }),
    }));
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
    delete global.fetch;
  });

  test('binds browser hooks, initializes the remote client, and exposes lifecycle guards', async () => {
    const { dependencies, smartNotes } = createSmartNotes();

    expect(dependencies.storage.enable).toHaveBeenCalledWith(smartNotes);
    expect(dependencies.webphone.onCallStart).toHaveBeenCalledTimes(1);
    expect(dependencies.webphone.onCallResume).toHaveBeenCalledTimes(1);
    expect(dependencies.webphone.onCallEnd).toHaveBeenCalledTimes(1);
    expect(dependencies.portManager.onMainTab).toHaveBeenCalledTimes(1);
    expect(smartNotes._shouldInit()).toBe(true);
    expect(smartNotes._shouldReset()).toBe(false);

    await smartNotes.onInit();

    expect(global.fetch).toHaveBeenCalledWith('./plugins.json');
    expect(dynamicLoad).toHaveBeenCalledWith(
      '@ringcentral/smart-note-widget/src/bootstrap',
      'https://example.com/remote-entry.js',
    );
    expect(smartNotes.clientInitialized).toBe(true);
    expect(smartNotes.smartNoteMFERemoteEntry).toBe(
      'https://example.com/remote-entry.js',
    );

    dependencies.auth.loggedIn = false;
    expect(smartNotes._shouldInit()).toBe(false);
    smartNotes.status = 'ready';
    expect(smartNotes._shouldReset()).toBe(true);
  });

  test('uses shared runtime ownership and main-tab callbacks correctly', async () => {
    let bindClient;
    const { dependencies, smartNotes } = createSmartNotes({
      portManager: {
        shared: true,
        isServer: false,
        onClient: jest.fn((handler) => {
          bindClient = handler;
        }),
        onMainTab: jest.fn(() => jest.fn()),
      },
    });

    expect(dependencies.webphone.onCallStart).not.toHaveBeenCalled();
    expect(dependencies.portManager.onClient).toHaveBeenCalledTimes(1);
    await smartNotes.onInit();
    expect(global.fetch).not.toHaveBeenCalled();

    const dispose = bindClient();
    expect(dependencies.webphone.onCallStart).toHaveBeenCalledTimes(1);
    expect(typeof dispose).toBe('function');
    dispose();
    await smartNotes.onReset();
    expect(smartNotes.clientInitialized).toBe(false);
  });

  test('initializes from a main-tab callback and ignores it without permission', async () => {
    let mainTabHandler;
    const { dependencies, smartNotes } = createSmartNotes({
      portManager: {
        shared: false,
        isServer: true,
        onClient: jest.fn(),
        onMainTab: jest.fn((handler) => {
          mainTabHandler = handler;
          return jest.fn();
        }),
      },
    });

    mainTabHandler();
    await flushPromises();
    expect(smartNotes.clientInitialized).toBe(true);

    dependencies.appFeatures.hasSmartNotePermission = false;
    global.fetch.mockClear();
    mainTabHandler();
    await flushPromises();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test.each([
    [
      'an HTTP failure',
      async () => ({ ok: false, status: 500, json: async () => ({}) }),
    ],
    [
      'missing remote metadata',
      async () => ({ ok: true, status: 200, json: async () => ({ smartNotesIframe: 'x' }) }),
    ],
  ])('handles %s while loading the remote client', async (_label, response) => {
    global.fetch.mockImplementationOnce(response);
    const { smartNotes } = createSmartNotes();

    await smartNotes.onInit();

    expect(smartNotes.clientInitialized).toBe(false);
    if (_label === 'an HTTP failure') {
      expect(smartNotes.logger.error).toHaveBeenCalled();
    }
  });

  test('handles a rejected dynamic import and deduplicates concurrent initialization', async () => {
    let resolveLoad;
    dynamicLoad.mockImplementationOnce(
      () => new Promise((resolve) => {
        resolveLoad = resolve;
      }),
    );
    const { smartNotes } = createSmartNotes();

    const first = smartNotes._ensureClientInitialized();
    const second = smartNotes._ensureClientInitialized();
    await flushPromises();
    resolveLoad({ default: { SmartNoteClient: FakeSmartNoteClient } });

    await expect(first).resolves.toBe(true);
    await expect(second).resolves.toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    await expect(smartNotes._ensureClientInitialized()).resolves.toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(1);

    const failed = createSmartNotes().smartNotes;
    dynamicLoad.mockRejectedValueOnce(new Error('load failed'));
    await expect(failed._ensureClientInitialized()).resolves.toBe(false);
    expect(failed.logger.error).toHaveBeenCalled();
  });

  test('maps webphone sessions and disconnect events', async () => {
    const { dependencies, smartNotes } = createSmartNotes();
    await smartNotes.onInit();

    dependencies.handlers.callStart(createWebphoneSession());
    await flushPromises();

    expect(smartNotes.session).toEqual(
      expect.objectContaining({
        id: 'session-1',
        contact: expect.objectContaining({ name: 'Matched Contact' }),
      }),
    );
    expect(FakeSmartNoteClient.instances[0].options).toEqual(
      expect.objectContaining({
        sdk: dependencies.client.service,
        extensionId: 'owner-id',
        telephonySessionId: 'session-1',
        smartNoteIframeUri: 'https://example.com/smart-notes.html',
      }),
    );

    const trackStart = jest.spyOn(smartNotes, 'trackSmartNoteStart');
    FakeSmartNoteClient.instances[0].emit('statusUpdate', 'loading');
    FakeSmartNoteClient.instances[0].emit('statusUpdate', 'ready');
    expect(trackStart).toHaveBeenCalledTimes(1);

    FakeSmartNoteClient.instances[0].transcriptions = [{ text: 'one' }, { text: 'two' }];
    FakeSmartNoteClient.instances[0].transcriptionStatus = 'recording';
    dependencies.handlers.callEnd(createWebphoneSession());
    await flushPromises();

    expect(smartNotes.recentNotedCalls).toEqual(['session-1']);
    expect(FakeSmartNoteClient.instances[0].updateTelephonySessionStatus)
      .toHaveBeenCalledWith('Disconnected');
    expect(smartNotes.session.status).toBe('Disconnected');
  });

  test('guards webphone hooks and maps unmatched inbound sessions', async () => {
    const { dependencies, smartNotes } = createSmartNotes();
    await smartNotes.onInit();
    dependencies.appFeatures.hasSmartNotePermission = false;

    dependencies.handlers.callStart(createWebphoneSession());
    dependencies.handlers.callEnd(createWebphoneSession());
    await flushPromises();
    expect(smartNotes.session).toBeNull();

    dependencies.appFeatures.hasSmartNotePermission = true;
    Object.defineProperty(smartNotes, 'showSmartNote', {
      configurable: true,
      get: () => false,
    });
    dependencies.handlers.callResume(createWebphoneSession());
    dependencies.handlers.callEnd(createWebphoneSession());
    await flushPromises();
    expect(smartNotes.session).toBeNull();

    Object.defineProperty(smartNotes, 'showSmartNote', {
      configurable: true,
      get: () => true,
    });
    dependencies.handlers.callEnd({ direction: 'Outbound' });
    dependencies.handlers.callStart(
      createWebphoneSession({
        direction: 'Inbound',
        from: '+16505550999',
        fromUserName: 'Inbound Caller',
        partyData: { sessionId: 'inbound-session' },
      }),
    );
    await flushPromises();
    expect(smartNotes.session).toEqual(
      expect.objectContaining({
        id: 'inbound-session',
        direction: 'Inbound',
        contact: { name: 'Inbound Caller', phoneNumber: '+16505550999' },
      }),
    );

    await smartNotes._setWebphoneSession({ direction: 'Outbound' });
    expect(smartNotes.session.id).toBe('inbound-session');
  });

  test('updates settings, bounded caches, and computed mappings', async () => {
    const { smartNotes } = createSmartNotes();

    await smartNotes.setShowSmartNote(false, true, 'managed');
    expect(smartNotes.showSmartNote).toBe(true);
    expect(smartNotes.showSmartNoteReadOnly).toBe(true);
    expect(smartNotes.showSmartNoteReadOnlyReason).toBe('managed');
    await smartNotes.toggleShowSmartNote();

    await smartNotes.toggleAutoStartSmartNote();
    expect(smartNotes.autoStartSmartNote).toBe(true);
    await smartNotes.setAutoStartSmartNote(false, true, 'policy');
    expect(smartNotes.autoStartSmartNoteReadOnly).toBe(true);
    expect(smartNotes.autoStartSmartNoteReadOnlyReason).toBe('policy');
    await smartNotes.setClientInitialized(true);
    expect(smartNotes.clientInitialized).toBe(true);

    for (let index = 0; index < 8; index += 1) {
      await smartNotes.addRecentNotedCall(`recent-${index}`);
    }
    await smartNotes.addRecentNotedCall('recent-6');
    expect(smartNotes.recentNotedCalls).toEqual([
      'recent-6',
      'recent-7',
      'recent-5',
      'recent-4',
      'recent-3',
    ]);

    await smartNotes.addCallsQueryResults(
      Array.from({ length: 105 }, (_, index) => ({
        id: `call-${index}`,
        noted: index % 2 === 0,
      })),
    );
    expect(smartNotes.callsQueryResults).toHaveLength(100);
    expect(smartNotes.aiNotedCallMapping['call-0']).toBe(true);
    expect(smartNotes.aiNotedCallMapping['call-1']).toBeUndefined();

    for (let index = 0; index < 22; index += 1) {
      await smartNotes.addSmartNoteTextStore(`note-${index}`, `text-${index}`);
      await smartNotes.addTranscriptStore(`note-${index}`, {
        transcripts: [{ text: `transcript-${index}` }],
      });
    }
    expect(smartNotes.smartNoteTextStore).toHaveLength(20);
    expect(smartNotes.transcriptStore).toHaveLength(20);
    expect(smartNotes.smartNoteTextMapping['note-21']).toBe('text-21');
    expect(smartNotes.transcriptMapping['note-21']).toEqual({
      transcripts: [{ text: 'transcript-21' }],
    });
    await smartNotes.removeSmartNoteTextStore('note-21');
    expect(smartNotes.smartNoteTextMapping['note-21']).toBeUndefined();
  });

  test('creates, updates, pauses, resumes, and closes session clients', async () => {
    const { smartNotes } = createSmartNotes();
    smartNotes._smartNoteClientConstructor = FakeSmartNoteClient;
    smartNotes._smartNoteIframeUri = 'iframe.html';
    await smartNotes.setAutoStartSmartNote(true);
    const firstSession = createSession();

    await smartNotes.setSession(firstSession);
    expect(smartNotes.smartNoteClient).toBe(FakeSmartNoteClient.instances[0]);
    expect(smartNotes.presentation).toBe('independent');
    jest.advanceTimersByTime(2000);
    await flushPromises();
    expect(FakeSmartNoteClient.instances[0].start).toHaveBeenCalledTimes(1);

    await smartNotes.setSession({ ...firstSession, status: 'Disconnected' });
    expect(FakeSmartNoteClient.instances[0].updateTelephonySessionStatus)
      .toHaveBeenCalledWith('Disconnected');

    FakeSmartNoteClient.instances[0].transcriptionStatus = 'recording';
    const secondSession = createSession({ id: 'session-2', phoneNumber: '+16505550124' });
    await smartNotes.setSession(secondSession);
    expect(FakeSmartNoteClient.instances[0].pause).toHaveBeenCalledTimes(1);

    FakeSmartNoteClient.instances[1].transcriptionStatus = 'paused';
    await smartNotes.setSession(secondSession);
    await smartNotes._autoStartSession(secondSession, FakeSmartNoteClient.instances[1]);
    expect(FakeSmartNoteClient.instances[1].resume).toHaveBeenCalled();

    await smartNotes.setSession(null);
    expect(FakeSmartNoteClient.instances[1].stop).toHaveBeenCalledTimes(1);
    expect(FakeSmartNoteClient.instances[1].removeAllListeners).toHaveBeenCalled();
    expect(smartNotes.session).toBeNull();
    expect(smartNotes.presentation).toBe('independent');
    await expect(smartNotes.setSession(null)).resolves.toBeUndefined();
    expect(smartNotes.smartNoteClient).toBeNull();
  });

  test('starts, resumes, and leaves running notes alone on request', async () => {
    const { dependencies, smartNotes } = createSmartNotes();
    smartNotes._smartNoteClientConstructor = FakeSmartNoteClient;
    dependencies.webphone.sessions = [createWebphoneSession()];

    const session = await smartNotes.startOrResumeNotes('session-1');

    expect(session).toEqual(
      expect.objectContaining({
        id: 'session-1',
        status: 'Answered',
        phoneNumber: '+16505550123',
        contact: expect.objectContaining({ id: 'contact-1' }),
      }),
    );
    const [client] = FakeSmartNoteClient.instances;
    expect(client.start).toHaveBeenCalledTimes(1);

    client.transcriptionStatus = 'paused';
    await smartNotes.startOrResumeNotes('session-1');
    expect(client.resume).toHaveBeenCalledTimes(1);
    expect(client.start).toHaveBeenCalledTimes(1);

    client.transcriptionStatus = 'recording';
    await smartNotes.startOrResumeNotes('session-1');
    expect(client.resume).toHaveBeenCalledTimes(1);
    expect(client.start).toHaveBeenCalledTimes(1);
  });

  test('cancels a pending auto start before starting the notes manually', async () => {
    const { dependencies, smartNotes } = createSmartNotes();
    smartNotes._smartNoteClientConstructor = FakeSmartNoteClient;
    dependencies.webphone.sessions = [createWebphoneSession()];
    await smartNotes.setAutoStartSmartNote(true);

    await smartNotes.startOrResumeNotes('session-1');

    const [client] = FakeSmartNoteClient.instances;
    expect(client.start).toHaveBeenCalledTimes(1);
    expect(smartNotes._autoStartTimeout).toBeNull();
    jest.advanceTimersByTime(5000);
    await flushPromises();
    expect(client.start).toHaveBeenCalledTimes(1);
  });

  test('reports a failed manual start and keeps presenting the session', async () => {
    const { dependencies, smartNotes } = createSmartNotes();
    smartNotes._smartNoteClientConstructor = FakeSmartNoteClient;
    dependencies.webphone.sessions = [createWebphoneSession()];

    FakeSmartNoteClient.instances = [];
    const session = await smartNotes.startOrResumeNotes('session-1');
    // the client is created by the first call, make it fail on the next start
    const [client] = FakeSmartNoteClient.instances;
    client.start.mockRejectedValueOnce(new Error('CC-500'));
    client.transcriptionStatus = 'stopped';

    await expect(smartNotes.startOrResumeNotes('session-1')).resolves.toEqual(
      session,
    );
    expect(dependencies.toast.warning).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'The AI assistant could not be started. Try again.',
      }),
    );
    expect(smartNotes.logger.error).toHaveBeenCalled();
  });

  test('refuses to start the notes without a session or permission', async () => {
    const { dependencies, smartNotes } = createSmartNotes();
    smartNotes._smartNoteClientConstructor = FakeSmartNoteClient;

    await expect(smartNotes.startOrResumeNotes('missing')).resolves.toBeNull();
    expect(FakeSmartNoteClient.instances).toHaveLength(0);

    // an ongoing call on another device has no local webphone session
    smartNotes._setSessionState(createSession({ id: 'other-device' }));
    await expect(
      smartNotes.startOrResumeNotes('other-device'),
    ).resolves.toEqual(expect.objectContaining({ id: 'other-device' }));

    dependencies.appFeatures.hasSmartNotePermission = false;
    await expect(
      smartNotes.startOrResumeNotes('other-device'),
    ).resolves.toBeNull();
  });

  test('skips auto start for ineligible sessions and cleans idle background clients', async () => {
    const { dependencies, smartNotes } = createSmartNotes();
    smartNotes._smartNoteClientConstructor = FakeSmartNoteClient;
    await smartNotes.setAutoStartSmartNote(true);
    const client = new FakeSmartNoteClient({});

    smartNotes._autoStartSession(createSession({ status: 'Ringing' }), client);
    await smartNotes.setAutoStartSmartNote(false);
    smartNotes._autoStartSession(createSession(), client);
    expect(client.start).not.toHaveBeenCalled();

    await smartNotes.setAutoStartSmartNote(true);
    dependencies.tabManager.interacting = false;
    smartNotes._autoStartSession(createSession(), client);
    expect(smartNotes._autoStartTimeout).toBeNull();

    const idle = new FakeSmartNoteClient({});
    const stopped = new FakeSmartNoteClient({});
    const active = new FakeSmartNoteClient({});
    stopped.transcriptionStatus = 'stopped';
    active.transcriptionStatus = 'recording';
    smartNotes._smartNoteClientMap.set('idle', idle);
    smartNotes._smartNoteClientMap.set('stopped', stopped);
    smartNotes._smartNoteClientMap.set('active', active);
    smartNotes._clearOtherIdleClients('active');
    expect(smartNotes._smartNoteClientMap.has('idle')).toBe(false);
    expect(smartNotes._smartNoteClientMap.has('stopped')).toBe(false);
    expect(smartNotes._smartNoteClientMap.get('active')).toBe(active);
  });

  test('retries transient auto-start failures and reports permanent failures', async () => {
    const { dependencies, smartNotes } = createSmartNotes();
    const session = createSession({ id: 'retry-session' });
    const client = new FakeSmartNoteClient({});
    client.start
      .mockRejectedValueOnce(new Error('CC-102 media is not ready'))
      .mockResolvedValueOnce(undefined);
    smartNotes._smartNoteClientMap.set(session.id, client);

    smartNotes._startSmartNote(session);
    jest.advanceTimersByTime(2000);
    await flushPromises();
    expect(client.start).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(5000);
    await flushPromises();
    expect(client.start).toHaveBeenCalledTimes(2);

    client.start.mockRejectedValueOnce('unknown failure');
    smartNotes._startSmartNote(session, true);
    jest.advanceTimersByTime(5000);
    await flushPromises();
    expect(smartNotes.logger.error).toHaveBeenCalledWith(
      'Failed to auto start SmartNotes',
      'unknown failure',
    );
    expect(dependencies.toast.warning).toHaveBeenCalledWith(
      expect.objectContaining({ ttl: 10000 }),
    );

    client.transcriptionStatus = 'recording';
    await smartNotes._executeAutoStart(session, false);
    smartNotes._smartNoteClientMap.delete(session.id);
    await smartNotes._executeAutoStart(session, false);
    expect(client.start).toHaveBeenCalledTimes(3);
  });

  test('handles every disconnected-session ownership state', async () => {
    const { smartNotes } = createSmartNotes();
    smartNotes._smartNoteClientConstructor = FakeSmartNoteClient;
    const current = createSession();

    smartNotes._setSessionState(current);
    await smartNotes.setSessionDisconnected({ ...current, status: 'Disconnected' });
    expect(smartNotes.session).toBeNull();

    await smartNotes.setSession(current);
    const idleClient = smartNotes.smartNoteClient;
    await smartNotes.setSessionDisconnected({ ...current, status: 'Disconnected' });
    expect(idleClient.removeAllListeners).toHaveBeenCalled();
    expect(smartNotes.session).toBeNull();

    await smartNotes.setSession(current);
    const activeClient = smartNotes.smartNoteClient;
    activeClient.transcriptionStatus = 'recording';
    activeClient.transcriptions = [{ text: 'one' }, { text: 'two' }];
    await smartNotes.setSessionDisconnected({ ...current, status: 'Disconnected' });
    expect(activeClient.updateTelephonySessionStatus).toHaveBeenCalledWith('Disconnected');
    expect(smartNotes.session.status).toBe('Disconnected');
    await smartNotes.setSessionDisconnected({ ...current, status: 'Disconnected' });
    expect(activeClient.updateTelephonySessionStatus).toHaveBeenCalledTimes(1);

    const background = new FakeSmartNoteClient({});
    background.transcriptionStatus = 'recording';
    smartNotes._smartNoteClientMap.set('background', background);
    await smartNotes.setSessionDisconnected(createSession({ id: 'background' }));
    expect(background.updateTelephonySessionStatus).toHaveBeenCalledWith('Disconnected');
    expect(background.removeAllListeners).toHaveBeenCalled();

    const idleBackground = new FakeSmartNoteClient({});
    smartNotes._smartNoteClientMap.set('idle-background', idleBackground);
    await smartNotes.setSessionDisconnected(createSession({ id: 'idle-background' }));
    expect(idleBackground.updateTelephonySessionStatus).not.toHaveBeenCalled();
  });

  test('queries noted calls once and merges recent-call knowledge', async () => {
    const { smartNotes } = createSmartNotes();
    smartNotes._smartNoteClientConstructor = FakeSmartNoteClient;
    await smartNotes.addCallsQueryResults([{ id: 'known', noted: false }]);
    await smartNotes.addRecentNotedCall('recent');
    FakeSmartNoteClient.querySmartNotes.mockResolvedValueOnce({
      records: [{ telephonySessionId: 'remote' }],
    });

    await smartNotes.queryNotedCalls(['known', 'recent', 'remote', 'plain']);

    expect(FakeSmartNoteClient.querySmartNotes).toHaveBeenCalledWith(
      expect.anything(),
      ['recent', 'remote', 'plain'],
    );
    expect(smartNotes.aiNotedCallMapping).toEqual({ recent: true, remote: true });
    await smartNotes.queryNotedCalls(['known', 'recent', 'remote', 'plain']);
    expect(FakeSmartNoteClient.querySmartNotes).toHaveBeenCalledTimes(1);

    FakeSmartNoteClient.querySmartNotes.mockRejectedValueOnce(new Error('query failed'));
    await smartNotes.queryNotedCalls(['error']);
    expect(smartNotes.logger.error).toHaveBeenCalledWith(
      'Failed to query SmartNotes calls',
      expect.any(Error),
    );
  });

  test('guards queries when initialization or permission is unavailable', async () => {
    const noPermission = createSmartNotes({
      appFeatures: { hasSmartNotePermission: false },
    }).smartNotes;
    await noPermission.queryNotedCalls(['one']);
    expect(global.fetch).not.toHaveBeenCalled();

    const unavailable = createSmartNotes().smartNotes;
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    await unavailable.queryNotedCalls(['one']);
    expect(FakeSmartNoteClient.querySmartNotes).not.toHaveBeenCalled();
  });

  test('fetches, normalizes, caches, and retries note text', async () => {
    const { smartNotes } = createSmartNotes();
    smartNotes._smartNoteClientConstructor = FakeSmartNoteClient;
    await smartNotes.addCallsQueryResults([{ id: 'noted', noted: true }]);
    FakeSmartNoteClient.getNotes
      .mockResolvedValueOnce({ status: 'InProgress', data: '' })
      .mockResolvedValueOnce({
        status: 'Completed',
        data: '<p>Hello <strong>World</strong></p><ul><li>One</li></ul>',
      });

    const text = await smartNotes.fetchSmartNoteText('noted');

    expect(sleep).toHaveBeenCalled();
    expect(text).toContain('Hello **World**');
    expect(text).toContain('One');
    expect(smartNotes.smartNoteTextMapping.noted).toBe(text);
    await expect(smartNotes.fetchSmartNoteText('noted')).resolves.toBe(text);
    expect(FakeSmartNoteClient.getNotes).toHaveBeenCalledTimes(2);
  });

  test('handles note text guard and failure branches', async () => {
    const { dependencies, smartNotes } = createSmartNotes();
    smartNotes._smartNoteClientConstructor = FakeSmartNoteClient;

    await expect(smartNotes.fetchSmartNoteText('')).resolves.toBeNull();
    dependencies.appFeatures.hasSmartNotePermission = false;
    await expect(smartNotes.fetchSmartNoteText('one')).resolves.toBeNull();
    dependencies.appFeatures.hasSmartNotePermission = true;
    await expect(smartNotes.fetchSmartNoteText('not-noted')).resolves.toBeNull();

    await smartNotes.addCallsQueryResults([{ id: 'error', noted: true }]);
    FakeSmartNoteClient.getNotes.mockRejectedValueOnce(new Error('note failed'));
    await expect(smartNotes.fetchSmartNoteText('error')).resolves.toBeNull();
    expect(smartNotes.logger.error).toHaveBeenCalledWith(
      'Failed to fetch SmartNotes text',
      expect.any(Error),
    );

    await smartNotes.addCallsQueryResults([{ id: 'retry-limit', noted: true }]);
    FakeSmartNoteClient.getNotes.mockResolvedValue({ status: 'InProgress' });
    await expect(smartNotes.fetchSmartNoteText('retry-limit')).resolves.toBe('');
    expect(FakeSmartNoteClient.getNotes).toHaveBeenCalledTimes(5);
  });

  test('fetches and caches transcripts and handles unavailable records', async () => {
    const { dependencies, smartNotes } = createSmartNotes();
    smartNotes._smartNoteClientConstructor = FakeSmartNoteClient;
    await smartNotes.addCallsQueryResults([{ id: 'noted', noted: true }]);
    FakeSmartNoteClient.getTranscripts.mockResolvedValueOnce({
      transcripts: [{ text: 'Hello' }],
    });

    const transcript = await smartNotes.fetchTranscript('noted');
    expect(transcript).toEqual({ transcripts: [{ text: 'Hello' }] });
    await expect(smartNotes.fetchTranscript('noted')).resolves.toBe(transcript);
    expect(FakeSmartNoteClient.getTranscripts).toHaveBeenCalledTimes(1);

    await expect(smartNotes.fetchTranscript('')).resolves.toBeNull();
    dependencies.appFeatures.hasSmartNotePermission = false;
    await expect(smartNotes.fetchTranscript('no-permission')).resolves.toBeNull();
    dependencies.appFeatures.hasSmartNotePermission = true;
    await expect(smartNotes.fetchTranscript('not-noted')).resolves.toBeNull();

    await smartNotes.addCallsQueryResults([{ id: 'error', noted: true }]);
    FakeSmartNoteClient.getTranscripts.mockRejectedValueOnce(new Error('transcript failed'));
    await expect(smartNotes.fetchTranscript('error')).resolves.toBeNull();
    expect(smartNotes.logger.error).toHaveBeenCalledWith(
      'Failed to fetch SmartNotes transcript',
      expect.any(Error),
    );
  });

  test('notifies save listeners, supports unsubscribe, and opens sessions for viewing', async () => {
    const { smartNotes } = createSmartNotes();
    smartNotes._smartNoteClientConstructor = FakeSmartNoteClient;
    const handler = jest.fn();
    const unsubscribe = smartNotes.onSmartNoteUpdate(handler);

    await smartNotes.onSmartNoteSave();
    await smartNotes.addSmartNoteTextStore('session-1', 'cached');
    smartNotes._setSessionState(createSession());
    await smartNotes.onSmartNoteSave();
    expect(handler).toHaveBeenCalledWith('session-1');
    expect(smartNotes.smartNoteTextMapping['session-1']).toBeUndefined();

    unsubscribe();
    await smartNotes.onSmartNoteSave();
    expect(handler).toHaveBeenCalledTimes(1);
    const otherHandler = jest.fn();
    const removeOther = smartNotes.onSmartNoteUpdate(otherHandler);
    smartNotes.onSmartNoteUpdate(jest.fn());
    removeOther();

    const viewSession = createSession({ id: 'view-session' });
    await smartNotes.viewSmartNote(viewSession, 'embedded');
    expect(smartNotes.session.id).toBe('view-session');
    expect(smartNotes.presentation).toBe('embedded');
  });

  test('stops all clients and clears runtime and state on reset', async () => {
    const { smartNotes } = createSmartNotes();
    smartNotes._smartNoteClientConstructor = FakeSmartNoteClient;
    await smartNotes.setSession(createSession());
    const client = smartNotes.smartNoteClient;
    await smartNotes.addRecentNotedCall('session-1');
    await smartNotes.addCallsQueryResults([{ id: 'session-1', noted: true }]);
    await smartNotes.addSmartNoteTextStore('session-1', 'note');
    await smartNotes.addTranscriptStore('session-1', { transcripts: [] });

    await smartNotes.onReset();

    expect(client.stop).toHaveBeenCalled();
    expect(client.removeAllListeners).toHaveBeenCalled();
    expect(smartNotes.session).toBeNull();
    expect(smartNotes.presentation).toBe('independent');
    expect(smartNotes.clientInitialized).toBe(false);
    expect(smartNotes.recentNotedCalls).toEqual([]);
    expect(smartNotes.callsQueryResults).toEqual([]);
    expect(smartNotes.smartNoteTextStore).toEqual([]);
    expect(smartNotes.transcriptStore).toEqual([]);
    expect(smartNotes.smartNoteMFERemoteEntry).toBe('');
  });
});
