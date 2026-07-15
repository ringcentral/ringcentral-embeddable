const { setStagedState } = require('@ringcentral-integration/core/lib/usm-redux/utils');

jest.mock('@ringcentral-integration/widgets/modules/ConversationUI', () => ({
  ConversationUI: class BaseConversationUI {
    constructor(deps) {
      this._deps = deps;
    }

    getUIProps() {
      return {
        baseProp: true,
      };
    }

    getUIFunctions() {
      return {
        baseFunction: jest.fn(),
      };
    }
  },
}));

const { ConversationUI } = require('../../src/modules/ConversationUI');

function createConversation(overrides = {}) {
  return {
    assignee: null,
    correspondentMatches: [{
      id: 'contact-1',
      phoneNumber: '+16505550123',
    }],
    correspondents: [{
      phoneNumber: '+16505550123',
    }],
    guestParty: {
      phoneNumber: '+16505550123',
    },
    id: 'thread-1',
    messages: [{ id: 'message-1' }],
    owner: {
      extensionId: 'owner-1',
    },
    ownerParty: {
      phoneNumber: '+16505550100',
    },
    recipients: [{ phoneNumber: '+16505550123' }],
    status: 'Open',
    ...overrides,
  };
}

function createDeps(overrides = {}) {
  const currentMessageThread = createConversation();
  return {
    appFeatures: {
      showSmsTemplate: true,
      showSmsTemplateManage: true,
    },
    accountInfo: {
      maxExtensionNumberLength: 6,
    },
    composeTextUI: {
      gotoComposeText: jest.fn(),
    },
    conversationLogger: {
      loggerSourceReady: true,
      logButtonTitle: 'Log message',
      logConversation: jest.fn(async () => {}),
    },
    conversations: {
      currentConversation: {
        correspondents: [{
          phoneNumber: '+16505550123',
        }],
      },
      currentConversationId: 'conversation-1',
      currentMessageThread,
      messageText: '',
      replyToReceivers: jest.fn(async () => ({ id: 'message-2' })),
      replyToThread: jest.fn(async () => ({ id: 'thread-message-1' })),
      unloadConversation: jest.fn(),
      updateMessageText: jest.fn(),
    },
    extensionInfo: {
      id: '101',
      isMultipleSiteEnabled: true,
      site: {
        code: '101',
      },
    },
    messageStore: {
      readMessages: jest.fn(),
    },
    messageThreadEntries: {
      markThreadAsRead: jest.fn(),
    },
    messageThreads: {
      assign: jest.fn(async () => {}),
      busy: false,
      createNote: jest.fn(async () => {}),
      deleteNote: jest.fn(async () => {}),
      getSMSRecipients: jest.fn(() => [{ phoneNumber: '+16505550123' }]),
      resolve: jest.fn(async () => {}),
      updateNote: jest.fn(async () => {}),
    },
    modalUI: {
      alert: jest.fn(() => 'alert-1'),
      close: jest.fn(),
      confirm: jest.fn(async () => true),
    },
    phoneNumberFormat: {
      format: jest.fn(({ phoneNumber }) => `formatted-${phoneNumber}`),
    },
    regionSettings: {
      areaCode: '650',
      countryCode: 'US',
    },
    routerInteraction: {
      push: jest.fn(),
    },
    smsTemplates: {
      createOrUpdateTemplate: jest.fn(async () => {}),
      deleteTemplate: jest.fn(async () => {}),
      sort: jest.fn(async () => {}),
      sync: jest.fn(async () => {}),
      templates: [{ id: 'template-1' }],
    },
    smsTypingTimeTracker: {
      _typingStartTimes: {
        'conversation-1': 1000,
      },
      accumulatedTypingTimes: {
        'conversation-1': 5000,
      },
      clearTyping: jest.fn(),
      enabled: true,
      pauseTyping: jest.fn(),
      startTyping: jest.fn(),
      stopTyping: jest.fn(),
    },
    thirdPartyService: {
      additionalSMSToolbarButtons: [{ id: 'crm' }],
      checkDoNotContact: jest.fn(async () => ({ result: false })),
      doNotContactRegistered: true,
      onClickAdditionalButton: jest.fn(),
    },
    ...overrides,
  };
}

function createModule(deps = createDeps()) {
  return new ConversationUI(deps);
}

