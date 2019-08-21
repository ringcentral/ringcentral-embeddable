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

import messageTypes from '../../lib/Adapter/messageTypes';
import actionTypes from './actionTypes';
import getReducer from './getReducer';

const CALL_NOTIFY_DELAY = 1500;

@Module({
  name: 'Adapter',
  deps: [
    'Auth',
    'RouterInteraction',
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
    { dep: 'AdapterOptions', optional: true }
  ]
})
export default class Adapter extends AdapterModuleCore {
  constructor({
    auth,
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

    this._reducer = getReducer(this.actionTypes);
    this._callSessions = new Map();
    this._stylesUri = stylesUri;
    this._enableFromNumberSetting = enableFromNumberSetting;
    this._disableInactiveTabCallEvent = disableInactiveTabCallEvent;
    this._loggedIn = null;
    this._lastActiveCalls = [];
    this._lastEndedActiveCallMap = {};
    this._lastActiveCallLogMap = {};
    this._callWith = null;

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
    });
    this._webphone.onCallRing((session) => {
      this.ringCallNotify(session);
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
    this._pushActiveCalls();
    this._checkRouteChanged();
    this._checkCallingSettingsChanged();
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
          this._controlCall(data.callAction, data.callId);
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
        default:
          super._onMessage(data);
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
    if (this._lastActiveCalls === this._presence.calls) {
      return;
    }
    const lastActiveCallsMap = {};
    this._lastActiveCalls.forEach((call) => {
      lastActiveCallsMap[`${call.sessionId}${call.direction}`] = call;
    });
    this._lastActiveCalls = this._presence.calls;
    const changedCalls = [];
    // Ended Call is not in this._presence.calls
    // So if one call existed in last calls and not existed in new calls, it is ended
    this._presence.calls.forEach((call) => {
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
      delete lastActiveCallsMap[`${call.sessionId}${call.direction}`];
    });
    const endedActiveCallMap = this._lastEndedActiveCallMap;
    this._lastEndedActiveCallMap = {};
    // add ended call
    Object.keys(lastActiveCallsMap).forEach((callId) => {
      const endedCall = lastActiveCallsMap[callId];
      this._lastEndedActiveCallMap[callId] = endedCall;
      if (endedActiveCallMap[callId]) {
        return;
      }
      const missed = (endedCall.telephonyStatus === telephonyStatus.ringing);
      changedCalls.push({
        ...endedCall,
        telephonyStatus: telephonyStatus.noCall,
        terminationType: terminationTypes.final,
        missed,
        endTime: missed ? null : Date.now(),
      });
    });
    this._sendRingoutCallNotification(changedCalls);
    this._sendActiveCallNotification(changedCalls);
  }

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
    this._loggedIn = this._auth.loggedIn;
    this._postMessage({
      type: 'rc-login-status-notify',
      loggedIn: this._loggedIn,
    });
  }

  _checkRouteChanged() {
    if (this._currentRoute !== this._router.currentPath) {
      this._currentRoute = this._router.currentPath;
      this.routeChangedNotify(this._currentRoute);
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

  routeChangedNotify = debounce((path) => {
    this._postMessage({
      type: 'rc-route-changed-notify',
      path,
    });
  })

  _controlCall(action, id) {
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

  // eslint-disable-next-line
  _postMessage(data) {
    if (window && window.parent) {
      window.parent.postMessage(data, '*');
    }
  }

  get ready() {
    return this.state.status === moduleStatuses.ready;
  }

  get pending() {
    return this.state.status === moduleStatuses.pending;
  }
}
