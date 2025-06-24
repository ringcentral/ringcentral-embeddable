import { Module } from '@ringcentral-integration/commons/lib/di';
import { EVENTS as EVENTS_BASE } from '@ringcentral-integration/commons/modules/Webphone/events';
import { ObjectMap } from '@ringcentral-integration/core/lib/ObjectMap';
import { Webphone as WebphoneCommon } from './WebphoneCommon';

const EVENTS = ObjectMap.fromKeys([
  ...ObjectMap.keys(EVENTS_BASE),
  'activeWebphoneChanged',
]);

@Module({
  name: 'NewWebphone',
  deps: []
})
export class Webphone extends WebphoneCommon {
  updateRecordStatus(sessionId, status) {
    const session = this.originalSessions[sessionId];
    if (!session) {
      return;
    }
    session.__rc_recordStatus = status;
    this._updateSessions();
  }

  onActiveWebphoneChanged(handler) {
    if (typeof handler === 'function') {
      this._eventEmitter.on(EVENTS.activeWebphoneChanged, handler);
    }
  }
}