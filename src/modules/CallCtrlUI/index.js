import CallCtrlUIBase  from 'ringcentral-widgets/modules/CallCtrlUI';
import { Module } from 'ringcentral-integration/lib/di';
import recordStatus from 'ringcentral-integration/modules/Webphone/recordStatus';
import webphoneErrors from 'ringcentral-integration/modules/Webphone/webphoneErrors';
import sessionStatus from 'ringcentral-integration/modules/Webphone/sessionStatus';

@Module({
  name: 'CallCtrlUI',
  deps: [
    'Alert',
    'ActiveCallControl',
  ],
})
export default class CallCtrlUI extends CallCtrlUIBase {
  constructor({
    activeCallControl,
    alert,
    ...options
  }) {
    super(options);
    this._activeCallControl = activeCallControl;
    this._alert = alert;
  }

  getUIProps(options) {
    const props = super.getUIProps(options);
    const session = { ...props.session };
    if (session.status === sessionStatus.connecting) {
      session.recordStatus = recordStatus.pending;
    }
    const telephonySessionId = props.session?.partyData?.sessionId;
    if (telephonySessionId && this._rolesAndPermissions.hasActiveCallControlPermission) {
      const telephonySession = this._activeCallControl.getActiveSession(telephonySessionId);
      if (telephonySession && session.recordStatus !== recordStatus.pending) {
        session.recordStatus = telephonySession.recordStatus;
      }
    }
    return {
      ...props,
      session,
    }
  }

  _getTelephonySessionId(webphoneSessionId) {
    const webphoneSession =
      this._webphone.sessions.find((session) => session.id === webphoneSessionId);
    const telephonySessionId = webphoneSession?.partyData?.sessionId;
    if (telephonySessionId && this._rolesAndPermissions.hasActiveCallControlPermission) {
      const telephonySession = this._activeCallControl.getActiveSession(telephonySessionId);
      if (telephonySession) {
        return telephonySessionId;
      }
    }
    return null;
  }

  getUIFunctions(options) {
    const functions = super.getUIFunctions(options);
    return {
      ...functions,
      onRecord: async (sessionId) => {
        const telephonySessionId = this._getTelephonySessionId(sessionId);
        if (telephonySessionId) {
          try {
            this._webphone.updateRecordStatus(sessionId, recordStatus.pending);
            await this._activeCallControl.startRecord(telephonySessionId);
            this._webphone.updateRecordStatus(sessionId, recordStatus.recording);
          } catch (e) {
            this._alert.danger({
              message: webphoneErrors.recordError,
              payload: {
                errorCode: e.message,
              },
            });
            this._webphone.updateRecordStatus(sessionId, recordStatus.idle);
          }
          return;
        }
        return this._webphone.startRecord(sessionId);
      },
      onStopRecord: async (sessionId) => {
        const telephonySessionId = this._getTelephonySessionId(sessionId);
        if (telephonySessionId) {
          try {
            this._webphone.updateRecordStatus(sessionId, recordStatus.pending);
            await this._activeCallControl.stopRecord(telephonySessionId);
            this._webphone.updateRecordStatus(sessionId, recordStatus.idle);
          } catch (e) {
            if (e.response && e.response.status === 403) {
              this._alert.danger({
                message: 'stopRecordDisabled',
              });
            } else {
              this._alert.danger({
                message: webphoneErrors.recordError,
                payload: {
                  errorCode: e.message,
                },
              });
            }
            this._webphone.updateRecordStatus(sessionId, recordStatus.recording);
          }
          return;
        }
        return this._webphone.stopRecord(sessionId);
      },
    }
  }
}
