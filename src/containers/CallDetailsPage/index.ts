import { connectModule } from '@ringcentral-integration/widgets/lib/phoneContext';
import { CallDetailsPanel } from '../../components/CallDetailsPanel';

export const CallDetailsPage = connectModule((phone) => phone.callDetailsUI)(
  CallDetailsPanel,
);
