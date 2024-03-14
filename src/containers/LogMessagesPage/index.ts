import { connectModule } from '@ringcentral-integration/widgets/lib/phoneContext';
import LogMessagesPanel from '../../components/LogMessagesPanel';

const LogMessagesPage = connectModule((phone) => phone.logMessagesUI)(
  LogMessagesPanel,
);

export default LogMessagesPage;