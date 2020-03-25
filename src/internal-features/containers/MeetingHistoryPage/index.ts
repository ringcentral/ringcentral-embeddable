import { connectModule } from 'ringcentral-widgets/lib/phoneContext';
import MeetingHistoryPanel from '../../components/MeetingHistoryPanel';

const MeetingHistoryPage = connectModule((phone) => phone.meetingHistoryUI)(
  MeetingHistoryPanel,
);

export { MeetingHistoryPage as default };
