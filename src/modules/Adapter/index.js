import moduleStatuses from 'ringcentral-integration/enums/moduleStatuses';
import telephonyStatus from 'ringcentral-integration/enums/telephonyStatus';
import terminationTypes from 'ringcentral-integration/enums/terminationTypes';
import callingOptions from 'ringcentral-integration/modules/CallingSettings/callingOptions';
import sessionStatus from 'ringcentral-integration/modules/Webphone/sessionStatus';
import ensureExist from 'ringcentral-integration/lib/ensureExist';
import normalizeNumber from 'ringcentral-integration/lib/normalizeNumber';
import sleep from 'ringcentral-integration/lib/sleep';
import { Module } from 'ringcentral-integration/lib/di';
import callingModes from 'ringcentral-integration/modules/CallingSettings/callingModes';
import debounce from 'ringcentral-integration/lib/debounce';

import AdapterModuleCore from 'ringcentral-widgets/lib/AdapterModuleCore';

import formatMeetingInfo from '../../lib/formatMeetingInfo';
import messageTypes from '../../lib/Adapter/messageTypes';
import actionTypes from './actionTypes';
import getReducer from './getReducer';

const CALL_NOTIFY_DELAY = 1500;

@Module({
  name: 'Adapter',
  deps: [
    'Auth',
    'ExtensionInfo',
    'AccountInfo',
    'RouterInteraction',
    'RolesAndPermissions',
    'Presence',
    'ComposeText',
    'Call',
    'DialerUI',
    'Webphone',
    'RegionSettings',
    'CallingSettings',
    'GlobalStorage',
    'Locale',
    'ActiveCalls',
    'MessageStore',
    'TabManager',
    'CallLogger',
    'Meeting',
    'Brand',
    { dep: 'AdapterOptions', optional: true }
  ]
})
export default class Adapter extends AdapterModuleCore {
  constructor({
    auth,
    extensionInfo,
    accountInfo,
    presence,
    composeText,
    call,
    dialerUI,
    webphone,
    regionSettings,
    callingSettings,
    activeCalls,
    messageStore,
    stylesUri,
    prefix,
    enableFromNumberSetting,
    disableInactiveTabCallEvent,
    tabManager,
    callLogger,
    meeting,
    brand,
    rolesAndPermissions,
    ...options
  }) {
    super({
      ...options,
      prefix,
      actionTypes,
      messageTypes,
      presence,
      storageKey: 'adapterData',
      webphone,
    });
    this._messageTypes = messageTypes;
    this._auth = this::ensureExist(auth, 'auth');
    this._presence = this::ensureExist(presence, 'presence');
    this._composeText = this::ensureExist(composeText, 'composeText');
    this._webphone = this::ensureExist(webphone, 'webphone');
    this._regionSettings = this::ensureExist(regionSettings, 'regionSettings');
    this._callingSettings = this::ensureExist(callingSettings, 'callingSettings');
    this._call = this::ensureExist(call, 'call');
    this._dialerUI = this::ensureExist(dialerUI, 'dialerUI');
    this._activeCalls = this::ensureExist(activeCalls, 'activeCalls');
    this._messageStore = this::ensureExist(messageStore, 'messageStore');
    this._tabManager = this::ensureExist(tabManager, 'tabManager');
    this._callLogger = callLogger;
    this._extensionInfo = extensionInfo;
    this._accountInfo = accountInfo;
    this._meeting = meeting;
    this._brand = brand;
    this._rolesAndPermissions = rolesAndPermissions;

    this._reducer = getReducer(this.actionTypes);
    this._callSessions = new Map();
    this._stylesUri = stylesUri;
    this._enableFromNumberSetting = enableFromNumberSetting;
    this._disableInactiveTabCallEvent = disableInactiveTabCallEvent;
    this._loggedIn = null;
    this._regionCountryCode = null;
    this._lastActiveCalls = [];
    this._lastActiveCallLogMap = {};
    this._callWith = null;
    this._callLoggerAutoLogEnabled = null;
    this._dialerDisabled = null;
    this._meetingReady = null;

    this._messageStore.onNewInboundMessage((message) => {
      this._postMessage({
        type: 'rc-inbound-message-notify',
        message,
      });
    });
    this._messageStore.onMessageUpdated((message) => {
      this._postMessage({
        type: 'rc-message-updated-notify',
        message,
      });
    });
    this._webphone.onCallEnd((session) => {
      this.endCallNotify(session);
    });
    this._webphone.onCallInit((session) => {
      this.initCallNotify(session);
    });
    this._webphone.onCallStart((session) => {
      this.startCallNotify(session);
      const rawSession = this._webphone._sessions.get(session.id);
      if (rawSession) {
        rawSession.on('muted', () => {
          const newSession = this._webphone.sessions.find(s => s.id === session.id);
          this.muteCallNotify(newSession, true);
        });
        rawSession.on('unmuted', () => {
          const newSession = this._webphone.sessions.find(s => s.id === session.id);
          this.muteCallNotify(newSession, false);
        });
      }
    });
    this._webphone.onCallRing((session) => {
      this.ringCallNotify(session);
      const rawSession = this._webphone._sessions.get(session.id);
      if (rawSession) {
        rawSession.__origial_transfer = rawSession.transfer;
        rawSession.transfer = async (target, options) => {
          await (rawSession.localHold ? Promise.resolve(null) : rawSession.hold());
          await sleep(1000);
          return rawSession.blindTransfer(target, options);
        };
      }
    });
    this._webphone.onCallHold((session) => {
      this.holdCallNotify(session);
    });
    this._webphone.onCallResume((session) => {
      this.resumeCallNotify(session);
    });
  }

