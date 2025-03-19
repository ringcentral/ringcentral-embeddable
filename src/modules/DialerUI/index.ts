import { DialerUI as DialerUIBase } from '@ringcentral-integration/widgets/modules/DialerUI';
import { Module } from '@ringcentral-integration/commons/lib/di';

@Module({
  name: 'DialerUI',
  deps: [
    'ModalUI',
    'ThirdPartyService',
    'SideDrawerUI',
  ],
})
export class DialerUI extends DialerUIBase {
  protected _alertModalId = null;
  callVerify = async ({ phoneNumber, recipient }) => {
    if (this._deps.sideDrawerUI.modalOpen) {
      this._deps.sideDrawerUI.clearWidgets();
    }
    if (recipient) {
      this._deps.call.onToNumberMatch({
        entityId: recipient.id,
        startTime: Date.now(),
      });
    }
    if (!this._deps.thirdPartyService.doNotContactRegistered) {
      return true;
    }
    const contact = phoneNumber ? {
      phoneNumber,
      actionType: 'call',
    } : {
      phoneNumber: recipient.phoneNumber,
      contactId: recipient.contactId,
      name: recipient.name,
      contactType: recipient.type,
      entityType: recipient.entityType,
      phoneType: recipient.phoneType,
      actionType: 'call',
    };
    try {
      const doNotContact = await this._deps.thirdPartyService.checkDoNotContact(contact);
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

  getUIFunctions(props) {
    const parentUIFunctions = super.getUIFunctions(props);
    return {
      ...parentUIFunctions,
      onEnterKeyPress: (e) => {
        if (this._deps.sideDrawerUI.modalOpen) {
          return;
        }
        this.onCallButtonClick({ clickDialerToCall: true });
      },
    };
  }
}
