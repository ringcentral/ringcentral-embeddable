import { Module } from '@ringcentral-integration/commons/lib/di';
import {
  ComposeText as ComposeTextBase,
} from '@ringcentral-integration/commons/modules/ComposeText';

@Module({
  name: 'ComposeText',
  deps: [
    'ModalUI',
    'ThirdPartyService',
  ]
})
export class ComposeText extends ComposeTextBase {
  protected _alertModalId = null;

  smsVerify = async ({ toNumbers, typingToNumber }) => {
    if (!this._deps.thirdPartyService.doNotContactRegistered) {
      return true;
    }
    const recipients = (toNumbers || []).map((item) => ({
      phoneNumber: item.phoneNumber,
      phoneType: item.phoneType,
      contactId: item.contactId,
      name: item.name,
      contactType: item.type,
      entityType: item.entityType,
    }));
    if (typingToNumber) {
      recipients.push({
        phoneNumber: typingToNumber,
      });
    }
    try {
      const doNotContact = await this._deps.thirdPartyService.checkDoNotContact({
        recipients,
        actionType: 'sms',
      });
      if (!doNotContact || !doNotContact.result) {
        return true;
      }
      if (this._alertModalId) {
        this._deps.modalUI.close(this._alertModalId);
        this._alertModalId = null;
      }
      if (doNotContact.mode === 'restrict') {
        this._alertModalId = this._deps.modalUI.alert({
          title: 'Do Not Contact',
          content: doNotContact.message || 'The number is on the Do Not Contact list.',
        });
        return false;
      }
      const confirmed = await this._deps.modalUI.confirm({
        title: 'Do Not Contact',
        content: doNotContact.message || 'The number is on the Do Not Contact list. Do you still want to send message?',
        confirmButtonText: 'Send',
      }, true);
      return confirmed;
    } catch (error) {
      console.error(error);
      return true;
    }
  }
}
