/** @jest-environment jsdom */
const React = require('react');
const { fireEvent, render, screen } = require('@testing-library/react');
const callDirections = require('@ringcentral-integration/commons/enums/callDirections').default;
const { setStagedState } = require('@ringcentral-integration/core/lib/usm-redux/utils');

jest.mock('@ringcentral-integration/widgets/modules/ContactDetailsUI', () => ({
  ContactDetailsUI: class BaseContactDetailsUI {
    constructor(deps) {
      this._deps = deps;
      this.currentContact = deps.currentContact || null;
      this._trackClickToSMS = jest.fn();
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

const { ContactDetailsUI } = require('../../src/modules/ContactDetailsUI');
const { GlipChatUI } = require('../../src/modules/GlipChatUI');
const { LogCallUI } = require('../../src/modules/LogCallUI');
const { LogMessagesUI } = require('../../src/modules/LogMessagesUI');
const { ParkUI } = require('../../src/modules/ParkUI');

function createFormatDeps(overrides = {}) {
  return {
    accountInfo: {
      maxExtensionNumberLength: 6,
    },
    extensionInfo: {
      isMultipleSiteEnabled: true,
      site: {
        code: '101',
      },
    },
    regionSettings: {
      areaCode: '650',
      countryCode: 'US',
    },
    ...overrides,
  };
}

function createGlipDeps(overrides = {}) {
  return {
    dateTimeFormat: {
      formatDateTime: jest.fn(() => 'formatted-date'),
    },
    glipGroups: {
      allGroups: [{
        id: 'team-1',
        name: 'Engineering',
      }],
      currentGroup: {
        detailMembers: [{
          email: 'grace@example.com',
          id: 'person-2',
        }],
        id: 'group-1',
      },
      currentGroupId: 'group-1',
      currentGroupPosts: [{ id: 'post-1' }],
      groups: [{
        id: 'private-1',
        members: ['person-1'],
        type: 'PrivateChat',
      }],
      startChat: jest.fn(async (personId) => ({
        id: `chat-${personId}`,
      })),
      updateCurrentGroupId: jest.fn(),
    },
    glipPersons: {
      me: {
        id: 'me',
      },
      personsMap: {
        'person-1': {
          firstName: 'Ada',
          lastName: 'Lovelace',
        },
      },
    },
    glipPosts: {
      create: jest.fn(async () => {}),
      loadNextPage: jest.fn(async () => {}),
      postInputs: {
        'group-1': {
          mentions: [{ mention: '@Old', matcherId: 'old-person' }],
          text: 'draft',
        },
      },
      sendFile: jest.fn(async () => {}),
      updatePostInput: jest.fn(),
    },
    routerInteraction: {
      push: jest.fn(),
    },
    sideDrawerUI: {
      gotoGlipChat: jest.fn(),
    },
    ...overrides,
  };
}

function createLogMessagesDeps(overrides = {}) {
  return {
    ...createFormatDeps(),
    contactMatcher: {
      dataMapping: {
        '+16505550123': [{ id: 'contact-1' }],
      },
    },
    conversationLogger: {
      conversationLogMap: {
        'conversation-1': {
          '2026-01-01': {
            conversationLogId: 'log-1',
            correspondents: [{ phoneNumber: '+16505550123' }],
          },
        },
      },
      getLastMatchedCorrespondentEntity: jest.fn(() => ({ id: 'contact-1' })),
      loggingMap: {
        'log-1': true,
      },
      logConversation: jest.fn(async () => {}),
    },
    dateTimeFormat: {
      formatDateTime: jest.fn(() => 'formatted-date'),
    },
    locale: {
      currentLocale: 'en-US',
    },
    routerInteraction: {
      goBack: jest.fn(),
    },
    sideDrawerUI: {
      closeWidget: jest.fn(),
      hasWidget: jest.fn(() => true),
    },
    thirdPartyService: {
      customizedLogMessagesPage: { id: 'message-page' },
      onClickButtonInCustomizedPage: jest.fn(),
      onCustomizedLogMessagesPageInputChanged: jest.fn(),
    },
    ...overrides,
  };
}

function createCall(overrides = {}) {
  return {
    sessionId: 'session-1',
    telephonySessionId: 'telephony-1',
    to: {
      phoneNumber: '+16505550123',
    },
    ...overrides,
  };
}

function createLogCallDeps(overrides = {}) {
  return {
    ...createFormatDeps(),
    activityMatcher: {
      match: jest.fn(),
    },
    callLogger: {
      allCallMapping: {
        'session-1': createCall(),
      },
      loggingMap: {
        'session-1': true,
      },
      logCall: jest.fn(async () => {}),
    },
    dateTimeFormat: {
      formatDateTime: jest.fn(() => 'formatted-date'),
    },
    locale: {
      currentLocale: 'en-US',
    },
    routerInteraction: {
      goBack: jest.fn(),
    },
    sideDrawerUI: {
      closeWidget: jest.fn(),
      hasWidget: jest.fn(() => true),
    },
    smartNotes: {
      fetchSmartNoteText: jest.fn(),
      smartNoteTextMapping: {
        'telephony-1': 'AI note',
      },
    },
    thirdPartyService: {
      customizedLogCallPage: { id: 'call-page' },
      onClickButtonInCustomizedPage: jest.fn(),
      onCustomizedLogCallPageInputChanged: jest.fn(),
    },
    ...overrides,
  };
}

function createParkDeps(overrides = {}) {
  return {
    ...createFormatDeps(),
    composeText: {
      updateMessageText: jest.fn(),
    },
    composeTextUI: {
      gotoComposeText: jest.fn(),
    },
    locale: {
      currentLocale: 'en-US',
    },
    monitoredExtensions: {
      parkLocations: [{
        extension: {
          extensionNumber: '801',
          id: 'park-extension-1',
        },
        id: 'park-1',
      }],
    },
    phoneNumberFormat: {
      format: jest.fn(({ phoneNumber }) => `formatted-${phoneNumber}`),
    },
    routerInteraction: {
      goBack: jest.fn(),
      replace: jest.fn(),
    },
    webphone: {
      park: jest.fn(async () => '801'),
      parkToLocation: jest.fn(async () => '802'),
      sessions: [{
        direction: callDirections.inbound,
        from: '+16505550123',
        id: 'session-1',
        to: '+16505550100',
      }],
    },
    ...overrides,
  };
}

function createContactDetailsDeps(overrides = {}) {
  return {
    ...createFormatDeps(),
    composeTextUI: {
      gotoComposeText: jest.fn(),
    },
    currentContact: {
      id: 'contact-1',
      name: 'Customer',
    },
    dateTimeFormat: {
      formatDateTime: jest.fn(() => 'formatted-date'),
    },
    phoneNumberFormat: {
      format: jest.fn(({ phoneNumber }) => `formatted-${phoneNumber}`),
    },
    recentCalls: {
      calls: {
        'contact-1': [{ id: 'call-1' }],
      },
      cleanUpCalls: jest.fn(async () => {}),
      getCalls: jest.fn(async () => {}),
      isCallsLoaded: true,
    },
    recentMessages: {
      cleanUpMessages: jest.fn(async () => {}),
      getMessages: jest.fn(async () => {}),
      isMessagesLoaded: true,
      messages: {
        'contact-1': [{ id: 'message-1' }],
      },
      unreadMessageCounts: {
        'contact-1': 2,
      },
    },
    sideDrawerUI: {
      openAppTab: jest.fn(),
    },
    theme: {
      themeType: 'light',
    },
    thirdPartyService: {
      activities: [{ id: 'activity-1' }],
      activitiesLoaded: true,
      activitiesRegistered: true,
      activitiesTabName: 'CRM activities',
      additionalContactActions: [{ id: 'crm-action' }],
      apps: [{ id: 'app-1', name: 'CRM' }],
      fetchActivities: jest.fn(async () => {}),
      loadAppPage: jest.fn(async () => {}),
      onClickAdditionalButton: jest.fn(),
      openActivity: jest.fn(async () => {}),
      pinAppIds: ['app-1'],
      serviceName: 'CRM',
      toggleAppPin: jest.fn(),
    },
    ...overrides,
  };
}

describe('small UI modules', () => {
  beforeEach(() => {
    setStagedState({});
  });

  afterEach(() => {
    setStagedState(undefined);
    jest.clearAllMocks();
  });

  it('builds Glip chat props, actions, mention rendering, and profile routing', async () => {
    const deps = createGlipDeps();
    const ui = new GlipChatUI(deps);
    expect(ui.getUIProps({ params: { groupId: 'group-1' } })).toMatchObject({
      group: deps.glipGroups.currentGroup,
      groupId: 'group-1',
      posts: [{ id: 'post-1' }],
      textValue: 'draft',
    });

    const funcs = ui.getUIFunctions({ params: { groupId: 'group-1' } });
    funcs.onBack();
    expect(deps.routerInteraction.push).toHaveBeenCalledWith('/glip');
    await funcs.viewProfile('');
    await funcs.viewProfile('me');
    await funcs.viewProfile('person-1');
    expect(deps.sideDrawerUI.gotoGlipChat).toHaveBeenCalledWith('private-1');
    await funcs.viewProfile('person-3');
    expect(deps.glipGroups.startChat).toHaveBeenCalledWith('person-3');
    expect(deps.sideDrawerUI.gotoGlipChat).toHaveBeenCalledWith('chat-person-3');
    expect(funcs.dateTimeFormatter(1000)).toBe('formatted-date');
    funcs.loadGroup('group-2');
    await funcs.loadNextPage();
    await funcs.createPost();
    expect(deps.glipGroups.updateCurrentGroupId).toHaveBeenCalledWith('group-2');
    expect(deps.glipPosts.loadNextPage).toHaveBeenCalledWith('group-1');
    expect(deps.glipPosts.create).toHaveBeenCalledWith({ groupId: 'group-1' });
    funcs.updateText('hello', [{ id: 'grace@example.com', mention: '@Grace' }]);
    expect(deps.glipPosts.updatePostInput).toHaveBeenCalledWith({
      groupId: 'group-1',
      mentions: [{ matcherId: 'person-2', mention: '@Grace' }],
      text: 'hello',
    });
    funcs.updateText('reuse mentions');
    expect(deps.glipPosts.updatePostInput).toHaveBeenLastCalledWith({
      groupId: 'group-1',
      mentions: [{ mention: '@Old', matcherId: 'old-person' }],
      text: 'reuse mentions',
    });
    await funcs.uploadFile('file.txt', new Blob(['file']));
    expect(deps.glipPosts.sendFile).toHaveBeenCalledWith({
      fileName: 'file.txt',
      groupId: 'group-1',
      rawFile: expect.any(Blob),
    });

    const AtRender = funcs.atRender;
    render(
      <div>
        <AtRender id="person-1" type="Person" />
        <AtRender id="team-1" type="Team" />
        <AtRender id="all" type="All" />
      </div>,
    );
    expect(screen.getByText('@Ada Lovelace')).toBeTruthy();
    expect(screen.getByText('@team-1')).toBeTruthy();
    expect(screen.getByText('@Team')).toBeTruthy();
    fireEvent.click(screen.getByText('@team-1'));
    expect(deps.sideDrawerUI.gotoGlipChat).toHaveBeenCalledWith('team-1');
  });

  it('builds log messages props and functions', async () => {
    const deps = createLogMessagesDeps();
    const ui = new LogMessagesUI(deps);
    expect(ui.getUIProps({ params: { conversationId: 'conversation-1' } })).toMatchObject({
      conversationLog: deps.conversationLogger.conversationLogMap['conversation-1'],
      correspondentMatches: [{ id: 'contact-1' }],
      currentLocale: 'en-US',
      customizedPage: { id: 'message-page' },
      isLogging: true,
      lastMatchedCorrespondentEntity: { id: 'contact-1' },
    });

    const funcs = ui.getUIFunctions({});
    funcs.onBackButtonClick();
    expect(deps.routerInteraction.goBack).toHaveBeenCalled();
    await funcs.onSaveLog({ conversationId: 'conversation-1', formData: { note: 'message note' } });
    expect(deps.conversationLogger.logConversation).toHaveBeenCalledWith({
      conversationId: 'conversation-1',
      formData: { note: 'message note' },
      redirect: true,
      triggerType: 'logForm',
    });
    expect(deps.sideDrawerUI.closeWidget).toHaveBeenCalledWith('logConversation');
    deps.sideDrawerUI.hasWidget.mockReturnValueOnce(false);
    await funcs.onSaveLog({ conversationId: 'conversation-1', formData: {} });
    expect(deps.routerInteraction.goBack).toHaveBeenCalledTimes(2);
    expect(funcs.formatPhone('+16505550123')).toContain('(650)');
    expect(funcs.dateTimeFormatter({ utcTimestamp: 1000 })).toBe('formatted-date');
    funcs.onCustomizedFieldChange({ id: 'conversation-1' }, { note: 'changed' }, ['note']);
    expect(deps.thirdPartyService.onCustomizedLogMessagesPageInputChanged).toHaveBeenCalledWith({
      conversation: { id: 'conversation-1' },
      formData: { note: 'changed' },
      keys: ['note'],
    });
    funcs.onFormPageButtonClick('save-extra', { value: 1 });
    expect(deps.thirdPartyService.onClickButtonInCustomizedPage).toHaveBeenCalledWith(
      'save-extra',
      'button',
      { value: 1 },
    );
  });

  it('builds log call props and functions', async () => {
    const deps = createLogCallDeps();
    const ui = new LogCallUI(deps);
    const funcs = ui.getUIFunctions({});
    funcs.onViewCall('session-1');
    expect(ui.currentCall).toEqual(createCall());
    expect(ui.getUIProps({ params: { callSessionId: 'session-1' } })).toMatchObject({
      currentCall: createCall(),
      currentLocale: 'en-US',
      customizedPage: { id: 'call-page' },
      isLogging: true,
      sessionId: 'session-1',
      smartNote: 'AI note',
    });

    funcs.onBackButtonClick();
    expect(deps.routerInteraction.goBack).toHaveBeenCalled();
    funcs.onViewCall('missing');
    expect(deps.sideDrawerUI.closeWidget).toHaveBeenCalledWith('logCall');
    await funcs.onSave({ call: createCall(), formData: { note: 'saved' }, note: 'saved' });
    expect(deps.callLogger.logCall).toHaveBeenCalledWith({
      call: createCall(),
      formData: { note: 'saved' },
      note: 'saved',
      redirect: true,
      triggerType: 'logForm',
    });
    expect(deps.sideDrawerUI.closeWidget).toHaveBeenCalledWith('logCall');
    deps.sideDrawerUI.hasWidget.mockReturnValueOnce(false);
    await funcs.onSave({ call: createCall(), formData: {}, note: '' });
    expect(deps.routerInteraction.goBack).toHaveBeenCalledTimes(2);
    funcs.onLoadData(createCall());
    expect(deps.activityMatcher.match).toHaveBeenCalledWith({
      ignoreCache: true,
      queries: ['session-1'],
    });
    expect(deps.smartNotes.fetchSmartNoteText).toHaveBeenCalledWith('telephony-1');
    expect(funcs.formatPhone('+16505550123')).toContain('(650)');
    expect(funcs.dateTimeFormatter({ utcTimestamp: 1000 })).toBe('formatted-date');
    funcs.onCustomizedFieldChange(createCall(), { note: 'changed' }, ['note']);
    expect(deps.thirdPartyService.onCustomizedLogCallPageInputChanged).toHaveBeenCalledWith({
      call: createCall(),
      formData: { note: 'changed' },
      keys: ['note'],
    });
    funcs.onFormPageButtonClick('call-button', { value: 1 });
    expect(deps.thirdPartyService.onClickButtonInCustomizedPage).toHaveBeenCalledWith(
      'call-button',
      'button',
      { value: 1 },
    );
  });

  it('builds park props and handles park, text, back, and call-end actions', async () => {
    const deps = createParkDeps();
    const ui = new ParkUI(deps);
    expect(ui.getUIProps({ params: { sessionId: 'session-1' } })).toMatchObject({
      currentLocale: 'en-US',
      parkLocations: deps.monitoredExtensions.parkLocations,
      session: deps.webphone.sessions[0],
      sessionId: 'session-1',
    });

    const funcs = ui.getUIFunctions({ params: { sessionId: 'session-1' } });
    funcs.onBack();
    funcs.onCallEnd();
    expect(deps.routerInteraction.goBack).toHaveBeenCalled();
    expect(deps.routerInteraction.replace).toHaveBeenCalledWith('/dialer');
    expect(funcs.formatPhone('+16505550123')).toBe('formatted-+16505550123');
    await expect(funcs.onPark()).resolves.toEqual({
      destination: '801',
      fromNumber: '+16505550123',
    });
    await expect(funcs.onPark('park-1')).resolves.toEqual({
      destination: '802',
      fromNumber: '+16505550123',
    });
    expect(deps.webphone.parkToLocation).toHaveBeenCalledWith(
      'session-1',
      { extensionNumber: '801', id: 'park-extension-1' },
    );
    await expect(funcs.onPark('missing')).resolves.toBeNull();
    deps.webphone.sessions = [];
    await expect(funcs.onPark()).resolves.toBeUndefined();
    await funcs.onText('Parked at 801');
    expect(deps.composeTextUI.gotoComposeText).toHaveBeenCalled();
    expect(deps.composeText.updateMessageText).toHaveBeenCalledWith('Parked at 801');
    await funcs.onText('');
    expect(deps.composeText.updateMessageText).toHaveBeenCalledTimes(1);
  });

  it('builds contact details props and actions for activities, apps, calls, messages, and SMS', async () => {
    const deps = createContactDetailsDeps();
    const ui = new ContactDetailsUI(deps);
    expect(ui.getUIProps()).toMatchObject({
      activities: [{ id: 'activity-1' }],
      activitiesLoaded: true,
      activitiesTabName: 'CRM activities',
      additionalActions: [{ id: 'crm-action' }],
      apps: [{ id: 'app-1', name: 'CRM' }],
      baseProp: true,
      callLoaded: true,
      calls: [{ id: 'call-1' }],
      messages: [{ id: 'message-1' }],
      messagesLoaded: true,
      pinAppIds: ['app-1'],
      showActivities: true,
      showApps: true,
      unreadMessageCounts: 2,
    });

    await ui.handleClickToSMS({ id: 'contact-1' }, '+16505550123');
    expect(deps.composeTextUI.gotoComposeText).toHaveBeenCalledWith({
      id: 'contact-1',
      phoneNumber: '+16505550123',
    }, false);
    expect(ui._trackClickToSMS).toHaveBeenCalled();

    const navigateTo = jest.fn();
    const funcs = ui.getUIFunctions({ params: { contactId: 'contact-1' }, navigateTo });
    expect(funcs.navigateTo).toBe(navigateTo);
    await funcs.loadCalls();
    await funcs.clearCalls();
    await funcs.loadMessages();
    await funcs.clearMessages();
    await funcs.loadActivities();
    await funcs.openActivityDetail({ id: 'activity-1' });
    expect(deps.recentCalls.getCalls).toHaveBeenCalledWith({ currentContact: deps.currentContact });
    expect(deps.recentCalls.cleanUpCalls).toHaveBeenCalledWith({ contact: deps.currentContact });
    expect(deps.recentMessages.getMessages).toHaveBeenCalledWith({ currentContact: deps.currentContact });
    expect(deps.recentMessages.cleanUpMessages).toHaveBeenCalledWith({ contact: deps.currentContact });
    expect(deps.thirdPartyService.fetchActivities).toHaveBeenCalledWith(deps.currentContact);
    expect(deps.thirdPartyService.openActivity).toHaveBeenCalledWith({ id: 'activity-1' });
    await funcs.clearActivities();
    await funcs.onLoadApp({ appId: 'app-1' });
    expect(deps.thirdPartyService.loadAppPage).toHaveBeenCalledWith({
      appId: 'app-1',
      theme: 'light',
    });
    funcs.toggleAppPin('app-1');
    funcs.openAppTab({ id: 'app-1' }, deps.currentContact);
    funcs.onClickAdditionalAction('crm-action', deps.currentContact);
    expect(deps.thirdPartyService.toggleAppPin).toHaveBeenCalledWith('app-1');
    expect(deps.sideDrawerUI.openAppTab).toHaveBeenCalledWith({ id: 'app-1' }, deps.currentContact);
    expect(deps.thirdPartyService.onClickAdditionalButton).toHaveBeenCalledWith(
      'crm-action',
      deps.currentContact,
    );
    expect(funcs.formatNumber('+16505550123')).toBe('formatted-+16505550123');
    expect(funcs.dateTimeFormatter({ utcTimestamp: 1000 })).toBe('formatted-date');
  });
});
