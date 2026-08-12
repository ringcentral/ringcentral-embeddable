import type { useContactRenderInfoFromConversation } from '@ringcentral-integration/micro-phone/src/app/hooks';
import type { HistoryAction } from '@ringcentral-integration/next-widgets/components/ActionMenuList/useHistoryActionButtons';

import type { FilteredConversation } from '@ringcentral-integration/micro-message/src/app/services';
import type { UseConversationsActions } from '@ringcentral-integration/micro-message/src/app/views/ConversationsViewSpring/Conversations.view';

export interface FaxDetailsPanelProps {
  fax: FilteredConversation;
  goBack: () => void;
  useActionsHandler: UseConversationsActions;
  useConversationItemInfo: (conversation: FilteredConversation) => {
    actions: HistoryAction[];
    info: ReturnType<typeof useContactRenderInfoFromConversation>;
  };
}
