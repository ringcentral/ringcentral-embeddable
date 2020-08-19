import React from 'react';
import { connect } from 'react-redux';
import withPhone from 'ringcentral-widgets/lib/withPhone';

import MeetingScheduleButton from 'ringcentral-widgets/components/MeetingScheduleButton';
import { RcVideoScheduleButton } from 'ringcentral-widgets/components/RcVideoScheduleButton';

function MeetingInviteButton(props) {
  const {
    isRCV,
    inviteTitle,
  } = props;
  if (isRCV) {
    return (
      <RcVideoScheduleButton
        {...props}
        buttonLabel={inviteTitle}
      />
    );
  }
  return (
    <MeetingScheduleButton
      {...props}
      scheduleButtonLabel={inviteTitle}
    />
  )
}

function mapToProps(_, {
  phone: {
    thirdPartyService,
    genericMeeting,
  },
}) {
  return {
    inviteTitle: thirdPartyService.meetingInviteTitle,
    isRCV: genericMeeting.isRCV,
  };
}

export default withPhone(connect(
  mapToProps,
)(MeetingInviteButton));
