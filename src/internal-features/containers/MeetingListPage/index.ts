import { connectModule } from 'ringcentral-widgets/lib/phoneContext';
import MeetingList from '../../components/MeetingList';

const MeetingListPage = connectModule((phone) => phone.meetingListUI)(
  MeetingList,
);

export { MeetingListPage as default };
