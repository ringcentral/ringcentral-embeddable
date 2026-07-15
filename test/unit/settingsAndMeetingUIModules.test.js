/** @jest-environment jsdom */
const { setStagedState } = require('@ringcentral-integration/core/lib/usm-redux/utils');

jest.mock('@ringcentral-integration/commons/lib/debounce', () => (
  (fn) => function debouncedFunction(...args) {
    return fn.apply(this, args);
  }
));

jest.mock('@ringcentral-integration/commons/lib/formatNumber', () => ({
  formatNumber: jest.fn(({ phoneNumber }) => `formatted-${phoneNumber}`),
}));

jest.mock('../../src/components/DialerPanel/FromField/helper', () => ({
  getPhoneNumberLabel: jest.fn((number) => number.label || 'Main number'),
}));

jest.mock('@ringcentral-integration/widgets/modules/AudioSettingsUI', () => ({
  AudioSettingsUI: class BaseAudioSettingsUI {
    constructor(deps) {
      this._deps = deps;
    }

    getUIProps() {
      return {
        baseAudio: true,
      };
    }

    getUIFunctions() {
      return {
        baseAudioFunction: jest.fn(),
      };
    }
  },
}));

jest.mock('@ringcentral-integration/widgets/modules/DialerUI', () => ({
  DialerUI: class BaseDialerUI {
    constructor(deps) {
      this._deps = deps;
      this.onCallButtonClick = jest.fn();
    }

    getUIProps() {
      const { callingModes } = require('@ringcentral-integration/commons/modules/CallingSettings/callingModes');
      return {
        baseDialer: true,
        callingMode: callingModes.ringout,
      };
    }

    getUIFunctions() {
      return {
        baseDialerFunction: jest.fn(),
      };
    }

    async call(options) {
      return {
        calledWith: options,
      };
    }
  },
}));

jest.mock('@ringcentral-integration/widgets/modules/SettingsUI', () => ({
  SettingsUI: class BaseSettingsUI {
    constructor(deps) {
      this._deps = deps;
    }

    getUIProps() {
      return {
        baseSettings: true,
      };
    }

    getUIFunctions() {
      return {
        baseSettingsFunction: jest.fn(),
      };
    }
  },
}));

const { AudioSettingsUI } = require('../../src/modules/AudioSettingsUI');
const { DialerUI } = require('../../src/modules/DialerUI');
const { MeetingHistoryUI } = require('../../src/modules/MeetingHistoryUI');
const { MeetingHomeUI } = require('../../src/modules/MeetingHomeUI');
const { MeetingInviteUI } = require('../../src/modules/MeetingInviteModalUI');
const { PhoneNumberFormatSettingUI } = require('../../src/modules/PhoneNumberFormatSettingUI');
const { RingtoneSettingsUI } = require('../../src/modules/RingtoneSettingsUI');
const { SettingsUI } = require('../../src/modules/SettingsUI');
const { TextSettingUI } = require('../../src/modules/TextSettingUI');
const { ThemeSettingUI } = require('../../src/modules/ThemeSettingUI');
const { ThirdPartySettingSectionUI } = require('../../src/modules/ThirdPartySettingSectionUI');
const { VoicemailDropSettingsUI } = require('../../src/modules/VoicemailDropSettingsUI');
const { VoicemailDropUI } = require('../../src/modules/VoicemailDropUI');
const voicemailDropStatus = require('../../src/modules/WebphoneV2/voicemailDropStatus').default;

function attachAnalytics(ui) {
  ui.parentModule = {
    analytics: {
      track: jest.fn(),
    },
  };
}

