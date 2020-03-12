import { connectModule } from 'ringcentral-widgets/lib/phoneContext';
import MeetingRecordingsList from '../../components/MeetingRecordingsList';

const MeetingRecordingsListPage = connectModule((phone) => phone.meetingRecordingsUI)(
  MeetingRecordingsList,
);

export { MeetingRecordingsListPage as default };