  initialize() {
    window.addEventListener('message', event => this._onMessage(event));
    this._insertExtendStyle();
    this.store.subscribe(() => this._onStateChange());
  }

  _onStateChange() {
    if (this._shouldInit()) {
      this.store.dispatch({
        type: this.actionTypes.init,
      });
      this._pushAdapterState();
      this.store.dispatch({
        type: this.actionTypes.initSuccess,
      });
    }
    this._pushPresence();
    this._pushLocale();
    this._checkLoginStatus();
    this._checkRegionChanged();
    this._pushActiveCalls();
    this._checkRouteChanged();
    this._checkCallingSettingsChanged();
    this._checkAutoCallLoggerChanged();
    this._checkDialUIStatusChanged();
    this._checkMeetingStatusChanged();
  }

  _onMessage(event) {
    const data = event.data;
    if (data) {
      switch (data.type) {
        case 'rc-adapter-set-environment':
          if (window.toggleEnv) {
            window.toggleEnv();
          }
          break;
        case 'rc-adapter-new-sms':
          this._newSMS(data.phoneNumber, data.text);
          break;
        case 'rc-adapter-new-call':
          this._newCall(data.phoneNumber, data.toCall);
          break;
        case 'rc-adapter-control-call':
          this._controlCall(data.callAction, data.callId, data.options);
          break;
        case 'rc-adapter-logout':
          if (this._auth.loggedIn) {
            this._auth.logout();
          }
          break;
        case 'rc-calling-settings-update': 
          if (this._callingSettings.ready) {
            this._updateCallingSettings(data);
          }
          break;
        case 'rc-adapter-message-request': {
          this._handleRCAdapterMessageRequest(data);
          break;
        }
        case 'rc-adapter-navigate-to': {
          if (data.path && data.path.indexOf('/') === 0) {
            this._router.push(data.path);
          }
          break;
        }
        default:
          super._onMessage(data);
          break;
      }
    }
  }

  async _handleRCAdapterMessageRequest(data) {
    if (!data.path) {
      return;
    }
    switch (data.path) {
      case '/schedule-meeting': {
        if (this._meeting.ready && this._rolesAndPermissions.organizeMeetingEnabled) {
          const res = await this._scheduleMeeting(data.body);
          this._postRCAdapterMessageResponse({
            responseId: data.requestId,
            response: res,
          });
        }
        break;
      }
      default: {
        this._postRCAdapterMessageResponse({
          responseId: data.requestId,
          response: { data: 'no matched path' }
        });
        break;
      }
    }
  }

  _pushAdapterState() {
    this._postMessage({
      type: this._messageTypes.pushAdapterState,
      size: this.size,
      minimized: this.minimized,
      closed: this.closed,
      position: this.position,
      telephonyStatus: (this._auth.loggedIn && this._presence.telephonyStatus) || null,
      userStatus: (this._auth.loggedIn && this._presence.userStatus) || null,
      dndStatus: (this._auth.loggedIn && this._presence.dndStatus) || null,
    });
  }

