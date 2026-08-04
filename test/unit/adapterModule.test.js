import moduleStatuses from '@ringcentral-integration/commons/enums/moduleStatuses';
import callDirections from '@ringcentral-integration/commons/enums/callDirections';
import { callingModes } from '@ringcentral-integration/commons/modules/CallingSettings/callingModes';
import { callingOptions } from '@ringcentral-integration/commons/modules/CallingSettings/callingOptions';
import recordStatus from '@ringcentral-integration/commons/modules/Webphone/recordStatus';
import sessionStatus from '@ringcentral-integration/commons/modules/Webphone/sessionStatus';
import { webphoneErrors } from '@ringcentral-integration/commons/modules/Webphone/webphoneErrors';

import messageTypes from '../../src/lib/Adapter/messageTypes';
import Adapter from '../../src/modules/Adapter';
import actionTypes from '../../src/modules/Adapter/actionTypes';

jest.mock('@ringcentral-integration/widgets/lib/MeetingCalendarHelper', () => ({
  getRcmEventTpl: jest.fn(() => 'rcm details'),
  getRcvEventTpl: jest.fn(() => 'rcv details'),
}));

function createAdapter(overrides = {}) {
  const adapter = Object.create(Adapter.prototype);
  Object.defineProperties(adapter, {
    actionTypes: {
      value: actionTypes,
      configurable: true,
      writable: true,
    },
    state: {
      value: {
        status: moduleStatuses.ready,
        showDemoWarning: false,
      },
      configurable: true,
      writable: true,
    },
    size: {
      value: { width: 300, height: 500 },
      configurable: true,
      writable: true,
    },
    minimized: {
      value: false,
      configurable: true,
      writable: true,
    },
    closed: {
      value: false,
      configurable: true,
      writable: true,
    },
    position: {
      value: { x: 1, y: 2 },
      configurable: true,
      writable: true,
    },
    store: {
      value: {
        dispatch: jest.fn(),
      },
      configurable: true,
      writable: true,
    },
  });
  Object.assign(adapter, {
    _messageTypes: messageTypes,
    _postMessage: jest.fn(),
    _syncSize: jest.fn(),
    _auth: {
      ready: true,
      loggedIn: true,
      isFreshLogin: true,
      logout: jest.fn(),
    },
    _client: {
      service: {
        ensureLoggedIn: jest.fn(async () => {}),
        get: jest.fn(async () => {}),
      },
    },
    _oAuth: {
      openOAuthPage: jest.fn(),
    },
    _extensionInfo: {
      ready: true,
      extensionNumber: '101',
      isMultipleSiteEnabled: false,
      site: { code: 'site' },
      info: {
        permissions: {
          admin: { enabled: true },
        },
      },
    },
    _accountInfo: {
      ready: true,
      mainCompanyNumber: '+16505550100',
      maxExtensionNumberLength: 6,
      serviceInfo: {
        contractedCountry: { isoCode: 'US' },
      },
    },
    _appFeatures: {
      ready: true,
      hasSMSSendingFeature: true,
      hasMeetingsPermission: true,
      hasGlipPermission: true,
      hasSmartNotePermission: true,
      isCallingEnabled: true,
      hasRingSenseInsightsPermission: true,
      hasRingCXPermission: true,
      setConfigState: jest.fn(),
    },
    _presence: {
      ready: true,
      telephonyStatus: 'NoCall',
      userStatus: 'Available',
      dndStatus: 'TakeAllCalls',
      presenceOption: 'Available',
      activeCalls: [],
      _update: jest.fn(async () => {}),
    },
    _router: {
      currentPath: '/dialer',
      push: jest.fn(),
      goBack: jest.fn(),
    },
    _regionSettings: {
      ready: true,
      countryCode: 'US',
      areaCode: '650',
    },
    _callingSettings: {
      ready: true,
      callWith: callingOptions.browser,
      callingMode: callingModes.webphone,
      myLocation: 'Office',
      ringoutPrompt: false,
      fromNumber: '+16505550100',
      fromNumbers: [
        { phoneNumber: '+16505550100', usageType: 'DirectNumber', primary: true, label: 'Main' },
      ],
      availableNumbersWithLabel: [{ phoneNumber: '+16505550100', label: 'Main' }],
      setData: jest.fn(),
      updateFromNumber: jest.fn(),
    },
    _composeText: {
      ready: true,
      senderNumber: '+16505550100',
      senderNumbersList: [
        { phoneNumber: '+16505550100', usageType: 'DirectNumber', type: 'Mobile', features: ['Sms'], label: 'Main' },
      ],
      toNumbers: [],
      updateTypingToNumber: jest.fn(),
      addToNumber: jest.fn(),
      updateMessageText: jest.fn(),
      addAttachment: jest.fn(),
      updateSenderNumber: jest.fn(),
    },
    _composeTextUI: {
      gotoComposeText: jest.fn(),
    },
    _phoneNumberFormat: {
      ready: true,
      formatType: 'custom',
      template: '(###) ###-####',
      format: jest.fn(({ phoneNumber }) => phoneNumber),
      setSetting: jest.fn(),
    },
    _call: {
      isIdle: true,
    },
    _dialerUI: {
      showSpinner: false,
      isCallButtonDisabled: false,
      setToNumberField: jest.fn(),
      call: jest.fn(),
    },
    _webphone: {
      ready: true,
      sessions: [],
      activeSession: null,
      activeSessionId: 'active-session',
      ringSessionId: 'ring-session',
      ringSession: null,
      connectionStatus: 'connected',
      device: { id: 'device-id' },
      answer: jest.fn(),
      reject: jest.fn(),
      hangup: jest.fn(),
      hold: jest.fn(),
      unhold: jest.fn(),
      transfer: jest.fn(),
      toVoiceMail: jest.fn(),
      mute: jest.fn(),
      unmute: jest.fn(),
      toggleMinimized: jest.fn(),
      sendDTMF: jest.fn(),
      pickParkLocation: jest.fn(async () => {}),
      pickGroupCall: jest.fn(async () => {}),
      startRecord: jest.fn(async () => {}),
      stopRecord: jest.fn(async () => {}),
      updateRecordStatus: jest.fn(),
      setRingtone: jest.fn(),
      defaultOutgoingAudio: 'outgoing.mp3',
      defaultOutgoingAudioFile: 'outgoing',
      updateSessionMatchedContact: jest.fn(),
    },
    _incomingCallUI: {
      forward: jest.fn(async () => {}),
    },
    _activeCallControl: {
      getActiveSession: jest.fn(),
      startRecord: jest.fn(async () => {}),
      stopRecord: jest.fn(async () => {}),
    },
    _alert: {
      warning: jest.fn(),
      alert: jest.fn(async () => 'alert-id'),
      dismiss: jest.fn(),
      dismissAll: jest.fn(),
      danger: jest.fn(),
    },
    _popupWindowManager: {
      checkPopupWindowOpened: jest.fn(async () => false),
    },
    _meeting: {
      ready: true,
      isRCV: false,
      schedule: jest.fn(async () => ({
        meeting: {
          topic: 'Planning',
          meetingType: 'Scheduled',
          schedule: {
            startTime: '2026-01-01T10:00:00Z',
            durationInMinutes: 30,
          },
          links: {
            joinUri: 'https://meet.example.com/1',
          },
        },
      })),
    },
    _brand: 'RingCentral',
    _locale: {
      currentLocale: 'en-US',
    },
    _smsTemplates: {
      createOrUpdateTemplate: jest.fn(async () => null),
    },
    _callLogger: {
      ready: true,
      autoLog: false,
      setAutoLog: jest.fn(),
      getRecentUnloggedCalls: jest.fn(async () => ({
        calls: [{ id: 'call-log' }],
        hasMore: false,
      })),
      getCall: jest.fn(async () => ({ id: 'logged-call' })),
    },
    _conversationLogger: {
      ready: true,
      autoLog: false,
      setAutoLog: jest.fn(),
    },
    _conversations: {
      currentConversationId: 'conversation-1',
      allConversations: [
        {
          conversationId: 'conversation-1',
          type: 'SMS',
          direction: 'Inbound',
          from: { phoneNumber: '+16505550101' },
          to: [{ phoneNumber: '+16505550100' }],
        },
      ],
      formattedMessageThreads: [
        { id: 'thread-1', guestParty: { phoneNumber: '+16505550103' } },
      ],
      loadConversation: jest.fn(),
      updateMessageText: jest.fn(),
      addAttachment: jest.fn(),
    },
    _contacts: {
      findContact: jest.fn(async () => ({ id: 'contact-1' })),
    },
    _audioSettings: {
      setData: jest.fn(),
    },
    _contactMatcher: {
      dataMapping: {
        '+16505550101': [{ id: 'contact-1', name: 'Ada' }],
        '+16505550102': [{ id: 'contact-2', name: 'Grace' }],
      },
      setCallMatched: jest.fn(),
    },
    _sideDrawerUI: {
      enabled: true,
      extended: false,
      modalOpen: true,
      openApps: jest.fn(),
      openAppTab: jest.fn(),
      setExtended: jest.fn(),
      gotoLogCall: jest.fn(),
      gotoLogConversation: jest.fn(),
      gotoComposeText: jest.fn(),
      gotoConversation: jest.fn(),
      gotoContactDetails: jest.fn(),
      gotoGlipChat: jest.fn(),
      clearWidgets: jest.fn(),
    },
    _thirdPartyService: {
      apps: [{ id: 'app-1' }],
      pinAppIds: ['app-1'],
    },
    _callHistory: {
      latestCalls: [{ sessionId: 'call-session', fromMatches: [{ name: 'Caller' }], from: { phoneNumber: '+1' } }],
    },
    _callMonitor: {
      calls: [{ sessionId: 'monitor-session', from: { phoneNumber: '+2' } }],
    },
    _messageStore: {},
    _tabManager: {
      ready: true,
      active: true,
    },
    _brandConfig: null,
    _sideDrawerExtended: null,
    _theme: {
      themeType: 'dark',
    },
    _smartNotes: {
      showSmartNote: true,
      autoStartSmartNote: false,
      setShowSmartNote: jest.fn(),
      setAutoStartSmartNote: jest.fn(),
    },
    _smsTypingTimeTracker: {
      setEnabled: jest.fn(),
    },
    _monitoredExtensions: {
      monitoredExtensions: [
        {
          extension: { id: 'park-1', type: 'ParkLocation' },
          presence: {
            activeCalls: [{ telephonySessionId: 'telephony-1' }],
          },
        },
        {
          extension: { id: 'gcp-1', type: 'GroupCallPickup' },
          presence: {
            activeCalls: [{ telephonySessionId: 'telephony-2' }],
          },
        },
        {
          extension: { id: 'queue-1', type: 'Department' },
          presence: {
            activeCalls: [{ telephonySessionId: 'telephony-3' }],
          },
        },
        {
          extension: { id: 'other-1', type: 'Unknown' },
          presence: {
            activeCalls: [{ telephonySessionId: 'telephony-4' }],
          },
        },
      ],
    },
    _enableFromNumberSetting: true,
    _showMyLocationNumbers: true,
    _enableSmsSettingEvent: true,
    _disableInactiveTabCallEvent: false,
    _isUsingDefaultClientId: false,
    _loggedIn: null,
    _lastActiveCalls: [],
    _callWith: null,
    _ringoutMyLocation: null,
    _smsSenderNumber: null,
    _callLoggerAutoLogEnabled: null,
    _conversationLoggerAutoLogEnabled: null,
    _dialerDisabled: null,
    _meetingReady: null,
    _webphoneConnectionStatus: null,
    _phoneNumberFormatSetting: null,
    _userGuide: { started: true, dismiss: jest.fn() },
    _quickAccess: { entered: true, exit: jest.fn() },
    _callLogSection: { closeLogSection: jest.fn() },
    ...overrides,
  });
  return adapter;
}

