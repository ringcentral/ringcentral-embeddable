import { connect } from 'react-redux';
import withPhone from 'ringcentral-widgets/lib/withPhone';

import MeetingScheduleButton from 'ringcentral-widgets/components/MeetingScheduleButton';

class NewMeetingScheduleButton extends MeetingScheduleButton {
  getI18nButtonString() {
    return this.props.inviteTitle || super.getI18nButtonString();
  }
}

function mapToProps(_, {
  phone: {
    thirdPartyService,
  },
}) {
  return {
    inviteTitle: thirdPartyService.meetingInviteTitle,
  };
}

export default withPhone(connect(
  mapToProps,
)(NewMeetingScheduleButton));