  _pushPresence() {
    if (
      this.ready &&
      (
        this._lastDndStatus !== this._presence.dndStatus ||
        this._lastUserStatus !== this._presence.userStatus ||
        this._lastTelephonyStatus !== this._presence.telephonyStatus
      )
    ) {
      this._lastDndStatus = this._presence.dndStatus;
      this._lastUserStatus = this._presence.userStatus;
      this._lastTelephonyStatus = this._presence.telephonyStatus;
      this._postMessage({
        type: this._messageTypes.syncPresence,
        telephonyStatus: (this._auth.loggedIn && this._presence.telephonyStatus) || null,
        userStatus: (this._auth.loggedIn && this._presence.userStatus) || null,
        dndStatus: (this._auth.loggedIn && this._presence.dndStatus) || null,
      });
    }
  }

  _pushActiveCalls() {
    if (this._disableInactiveTabCallEvent && this._tabManager.ready && (!this._tabManager.active)) {
      return;
    }
    if (this._lastActiveCalls === this._presence.activeCalls) {
      return;
    }
    const lastActiveCallsMap = {};
    this._lastActiveCalls.forEach((call) => {
      lastActiveCallsMap[`${call.sessionId}${call.direction}`] = call;
    });
    this._lastActiveCalls = this._presence.activeCalls;
    const changedCalls = [];
    // Ended Call is not in this._presence.calls
    // So if one call existed in last calls and not existed in new calls, it is ended
    this._presence.activeCalls.forEach((call) => {
      const oldCall = lastActiveCallsMap[`${call.sessionId}${call.direction}`];
      if (!oldCall) {
        changedCalls.push({ ...call });
        return;
      }
      if (
        oldCall.telephonyStatus !== call.telephonyStatus ||
        oldCall.terminationType !== call.terminationType
      ) {
        changedCalls.push({ ...call });
      }
    });
    this._sendRingoutCallNotification(changedCalls);
    this._sendActiveCallNotification(changedCalls);
  }

  // map active call with active call log from this._activeCalls module
  // active call log has some delay, so wait CALL_NOTIFY_DELAY
  async _sendActiveCallNotification(activeCalls) {
    await sleep(CALL_NOTIFY_DELAY);
    const activeCallLogMap = {};
    this._activeCalls.calls.forEach((call) => {
      activeCallLogMap[`${call.sessionId}-${call.direction}`] = call;
    });
    activeCalls.forEach(({ sipData, id, ...call }) => {
      let matchedCallLog = activeCallLogMap[`${call.sessionId}-${call.direction}`];
      if (!matchedCallLog) {
        matchedCallLog = this._lastActiveCallLogMap[`${call.sessionId}-${call.direction}`] || {};
      } else {
        this._lastActiveCallLogMap[`${call.sessionId}-${call.direction}`] = matchedCallLog;
      }
      this._postMessage({
        type: 'rc-active-call-notify',
        call: {
          id: matchedCallLog.id,
          action: matchedCallLog.action,
          startTime: matchedCallLog.startTime,
          uri: matchedCallLog.uri,
          ...call
        }
      });
      if (call.telephonyStatus === telephonyStatus.noCall) {
        delete this._lastActiveCallLogMap[`${call.sessionId}-${call.direction}`];
      }
    });
  }

  _sendRingoutCallNotification(calls) {
    if (this._callingSettings.callingMode != callingModes.ringout) {
      return;
    }
    calls.forEach(({ id, ...call}) => {
      this._postMessage({
        type: 'rc-ringout-call-notify',
        call,
      });
    });
  }

  _checkLoginStatus() {
    if (!this._auth.ready) {
      return;
    }
    if (this._loggedIn === this._auth.loggedIn) {
      return;
    }
    if (this._auth.loggedIn && (
      !this._extensionInfo.ready || !this._extensionInfo.ready
    )) {
      return;
    }
    this._loggedIn = this._auth.loggedIn;
    let loginNumber;
    if (this._loggedIn) {
      const extensionNumber =
        this._extensionInfo.extensionNumber && this._extensionInfo.extensionNumber !== '0'
          ? this._extensionInfo.extensionNumber
          : null;
      loginNumber = [this._accountInfo.mainCompanyNumber, extensionNumber].join(
        '*',
      );
    }
    this._postMessage({
      type: 'rc-login-status-notify',
      loggedIn: this._loggedIn,
      loginNumber,
    });
  }

  _checkRegionChanged() {
    if (!this._regionSettings.ready) {
      return;
    }

    const triggerEvent = (
      this._regionCountryCode !== this._regionSettings.countryCode ||
      this._regionAreaCode !== this._regionSettings.areaCode
    );

    if (triggerEvent) {
      this._regionCountryCode = this._regionSettings.countryCode;
      this._regionAreaCode = this._regionSettings.areaCode;
      const showAreaCode = this._regionCountryCode === 'US' || this._regionCountryCode === 'CA'
      this._postMessage({
        type: 'rc-region-settings-notify',
        countryCode: this._regionSettings.countryCode,
        areaCode: showAreaCode ? this._regionSettings.areaCode : '',
      });
    }
  }