function getMessage(adapter, type) {
  return adapter._postMessage.mock.calls
    .map(([message]) => message)
    .find((message) => message.type === type);
}

describe('Adapter module methods', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    delete global.window;
    delete global.localStorage;
    jest.restoreAllMocks();
  });

  it('handles adapter request messages and posts responses', async () => {
    const adapter = createAdapter();

    await adapter._handleRCAdapterMessageRequest({
      path: '/schedule-meeting',
      requestId: 'schedule',
      body: {
        title: 'Planning',
        schedule: {
          startTime: '2026-01-01T10:00:00Z',
          durationInMinutes: 30,
        },
      },
    });
    adapter._popupWindowManager.checkPopupWindowOpened.mockResolvedValueOnce(false);
    adapter._webphone.sessions = [{ id: 'active-call' }];
    await adapter._handleRCAdapterMessageRequest({
      path: '/check-popup-window',
      requestId: 'popup',
      body: { alert: true },
    });
    await adapter._handleRCAdapterMessageRequest({
      path: '/custom-alert-message',
      requestId: 'alert',
      body: {
        level: 'success',
        ttl: 1000,
        message: 'Saved',
        details: 'Done',
      },
    });
    await adapter._handleRCAdapterMessageRequest({
      path: '/dismiss-alert-message',
      requestId: 'dismiss-one',
      body: { id: 'alert-id' },
    });
    await adapter._handleRCAdapterMessageRequest({
      path: '/dismiss-alert-message',
      requestId: 'dismiss-all',
      body: {},
    });
    await adapter._handleRCAdapterMessageRequest({
      path: '/create-sms-template',
      requestId: 'template',
      body: { displayName: 'Greeting', text: 'Hello' },
    });
    await adapter._handleRCAdapterMessageRequest({
      path: '/unlogged-calls',
      requestId: 'unlogged',
      body: { perPage: 10, page: 2 },
    });
    await adapter._handleRCAdapterMessageRequest({
      path: '/get-call-log',
      requestId: 'missing-call',
      body: {},
    });
    await adapter._handleRCAdapterMessageRequest({
      path: '/get-call-log',
      requestId: 'call-log',
      body: { sessionId: 'session-1' },
    });
    await adapter._handleRCAdapterMessageRequest({
      path: '/unknown',
      requestId: 'unknown',
      body: {},
    });

    expect(getMessage(adapter, 'rc-adapter-message-response')).toBeDefined();
    expect(adapter._postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        responseId: 'popup',
        response: true,
      }),
    );
    expect(adapter._alert.warning).toHaveBeenCalledWith({
      message: 'cannotPopupWindowWithCall',
    });
    expect(adapter._alert.alert).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'showCustomAlertMessage',
      }),
    );
    expect(adapter._alert.dismiss).toHaveBeenCalledWith('alert-id');
    expect(adapter._alert.dismissAll).toHaveBeenCalled();
    expect(adapter._smsTemplates.createOrUpdateTemplate).toHaveBeenCalledWith({
      displayName: 'Greeting',
      body: { text: 'Hello' },
    });
    expect(adapter._callLogger.getRecentUnloggedCalls).toHaveBeenCalledWith({
      perPage: 10,
      page: 2,
    });
    expect(adapter._callLogger.getCall).toHaveBeenCalledWith('session-1', undefined);
    expect(adapter._postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        responseId: 'missing-call',
        response: { error: 'sessionId or telephonySessionId is required' },
      }),
    );
  });

  it('refreshes the login session and posts the request result', async () => {
    const adapter = createAdapter();

    await adapter._handleRCAdapterMessageRequest({
      path: '/refresh-login-session',
      requestId: 'refresh-session',
      body: { force: false },
    });
    await adapter._handleRCAdapterMessageRequest({
      path: '/refresh-login-session',
      requestId: 'force-refresh-session',
      body: { force: true },
    });

    expect(adapter._client.service.ensureLoggedIn).toHaveBeenCalledTimes(1);
    expect(adapter._client.service.get).toHaveBeenCalledWith('/restapi/v1.0/account/~');
    expect(adapter._postMessage).toHaveBeenCalledWith(expect.objectContaining({
      responseId: 'refresh-session',
      response: { result: 'ok' },
    }));
    expect(adapter._postMessage).toHaveBeenCalledWith(expect.objectContaining({
      responseId: 'force-refresh-session',
      response: { result: 'ok' },
    }));

    adapter._client.service.ensureLoggedIn.mockRejectedValueOnce(new Error('refresh failed'));
    await adapter._handleRCAdapterMessageRequest({
      path: '/refresh-login-session',
      requestId: 'failed-refresh-session',
    });

    expect(adapter._postMessage).toHaveBeenCalledWith(expect.objectContaining({
      responseId: 'failed-refresh-session',
      response: {
        result: 'error',
        message: 'refresh failed',
      },
    }));
  });

  it('routes incoming adapter messages to command handlers', () => {
    const adapter = createAdapter();
    global.window = {
      toggleEnv: jest.fn(),
    };
    [
      ['_newSMS', { type: 'rc-adapter-new-sms', phoneNumber: '+1', text: 'hello' }],
      ['_newCall', { type: 'rc-adapter-new-call', phoneNumber: '+2', toCall: true }],
      ['_autoPopulateConversationText', { type: 'rc-adapter-auto-populate-conversation', text: 'draft' }],
      ['_controlCall', { type: 'rc-adapter-control-call', callAction: 'hold', callId: 'call-id', options: {} }],
      ['_pickCall', { type: 'rc-adapter-pick-call', extensionId: 'park-1', telephonySessionId: 'telephony-1' }],
      ['_updateCallingSettings', { type: 'rc-calling-settings-update', callWith: 'browser' }],
      ['_updateSmsSettings', { type: 'rc-sms-settings-update', senderNumber: '+1' }],
      ['_handleRCAdapterMessageRequest', { type: 'rc-adapter-message-request', path: '/unknown' }],
      ['_navigateTo', { type: 'rc-adapter-navigate-to', path: '/history' }],
      ['_setPresence', { type: 'rc-adapter-set-presence', userStatus: 'Available' }],
      ['_syncWebphoneSessions', { type: 'rc-adapter-webphone-sessions-sync' }],
      ['_updateRingtone', { type: 'rc-adapter-update-ringtone', name: 'Bell' }],
      ['_onUpdateAutoLogSettings', { type: 'rc-adapter-update-auto-log-settings', call: true }],
      ['_onUpdateFeatureConfig', { type: 'rc-adapter-update-features-flags', chat: true }],
      ['_onUpdateAIAssistantSettings', { type: 'rc-adapter-update-ai-assistant-settings', showAiAssistantWidget: true }],
      ['_onUpdateSmsTypingTimeTracking', { type: 'rc-adapter-update-sms-typing-time-tracking', enabled: true }],
      ['_setCallContactMatched', { type: 'rc-adapter-set-call-contact-matches-select', telephonySessionId: 't1', contactId: 'c1' }],
      ['_setPhoneNumberFormat', { type: 'rc-adapter-set-phone-number-format', formatType: 'custom' }],
    ].forEach(([method]) => {
      adapter[method] = jest.fn();
    });
    adapter._setSideDrawerExtended = jest.fn();

    [
      { type: 'rc-adapter-set-environment' },
      { type: 'rc-adapter-new-sms', phoneNumber: '+1', text: 'hello' },
      { type: 'rc-adapter-new-call', phoneNumber: '+2', toCall: true },
      { type: 'rc-adapter-auto-populate-conversation', text: 'draft' },
      { type: 'rc-adapter-control-call', callAction: 'hold', callId: 'call-id', options: {} },
      { type: 'rc-adapter-pick-call', extensionId: 'park-1', telephonySessionId: 'telephony-1' },
      { type: 'rc-adapter-logout' },
      { type: 'rc-adapter-login' },
      { type: 'rc-calling-settings-update', callWith: 'browser' },
      { type: 'rc-sms-settings-update', senderNumber: '+1' },
      { type: 'rc-adapter-message-request', path: '/unknown' },
      { type: 'rc-adapter-navigate-to', path: '/history' },
      { type: 'rc-adapter-set-presence', userStatus: 'Available' },
      { type: 'rc-adapter-webphone-sessions-sync' },
      { type: 'rc-adapter-update-ringtone', name: 'Bell' },
      { type: 'rc-adapter-update-auto-log-settings', call: true },
      { type: 'rc-adapter-update-features-flags', chat: true },
      { type: 'rc-adapter-update-ai-assistant-settings', showAiAssistantWidget: true },
      { type: 'rc-adapter-update-sms-typing-time-tracking', enabled: true },
      { type: 'rc-adapter-set-side-drawer-extended', extended: true },
      { type: 'rc-adapter-set-call-contact-matches-select', telephonySessionId: 't1', contactId: 'c1' },
      { type: 'rc-adapter-set-phone-number-format', formatType: 'custom' },
    ].forEach((data) => adapter._onMessage({ data }));

    expect(global.window.toggleEnv).toHaveBeenCalled();
    expect(adapter._auth.logout).toHaveBeenCalled();
    adapter._auth.loggedIn = false;
    adapter._onMessage({ data: { type: 'rc-adapter-login' } });
    expect(adapter._oAuth.openOAuthPage).toHaveBeenCalled();
    expect(adapter._newSMS).toHaveBeenCalledWith('+1', 'hello', undefined, undefined, undefined);
    expect(adapter._setSideDrawerExtended).toHaveBeenCalledWith(true);
  });

  it('pushes state, presence, login, region, settings, and feature notifications', () => {
    const adapter = createAdapter();
    adapter._pushAdapterState();
    adapter._pushPresence();
    adapter._pushActiveCalls();
    adapter._checkLoginStatus();
    adapter._checkRegionChanged();
    adapter._checkCallingSettingsChanged();
    adapter._checkSmsSettingsChanged();
    adapter._checkDialUIStatusChanged();
    adapter._checkMeetingStatusChanged();
    adapter._brand = { brandConfig: { assets: { logo: 'logo.png', icon: 'icon.png' } } };
    adapter._checkBrandConfigChanged();
    adapter._checkWebphoneStatus();
    adapter._checkSideDrawerOpen();
    adapter._checkThemeType();
    adapter._checkAiAssistantSettings();
    adapter._checkPhoneNumberFormatSettingsChanged();
    adapter.callLogSyncedNotify();
    adapter.messageThreadNotify({ id: 'thread-1' });
    adapter.messageThreadEntityNotify({ id: 'entity-1' });

    expect(adapter._postMessage).toHaveBeenCalledWith(expect.objectContaining({
      type: messageTypes.pushAdapterState,
      telephonyStatus: 'NoCall',
    }));
    expect(adapter._postMessage).toHaveBeenCalledWith(expect.objectContaining({
      type: messageTypes.syncPresence,
      userStatus: 'Available',
    }));
    expect(adapter._postMessage).toHaveBeenCalledWith(expect.objectContaining({
      type: 'rc-login-status-notify',
      loggedIn: true,
      loginNumber: '+16505550100*101',
      admin: true,
    }));
    expect(adapter._postMessage).toHaveBeenCalledWith(expect.objectContaining({
      type: 'rc-calling-settings-notify',
      fromNumber: '+16505550100',
    }));
    expect(adapter._postMessage).toHaveBeenCalledWith(expect.objectContaining({
      type: 'rc-sms-settings-notify',
      senderNumber: '+16505550100',
    }));
    expect(adapter._postMessage).toHaveBeenCalledWith(expect.objectContaining({
      type: 'rc-adapter-side-drawer-open-notify',
      open: false,
    }));
    expect(adapter._postMessage).toHaveBeenCalledWith(expect.objectContaining({
      type: 'rc-adapter-ai-assistant-settings-notify',
      showAiAssistantWidget: true,
    }));
    expect(adapter._postMessage).toHaveBeenCalledWith(expect.objectContaining({
      type: 'rc-adapter-phone-number-format-settings-notify',
      formatType: 'custom',
      template: '(###) ###-####',
    }));
  });

  it('sends call notifications and manages side drawer app actions', () => {
    jest.spyOn(Date, 'now').mockReturnValue(123456);
    const adapter = createAdapter();
    const inboundSession = {
      id: 'call-1',
      direction: callDirections.inbound,
      from: '+16505550101',
      fromUserName: 'Ada',
      to: '+16505550100',
    };
    const outboundSession = {
      id: 'call-2',
      direction: callDirections.outbound,
      from: '+16505550100',
      to: '+16505550102',
      toUserName: 'Grace',
    };

    adapter.ringCallNotify(inboundSession);
    adapter.initCallNotify(outboundSession);
    adapter.startCallNotify(outboundSession);
    adapter.endCallNotify(outboundSession);
    adapter.holdCallNotify(outboundSession);
    adapter.resumeCallNotify(outboundSession);
    adapter.muteCallNotify(outboundSession, true);
    adapter.dropVoicemailNotify(outboundSession);
    adapter.activeWebphoneNotify({ activeId: 'tab-1', currentActive: true });
    adapter.telephonySessionNotify({ id: 'telephony-session' });
    adapter._callingSettings.callingMode = callingModes.ringout;
    adapter._sendRingoutCallNotification([{ id: 'server-call', sessionId: 'session-1' }]);
    adapter._sendActiveCallNotification([{ id: 'server-call', sessionId: 'session-1', sipData: {} }]);

    expect(adapter._sideDrawerUI.openApps).toHaveBeenCalledWith(
      expect.objectContaining({ phoneNumber: '+16505550101', name: 'Ada' }),
    );
    expect(adapter._sideDrawerUI.openAppTab).toHaveBeenCalledWith(
      { id: 'app-1' },
      expect.objectContaining({ phoneNumber: '+16505550102', name: 'Grace' }),
    );
    expect(adapter._postMessage).toHaveBeenCalledWith(expect.objectContaining({
      type: 'rc-call-end-notify',
      call: expect.objectContaining({ endTime: 123456 }),
    }));
    expect(adapter._postMessage).toHaveBeenCalledWith(expect.objectContaining({
      type: 'rc-call-hold-notify',
      call: expect.objectContaining({ callStatus: sessionStatus.onHold }),
    }));
    expect(adapter._postMessage).toHaveBeenCalledWith(expect.objectContaining({
      type: 'rc-webphone-active-notify',
      currentActive: true,
    }));
    expect(adapter._postMessage).toHaveBeenCalledWith(expect.objectContaining({
      type: 'rc-ringout-call-notify',
    }));
  });

  it('controls webphone calls, records, and pick-call flows', async () => {
    const adapter = createAdapter();
    [
      ['answer', 'answer'],
      ['reject', 'reject'],
      ['hangup', 'hangup'],
      ['hold', 'hold'],
      ['unhold', 'unhold'],
      ['mute', 'mute'],
      ['unmute', 'unmute'],
      ['toggleRingingDialog', 'toggleMinimized'],
    ].forEach(([action, method]) => {
      adapter._controlCall(action, 'call-id', {});
      expect(adapter._webphone[method]).toHaveBeenCalledWith('call-id');
    });
    adapter._controlCall('transfer', 'call-id', { transferNumber: '+1' });
    adapter._controlCall('toVoicemail', 'call-id', {});
    adapter._controlCall('forward', 'call-id', { forwardNumber: '+2' });
    adapter._controlCall('dtmf', 'call-id', { dtmf: '1' });
    expect(adapter._webphone.transfer).toHaveBeenCalledWith('+1', 'call-id');
    expect(adapter._webphone.toVoiceMail).toHaveBeenCalledWith('call-id');
    expect(adapter._incomingCallUI.forward).toHaveBeenCalledWith('call-id', '+2');
    expect(adapter._webphone.sendDTMF).toHaveBeenCalledWith('1', 'call-id');

    await adapter._pickCall(null, null);
    adapter._callingSettings.callingMode = callingModes.ringout;
    await adapter._pickCall('park-1', 'telephony-1');
    adapter._callingSettings.callingMode = callingModes.webphone;
    await adapter._pickCall('missing', 'telephony-1');
    await adapter._pickCall('other-1', 'telephony-4');
    await adapter._pickCall('park-1', 'telephony-1');
    await adapter._pickCall('gcp-1', 'telephony-2');
    await adapter._pickCall('queue-1', 'telephony-3');
    expect(adapter._webphone.pickParkLocation).toHaveBeenCalledWith(
      'park-1',
      { telephonySessionId: 'telephony-1' },
      '+16505550100',
    );
    expect(adapter._webphone.pickGroupCall).toHaveBeenCalledWith(
      'gcp-1',
      { telephonySessionId: 'telephony-2' },
      '+16505550100',
      'gcp',
    );
    expect(adapter._webphone.pickGroupCall).toHaveBeenCalledWith(
      'queue-1',
      { telephonySessionId: 'telephony-3' },
      '+16505550100',
      'qpk',
    );

    adapter._webphone.sessions = [{
      id: 'webphone-1',
      recordStatus: recordStatus.idle,
      partyData: { sessionId: 'telephony-record' },
    }];
    adapter._activeCallControl.getActiveSession.mockReturnValue({
      recordStatus: recordStatus.idle,
      to: '+16505550101',
    });
    await adapter._startRecord('webphone-1');
    expect(adapter._activeCallControl.startRecord).toHaveBeenCalledWith('telephony-record');
    adapter._activeCallControl.getActiveSession.mockReturnValue({
      recordStatus: recordStatus.recording,
      to: '+16505550101',
    });
    await adapter._stopRecord('webphone-1');
    expect(adapter._activeCallControl.stopRecord).toHaveBeenCalledWith('telephony-record');

    adapter._activeCallControl.getActiveSession.mockReturnValue(null);
    adapter._webphone.sessions[0].recordStatus = recordStatus.idle;
    await adapter._startRecord('webphone-1');
    expect(adapter._webphone.startRecord).toHaveBeenCalledWith('webphone-1');
    adapter._webphone.sessions[0].recordStatus = recordStatus.recording;
    await adapter._stopRecord('webphone-1');
    expect(adapter._webphone.stopRecord).toHaveBeenCalledWith('webphone-1');
  });

  it('navigates, creates SMS/call flows, and updates settings', async () => {
    const adapter = createAdapter();
    await adapter._navigateTo('/log/call/call-session');
    await adapter._navigateTo('/log/messages/conversation-1');
    await adapter._navigateTo('/log/messages/thread-1');
    await adapter._navigateTo('/composeText');
    await adapter._navigateTo('/conversations/conversation-1');
    await adapter._navigateTo('/conversations/thread-1');
    await adapter._navigateTo('/contacts/crm/contact-1');
    await adapter._navigateTo('/glip/groups/group-1');
    await adapter._navigateTo('/settings');
    await adapter._navigateTo('goBack');
    expect(adapter._sideDrawerUI.gotoLogCall).toHaveBeenCalled();
    expect(adapter._sideDrawerUI.gotoLogConversation).toHaveBeenCalled();
    expect(adapter._composeTextUI.gotoComposeText).toHaveBeenCalled();
    expect(adapter._sideDrawerUI.gotoConversation).toHaveBeenCalled();
    expect(adapter._sideDrawerUI.gotoContactDetails).toHaveBeenCalledWith({ id: 'contact-1' });
    expect(adapter._sideDrawerUI.gotoGlipChat).toHaveBeenCalledWith('group-1');
    expect(adapter._router.push).toHaveBeenCalledWith('/settings');
    expect(adapter._router.goBack).toHaveBeenCalled();

    adapter._newSMS('+16505550101', 'hello', true, [
      { name: 'note.txt', content: 'data:text/vcard;base64,QQ==' },
    ]);
    expect(adapter._sideDrawerUI.gotoConversation).toHaveBeenCalledWith(
      'conversation-1',
      { phoneNumber: '+16505550101' },
    );
    expect(adapter._conversations.updateMessageText).toHaveBeenCalledWith('hello');
    adapter._composeText.toNumbers = [{ phoneNumber: '+1' }];
    adapter._newSMS('+16505550109', 'new text', false, null, { name: 'Recipient' });
    expect(adapter._composeText.addToNumber).toHaveBeenCalledWith({
      phoneNumber: '+16505550109',
      name: 'Recipient',
    });

    adapter._newCall('+16505550108', true, 'anonymous');
    expect(adapter._callingSettings.updateFromNumber).toHaveBeenCalledWith({
      phoneNumber: 'anonymous',
    });
    expect(adapter._dialerUI.call).toHaveBeenCalledWith({
      recipient: { phoneNumber: '+16505550108' },
    });

    adapter._autoPopulateConversationText('draft', [
      { name: 'contact.vcf', content: 'data:text/vcard;base64,QQ==' },
    ]);
    expect(adapter._conversations.updateMessageText).toHaveBeenCalledWith('draft');
    expect(adapter._conversations.addAttachment).toHaveBeenCalled();

    adapter._updateCallingSettings({
      callWith: 'browser',
      myLocation: 'Home',
      ringoutPrompt: true,
      fromNumber: '+16505550100',
    });
    adapter._updateSmsSettings({ senderNumber: '+16505550100' });
    await adapter._setPresence({ userStatus: 'Busy', dndStatus: 'DoNotAcceptAnyCalls' });
    await adapter._updateRingtone({
      name: 'Bell',
      uri: 'data:audio/mp3;base64,QQ==',
      volume: 0.4,
    });
    adapter._onUpdateAutoLogSettings({ call: true, message: false });
    adapter._onUpdateFeatureConfig({
      chat: true,
      text: false,
      fax: true,
      voicemail: false,
      meetings: true,
      contacts: false,
      recordings: true,
    });
    adapter._onUpdateAIAssistantSettings({
      showAiAssistantWidget: true,
      showAiAssistantWidgetReadOnly: true,
      autoStartAiAssistant: true,
      autoStartAiAssistantReadOnly: true,
    });
    adapter._onUpdateSmsTypingTimeTracking({ enabled: true });
    adapter._setSideDrawerExtended(true);
    adapter._setPhoneNumberFormat({ formatType: 'custom', template: '###' });

    expect(adapter._callingSettings.setData).toHaveBeenCalledWith(
      expect.objectContaining({ callWith: callingOptions.browser }),
    );
    expect(adapter._composeText.updateSenderNumber).toHaveBeenCalledWith('+16505550100');
    expect(adapter._presence._update).toHaveBeenCalled();
    expect(adapter._audioSettings.setData).toHaveBeenCalledWith({ ringtoneVolume: 0.4 });
    expect(adapter._webphone.setRingtone).toHaveBeenCalled();
    expect(adapter._callLogger.setAutoLog).toHaveBeenCalledWith(true);
    expect(adapter._conversationLogger.setAutoLog).toHaveBeenCalledWith(false);
    expect(adapter._appFeatures.setConfigState).toHaveBeenCalledWith(
      expect.objectContaining({ Glip: true, SMS: false, CallRecording: true }),
    );
    expect(adapter._smartNotes.setShowSmartNote).toHaveBeenCalledWith(true, true, undefined);
    expect(adapter._smartNotes.setAutoStartSmartNote).toHaveBeenCalledWith(true, true, undefined);
    expect(adapter._smsTypingTimeTracker.setEnabled).toHaveBeenCalledWith(true);
    expect(adapter._sideDrawerUI.setExtended).toHaveBeenCalledWith(true);
    expect(adapter._phoneNumberFormat.setSetting).toHaveBeenCalledWith(
      expect.objectContaining({ formatType: 'custom', template: '###' }),
    );
  });

  it('handles current-call/view-calls navigation, demo warning, and matched contact updates', async () => {
    const adapter = createAdapter({
      _webphone: {
        ...createAdapter()._webphone,
        sessions: [{
          id: 'connected-session',
          callStatus: sessionStatus.connected,
          direction: callDirections.inbound,
          from: '+16505550101',
          partyData: { sessionId: 'telephony-1' },
        }],
        ringSession: { id: 'ring-session', minimized: false },
      },
      _isUsingDefaultClientId: true,
    });
    global.localStorage = {
      getItem: jest.fn(() => null),
      setItem: jest.fn(),
    };

    await adapter._onNavigateToCurrentCall();
    await adapter._onNavigateToViewCalls();
    adapter._checkIfShowDemoWarning();
    adapter._setCallContactMatched({
      telephonySessionId: 'telephony-1',
      contactId: 'contact-1',
    });

    expect(adapter._router.push).toHaveBeenCalledWith('/calls/active/connected-session');
    expect(adapter._router.push).toHaveBeenCalledWith('/history');
    expect(adapter._userGuide.dismiss).toHaveBeenCalled();
    expect(adapter._quickAccess.exit).toHaveBeenCalled();
    expect(adapter._webphone.toggleMinimized).toHaveBeenCalledWith('ring-session');
    expect(adapter.store.dispatch).toHaveBeenCalledWith({
      type: actionTypes.setShowDemoWarning,
      show: true,
    });
    expect(adapter._contactMatcher.setCallMatched).toHaveBeenCalledWith({
      telephonySessionId: 'telephony-1',
      toEntityId: 'contact-1',
    });
    expect(adapter._webphone.updateSessionMatchedContact).toHaveBeenCalledWith(
      'connected-session',
      { id: 'contact-1', name: 'Ada' },
    );
  });

  it('covers webphone sync, record errors, pick errors, and guard branches', async () => {
    const adapter = createAdapter({
      _stylesUri: 'https://example.com/extend.css',
    });
    global.window = {
      document: {
        createElement: jest.fn(() => ({})),
        head: {
          appendChild: jest.fn(),
        },
      },
    };
    adapter._insertExtendStyle();
    expect(global.window.document.head.appendChild).toHaveBeenCalledWith({
      type: 'text/css',
      rel: 'stylesheet',
      href: 'https://example.com/extend.css',
    });

    adapter._webphone.ready = false;
    adapter._syncWebphoneSessions();
    expect(adapter._postMessage).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'rc-webphone-sessions-sync' }),
    );
    adapter._webphone.ready = true;
    adapter._webphone.sessions = [{
      id: 'session-1',
      direction: callDirections.inbound,
      from: '+16505550101',
      partyData: { sessionId: 'telephony-1' },
    }];
    adapter._syncWebphoneSessions();
    expect(adapter._postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'rc-webphone-sessions-sync',
        calls: [expect.objectContaining({ contactMatch: { id: 'contact-1', name: 'Ada' } })],
      }),
    );

    adapter._disableInactiveTabCallEvent = true;
    adapter._tabManager.active = false;
    adapter.telephonySessionNotify({ id: 'inactive-session' });
    expect(adapter._postMessage).not.toHaveBeenCalledWith(
      expect.objectContaining({
        telephonySession: { id: 'inactive-session' },
      }),
    );

    adapter._controlCall('startRecord', 'session-1', {});
    adapter._controlCall('stopRecord', 'session-1', {});
    adapter._controlCall('unknown', 'session-1', {});

    await adapter._pickCall(null, 'telephony-1');
    await adapter._pickCall('park-1', null);
    adapter._callingSettings.callingMode = callingModes.webphone;
    await adapter._pickCall('missing', 'missing-call');
    adapter._monitoredExtensions.monitoredExtensions.push({
      extension: { id: 'no-type' },
      presence: {
        activeCalls: [{ telephonySessionId: 'telephony-5' }],
      },
    });
    await adapter._pickCall('no-type', 'telephony-5');
    adapter._monitoredExtensions.monitoredExtensions.push({
      extension: { id: 'bad-type', type: 'Unsupported' },
      presence: {
        activeCalls: [{ telephonySessionId: 'telephony-6' }],
      },
    });
    await adapter._pickCall('bad-type', 'telephony-6');
    adapter._monitoredExtensions.monitoredExtensions.push({
      extension: { id: 'throws', type: 'ParkLocation' },
      presence: {
        activeCalls: [{ telephonySessionId: 'telephony-7' }],
      },
    });
    adapter._webphone.pickParkLocation.mockRejectedValueOnce(new Error('pick failed'));
    await adapter._pickCall('throws', 'telephony-7');
    expect(adapter._postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'rc-control-call-error',
        error: 'PickError',
      }),
    );

    adapter._webphone.sessions = [{
      id: 'record-session',
      recordStatus: recordStatus.recording,
      partyData: { sessionId: 'telephony-record' },
    }];
    adapter._activeCallControl.getActiveSession.mockReturnValue({
      recordStatus: recordStatus.recording,
      to: '+16505550101',
    });
    await adapter._startRecord('record-session');
    expect(adapter._postMessage).toHaveBeenCalledWith({
      type: 'rc-control-call-error',
      error: 'RecordError',
      message: "Can't record at current status",
      callId: 'record-session',
    });

    adapter._activeCallControl.getActiveSession.mockReturnValue({
      recordStatus: recordStatus.idle,
      to: '+16505550101',
    });
    adapter._activeCallControl.startRecord.mockRejectedValueOnce(new Error('record failed'));
    await adapter._startRecord('record-session');
    expect(adapter._alert.danger).toHaveBeenCalledWith({
      message: webphoneErrors.recordError,
      payload: { errorCode: 'record failed' },
    });
    expect(adapter._webphone.updateRecordStatus).toHaveBeenCalledWith(
      'record-session',
      recordStatus.idle,
    );

    adapter._activeCallControl.getActiveSession.mockReturnValue({
      recordStatus: recordStatus.idle,
      to: '+16505550101',
    });
    await adapter._stopRecord('record-session');
    expect(adapter._postMessage).toHaveBeenCalledWith({
      type: 'rc-control-call-error',
      error: 'RecordError',
      message: "Can't stop record at current status",
      callId: 'record-session',
    });

    adapter._activeCallControl.getActiveSession.mockReturnValue({
      recordStatus: recordStatus.recording,
      to: '+16505550101',
    });
    adapter._activeCallControl.stopRecord.mockRejectedValueOnce({
      response: { status: 403 },
    });
    await adapter._stopRecord('record-session');
    expect(adapter._alert.danger).toHaveBeenCalledWith({
      message: 'stopRecordDisabled',
    });

    adapter._activeCallControl.stopRecord.mockRejectedValueOnce(new Error('stop failed'));
    await adapter._stopRecord('record-session');
    expect(adapter._alert.danger).toHaveBeenCalledWith({
      message: webphoneErrors.recordError,
      payload: { errorCode: 'stop failed' },
    });

    adapter._webphone.sessions = [{
      id: 'conference-session',
      recordStatus: recordStatus.idle,
      partyData: { sessionId: 'conference-record' },
    }];
    adapter._activeCallControl.getActiveSession.mockReturnValue({
      recordStatus: recordStatus.idle,
      to: 'conference',
    });
    await adapter._startRecord('conference-session');
    expect(adapter._webphone.startRecord).toHaveBeenCalledWith('conference-session');
    adapter._webphone.sessions[0].recordStatus = recordStatus.recording;
    adapter._activeCallControl.getActiveSession.mockReturnValue({
      recordStatus: recordStatus.recording,
      to: 'conference',
    });
    await adapter._stopRecord('conference-session');
    expect(adapter._webphone.stopRecord).toHaveBeenCalledWith('conference-session');

    adapter._auth.loggedIn = false;
    adapter._newSMS('+16505550101', 'ignored');
    expect(adapter._composeTextUI.gotoComposeText).not.toHaveBeenCalledWith();
    adapter._newCall('+16505550101', true);
    expect(adapter._dialerUI.call).not.toHaveBeenCalledWith(
      expect.objectContaining({ recipient: { phoneNumber: '+16505550101' } }),
    );

    adapter._auth.loggedIn = true;
    adapter._call.isIdle = false;
    adapter._newCall('+16505550101', true);
    expect(adapter._dialerUI.call).not.toHaveBeenCalledWith(
      expect.objectContaining({ recipient: { phoneNumber: '+16505550101' } }),
    );
    adapter._call.isIdle = true;
    adapter._webphone.sessions = [{ to: '+16505550101' }];
    adapter._newCall('+16505550101', true);
    expect(adapter._dialerUI.call).not.toHaveBeenCalledWith(
      expect.objectContaining({ recipient: { phoneNumber: '+16505550101' } }),
    );

    await adapter._setPresence({ dndStatus: 'Invalid', userStatus: 'Available' });
    await adapter._setPresence({ dndStatus: 'TakeAllCalls', userStatus: 'Invalid' });
    expect(adapter._presence._update).not.toHaveBeenCalledWith(
      expect.objectContaining({ userStatus: 'Invalid' }),
    );
    await adapter._updateRingtone({
      name: 'Unsafe',
      uri: 'ftp://example.com/ring.mp3',
      volume: 2,
    });
    expect(adapter._audioSettings.setData).not.toHaveBeenCalledWith({ ringtoneVolume: 2 });
    expect(adapter._webphone.setRingtone).not.toHaveBeenCalledWith(
      expect.objectContaining({ incomingAudio: 'ftp://example.com/ring.mp3' }),
    );

  });

  it('covers adapter guard paths and alternate state notifications', async () => {
    const adapter = createAdapter();

    adapter._onMessage({});
    adapter._callingSettings.ready = false;
    adapter._onMessage({ data: { type: 'rc-calling-settings-update', callWith: 'browser' } });
    expect(adapter._callingSettings.setData).not.toHaveBeenCalled();
    adapter._composeText.ready = false;
    adapter._onMessage({ data: { type: 'rc-sms-settings-update', senderNumber: '+1' } });
    expect(adapter._composeText.updateSenderNumber).not.toHaveBeenCalled();
    adapter._auth.logout.mockClear();
    adapter._auth.loggedIn = false;
    adapter._onMessage({ data: { type: 'rc-adapter-logout' } });
    expect(adapter._auth.logout).not.toHaveBeenCalled();
    adapter._oAuth.openOAuthPage.mockClear();
    adapter._auth.loggedIn = true;
    adapter._onMessage({ data: { type: 'rc-adapter-login' } });
    expect(adapter._oAuth.openOAuthPage).not.toHaveBeenCalled();
    adapter._navigateTo = jest.fn();
    adapter._onMessage({ data: { type: 'rc-adapter-navigate-to' } });
    expect(adapter._navigateTo).not.toHaveBeenCalled();

    await expect(adapter._handleRCAdapterMessageRequest({})).resolves.toBeUndefined();
    adapter._appFeatures.hasMeetingsPermission = false;
    await adapter._handleRCAdapterMessageRequest({
      body: {},
      path: '/schedule-meeting',
      requestId: 'no-meeting',
    });
    expect(adapter._meeting.schedule).not.toHaveBeenCalledWith(expect.anything());
    adapter._meeting.schedule.mockResolvedValueOnce(null);
    await expect(adapter._scheduleMeeting({ title: 'No response' })).resolves.toEqual({
      error: 'schedule failed',
    });
    adapter._popupWindowManager.checkPopupWindowOpened.mockResolvedValueOnce(true);
    await adapter._handleRCAdapterMessageRequest({
      body: { alert: true },
      path: '/check-popup-window',
      requestId: 'popup-open',
    });
    expect(adapter._alert.warning).toHaveBeenCalledWith({ message: 'popupWindowOpened' });

    adapter.state.status = moduleStatuses.pending;
    adapter._pushPresence();
    adapter._checkSideDrawerOpen();
    adapter._checkThemeType();
    adapter._checkAiAssistantSettings();
    adapter.state.status = moduleStatuses.ready;

    adapter._auth.ready = false;
    adapter._checkLoginStatus();
    adapter._auth.ready = true;
    adapter._extensionInfo.ready = false;
    adapter._loggedIn = null;
    adapter._checkLoginStatus();
    expect(adapter._loggedIn).toBeNull();
    adapter._extensionInfo.ready = true;
    adapter._auth.loggedIn = false;
    adapter._checkLoginStatus();
    expect(adapter._postMessage).toHaveBeenCalledWith(expect.objectContaining({
      loggedIn: false,
      type: 'rc-login-status-notify',
    }));
    adapter._postMessage.mockClear();
    adapter._checkLoginStatus();
    expect(adapter._postMessage).not.toHaveBeenCalledWith(expect.objectContaining({
      type: 'rc-login-status-notify',
    }));

    adapter._regionSettings.ready = false;
    adapter._checkRegionChanged();
    adapter._regionSettings.ready = true;
    adapter._regionSettings.countryCode = 'GB';
    adapter._regionSettings.areaCode = '020';
    adapter._checkRegionChanged();
    expect(adapter._postMessage).toHaveBeenCalledWith(expect.objectContaining({
      areaCode: '',
      countryCode: 'GB',
      type: 'rc-region-settings-notify',
    }));
    adapter._postMessage.mockClear();
    adapter._checkRegionChanged();
    expect(adapter._postMessage).not.toHaveBeenCalledWith(expect.objectContaining({
      type: 'rc-region-settings-notify',
    }));

    adapter._callingSettings.ready = false;
    adapter._checkCallingSettingsChanged();
    adapter._callingSettings.ready = true;
    adapter._enableFromNumberSetting = false;
    adapter._checkCallingSettingsChanged();
    expect(adapter._postMessage).toHaveBeenCalledWith(expect.objectContaining({
      type: 'rc-calling-settings-notify',
    }));
    adapter._postMessage.mockClear();
    adapter._checkCallingSettingsChanged();
    expect(adapter._postMessage).not.toHaveBeenCalledWith(expect.objectContaining({
      type: 'rc-calling-settings-notify',
    }));

    adapter._enableSmsSettingEvent = false;
    adapter._checkSmsSettingsChanged();
    adapter._enableSmsSettingEvent = true;
    adapter._composeText.ready = false;
    adapter._checkSmsSettingsChanged();
    adapter._composeText.ready = true;
    adapter._smsSenderNumber = adapter._composeText.senderNumber;
    adapter._postMessage.mockClear();
    adapter._checkSmsSettingsChanged();
    expect(adapter._postMessage).not.toHaveBeenCalledWith(expect.objectContaining({
      type: 'rc-sms-settings-notify',
    }));

    adapter._dialerDisabled = false;
    adapter._dialerUI.showSpinner = false;
    adapter._dialerUI.isCallButtonDisabled = false;
    adapter._checkDialUIStatusChanged();
    expect(adapter._postMessage).not.toHaveBeenCalledWith(expect.objectContaining({
      type: 'rc-dialer-status-notify',
    }));
    adapter._meetingReady = false;
    adapter._meeting.ready = false;
    adapter._checkMeetingStatusChanged();
    expect(adapter._postMessage).not.toHaveBeenCalledWith(expect.objectContaining({
      type: 'rc-meeting-status-notify',
    }));

    adapter._brand = { brandConfig: {} };
    adapter._checkBrandConfigChanged();
    expect(adapter._postMessage).toHaveBeenCalledWith(expect.objectContaining({
      iconUri: undefined,
      logoUri: undefined,
      type: 'rc-brand-assets-notify',
    }));
    adapter._webphoneConnectionStatus = adapter._webphone.connectionStatus;
    adapter._postMessage.mockClear();
    adapter._checkWebphoneStatus();
    expect(adapter._postMessage).not.toHaveBeenCalledWith(expect.objectContaining({
      type: 'rc-webphone-connection-status-notify',
    }));
    adapter._webphone.connectionStatus = 'disconnected';
    adapter._webphone.device = null;
    adapter._checkWebphoneStatus();
    expect(adapter._postMessage).toHaveBeenCalledWith(expect.objectContaining({
      deviceId: null,
      type: 'rc-webphone-connection-status-notify',
    }));

    adapter._sideDrawerUI.extended = true;
    adapter._checkSideDrawerOpen();
    expect(adapter._syncSize).toHaveBeenCalledWith({ height: 500, width: 600 });
    adapter._checkSideDrawerOpen();
    expect(adapter._syncSize).toHaveBeenCalledTimes(1);
    adapter._themeType = adapter._theme.themeType;
    adapter._postMessage.mockClear();
    adapter._checkThemeType();
    expect(adapter._postMessage).not.toHaveBeenCalledWith(expect.objectContaining({
      type: 'rc-adapter-theme-notify',
    }));
    adapter._aiAssistantEnabled = adapter._smartNotes.showSmartNote;
    adapter._aiAssistantAutoStart = adapter._smartNotes.autoStartSmartNote;
    adapter._checkAiAssistantSettings();
    expect(adapter._postMessage).not.toHaveBeenCalledWith(expect.objectContaining({
      type: 'rc-adapter-ai-assistant-settings-notify',
    }));

    adapter._setCallContactMatched({});
    adapter._setCallContactMatched({ contactId: 'contact-1', telephonySessionId: 'missing' });
    adapter._webphone.sessions = [{
      direction: callDirections.outbound,
      id: 'outbound',
      partyData: { sessionId: 'telephony-out' },
      to: '+16505550199',
    }];
    adapter._setCallContactMatched({
      contactId: 'missing-contact',
      telephonySessionId: 'telephony-out',
    });
    expect(adapter._webphone.updateSessionMatchedContact).not.toHaveBeenCalledWith(
      'outbound',
      expect.anything(),
    );

    adapter._auth.loggedIn = true;
    adapter._composeText.toNumbers = [];
    adapter._composeTextUI.gotoComposeText.mockClear();
    adapter._phoneNumberFormat.format.mockReturnValueOnce('Main x101');
    adapter._newSMS('101', '', false);
    expect(adapter._composeText.addToNumber).toHaveBeenCalledWith({
      name: 'Main x101',
      phoneNumber: '101',
    });
    adapter._conversations.currentConversationId = null;
    adapter._autoPopulateConversationText('ignored', []);
    expect(adapter._conversations.updateMessageText).not.toHaveBeenCalledWith('ignored');
    adapter._conversations.currentConversationId = 'conversation-1';
    adapter._autoPopulateConversationText({ body: 'ignored' }, []);
    expect(adapter._conversations.updateMessageText).not.toHaveBeenCalledWith({ body: 'ignored' });

    adapter._callingSettings.setData.mockClear();
    adapter._callingSettings.updateFromNumber.mockClear();
    adapter._updateCallingSettings({ callWith: 'invalid', fromNumber: '+1999' });
    expect(adapter._callingSettings.setData).not.toHaveBeenCalled();
    expect(adapter._callingSettings.updateFromNumber).not.toHaveBeenCalled();
    adapter._updateCallingSettings({ fromNumber: '+16505550100' });
    expect(adapter._callingSettings.updateFromNumber).not.toHaveBeenCalled();
    adapter._composeText.updateSenderNumber.mockClear();
    adapter._updateSmsSettings({ senderNumber: '+1999' });
    expect(adapter._composeText.updateSenderNumber).not.toHaveBeenCalled();

    adapter._onUpdateAutoLogSettings({});
    adapter._onUpdateFeatureConfig({});
    adapter._onUpdateAIAssistantSettings({});
    adapter._onUpdateSmsTypingTimeTracking({});
    expect(adapter._appFeatures.setConfigState).not.toHaveBeenCalledWith({});

    await adapter._updateRingtone({ name: 123, uri: 'https://example.com/ring.mp3', volume: -1 });
    expect(adapter._audioSettings.setData).not.toHaveBeenCalledWith({ ringtoneVolume: -1 });

    const noDrawer = createAdapter({
      _sideDrawerUI: {
        ...adapter._sideDrawerUI,
        enabled: false,
        openApps: jest.fn(),
      },
    });
    noDrawer.ringCallNotify({ from: '+16505550101', id: 'ring' });
    expect(noDrawer._sideDrawerUI.openApps).not.toHaveBeenCalled();
    const noApps = createAdapter({
      _thirdPartyService: {
        apps: [],
        pinAppIds: [],
      },
    });
    noApps.initCallNotify({ id: 'init', to: '+16505550102' });
    expect(noApps._sideDrawerUI.openApps).not.toHaveBeenCalled();
    const missingPin = createAdapter({
      _thirdPartyService: {
        apps: [{ id: 'app-2' }],
        pinAppIds: ['missing-app'],
      },
    });
    missingPin.initCallNotify({ id: 'init', to: '+16505550102' });
    expect(missingPin._sideDrawerUI.openAppTab).not.toHaveBeenCalled();

    adapter._userGuide = null;
    adapter._quickAccess = null;
    adapter._webphone.ringSession = { id: 'ring-session', minimized: true };
    adapter._webphone.sessions = [];
    adapter._webphone.activeSession = null;
    await adapter._onNavigateToCurrentCall();
    expect(adapter._router.push).not.toHaveBeenCalledWith('/calls/active/undefined');

    global.localStorage = {
      getItem: jest.fn(() => `${Date.now()}`),
      setItem: jest.fn(),
    };
    adapter._isUsingDefaultClientId = true;
    adapter._checkIfShowDemoWarning();
    expect(adapter.store.dispatch).not.toHaveBeenCalledWith({
      type: actionTypes.setShowDemoWarning,
      show: true,
    });
    global.window = { parent: { postMessage: jest.fn() } };
    Adapter.prototype._postMessage({ type: 'direct-post' });
    expect(global.window.parent.postMessage).toHaveBeenCalledWith({ type: 'direct-post' }, '*');
    global.window = { parent: null };
    expect(() => Adapter.prototype._postMessage({ type: 'no-parent' })).not.toThrow();
  });

  it('covers adapter fallback ids, request formats, and notification no-ops', async () => {
    const adapter = createAdapter();

    adapter._controlCall('answer', null, {});
    adapter._controlCall('reject', null, {});
    adapter._controlCall('hangup', null, {});
    adapter._controlCall('hold', null, {});
    adapter._controlCall('unhold', null, {});
    adapter._controlCall('mute', null, {});
    adapter._controlCall('unmute', null, {});
    adapter._controlCall('toggleRingingDialog', null, {});
    adapter._controlCall('dtmf', null, { dtmf: '9' });
    expect(adapter._webphone.answer).toHaveBeenCalledWith('ring-session');
    expect(adapter._webphone.reject).toHaveBeenCalledWith('ring-session');
    expect(adapter._webphone.hangup).toHaveBeenCalledWith('active-session');
    expect(adapter._webphone.sendDTMF).toHaveBeenCalledWith('9', 'active-session');

    adapter._popupWindowManager.checkPopupWindowOpened.mockResolvedValueOnce(false);
    adapter._webphone.sessions = [];
    await adapter._handleRCAdapterMessageRequest({
      path: '/check-popup-window',
      requestId: 'popup-closed',
      body: { alert: false },
    });
    expect(adapter._alert.warning).not.toHaveBeenCalledWith({
      message: 'cannotPopupWindowWithCall',
    });

    adapter._alert.alert.mockResolvedValueOnce('legacy-alert-id');
    await adapter._handleRCAdapterMessageRequest({
      path: '/custom-alert-message',
      requestId: 'legacy-alert',
      alertLevel: 'danger',
      alertMessage: 'Legacy alert',
      ttl: 100,
    });
    expect(adapter._alert.alert).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'danger',
        ttl: 100,
        payload: expect.objectContaining({
          alertMessage: 'Legacy alert',
        }),
      }),
    );
    adapter._smsTemplates.createOrUpdateTemplate.mockResolvedValueOnce({
      message: 'template failed',
    });
    await adapter._handleRCAdapterMessageRequest({
      path: '/create-sms-template',
      requestId: 'template-error',
      body: { displayName: 'Bad', text: 'No' },
    });
    expect(adapter._postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        responseId: 'template-error',
        response: 'template failed',
      }),
    );

    adapter._lastActiveCalls = [{ sessionId: 'old', direction: 'Inbound' }];
    adapter._presence.activeCalls = [{ sessionId: 'new', direction: 'Inbound' }];
    adapter._disableInactiveTabCallEvent = true;
    adapter._tabManager.active = false;
    adapter._pushActiveCalls();
    expect(adapter._lastActiveCalls).toBe(adapter._presence.activeCalls);
    adapter._disableInactiveTabCallEvent = false;
    adapter._lastActiveCalls = [{ sessionId: 'old', direction: 'Inbound' }];
    adapter._pushActiveCalls();
    expect(adapter._postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'rc-active-call-notify',
        call: expect.objectContaining({ sessionId: 'new' }),
      }),
    );
    adapter._callingSettings.callingMode = callingModes.webphone;
    adapter._postMessage.mockClear();
    adapter._sendRingoutCallNotification([{ id: 'ringout', sessionId: 'ringout' }]);
    expect(adapter._postMessage).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'rc-ringout-call-notify' }),
    );

    adapter._callLogger.ready = false;
    adapter._checkAutoCallLoggerChanged();
    adapter._callLogger.ready = true;
    adapter._checkAutoCallLoggerChanged();
    expect(adapter._postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'rc-callLogger-auto-log-notify',
        autoLog: false,
      }),
    );
    adapter._conversationLogger.ready = false;
    adapter._checkAutoConversationLoggerChanged();
    adapter._conversationLogger.ready = true;
    adapter._checkAutoConversationLoggerChanged();
    expect(adapter._postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'rc-messageLogger-auto-log-notify',
        autoLog: false,
      }),
    );

    await adapter._navigateTo('/log/call/monitor-session');
    expect(adapter._sideDrawerUI.gotoLogCall).toHaveBeenCalledWith(
      'monitor-session',
      null,
    );
    adapter._sideDrawerUI.modalOpen = false;
    await adapter._navigateTo('/missing');
    expect(adapter._router.push).toHaveBeenCalledWith('/missing');
    await adapter._navigateTo('/missing');
    await adapter._navigateTo('/log/messages/missing-thread');
    await adapter._navigateTo('/contacts');
    expect(adapter._sideDrawerUI.clearWidgets).not.toHaveBeenCalledWith();

    adapter._auth.loggedIn = true;
    adapter._composeText.toNumbers = [];
    adapter._newSMS('+16505550110');
    expect(adapter._composeTextUI.gotoComposeText).toHaveBeenCalled();
    adapter._newCall('+16505550111');
    expect(adapter._dialerUI.setToNumberField).toHaveBeenCalledWith('+16505550111');

    adapter._presence.ready = false;
    await adapter._setPresence({ dndStatus: 'TakeAllCalls', userStatus: 'Available' });
    expect(adapter._presence._update).not.toHaveBeenCalled();
    adapter._presence.ready = true;
    adapter._presence._update.mockClear();
    await adapter._setPresence({});
    expect(adapter._presence._update).toHaveBeenCalledWith({
      dndStatus: 'TakeAllCalls',
      userStatus: 'Available',
    });

    await adapter._updateRingtone({
      name: 'Http',
      uri: 'http://example.com/ring.mp3',
    });
    expect(adapter._webphone.setRingtone).toHaveBeenCalledWith(
      expect.objectContaining({
        incomingAudio: 'http://example.com/ring.mp3',
      }),
    );

    adapter._phoneNumberFormat.ready = false;
    adapter._checkPhoneNumberFormatSettingsChanged();
    adapter._phoneNumberFormat.ready = true;
    adapter._phoneNumberFormat.formatType = 'national';
    adapter._checkPhoneNumberFormatSettingsChanged();
    expect(adapter._postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'rc-adapter-phone-number-format-settings-notify',
        template: '',
      }),
    );
  });
});
