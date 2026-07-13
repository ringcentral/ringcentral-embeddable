const { setStagedState } = require('@ringcentral-integration/core/lib/usm-redux/utils');
const messageTypes = require('@ringcentral-integration/commons/enums/messageTypes').default;

jest.mock('@ringcentral-integration/commons/modules/ConversationLogger', () => ({
  ConversationLogger: class BaseConversationLogger {
    constructor(deps) {
      this._deps = deps;
      this._autoLog = false;
      this._isAutoUpdate = true;
      this._lastAutoLog = false;
      this.ready = true;
      this.accordWithProcessLogRequirement = jest.fn(() => true);
      this.getConversationLogId = jest.fn((message) => message.conversationLogId || message.conversationId);
      this.getLastMatchedCorrespondentEntity = jest.fn(() => null);
      this._formatDateTime = jest.fn(({ utcTimestamp }) => (
        typeof utcTimestamp === 'string'
          ? utcTimestamp.slice(0, 10)
          : '2026-01-01'
      ));
      this._getCorrespondentMatches = jest.fn(() => [{ id: 'correspondent-entity' }]);
      this._log = jest.fn(async () => {});
      this._queueAutoLogConversation = jest.fn();
      this._setAutoLog = jest.fn((autoLog) => {
        this._autoLog = autoLog;
      });
    }

    get autoLog() {
      return this._autoLog;
    }

    async logConversation(options) {
      return {
        options,
      };
    }

    async onInit() {
      this.superOnInitCalled = true;
    }
  },
}));

const { ConversationLogger } = require('../../src/modules/ConversationLogger');

function createMessage(overrides = {}) {
  return {
    conversationId: 'conversation-1',
    conversationLogId: 'conversation-log-1',
    creationTime: '2026-01-01T10:00:00.000Z',
    direction: 'Inbound',
    from: {
      phoneNumber: '+16505550123',
    },
    id: 'message-1',
    to: [{
      phoneNumber: '+16505550100',
    }],
    type: messageTypes.sms,
    ...overrides,
  };
}

function createThread(overrides = {}) {
  return {
    assignee: {
      extensionId: '101',
    },
    creationTime: '2026-01-01T09:00:00.000Z',
    guestParty: {
      phoneNumber: '+16505550124',
    },
    id: 'thread-1',
    isAssignedToMe: true,
    label: 'Support',
    lastModifiedTime: 2000,
    messages: [{
      id: 'thread-message-1',
      lastModifiedTime: 2000,
      recordType: 'AliveMessage',
      text: 'Thread message',
    }, {
      id: 'thread-note-1',
      lastModifiedTime: 3000,
      recordType: 'Note',
      text: 'Thread note',
    }],
    owner: {
      extensionId: '101',
    },
    ownerParty: {
      phoneNumber: '+16505550100',
    },
    status: 'Open',
    statusReason: null,
    ...overrides,
  };
}

function createDeps(overrides = {}) {
  let entityUpdatedHandler = null;
  let threadUpdatedHandler = null;
  return {
    contactMatcher: {
      dataMapping: {
        '+16505550100': [{ id: 'self-entity' }],
        '+16505550123': [{ id: 'correspondent-entity' }],
      },
      match: jest.fn(async () => {}),
      triggerMatch: jest.fn(),
    },
    conversationLoggerOptions: {
      autoLog: true,
    },
    conversationMatcher: {
      dataMapping: {
        'conversation-log-1': [{ id: 'log-1' }],
      },
      match: jest.fn(async () => {}),
      triggerMatch: jest.fn(),
    },
    extensionInfo: {
      extensionNumber: '101',
    },
    messageStore: {
      conversationStore: {
        'conversation-1': [
          createMessage({
            creationTime: '2026-01-01T10:00:00.000Z',
            id: 'message-1',
          }),
          createMessage({
            creationTime: '2026-01-01T11:00:00.000Z',
            id: 'message-2',
          }),
        ],
      },
    },
    messageThreadEntries: {
      onEntityUpdated: jest.fn((handler) => {
        entityUpdatedHandler = handler;
      }),
    },
    messageThreads: {
      onThreadUpdated: jest.fn((handler) => {
        threadUpdatedHandler = handler;
      }),
      threads: [createThread()],
    },
    smsTypingTimeTracker: {
      getTypingTime: jest.fn((messageId) => (
        messageId === 'message-1' || messageId === 'thread-message-1'
          ? 1500
          : undefined
      )),
    },
    tabManager: {
      active: true,
    },
    thirdPartyService: {
      logConversation: jest.fn(async () => {}),
      messageLoggerAutoSettingReadOnly: true,
      messageLoggerAutoSettingReadOnlyReason: 'Managed by admin',
      messageLoggerAutoSettingReadOnlyValue: false,
      messageLoggerRegistered: true,
      messageLoggerTitle: 'Log message',
    },
    get entityUpdatedHandler() {
      return entityUpdatedHandler;
    },
    get threadUpdatedHandler() {
      return threadUpdatedHandler;
    },
    ...overrides,
  };
}

