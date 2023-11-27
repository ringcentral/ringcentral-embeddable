import { filter } from 'ramda';
import {
  events as callEvents,
  RingCentralCall,
} from 'ringcentral-call';
import { PartyStatusCode } from 'ringcentral-call-control/lib/Session';

import {
  trackEvents,
} from '@ringcentral-integration/commons/enums/trackEvents';
import { Module } from '@ringcentral-integration/commons/lib/di';
import {
  ActiveCallControl as ActiveCallControlBase,
} from '@ringcentral-integration/commons/modules/ActiveCallControl';
import {
  callControlError,
} from '@ringcentral-integration/commons/modules/ActiveCallControl/callControlError';
import {
  conflictError,
} from '@ringcentral-integration/commons/modules/ActiveCallControl/helpers';
import { track } from '@ringcentral-integration/core';

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

  // TODO: override to fix unhold issue with web phone module
  private _initRcCall() {
    const rcCall = new RingCentralCall({
      sdk: this._deps.client.service,
      subscriptions: undefined,
      enableSubscriptionHander: false,
      callControlOptions: {
        preloadDevices: false,
        preloadSessions: false,
        extensionInfo: {
          ...this._deps.extensionInfo.info,
          // TODO: add info type in 'AccountInfo'
          // @ts-ignore
          account: this._deps.accountInfo.info,
        },
      },
      webphone: null,
    });
    rcCall.on(callEvents.NEW, (session) => {
      this._newSessionHandler(session);
    });
    // comment out to fix unhold issue with web phone module
    // rcCall.on(callEvents.WEBPHONE_INVITE, (session: WebphoneSession) =>
    //   this._onWebphoneInvite(session),
    // );
    // rcCall.on(callEvents.WEBPHONE_INVITE_SENT, (session: WebphoneSession) =>
    //   this._onWebphoneInvite(session),
    // );
    // TODO: workaround of bug:
    // WebRTC outbound call with wrong sequences of telephony sessions then call log section will not show
    // @ts-ignore
    rcCall._callControl?.on('new', (session: Session) => {
      this._onNewCall(session);
      this._newTelephonySessionHandler(session); // for telephony session notification
    });
    return rcCall;
  }

  override onInitOnce() {
    // do nothing
  }

  @track((that) => [
    that._getTrackEventName(trackEvents.hold),
  ])
  async hold(telephonySessionId: string) {
    try {
      this.setCallControlBusyTimestamp();
      const session = this._getSessionById(telephonySessionId);
      await session.hold();
      this.clearCallControlBusyTimestamp();
    } catch (error: any) {
      // TODO: fix error handling with instanceof
      if (error.response && !error.response._text) {
        error.response._text = await error.response.clone().text();
      }
      if (conflictError(error)) {
        this._deps.alert.warning({
          message: callControlError.holdConflictError,
        });
      } else if (
        !(await this._deps.availabilityMonitor?.checkIfHAError(error))
      ) {
        this._deps.alert.warning({ message: callControlError.generalError });
      }
      this.clearCallControlBusyTimestamp();
    }
  }

  private async _holdOtherCalls(telephonySessionId?: string) {
    const currSessions = this._rcCall!.sessions!;
    const otherSessions = filter((s) => {
      return (
        s.telephonySessionId !== telephonySessionId &&
        (s.status === PartyStatusCode.answered ||
          (s.webphoneSession && !s.webphoneSession.localHold))
      );
    }, currSessions);
    if (!otherSessions.length) {
      return;
    }
    const holdOtherSessions = otherSessions.map(async (session) => {
      try {
        await session.hold();
      } catch (error: any /** TODO: confirm with instanceof */) {
        console.log('Hold call fail.', error);
      }
    });
    await Promise.all(holdOtherSessions);
  }
}
