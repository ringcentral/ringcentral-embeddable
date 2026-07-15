const { setStagedState } = require('@ringcentral-integration/core/lib/usm-redux/utils');

jest.mock('@ringcentral-integration/widgets/modules/ComposeTextUI', () => ({
  ComposeTextUI: class BaseComposeTextUI {
    constructor(deps) {
      this._deps = deps;
      this._ignoreModuleReadiness = jest.fn();
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

const { ComposeTextUI } = require('../../src/modules/ComposeTextUI');

function createMessage(overrides = {}) {
  return {
    conversation: {
      id: 'conversation-1',
    },
    id: 'message-1',
    to: [{ phoneNumber: '+16505550123' }],
    ...overrides,
  };
}

function createThread(overrides = {}) {
  return {
    assignee: {
      extensionId: '101',
    },
    guestParty: {
      phoneNumber: '+16505550123',
    },
    id: 'thread-1',
    ownerParty: {
      phoneNumber: '+16505550100',
    },
    status: 'Open',
    ...overrides,
  };
}

function createDeps(overrides = {}) {
  return {
    accountInfo: {
      maxExtensionNumberLength: 6,
    },
    alert: {
      warning: jest.fn(),
    },
    analytics: {
      trackRouter: jest.fn(),
    },
    appFeatures: {
      showSmsTemplate: true,
      showSmsTemplateManage: true,
    },
    composeText: {
      addToNumber: jest.fn(),
      clean: jest.fn(),
      cleanTypingToNumber: jest.fn(),
      defaultTextId: '+16505550109',
      groupSMS: true,
      messageText: '',
      senderNumber: '+16505550100',
      send: jest.fn(async () => [createMessage()]),
      setGroupSMS: jest.fn(),
      toNumbers: [],
      typingToNumber: '',
      updateMessageText: jest.fn(),
      updateSenderNumber: jest.fn(),
      updateTypingToNumber: jest.fn(),
    },
    contactSearch: {
      search: jest.fn(),
    },
    conversations: {
      loadConversation: jest.fn(),
      relateCorrespondentEntity: jest.fn(),
      replyToThread: jest.fn(async () => ({ id: 'thread-reply-1' })),
      updateMessageText: jest.fn(),
      updateOwnerFilter: jest.fn(),
    },
    extensionInfo: {
      id: '101',
      isMultipleSiteEnabled: true,
      site: {
        code: '101',
      },
    },
    messageSender: {
      senderNumbersList: [{
        extension: { id: '101' },
        phoneNumber: '+16505550100',
      }],
    },
    messageStore: {
      pushMessages: jest.fn(),
    },
    messageThreadEntries: {
      saveNewMessages: jest.fn(),
    },
    messageThreads: {
      hasPermission: true,
      loadThread: jest.fn(async (threadId) => createThread({ id: threadId })),
      threads: [],
    },
    phoneNumberFormat: {
      format: jest.fn(({ phoneNumber }) => `formatted-${phoneNumber}`),
      formatWithType: jest.fn(({ phoneNumber }) => phoneNumber),
    },
    regionSettings: {
      areaCode: '650',
      countryCode: 'US',
    },
    routerInteraction: {
      goBack: jest.fn(),
      push: jest.fn(),
    },
    sideDrawerUI: {
      closeWidget: jest.fn(),
      gotoConversation: jest.fn(),
      openWidget: jest.fn(),
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
        compose: 1000,
      },
      accumulatedTypingTimes: {
        compose: 5000,
      },
      clearTyping: jest.fn(),
      enabled: true,
      pauseTyping: jest.fn(),
      startTyping: jest.fn(),
      stopTyping: jest.fn(),
    },
    thirdPartyService: {
      additionalSMSToolbarButtons: [{ id: 'crm' }],
      onClickAdditionalButton: jest.fn(),
    },
    ...overrides,
  };
}

function createModule(deps = createDeps()) {
  return new ComposeTextUI(deps);
}

describe('ComposeTextUI', () => {
  beforeEach(() => {
    setStagedState({});
  });

  afterEach(() => {
    setStagedState(undefined);
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('builds props and utility functions for typing, templates, loading, formatting, and navigation', async () => {
    const deps = createDeps();
    const composeTextUI = createModule(deps);
    const goBack = jest.fn();
    const onClose = jest.fn();
    const funcs = composeTextUI.getUIFunctions({ goBack, onClose });

    expect(composeTextUI.getUIProps({})).toMatchObject({
      accumulatedTypingTime: 5000,
      additionalToolbarButtons: [{ id: 'crm' }],
      baseProp: true,
      groupSMS: true,
      showTemplate: true,
      showTemplateManagement: true,
      showTypingDuration: true,
      templates: [{ id: 'template-1' }],
      typingStartTime: 1000,
    });

    deps.composeText.messageText = 'draft';
    funcs.updateMessageText('');
    expect(deps.smsTypingTimeTracker.clearTyping).toHaveBeenCalledWith('compose');
    funcs.updateMessageText('hello');
    expect(deps.smsTypingTimeTracker.startTyping).toHaveBeenCalledWith('compose');
    expect(deps.composeText.updateMessageText).toHaveBeenCalledWith('hello');

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

    funcs.onLoad();
    expect(deps.composeText.updateSenderNumber).toHaveBeenCalledWith('+16505550109');
    composeTextUI.gotoComposeText(undefined, false, '+16505550110');
    funcs.onLoad();
    expect(deps.composeText.updateSenderNumber).toHaveBeenCalledWith('+16505550110');

    expect(funcs.formatContactPhone('+16505550123')).toBe('formatted-+16505550123');
    expect(deps.phoneNumberFormat.format).toHaveBeenCalledWith({
      areaCode: '650',
      countryCode: 'US',
      isMultipleSiteEnabled: true,
      maxExtensionLength: 6,
      phoneNumber: '+16505550123',
      siteCode: '101',
    });
    funcs.setGroupSMS(false);
    expect(deps.composeText.setGroupSMS).toHaveBeenCalledWith(false);

    deps.composeText.messageText = 'draft';
    funcs.goBack();
    expect(deps.smsTypingTimeTracker.pauseTyping).toHaveBeenCalledWith('compose');
    expect(goBack).toHaveBeenCalled();
    deps.composeText.messageText = '';
    funcs.onClose();
    expect(deps.smsTypingTimeTracker.clearTyping).toHaveBeenCalledWith('compose');
    expect(onClose).toHaveBeenCalled();
  });

  it('opens compose text with empty, dummy, and matched contacts', () => {
    const deps = createDeps();
    const composeTextUI = createModule(deps);

    composeTextUI.gotoComposeText();
    expect(deps.sideDrawerUI.openWidget).toHaveBeenCalledWith({
      contact: undefined,
      widget: {
        id: 'composeText',
        name: 'Compose text',
      },
    });
    expect(deps.analytics.trackRouter).toHaveBeenCalledWith('/composeText');

    composeTextUI.gotoComposeText({
      name: 'Customer',
      phoneNumber: '+16505550123',
    }, true);
    expect(deps.composeText.updateTypingToNumber).toHaveBeenCalledWith('Customer');
    expect(deps.contactSearch.search).toHaveBeenCalledWith({ searchString: 'Customer' });

    deps.composeText.typingToNumber = '+16505550124';
    composeTextUI.gotoComposeText({
      phoneNumber: '+16505550124',
    });
    expect(deps.composeText.addToNumber).toHaveBeenCalledWith({
      phoneNumber: '+16505550124',
    });
    expect(deps.composeText.cleanTypingToNumber).toHaveBeenCalled();
  });

  it('sends normal and thread messages and routes to the right conversation views', async () => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    const deps = createDeps();
    const composeTextUI = createModule(deps);
    const funcs = composeTextUI.getUIFunctions({});

    deps.composeText.send.mockResolvedValueOnce([
      createMessage({
        id: 'message-1',
      }),
      createMessage({
        id: 'thread-message-1',
        threadId: 'thread-1',
      }),
    ]);
    await funcs.send('hello', []);
    expect(deps.smsTypingTimeTracker.pauseTyping).toHaveBeenCalledWith('compose');
    expect(deps.smsTypingTimeTracker.stopTyping).toHaveBeenCalledWith('compose', 'message-1');
    expect(deps.smsTypingTimeTracker.stopTyping).toHaveBeenCalledWith('compose', 'thread-message-1');
    expect(deps.messageThreadEntries.saveNewMessages).toHaveBeenCalledWith([
      expect.objectContaining({ threadId: 'thread-1' }),
    ]);
    expect(deps.messageStore.pushMessages).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'message-1' }),
    ]);
    expect(deps.conversations.updateOwnerFilter).toHaveBeenCalledWith('Threads');
    expect(deps.routerInteraction.push).toHaveBeenCalledWith('/messages');
    expect(deps.conversations.relateCorrespondentEntity).toHaveBeenCalled();
    expect(deps.composeText.clean).toHaveBeenCalled();

    deps.composeText.send.mockResolvedValueOnce([
      createMessage({
        conversation: {
          id: 'conversation-2',
        },
        id: 'message-2',
        to: [{ phoneNumber: '+16505550124' }],
      }),
    ]);
    await funcs.send('single', []);
    expect(deps.sideDrawerUI.gotoConversation).toHaveBeenCalledWith(
      'conversation-2',
      { phoneNumber: '+16505550124' },
    );
    expect(deps.sideDrawerUI.closeWidget).toHaveBeenCalledWith('composeText');

    deps.composeText.send.mockResolvedValueOnce([
      createMessage({
        id: 'thread-message-2',
        threadId: 'thread-2',
      }),
    ]);
    await funcs.send('thread', []);
    expect(deps.messageThreads.loadThread).toHaveBeenCalledWith('thread-2');
    expect(deps.sideDrawerUI.gotoConversation).toHaveBeenCalledWith(
      'thread-2',
      { phoneNumber: '+16505550123' },
      'thread',
    );

    deps.messageThreads.loadThread.mockResolvedValueOnce(null);
    deps.composeText.send.mockResolvedValueOnce([
      createMessage({
        id: 'thread-message-3',
        threadId: 'thread-3',
      }),
    ]);
    await funcs.send('thread missing', []);
    expect(deps.routerInteraction.push).toHaveBeenCalledWith('/messages');

    deps.composeText.send.mockResolvedValueOnce([]);
    await funcs.send('empty', []);
    expect(deps.composeText.clean).toHaveBeenCalledTimes(4);
  });

  it('reuses open threads and handles assigned-to-other and send error paths', async () => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    const thread = createThread();
    const deps = createDeps({
      composeText: {
        ...createDeps().composeText,
        toNumbers: [{ phoneNumber: '+16505550123' }],
      },
      messageThreads: {
        ...createDeps().messageThreads,
        threads: [thread],
      },
    });
    const composeTextUI = createModule(deps);
    const funcs = composeTextUI.getUIFunctions({});

    await funcs.send('reply in thread', []);
    expect(deps.conversations.loadConversation).toHaveBeenCalledWith('thread-1');
    expect(deps.conversations.updateMessageText).toHaveBeenCalledWith('reply in thread');
    expect(deps.sideDrawerUI.gotoConversation).toHaveBeenCalledWith(
      'thread-1',
      { phoneNumber: '+16505550123' },
      'thread',
    );
    expect(deps.conversations.replyToThread).toHaveBeenCalledWith('reply in thread');
    expect(deps.smsTypingTimeTracker.stopTyping).toHaveBeenCalledWith('compose', 'thread-reply-1');

    deps.messageThreads.threads = [createThread({
      assignee: {
        extensionId: '102',
      },
      id: 'thread-2',
    })];
    await funcs.send('blocked thread', []);
    expect(deps.alert.warning).toHaveBeenCalledWith({
      message: 'threadIsAssignedToOtherExtension',
      ttl: 0,
    });

    deps.messageThreads.threads = [];
    deps.composeText.send.mockRejectedValueOnce(new Error('send failed'));
    await funcs.send('fails', []);
    expect(console.log).toHaveBeenCalledWith(expect.any(Error));
  });
});
