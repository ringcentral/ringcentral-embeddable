import ActiveCallControl from '@ringcentral-integration/commons/modules/ActiveCallControl';
import { Module } from '@ringcentral-integration/commons/lib/di';

@Module({
  name: 'NewActiveCallControl',
  deps: []
})
export default class NewActiveCallControl extends ActiveCallControl {
  constructor(options) {
    super(options);
    this._onSessionUpdateHandlers = [];
  }

  onSessionUpdated(handler) {
    this._onSessionUpdateHandlers.push(handler);
  }

  // override
  _updateSessionsHandler = (session) => {
    this.store.dispatch({
      type: this.actionTypes.updateActiveSessions,
      timestamp: Date.now(),
      sessionData: this._rcCallControl.sessions.map((s) => s.data),
    });
    this._onSessionUpdateHandlers.forEach((handler) => {
      handler(session && session.data);
    });
  };

  _newSessionHandler(session) {
    this._updateSessionsHandler(session);
    const updateSessionsHandler = () => {
      this._updateSessionsHandler(session);
    }
    if (session.__updateUpdateSessionsHandler__) {
      session.removeListener('status', session.__updateUpdateSessionsHandler__);
      session.removeListener('muted', session.__updateUpdateSessionsHandler__);
      session.removeListener('recordings', session.__updateUpdateSessionsHandler__);
    }
    session.__updateUpdateSessionsHandler__ = updateSessionsHandler; // hack
    session.on('status', updateSessionsHandler);
    session.on('muted', updateSessionsHandler);
    session.on('recordings', updateSessionsHandler);
  }

  async startRecord(telephonySessionId) {
    try {
      const session = this._rcCallControl.sessions.find(
        (s) => s.id === telephonySessionId,
      );
      const recordingId = this.getRecordingId(session);
      if (recordingId) {
        await session.resumeRecord(recordingId);
      } else {
        await session.createRecord(recordingId);
      }
    } catch (error) {
      throw error;
    }
  }
}
