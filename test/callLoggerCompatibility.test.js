const {
  EmbeddableCallLogger,
} = require("../src/app/services/CallLogger/CallLogger");

describe("EmbeddableCallLogger compatibility APIs", () => {
  const now = 1_700_000_000_000;

  beforeEach(() => {
    jest.spyOn(Date, "now").mockReturnValue(now);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function createCall(overrides = {}) {
    return {
      id: "call-id",
      action: "Phone Call",
      sessionId: "session-id",
      telephonySessionId: "telephony-session-id",
      startTime: now - 60_000,
      duration: 10,
      from: {
        extensionId: "from-extension",
        name: "From",
        phoneNumber: "+16505550100",
      },
      to: {
        extensionId: "to-extension",
        name: "To",
        phoneNumber: "+16505550101",
      },
      recording: {
        uri: "https://platform.example.com/recording",
        contentUri: "https://platform.example.com/content?token=old",
      },
      ...overrides,
    };
  }

  function createLogger({
    calls,
    dataMapping = {},
    hasPermission = true,
    thirdParty: thirdPartyOverrides = {},
  }) {
    const storage = { enable: jest.fn() };
    const callHistory = { calls };
    const callMonitor = {};
    const callLoggerOptions = {
      logFunction: jest.fn(),
      readyCheckFunction: jest.fn(() => true),
    };
    const thirdParty = {
      callLoggerAutoLogOnCallSync: false,
      callLoggerAutoSettingReadOnly: false,
      callLoggerAutoSettingReadOnlyReason: "",
      callLoggerAutoSettingReadOnlyValue: null,
      callLoggerHideEditLogButton: false,
      callLoggerTitle: null,
      getRecordingLink: jest.fn(() => "https://host.example.com/recording"),
      getRecordingContentUri: jest.fn(
        () => "https://platform.example.com/content"
      ),
      showLogModal: false,
      ...thirdPartyOverrides,
    };
    const smartNotes = {
      hasPermission,
      queryNotedCalls: jest.fn(async () => {}),
      fetchSmartNoteText: jest.fn(async () => "AI note"),
      fetchTranscript: jest.fn(async () => ({
        context: {
          participants: [
            {
              participantId: "from",
              extensionId: "from-extension",
              name: "Fallback from",
            },
            {
              participantId: "to",
              extensionId: "to-extension",
              name: "Fallback to",
            },
          ],
        },
        transcripts: [
          { participantId: "from", text: "Hello" },
          { participantId: "to", text: "Hi" },
        ],
      })),
    };
    const activityMatcher = {
      dataMapping,
      triggerMatch: jest.fn(async () => {}),
    };
    const logger = new EmbeddableCallLogger(
      storage,
      callHistory,
      callMonitor,
      callLoggerOptions,
      thirdParty,
      smartNotes,
      activityMatcher
    );
    logger.autoLog = callLoggerOptions.autoLog ?? true;
    logger._setAutoLog = jest.fn((autoLog) => {
      logger.autoLog = autoLog;
    });
    return { logger, activityMatcher, smartNotes, thirdParty };
  }

  test("does not block logger readiness on optional Smart Notes", () => {
    const { logger, smartNotes } = createLogger({
      calls: [],
      hasPermission: false,
    });

    expect(logger.ignoredModules).toContain(smartNotes);
  });

  test("filters, paginates, and enriches recent unlogged calls", async () => {
    const eligible = createCall();
    const statusOnly = createCall({
      id: "status-only",
      sessionId: "status-session",
      telephonySessionId: "status-telephony",
      recording: undefined,
    });
    const logged = createCall({
      id: "logged",
      sessionId: "logged-session",
      telephonySessionId: "logged-telephony",
    });
    const tooRecent = createCall({
      id: "recent",
      sessionId: "recent-session",
      telephonySessionId: "recent-telephony",
      startTime: now - 10_000,
      duration: 5,
    });
    const noAction = createCall({
      id: "no-action",
      sessionId: "no-action-session",
      action: undefined,
    });
    const { logger, activityMatcher, smartNotes, thirdParty } = createLogger({
      calls: [eligible, statusOnly, logged, tooRecent, noAction],
      dataMapping: {
        "status-session": [{ type: "status" }],
        "logged-session": [{ type: "contact" }],
      },
    });

    const result = await logger.getRecentUnloggedCalls({
      perPage: 1,
      page: 1,
    });

    expect(activityMatcher.triggerMatch).toHaveBeenCalledTimes(1);
    expect(smartNotes.queryNotedCalls).toHaveBeenCalledWith([
      "telephony-session-id",
    ]);
    expect(result.hasMore).toBe(true);
    expect(result.calls).toEqual([
      expect.objectContaining({
        id: "call-id",
        aiNote: "AI note",
        transcript: "From: Hello\nTo: Hi",
        recording: expect.objectContaining({
          link: "https://host.example.com/recording",
          contentUri: "https://platform.example.com/content",
        }),
      }),
    ]);
    expect(thirdParty.getRecordingLink).toHaveBeenCalledWith(
      eligible.recording
    );
  });

  test("finds a call by telephony session ID and includes activity matches", async () => {
    const call = createCall({ recording: undefined });
    const activityMatches = [{ type: "status" }];
    const { logger } = createLogger({
      calls: [call],
      dataMapping: { "session-id": activityMatches },
      hasPermission: false,
    });

    await expect(
      logger.getCall(undefined, "telephony-session-id")
    ).resolves.toEqual(
      expect.objectContaining({
        sessionId: "session-id",
        activityMatches,
        aiNote: null,
        recording: null,
        transcript: null,
      })
    );
  });

  test("returns null when no call matches either identifier", async () => {
    const { logger } = createLogger({ calls: [] });

    await expect(logger.getCall("missing", "missing")).resolves.toBeNull();
  });

  test("applies and exposes the third-party auto-log policy", () => {
    const { logger } = createLogger({
      calls: [],
      thirdParty: {
        callLoggerAutoLogOnCallSync: true,
        callLoggerAutoSettingReadOnly: true,
        callLoggerAutoSettingReadOnlyReason: "Managed by an administrator",
        callLoggerAutoSettingReadOnlyValue: false,
        callLoggerHideEditLogButton: true,
        callLoggerTitle: "Log to CRM",
        showLogModal: true,
      },
    });

    logger.onInit();

    expect(logger.autoLog).toBe(false);
    expect(logger.autoLogReadOnly).toBe(true);
    expect(logger.autoLogReadOnlyReason).toBe("Managed by an administrator");
    expect(logger.autoLogOnCallSync).toBe(true);
    expect(logger.hideEditLogButton).toBe(true);
    expect(logger.logButtonTitle).toBe("Log to CRM");
    expect(logger.showLogModal).toBe(true);
  });
});
