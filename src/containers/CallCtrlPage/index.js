import { connectModule } from '@ringcentral-integration/widgets/lib/phoneContext';

import CallCtrlContainer from './CallCtrlContainer';

const CallCtrlPage = connectModule((phone) => phone.callControlUI)(
  CallCtrlContainer,
);

export default CallCtrlPage;
