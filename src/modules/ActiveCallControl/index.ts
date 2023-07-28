import { ActiveCallControl as ActiveCallControlBase } from '@ringcentral-integration/commons/modules/ActiveCallControl';
import { Module } from '@ringcentral-integration/commons/lib/di';

@Module({
  name: 'NewActiveCallControl',
  deps: []
})
export class ActiveCallControl extends ActiveCallControlBase {
  private _onTelephonySessionUpdateHandlers: any[];

  constructor(deps) {
    super(deps);
    this._onTelephonySessionUpdateHandlers = [];
  }

  // override
  _initRcCall() {
    const rcCall = super._initRcCall();
    if (rcCall) {
      rcCall.callControl.on('new', this._newTelephonySessionHandler)
    }
    return rcCall
  }

  onTelephonySessionUpdated(handler) {
    this._onTelephonySessionUpdateHandlers.push(handler);
  }

  _updateTelephonySessionsHandler = (session) => {
    this._onTelephonySessionUpdateHandlers.forEach((handler) => {
      handler(session && session.data);
    });
  };

  _newTelephonySessionHandler = (session) => {
    this._updateTelephonySessionsHandler(session);
    const updateSessionsHandler = () => {
      this._updateTelephonySessionsHandler(session);
      const party = session.party;
      if (
        party &&
        party.status.code === 'Disconnected' &&
        party.status.reason !== 'Pickup' && // don't end when call switched
        party.status.reason !== 'CallSwitch' // don't end when call switched
      ) {
        session.removeListener('status', updateSessionsHandler);
        session.removeListener('muted', updateSessionsHandler);
        session.removeListener('recordings', updateSessionsHandler);
        session.__updateTelephonySessionsHandler__ = null; // hack
      }
    }
    if (session.__updateTelephonySessionsHandler__) {
      session.removeListener('status', session.__updateTelephonySessionsHandler__);
      session.removeListener('muted', session.__updateTelephonySessionsHandler__);
      session.removeListener('recordings', session.__updateTelephonySessionsHandler__);
    }
    session.__updateTelephonySessionsHandler__ = updateSessionsHandler; // hack
    session.on('status', updateSessionsHandler);
    session.on('muted', updateSessionsHandler);
    session.on('recordings', updateSessionsHandler);
  };
}
