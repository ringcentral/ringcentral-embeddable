import { DialerUI as DialerUIBase } from '@ringcentral-integration/widgets/modules/DialerUI';
import { Module } from '@ringcentral-integration/commons/lib/di';

@Module({
  name: 'DialerUI',
  deps: [
    'ModalUI',
    'ThirdPartyService',
  ],
})
export class DialerUI extends DialerUIBase {
  protected _alertModalId = null;
  callVerify = async ({ phoneNumber, recipient }) => {
    if (!this._deps.thirdPartyService.doNotContactRegistered) {
      return true;
    }
    const contact = phoneNumber ? {
      phoneNumber,
    } : {
      phoneNumber: recipient.phoneNumber,
      id: recipient.contactId,
      name: recipient.name,
      type: recipient.type,
      entityType: recipient.entityType,
      phoneType: recipient.phoneType,
    }
    try {
      const doNotContact = await this._deps.thirdPartyService.checkDoNotContact(contact);
      console.log('Do not contact', doNotContact);
      if (!doNotContact || !doNotContact.result) {
        return true;
      }
      if (this._alertModalId) {
        this._deps.modalUI.close(this._alertModalId);
        this._alertModalId = null;
      }
      if (doNotContact.mode === 'restrict') {
        this._alertModalId = this._deps.modalUI.alert({
          title: 'Do Not Call',
          content: doNotContact.message || 'This number is on the Do Not Call list.',
        });
        return false;
      }
      const confirmed = await this._deps.modalUI.confirm({
        title: 'Do Not Call',
        content: doNotContact.message || 'This number is on the Do Not Call list. Do you still want to call?',
        confirmButtonText: 'Call',
      }, true);
      return confirmed;
    } catch (error) {
      console.error(error);
      return true;
    }
  }
}
