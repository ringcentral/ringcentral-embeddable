const { setStagedState } = require('@ringcentral-integration/core/lib/usm-redux/utils');
const {
  messageSenderEvents,
  messageSenderMessages,
  messageSenderStatus,
} = require('@ringcentral-integration/commons/modules/MessageSender');

jest.mock('@ringcentral-integration/commons/modules/ComposeText', () => ({
  ComposeText: class BaseComposeText {
    constructor(deps) {
      this._deps = deps;
      this.senderNumber = '+16505550100';
      this.toNumbers = [];
      this.typingToNumber = '';
    }

    _addToNumber(number) {
      this.toNumbers.push(number);
    }

    _initSenderNumber() {
      this.senderNumber = '+16505550100';
    }

    _validatePhoneNumber(phoneNumber) {
      return Promise.resolve(phoneNumber !== 'invalid');
    }

    alertMessageSending() {
      this.messageSendingAlerted = true;
    }

    dismissMessageSending() {
      this.messageSendingDismissed = true;
    }
  },
}));

jest.mock('@ringcentral-integration/commons/modules/DataFetcherV2', () => ({
  DataFetcherV2Consumer: class MockDataFetcherV2Consumer {
    constructor({ deps }) {
      this._deps = deps;
      this.data = [];
    }
  },
  DataSource: class MockDataSource {
    constructor(options) {
      Object.assign(this, options);
    }
  },
}));

jest.mock('@ringcentral-integration/commons/modules/MessageSender', () => {
  const actual = jest.requireActual('@ringcentral-integration/commons/modules/MessageSender');
  return {
    ...actual,
    MessageSender: class BaseMessageSender {
      constructor(deps) {
        this._deps = deps;
        this._eventEmitter = {
          emit: jest.fn(),
        };
        this.senderNumbersList = [];
        this.validateToNumberResult = {
          extNumbers: [],
          noExtNumbers: [],
          result: true,
        };
      }

      _alertWarning = jest.fn();

      _onSendError = jest.fn(async () => {});

      _sendPager = jest.fn(async ({ text }) => ({
        id: `pager-${text}`,
      }));

      _smsAttempt = jest.fn();

      _smsSentError = jest.fn();

      _smsSentOver = jest.fn();

      _validateContent = jest.fn(() => true);

      _validateSenderNumber = jest.fn(() => true);

      async _validateToNumbers() {
        return this.validateToNumberResult;
      }

      setSendStatus = jest.fn();
    },
  };
});

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'event-id-1'),
}));

jest.mock('@ringcentral-integration/utils', () => ({
  ...jest.requireActual('@ringcentral-integration/utils'),
  sleep: jest.fn(async () => {}),
}));

const { sleep } = require('@ringcentral-integration/utils');
const { ComposeText } = require('../../src/modules/ComposeText');
const { MessageSender } = require('../../src/modules/MessageSender');
const { SmsTemplates } = require('../../src/modules/SmsTemplates/SmsTemplates');

function createComposeTextDeps(overrides = {}) {
  return {
    alert: {
      warning: jest.fn(),
    },
    messageSender: {
      send: jest.fn(async () => [{ id: 'message-1' }]),
      senderNumbersList: [{
        phoneNumber: '+16505550100',
      }],
    },
    modalUI: {
      alert: jest.fn(() => 'alert-1'),
      close: jest.fn(),
      confirm: jest.fn(async () => true),
    },
    routerInteraction: {
      currentPath: '/composeText',
    },
    thirdPartyService: {
      checkDoNotContact: jest.fn(async () => ({ result: false })),
      doNotContactRegistered: true,
    },
    ...overrides,
  };
}

function createSmsTemplate(overrides = {}) {
  return {
    body: {
      text: 'Template body',
    },
    displayName: 'Template',
    id: '1',
    scope: 'Personal',
    ...overrides,
  };
}

function createSmsTemplatesDeps(overrides = {}) {
  const platform = {
    delete: jest.fn(async () => {}),
    get: jest.fn(async () => ({
      json: async () => ({
        records: [
          createSmsTemplate({ id: '1' }),
          createSmsTemplate({ id: '3' }),
          createSmsTemplate({ id: '2' }),
        ],
      }),
    })),
    send: jest.fn(async () => ({
      json: async () => createSmsTemplate({ id: '4' }),
    })),
  };
  return {
    alert: {
      danger: jest.fn(),
    },
    appFeatures: {
      showSmsTemplate: true,
    },
    client: {
      service: {
        platform: jest.fn(() => platform),
      },
    },
    dataFetcherV2: {
      fetchData: jest.fn(async () => {}),
      register: jest.fn(),
      updateData: jest.fn(),
    },
    extensionFeatures: {},
    smsTemplateOptions: {
      ttl: 1000,
    },
    storage: {},
    ...overrides,
    platform,
  };
}

