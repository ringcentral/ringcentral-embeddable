const EventEmitter = require('events');
const { RcModuleV2 } = require('@ringcentral-integration/core');
const { Module } = require('@ringcentral-integration/commons/lib/di');

class SleepDetector extends RcModuleV2 {
  constructor(deps = {}) {
    super({
      deps,
    });
    this._eventEmitter = new EventEmitter();
    this.events = {
      detected: 'detected',
    };
  }

  on(event, handler) {
    this._eventEmitter.on(event, handler);
  }

  off(event, handler) {
    this._eventEmitter.off(event, handler);
  }
}

Module({
  name: 'SleepDetector',
  deps: [
    {
      dep: 'SleepDetectorOptions',
      optional: true,
    },
  ],
})(SleepDetector);

module.exports = {
  SleepDetector,
};
