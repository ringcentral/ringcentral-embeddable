/** @jest-environment jsdom */
const { setStagedState } = require('@ringcentral-integration/core/lib/usm-redux/utils');
const callDirections = require('@ringcentral-integration/commons/enums/callDirections').default;
const callResults = require('@ringcentral-integration/commons/enums/callResults').default;
const { callingModes } = require('@ringcentral-integration/commons/modules/CallingSettings/callingModes');

jest.mock('@ringcentral-integration/widgets/modules/CallsListUI', () => ({
  CallsListUI: class BaseCallsListUI {
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

const { CallsListUI } = require('../../src/modules/CallsListUI');

function createCall(overrides = {}) {
  return {
    activityMatches: [],
    direction: callDirections.outbound,
    from: {
      phoneNumber: '+16505550100',
    },
    result: 'Accepted',
    sessionId: 'session-1',
    telephonySessionId: 'telephony-1',
    to: {
      phoneNumber: '+16505550101',
    },
    ...overrides,
  };
}

function createDeps(overrides = {}) {
  const latestCalls = [
    createCall({
      activityMatches: [{ id: 'log-1', type: 'log' }],
      recording: {
        contentUri: 'https://recording.example.com/1',
      },
      sessionId: 'logged-call',
      telephonySessionId: 'logged-telephony',
    }),
    createCall({
      activityMatches: [{ id: 'status-1', type: 'status' }],
      direction: callDirections.inbound,
      result: callResults.missed,
      sessionId: 'missed-call',
      telephonySessionId: 'missed-telephony',
    }),
    createCall({
      sessionId: 'outbound-call',
      telephonySessionId: 'outbound-telephony',
    }),
  ];
  return {
    accountInfo: {
      maxExtensionNumberLength: 6,
    },
    activeCallControl: {
      busy: false,
      clickSwitchTrack: jest.fn(),
      hangUp: jest.fn(async () => {}),
      ignore: jest.fn(),
      reject: jest.fn(async () => {}),
    },
    appFeatures: {
      allowLoadMoreCalls: true,
      hasComposeTextPermission: true,
      isCallingEnabled: true,
      ready: true,
    },
    auth: {
      accessToken: 'access-token',
      token: 'token',
    },
    call: {
      isIdle: true,
      ready: true,
    },
    callHistory: {
      debouncedSearch: jest.fn(),
      latestCalls,
      onClickToSMS: jest.fn(),
      ready: true,
      searchInput: '',
      updateSearchInput: jest.fn(),
    },
    callingSettings: {
      callingMode: callingModes.webphone,
    },
    callLog: {
      clearOldCalls: jest.fn(),
      fetchOldCalls: jest.fn(async () => {}),
      hasMoreOldCalls: true,
      loadingOldCalls: false,
      oldCalls: [],
      ready: true,
    },
    callLogger: {
      hideEditLogButton: false,
      logButtonTitle: 'Log call',
      logCall: jest.fn(async () => {}),
      ready: true,
      showLogModal: false,
    },
    callMonitor: {
      allCallsClickHangupTrack: jest.fn(),
      allCallsClickHoldTrack: jest.fn(),
      allCallsClickRejectTrack: jest.fn(),
      callItemClickTrack: jest.fn(),
      calls: [createCall({ sessionId: 'active-call' })],
    },
    composeText: {
      ready: true,
    },
    composeTextUI: {
      gotoComposeText: jest.fn(),
    },
    conferenceCall: {
      closeMergingPair: jest.fn(),
      isConferenceSession: jest.fn((sessionId) => sessionId === 'conference-session'),
      partyProfiles: [{ id: 'party-1' }],
    },
    connectivityMonitor: {
      connectivity: true,
      ready: true,
    },
    contactMatcher: {
      forceMatchNumber: jest.fn(),
      setCallMatched: jest.fn(),
      setManualRefreshNumber: jest.fn(),
    },
    dateTimeFormat: {
      ready: true,
    },
    extensionInfo: {
      isMultipleSiteEnabled: true,
      site: {
        code: '101',
      },
    },
    locale: {
      ready: true,
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
      homeCountryId: '1',
      ready: true,
    },
    routerInteraction: {
      push: jest.fn(),
    },
    sideDrawerUI: {
      gotoCallDetails: jest.fn(),
      gotoLogCall: jest.fn(),
    },
    smartNotes: {
      aiNotedCallMapping: {
        'telephony-1': true,
      },
      queryNotedCalls: jest.fn(),
      viewSmartNote: jest.fn(),
    },
    thirdPartyService: {
      additionalCallActions: [{ id: 'crm' }],
      onClickAdditionalButton: jest.fn(),
    },
    webphone: {
      answer: jest.fn(),
      connected: true,
      hangup: jest.fn(),
      hold: jest.fn(),
      resume: jest.fn(async () => {}),
      sessions: [{
        direction: callDirections.inbound,
        id: 'webphone-inbound',
      }],
      switchCall: jest.fn(async () => ({ id: 'switched-session' })),
      toggleMinimized: jest.fn(),
      updateSessionMatchedContact: jest.fn(),
    },
    ...overrides,
  };
}

function createModule(deps = createDeps()) {
  return new CallsListUI(deps);
}

describe('CallsListUI', () => {
  beforeEach(() => {
    setStagedState({});
  });

  afterEach(() => {
    setStagedState(undefined);
    jest.clearAllMocks();
  });

  it('filters history calls and appends access tokens to recordings', () => {
    const deps = createDeps();
    const callsListUI = createModule(deps);

    expect(callsListUI.recordings[0].recording.contentUri).toBe(
      'https://recording.example.com/1?access_token=access-token',
    );
    expect(callsListUI.historyCalls).toHaveLength(3);

    callsListUI.setFilterType('Logged');
    expect(callsListUI.historyCalls.map((call) => call.sessionId)).toEqual(['logged-call']);
    callsListUI.setFilterType('UnLogged');
    expect(callsListUI.historyCalls.map((call) => call.sessionId)).toEqual([
      'missed-call',
      'outbound-call',
    ]);
    callsListUI.setFilterType('Inbound');
    expect(callsListUI.historyCalls.map((call) => call.sessionId)).toEqual(['missed-call']);
    callsListUI.setFilterType('Outbound');
    expect(callsListUI.historyCalls.map((call) => call.sessionId)).toEqual([
      'logged-call',
      'outbound-call',
    ]);
    callsListUI.setFilterType('Missed');
    expect(callsListUI.historyCalls.map((call) => call.sessionId)).toEqual(['missed-call']);
    callsListUI.setCallType('recordings');
    expect(callsListUI.historyCalls.map((call) => call.sessionId)).toEqual(['logged-call']);
  });

  it('builds UI props with readiness, permissions, load-more, and call-control state', () => {
    const deps = createDeps();
    const callsListUI = createModule(deps);

    expect(callsListUI.getUIProps({
      showMergeCall: true,
      showSwitchCall: true,
      type: 'all',
      useCallControl: true,
    })).toMatchObject({
      activeCalls: deps.callMonitor.calls,
      adaptive: true,
      additionalActions: [{ id: 'crm' }],
      aiNotedCallMapping: { 'telephony-1': true },
      baseProp: true,
      calls: deps.callHistory.latestCalls,
      conferenceCallParties: [{ id: 'party-1' }],
      disableClickToDial: false,
      disableLinks: false,
      filterType: 'All',
      hasMoreCalls: true,
      hideEditLogButton: false,
      isWebRTC: true,
      loadingMoreCalls: false,
      logButtonTitle: 'Log call',
      searchInput: '',
      showLogButton: true,
      showMergeCall: true,
      showSpinner: false,
      showSwitchCall: true,
      type: 'all',
      useCallControl: true,
      useNewList: true,
    });

    deps.connectivityMonitor.connectivity = false;
    deps.call.isIdle = false;
    deps.callHistory.searchInput = 'customer';
    expect(callsListUI.getUIProps({ type: 'recordings' })).toMatchObject({
      activeCalls: [],
      disableClickToDial: true,
      disableLinks: true,
      hasMoreCalls: false,
      type: 'recordings',
    });
  });

  it('builds UI functions for logging, call control, routing, loading, search, SMS, and formatting', async () => {
    const deps = createDeps();
    const callsListUI = createModule(deps);
    const funcs = callsListUI.getUIFunctions({
      callCtrlRoute: '/calls/active',
    });
    const contact = {
      id: 'contact-1',
      type: 'company',
    };
    const call = createCall({
      sessionId: 'call-to-log',
      telephonySessionId: 'telephony-log',
      toNumberEntity: 'old-contact',
    });

    await funcs.onLogCall({
      call,
      contact,
      redirect: true,
      triggerType: 'manual',
    });
    expect(call.toNumberEntity).toBe('contact-1');
    expect(deps.callLogger.logCall).toHaveBeenCalledWith({
      call,
      contact,
      redirect: true,
      triggerType: 'manual',
    });

    deps.callLogger.showLogModal = true;
    await funcs.onLogCall({
      call,
      contact,
      triggerType: 'manual',
    });
    expect(deps.sideDrawerUI.gotoLogCall).toHaveBeenCalledWith('call-to-log', expect.any(Object));

    funcs.onViewContact({
      contact: {
        id: 'contact-2',
        type: 'company',
      },
    });
    expect(deps.routerInteraction.push).toHaveBeenCalledWith('/contacts/company/contact-2?direct=true');

    funcs.onRefreshContact({ phoneNumber: '+16505550123' });
    expect(deps.contactMatcher.setManualRefreshNumber).toHaveBeenCalledWith('+16505550123');
    expect(deps.contactMatcher.forceMatchNumber).toHaveBeenCalledWith({
      phoneNumber: '+16505550123',
    });

    funcs.webphoneHangup('webphone-1');
    funcs.webphoneHold('webphone-1');
    await funcs.webphoneResume('webphone-1');
    funcs.webphoneAnswer('webphone-inbound');
    await funcs.webphoneSwitchCall({ id: 'active-call' });
    funcs.webphoneIgnore('telephony-1');
    await funcs.ringoutHangup('ringout-1');
    funcs.ringoutTransfer('ringout-1');
    await funcs.ringoutReject('ringout-1');
    expect(deps.callMonitor.allCallsClickHangupTrack).toHaveBeenCalledTimes(2);
    expect(deps.callMonitor.allCallsClickHoldTrack).toHaveBeenCalled();
    expect(deps.conferenceCall.closeMergingPair).toHaveBeenCalled();
    expect(deps.webphone.answer).toHaveBeenCalledWith('webphone-inbound');
    expect(deps.webphone.switchCall).toHaveBeenCalledWith({ id: 'active-call' }, '1');
    expect(deps.activeCallControl.clickSwitchTrack).toHaveBeenCalled();
    expect(deps.activeCallControl.ignore).toHaveBeenCalledWith('telephony-1');
    expect(deps.activeCallControl.hangUp).toHaveBeenCalledWith('ringout-1');
    expect(deps.routerInteraction.push).toHaveBeenCalledWith('/transfer/ringout-1/active');
    expect(deps.activeCallControl.reject).toHaveBeenCalledWith('ringout-1');
    expect(funcs.isSessionAConferenceCall('conference-session')).toBe(true);

    funcs.onActiveCallItemClick(createCall({
      telephonySessionId: 'ringout-telephony',
      webphoneSession: null,
    }));
    expect(deps.routerInteraction.push).toHaveBeenCalledWith('/simplifycallctrl/ringout-telephony');
    funcs.onActiveCallItemClick(createCall({
      direction: callDirections.inbound,
      telephonyStatus: 'Ringing',
      webphoneSession: {
        id: 'ringing-webphone',
      },
    }));
    expect(deps.webphone.toggleMinimized).toHaveBeenCalledWith('ringing-webphone');
    funcs.onActiveCallItemClick(createCall({
      webphoneSession: {
        id: 'connected-webphone',
      },
    }));
    expect(deps.routerInteraction.push).toHaveBeenCalledWith('/calls/active/connected-webphone');

    funcs.updateSessionMatchedContact({
      contact,
      telephonySessionId: 'telephony-1',
      webphoneSessionId: 'webphone-1',
    });
    expect(deps.webphone.updateSessionMatchedContact).toHaveBeenCalledWith('webphone-1', contact);
    expect(deps.contactMatcher.setCallMatched).toHaveBeenCalledWith({
      telephonySessionId: 'telephony-1',
      toEntityId: 'contact-1',
    });

    funcs.onViewSmartNote({
      contact,
      direction: callDirections.outbound,
      phoneNumber: '+16505550123',
      telephonySessionId: 'telephony-1',
    });
    expect(deps.smartNotes.viewSmartNote).toHaveBeenCalledWith({
      contact,
      direction: callDirections.outbound,
      id: 'telephony-1',
      phoneNumber: '+16505550123',
      status: 'Disconnected',
    });

    callsListUI.setCallType('recordings');
    await funcs.loadMoreCalls();
    expect(deps.callLog.fetchOldCalls).toHaveBeenCalledWith({ isRecording: true });
    callsListUI.setCallType('all');
    callsListUI.setFilterType('Inbound');
    await funcs.loadMoreCalls();
    expect(deps.callLog.fetchOldCalls).toHaveBeenCalledWith({ direction: 'Inbound' });
    callsListUI.setFilterType('Outbound');
    await funcs.loadMoreCalls();
    expect(deps.callLog.fetchOldCalls).toHaveBeenCalledWith({ direction: 'Outbound' });

    funcs.onLoadCalls('recordings', 'All');
    expect(deps.callLog.fetchOldCalls).toHaveBeenCalledWith({ isRecording: true });
    funcs.onSearchInputChange('customer');
    expect(deps.callHistory.updateSearchInput).toHaveBeenCalledWith('customer');
    expect(deps.callHistory.debouncedSearch).toHaveBeenCalled();
    deps.callLog.oldCalls = [{ id: 'old-call' }];
    funcs.onFilterTypeChange('Inbound');
    expect(deps.callLog.clearOldCalls).toHaveBeenCalled();
    funcs.onViewCallDetails('logged-telephony');
    expect(deps.sideDrawerUI.gotoCallDetails).toHaveBeenCalledWith('logged-telephony', expect.any(Object));
    await funcs.onClickToSms(contact, true);
    expect(deps.composeTextUI.gotoComposeText).toHaveBeenCalledWith(contact, true);
    expect(deps.callHistory.onClickToSMS).toHaveBeenCalled();
    funcs.onClickAdditionalAction('crm', call);
    expect(deps.thirdPartyService.onClickAdditionalButton).toHaveBeenCalledWith('crm', call);
    expect(funcs.formatPhone('+16505550123')).toBe('formatted-+16505550123');
    expect(deps.phoneNumberFormat.format).toHaveBeenCalledWith({
      areaCode: '650',
      countryCode: 'US',
      isMultipleSiteEnabled: true,
      maxExtensionLength: 6,
      phoneNumber: '+16505550123',
      siteCode: '101',
    });
  });
});
