import { ContactDetailsUI as ContactDetailsUIBase } from '@ringcentral-integration/widgets/modules/ContactDetailsUI';
import { Module } from '@ringcentral-integration/commons/lib/di';

@Module({
  name: 'ContactDetailsUI',
  deps: [
    'ComposeTextUI'
  ]
})
export class ContactDetailsUI extends ContactDetailsUIBase {
  async handleClickToSMS(contact, phoneNumber: string) {
    const recipient = {
      ...contact,
      phoneNumber,
    };
    this._deps.composeTextUI.gotoComposeText(recipient, false);
    this._trackClickToSMS();
  }
}