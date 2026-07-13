const { setStagedState } = require('@ringcentral-integration/core/lib/usm-redux/utils');
const { callLoggerTriggerTypes } = require('@ringcentral-integration/commons/enums/callLoggerTriggerTypes');

jest.mock('@ringcentral-integration/commons/modules/CallLogger', () => ({
  CallLogger: class BaseCallLogger {
    constructor(deps) {
      this._deps = deps;
      this._autoLog = false;
      this.autoLog = false;
      this.logOnRinging = false;
      this.loggingMap = {};
      this.ready = true;
      this._onCallUpdated = jest.fn();
      this._setAutoLog = jest.fn((value) => {
        this._autoLog = value;
      });
    }

    async _ensureActive() {
      return true;
    }

    async onInit() {}

    onInitOnce() {}
  },
}));

const { CallLogger } = require('../../src/modules/CallLogger');

function createCall(overrides = {}) {
  return {
    action: 'Phone Call',
    duration: 60,
    from: {
      extensionId: '101',
      name: 'Agent',
    },
    recording: null,
    result: 'Accepted',
    sessionId: 'session-1',
    startTime: Date.now() - 60000,
    telephonySessionId: 'telephony-1',
    to: {
      phoneNumber: '+16505550123',
    },
    ...overrides,
  };
}

function createDeps(overrides = {}) {
  return {
    activityMatcher: {
      dataMapping: {},
      triggerMatch: jest.fn(async () => {}),
    },
    callHistory: {
      calls: [
        createCall({
          sessionId: 'session-1',
          telephonySessionId: 'telephony-1',
        }),
      ],
    },
    callLog: {
      calls: [],
    },
    callMonitor: {
      calls: [
        createCall({
          sessionId: 'active-session',
          telephonySessionId: 'active-telephony',
        }),
      ],
    },
    smartNotes: {
      fetchSmartNoteText: jest.fn(async (telephonySessionId) => `note-${telephonySessionId}`),
      fetchTranscript: jest.fn(async () => ({
        context: {
          participants: [],
        },
        transcripts: [],
      })),
      hasPermission: true,
      onSmartNoteUpdate: jest.fn(),
      queryNotedCalls: jest.fn(async () => {}),
    },
    thirdPartyService: {
      callLoggerAutoLogOnCallSync: true,
      callLoggerAutoSettingReadOnly: true,
      callLoggerAutoSettingReadOnlyReason: 'Managed by admin',
      callLoggerAutoSettingReadOnlyValue: true,
      callLoggerHideEditLogButton: true,
      callLoggerRegistered: true,
      callLoggerTitle: 'Log to CRM',
      getRecordingContentUri: jest.fn((recording) => `${recording.contentUri}?download=1`),
      getRecordingLink: jest.fn((recording) => `${recording.contentUri}?view=1`),
      logCall: jest.fn(async () => {}),
      showLogModal: true,
    },
    ...overrides,
  };
}

function createModule(deps = createDeps()) {
  return new CallLogger(deps);
}

