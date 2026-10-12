jest.mock(
  '@ringcentral-integration/micro-message/src/app/services/ConversationLogger/ConversationLogger',
  () => ({
    ConversationLogger: class ConversationLoggerBase {
      constructor(
        auth,
        storage,
        contactMatcher,
        conversationMatcher,
        dateTimeFormat,
        extensionInfo,
        messageStore,
        appFeatures,
        router,
        options,
        tabManager,
      ) {
        this._auth = auth;
        this._storage = storage;
        this._contactMatcher = contactMatcher;
        this._conversationMatcher = conversationMatcher;
        this._dateTimeFormat = dateTimeFormat;
        this._formatDateTime = (...args) =>
          dateTimeFormat.formatDateTime(...args);
        this._extensionInfo = extensionInfo;
        this._messageStore = messageStore;
        this._appFeatures = appFeatures;
        this._router = router;
        this._accordWithLogRequirement = options.accordWithLogRequirement;
        this._tabManager = tabManager;
        this._autoLog = false;
        this._lastAutoLog = null;
        this._lastProcessedConversations = null;
        storage.enable(this);
      }

      get autoLog() {
        return this._autoLog;
      }

      get conversationLogMap() {
        return {};
      }

      _setAutoLog(value) {
        this._autoLog = value;
      }

      _getCorrespondentMatches() {
        return [];
      }

      getLastMatchedCorrespondentEntity() {
        return null;
      }

      accordWithProcessLogRequirement(conversation) {
        return this._accordWithLogRequirement(conversation);
      }

      _queueAutoLogConversation() {}

      log() {}

      async logConversation() {}

      onReset() {}
    },
  }),
);

import { ConversationLogger } from '../../src/app/services/ConversationLogger';

function createMessage(overrides = {}) {
  return {
    id: 'message-id',
    conversationId: 'conversation-id',
    creationTime: Date.now(),
    direction: 'Outbound',
    messageType: 'message',
    type: 'SMS',
    ...overrides,
  };
}

function createLogger({ autoLog = false, readOnlyValue = null } = {}) {
  const messageThread = {
    data: { messages: {}, threads: {} },
    getThread: jest.fn(),
    getThreadMessages: jest.fn(() => []),
    threadConversationsInfo: { conversations: [] },
  };
  const contactMatcher = {
    addQuerySource: jest.fn(),
    dataMapping: {},
    match: jest.fn(async () => {}),
    triggerMatch: jest.fn(),
  };
  const conversationMatcher = {
    addQuerySource: jest.fn(),
    dataMapping: {},
    match: jest.fn(async () => {}),
    triggerMatch: jest.fn(),
  };
  const messageStore = {
    conversationStore: {},
    onMessageUpdated: jest.fn(),
  };
  const smsTypingTimeTracker = {
    getTypingTime: jest.fn(),
    typingTimeMap: {},
  };
  const thirdParty = {
    messageLoggerAutoSettingReadOnly: readOnlyValue !== null,
    messageLoggerAutoSettingReadOnlyReason: 'Managed by an administrator',
    messageLoggerAutoSettingReadOnlyValue: readOnlyValue,
    messageLoggerRegistered: true,
    messageLoggerTitle: 'Log to CRM',
  };
  const storage = { enable: jest.fn() };
  const logger = new ConversationLogger(
    { ownerId: 'owner-id' },
    storage,
    contactMatcher,
    conversationMatcher,
    { formatDateTime: jest.fn(() => '2026-09-07') },
    { extensionNumber: '101' },
    messageStore,
    { hasReadTextPermission: true },
    {},
    {
      autoLog,
      accordWithLogRequirement: jest.fn(() => true),
      isLoggedContact: jest.fn(() => false),
      logFunction: jest.fn(async () => {}),
      readyCheckFunction: jest.fn(() => true),
    },
    { get: jest.fn(() => messageThread) },
    smsTypingTimeTracker,
    thirdParty,
  );
  return {
    contactMatcher,
    conversationMatcher,
    logger,
    messageStore,
    messageThread,
    smsTypingTimeTracker,
    storage,
    thirdParty,
  };
}

describe('ConversationLogger compatibility', () => {
  test('applies the configured default and enforced read-only value', () => {
    const { logger, storage } = createLogger({
      autoLog: true,
      readOnlyValue: false,
    });

    expect(logger.autoLog).toBe(true);
    expect(logger.loggerSourceReady).toBe(true);
    expect(logger.logButtonTitle).toBe('Log to CRM');
    expect(logger.autoLogReadOnlyReason).toBe('Managed by an administrator');
    expect(storage.enable).toHaveBeenLastCalledWith(logger, {
      migrations: [['_autoLog', 'ConversationLogger-_autoLog']],
    });
    logger.onInit();
    expect(logger.autoLog).toBe(false);
  });

  test('adds shared threads and typing duration to the log map', () => {
    const { conversationMatcher, logger, messageThread, smsTypingTimeTracker } =
      createLogger();
    const threadMessage = createMessage({
      conversationId: 'thread-id',
      id: 'thread-message-id',
    });
    messageThread.threadConversationsInfo.conversations = [
      {
        conversationId: 'thread-id',
        correspondents: [{ phoneNumber: '+16505550100' }],
        creationTime: Date.now(),
        self: { phoneNumber: '+16505550101' },
      },
    ];
    messageThread.getThread.mockReturnValue({
      threadInfo: {
        creationTime: '2026-09-07T00:00:00.000Z',
        lastModifiedTime: '2026-09-07T01:00:00.000Z',
        status: 'Open',
      },
    });
    messageThread.getThreadMessages.mockReturnValue([threadMessage]);
    conversationMatcher.dataMapping['thread-id'] = [{ id: 'activity-id' }];
    smsTypingTimeTracker.getTypingTime.mockReturnValue(1_250);

    const conversation = logger.conversationLogMap['thread-id']['2026-09-07'];

    expect(conversation).toMatchObject({
      conversationId: 'thread-id',
      conversationLogId: 'thread-id',
      status: 'Open',
      type: 'Thread',
      conversationLogMatches: [{ id: 'activity-id' }],
    });
    expect(conversation.messages[0]).toMatchObject({
      id: 'thread-message-id',
      typingDurationMs: 1_250,
    });
  });

  test('auto-creates voicemail and fax logs with the auto trigger type', async () => {
    const { logger } = createLogger({ autoLog: true });
    logger.log = jest.fn(async () => {});
    const conversation = {
      conversationId: 'fax-conversation',
      conversationLogId: 'fax-log',
      conversationLogMatches: [],
      correspondents: [{ phoneNumber: '+16505550100' }],
      creationTime: Date.now(),
      date: '2026-09-07',
      messages: [createMessage({ type: 'Fax' })],
      type: 'Fax',
    };

    await logger._processConversationLog({ conversation });

    expect(logger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        conversation,
        triggerType: 'auto',
      }),
    );
  });

});
