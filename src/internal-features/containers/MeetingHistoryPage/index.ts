import { connectModule } from 'ringcentral-widgets/lib/phoneContext';
import MeetingList from '../../components/MeetingList';

const MeetingHistoryPage = connectModule((phone) => phone.meetingHistoryUI)(
  MeetingList,
);

export { MeetingHistoryPage as default };