function createMessageSenderDeps(overrides = {}) {
  const smsPost = jest.fn(async ({ text }) => ({
    id: `sms-${text}`,
  }));
  const platformPost = jest.fn(async () => ({
    json: async () => ({ id: 'mms-1' }),
  }));
  return {
    client: {
      account: jest.fn(() => ({
        extension: jest.fn(() => ({
          sms: jest.fn(() => ({
            post: smsPost,
          })),
        })),
      })),
      service: {
        platform: jest.fn(() => ({
          post: platformPost,
        })),
      },
    },
    messageThreads: {
      hasPermission: true,
      sendMessage: jest.fn(async ({ text }) => ({
        id: `thread-${text}`,
      })),
    },
    ...overrides,
    platformPost,
    smsPost,
  };
}

describe('messaging modules', () => {
  beforeEach(() => {
    setStagedState({});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    setStagedState(undefined);
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('verifies compose text recipients against do-not-contact modes', async () => {
    const deps = createComposeTextDeps();
    const composeText = new ComposeText(deps);

    deps.thirdPartyService.doNotContactRegistered = false;
    await expect(composeText.smsVerify({
      toNumbers: [{ phoneNumber: '+16505550123' }],
    })).resolves.toBe(true);
    expect(deps.thirdPartyService.checkDoNotContact).not.toHaveBeenCalled();

    deps.thirdPartyService.doNotContactRegistered = true;
    await expect(composeText.smsVerify({
      toNumbers: [{
        contactId: 'contact-1',
        entityType: 'account',
        name: 'Customer',
        phoneNumber: '+16505550123',
        phoneType: 'mobile',
        type: 'crm',
      }],
      typingToNumber: '+16505550124',
    })).resolves.toBe(true);
    expect(deps.thirdPartyService.checkDoNotContact).toHaveBeenCalledWith({
      actionType: 'sms',
      recipients: [
        {
          contactId: 'contact-1',
          contactType: 'crm',
          entityType: 'account',
          name: 'Customer',
          phoneNumber: '+16505550123',
          phoneType: 'mobile',
        },
        {
          phoneNumber: '+16505550124',
        },
      ],
    });

    deps.thirdPartyService.checkDoNotContact.mockResolvedValueOnce({
      message: 'Do not text',
      mode: 'restrict',
      result: true,
    });
    await expect(composeText.smsVerify({ toNumbers: [] })).resolves.toBe(false);
    expect(deps.modalUI.alert).toHaveBeenCalledWith({
      content: 'Do not text',
      title: 'Do Not Contact',
    });

    deps.thirdPartyService.checkDoNotContact.mockResolvedValueOnce({
      mode: 'restrict',
      result: true,
    });
    await expect(composeText.smsVerify({ toNumbers: [] })).resolves.toBe(false);
    expect(deps.modalUI.close).toHaveBeenCalledWith('alert-1');

    deps.thirdPartyService.checkDoNotContact.mockResolvedValueOnce({
      message: 'Confirm send',
      mode: 'confirm',
      result: true,
    });
    await expect(composeText.smsVerify({ toNumbers: [] })).resolves.toBe(true);
    expect(deps.modalUI.confirm).toHaveBeenCalledWith({
      confirmButtonText: 'Send',
      content: 'Confirm send',
      title: 'Do Not Contact',
    }, true);

    deps.thirdPartyService.checkDoNotContact.mockRejectedValueOnce(new Error('DNC failed'));
    await expect(composeText.smsVerify({ toNumbers: [] })).resolves.toBe(true);
    expect(console.error).toHaveBeenCalledWith(expect.any(Error));
  });

  it('adds compose recipients, keeps default sender state, and sends verified messages', async () => {
    const deps = createComposeTextDeps();
    const composeText = new ComposeText(deps);

    await expect(composeText.addToNumber({ phoneNumber: '' })).resolves.toBe(false);
    await expect(composeText.addToNumber({ phoneNumber: 'invalid' })).resolves.toBe(false);
    composeText.groupSMS = true;
    composeText.toNumbers = Array.from({ length: 10 }, (_, index) => ({
      phoneNumber: `+165055501${index}`,
    }));
    await expect(composeText.addToNumber({ phoneNumber: '+16505550199' })).resolves.toBe(false);
    expect(deps.alert.warning).toHaveBeenCalledWith({
      message: 'maxGroupSMSLimitReached',
    });

    composeText.toNumbers = [];
    await expect(composeText.addToNumber({ phoneNumber: '+16505550123' })).resolves.toBe(true);
    expect(composeText.toNumbers).toEqual([{ phoneNumber: '+16505550123' }]);

    composeText.setDefaultTextId('+16505550100');
    composeText._initSenderNumber();
    expect(composeText.defaultTextId).toBe('+16505550100');
    composeText.setDefaultTextId('+16505559999');
    composeText._initSenderNumber();
    expect(composeText.defaultTextId).toBe('');

    composeText.typingToNumber = '+16505550124';
    await expect(composeText.send('hello', [{ file: new Blob(['file']) }])).resolves.toEqual([
      { id: 'message-1' },
    ]);
    expect(deps.messageSender.send).toHaveBeenCalledWith({
      attachments: [{ file: expect.any(Blob) }],
      fromNumber: '+16505550100',
      groupSMS: true,
      text: 'hello',
      toNumbers: ['+16505550123', '+16505550124'],
    });
    expect(composeText.messageSendingDismissed).toBe(true);

    composeText.typingToNumber = 'invalid';
    await expect(composeText.send('invalid')).resolves.toBeNull();
    composeText.typingToNumber = '';
    composeText.smsVerify = jest.fn(async () => false);
    await expect(composeText.send('blocked')).resolves.toBeNull();
  });

  it('fetches, orders, deletes, creates, and updates SMS templates', async () => {
    const deps = createSmsTemplatesDeps();
    const smsTemplates = new SmsTemplates(deps);
    smsTemplates.data = [
      createSmsTemplate({ id: '1' }),
      createSmsTemplate({ id: '2' }),
      createSmsTemplate({ id: '3' }),
    ];

    expect(deps.dataFetcherV2.register).toHaveBeenCalledWith(expect.objectContaining({
      key: 'smsTemplates',
      ttl: 1000,
    }));
    await expect(smsTemplates._source.fetchFunction()).resolves.toEqual([
      expect.objectContaining({ id: '3' }),
      expect.objectContaining({ id: '2' }),
      expect.objectContaining({ id: '1' }),
    ]);

    smsTemplates.sort(['3', 'missing', '1']);
    expect(smsTemplates.templates.map((template) => template.id)).toEqual(['3', '1', '2']);
    smsTemplates.clearOrderedIds();
    expect(smsTemplates.orderedIds).toEqual(['3', '1']);
    smsTemplates.setToFirstOrder('2');
    expect(smsTemplates.orderedIds).toEqual(['2', '3', '1']);
    expect(smsTemplates._hasPermission).toBe(true);

    await smsTemplates.sync();
    expect(deps.dataFetcherV2.fetchData).toHaveBeenCalledWith(smsTemplates._source);
    deps.appFeatures.showSmsTemplate = false;
    await smsTemplates.sync();
    expect(deps.dataFetcherV2.fetchData).toHaveBeenCalledTimes(1);

    await smsTemplates.deleteTemplate('2');
    expect(deps.platform.delete).toHaveBeenCalledWith(
      '/restapi/v1.0/account/~/extension/~/message-store-templates/2',
    );
    expect(deps.dataFetcherV2.updateData).toHaveBeenCalledWith(
      smsTemplates._source,
      [
        expect.objectContaining({ id: '1' }),
        expect.objectContaining({ id: '3' }),
      ],
      expect.any(Number),
    );

    deps.platform.delete.mockRejectedValueOnce(new Error('delete failed'));
    await smsTemplates.deleteTemplate('3');
    expect(deps.alert.danger).toHaveBeenCalledWith({
      message: 'deleteSmsTemplateError',
    });

    smsTemplates.data = Array.from({ length: 25 }, (_, index) => createSmsTemplate({
      id: String(index + 1),
    }));
    await expect(smsTemplates.createOrUpdateTemplate(createSmsTemplate({ id: undefined }))).resolves.toEqual(
      new Error('smsTemplateMaxLimit'),
    );
    expect(deps.alert.danger).toHaveBeenCalledWith({
      message: 'smsTemplateMaxLimit',
    });

    smsTemplates.data = [createSmsTemplate({ id: '1' })];
    await expect(smsTemplates.createOrUpdateTemplate(createSmsTemplate({
      id: undefined,
      displayName: 'New template',
    }))).resolves.toBeNull();
    expect(deps.platform.send).toHaveBeenCalledWith({
      body: {
        body: {
          text: 'Template body',
        },
        displayName: 'New template',
      },
      method: 'POST',
      url: '/restapi/v1.0/account/~/extension/~/message-store-templates',
    });
    expect(smsTemplates.orderedIds[0]).toBe('4');

    await expect(smsTemplates.createOrUpdateTemplate(createSmsTemplate({
      id: '1',
      displayName: 'Updated template',
    }))).resolves.toBeNull();
    expect(deps.platform.send).toHaveBeenLastCalledWith({
      body: {
        body: {
          text: 'Template body',
        },
        displayName: 'Updated template',
      },
      method: 'PUT',
      url: '/restapi/v1.0/account/~/extension/~/message-store-templates/1',
    });

    deps.platform.send.mockRejectedValueOnce(new Error('save failed'));
    await expect(smsTemplates.createOrUpdateTemplate(createSmsTemplate({
      id: '1',
    }))).resolves.toEqual(expect.any(Error));
    expect(deps.alert.danger).toHaveBeenCalledWith({
      message: 'saveSmsTemplateError',
    });
  });

  it('sends messages through pager, direct SMS, group SMS, MMS, thread, and error paths', async () => {
    const deps = createMessageSenderDeps();
    const sender = new MessageSender(deps);
    sender.senderNumbersList = [{
      extension: { id: '101' },
      phoneNumber: '+16505550100',
    }];
    sender.validateToNumberResult = {
      extNumbers: ['102'],
      noExtNumbers: ['+16505550123', '+16505550124'],
      result: true,
    };

    await expect(sender._validateToNumbers(['102'])).resolves.toEqual(sender.validateToNumberResult);
    expect(sender.setSendStatus).toHaveBeenCalledWith(messageSenderStatus.idle);

    sender._validateContent.mockReturnValueOnce(false);
    await expect(sender.send({
      fromNumber: '+16505550100',
      text: 'ignored',
      toNumbers: ['+16505550123'],
    })).resolves.toBeNull();

    sender.validateToNumberResult = {
      extNumbers: ['102'],
      noExtNumbers: [],
      result: true,
    };
    await expect(sender.send({
      attachments: [{ file: new Blob(['file']) }],
      fromNumber: '+16505550100',
      text: 'pager',
      toNumbers: ['102'],
    })).resolves.toBeNull();
    expect(sender._alertWarning).toHaveBeenCalledWith(messageSenderMessages.noAttachmentToExtension);

    sender.validateToNumberResult = {
      extNumbers: ['102'],
      noExtNumbers: ['+16505550123'],
      result: true,
    };
    await expect(sender.send({
      fromNumber: '+16505550100',
      groupSMS: true,
      text: 'hello',
      toNumbers: ['102', '+16505550123'],
    })).resolves.toEqual([
      { id: 'pager-hello' },
      { id: 'thread-hello' },
    ]);
    expect(sender._eventEmitter.emit).toHaveBeenCalledWith(messageSenderEvents.send, {
      eventId: 'event-id-1',
      fromNumber: '+16505550100',
      multipart: false,
      replyOnMessageId: undefined,
      text: 'hello',
      toNumbers: ['102', '+16505550123'],
    });
    expect(sender._smsSentOver).toHaveBeenCalled();

    sender.senderNumbersList = [{
      phoneNumber: '+16505550100',
      usageType: 'DirectNumber',
    }];
    await expect(sender._sendSMS({
      fromNumber: '+16505550100',
      text: 'direct',
      to: [{ phoneNumber: '+16505550199' }],
    })).resolves.toEqual({ id: 'sms-direct' });
    expect(deps.smsPost).toHaveBeenCalledWith({
      from: { phoneNumber: '+16505550100' },
      text: 'direct',
      to: [{ phoneNumber: '+16505550199' }],
    });

    await expect(sender._sendSMSChunks({
      attachments: [{ file: new Blob(['file']) }],
      chunks: ['mms-1', 'sms-2'],
      fromNumber: '+16505550100',
      shouldSleep: true,
      to: [{ phoneNumber: '+16505550199' }],
    })).resolves.toEqual([
      { id: 'mms-1' },
      { id: 'sms-sms-2' },
    ]);
    expect(sleep).toHaveBeenCalledWith(2000);
    expect(deps.platformPost).toHaveBeenCalledWith(
      '/restapi/v1.0/account/~/extension/~/sms',
      expect.any(FormData),
    );

    const assignedError = new Error('assigned');
    assignedError.response = {
      clone: () => ({
        json: async () => ({
          errors: [{ errorCode: 'MSG-427' }],
        }),
      }),
    };
    deps.messageThreads.sendMessage.mockRejectedValueOnce(assignedError);
    sender.senderNumbersList = [{
      extension: { id: '101' },
      phoneNumber: '+16505550100',
    }];
    sender.validateToNumberResult = {
      extNumbers: [],
      noExtNumbers: ['+16505550123'],
      result: true,
    };
    await expect(sender.send({
      fromNumber: '+16505550100',
      text: 'blocked',
      toNumbers: ['+16505550123'],
    })).rejects.toThrow('assigned');
    expect(sender._alertWarning).toHaveBeenCalledWith('threadIsAssignedToOtherExtension');
    expect(sender._smsSentError).toHaveBeenCalled();
  });
});
