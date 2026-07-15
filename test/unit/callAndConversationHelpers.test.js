const callDirections = require('@ringcentral-integration/commons/enums/callDirections').default;
const messageDirection = require('@ringcentral-integration/commons/enums/messageDirection').default;
const messageTypes = require('@ringcentral-integration/commons/enums/messageTypes').default;

const callHelper = require('../../src/components/CallItem/helper');
const conversationHelper = require('../../src/components/ConversationItem/helper');

jest.mock('@ringcentral-integration/widgets/components/CallItem/i18n', () => ({
  getString: jest.fn((key) => key),
}));

jest.mock('@ringcentral-integration/widgets/components/MessageItem/i18n', () => ({
  getString: jest.fn((key) => key),
}));

jest.mock('@ringcentral/juno-icon', () => {
  const React = require('react');
  const createIcon = (name) => function MockIcon() {
    return React.createElement('span', { 'data-icon': name });
  };
  return {
    AddMemberBorder: createIcon('AddMemberBorder'),
    AddTextLog: createIcon('AddTextLog'),
    AiSmartNotes: createIcon('AiSmartNotes'),
    Apps: createIcon('Apps'),
    CallsBorder: createIcon('CallsBorder'),
    Check: createIcon('Check'),
    Delete: createIcon('Delete'),
    Download: createIcon('Download'),
    Edit: createIcon('Edit'),
    Logout: createIcon('Logout'),
    NewAction: createIcon('NewAction'),
    OuboundCallOnBehalf: createIcon('Assign'),
    People: createIcon('People'),
    PhoneBorder: createIcon('PhoneBorder'),
    Read: createIcon('Read'),
    Refresh: createIcon('Refresh'),
    SettingsBorder: createIcon('SettingsBorder'),
    SmsBorder: createIcon('SmsBorder'),
    TodayCalendarIco: createIcon('TodayCalendarIco'),
    Unread: createIcon('Unread'),
    ViewBorder: createIcon('ViewBorder'),
    ViewLogBorder: createIcon('ViewLogBorder'),
  };
});

function createCall(overrides = {}) {
  return {
    activityMatches: [],
    direction: callDirections.outbound,
    from: {
      name: 'Agent',
      phoneNumber: '+16505550100',
    },
    fromMatches: [],
    telephonySessionId: 'telephony-1',
    to: {
      name: 'Customer',
      phoneNumber: '+16505550101',
    },
    toMatches: [
      { id: 'contact-1', name: 'Customer One' },
      { id: 'contact-2', name: 'Customer Two' },
    ],
    type: 'Voice',
    ...overrides,
  };
}

function createConversation(overrides = {}) {
  return {
    conversationId: 'conversation-1',
    conversationMatches: [],
    correspondentMatches: [
      { id: 'contact-1', name: 'Customer One' },
    ],
    correspondents: [
      { name: 'Customer', phoneNumber: '+16505550101' },
    ],
    direction: messageDirection.inbound,
    faxAttachment: null,
    type: messageTypes.voiceMail,
    unreadCounts: 0,
    voicemailAttachment: {
      uri: 'https://media.example.com/voicemail',
    },
    ...overrides,
  };
}

function clickAction(actions, id, event) {
  const action = actions.find((item) => item.id === id);
  expect(action).toBeTruthy();
  action.onClick(event);
  return action;
}

