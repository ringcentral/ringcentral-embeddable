import { connectModule } from 'ringcentral-widgets/lib/phoneContext';

import MeetingInviteModal from '../../components/MeetingInviteModal';

const MeetingInviteModalPage = connectModule((phone) => phone.meetingInviteModalUI)(
  MeetingInviteModal,
);

export default MeetingInviteModalPage;
