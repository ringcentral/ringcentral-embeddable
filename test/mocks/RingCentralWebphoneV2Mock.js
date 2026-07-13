const EventEmitter = require('events');

let sessionSequence = 0;

class WebphoneV2SessionMock extends EventEmitter {
  constructor({
    direction,
    toNumber,
    fromNumber,
    webPhone,
  }) {
    super();
    sessionSequence += 1;
    this.id = `webphone-session-${sessionSequence}`;
    this.callId = `webphone-call-${sessionSequence}`;
    this.direction = direction;
    this.remoteNumber = toNumber;
    this.localNumber = fromNumber;
    this.remotePeer = `"${toNumber}" <sip:${toNumber}@example.com>`;
    this.localPeer = `"${fromNumber}" <sip:${fromNumber}@example.com>`;
    this.remoteTag = `remote-tag-${sessionSequence}`;
    this.localTag = `local-tag-${sessionSequence}`;
    this.startTime = new Date();
    this.state = 'init';
    this.webPhone = webPhone;
    this.sipMessage = {
      headers: {},
    };
    this.audioElement = {
      volume: 1,
      setSinkId: jest.fn(),
      srcObject: null,
    };
    this.rtcPeerConnection = {
      getSenders: () => [],
      getReceivers: () => [],
      removeTrack: jest.fn(),
    };
  }

  accept() {
    this.state = 'answered';
    this.emit('accepted');
    return Promise.resolve();
  }

  cancel() {
    return this.dispose();
  }

  decline() {
    return this.dispose();
  }

  hangup() {
    return this.dispose();
  }

  dispose() {
    this.state = 'disposed';
    this.emit('disposed');
    return Promise.resolve();
  }

  hold() {
    this.__rc_localHold = true;
    this.emit('hold');
    return Promise.resolve();
  }

  unhold() {
    this.__rc_localHold = false;
    this.emit('unhold');
    return Promise.resolve();
  }

  mute() {
    this.__rc_isOnMute = true;
    this.emit('muted');
    return Promise.resolve();
  }

  unmute() {
    this.__rc_isOnMute = false;
    this.emit('unmuted');
    return Promise.resolve();
  }
}

class RingCentralWebphoneV2Mock extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = options;
    this.callSessions = [];
    this.sipClient = {
      wsc: {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      },
      on: jest.fn(),
      reply: jest.fn(() => Promise.resolve()),
      dispose: jest.fn(() => Promise.resolve()),
    };
    this.disposed = false;
  }

  start() {
    this.started = true;
    return Promise.resolve();
  }

  call(toNumber, fromNumber) {
    const session = new WebphoneV2SessionMock({
      direction: 'outbound',
      toNumber,
      fromNumber,
      webPhone: this,
    });
    this.callSessions.push(session);
    return session;
  }

  removeAllListeners(...args) {
    return super.removeAllListeners(...args);
  }
}

module.exports = {
  __esModule: true,
  default: RingCentralWebphoneV2Mock,
};
