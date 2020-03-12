import MeetingRecordingsList from '../../components/MeetingRecordingsList';
import { connectModule } from 'ringcentral-widgets/lib/phoneContext';

const MeetingRecordingsListPage = connectModule((phone) => phone.meetingRecordingsUI)(
  MeetingRecordingsList,
);

export { MeetingRecordingsListPage as default };
