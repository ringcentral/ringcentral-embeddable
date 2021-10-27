import { Module } from '@ringcentral-integration/commons/lib/di';
import RcUIModule from '@ringcentral-integration/widgets/lib/RcUIModule';

import actionTypes from './actionTypes';
import getReducer from './getReducer';

@Module({
  name: 'MeetingInviteUI',
  deps: ['Locale'],
})
export default class MeetingInviteUI extends RcUIModule {
  constructor({
    locale,
    ...options
  }) {
    super({
      ...options,
    });
    this._locale = locale;

    this._reducer = getReducer(this.actionTypes);
  }

  getUIProps() {
    return {
      currentLocale: this._locale.currentLocale,
      show: this.state.modalShow,
      meetingString: this.state.meetingString,
    }
  }

  getUIFunctions() {
    return {
      onClose: this.closeModal,
    };
  }

  closeModal = () => {
    this.store.dispatch({
      type: this.actionTypes.close,
    });
  };

  showModal(meetingInfo) {
    this.store.dispatch({
      type: this.actionTypes.newMeeting,
      show: true,
      meetingString: meetingInfo.details,
    });
  }

  get _actionTypes() {
    return actionTypes;
  }
}
