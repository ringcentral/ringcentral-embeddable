import { Module } from '@ringcentral-integration/commons/lib/di';
import {
  ActiveCallControl as ActiveCallControlBase,
} from './ActiveCallControl';
import { Session as TelephonySession } from 'ringcentral-call-control/lib/Session';
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

  protected override _initRcCallControl() {
    const rcCallControl = super._initRcCallControl();
    rcCallControl.on('new', (session: TelephonySession) => {
      this._newTelephonySessionHandler(session); // for telephony session notification
    });
    return rcCallControl;
  }
}
