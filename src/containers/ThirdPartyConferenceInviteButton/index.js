import { connect } from 'react-redux';
import withPhone from 'ringcentral-widgets/lib/withPhone';

import ThirdPartyConferenceInviteButton from '../../components/ThirdPartyConferenceInviteButton';

function mapToProps(_, {
  phone: {
    thirdPartyService,
  },
}) {
  return {
    inviteTitle: thirdPartyService.conferenceInviteTitle,
  };
}

function mapToFunctions(_, {
  phone: {
    thirdPartyService,
  },
}) {
  return {
    onInvite: (event) => {
      thirdPartyService.inviteConference(event);
    }
  };
}

export default withPhone(connect(
  mapToProps,
  mapToFunctions,
)(ThirdPartyConferenceInviteButton));
