import {
  connectModule,
} from '@ringcentral-integration/widgets/lib/phoneContext';

import ConversationPanel from '../../components/ConversationPanel';

const ConversationPage = connectModule((phone) => phone.conversationUI)(
  ConversationPanel,
);

export { ConversationPage as default, ConversationPage };
