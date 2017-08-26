import RcModule from 'ringcentral-integration/lib/RcModule';
import moduleStatuses from 'ringcentral-integration/enums/moduleStatuses';

import ensureExist from 'ringcentral-integration/lib/ensureExist';
import { normalizeSession } from 'ringcentral-integration/modules/Webphone/webphoneHelper';

import actionTypes from './actionTypes';
import getReducer from './getReducer';

export default class Interaction extends RcModule {
  constructor({
    auth,
    router,
    presence,
    composeText,
    call,
    ...options,
  }) {
    super({
      ...options,
      actionTypes,
    });
    this._auth = this::ensureExist(auth, 'auth');
    this._router = this::ensureExist(router, 'router');
    this._presence = this::ensureExist(presence, 'presence');
    this._composeText = this::ensureExist(composeText, 'composeText');
    this._call = this::ensureExist(call, 'call');
    this._reducer = getReducer(this.actionTypes);
    this._dndStatus = null;
    this._userStatus = null;
    this._callSessions = new Map();
  }

  _shouldInit() {
    return this.pending &&
      this._auth.loggedIn &&
      this._presence.ready;
  }

  _shouldReset() {
    return this.ready &&
      (
        !this._auth.loggedIn ||
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
    this.store.subscribe(() => this._onStateChange());
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
        default:
          break;
      }
    }
  }

  ringCallNotify(session) {
    if (this._callSessions.has(session.id)) {
      return;
    }
    this._callSessions.set(session.id, true);
    this._postMessage({
      type: 'rc-call-ring-notify',
      call: {
        ...normalizeSession(session),
      },
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
        ...normalizeSession(session),
        endTime: Date.now(),
      },
    });
  }

  _newSMS(phoneNumber) {
    if (!this._auth.loggedIn) {
      return;
    }
    this._setClosed(false);
    this._setMinimized(false);
    this._router.history.push('/composeText');
    this._composeText.updateTypingToNumber(phoneNumber);
  }

  _newCall(phoneNumber, toCall = false) {
    if (!this._auth.loggedIn) {
      return;
    }
    this._setClosed(false);
    this._setMinimized(false);
    this._router.history.push('/dialer');
    this._call.onToNumberChange(phoneNumber);
    if (toCall) {
      this._call.onCall();
    }
  }

  _setClosed(minimized) {
    this._postMessage({
      type: 'rc-set-minimized',
      minimized,
    });
  }

  _setMinimized(closed) {
    this._postMessage({
      type: 'rc-set-closed',
      closed,
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
