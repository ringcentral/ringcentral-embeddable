import RcModule from 'ringcentral-integration/lib/RcModule';
import moduleStatuses from 'ringcentral-integration/enums/moduleStatuses';

import ensureExist from 'ringcentral-integration/lib/ensureExist';

import actionTypes from './actionTypes';
import getReducer from './getReducer';

export default class Interaction extends RcModule {
  constructor({
    auth,
    router,
    presence,
    ...options,
  }) {
    super({
      ...options,
      actionTypes,
    });
    this._auth = this::ensureExist(auth, 'auth');
    this._router = this::ensureExist(router, 'router');
    this._presence = this::ensureExist(presence, 'presence');
    this._reducer = getReducer(this.actionTypes);
    this._dndStatus = null;
    this._userStatus = null;
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
        default:
          break;
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
