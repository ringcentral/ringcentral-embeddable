import { IncomingCallUI as IncomingCallUIBase } from '@ringcentral-integration/widgets/modules/IncomingCallUI';
import { Module } from '@ringcentral-integration/commons/lib/di';

@Module({
  name: 'IncomingCallUI',
})
export class IncomingCallUI extends IncomingCallUIBase {
  // getUIProps(options) {
  //   const props = super.getUIProps(options);
  //   // console.log(JSON.stringify(props, null, 2));
  //   return {
  //     ...props,
  //   };
  // }

  getUIFunctions(options) {
    const functions = super.getUIFunctions(options);
    return {
      ...functions,
      ignore: (sessionId) => this._deps.webphone.ignore(sessionId),
      updateSessionMatchedContact: (webphoneSessionId, contact) => {
        this._deps.webphone.updateSessionMatchedContact(webphoneSessionId, contact);
        const session = this._deps.webphone.sessions.find((session) => session.id === webphoneSessionId);
        if (session && session.partyData) {
          const telephonySessionId = session.partyData.sessionId;
          if (telephonySessionId) {
            this._deps.contactMatcher?.setCallMatched({
              telephonySessionId,
              toEntityId: contact.id
            });
          }
        }
      }
    }; 
  }
}
