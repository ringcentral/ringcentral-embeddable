import {
  Conversations,
  type FilteredConversation,
} from '@ringcentral-integration/micro-message/src/app/services';
import {
  ConversationsViewSpring,
} from '@ringcentral-integration/micro-message/src/app/views/ConversationsViewSpring';
import {
  action,
  computed,
  injectable,
  RcViewModule,
  RouterPlugin,
  state,
  useConnector,
} from '@ringcentral-integration/next-core';
import React, { useRef } from 'react';

import type { FaxDetailsPanelProps } from './FaxDetails.view.interface';
import { FaxDetailsPanel } from './FaxDetailsPanel';

@injectable({
  name: 'FaxDetailsView',
})
export class FaxDetailsView extends RcViewModule {
  constructor(
    private readonly _conversations: Conversations,
    private readonly _conversationsView: ConversationsViewSpring,
    private readonly _router: RouterPlugin,
  ) {
    super();
  }

  @state
  currentFaxId: string | null = null;

  @action
  setCurrentFaxId(id: string): void {
    this.currentFaxId = id;
  }

  @computed
  get currentFax(): FilteredConversation | undefined {
    return this.currentFaxId
      ? this._conversations.formattedConversationsMap.get(this.currentFaxId)
      : undefined;
  }

  useConversationItemInfo = (
    conversation: FilteredConversation,
  ): ReturnType<FaxDetailsPanelProps['useConversationItemInfo']> => {
    const { actions, info } = this._conversationsView.useConversationItemInfo(
      conversation,
      { pageType: 'list' },
    );
    return {
      info,
      actions: actions.filter(({ type }) =>
        ['viewFax', 'downloadFax', 'delete'].includes(type),
      ),
    };
  };

  component(): React.ReactElement | null {
    this._router.useParams<{ conversationId: string }>(({ conversationId }) =>
      this.setCurrentFaxId(conversationId)
    );
    const fax = useConnector(() => this.currentFax);
    const { current: functions } = useRef({
      goBack: () => {
        void this._router.push('/fax');
      },
      useActionsHandler: this._conversationsView.useActionsHandler,
      useConversationItemInfo: this.useConversationItemInfo,
    });
    return fax ? <FaxDetailsPanel fax={fax} {...functions} /> : null;
  }
}
