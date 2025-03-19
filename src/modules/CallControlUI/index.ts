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
    'Call',
    'ContactMatcher',
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
      session,
    };
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
      updateSessionMatchedContact: async (webphoneSessionId, contact) => {
        await this._deps.webphone.updateSessionMatchedContact(webphoneSessionId, contact);
        const session = this._deps.webphone.sessions.find((session) => session.id === webphoneSessionId);
        if (session && session.partyData) {
          const telephonySessionId = session.partyData.sessionId;
          if (telephonySessionId) {
            const toNumberEntities = this._deps.call.toNumberEntities || [];
            if (toNumberEntities.length > 0) {
              this._deps.call.cleanToNumberEntities();
            }
            this._deps.contactMatcher?.setCallMatched({
              telephonySessionId,
              toEntityId: contact.id
            });
          }
        }
      },
      getDefaultContactMatch: (session, nameMatches) => {
        if (session.contactMatch) {
          return session.contactMatch;
        }
        const telephonySessionId = session.partyData?.sessionId;
        if (telephonySessionId) {
          const matchedId = this._deps.contactMatcher?.callMatched[telephonySessionId];
          if (matchedId) {
            const contactMatch = nameMatches.find((match) => match.id === matchedId);
            if (contactMatch) {
              return contactMatch;
            }
          }
        }
        if (!nameMatches || nameMatches.length < 2) {
          return null;
        }
        const toNumberEntities = this._deps.call.toNumberEntities || [];
        if (toNumberEntities.length > 0) {
          const contact = nameMatches.find((match) => {
            return toNumberEntities.find((entity) => entity.entityId === match.id);
          });
          if (contact) {
            return contact;
          }
        }
        return null;
      }
    }
  }
}
