import { IncomingCallUI as IncomingCallUIBase } from '@ringcentral-integration/widgets/modules/IncomingCallUI';
import { Module } from '@ringcentral-integration/commons/lib/di';
import { validateNumbers } from '@ringcentral-integration/commons/lib/validateNumbers';
import { webphoneErrors } from '@ringcentral-integration/commons/modules/Webphone/webphoneErrors';
@Module({
  name: 'IncomingCallUI',
  deps: ['Client', 'Brand', 'RegionSettings', 'AccountInfo', 'Alert']
})
export class IncomingCallUI extends IncomingCallUIBase {
  async forward(sessionId, forwardNumber, recipient) {
    const {
      accountInfo,
      brand,
      regionSettings,
      client,
      webphone,
      alert,
    } = this._deps;
    const session = webphone.sessions.find((session) => session.callId === sessionId);
    if (!session) {
      return;
    }
    if (!session.partyData) {
      return webphone.forward(sessionId, forwardNumber);
    }
    const validatedResult = validateNumbers({
      allowRegionSettings:
        !!brand.brandConfig.allowRegionSettings,
      areaCode: regionSettings.areaCode,
      countryCode: regionSettings.countryCode,
      phoneNumbers: [forwardNumber],
    });
    const validPhoneNumber = validatedResult[0];
    const maxExtensionNumberLength = accountInfo.maxExtensionNumberLength || 6;
    const requestBody: {
      extensionId?: string;
      extensionNumber?: string;
      phoneNumber?: string;
    } = {};
    if (recipient && recipient.entityType === 'rcContact' && recipient.type === 'company') {
      requestBody.extensionId = recipient.contactId;
    } else {
      if (validPhoneNumber.indexOf('+') === -1 && validPhoneNumber.length <= maxExtensionNumberLength) {
        requestBody.extensionNumber = validPhoneNumber;
      } else {
        requestBody.phoneNumber = validPhoneNumber;
      }
    }
    const telephonySessionId = session.partyData.sessionId;
    const partyId = session.partyData.partyId;
    const platform = client.service.platform();
    await webphone.setForwardFlag(sessionId);
    try {
      await platform.post(
        `/restapi/v1.0/account/~/telephony/sessions/${telephonySessionId}/parties/${partyId}/forward`,
        requestBody,
      );
      return true;
    } catch (error) {
      console.error(error);
      alert.warning({
        message: webphoneErrors.forwardError,
      });
      return;
    }
  }

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
      },
      onForward: (sessionId, forwardNumber, recipient) => this.forward(sessionId, forwardNumber, recipient),
      startReply: (sessionId) => this._deps.webphone.startReply(sessionId),
    };
  }
}