describe('ConversationLogger', () => {
  beforeEach(() => {
    setStagedState({});
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    setStagedState(undefined);
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('initializes auto-log settings, registrations, service getters, and delayed refresh handlers', async () => {
    const deps = createDeps();
    const logger = new ConversationLogger(deps);

    expect(logger.autoLog).toBe(true);
    expect(deps.messageThreadEntries.onEntityUpdated).toHaveBeenCalledWith(expect.any(Function));
    expect(deps.messageThreads.onThreadUpdated).toHaveBeenCalledWith(expect.any(Function));
    expect(logger.logButtonTitle).toBe('Log message');
    expect(logger.loggerSourceReady).toBe(true);
    expect(logger.autoLogReadOnly).toBe(true);
    expect(logger.autoLogReadOnlyReason).toBe('Managed by admin');
    await logger._doLog({ id: 'conversation-1' });
    expect(deps.thirdPartyService.logConversation).toHaveBeenCalledWith({ id: 'conversation-1' });

    logger._processConversationLogMap = jest.fn();
    deps.entityUpdatedHandler({ id: 'message-1' });
    deps.threadUpdatedHandler({ id: 'thread-1' });
    jest.advanceTimersByTime(1999);
    expect(logger._processConversationLogMap).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(logger._processConversationLogMap).toHaveBeenCalledTimes(1);

    await logger.onInit();
    expect(logger.superOnInitCalled).toBe(true);
    expect(logger._setAutoLog).toHaveBeenCalledWith(false);
  });

  it('builds conversation log maps for messages and threads with typing durations and unique numbers', () => {
    const deps = createDeps();
    const logger = new ConversationLogger(deps);
    const map = logger.conversationLogMap;

    expect(map['conversation-1']['2026-01-01']).toMatchObject({
      conversationId: 'conversation-1',
      conversationLogId: 'conversation-log-1',
      conversationLogMatches: [{ id: 'log-1' }],
      type: messageTypes.sms,
    });
    expect(map['conversation-1']['2026-01-01'].messages).toEqual([
      expect.objectContaining({
        id: 'message-2',
      }),
      expect.objectContaining({
        id: 'message-1',
        typingDurationMs: 1500,
      }),
    ]);
    expect(map['thread-1']['2026-01-01']).toMatchObject({
      conversationId: 'thread-1',
      conversationLogId: 'thread-1',
      entities: [
        expect.objectContaining({
          id: 'thread-message-1',
          typingDurationMs: 1500,
        }),
        expect.objectContaining({
          id: 'thread-note-1',
        }),
      ],
      messages: [
        expect.objectContaining({
          id: 'thread-message-1',
        }),
      ],
      self: { phoneNumber: '+16505550100' },
      status: 'Open',
      type: 'Thread',
    });
    expect(logger.uniqueNumbers).toEqual([
      '+16505550100',
      '+16505550123',
      '+16505550124',
    ]);
    expect(logger.getMessageThreadLogId(createThread({ id: 'thread-2' }))).toBe('thread-2');
    expect(logger.getMessageThreadLogId()).toBeUndefined();
  });

  it('queues auto logging only for changed conversations and logs update/new-entry paths', async () => {
    const deps = createDeps();
    const logger = new ConversationLogger(deps);
    const conversation = logger.conversationLogMap['conversation-1']['2026-01-01'];

    Object.defineProperty(logger, 'conversationLogMap', {
      configurable: true,
      get: jest.fn(() => ({
        'conversation-1': {
          '2026-01-01': conversation,
        },
      })),
    });
    logger._lastProcessedConversations = null;
    logger._processConversationLogMap();
    expect(deps.conversationMatcher.triggerMatch).toHaveBeenCalled();
    expect(deps.contactMatcher.triggerMatch).toHaveBeenCalled();
    expect(logger._queueAutoLogConversation).toHaveBeenCalledWith({
      conversation,
    });

    logger._queueAutoLogConversation.mockClear();
    logger._lastProcessedConversations = {
      'conversation-1': {
        '2026-01-01': conversation,
      },
    };
    logger._processConversationLogMap();
    expect(logger._queueAutoLogConversation).not.toHaveBeenCalled();

    await logger._processConversationLog({
      conversation,
    });
    expect(deps.conversationMatcher.match).toHaveBeenCalledWith({
      queries: ['conversation-log-1'],
    });
    expect(logger._log).toHaveBeenCalledWith({
      correspondentEntity: null,
      item: conversation,
      selfEntity: null,
      triggerType: 'auto',
    });

    deps.conversationMatcher.dataMapping = {};
    logger._isAutoUpdate = false;
    logger._autoLog = true;
    await logger._processConversationLog({
      conversation,
    });
    expect(deps.contactMatcher.match).toHaveBeenCalledWith({
      queries: ['+16505550100', '+16505550123'],
    });
    expect(logger._log).toHaveBeenLastCalledWith({
      correspondentEntity: { id: 'correspondent-entity' },
      item: conversation,
      selfEntity: { id: 'self-entity' },
      triggerType: 'auto',
    });
  });

  it('applies default trigger types and validates explicit log calls', async () => {
    const logger = new ConversationLogger(createDeps());
    const conversation = logger.conversationLogMap['conversation-1']['2026-01-01'];

    await expect(logger.logConversation({
      conversation,
    })).resolves.toEqual({
      options: {
        conversation,
        triggerType: 'auto',
      },
    });
    await logger.log({
      conversation,
      triggerType: 'manual',
    });
    expect(logger._log).toHaveBeenCalledWith({
      item: conversation,
      triggerType: 'manual',
    });

    logger.ready = false;
    await expect(logger.log({ conversation })).rejects.toThrow(
      'ConversationLogger.log: module is not ready.',
    );
    logger.ready = true;
    await expect(logger.log({})).rejects.toThrow(
      'ConversationLogger.log: options.conversation is undefined.',
    );
  });
});
