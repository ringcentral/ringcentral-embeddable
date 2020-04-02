import { connectModule } from 'ringcentral-widgets/lib/phoneContext';

import { GenericMeetingPanel } from '../../components/GenericMeetingPanel';

const GenericMeetingPage = connectModule((phone) => phone.genericMeetingUI)(
  GenericMeetingPanel,
);

export default GenericMeetingPage;