describe('CallItem helper', () => {
  it('selects phone numbers, contacts, and initial contact indices', () => {
    const outbound = createCall({
      activityMatches: [
        { id: 'activity-1', type: 'log' },
      ],
      toNumberEntity: 'contact-2',
    });
    const inbound = createCall({
      direction: callDirections.inbound,
      from: {
        name: 'Inbound Customer',
        extensionNumber: '101',
      },
      fromMatches: [{ id: 'inbound-contact' }],
    });

    expect(callHelper.getPhoneNumber(outbound)).toBe('+16505550101');
    expect(callHelper.getPhoneNumber(inbound)).toBe('101');
    expect(callHelper.getContactMatches(inbound)).toEqual([{ id: 'inbound-contact' }]);
    expect(callHelper.getFallbackContactName(inbound)).toBe('Inbound Customer');
    expect(callHelper.getInitialContactIndex(
      outbound,
      true,
      (_call, activity, contact) => activity.id === 'activity-1' && contact.id === 'contact-1',
    )).toBe(0);
    expect(callHelper.getInitialContactIndex(outbound, true)).toBe(1);
    expect(callHelper.getInitialContactIndex(createCall({ toMatches: [] }), true)).toBe(-1);
    expect(callHelper.getSelectedContact(1, outbound)).toEqual({ id: 'contact-2', name: 'Customer Two' });
    expect(callHelper.getSelectedContact(-1, createCall({ toMatches: [{ id: 'only' }] }))).toEqual({ id: 'only' });
  });

  it('builds and invokes call actions for log, call, text, contact, recording, and extra actions', () => {
    const callbacks = {
      createSelectedContact: jest.fn(),
      logCall: jest.fn(),
      onClickAdditionalAction: jest.fn(),
      onClickToDial: jest.fn(),
      onClickToSms: jest.fn(),
      onDownload: jest.fn(),
      onRefreshContact: jest.fn(),
      onViewContact: jest.fn(),
      onViewSmartNote: jest.fn(),
    };
    const call = createCall({
      activityMatches: [
        { id: 'activity-1', type: 'log' },
        { id: 'activity-2', type: 'status', status: 'pending' },
      ],
    });
    const actions = callHelper.getActions({
      ...callbacks,
      additionalActions: [{ id: 'external', icon: 'calendar', label: 'Open calendar' }],
      aiNoted: true,
      areaCode: '650',
      call,
      countryCode: 'US',
      currentLocale: 'en-US',
      disableCallButton: false,
      disableClickToDial: false,
      disableLinks: false,
      enableContactFallback: true,
      enableCDC: false,
      formatPhone: (phoneNumber) => `formatted-${phoneNumber}`,
      hideEditLogButton: false,
      internalSmsPermission: true,
      isExtension: false,
      isLogging: false,
      isRecording: true,
      logButtonTitle: 'Log call',
      maxExtensionNumberLength: 6,
      outboundSmsPermission: true,
      readTextPermission: true,
      selected: 0,
      showLogButton: true,
    });

    expect(actions.map((item) => item.id)).toEqual([
      'log',
      'c2d',
      'c2sms',
      'viewSmartNote',
      'viewContact',
      'refreshContact',
      'download',
      'viewLog',
      'external',
    ]);
    expect(actions.find((item) => item.id === 'log').disabled).toBe(true);
    clickAction(actions, 'log');
    clickAction(actions, 'c2d');
    clickAction(actions, 'c2sms');
    clickAction(actions, 'viewSmartNote');
    clickAction(actions, 'viewContact');
    clickAction(actions, 'refreshContact');
    clickAction(actions, 'download');
    clickAction(actions, 'viewLog');
    clickAction(actions, 'external');

    expect(callbacks.logCall).toHaveBeenCalledWith(true, undefined, 'editLog');
    expect(callbacks.onClickToDial).toHaveBeenCalledWith({
      id: 'contact-1',
      name: 'Customer One',
      phoneNumber: '+16505550101',
    });
    expect(callbacks.onClickToSms).toHaveBeenCalledWith({
      id: 'contact-1',
      name: 'Customer One',
      phoneNumber: '+16505550101',
    });
    expect(callbacks.onViewSmartNote).toHaveBeenCalledWith(expect.objectContaining({
      contact: { id: 'contact-1', name: 'Customer One' },
      direction: callDirections.outbound,
      phoneNumber: '+16505550101',
      telephonySessionId: 'telephony-1',
    }));
    expect(callbacks.onViewContact).toHaveBeenCalledWith(expect.objectContaining({
      contact: { id: 'contact-1', name: 'Customer One' },
      phoneNumber: '+16505550101',
    }));
    expect(callbacks.onRefreshContact).toHaveBeenCalledWith({
      phoneNumber: '+16505550101',
    });
    expect(callbacks.onDownload).toHaveBeenCalled();
    expect(callbacks.onClickAdditionalAction).toHaveBeenCalledWith('external', call);
  });

  it('builds create-contact and fallback text actions when no contact match exists', () => {
    const callbacks = {
      createSelectedContact: jest.fn(),
      onClickToSms: jest.fn(),
    };
    const call = createCall({
      toMatches: [],
    });
    const actions = callHelper.getActions({
      ...callbacks,
      areaCode: '650',
      call,
      countryCode: 'US',
      currentLocale: 'en-US',
      disableLinks: false,
      enableContactFallback: true,
      formatPhone: () => 'formatted-x-number',
      internalSmsPermission: true,
      isExtension: false,
      maxExtensionNumberLength: 6,
      onCreateContact: jest.fn(),
      outboundSmsPermission: true,
      readTextPermission: true,
      selected: -1,
    });

    clickAction(actions, 'c2sms');
    clickAction(actions, 'createContact');

    expect(callbacks.onClickToSms).toHaveBeenCalledWith(
      {
        name: 'Customer',
        phoneNumber: '+16505550101',
      },
      false,
    );
    expect(callbacks.createSelectedContact).toHaveBeenCalledWith(undefined);
  });
});

