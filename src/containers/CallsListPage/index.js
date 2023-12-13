import { connectModule } from '@ringcentral-integration/widgets/lib/phoneContext';
import CallsListPanel from '../../components/CallsListPanel';

export const CallsListPage = connectModule(({ callsListUI }) => callsListUI)(
  CallsListPanel,
);
