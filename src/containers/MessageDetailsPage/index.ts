import { connectModule } from '@ringcentral-integration/widgets/lib/phoneContext';
import { MessageDetailsPanel } from '../../components/MessageDetailsPanel';

export const MessageDetailsPage = connectModule((phone) => phone.messageDetailsUI)(
  MessageDetailsPanel,
);