  _checkRouteChanged() {
    if (this._currentRoute !== this._router.currentPath) {
      this._currentRoute = this._router.currentPath;
      this.routeChangedNotify(this._currentRoute);
    }
  }

  _checkAutoCallLoggerChanged() {
    if (!this._callLogger.ready) {
      return;
    }
    if (this._callLoggerAutoLogEnabled !== this._callLogger.autoLog) {
      this._callLoggerAutoLogEnabled = this._callLogger.autoLog;
      this._postMessage({
        type: 'rc-callLogger-auto-log-notify',
        autoLog: this._callLogger.autoLog,
      });
    }
  }

  _checkCallingSettingsChanged() {
    if (!this._callingSettings.ready) {
      return;
    }
    if (
      this._callWith === this._callingSettings.callWith &&
      (!this._enableFromNumberSetting || this._fromNumbers === this._callingSettings.fromNumbers)
    ) {
      return;
    }
    this._callWith = this._callingSettings.callWith;
    this._fromNumbers = this._callingSettings.fromNumbers;
    const callingMode = this._callingSettings.callingMode;
    const message = {
      type: 'rc-calling-settings-notify',
      callWith: this._callWith && this._callWith.replace('callingOptions-', ''),
      callingMode: callingMode && callingMode.replace('callingModes-', ''),
    };
    if (this._enableFromNumberSetting && this._callWith === callingOptions.browser) {
      message.fromNumbers = this._fromNumbers.map(n => ({ phoneNumber: n.phoneNumber, usageType: n.usageType }));
    }
    this._postMessage(message);
  }

  _checkDialUIStatusChanged() {
    if (this._dialerDisabled === this._dialerUI.isCallButtonDisabled) {
      return;
    }
    this._dialerDisabled = this._dialerUI.isCallButtonDisabled;
    this._postMessage({
      type: 'rc-dialer-status-notify',
      ready: !this._dialerUI.showSpinner && !this._dialerUI.isCallButtonDisabled,
    });
  }

  _checkMeetingStatusChanged() {
    if (this._meetingReady === this._meeting.ready) {
      return;
    }
    this._meetingReady = this._meeting.ready;
    this._postMessage({
      type: 'rc-meeting-status-notify',
      ready: this._meeting.ready,
      permission: !!(
        this._rolesAndPermissions.ready &&
        this._rolesAndPermissions.organizeMeetingEnabled
      ),
    });
  }

  _insertExtendStyle() {
    if (!this._stylesUri) {
      return;
    }
    const link = window.document.createElement('link');
    link.type = 'text/css';
    link.rel = 'stylesheet';
    link.href = this._stylesUri;
    window.document.head.appendChild(link);
  }

  ringCallNotify(session) {
    this._postMessage({
      type: 'rc-call-ring-notify',
      call: session,
    });
  }

  initCallNotify(session) {
    this._postMessage({
      type: 'rc-call-init-notify',
      call: session,
    });
  }

  startCallNotify(session) {
    this._postMessage({
      type: 'rc-call-start-notify',
      call: session,
    });
  }

  endCallNotify(session) {
    this._postMessage({
      type: 'rc-call-end-notify',
      call: {
        ...session,
        endTime: Date.now(),
      },
    });
  }

  holdCallNotify(session) {
    this._postMessage({
      type: 'rc-call-hold-notify',
      call: {
        ...session,
        callStatus: sessionStatus.onHold,
      },
    });
  }

  resumeCallNotify(session) {
    this._postMessage({
      type: 'rc-call-resume-notify',
      call: session,
    });
  }

  muteCallNotify(session, muted) {
    this._postMessage({
      type: 'rc-call-mute-notify',
      call: {
        ...session,
        isOnMute: muted,
      },
    });
  }

  routeChangedNotify = debounce((path) => {
    this._postMessage({
      type: 'rc-route-changed-notify',
      path,
    });
  })