describe('ConversationUI', () => {
  beforeEach(() => {
    setStagedState({});
  });

  afterEach(() => {
    setStagedState(undefined);
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('builds props for message threads, templates, logging, and typing duration', () => {
    const deps = createDeps();
    const conversationUI = createModule(deps);

    expect(conversationUI.getUIProps({
      params: {
        type: 'thread',
      },
    })).toMatchObject({
      accumulatedTypingTime: 5000,
      additionalToolbarButtons: [{ id: 'crm' }],
      baseProp: true,
      conversation: deps.conversations.currentMessageThread,
      logButtonTitle: 'Log message',
      messages: [{ id: 'message-1' }],
      myExtensionId: '101',
      recipients: [{ phoneNumber: '+16505550123' }],
      showLogButton: true,
      showTemplate: true,
      showTemplateManagement: true,
      showTypingDuration: true,
      templates: [{ id: 'template-1' }],
      threadBusy: false,
      typingStartTime: 1000,
    });
  });

  it('verifies SMS recipients with do-not-contact allow, restrict, confirm, and error results', async () => {
    const deps = createDeps();
    const conversationUI = createModule(deps);
    const selectedContact = {
      entityType: 'account',
      id: 'contact-1',
      name: 'Customer One',
      phoneNumbers: [{
        phoneNumber: '+16505550123',
        phoneType: 'mobile',
      }],
      type: 'external',
    };

    await expect(conversationUI.smsVerify(
      [{ phoneNumber: '+16505550123' }],
      selectedContact,
    )).resolves.toBe(true);
    expect(deps.thirdPartyService.checkDoNotContact).toHaveBeenCalledWith({
      actionType: 'sms',
      recipients: [{
        contactId: 'contact-1',
        contactType: 'external',
        entityType: 'account',
        name: 'Customer One',
        phoneNumber: '+16505550123',
        phoneType: 'mobile',
      }],
    });

    deps.thirdPartyService.checkDoNotContact.mockResolvedValueOnce({
      message: 'Do not text',
      mode: 'restrict',
      result: true,
    });
    await expect(conversationUI.smsVerify([{ phoneNumber: '+16505550123' }])).resolves.toBe(false);
    expect(deps.modalUI.alert).toHaveBeenCalledWith({
      content: 'Do not text',
      title: 'Do Not Contact',
    });

    deps.thirdPartyService.checkDoNotContact.mockResolvedValueOnce({
      mode: 'restrict',
      result: true,
    });
    await conversationUI.smsVerify([{ phoneNumber: '+16505550123' }]);
    expect(deps.modalUI.close).toHaveBeenCalledWith('alert-1');

    deps.thirdPartyService.checkDoNotContact.mockResolvedValueOnce({
      message: 'Confirm send',
      mode: 'confirm',
      result: true,
    });
    await expect(conversationUI.smsVerify([{ phoneNumber: '+16505550123' }])).resolves.toBe(true);
    expect(deps.modalUI.confirm).toHaveBeenCalledWith({
      confirmButtonText: 'Send',
      content: 'Confirm send',
      title: 'Do Not Contact',
    }, true);

    jest.spyOn(console, 'error').mockImplementation(() => {});
    deps.thirdPartyService.checkDoNotContact.mockRejectedValueOnce(new Error('dnc failed'));
    await expect(conversationUI.smsVerify([{ phoneNumber: '+16505550123' }])).resolves.toBe(true);
    expect(console.error).toHaveBeenCalledWith(expect.any(Error));

    deps.thirdPartyService.doNotContactRegistered = false;
    await expect(conversationUI.smsVerify([{ phoneNumber: '+16505550123' }])).resolves.toBe(true);
  });

  it('builds UI functions for typing, replies, templates, threads, notes, and formatting', async () => {
    const deps = createDeps();
    const conversationUI = createModule(deps);
    const funcs = conversationUI.getUIFunctions({
      conversationsPath: '/messages',
      params: {
        type: 'conversation',
      },
    });

    funcs.updateMessageText('hello');
    expect(deps.smsTypingTimeTracker.startTyping).toHaveBeenCalledWith('conversation-1');
    expect(deps.conversations.updateMessageText).toHaveBeenCalledWith('hello');

    deps.conversations.messageText = 'draft';
    funcs.unloadConversation();
    expect(deps.smsTypingTimeTracker.pauseTyping).toHaveBeenCalledWith('conversation-1');
    deps.conversations.messageText = '';
    funcs.unloadConversation();
    expect(deps.smsTypingTimeTracker.clearTyping).toHaveBeenCalledWith('conversation-1');
    expect(deps.conversations.unloadConversation).toHaveBeenCalledTimes(2);

    await expect(funcs.replyToReceivers('reply', [], null)).resolves.toEqual({ id: 'message-2' });
    expect(deps.smsTypingTimeTracker.pauseTyping).toHaveBeenCalledWith('conversation-1');
    expect(deps.conversations.replyToReceivers).toHaveBeenCalledWith('reply', [], null);
    expect(deps.smsTypingTimeTracker.stopTyping).toHaveBeenCalledWith('conversation-1', 'message-2');

    jest.spyOn(conversationUI, 'smsVerify').mockResolvedValueOnce(false);
    await expect(funcs.replyToReceivers('blocked', [], null)).resolves.toBeUndefined();

    await funcs.onLogConversation({
      conversationId: 'conversation-1',
      redirect: false,
    });
    expect(deps.conversationLogger.logConversation).toHaveBeenCalledWith({
      conversationId: 'conversation-1',
      redirect: false,
      triggerType: 'manual',
    });

    funcs.onClickAdditionalToolbarButton('crm');
    expect(deps.thirdPartyService.onClickAdditionalButton).toHaveBeenCalledWith('crm');
    await funcs.loadTemplates();
    await funcs.deleteTemplate('template-1');
    await funcs.createOrUpdateTemplate({ id: 'template-2' });
    await funcs.sortTemplates(['template-2', 'template-1']);
    expect(deps.smsTemplates.sync).toHaveBeenCalled();
    expect(deps.smsTemplates.deleteTemplate).toHaveBeenCalledWith('template-1');
    expect(deps.smsTemplates.createOrUpdateTemplate).toHaveBeenCalledWith({ id: 'template-2' });
    expect(deps.smsTemplates.sort).toHaveBeenCalledWith(['template-2', 'template-1']);

    expect(funcs.formatPhone('+16505550123')).toBe('formatted-+16505550123');
    expect(deps.phoneNumberFormat.format).toHaveBeenCalledWith({
      areaCode: '650',
      countryCode: 'US',
      isMultipleSiteEnabled: true,
      maxExtensionLength: 6,
      phoneNumber: '+16505550123',
      siteCode: '101',
    });

    funcs.readMessages('conversation-1');
    expect(deps.messageStore.readMessages).toHaveBeenCalledWith('conversation-1');
    await funcs.onAssign({ extensionId: '102' });
    expect(deps.messageThreads.assign).toHaveBeenCalledWith('thread-1', { extensionId: '102' });
    expect(funcs.getSMSRecipients()).toEqual([{ phoneNumber: '+16505550123' }]);
    expect(deps.messageThreads.getSMSRecipients).toHaveBeenCalledWith({ extensionId: 'owner-1' });

    await funcs.onReplyThread();
    expect(deps.messageThreads.assign).toHaveBeenCalledWith('thread-1', { extensionId: '101' });
    await funcs.onResolveThread();
    expect(deps.messageThreads.resolve).toHaveBeenCalledWith('thread-1');
    await funcs.onCreateNote('note');
    await funcs.onUpdateNote('note-1', 'updated');
    await funcs.onDeleteNote('note-1');
    expect(deps.messageThreads.createNote).toHaveBeenCalledWith('thread-1', 'note');
    expect(deps.messageThreads.updateNote).toHaveBeenCalledWith('note-1', 'updated');
    expect(deps.messageThreads.deleteNote).toHaveBeenCalledWith('thread-1', 'note-1');

    funcs.goBack();
    expect(deps.routerInteraction.push).toHaveBeenCalledWith('/messages');
  });

  it('handles thread reply mode, read mode, and resolved thread compose fallback', async () => {
    const deps = createDeps({
      conversations: {
        ...createDeps().conversations,
        currentMessageThread: createConversation({
          assignee: {
            extensionId: '102',
          },
          status: 'Resolved',
        }),
      },
    });
    const conversationUI = createModule(deps);
    const funcs = conversationUI.getUIFunctions({
      params: {
        type: 'thread',
      },
    });

    await expect(funcs.replyToReceivers('thread reply', [], null)).resolves.toEqual({
      id: 'thread-message-1',
    });
    expect(deps.conversations.replyToThread).toHaveBeenCalledWith('thread reply');
    expect(deps.smsTypingTimeTracker.stopTyping).toHaveBeenCalledWith(
      'conversation-1',
      'thread-message-1',
    );

    funcs.readMessages('thread-1');
    expect(deps.messageThreadEntries.markThreadAsRead).toHaveBeenCalledWith('thread-1');

    await funcs.onReplyThread();
    expect(deps.composeTextUI.gotoComposeText).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'contact-1',
        phoneNumber: '+16505550123',
      }),
      false,
      '+16505550100',
    );
  });
});
