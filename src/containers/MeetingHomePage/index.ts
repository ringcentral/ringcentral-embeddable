import { connectModule } from 'ringcentral-widgets/lib/phoneContext';
import { MeetingHomePanel } from '../../components/MeetingHomePanel';

const MeetingHomePage = connectModule((phone) => phone.meetingHomeUI)(
  MeetingHomePanel,
);

export { MeetingHomePage as default };