describe('ConversationItem helper', () => {
  it('selects phone numbers and matched contacts', () => {
    const conversation = createConversation({
      lastMatchedCorrespondentEntity: { id: 'contact-2' },
      correspondentMatches: [
        { id: 'contact-1' },
        { id: 'contact-2' },
      ],
    });

    expect(conversationHelper.getPhoneNumber(conversation)).toBe('+16505550101');
    expect(conversationHelper.getPhoneNumber({
      correspondents: [{ extensionNumber: '102' }],
    })).toBe('102');
    expect(conversationHelper.getInitialContactIndex({
      correspondentMatches: conversation.correspondentMatches,
      lastMatchedCorrespondentEntity: { id: 'contact-2' },
      showContactDisplayPlaceholder: true,
    })).toBe(1);
    expect(conversationHelper.getInitialContactIndex({
      correspondentMatches: conversation.correspondentMatches,
      showContactDisplayPlaceholder: true,
    })).toBe(-1);
    expect(conversationHelper.getSelectedContact(0, conversation.correspondentMatches)).toEqual({ id: 'contact-1' });
    expect(conversationHelper.getSelectedContact(-1, [{ id: 'only' }])).toEqual({ id: 'only' });
  });

  it('builds voicemail conversation actions', () => {
    const callbacks = {
      createSelectedContact: jest.fn(),
      logConversation: jest.fn(),
      markMessage: jest.fn(),
      onClickAdditionalAction: jest.fn(),
      onClickToDial: jest.fn(),
      onClickToSms: jest.fn(),
      onDelete: jest.fn(),
      onDownload: jest.fn(),
      onRefreshContact: jest.fn(),
      onViewContact: jest.fn(),
      previewFaxMessages: jest.fn(),
      unmarkMessage: jest.fn(),
      updateTypeFilter: jest.fn(),
    };
    const conversation = createConversation({
      conversationMatches: [{ id: 'log-1', type: 'log' }],
      unreadCounts: 0,
    });
    const actions = conversationHelper.getActions({
      ...callbacks,
      additionalActions: [{ id: 'external', icon: 'calendar', label: 'Open calendar' }],
      areaCode: '650',
      conversation,
      countryCode: 'US',
      currentLocale: 'en-US',
      disableCallButton: false,
      disableClickToDial: false,
      disableLinks: false,
      enableCDC: false,
      internalSmsPermission: true,
      isLogging: false,
      logButtonTitle: 'Log voicemail',
      maxExtensionNumberLength: 6,
      outboundSmsPermission: true,
      selected: 0,
      showLogButton: true,
    });

    expect(actions.map((item) => item.id)).toEqual([
      'log',
      'c2d',
      'c2sms',
      'mark',
      'download',
      'viewContact',
      'refreshContact',
      'delete',
      'external',
    ]);
    clickAction(actions, 'log');
    clickAction(actions, 'c2d');
    clickAction(actions, 'c2sms');
    clickAction(actions, 'mark');
    clickAction(actions, 'download');
    clickAction(actions, 'viewContact', { stopPropagation: jest.fn() });
    clickAction(actions, 'refreshContact');
    clickAction(actions, 'delete');
    clickAction(actions, 'external');

    expect(callbacks.logConversation).toHaveBeenCalled();
    expect(callbacks.onClickToDial).toHaveBeenCalledWith({
      id: 'contact-1',
      name: 'Customer One',
      phoneNumber: '+16505550101',
      fromType: messageTypes.voiceMail,
    });
    expect(callbacks.updateTypeFilter).toHaveBeenCalledWith(messageTypes.text);
    expect(callbacks.onClickToSms).toHaveBeenCalledWith({
      id: 'contact-1',
      name: 'Customer One',
      phoneNumber: '+16505550101',
    });
    expect(callbacks.markMessage).toHaveBeenCalledWith('conversation-1');
    expect(callbacks.onDownload).toHaveBeenCalled();
    expect(callbacks.onViewContact).toHaveBeenCalledWith(expect.objectContaining({
      contact: { id: 'contact-1', name: 'Customer One' },
      matchEntitiesIds: ['contact-1'],
      phoneNumber: '+16505550101',
    }));
    expect(callbacks.onRefreshContact).toHaveBeenCalledWith({
      phoneNumber: '+16505550101',
    });
    expect(callbacks.onDelete).toHaveBeenCalled();
    expect(callbacks.onClickAdditionalAction).toHaveBeenCalledWith('external', conversation);
  });

  it('builds fax, thread, unread, and create-contact actions', () => {
    const callbacks = {
      createSelectedContact: jest.fn(),
      markMessage: jest.fn(),
      onAssign: jest.fn(),
      onCreateContact: jest.fn(),
      onDelete: jest.fn(),
      onDownload: jest.fn(),
      onResolveThread: jest.fn(),
      onUnassign: jest.fn(),
      onViewContact: jest.fn(),
      previewFaxMessages: jest.fn(),
      unmarkMessage: jest.fn(),
    };
    const fax = createConversation({
      faxAttachment: { uri: 'https://media.example.com/fax' },
      type: messageTypes.fax,
      unreadCounts: 2,
      voicemailAttachment: null,
    });
    const faxActions = conversationHelper.getActions({
      ...callbacks,
      areaCode: '650',
      conversation: fax,
      countryCode: 'US',
      currentLocale: 'en-US',
      disableLinks: false,
      selected: 0,
    });
    clickAction(faxActions, 'mark');
    clickAction(faxActions, 'preview');
    clickAction(faxActions, 'download');
    clickAction(faxActions, 'delete');

    expect(callbacks.unmarkMessage).toHaveBeenCalledWith('conversation-1');
    expect(callbacks.previewFaxMessages).toHaveBeenCalledWith(
      'https://media.example.com/fax',
      'conversation-1',
    );
    expect(callbacks.onDownload).toHaveBeenCalled();
    expect(callbacks.onDelete).toHaveBeenCalled();

    const thread = createConversation({
      assignee: { id: 'agent-1' },
      status: 'Open',
      type: 'Thread',
    });
    const threadActions = conversationHelper.getActions({
      ...callbacks,
      areaCode: '650',
      conversation: thread,
      countryCode: 'US',
      currentLocale: 'en-US',
      disableLinks: false,
      selected: 0,
    });
    clickAction(threadActions, 'assign');
    clickAction(threadActions, 'unassign');
    clickAction(threadActions, 'resolve');
    expect(callbacks.onAssign).toHaveBeenCalled();
    expect(callbacks.onUnassign).toHaveBeenCalled();
    expect(callbacks.onResolveThread).toHaveBeenCalled();

    const noContact = createConversation({
      correspondentMatches: [],
    });
    const noContactActions = conversationHelper.getActions({
      ...callbacks,
      areaCode: '650',
      conversation: noContact,
      countryCode: 'US',
      currentLocale: 'en-US',
      disableLinks: false,
      selected: -1,
    });
    clickAction(noContactActions, 'createContact');
    expect(callbacks.createSelectedContact).toHaveBeenCalled();
  });
});
