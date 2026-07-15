const { setStagedState } = require('@ringcentral-integration/core/lib/usm-redux/utils');
const callDirections = require('@ringcentral-integration/commons/enums/callDirections').default;
const messageTypes = require('@ringcentral-integration/commons/enums/messageTypes').default;
const recordStatus = require('@ringcentral-integration/commons/modules/Webphone/recordStatus').default;
const sessionStatus = require('@ringcentral-integration/commons/modules/Webphone/sessionStatus').default;
const webphoneErrors = require('@ringcentral-integration/commons/modules/Webphone/webphoneErrors').default;

jest.mock('@ringcentral-integration/widgets/modules/CallControlUI', () => ({
  CallControlUI: class BaseCallControlUI {
    constructor(deps) {
      this._deps = deps;
      this.currentSession = deps.webphone.sessions[0];
    }

    getUIProps() {
      return {
        baseProp: true,
        session: this._deps.webphone.sessions[0],
      };
    }

    getUIFunctions() {
      return {
        baseFunction: jest.fn(),
      };
    }
  },
}));

jest.mock('@ringcentral-integration/widgets/modules/ConversationsUI', () => ({
  ConversationsUI: class BaseConversationsUI {
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

jest.mock('../../src/components/MainViewPanel/i18n', () => ({
  getString: jest.fn((key) => key),
}));

jest.mock('@ringcentral-integration/widgets/modules/IncomingCallUI', () => ({
  IncomingCallUI: class BaseIncomingCallUI {
    constructor(deps) {
      this._deps = deps;
    }

    getUIFunctions() {
      return {
        baseFunction: jest.fn(),
      };
    }
  },
}));

const { CallControlUI } = require('../../src/modules/CallControlUI');
const { CallDetailsUI } = require('../../src/modules/CallDetailsUI');
const { ConversationsUI } = require('../../src/modules/ConversationsUI');
const { IncomingCallUI } = require('../../src/modules/IncomingCallUI');
const { MessageDetailsUI } = require('../../src/modules/MessageDetailsUI');

function createCallControlDeps(overrides = {}) {
  const webphoneSession = {
    direction: callDirections.outbound,
    id: 'webphone-1',
    partyData: {
      partyId: 'party-1',
      sessionId: 'telephony-1',
    },
    recordStatus: recordStatus.idle,
    status: sessionStatus.connected,
    to: '+16505550123',
    voicemailDropStatus: false,
  };
  return {
    accountInfo: {
      maxExtensionNumberLength: 6,
    },
    activeCallControl: {
      getActiveSession: jest.fn(() => ({
        recordStatus: recordStatus.recording,
        to: '+16505550123',
      })),
      startRecord: jest.fn(async () => {}),
      stopRecord: jest.fn(async () => {}),
    },
    alert: {
      danger: jest.fn(),
    },
    appFeatures: {
      hasCallControl: true,
      hasVoicemailDropPermission: true,
    },
    call: {
      cleanToNumberEntities: jest.fn(),
      toNumberEntities: [{ entityId: 'contact-1' }],
    },
    contactMatcher: {
      callMatched: {
        'telephony-1': 'contact-2',
      },
      setCallMatched: jest.fn(),
    },
    extensionInfo: {
      isMultipleSiteEnabled: true,
      site: {
        code: '101',
      },
    },
    monitoredExtensions: {
      parkLocations: [{ id: 'park-1' }],
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
    sideDrawerUI: {
      openVoicemailDrop: jest.fn(),
    },
    webphone: {
      hold: jest.fn(async () => {}),
      mute: jest.fn(async () => {}),
      park: jest.fn(),
      sessions: [webphoneSession],
      startRecord: jest.fn(async () => {}),
      stopRecord: jest.fn(async () => {}),
      unhold: jest.fn(async () => {}),
      unmute: jest.fn(async () => {}),
      updateRecordStatus: jest.fn(),
      updateSessionMatchedContact: jest.fn(async () => {}),
    },
    ...overrides,
  };
}

function createConversation(overrides = {}) {
  return {
    conversationId: 'conversation-1',
    from: { phoneNumber: '+16505550100' },
    id: 'conversation-item-1',
    owner: {
      extensionId: 'owner-1',
    },
    to: [{ phoneNumber: '+16505550123' }],
    type: messageTypes.sms,
    ...overrides,
  };
}

function createConversationsDeps(overrides = {}) {
  return {
    accountInfo: {
      maxExtensionNumberLength: 6,
    },
    appFeatures: {
      hasComposeTextPermission: true,
      hasSharedSmsAccess: true,
    },
    auth: {
      accessToken: 'access-token',
    },
    composeTextUI: {
      gotoComposeText: jest.fn(),
    },
    contactMatcher: {
      forceMatchNumber: jest.fn(),
      setManualRefreshNumber: jest.fn(),
    },
    conversationLogger: {
      loggerSourceReady: true,
      logButtonTitle: 'Log message',
      logConversation: jest.fn(async () => {}),
    },
    conversations: {
      allConversations: [createConversation()],
      formattedMessageThreads: [{
        guestParty: {
          phoneNumber: '+16505550124',
        },
        id: 'thread-1',
      }],
      hasMessageThreadsPermission: true,
      hasSharedSmsAccess: true,
      ownerFilter: 'Personal',
      pagingConversations: [createConversation()],
      searchFilter: 'All',
      typeFilter: messageTypes.text,
      updateOwnerFilter: jest.fn(),
      updateSearchFilter: jest.fn(),
      updateSearchInput: jest.fn(),
    },
    extensionInfo: {
      isMultipleSiteEnabled: true,
      site: {
        code: '101',
      },
    },
    messageStore: {
      onClickToSMS: jest.fn(),
      personalTextUnreadCounts: 2,
      sharedTextUnreadCounts: 3,
      unreadMessage: jest.fn(),
    },
    locale: {
      currentLocale: 'en-US',
      ready: true,
    },
    messageThreads: {
      assign: jest.fn(async () => {}),
      busy: false,
      getSMSRecipients: jest.fn(() => [{ phoneNumber: '+16505550123' }]),
      markAsUnread: jest.fn(),
      resolve: jest.fn(async () => {}),
      unreadCounts: 4,
    },
    phoneNumberFormat: {
      format: jest.fn(({ phoneNumber }) => `formatted-${phoneNumber}`),
    },
    regionSettings: {
      areaCode: '650',
      countryCode: 'US',
    },
    sideDrawerUI: {
      gotoConversation: jest.fn(),
      gotoMessageDetails: jest.fn(),
    },
    thirdPartyService: {
      additionalMessageActions: [{ id: 'crm' }],
      onClickAdditionalButton: jest.fn(),
    },
    ...overrides,
  };
}

function createMessage(overrides = {}) {
  return {
    conversation: {
      id: 'conversation-1',
    },
    from: {
      phoneNumber: '+16505550123',
    },
    id: 'message-1',
    type: messageTypes.voiceMail,
    ...overrides,
  };
}

function createMessageDetailsDeps(overrides = {}) {
  const message = createMessage();
  return {
    accountInfo: {
      maxExtensionNumberLength: 6,
    },
    appFeatures: {
      hasComposeTextPermission: true,
      hasInternalSMSPermission: true,
      hasOutboundSMSPermission: true,
      isCallingEnabled: true,
      isCDCEnabled: true,
      ready: true,
    },
    auth: {
      accessToken: 'access-token',
    },
    brand: {
      name: 'RingCentral',
    },
    call: {
      isIdle: true,
      ready: true,
    },
    composeTextUI: {
      gotoComposeText: jest.fn(),
    },
    connectivityManager: {
      isOfflineMode: false,
      isVoipOnlyMode: false,
      isWebphoneInitializing: false,
      isWebphoneUnavailableMode: false,
    },
    connectivityMonitor: {
      ready: true,
    },
    contactMatcher: {
      forceMatchNumber: jest.fn(async () => {}),
      hasMatchNumber: jest.fn(async () => false),
      ready: true,
    },
    conversationLogger: {
      autoLog: false,
      loggerSourceReady: true,
      logButtonTitle: 'Log message',
      logConversation: jest.fn(async () => {}),
      ready: true,
    },
    conversations: {
      deleteConversation: jest.fn(),
      formattedConversations: [message],
      ready: true,
    },
    dateTimeFormat: {
      formatDateTime: jest.fn(() => 'formatted-date'),
      ready: true,
    },
    dialerUI: {
      call: jest.fn(),
    },
    extensionInfo: {
      isMultipleSiteEnabled: true,
      site: {
        code: '101',
      },
    },
    locale: {
      currentLocale: 'en-US',
      ready: true,
    },
    messageStore: {
      fetchVoicemailTranscription: jest.fn(),
      onClickToCall: jest.fn(),
      onClickToSMS: jest.fn(),
      onUnmarkMessages: jest.fn(),
      readMessages: jest.fn(),
      unreadMessage: jest.fn(),
      voicemailTranscriptionMap: {
        'message-1': 'transcription text',
      },
    },
    phoneNumberFormat: {
      format: jest.fn(({ phoneNumber }) => `formatted-${phoneNumber}`),
    },
    rateLimiter: {
      ready: true,
      throttling: false,
    },
    regionSettings: {
      areaCode: '650',
      countryCode: 'US',
      ready: true,
    },
    routerInteraction: {
      push: jest.fn(),
    },
    sideDrawerUI: {
      closeWidget: jest.fn(),
      gotoContactDetails: jest.fn(),
    },
    thirdPartyService: {
      additionalMessageActions: [{ id: 'crm' }],
      onClickAdditionalButton: jest.fn(),
      onViewMatchedContactExternal: jest.fn(),
      sourceName: 'crm',
      viewMatchedContactExternal: true,
    },
    ...overrides,
  };
}

function createCallDetailsDeps(overrides = {}) {
  const currentCall = {
    activityMatches: [],
    direction: callDirections.outbound,
    from: {
      phoneNumber: '+16505550100',
    },
    recording: {
      contentUri: 'https://example.com/recording',
    },
    sessionId: 'call-session-1',
    telephonySessionId: 'telephony-1',
    to: {
      phoneNumber: '+16505550123',
    },
  };
  return {
    accountInfo: {
      maxExtensionNumberLength: 6,
    },
    appFeatures: {
      hasInternalSMSPermission: true,
      hasOutboundSMSPermission: true,
      hasReadTextPermission: true,
      isCallingEnabled: true,
      isCDCEnabled: true,
    },
    auth: {
      accessToken: 'access-token',
    },
    brand: {
      name: 'RingCentral',
    },
    call: {
      isIdle: true,
    },
    callHistory: {
      latestCalls: [currentCall],
      onClickToCall: jest.fn(),
      onClickToSMS: jest.fn(),
    },
    callLogger: {
      autoLog: true,
      hideEditLogButton: false,
      logButtonTitle: 'Log call',
      logCall: jest.fn(async () => {}),
      loggingMap: {
        'call-session-1': true,
      },
      ready: true,
      showLogModal: false,
    },
    composeText: {},
    composeTextUI: {
      gotoComposeText: jest.fn(),
    },
    connectivityManager: {
      isOfflineMode: false,
      isWebphoneInitializing: false,
      isWebphoneUnavailableMode: false,
    },
    connectivityMonitor: {
      connectivity: true,
    },
    contactMatcher: {
      forceMatchNumber: jest.fn(async () => {}),
      hasMatchNumber: jest.fn(async () => false),
    },
    dateTimeFormat: {
      formatDateTime: jest.fn(() => 'formatted-date'),
    },
    dialerUI: {
      call: jest.fn(),
    },
    extensionInfo: {
      isMultipleSiteEnabled: true,
      site: {
        code: '101',
      },
    },
    locale: {
      currentLocale: 'en-US',
    },
    phoneNumberFormat: {
      format: jest.fn(({ phoneNumber }) => `formatted-${phoneNumber}`),
    },
    rateLimiter: {
      throttling: false,
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
      gotoContactDetails: jest.fn(),
      gotoLogCall: jest.fn(),
    },
    smartNotes: {
      aiNotedCallMapping: {
        'telephony-1': true,
      },
      setSession: jest.fn(),
    },
    thirdPartyService: {
      additionalCallActions: [{ id: 'crm' }],
      onClickAdditionalButton: jest.fn(),
      onViewMatchedContactExternal: jest.fn(),
      sourceName: 'crm',
      viewMatchedContactExternal: true,
    },
    ...overrides,
  };
}

function createIncomingCallDeps(overrides = {}) {
  const platform = {
    post: jest.fn(async () => ({ ok: true })),
  };
  return {
    accountInfo: {
      maxExtensionNumberLength: 6,
    },
    alert: {
      warning: jest.fn(),
    },
    brand: {
      brandConfig: {
        allowRegionSettings: true,
      },
    },
    client: {
      service: {
        platform: jest.fn(() => platform),
      },
    },
    contactMatcher: {
      setCallMatched: jest.fn(),
    },
    extensionInfo: {
      isMultipleSiteEnabled: true,
      site: {
        code: '101',
      },
    },
    phoneNumberFormat: {
      format: jest.fn(({ phoneNumber }) => `formatted-${phoneNumber}`),
    },
    regionSettings: {
      areaCode: '650',
      countryCode: 'US',
    },
    webphone: {
      forward: jest.fn(async () => true),
      ignore: jest.fn(),
      sessions: [{
        callId: 'call-id-1',
        id: 'webphone-1',
        partyData: {
          partyId: 'party-1',
          sessionId: 'telephony-1',
        },
      }],
      setForwardFlag: jest.fn(async () => {}),
      startReply: jest.fn(),
      updateSessionMatchedContact: jest.fn(),
    },
    ...overrides,
    platform,
  };
}

describe('UI wrapper modules', () => {
  beforeEach(() => {
    setStagedState({});
  });

  afterEach(() => {
    setStagedState(undefined);
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('adapts call-control props and actions for call-control and webphone sessions', async () => {
    const deps = createCallControlDeps();
    const callControlUI = new CallControlUI(deps);
    callControlUI.trackMute = jest.fn();
    callControlUI.trackUnmute = jest.fn();
    callControlUI.trackHold = jest.fn();
    callControlUI.trackUnhold = jest.fn();

    expect(callControlUI.getUIProps({})).toMatchObject({
      baseProp: true,
      session: {
        recordStatus: recordStatus.recording,
      },
      showVoicemailDrop: true,
      voicemailDropStatus: false,
    });

    deps.webphone.sessions[0].status = sessionStatus.connecting;
    expect(callControlUI.getUIProps({}).session.recordStatus).toBe(recordStatus.pending);

    const functions = callControlUI.getUIFunctions({});
    expect(functions.formatPhone('+16505550123')).toBe('formatted-+16505550123');
    functions.onVoicemailDrop('webphone-1');
    expect(deps.sideDrawerUI.openVoicemailDrop).toHaveBeenCalledWith(
      'webphone-1',
      { phoneNumber: '+16505550123' },
    );

    await functions.onMute('webphone-1');
    await functions.onUnmute('webphone-1');
    await functions.onHold('webphone-1');
    await functions.onUnhold('webphone-1');
    expect(deps.webphone.mute).toHaveBeenCalledWith('webphone-1');
    expect(deps.webphone.unmute).toHaveBeenCalledWith('webphone-1');
    expect(deps.webphone.hold).toHaveBeenCalledWith('webphone-1');
    expect(deps.webphone.unhold).toHaveBeenCalledWith('webphone-1');

    await functions.onRecord('webphone-1');
    expect(deps.activeCallControl.startRecord).toHaveBeenCalledWith('telephony-1');
    expect(deps.webphone.updateRecordStatus).toHaveBeenCalledWith('webphone-1', recordStatus.recording);
    await functions.onStopRecord('webphone-1');
    expect(deps.activeCallControl.stopRecord).toHaveBeenCalledWith('telephony-1');
    expect(deps.webphone.updateRecordStatus).toHaveBeenCalledWith('webphone-1', recordStatus.idle);

    functions.onPark('webphone-1');
    expect(deps.routerInteraction.push).toHaveBeenCalledWith('/park/webphone-1');
    deps.monitoredExtensions.parkLocations = [];
    functions.onPark('webphone-1');
    expect(deps.webphone.park).toHaveBeenCalledWith('webphone-1');

    await functions.updateSessionMatchedContact('webphone-1', { id: 'contact-2' });
    expect(deps.webphone.updateSessionMatchedContact).toHaveBeenCalledWith(
      'webphone-1',
      { id: 'contact-2' },
    );
    expect(deps.call.cleanToNumberEntities).toHaveBeenCalled();
    expect(deps.contactMatcher.setCallMatched).toHaveBeenCalledWith({
      telephonySessionId: 'telephony-1',
      toEntityId: 'contact-2',
    });

    expect(functions.getDefaultContactMatch({
      partyData: { sessionId: 'telephony-1' },
    }, [{ id: 'contact-2' }])).toEqual({ id: 'contact-2' });
    expect(functions.getDefaultContactMatch({}, [{ id: 'contact-3' }])).toBeNull();
  });

  it('handles call-control record fallback and error paths', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const deps = createCallControlDeps({
      activeCallControl: {
        getActiveSession: jest.fn(() => ({
          recordStatus: recordStatus.idle,
          to: 'conference',
        })),
        startRecord: jest.fn(async () => {
          throw new Error('record failed');
        }),
        stopRecord: jest.fn(async () => {
          const error = new Error('forbidden');
          error.response = { status: 403 };
          throw error;
        }),
      },
      webphone: {
        ...createCallControlDeps().webphone,
        sessions: [{
          ...createCallControlDeps().webphone.sessions[0],
          id: 'conference-session',
        }],
      },
    });
    const callControlUI = new CallControlUI(deps);
    const functions = callControlUI.getUIFunctions({});

    await functions.onRecord('conference-session');
    await functions.onStopRecord('conference-session');
    expect(deps.webphone.startRecord).toHaveBeenCalledWith('conference-session');
    expect(deps.webphone.stopRecord).toHaveBeenCalledWith('conference-session');

    deps.activeCallControl.getActiveSession.mockReturnValueOnce({
      recordStatus: recordStatus.idle,
      to: '+16505550123',
    });
    await functions.onRecord('conference-session');
    expect(deps.alert.danger).toHaveBeenCalledWith({
      message: webphoneErrors.recordError,
      payload: { errorCode: 'record failed' },
    });

    deps.activeCallControl.getActiveSession.mockReturnValueOnce({
      recordStatus: recordStatus.recording,
      to: '+16505550123',
    });
    await functions.onStopRecord('conference-session');
    expect(deps.alert.danger).toHaveBeenCalledWith({
      message: 'stopRecordDisabled',
    });
  });

  it('builds conversation list props and routes conversation actions', async () => {
    const deps = createConversationsDeps();
    const conversationsUI = new ConversationsUI(deps);

    expect(conversationsUI.ownerTabs).toEqual([
      { label: 'directLabel', unreadCounts: 2, value: 'Personal' },
      { label: 'callQueueLabel', unreadCounts: 3, value: 'Shared' },
      { label: 'sharedLabel', unreadCounts: 4, value: 'Threads' },
    ]);
    expect(conversationsUI.searchFilterList).toEqual([
      'All',
      'UnLogged',
      'Unread',
    ]);
    deps.conversations.ownerFilter = 'Threads';
    expect(conversationsUI.searchFilterList).toEqual([
      'All',
      'UnLogged',
      'Assigned to me',
      'Unassigned',
      'Assigned to others',
      'Unread',
      'Resolved',
    ]);

    expect(conversationsUI.getUIProps({ type: 'text' })).toMatchObject({
      additionalActions: [{ id: 'crm' }],
      baseProp: true,
      conversations: deps.conversations.pagingConversations,
      ownerFilter: 'Threads',
      rcAccessToken: 'access-token',
      showLogButton: true,
      threadBusy: false,
      typeFilter: messageTypes.text,
    });

    const functions = conversationsUI.getUIFunctions({});
    await functions.onLogConversation({ conversationId: 'conversation-1' });
    expect(deps.conversationLogger.logConversation).toHaveBeenCalledWith({
      conversationId: 'conversation-1',
      redirect: true,
      triggerType: 'manual',
    });
    functions.onRefreshContact({ phoneNumber: '+16505550123' });
    expect(deps.contactMatcher.setManualRefreshNumber).toHaveBeenCalledWith('+16505550123');
    functions.onSearchFilterChange('Unread');
    functions.onSearchInputChange('customer');
    expect(deps.conversations.updateSearchFilter).toHaveBeenCalledWith('Unread');
    expect(deps.conversations.updateSearchInput).toHaveBeenCalledWith('customer');

    functions.openMessageDetails('conversation-item-1');
    expect(deps.sideDrawerUI.gotoMessageDetails).toHaveBeenCalledWith(
      { id: 'conversation-item-1', type: messageTypes.sms },
      { phoneNumber: '+16505550123' },
    );
    functions.showConversationDetail('conversation-1');
    expect(deps.sideDrawerUI.gotoConversation).toHaveBeenCalledWith(
      'conversation-1',
      { phoneNumber: '+16505550123' },
      'conversation',
    );
    functions.showConversationDetail('thread-1');
    expect(deps.sideDrawerUI.gotoConversation).toHaveBeenCalledWith(
      'thread-1',
      { phoneNumber: '+16505550124' },
      'thread',
    );
    functions.goToComposeText();
    functions.onClickToSms({ phoneNumber: '+16505550123' }, true);
    expect(deps.composeTextUI.gotoComposeText).toHaveBeenCalledWith(
      { phoneNumber: '+16505550123' },
      true,
    );
    functions.onOwnerFilterChange('Shared');
    expect(deps.conversations.updateOwnerFilter).toHaveBeenCalledWith('Shared');
    functions.onClickAdditionalAction('crm', { id: 'conversation-1' });
    expect(deps.thirdPartyService.onClickAdditionalButton).toHaveBeenCalledWith(
      'crm',
      { id: 'conversation-1' },
    );
    expect(functions.formatPhone('+16505550123')).toBe('formatted-+16505550123');
    await functions.onAssignThread({ id: 'thread-1' }, { extensionId: '101' });
    await functions.onAssignThread({
      assignee: { extensionId: '101' },
      id: 'thread-2',
    }, null);
    await functions.onResolveThread({ id: 'thread-1', status: 'Open' });
    expect(deps.messageThreads.assign).toHaveBeenCalledWith('thread-1', { extensionId: '101' });
    expect(deps.messageThreads.assign).toHaveBeenCalledWith('thread-2', null);
    expect(deps.messageThreads.resolve).toHaveBeenCalledWith('thread-1');
    expect(functions.getSMSRecipients({ owner: { extensionId: 'owner-1' } })).toEqual([
      { phoneNumber: '+16505550123' },
    ]);
    functions.markMessage('thread-1');
    expect(deps.messageThreads.markAsUnread).toHaveBeenCalledWith('thread-1');
    deps.conversations.ownerFilter = 'Personal';
    functions.markMessage('conversation-1');
    expect(deps.messageStore.unreadMessage).toHaveBeenCalledWith('conversation-1');
  });

  it('builds message-detail props and actions', async () => {
    const deps = createMessageDetailsDeps();
    const messageDetailsUI = new MessageDetailsUI(deps);
    const functions = messageDetailsUI.getUIFunctions({
      onCreateContact: jest.fn(async () => {}),
      previewFaxMessages: jest.fn(),
    });

    functions.onViewMessage('message-1');
    expect(messageDetailsUI.message.id).toBe('message-1');
    expect(deps.messageStore.fetchVoicemailTranscription).toHaveBeenCalledWith(deps.conversations.formattedConversations[0]);
    expect(messageDetailsUI.getUIProps({
      enableContactFallback: true,
      params: { messageId: 'message-1' },
    })).toMatchObject({
      additionalActions: [{ id: 'crm' }],
      autoLog: false,
      brand: 'RingCentral',
      composeTextPermission: true,
      currentLocale: 'en-US',
      enableCDC: true,
      enableContactFallback: true,
      messageId: 'message-1',
      outboundSmsPermission: true,
      rcAccessToken: 'access-token',
      showLogButton: true,
      showSpinner: false,
      transcription: 'transcription text',
    });

    expect(functions.formatPhone('+16505550123')).toBe('formatted-+16505550123');
    expect(functions.dateTimeFormatter({ utcTimestamp: 1000 })).toBe('formatted-date');
    functions.onViewContact({ contact: { id: 'contact-1', type: 'crm' } });
    expect(deps.thirdPartyService.onViewMatchedContactExternal).toHaveBeenCalledWith({
      id: 'contact-1',
      type: 'crm',
    });
    functions.onViewContact({ contact: { id: 'contact-2', type: 'company' } });
    expect(deps.sideDrawerUI.gotoContactDetails).toHaveBeenCalledWith({
      id: 'contact-2',
      type: 'company',
    });
    await functions.onCreateContact({
      entityType: 'account',
      name: 'Customer',
      phoneNumber: '+16505550123',
    });
    expect(deps.contactMatcher.forceMatchNumber).toHaveBeenCalledWith({
      phoneNumber: '+16505550123',
    });
    functions.onClickToDial({ fromType: 'message', phoneNumber: '+16505550123' });
    expect(deps.routerInteraction.push).toHaveBeenCalledWith('/dialer');
    expect(deps.dialerUI.call).toHaveBeenCalledWith({
      recipient: { fromType: 'message', phoneNumber: '+16505550123' },
    });
    functions.onClickToSms({ phoneNumber: '+16505550123' }, true);
    expect(deps.composeTextUI.gotoComposeText).toHaveBeenCalledWith(
      { phoneNumber: '+16505550123' },
      true,
    );
    await functions.onLogConversation({ conversationId: 'conversation-1' });
    expect(deps.conversationLogger.logConversation).toHaveBeenCalledWith({
      conversationId: 'conversation-1',
      redirect: true,
      triggerType: 'manual',
    });
    functions.onRefreshContact({ phoneNumber: '+16505550123' });
    functions.markMessage('conversation-1');
    functions.unmarkMessage('conversation-1');
    functions.deleteMessage('conversation-1');
    functions.readMessage('conversation-1');
    functions.previewFaxMessages('https://example.com/fax', 'conversation-1');
    functions.onClickAdditionalAction('crm', { id: 'message-1' });
    expect(deps.messageStore.unreadMessage).toHaveBeenCalledWith('conversation-1');
    expect(deps.messageStore.onUnmarkMessages).toHaveBeenCalled();
    expect(deps.conversations.deleteConversation).toHaveBeenCalledWith('conversation-1');
    expect(deps.thirdPartyService.onClickAdditionalButton).toHaveBeenCalledWith(
      'crm',
      { id: 'message-1' },
    );
  });

  it('builds call-detail props and actions', async () => {
    const deps = createCallDetailsDeps();
    const callDetailsUI = new CallDetailsUI(deps);
    const functions = callDetailsUI.getUIFunctions({
      onCreateContact: jest.fn(async () => {}),
    });

    functions.onViewCall('telephony-1');
    expect(callDetailsUI.currentCall.telephonySessionId).toBe('telephony-1');
    expect(callDetailsUI.getUIProps({
      enableContactFallback: true,
      params: { telephonySessionId: 'telephony-1' },
      showContactDisplayPlaceholder: true,
    })).toMatchObject({
      additionalActions: [{ id: 'crm' }],
      aiNoted: true,
      autoLog: true,
      brand: 'RingCentral',
      call: deps.callHistory.latestCalls[0],
      disableClickToDial: false,
      enableCDC: true,
      enableContactFallback: true,
      isLogging: true,
      readTextPermission: true,
      recording: {
        contentUri: 'https://example.com/recording?access_token=access-token',
      },
      showContactDisplayPlaceholder: true,
      showLogButton: true,
      telephonySessionId: 'telephony-1',
    });

    functions.onClose();
    expect(deps.routerInteraction.goBack).toHaveBeenCalled();
    expect(functions.formatPhone('+16505550123')).toBe('formatted-+16505550123');
    expect(functions.dateTimeFormatter({ utcTimestamp: 1000 })).toBe('formatted-date');
    await functions.onCreateContact({
      entityType: 'account',
      name: 'Customer',
      phoneNumber: '+16505550123',
    });
    expect(deps.contactMatcher.forceMatchNumber).toHaveBeenCalledWith({
      phoneNumber: '+16505550123',
    });
    expect(functions.isLoggedContact({}, { contact: { id: 'contact-1' } }, { id: 'contact-1' })).toBe(true);
    await functions.onLogCall({
      call: deps.callHistory.latestCalls[0],
      contact: { id: 'contact-1' },
      redirect: true,
      triggerType: 'manual',
    });
    expect(deps.callLogger.logCall).toHaveBeenCalledWith({
      call: deps.callHistory.latestCalls[0],
      contact: { id: 'contact-1' },
      redirect: true,
      triggerType: 'manual',
    });
    functions.onViewContact({ contact: { id: 'contact-1', type: 'crm' } });
    expect(deps.thirdPartyService.onViewMatchedContactExternal).toHaveBeenCalledWith({
      id: 'contact-1',
      type: 'crm',
    });
    functions.onRefreshContact({ phoneNumber: '+16505550123' });
    expect(deps.contactMatcher.forceMatchNumber).toHaveBeenCalledWith({
      phoneNumber: '+16505550123',
    });
    functions.onClickToDial({ phoneNumber: '+16505550123' });
    expect(deps.routerInteraction.push).toHaveBeenCalledWith('/dialer');
    expect(deps.callHistory.onClickToCall).toHaveBeenCalled();
    await functions.onClickToSms({ phoneNumber: '+16505550123' }, true);
    expect(deps.composeTextUI.gotoComposeText).toHaveBeenCalledWith(
      { phoneNumber: '+16505550123' },
      true,
    );
    functions.onViewSmartNote({
      contact: { id: 'contact-1' },
      direction: callDirections.outbound,
      phoneNumber: '+16505550123',
      telephonySessionId: 'telephony-1',
    });
    expect(deps.smartNotes.setSession).toHaveBeenCalledWith({
      contact: { id: 'contact-1' },
      direction: callDirections.outbound,
      id: 'telephony-1',
      phoneNumber: '+16505550123',
      status: 'Disconnected',
    });
    functions.onClickAdditionalAction('crm', { id: 'call-session-1' });
    expect(deps.thirdPartyService.onClickAdditionalButton).toHaveBeenCalledWith(
      'crm',
      { id: 'call-session-1' },
    );

    deps.callLogger.showLogModal = true;
    await functions.onLogCall({
      call: deps.callHistory.latestCalls[0],
      triggerType: 'manual',
    });
    expect(deps.sideDrawerUI.gotoLogCall).toHaveBeenCalledWith(
      'call-session-1',
      { phoneNumber: '+16505550123' },
    );
  });

  it('forwards incoming calls through call-control parties and legacy webphone paths', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const deps = createIncomingCallDeps();
    const incomingCallUI = new IncomingCallUI(deps);
    const functions = incomingCallUI.getUIFunctions({});

    await expect(functions.onForward(
      'call-id-1',
      '+16505550199',
      {
        contactId: 'extension-1',
        entityType: 'rcContact',
        type: 'company',
      },
    )).resolves.toBe(true);
    expect(deps.webphone.setForwardFlag).toHaveBeenCalledWith('call-id-1');
    expect(deps.platform.post).toHaveBeenCalledWith(
      '/restapi/v1.0/account/~/telephony/sessions/telephony-1/parties/party-1/forward',
      { extensionId: 'extension-1' },
    );

    await functions.onForward('call-id-1', '102');
    expect(deps.platform.post).toHaveBeenLastCalledWith(
      '/restapi/v1.0/account/~/telephony/sessions/telephony-1/parties/party-1/forward',
      { extensionNumber: '102' },
    );

    deps.webphone.sessions = [{
      callId: 'call-id-2',
      id: 'webphone-2',
    }];
    await functions.onForward('call-id-2', '+16505550100');
    expect(deps.webphone.forward).toHaveBeenCalledWith('call-id-2', '+16505550100');

    deps.webphone.sessions = [{
      callId: 'call-id-3',
      id: 'webphone-3',
      partyData: {
        partyId: 'party-3',
        sessionId: 'telephony-3',
      },
    }];
    deps.platform.post.mockRejectedValueOnce(new Error('forward failed'));
    await expect(functions.onForward('call-id-3', '+16505550100')).resolves.toBeUndefined();
    expect(deps.alert.warning).toHaveBeenCalledWith({
      message: webphoneErrors.forwardError,
    });

    functions.ignore('call-id-3');
    functions.startReply('call-id-3');
    functions.updateSessionMatchedContact('webphone-3', { id: 'contact-1' });
    expect(deps.webphone.ignore).toHaveBeenCalledWith('call-id-3');
    expect(deps.webphone.startReply).toHaveBeenCalledWith('call-id-3');
    expect(deps.contactMatcher.setCallMatched).toHaveBeenCalledWith({
      telephonySessionId: 'telephony-3',
      toEntityId: 'contact-1',
    });
    expect(functions.formatPhone('+16505550123')).toBe('formatted-+16505550123');
  });
});