describe('CallLogger module', () => {
  beforeEach(() => {
    setStagedState({});
    jest.spyOn(Date, 'now').mockReturnValue(100000);
  });

  afterEach(() => {
    setStagedState(undefined);
    jest.restoreAllMocks();
  });

  it('delegates logging and decides whether changed calls should be logged', async () => {
    const deps = createDeps();
    const logger = createModule(deps);
    const call = createCall({
      sessionId: 'matched-call',
      startTime: 10000,
    });

    await logger._doLog({
      item: call,
      redirect: true,
    });
    expect(deps.thirdPartyService.logCall).toHaveBeenCalledWith({
      call,
      redirect: true,
    });

    logger.autoLog = true;
    await expect(logger._shouldLogUpdatedCall(call)).resolves.toBe(true);

    logger.autoLog = false;
    deps.activityMatcher.dataMapping['matched-call'] = [{ id: 'activity-1' }];
    await expect(logger._shouldLogUpdatedCall(call)).resolves.toBe(true);
    expect(deps.activityMatcher.triggerMatch).toHaveBeenCalled();

    deps.activityMatcher.dataMapping['matched-call'] = [];
    logger.loggingMap['matched-call'] = true;
    await expect(logger._shouldLogUpdatedCall(call)).resolves.toBe(true);

    logger.loggingMap = {};
    jest.spyOn(logger, '_ensureActive').mockResolvedValueOnce(false);
    await expect(logger._shouldLogUpdatedCall(call)).resolves.toBe(false);
  });

  it('maps active and history calls, initializes read-only auto-log, and exposes service flags', async () => {
    const deps = createDeps();
    const logger = createModule(deps);

    expect(logger.allCallMapping).toMatchObject({
      'active-session': expect.objectContaining({ sessionId: 'active-session' }),
      'session-1': expect.objectContaining({ sessionId: 'session-1' }),
    });

    await logger.onInit();
    expect(logger._setAutoLog).toHaveBeenCalledWith(true);
    expect(logger.logButtonTitle).toBe('Log to CRM');
    expect(logger.showLogModal).toBe(true);
    expect(logger.autoLogReadOnly).toBe(true);
    expect(logger.autoLogReadOnlyReason).toBe('Managed by admin');
    expect(logger.autoLogOnCallSync).toBe(true);
    expect(logger.hideEditLogButton).toBe(true);
  });

  it('returns recent unlogged calls with recording links, smart notes, transcripts, and pagination', async () => {
    const recentCall = createCall({
      sessionId: 'recent-call',
      startTime: Date.now() - 5000,
      telephonySessionId: 'recent-telephony',
    });
    const matchedCall = createCall({
      sessionId: 'matched-call',
      startTime: Date.now() - 60000,
      telephonySessionId: 'matched-telephony',
    });
    const statusOnlyCall = createCall({
      activityMatches: [{ type: 'status' }],
      duration: 10,
      recording: {
        contentUri: 'https://recording.example.com/1',
      },
      sessionId: 'status-call',
      startTime: 0,
      telephonySessionId: 'status-telephony',
    });
    const deps = createDeps({
      activityMatcher: {
        dataMapping: {
          'matched-call': [{ type: 'log' }],
          'status-call': [{ type: 'status' }],
        },
        triggerMatch: jest.fn(async () => {}),
      },
      callHistory: {
        calls: [
          createCall({
            action: null,
            sessionId: 'synthetic-call',
            telephonySessionId: 'synthetic-telephony',
          }),
          recentCall,
          matchedCall,
          statusOnlyCall,
        ],
      },
    });
    const logger = createModule(deps);

    await expect(logger.getRecentUnloggedCalls({
      page: 1,
      perPage: 1,
    })).resolves.toEqual({
      calls: [expect.objectContaining({
        aiNote: 'note-status-telephony',
        recording: {
          contentUri: 'https://recording.example.com/1?download=1',
          link: 'https://recording.example.com/1?view=1',
        },
        sessionId: 'status-call',
        transcript: '',
      })],
      hasMore: false,
    });
    expect(deps.smartNotes.queryNotedCalls).toHaveBeenCalledWith(['status-telephony']);
    expect(deps.smartNotes.fetchSmartNoteText).toHaveBeenCalledWith('status-telephony');
    expect(deps.thirdPartyService.getRecordingLink).toHaveBeenCalledWith(statusOnlyCall.recording);
    expect(deps.thirdPartyService.getRecordingContentUri).toHaveBeenCalledWith(statusOnlyCall.recording);
  });

  it('returns enriched call details and handles missing calls or smart-note updates', async () => {
    const deps = createDeps({
      activityMatcher: {
        dataMapping: {
          'session-1': [{ id: 'activity-1' }],
        },
        triggerMatch: jest.fn(async () => {}),
      },
      callHistory: {
        calls: [
          createCall({
            recording: {
              contentUri: 'https://recording.example.com/2',
            },
          }),
        ],
      },
    });
    const logger = createModule(deps);

    await expect(logger.getCall('missing', 'missing-telephony')).resolves.toBeNull();
    await expect(logger.getCall('session-1', 'telephony-1')).resolves.toEqual(
      expect.objectContaining({
        activityMatches: [{ id: 'activity-1' }],
        aiNote: 'note-telephony-1',
        recording: {
          contentUri: 'https://recording.example.com/2?download=1',
          link: 'https://recording.example.com/2?view=1',
        },
        transcript: '',
      }),
    );

    logger.ready = false;
    logger.onCallNoteUpdated('telephony-1');
    expect(logger._onCallUpdated).not.toHaveBeenCalled();
    logger.ready = true;
    logger.onCallNoteUpdated('missing-telephony');
    expect(logger._onCallUpdated).not.toHaveBeenCalled();
    logger.onCallNoteUpdated('telephony-1');
    expect(logger._onCallUpdated).toHaveBeenCalledWith(
      deps.callHistory.calls[0],
      callLoggerTriggerTypes.callLogSync,
    );
    expect(deps.smartNotes.onSmartNoteUpdate).toHaveBeenCalledWith(logger.onCallNoteUpdated);
  });
});
