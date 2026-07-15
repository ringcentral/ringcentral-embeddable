const { EventEmitter } = require('events');

const { setStagedState } = require('@ringcentral-integration/core/lib/usm-redux/utils');
const { dynamicLoad } = require('@ringcentral/mfe-react');

const { SmartNotes } = require('../../src/modules/SmartNotes');

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
    this.pause = jest.fn();
    this.removeAllListeners = jest.fn(() => {
      EventEmitter.prototype.removeAllListeners.call(this);
    });
    this.resume = jest.fn();
    this.start = jest.fn(async () => {});
    this.stop = jest.fn();
    this.updateTelephonySessionStatus = jest.fn();
    FakeSmartNoteClient.instances.push(this);
  }

  static reset() {
    FakeSmartNoteClient.instances = [];
    FakeSmartNoteClient.querySmartNotes = jest.fn(async () => ({
      records: [],
    }));
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

function flushPromises() {
  return Promise.resolve();
}

function createDeps(overrides = {}) {
  const webphoneHandlers = {
    callEnd: null,
    callResume: null,
    callStart: null,
  };
  return {
    alert: {
      alert: jest.fn(),
    },
    appFeatures: {
      hasSmartNotePermission: true,
    },
    auth: {
      ownerId: 'extension-owner-id',
    },
    client: {
      service: { name: 'sdk' },
    },
    contactMatcher: {
      dataMapping: {
        '+16505550123': [{
          id: 'contact-1',
          name: 'Matched Contact',
          phoneNumber: '+16505550123',
        }],
      },
    },
    storage: {
      ready: true,
    },
    tabManager: {
      interacting: true,
    },
    webphone: {
      onCallEnd: jest.fn((handler) => {
        webphoneHandlers.callEnd = handler;
      }),
      onCallResume: jest.fn((handler) => {
        webphoneHandlers.callResume = handler;
      }),
      onCallStart: jest.fn((handler) => {
        webphoneHandlers.callStart = handler;
      }),
    },
    webphoneHandlers,
    ...overrides,
  };
}

function createSmartNotes(deps = createDeps()) {
  const smartNotes = new SmartNotes(deps);
  smartNotes.parentModule = {
    analytics: {
      track: jest.fn(),
    },
  };
  return smartNotes;
}

function createWebphoneSession(overrides = {}) {
  return {
    direction: 'Outbound',
    from: '+16505550100',
    fromUserName: 'Agent',
    partyData: {
      sessionId: 'telephony-session-1',
    },
    startTime: Date.parse('2026-01-01T10:00:00.000Z'),
    to: '+16505550123',
    toUserName: 'Customer',
    ...overrides,
  };
}

describe('SmartNotes module methods', () => {
  beforeEach(() => {
    setStagedState({});
    jest.useFakeTimers();
    FakeSmartNoteClient.reset();
    dynamicLoad.mockReset();
    dynamicLoad.mockResolvedValue({
      default: {
        SmartNoteClient: FakeSmartNoteClient,
      },
    });
    global.fetch = jest.fn(async () => ({
      json: async () => ({
        smartNotesIframe: 'https://example.com/smart-notes.html',
        smartNotesMFE: 'https://example.com/remote-entry.js',
      }),
    }));
    global.DOMParser = class DOMParser {
      parseFromString(value) {
        return {
          body: {
            textContent: value.replace(/<[^>]+>/g, ''),
          },
        };
      }
    };
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    setStagedState(undefined);
    delete global.fetch;
    delete global.DOMParser;
    jest.restoreAllMocks();
  });

  it('initializes the MFE client and maps webphone sessions into smart note clients', async () => {
    const deps = createDeps();
    const smartNotes = createSmartNotes(deps);

    await smartNotes.onInit();

    expect(deps.webphone.onCallStart).toHaveBeenCalled();
    expect(deps.webphone.onCallResume).toHaveBeenCalled();
    expect(deps.webphone.onCallEnd).toHaveBeenCalled();
    expect(dynamicLoad).toHaveBeenCalledWith(
      '@ringcentral/smart-note-widget/src/bootstrap',
      'https://example.com/remote-entry.js',
    );
    expect(smartNotes.clientInitialized).toBe(true);
    expect(smartNotes.smartNoteMFERemoteEntry).toBe(
      'https://example.com/remote-entry.js',
    );

    deps.webphoneHandlers.callStart(createWebphoneSession());
    expect(smartNotes.session).toEqual(
      expect.objectContaining({
        id: 'telephony-session-1',
        phoneNumber: '+16505550123',
        contact: expect.objectContaining({
          name: 'Matched Contact',
        }),
      }),
    );
    expect(FakeSmartNoteClient.instances[0].options).toEqual(
      expect.objectContaining({
        extensionId: 'extension-owner-id',
        smartNoteIframeUri: 'https://example.com/smart-notes.html',
        telephonySessionId: 'telephony-session-1',
        telephonySessionStatus: 'Answered',
      }),
    );

    FakeSmartNoteClient.instances[0].emit('statusUpdate', 'ready');
    expect(smartNotes.parentModule.analytics.track).toHaveBeenCalledWith(
      'Start smart notes',
      undefined,
    );

    deps.webphoneHandlers.callEnd({
      direction: 'Outbound',
      partyData: { sessionId: 'telephony-session-1' },
    });
    expect(FakeSmartNoteClient.instances[0].removeAllListeners).toHaveBeenCalled();
    expect(smartNotes.session).toBeNull();
  });

  it('starts, pauses, resumes, closes, and disconnects smart note clients by session status', async () => {
    const smartNotes = createSmartNotes();
    smartNotes.SmartNoteClient = FakeSmartNoteClient;
    smartNotes._smartNoteIframeUri = 'iframe.html';
    smartNotes.setAutoStartSmartNote(true);

    smartNotes.setSession({
      id: 'session-1',
      status: 'Answered',
      phoneNumber: '+16505550123',
      contact: { name: 'Customer' },
      direction: 'Outbound',
      startTime: '2026-01-01T10:00:00.000Z',
    });
    jest.advanceTimersByTime(2000);
    await flushPromises();
    expect(FakeSmartNoteClient.instances[0].start).toHaveBeenCalled();

    FakeSmartNoteClient.instances[0].transcriptionStatus = 'recording';
    smartNotes.setSession({
      id: 'session-2',
      status: 'Answered',
      phoneNumber: '+16505550124',
      direction: 'Inbound',
      startTime: '2026-01-01T10:01:00.000Z',
    });
    expect(FakeSmartNoteClient.instances[0].pause).toHaveBeenCalled();

    FakeSmartNoteClient.instances[1].transcriptionStatus = 'paused';
    smartNotes._setSession({ id: 'session-1' });
    smartNotes.setSession({
      id: 'session-2',
      status: 'Answered',
      phoneNumber: '+16505550124',
      direction: 'Inbound',
      startTime: '2026-01-01T10:01:00.000Z',
    });
    expect(FakeSmartNoteClient.instances[1].resume).toHaveBeenCalled();

    FakeSmartNoteClient.instances[1].transcriptions = [{ text: 'a' }, { text: 'b' }];
    smartNotes.setSessionDisconnected({
      id: 'session-2',
      status: 'Disconnected',
      direction: 'Inbound',
    });
    expect(smartNotes.recentNotedCalls).toEqual(['session-2']);
    expect(FakeSmartNoteClient.instances[1].updateTelephonySessionStatus)
      .toHaveBeenCalledWith('Disconnected');

    smartNotes.setSession(null);
    expect(FakeSmartNoteClient.instances[1].stop).toHaveBeenCalled();
    expect(smartNotes.session).toBeNull();
  });

  it('queries noted calls and fetches cached note text and transcripts', async () => {
    const smartNotes = createSmartNotes();
    smartNotes.SmartNoteClient = FakeSmartNoteClient;
    smartNotes.addRecentNotedCall('recent-session');
    FakeSmartNoteClient.querySmartNotes.mockResolvedValueOnce({
      records: [{ telephonySessionId: 'noted-session' }],
    });

    await smartNotes.queryNotedCalls([
      'noted-session',
      'recent-session',
      'plain-session',
    ]);

    expect(smartNotes.aiNotedCallMapping).toEqual({
      'noted-session': true,
      'recent-session': true,
    });

    FakeSmartNoteClient.getNotes
      .mockResolvedValueOnce({ status: 'InProgress', data: '' })
      .mockResolvedValueOnce({
        status: 'Completed',
        data: '<p>Hello <strong>World</strong></p><ul><li>One</li></ul>',
      });
    const text = await smartNotes.fetchSmartNoteText('noted-session');
    expect(text).toContain('Hello **World**');
    expect(text).toContain('One');
    expect(smartNotes.smartNoteTextMapping['noted-session']).toBe(text);

    FakeSmartNoteClient.getTranscripts.mockResolvedValueOnce({
      transcripts: [{ text: 'hello' }],
    });
    const transcript = await smartNotes.fetchTranscript('noted-session');
    expect(transcript).toEqual({ transcripts: [{ text: 'hello' }] });
    expect(smartNotes.transcriptMapping['noted-session']).toEqual(transcript);

    await smartNotes.fetchSmartNoteText('noted-session');
    await smartNotes.fetchTranscript('noted-session');
    expect(FakeSmartNoteClient.getNotes).toHaveBeenCalledTimes(2);
    expect(FakeSmartNoteClient.getTranscripts).toHaveBeenCalledTimes(1);
  });

  it('maintains bounded stores, settings state, save callbacks, and reset state', () => {
    const smartNotes = createSmartNotes();
    smartNotes.SmartNoteClient = FakeSmartNoteClient;
    smartNotes.setShowSmartNote(true, true, 'managed');
    expect(smartNotes.showSmartNoteReadOnly).toBe(true);
    expect(smartNotes.showSmartNoteReadOnlyReason).toBe('managed');

    smartNotes.toggleAutoStartSmartNote();
    expect(smartNotes.autoStartSmartNote).toBe(true);
    smartNotes.setAutoStartSmartNote(false, true, 'policy');
    expect(smartNotes.autoStartSmartNote).toBe(false);
    expect(smartNotes.autoStartSmartNoteReadOnly).toBe(true);
    expect(smartNotes.autoStartSmartNoteReadOnlyReason).toBe('policy');

    for (let i = 0; i < 8; i += 1) {
      smartNotes.addRecentNotedCall(`recent-${i}`);
    }
    expect(smartNotes.recentNotedCalls).toHaveLength(5);
    expect(smartNotes.recentNotedCalls[0]).toBe('recent-7');

    const calls = Array.from({ length: 105 }, (_, index) => ({
      id: `call-${index}`,
      noted: index % 2 === 0,
    }));
    smartNotes.addCallsQueryResults(calls);
    expect(smartNotes.callsQueryResults).toHaveLength(100);

    for (let i = 0; i < 22; i += 1) {
      smartNotes.addSmartNoteTextStore(`note-${i}`, `text-${i}`);
      smartNotes.addTranscriptStore(`note-${i}`, { text: `transcript-${i}` });
    }
    expect(smartNotes.smartNoteTextStore).toHaveLength(20);
    expect(smartNotes.transcriptStore).toHaveLength(20);
    smartNotes.removeSmartNoteTextStore('note-21');
    expect(smartNotes.smartNoteTextMapping['note-21']).toBeUndefined();

    const updateHandler = jest.fn();
    smartNotes.onSmartNoteUpdate(updateHandler);
    smartNotes._setSession({ id: 'note-20' });
    smartNotes.onSmartNoteSave();
    expect(updateHandler).toHaveBeenCalledWith('note-20');
    expect(smartNotes.smartNoteTextMapping['note-20']).toBeUndefined();
    smartNotes._setSession(null);

    smartNotes.viewSmartNote({
      id: 'view-session',
      status: 'Answered',
      phoneNumber: '+16505550123',
      direction: 'Outbound',
      startTime: '2026-01-01T10:00:00.000Z',
    });
    expect(smartNotes.parentModule.analytics.track).toHaveBeenCalledWith(
      'View smart notes',
      undefined,
    );

    smartNotes.onReset();
    expect(smartNotes.callsQueryResults).toEqual([]);
    expect(smartNotes.smartNoteTextStore).toEqual([]);
    expect(smartNotes.session).toBeNull();
  });

  it('covers smart note guard, retry, disconnect, and fetch fallback branches', async () => {
    const noPermissionDeps = createDeps({
      appFeatures: {
        hasSmartNotePermission: false,
      },
    });
    const noPermissionNotes = createSmartNotes(noPermissionDeps);
    await noPermissionNotes.onInit();
    expect(global.fetch).not.toHaveBeenCalled();

    const initializedNotes = createSmartNotes();
    initializedNotes.setClientInitialized(true);
    await initializedNotes.onInit();
    expect(dynamicLoad).not.toHaveBeenCalled();

    global.fetch.mockResolvedValueOnce({
      json: async () => ({
        smartNotesIframe: 'iframe.html',
      }),
    });
    const missingRemoteNotes = createSmartNotes();
    await missingRemoteNotes.onInit();
    expect(missingRemoteNotes.clientInitialized).toBe(false);

    global.fetch.mockResolvedValueOnce({
      json: async () => ({
        smartNotesMFE: 'remote-entry.js',
      }),
    });
    dynamicLoad.mockRejectedValueOnce(new Error('load failed'));
    const failedLoadNotes = createSmartNotes();
    await failedLoadNotes.onInit();
    expect(failedLoadNotes.clientInitialized).toBe(false);

    const deps = createDeps();
    const smartNotes = createSmartNotes(deps);
    await smartNotes.onInit();
    deps.appFeatures.hasSmartNotePermission = false;
    deps.webphoneHandlers.callStart(createWebphoneSession());
    expect(smartNotes.session).toBeNull();
    deps.appFeatures.hasSmartNotePermission = true;
    Object.defineProperty(smartNotes, 'showSmartNote', {
      configurable: true,
      get: () => false,
    });
    deps.webphoneHandlers.callResume(createWebphoneSession());
    expect(smartNotes.session).toBeNull();
    deps.webphoneHandlers.callEnd(createWebphoneSession());
    expect(smartNotes.session).toBeNull();
    Object.defineProperty(smartNotes, 'showSmartNote', {
      configurable: true,
      get: () => true,
    });
    deps.webphoneHandlers.callEnd({
      direction: 'Outbound',
    });
    expect(smartNotes.session).toBeNull();

    smartNotes._setWebphoneSession({
      ...createWebphoneSession({
        direction: 'Inbound',
        from: '+16505550999',
        fromUserName: 'Inbound Caller',
        partyData: { sessionId: 'inbound-session' },
      }),
    });
    expect(smartNotes.session).toEqual(
      expect.objectContaining({
        contact: {
          name: 'Inbound Caller',
          phoneNumber: '+16505550999',
        },
        direction: 'Inbound',
        id: 'inbound-session',
      }),
    );
    smartNotes._setWebphoneSession({
      direction: 'Outbound',
    });
    expect(smartNotes.session.id).toBe('inbound-session');

    const retrySession = {
      id: 'retry-session',
      status: 'Answered',
      phoneNumber: '+16505550123',
      direction: 'Outbound',
      startTime: '2026-01-01T10:00:00.000Z',
    };
    smartNotes._smartNoteClientMap[retrySession.id] = new FakeSmartNoteClient({});
    smartNotes._smartNoteClientMap[retrySession.id].start
      .mockRejectedValueOnce(new Error('CC-102 not ready'));
    smartNotes._startSmartNote(retrySession);
    jest.advanceTimersByTime(2000);
    await flushPromises();
    expect(smartNotes._autoStartTimeout).toBeDefined();

    smartNotes._smartNoteClientMap[retrySession.id].start
      .mockRejectedValueOnce(new Error('manual start required'));
    smartNotes._startSmartNote(retrySession, true);
    jest.advanceTimersByTime(5000);
    await flushPromises();
    expect(deps.alert.alert).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'warning',
        message: 'showCustomAlertMessage',
      }),
    );

    const disconnectedNotes = createSmartNotes();
    disconnectedNotes.SmartNoteClient = FakeSmartNoteClient;
    expect(disconnectedNotes.smartNoteClient).toBeNull();
    disconnectedNotes.setSession(null);
    expect(disconnectedNotes.session).toBeNull();
    disconnectedNotes.setSession({
      id: 'current-idle',
      status: 'Answered',
      phoneNumber: '+16505550123',
      direction: 'Inbound',
      startTime: '2026-01-01T10:00:00.000Z',
    });
    expect(disconnectedNotes.smartNoteClient).toBeDefined();
    disconnectedNotes.setSession({
      id: 'current-idle',
      status: 'Disconnected',
      phoneNumber: '+16505550123',
      direction: 'Inbound',
      startTime: '2026-01-01T10:00:00.000Z',
    });
    expect(FakeSmartNoteClient.instances.at(-1).updateTelephonySessionStatus)
      .toHaveBeenCalledWith('Disconnected');
    disconnectedNotes.setSessionDisconnected({
      id: 'current-idle',
      status: 'Disconnected',
    });
    expect(FakeSmartNoteClient.instances.at(-1).removeAllListeners).not.toHaveBeenCalled();
    disconnectedNotes.setSessionDisconnected(null);
    disconnectedNotes.SmartNoteClient = null;
    disconnectedNotes.setSessionDisconnected({ id: 'current-idle' });
    disconnectedNotes.SmartNoteClient = FakeSmartNoteClient;
    disconnectedNotes.setSessionDisconnected({ id: 'missing-client' });

    disconnectedNotes._smartNoteClientMap['idle-other'] = new FakeSmartNoteClient({});
    disconnectedNotes._smartNoteClientMap['stopped-other'] = new FakeSmartNoteClient({});
    disconnectedNotes._smartNoteClientMap['active-other'] = new FakeSmartNoteClient({});
    disconnectedNotes._smartNoteClientMap['stopped-other'].transcriptionStatus = 'stopped';
    disconnectedNotes._smartNoteClientMap['active-other'].transcriptionStatus = 'recording';
    disconnectedNotes._clearOtherIdleSmartNoteClient('active-other');
    expect(disconnectedNotes._smartNoteClientMap['idle-other']).toBeUndefined();
    expect(disconnectedNotes._smartNoteClientMap['stopped-other']).toBeUndefined();
    expect(disconnectedNotes._smartNoteClientMap['active-other']).toBeDefined();

    const queryNotes = createSmartNotes();
    await expect(queryNotes.queryNotedCalls(['no-client'])).resolves.toBeUndefined();
    queryNotes.SmartNoteClient = FakeSmartNoteClient;
    queryNotes.addCallsQueryResults([{ id: 'known-call', noted: false }]);
    await expect(queryNotes.queryNotedCalls(['known-call'])).resolves.toBeUndefined();
    FakeSmartNoteClient.querySmartNotes.mockRejectedValueOnce(new Error('query failed'));
    await expect(queryNotes.queryNotedCalls(['query-error'])).resolves.toBeUndefined();

    await expect(queryNotes.fetchSmartNoteText()).resolves.toBeNull();
    await expect(queryNotes.fetchSmartNoteText('not-noted')).resolves.toBeNull();
    queryNotes.addCallsQueryResults([{ id: 'formatted-note', noted: true }]);
    FakeSmartNoteClient.getNotes.mockResolvedValueOnce({
      status: 'InProgress',
      data: '',
    }).mockResolvedValueOnce({
      status: 'InProgress',
      data: '',
    }).mockResolvedValueOnce({
      status: 'InProgress',
      data: '',
    }).mockResolvedValueOnce({
      status: 'InProgress',
      data: '',
    }).mockResolvedValueOnce({
      status: 'InProgress',
      data: '<p>Already</p>\n<ul>\n<li>Done</li>\n</ul>\n<ol>\n<li>One</li>\n</ol>\n',
    });
    await expect(queryNotes.fetchSmartNoteText('formatted-note')).resolves.toContain('Already');
    FakeSmartNoteClient.getNotes.mockRejectedValueOnce(new Error('note failed'));
    queryNotes.addCallsQueryResults([{ id: 'note-error', noted: true }]);
    await expect(queryNotes.fetchSmartNoteText('note-error')).resolves.toBeNull();

    await expect(queryNotes.fetchTranscript()).resolves.toBeNull();
    await expect(queryNotes.fetchTranscript('not-noted-transcript')).resolves.toBeNull();
    FakeSmartNoteClient.getTranscripts.mockRejectedValueOnce(new Error('transcript failed'));
    queryNotes.addCallsQueryResults([{ id: 'transcript-error', noted: true }]);
    await expect(queryNotes.fetchTranscript('transcript-error')).resolves.toBeNull();
    await expect(queryNotes.onSmartNoteSave()).resolves.toBeUndefined();
    queryNotes._setSession({ id: 'without-update-handler' });
    await expect(queryNotes.onSmartNoteSave()).resolves.toBeUndefined();
  });
});
