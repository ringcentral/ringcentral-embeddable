import { connectModule } from '@ringcentral-integration/widgets/lib/phoneContext';
import { ConversationsPanel } from '../../components/ConversationsPanel';

const ConversationsPage = connectModule((phone) => phone.conversationsUI)(
  ConversationsPanel,
);

export { ConversationsPage as default, ConversationsPage };
