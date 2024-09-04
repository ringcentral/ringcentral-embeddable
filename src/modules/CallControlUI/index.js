import { CallControlUI as CallControlUIBase }  from '@ringcentral-integration/widgets/modules/CallControlUI';
import { Module } from '@ringcentral-integration/commons/lib/di';
import recordStatus from '@ringcentral-integration/commons/modules/Webphone/recordStatus';
import webphoneErrors from '@ringcentral-integration/commons/modules/Webphone/webphoneErrors';
import sessionStatus from '@ringcentral-integration/commons/modules/Webphone/sessionStatus';

@Module({
  name: 'CallControlUI',
  deps: [
    'Alert',
    'ActiveCallControl',
  ],
})
export class CallControlUI extends CallControlUIBase {
  getUIProps(options) {
    const props = super.getUIProps(options);
    const session = { ...props.session };
    if (session.status === sessionStatus.connecting) {
      session.recordStatus = recordStatus.pending;
    }
    const {
      appFeatures,
      activeCallControl,
    } = this._deps;
    const telephonySessionId = props.session?.partyData?.sessionId;
    if (telephonySessionId && appFeatures.hasCallControl) {
      const telephonySession = activeCallControl.getActiveSession(telephonySessionId);
      if (telephonySession && session.recordStatus !== recordStatus.pending) {
        session.recordStatus = telephonySession.recordStatus;
      }
    }
    return {
      ...props,
      // session,
      session: {
        "id": "8n26fq11ngj7vuakl4jpne0cdsuvk0",
        "callId": "8n26fq11ngj7vuakl4jp",
        "direction": "Outbound",
        "callStatus": "webphone-session-connected",
        "to": "+16504257106",
        "from": "16503626712*103",
        "fromNumber": "+16503626712",
        "fromTag": "ne0cdsuvk0",
        "startTime": 1725349486061,
        "creationTime": 1725349484104,
        "isOnHold": false,
        "isOnMute": false,
        "isOnFlip": false,
        "isOnTransfer": false,
        "isToVoicemail": false,
        "isForwarded": false,
        "isReplied": false,
        "recordStatus": "webphone-record-idle",
        "minimized": false,
        "partyData": {
          "partyId": "p-a71911f2a3477z191b6d7dce3zfb720000-1",
          "sessionId": "s-a71911f2a3477z191b6d7dce3zfb720000"
        },
        "lastActiveTime": 1725349484104,
        "cached": false,
        "removed": false,
        "callQueueName": null
      },
    }
  }

  _getTelephonySessionId(webphoneSessionId) {
    const {
      appFeatures,
      activeCallControl,
      webphone
    } = this._deps;
    const webphoneSession =
      webphone.sessions.find((session) => session.id === webphoneSessionId);
    const telephonySessionId = webphoneSession?.partyData?.sessionId;
    if (telephonySessionId && appFeatures.hasCallControl) {
      const telephonySession = activeCallControl.getActiveSession(telephonySessionId);
      if (telephonySession) {
        const isConferenceCall = telephonySession.to === 'conference';
        return [telephonySessionId, isConferenceCall];
      }
    }
    return [null, false];
  }

  getUIFunctions(options) {
    const functions = super.getUIFunctions(options);
    return {
      ...functions,
      onRecord: async (sessionId) => {
        const {
          alert,
          activeCallControl,
          webphone
        } = this._deps;
        const [telephonySessionId, isConferenceCall] = this._getTelephonySessionId(sessionId);
        if (telephonySessionId && !isConferenceCall) {
          try {
            webphone.updateRecordStatus(sessionId, recordStatus.pending);
            await activeCallControl.startRecord(telephonySessionId);
            webphone.updateRecordStatus(sessionId, recordStatus.recording);
          } catch (e) {
            alert.danger({
              message: webphoneErrors.recordError,
              payload: {
                errorCode: e.message,
              },
            });
            webphone.updateRecordStatus(sessionId, recordStatus.idle);
          }
          return;
        }
        return webphone.startRecord(sessionId);
      },
      onStopRecord: async (sessionId) => {
        const {
          alert,
          activeCallControl,
          webphone
        } = this._deps;
        const [telephonySessionId, isConferenceCall] = this._getTelephonySessionId(sessionId);
        if (telephonySessionId && !isConferenceCall) {
          try {
            webphone.updateRecordStatus(sessionId, recordStatus.pending);
            await activeCallControl.stopRecord(telephonySessionId);
            webphone.updateRecordStatus(sessionId, recordStatus.idle);
          } catch (e) {
            if (e.response && e.response.status === 403) {
              alert.danger({
                message: 'stopRecordDisabled',
              });
            } else {
              alert.danger({
                message: webphoneErrors.recordError,
                payload: {
                  errorCode: e.message,
                },
              });
            }
            webphone.updateRecordStatus(sessionId, recordStatus.recording);
          }
          return;
        }
        return webphone.stopRecord(sessionId);
      },
    }
  }
}
