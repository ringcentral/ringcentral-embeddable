import { connectModule } from '@ringcentral-integration/widgets/lib/phoneContext';
import { MeetingHomePanel } from '../../components/MeetingHomePanel';

const MeetingHomePage = connectModule((phone) => phone.meetingHomeUI)(
  MeetingHomePanel,
);

export { MeetingHomePage as default };
