import RcModule from 'ringcentral-integration/lib/RcModule';
import moduleStatuses from 'ringcentral-integration/enums/moduleStatuses';

import ensureExist from 'ringcentral-integration/lib/ensureExist';
import normalizeNumber from 'ringcentral-integration/lib/normalizeNumber';
import { Module } from 'ringcentral-integration/lib/di';

import actionTypes from './actionTypes';
import getReducer from './getReducer';

@Module({
  deps: [
    'Auth',
    'Router',
    'DetailedPresence',
    'ComposeText',
    'Call',
    'Webphone',
    'RegionSettings',
    { dep: 'InteractionOptions', optional: true }
  ]
})
export default class Interaction extends RcModule {
  constructor({
    auth,
    router,
    detailedPresence,
    composeText,
    call,
    webphone,
    regionSettings,
    stylesUri,
    ...options,
  }) {
    super({
      ...options,
      actionTypes,
    });
    this._auth = this::ensureExist(auth, 'auth');
    this._router = this::ensureExist(router, 'router');
    this._presence = this::ensureExist(detailedPresence, 'detailedPresence');
    this._composeText = this::ensureExist(composeText, 'composeText');
    this._webphone = this::ensureExist(webphone, 'webphone');
    this._regionSettings = this::ensureExist(regionSettings, 'regionSettings');
    this._call = this::ensureExist(call, 'call');
    this._reducer = getReducer(this.actionTypes);
    this._dndStatus = null;
    this._userStatus = null;
    this._callSessions = new Map();
    this._stylesUri = stylesUri;
  }

  _shouldInit() {
    return this.pending &&
      this._auth.loggedIn &&
      this._composeText.ready &&
      this._webphone.ready &&
      this._regionSettings.ready &&
      this._presence.ready;
  }

  _shouldReset() {
    return this.ready &&
      (
        !this._auth.loggedIn ||
        !this._composeText.ready ||
        !this._webphone.ready ||
        !this._regionSettings.ready ||
        !this._presence.ready
      );
  }

  async _onStateChange() {
    if (this._shouldInit()) {
      this.store.dispatch({
        type: this.actionTypes.initSuccess,
      });
      this._postMessage({
        type: 'rc-set-presence',
        presence: {
          dndStatus: this._presence.dndStatus,
          userStatus: this._presence.userStatus,
        },
      });
    } else if (this._shouldReset()) {
      this.store.dispatch({
        type: this.actionTypes.resetSuccess,
      });
      this._postMessage({
        type: 'rc-set-presence',
        presence: {},
      });
    } else if (this.ready) {
      if (
        this._dndStatus !== this._presence.dndStatus ||
        this._userStatus !== this._presence.userStatus
      ) {
        this._dndStatus = this._presence.dndStatus;
        this._userStatus = this._presence.userStatus;
        this._postMessage({
          type: 'rc-set-presence',
          presence: {
            dndStatus: this._dndStatus,
            userStatus: this._userStatus,
          },
        });
      }
    }
  }

  initialize() {
    window.addEventListener('message', event => this._messageHandler(event));
    setTimeout(() => {
      this._setMinimized(false);
    }, 2000);
    this._insertExtendStyle();
    this.store.subscribe(() => this._onStateChange());
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

  _messageHandler(e) {
    const data = e.data;
    if (data) {
      switch (data.type) {
        case 'rc-adapter-goto-presence':
          this._router.history.push('/settings?showPresenceSettings=1');
          break;
        case 'rc-adapter-set-environment':
          if (window.toggleEnv) {
            window.toggleEnv();
          }
          break;
        case 'rc-adapter-new-sms':
          this._newSMS(data.phoneNumber);
          break;
        case 'rc-adapter-new-call':
          this._newCall(data.phoneNumber, data.toCall);
          break;
        case 'rc-adapter-control-call':
          this._controlCall(data.callAction, data.callId);
          break;
        default:
          break;
      }
    }
  }

  ringCallNotify(session) {
    if (this._callSessions.has(session.id)) {
      return;
    }
    const call = { ...session };
    this._callSessions.set(session.id, call);
    this._postMessage({
      type: 'rc-call-ring-notify',
      call,
    });
  }

  startCallNotify(session) {
    if (this._callSessions.has(session.id)) {
      return;
    }
    const call = { ...session };
    this._callSessions.set(session.id, call);
    this._postMessage({
      type: 'rc-call-start-notify',
      call,
    });
  }

  endCallNotify(session) {
    if (!this._callSessions.has(session.id)) {
      return;
    }
    this._callSessions.delete(session.id);
    this._postMessage({
      type: 'rc-call-end-notify',
      call: {
        ...session,
        endTime: Date.now(),
      },
    });
  }

  _controlCall(action, id) {
    if (id && !this._callSessions.has(id)) {
      return;
    }
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

  _newSMS(phoneNumber) {
    if (!this._auth.loggedIn) {
      return;
    }
    this._router.history.push('/composeText');
    this._composeText.updateTypingToNumber(phoneNumber);
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
    this._router.history.push('/dialer');
    this._call.onToNumberChange(phoneNumber);
    if (toCall) {
      this._call.onCall();
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

  _setMinimized(minimized) {
    this._postMessage({
      type: 'rc-set-minimized',
      minimized,
    });
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