function createFormatDeps(overrides = {}) {
  return {
    accountInfo: {
      mainCompanyNumber: '+16505550100',
      maxExtensionNumberLength: 6,
    },
    extensionInfo: {
      isEDPEnabled: false,
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

function createDialerDeps(overrides = {}) {
  return {
    ...createFormatDeps(),
    alert: {
      warning: jest.fn(),
    },
    call: {
      onToNumberMatch: jest.fn(),
    },
    callingSettings: {
      isRingoutCallerIdEnabled: true,
    },
    modalUI: {
      alert: jest.fn(() => 'modal-1'),
      close: jest.fn(),
      confirm: jest.fn(async () => true),
    },
    phoneNumberFormat: {
      format: jest.fn(({ phoneNumber }) => (
        phoneNumber === '101' ? 'Main x101' : `formatted-${phoneNumber}`
      )),
    },
    sideDrawerUI: {
      clearWidgets: jest.fn(),
      modalOpen: false,
    },
    thirdPartyService: {
      checkDoNotContact: jest.fn(async () => ({ result: false })),
      doNotContactRegistered: false,
    },
    webphone: {
      sessions: [],
    },
    ...overrides,
  };
}

function createMeetingHistoryDeps(overrides = {}) {
  return {
    dateTimeFormat: {
      formatDateTime: jest.fn(() => 'formatted-date'),
      ready: true,
    },
    genericMeeting: {
      fetchHistoryMeetings: jest.fn(async () => ({
        paging: {
          nextPageToken: 'next-page',
        },
      })),
      historyMeetings: [{ id: 'meeting-1' }],
      ready: true,
    },
    locale: {
      currentLocale: 'en-US',
      ready: true,
    },
    ...overrides,
  };
}

function createMeetingHomeDeps(overrides = {}) {
  return {
    genericMeeting: {
      createInstantMeeting: jest.fn(async () => ({
        meeting: {
          joinUri: 'https://v.ringcentral.com/join/instant',
        },
      })),
      fetchUpcomingMeetings: jest.fn(async () => {}),
      ready: true,
      upcomingMeetings: [{ id: 'upcoming-1' }],
    },
    locale: {
      currentLocale: 'en-US',
      ready: true,
    },
    routerInteraction: {
      push: jest.fn(),
    },
    ...overrides,
  };
}

function createSettingsDeps(overrides = {}) {
  return {
    appFeatures: {
      hasEditCallQueuePresencePermission: true,
      hasHUDPermission: true,
      hasReadCallQueuePresencePermission: true,
      hasRingCXPermission: false,
      hasRingSensePermission: true,
      hasSendSMSPermission: true,
      hasVoicemailDropPermission: true,
      isCallingEnabled: true,
    },
    audioSettings: {
      availableDevices: [{ id: 'input-1' }],
    },
    brand: {
      code: 'rc',
    },
    callLogger: {
      autoLog: true,
      autoLogReadOnly: false,
      autoLogReadOnlyReason: '',
      ready: true,
      setAutoLog: jest.fn(),
    },
    conversationLogger: {
      autoLog: false,
      autoLogReadOnly: true,
      autoLogReadOnlyReason: 'Managed by admin',
      loggerSourceReady: true,
      setAutoLog: jest.fn(),
    },
    extensionInfo: {
      info: {
        permissions: {
          admin: {
            enabled: true,
          },
        },
      },
      ready: true,
    },
    monitoredExtensions: {
      enabled: true,
      toggleEnabled: jest.fn(),
    },
    routerInteraction: {
      push: jest.fn(),
    },
    smartNotes: {
      autoStartSmartNote: false,
      autoStartSmartNoteReadOnly: false,
      autoStartSmartNoteReadOnlyReason: '',
      clientInitialized: true,
      hasPermission: true,
      showSmartNote: true,
      showSmartNoteReadOnly: false,
      showSmartNoteReadOnlyReason: '',
      toggleAutoStartSmartNote: jest.fn(),
      toggleShowSmartNote: jest.fn(),
    },
    thirdPartyService: {
      authorizationLinks: [{ id: 'privacy' }],
      authorizationLogo: 'logo.png',
      authorizationRegistered: true,
      authorizeService: jest.fn(),
      authorized: false,
      authorizedAccount: 'agent@example.com',
      authorizedTitle: 'Disconnect',
      callLoggerAutoLogSettingHidden: false,
      callLoggerAutoSettingDescription: 'Log calls automatically',
      callLoggerAutoSettingLabel: 'Call auto log',
      callLoggerAutoSettingWarning: 'Check CRM fields',
      contactSyncing: true,
      displayName: 'CRM',
      licenseDescription: 'Licensed',
      licenseStatus: 'active',
      licenseStatusColor: 'success',
      messageLoggerAutoSettingDescription: 'Log messages automatically',
      messageLoggerAutoSettingHidden: false,
      messageLoggerAutoSettingLabel: 'Message auto log',
      onClickLicenseRefreshButton: jest.fn(),
      onClickSettingButton: jest.fn(),
      onShowFeedback: jest.fn(),
      onUpdateSetting: jest.fn(),
      serviceInfo: 'Connected CRM',
      serviceName: 'crm',
      settings: [{ id: 'section-1' }],
      showAuthButton: true,
      showAuthRedDot: true,
      showFeedback: true,
      unauthorizeTitle: 'Authorize',
    },
    ...overrides,
  };
}

describe('settings and meeting UI modules', () => {
  beforeEach(() => {
    setStagedState({});
    jest.spyOn(window, 'open').mockImplementation(() => null);
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    setStagedState(undefined);
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('verifies dialer calls, DNC decisions, enter behavior, and extension display names', async () => {
    const deps = createDialerDeps({
      sideDrawerUI: {
        clearWidgets: jest.fn(),
        modalOpen: true,
      },
    });
    const ui = new DialerUI(deps);
    expect(await ui.callVerify({
      phoneNumber: '+16505550123',
      recipient: { id: 'contact-1', phoneNumber: '+16505550123' },
    })).toBe(true);
    expect(deps.sideDrawerUI.clearWidgets).toHaveBeenCalled();
    expect(deps.call.onToNumberMatch).toHaveBeenCalledWith({
      entityId: 'contact-1',
      startTime: expect.any(Number),
    });

    deps.webphone.sessions = new Array(6).fill(null).map((_, index) => ({
      id: `session-${index}`,
      voicemailDropStatus: voicemailDropStatus.sending,
    }));
    await expect(ui.callVerify({ phoneNumber: '+16505550124' })).resolves.toBe(false);
    expect(deps.alert.warning).toHaveBeenCalledWith({
      message: 'tooManyVoicemailDroppingSessions',
    });

    deps.webphone.sessions = [];
    deps.thirdPartyService.doNotContactRegistered = true;
    deps.thirdPartyService.checkDoNotContact.mockResolvedValueOnce({
      message: 'Restricted contact',
      mode: 'restrict',
      result: true,
    });
    await expect(ui.callVerify({
      recipient: {
        contactId: 'contact-2',
        entityType: 'lead',
        name: 'Customer',
        phoneNumber: '+16505550125',
        phoneType: 'business',
        type: 'crm',
      },
    })).resolves.toBe(false);
    expect(deps.modalUI.alert).toHaveBeenCalledWith({
      content: 'Restricted contact',
      title: 'Do Not Call',
    });

    deps.thirdPartyService.checkDoNotContact.mockResolvedValueOnce({
      message: 'Confirm contact',
      mode: 'confirm',
      result: true,
    });
    await expect(ui.callVerify({ phoneNumber: '+16505550126' })).resolves.toBe(true);
    expect(deps.modalUI.close).toHaveBeenCalledWith('modal-1');
    expect(deps.modalUI.confirm).toHaveBeenCalledWith({
      confirmButtonText: 'Call',
      content: 'Confirm contact',
      title: 'Do Not Call',
    }, true);

    deps.thirdPartyService.checkDoNotContact.mockRejectedValueOnce(new Error('DNC unavailable'));
    await expect(ui.callVerify({ phoneNumber: '+16505550127' })).resolves.toBe(true);

    expect(ui.getUIProps()).toMatchObject({
      baseDialer: true,
      showRingoutCallerId: true,
    });
    const functions = ui.getUIFunctions();
    functions.onEnterKeyPress();
    expect(ui.onCallButtonClick).not.toHaveBeenCalled();
    deps.sideDrawerUI.modalOpen = false;
    functions.onEnterKeyPress();
    expect(ui.onCallButtonClick).toHaveBeenCalledWith({
      clickDialerToCall: true,
    });
    expect(functions.formatContactPhone('+16505550123')).toBe('formatted-+16505550123');
    await expect(ui.call({
      recipient: {
        phoneNumber: '101',
      },
    })).resolves.toMatchObject({
      calledWith: {
        recipient: {
          name: 'Main x101',
          phoneNumber: '101',
        },
      },
    });
  });

  it('loads meeting history, formats dates, searches, and handles fetch guards', async () => {
    const deps = createMeetingHistoryDeps();
    const ui = new MeetingHistoryUI(deps);
    expect(ui.getUIProps({ type: 'recordings' })).toMatchObject({
      currentLocale: 'en-US',
      fetchingNextPage: false,
      meetings: [{ id: 'meeting-1' }],
      searchText: '',
      showSpinner: false,
      type: 'recordings',
    });

    const functions = ui.getUIFunctions();
    await functions.fetchMeetings('recordings');
    expect(deps.genericMeeting.fetchHistoryMeetings).toHaveBeenCalledWith({
      pageToken: undefined,
      searchText: '',
      type: 'recordings',
    });
    expect(ui.pageToken).toBe('next-page');
    await functions.fetchNextPageMeetings('recordings');
    expect(deps.genericMeeting.fetchHistoryMeetings).toHaveBeenLastCalledWith({
      pageToken: 'next-page',
      searchText: '',
      type: 'recordings',
    });
    expect(functions.dateTimeFormatter('2026-01-01T00:00:00Z')).toBe('formatted-date');
    functions.onClick('meeting-1');
    expect(window.open).toHaveBeenCalledWith(
      'https://v.ringcentral.com/welcome/meetings/recordings/recording/meeting-1',
    );
    functions.updateSearchText('weekly', 'recordings');
    expect(ui.searchText).toBe('weekly');
    await Promise.resolve();
    await Promise.resolve();
    expect(ui.pageToken).toBe('next-page');

    ui.fetching = true;
    await ui.fetchHistoryMeeting('recordings');
    expect(deps.genericMeeting.fetchHistoryMeetings).toHaveBeenCalledTimes(3);
    ui.fetching = false;
    await ui.fetchHistoryMeeting('recordings', 'noNext');
    expect(deps.genericMeeting.fetchHistoryMeetings).toHaveBeenCalledTimes(3);
    deps.genericMeeting.fetchHistoryMeetings.mockRejectedValueOnce(new Error('history failed'));
    await ui.fetchHistoryMeeting('personal');
    expect(ui.fetching).toBe(false);
  });

  it('routes meeting home actions and opens instant or joined meetings', async () => {
    const deps = createMeetingHomeDeps();
    const ui = new MeetingHomeUI(deps);
    attachAnalytics(ui);
    expect(ui.getUIProps()).toMatchObject({
      currentLocale: 'en-US',
      showSpinner: false,
      upcomingMeetings: [{ id: 'upcoming-1' }],
    });

    const functions = ui.getUIFunctions();
    functions.gotoSchedule();
    await functions.onStart();
    functions.onJoin('');
    functions.onJoin('https://v.ringcentral.com/join/from-link');
    functions.onJoin('123456789');
    await functions.fetchUpcomingMeetings();
    expect(deps.routerInteraction.push).toHaveBeenCalledWith('/meeting/schedule');
    expect(window.open).toHaveBeenCalledWith('https://v.ringcentral.com/join/instant');
    expect(window.open).toHaveBeenCalledWith('https://v.ringcentral.com/join/from-link');
    expect(window.open).toHaveBeenCalledWith('https://v.ringcentral.com/join/123456789');
    expect(deps.genericMeeting.fetchUpcomingMeetings).toHaveBeenCalled();

    deps.genericMeeting.createInstantMeeting.mockResolvedValueOnce(null);
    await expect(functions.onStart()).resolves.toBeUndefined();
  });

  it('saves phone number format, text sender, theme, and third-party setting sections', async () => {
    const formatDeps = createFormatDeps({
      phoneNumberFormat: {
        formatType: 'national',
        formatWithType: jest.fn((_, type) => `example-${type}`),
        readOnly: true,
        readOnlyReason: 'Managed',
        setSetting: jest.fn(),
        supportedFormats: [
          { id: 'national', name: 'National' },
          { id: 'custom', name: 'Custom' },
        ],
        template: '(###) ###-####',
      },
      routerInteraction: {
        goBack: jest.fn(),
      },
    });
    const formatUI = new PhoneNumberFormatSettingUI(formatDeps);
    expect(formatUI.getUIProps().section.items[0].options).toEqual([
      { description: 'Eg. example-national', id: 'national', name: 'National' },
      { description: 'Eg. example-custom', id: 'custom', name: 'Custom' },
    ]);
    formatUI.getUIFunctions().onSave({
      items: [
        { value: 'custom' },
        { value: '###-###-####' },
      ],
    });
    formatUI.getUIFunctions().onBackButtonClick();
    expect(formatDeps.phoneNumberFormat.setSetting).toHaveBeenCalledWith({
      formatType: 'custom',
      template: '###-###-####',
    });
    expect(formatDeps.routerInteraction.goBack).toHaveBeenCalled();

    const textDeps = {
      accountInfo: {
        maxExtensionNumberLength: 6,
      },
      composeText: {
        defaultTextId: '+16505550100',
        setDefaultTextId: jest.fn(),
        updateSenderNumber: jest.fn(),
      },
      locale: {
        currentLocale: 'en-US',
      },
      messageSender: {
        senderNumbersList: [{
          label: 'Direct number',
          phoneNumber: '+16505550100',
        }],
      },
      regionSettings: {
        areaCode: '650',
        countryCode: 'US',
      },
      routerInteraction: {
        goBack: jest.fn(),
      },
    };
    const textUI = new TextSettingUI(textDeps);
    expect(textUI.getUIProps().section.items[0].options).toEqual([{
      description: 'Direct number',
      id: '+16505550100',
      name: 'formatted-+16505550100',
    }]);
    textUI.getUIFunctions().onSave({
      items: [{ value: '+16505550199' }],
    });
    textUI.getUIFunctions().onBackButtonClick();
    expect(textDeps.composeText.setDefaultTextId).toHaveBeenCalledWith('+16505550199');
    expect(textDeps.composeText.updateSenderNumber).toHaveBeenCalledWith('+16505550199');
    expect(textDeps.routerInteraction.goBack).toHaveBeenCalled();

    const themeDeps = {
      routerInteraction: {
        goBack: jest.fn(),
      },
      theme: {
        isAutoMode: true,
        setAutoMode: jest.fn(),
        setThemeType: jest.fn(),
        setThemeTypeSystem: jest.fn(),
        themeType: 'dark',
      },
    };
    const themeUI = new ThemeSettingUI(themeDeps);
    expect(themeUI.getUIProps().section.items[0].value).toBe('auto');
    themeUI.getUIFunctions().onSave({
      items: [{ value: 'auto' }],
    });
    themeUI.getUIFunctions().onSave({
      items: [{ value: 'dark' }],
    });
    themeUI.getUIFunctions().onBackButtonClick();
    expect(themeDeps.theme.setAutoMode).toHaveBeenCalledWith(true);
    expect(themeDeps.theme.setThemeTypeSystem).toHaveBeenCalled();
    expect(themeDeps.theme.setAutoMode).toHaveBeenCalledWith(false);
    expect(themeDeps.theme.setThemeType).toHaveBeenCalledWith('dark');
    expect(themeDeps.routerInteraction.goBack).toHaveBeenCalled();

    const thirdPartyDeps = {
      routerInteraction: {
        goBack: jest.fn(),
      },
      thirdPartyService: {
        onUpdateSetting: jest.fn(() => 'saved'),
        settings: [{
          id: 'section-1',
          items: [{ id: 'field-1' }],
        }],
      },
    };
    const thirdPartyUI = new ThirdPartySettingSectionUI(thirdPartyDeps);
    attachAnalytics(thirdPartyUI);
    expect(thirdPartyUI.getUIProps({
      params: { sectionId: 'section-1' },
    }).section).toEqual(thirdPartyDeps.thirdPartyService.settings[0]);
    expect(thirdPartyUI.getUIFunctions().onSave({ id: 'section-1' })).toBe('saved');
    thirdPartyUI.getUIFunctions().onBackButtonClick();
    expect(thirdPartyDeps.thirdPartyService.onUpdateSetting).toHaveBeenCalledWith({
      id: 'section-1',
    });
    expect(thirdPartyDeps.routerInteraction.goBack).toHaveBeenCalled();
  });

  it('controls ringtone, voicemail drop settings, voicemail dropping, and invite modal state', async () => {
    const ringtoneDeps = {
      audioSettings: {
        ringtoneDeviceId: 'speaker-1',
        ringtoneVolume: 80,
      },
      locale: {
        currentLocale: 'en-US',
      },
      routerInteraction: {
        goBack: jest.fn(),
      },
      webphone: {
        defaultIncomingAudio: 'default-in-audio',
        defaultIncomingAudioFile: 'default-in.mp3',
        defaultOutgoingAudio: 'default-out-audio',
        defaultOutgoingAudioFile: 'default-out.mp3',
        incomingAudio: 'current-audio',
        incomingAudioFile: 'current.mp3',
        setRingtone: jest.fn(),
      },
    };
    const ringtoneUI = new RingtoneSettingsUI(ringtoneDeps);
    attachAnalytics(ringtoneUI);
    expect(ringtoneUI.getUIProps()).toMatchObject({
      currentLocale: 'en-US',
      incomingAudio: 'current-audio',
      ringtoneDeviceId: 'speaker-1',
      ringtoneVolume: 80,
    });
    ringtoneUI.getUIFunctions().onSave({
      incomingAudio: 'new-audio',
      incomingAudioFile: 'new.mp3',
    });
    ringtoneUI.getUIFunctions().onBackButtonClick();
    expect(ringtoneDeps.webphone.setRingtone).toHaveBeenCalledWith({
      incomingAudio: 'new-audio',
      incomingAudioFile: 'new.mp3',
      outgoingAudio: 'default-out-audio',
      outgoingAudioFile: 'default-out.mp3',
    });
    expect(ringtoneDeps.routerInteraction.goBack).toHaveBeenCalled();
    expect(new RingtoneSettingsUI({
      audioSettings: {},
      locale: {},
      routerInteraction: ringtoneDeps.routerInteraction,
    }).getUIProps()).toEqual({});

    const voicemailSettingsDeps = {
      locale: {
        currentLocale: 'en-US',
      },
      routerInteraction: {
        goBack: jest.fn(),
      },
      voicemailDrop: {
        addVoicemailMessage: jest.fn(),
        deleteVoicemailMessage: jest.fn(),
        externalVoicemailDropFiles: [{ id: 'external-1' }],
        fetchExternalVoicemailDropFiles: jest.fn(),
        noBeepSilenceDuration: 3000,
        setNoBeepSilenceDuration: jest.fn(),
        voicemailMessages: [{ id: 'message-1' }],
      },
    };
    const voicemailSettingsUI = new VoicemailDropSettingsUI(voicemailSettingsDeps);
    expect(voicemailSettingsUI.getUIProps()).toMatchObject({
      currentLocale: 'en-US',
      externalVoicemailDropMessages: [{ id: 'external-1' }],
      noBeepSilenceDuration: 3000,
      voicemailMessages: [{ id: 'message-1' }],
    });
    const voicemailSettingsFunctions = voicemailSettingsUI.getUIFunctions();
    voicemailSettingsFunctions.onSave({ id: 'message-2' });
    voicemailSettingsFunctions.onDelete({ id: 'message-1' });
    voicemailSettingsFunctions.onLoadExternalVoicemailDropMessages();
    voicemailSettingsFunctions.onNoBeepSilenceDurationChange(5000);
    voicemailSettingsFunctions.onBackButtonClick();
    expect(voicemailSettingsDeps.voicemailDrop.addVoicemailMessage).toHaveBeenCalledWith({ id: 'message-2' });
    expect(voicemailSettingsDeps.voicemailDrop.deleteVoicemailMessage).toHaveBeenCalledWith({ id: 'message-1' });
    expect(voicemailSettingsDeps.voicemailDrop.fetchExternalVoicemailDropFiles).toHaveBeenCalled();
    expect(voicemailSettingsDeps.voicemailDrop.setNoBeepSilenceDuration).toHaveBeenCalledWith(5000);
    expect(voicemailSettingsDeps.routerInteraction.goBack).toHaveBeenCalled();

    let callEndHandler;
    const voicemailDropDeps = {
      routerInteraction: {
        push: jest.fn(),
      },
      sideDrawerUI: {
        closeWidget: jest.fn(),
        widgets: [{
          id: 'voicemailDrop',
          params: {
            callSessionId: 'call-1',
          },
        }],
      },
      voicemailDrop: {
        allMessages: [{ id: 'drop-1' }],
        fetchExternalVoicemailDropFiles: jest.fn(),
      },
      webphone: {
        dropVoicemailMessage: jest.fn(async () => true),
        onCallEnd: jest.fn((handler) => {
          callEndHandler = handler;
        }),
      },
    };
    const voicemailDropUI = new VoicemailDropUI(voicemailDropDeps);
    attachAnalytics(voicemailDropUI);
    expect(voicemailDropUI.getUIProps()).toEqual({
      voicemailMessages: [{ id: 'drop-1' }],
    });
    callEndHandler({ id: 'call-1' });
    expect(voicemailDropDeps.sideDrawerUI.closeWidget).toHaveBeenCalledWith('voicemailDrop');
    await voicemailDropUI.getUIFunctions().onDrop('call-1', 'drop-1');
    expect(voicemailDropDeps.webphone.dropVoicemailMessage).toHaveBeenCalledWith('call-1', 'drop-1');
    expect(voicemailDropDeps.routerInteraction.push).toHaveBeenCalledWith('/dialer');
    voicemailDropDeps.webphone.dropVoicemailMessage.mockResolvedValueOnce(false);
    await voicemailDropUI.getUIFunctions().onDrop('call-1', 'drop-2');
    expect(voicemailDropDeps.routerInteraction.push).toHaveBeenCalledTimes(1);
    voicemailDropUI.getUIFunctions().onLoad();
    expect(voicemailDropDeps.voicemailDrop.fetchExternalVoicemailDropFiles).toHaveBeenCalled();

    const inviteUI = new MeetingInviteUI({
      locale: {
        currentLocale: 'en-US',
      },
    });
    expect(inviteUI.getUIProps()).toMatchObject({
      currentLocale: 'en-US',
      meetingString: '',
      show: false,
    });
    inviteUI.showModal({ details: 'Join details' });
    expect(inviteUI.getUIProps()).toMatchObject({
      meetingString: 'Join details',
      show: true,
    });
    inviteUI.getUIFunctions().onClose();
    expect(inviteUI.getUIProps().show).toBe(false);
  });

  it('builds settings and audio settings props and executes routed settings actions', () => {
    const settingsDeps = createSettingsDeps();
    const settingsUI = new SettingsUI(settingsDeps);
    expect(settingsUI.getUIProps({ appVersion: '1.2.3' })).toMatchObject({
      autoLogDescription: 'Log calls automatically',
      autoLogEnabled: true,
      autoLogSMSEnabled: false,
      baseSettings: true,
      hudEnabled: true,
      isAdmin: true,
      ringCXLicensed: false,
      ringSenseLicensed: true,
      showAudio: true,
      showAutoLog: true,
      showAutoLogSMS: true,
      showCallQueuePresenceSettings: true,
      showFeedback: true,
      showHUDSettings: true,
      showPhoneNumberFormatSettings: true,
      showSmartNoteSetting: true,
      showText: true,
      showThemeSetting: true,
      showVoicemailDropSettings: true,
      version: '1.2.3',
    });
    expect(settingsUI.getUIProps({ appVersion: '1.2.3' }).thirdPartyAuth).toMatchObject({
      authorized: false,
      serviceName: 'CRM',
    });

    const settingsFunctions = settingsUI.getUIFunctions();
    settingsFunctions.onAutoLogChange(false);
    settingsFunctions.onAutoLogSMSChange(true);
    settingsFunctions.onThirdPartyAuthorize();
    settingsFunctions.onFeedbackSettingsLinkClick();
    settingsFunctions.onThirdPartySettingChanged({ id: 'field-1' }, 'value-1');
    settingsFunctions.gotoThirdPartySection('crm');
    settingsFunctions.onThirdPartyButtonClick('button-1');
    settingsFunctions.onThemeSettingsLinkClick();
    settingsFunctions.onSmartNoteToggle();
    settingsFunctions.onSmartNoteAutoStartToggle();
    settingsFunctions.gotoCallQueuePresenceSettings();
    settingsFunctions.onThirdPartyLicenseRefresh();
    settingsFunctions.onTextSettingsLinkClick();
    settingsFunctions.gotoVoicemailDropSettings();
    settingsFunctions.gotoPhoneNumberFormatSettings();
    settingsFunctions.onHUDSettingsToggle();
    expect(settingsDeps.callLogger.setAutoLog).toHaveBeenCalledWith(false);
    expect(settingsDeps.conversationLogger.setAutoLog).toHaveBeenCalledWith(true);
    expect(settingsDeps.thirdPartyService.authorizeService).toHaveBeenCalled();
    expect(settingsDeps.thirdPartyService.onShowFeedback).toHaveBeenCalled();
    expect(settingsDeps.thirdPartyService.onUpdateSetting).toHaveBeenCalledWith({
      id: 'field-1',
      value: 'value-1',
    });
    expect(settingsDeps.thirdPartyService.onClickSettingButton).toHaveBeenCalledWith('button-1');
    expect(settingsDeps.smartNotes.toggleShowSmartNote).toHaveBeenCalled();
    expect(settingsDeps.smartNotes.toggleAutoStartSmartNote).toHaveBeenCalled();
    expect(settingsDeps.thirdPartyService.onClickLicenseRefreshButton).toHaveBeenCalled();
    expect(settingsDeps.monitoredExtensions.toggleEnabled).toHaveBeenCalled();
    expect(settingsDeps.routerInteraction.push).toHaveBeenCalledWith('/settings/thirdParty/crm');
    expect(settingsDeps.routerInteraction.push).toHaveBeenCalledWith('/settings/theme');
    expect(settingsDeps.routerInteraction.push).toHaveBeenCalledWith('/settings/callQueuePresence');
    expect(settingsDeps.routerInteraction.push).toHaveBeenCalledWith('/settings/text');
    expect(settingsDeps.routerInteraction.push).toHaveBeenCalledWith('/settings/voicemailDrop');
    expect(settingsDeps.routerInteraction.push).toHaveBeenCalledWith('/settings/phoneNumberFormat');

    const audioDeps = {
      appFeatures: {
        ringtonePermission: true,
        showNoiseReductionSetting: true,
      },
      audioSettings: {
        data: {
          inputDeviceId: 'mic-1',
        },
        ringtoneDeviceId: 'speaker-1',
        setRingtoneDeviceId: jest.fn(),
      },
      noiseReduction: {
        enabled: false,
        setEnabled: jest.fn(),
      },
      routerInteraction: {
        push: jest.fn(),
      },
      webphone: {
        sessions: [{ id: 'session-1' }],
      },
    };
    const audioUI = new AudioSettingsUI(audioDeps);
    expect(audioUI.getUIProps()).toMatchObject({
      baseAudio: true,
      disableNoiseReductionSetting: true,
      inputDeviceId: 'mic-1',
      noiseReductionEnabled: false,
      ringtoneDeviceId: 'speaker-1',
      showNoiseReductionSetting: true,
      showRingtoneAudioSetting: true,
    });
    const audioFunctions = audioUI.getUIFunctions();
    audioFunctions.onNoiseReductionChange();
    audioFunctions.onRingtoneDeviceIdChange('speaker-2');
    audioFunctions.gotoRingtoneSettings();
    expect(audioDeps.noiseReduction.setEnabled).toHaveBeenCalledWith(true);
    expect(audioDeps.audioSettings.setRingtoneDeviceId).toHaveBeenCalledWith('speaker-2');
    expect(audioDeps.routerInteraction.push).toHaveBeenCalledWith('/settings/ringtone');
  });
});
