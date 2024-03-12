import { connectModule } from '@ringcentral-integration/widgets/lib/phoneContext';
import LogCallPanel from '../../components/LogCallPanel';

const LogCallPage = connectModule((phone) => phone.logCallUI)(
  LogCallPanel,
);

export default LogCallPage;