  _controlCall(action, id, options) {
    switch (action) {
      case 'answer':
        this._webphone.answer(id || this._webphone.ringSessionId);
        break;
      case 'reject':
        this._webphone.reject(id || this._webphone.ringSessionId);
        break;
      case 'hangup':
        this._webphone.hangup(id || this._webphone.activeSessionId);
        break;
      case 'hold':
        this._webphone.hold(id || this._webphone.activeSessionId);
        break;
      case 'unhold':
        this._webphone.unhold(id || this._webphone.activeSessionId);
        break;
      case 'transfer':
        this._webphone.transfer(options.transferNumber, id || this._webphone.activeSessionId);
        break;
      case 'toVoicemail':
        this._webphone.toVoiceMail(id || this._webphone.ringSessionId);
        break;
      case 'forward':
        this._webphone.forward(id || this._webphone.ringSessionId, options.forwardNumber);
        break;
      case 'startRecord':
        this._webphone.startRecord(id || this._webphone.activeSessionId);
        break;
      case 'stopRecord':
        this._webphone.stopRecord(id || this._webphone.activeSessionId);
        break;
      case 'mute':
        this._webphone.mute(id || this._webphone.activeSessionId);
        break;
      case 'unmute':
        this._webphone.unmute(id || this._webphone.activeSessionId);
        break;
      default:
        break;
    }
  }

  _newSMS(phoneNumber, text) {
    if (!this._auth.loggedIn) {
      return;
    }
    this._router.push('/composeText');
    this._composeText.updateTypingToNumber(phoneNumber);
    if (text && text.length > 0) {
      this._composeText.updateMessageText(String(text));
    }
  }

  _newCall(phoneNumber, toCall = false) {
    if (!this._auth.loggedIn) {
      return;
    }
    if (!this._call.isIdle) {
      return;
    }
    const isCall = this._isCallOngoing(phoneNumber);
    if (isCall) {
      return;
    }
    this._router.push('/dialer');
    this._dialerUI.setToNumberField(phoneNumber);
    if (toCall) {
      this._dialerUI.call({ phoneNumber });
    }
  }

  _isCallOngoing(phoneNumber) {
    const countryCode = this._regionSettings.countryCode;
    const areaCode = this._regionSettings.areaCode;
    const normalizedNumber = normalizeNumber({ phoneNumber, countryCode, areaCode });
    return !!this._webphone.sessions.find(
      session => session.to === normalizedNumber
    );
  }

  _updateCallingSettings(data) {
    if (data.callWith && callingOptions[data.callWith]) {
      this._callingSettings.setData({
        callWith: callingOptions[data.callWith],
        myLocation: data.myLocation,
        ringoutPrompt: data.ringoutPrompt,
      });
    }
    if (data.fromNumber) {
      const isAnonymous = data.fromNumber === 'anonymous';
      const isValid = this._callingSettings.fromNumbers.find(p => p.phoneNumber === data.fromNumber);
      if ((isAnonymous || isValid) && data.fromNumber !== this._callingSettings.fromNumber) {
        this._callingSettings.updateFromNumber({
          phoneNumber: data.fromNumber,
        });
      }
    }
  }

  // override
  async _onNavigateToCurrentCall() {
    const ACTIVE_CALL_PATH = '/calls/active';
    const currentSession =
      this._webphone.sessions.find(s => s.callStatus === sessionStatus.connected) ||
      this._webphone.activeSession;
    if (currentSession) {
      const currentCallPath = `${ACTIVE_CALL_PATH}/${currentSession.id}`;
      this._router.push(currentCallPath);
    }
    if (this._userGuide && this._userGuide.started) {
      this._userGuide.dismiss();
    }
    if (this._quickAccess && this._quickAccess.entered) {
      this._quickAccess.exit();
    }
    if (
      this._webphone &&
      this._webphone.ringSession &&
      !this._webphone.ringSession.minimized
    ) {
      this._webphone.toggleMinimized(this._webphone.ringSession.id);
    }
  }

  async _scheduleMeeting(data) {
    const resp = await phone.meeting.schedule(data);
    if (!resp) {
      return {
        error: 'schedule failed'
      };
    }
    const formatedMeetingInfo = formatMeetingInfo(resp, this._brand, this._locale.currentLocale);
    return {
      meeting: formatedMeetingInfo,
    };
  }

  // eslint-disable-next-line
  _postMessage(data) {
    if (window && window.parent) {
      window.parent.postMessage(data, '*');
    }
  }

  _postRCAdapterMessageResponse({ responseId, response }) {
    this._postMessage({
      type: 'rc-adapter-message-response',
      responseId,
      response,
    });
  }

  get ready() {
    return this.state.status === moduleStatuses.ready;
  }

  get pending() {
    return this.state.status === moduleStatuses.pending;
  }
}
