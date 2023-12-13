import CallsListPanel from '@ringcentral-integration/widgets/components/CallsListPanel';
import { connectModule } from '@ringcentral-integration/widgets/lib/phoneContext';

export const CallsListPage = connectModule(({ callsListUI }) => callsListUI)(
  CallsListPanel,
);
