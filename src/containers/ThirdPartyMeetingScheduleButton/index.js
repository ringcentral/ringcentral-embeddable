import { connect } from 'react-redux';
import withPhone from 'ringcentral-widgets/lib/withPhone';

import MeetingScheduleButton from '../../components/MeetingScheduleButton';

class NewMeetingScheduleButton extends MeetingScheduleButton {
  getI18nButtonString() {
    return this.props.inviteTitle;
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
