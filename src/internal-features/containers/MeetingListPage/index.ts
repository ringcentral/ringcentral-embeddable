import MeetingList from '../../components/MeetingList';
import { connectModule } from 'ringcentral-widgets/lib/phoneContext';

const MeetingListPage = connectModule((phone) => phone.meetingListUI)(
  MeetingList,
);

export { MeetingListPage as default };
