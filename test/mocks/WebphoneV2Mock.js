const EventEmitter = require('events');
const RcModule = require('@ringcentral-integration/commons/lib/RcModule').default;
const { Module } = require('@ringcentral-integration/commons/lib/di');

const events = {
  callEnd: 'callEnd',
  callInit: 'callInit',
  callStart: 'callStart',
  callRing: 'callRing',
  callHold: 'callHold',
  callResume: 'callResume',
  beforeCallResume: 'beforeCallResume',
  beforeCallEnd: 'beforeCallEnd',
  activeWebphoneChanged: 'activeWebphoneChanged',
  callVoicemailDropped: 'callVoicemailDropped',
};

class Webphone extends RcModule {
  constructor(deps = {}) {
    super(deps);
    this._deps = deps;
    this._eventEmitter = new EventEmitter();
    this._webphone = null;
    this._sessions = new Map();
    this.connected = false;
    this.connectionStatus = null;
    this.device = null;
    this.isWebphoneActiveTab = true;
    this.originalSessions = {};
    this.sessions = [];
    this.ringSessions = [];
  }

  get ready() {
    return false;
  }

  onCallEnd(handler) {
    this._addHandler(events.callEnd, handler);
  }

  onCallInit(handler) {
    this._addHandler(events.callInit, handler);
  }

  onCallStart(handler) {
    this._addHandler(events.callStart, handler);
  }

  onCallRing(handler) {
    this._addHandler(events.callRing, handler);
  }

  onCallHold(handler) {
    this._addHandler(events.callHold, handler);
  }

  onCallResume(handler) {
    this._addHandler(events.callResume, handler);
  }

  onBeforeCallResume(handler) {
    this._addHandler(events.beforeCallResume, handler);
  }

  onBeforeCallEnd(handler) {
    this._addHandler(events.beforeCallEnd, handler);
  }

  onActiveWebphoneChanged(handler) {
    this._addHandler(events.activeWebphoneChanged, handler);
  }

  onCallVoicemailDropped(handler) {
    this._addHandler(events.callVoicemailDropped, handler);
  }

  stopRingtone() {}

  toggleMinimized() {}

  _addHandler(event, handler) {
    if (typeof handler === 'function') {
      this._eventEmitter.on(event, handler);
    }
  }
}

Module({
  name: 'NewWebphone',
  deps: [
    'WebphoneOptions',
  ],
})(Webphone);

module.exports = {
  Webphone,
};
