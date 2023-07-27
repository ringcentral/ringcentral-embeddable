import { Module } from '@ringcentral-integration/commons/lib/di';
import { RcUIModuleV2, state, action } from '@ringcentral-integration/core';

@Module({
  name: 'MeetingInviteUI',
  deps: ['Locale'],
})
export class MeetingInviteUI extends RcUIModuleV2 {
  constructor(deps) {
    super({
      deps,
    });
  }

  @state
  modalShow = false;

  @state
  meetingString = '';

  getUIProps() {
    return {
      currentLocale: this._deps.locale.currentLocale,
      show: this.modalShow,
      meetingString: this.meetingString,
    }
  }

  getUIFunctions() {
    return {
      onClose: this.closeModal,
    };
  }
  
  @action
  private _closeModal() {
    this.modalShow = false;
  }

  @action
  private _showModal(meetingString) {
    this.modalShow = true;
    this.meetingString = meetingString;
  }

  closeModal = () => {
    this._closeModal();
  };

  showModal(meetingInfo) {
    this._showModal(meetingInfo.details);
  }
}
