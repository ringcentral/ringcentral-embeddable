import { connectModule } from 'ringcentral-widgets/lib/phoneContext';
import MeetingList from '../../components/MeetingList';

const MeetingRecordingsListPage = connectModule((phone) => phone.meetingRecordingsUI)(
  MeetingList,
);

export { MeetingRecordingsListPage as default };
