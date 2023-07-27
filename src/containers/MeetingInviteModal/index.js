import { connectModule } from '@ringcentral-integration/widgets/lib/phoneContext';

import MeetingInviteModal from '../../components/MeetingInviteModal';

const MeetingInviteModalPage = connectModule((phone) => phone.meetingInviteUI)(
  MeetingInviteModal,
);

export default MeetingInviteModalPage;
