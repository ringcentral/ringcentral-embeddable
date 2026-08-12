import { messageTypes } from '@ringcentral-integration/commons/enums/messageTypes';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import type { ConversationsPanelSpringProps } from '@ringcentral-integration/micro-message/src/app/views/ConversationsViewSpring/Conversations.view.interface';
import { ConversationsPage as BaseConversationsPage } from '@ringcentral-integration/micro-message/src/app/views/ConversationsViewSpring/ConversationsPage';
import { Filter } from '@ringcentral-integration/micro-message/src/app/views/ConversationsViewSpring/ConversationsPage/Filter';
import i18n from '@ringcentral-integration/micro-message/src/app/views/ConversationsViewSpring/ConversationsPage/i18n';
import { useVirtuosoScrollPosition } from '@ringcentral-integration/react-hooks';
import { VirtualizedList } from '@ringcentral/spring-ui';
import React, { forwardRef } from 'react';

import { ConversationsListItem } from './ConversationsListItem';

export const ConversationsPage = forwardRef<
  HTMLDivElement,
  ConversationsPanelSpringProps
>((props, ref) => {
  const {
    conversations,
    createNewEntityTooltip,
    lastPosition,
    onSearchInputChange,
    readStatusFilter,
    searchInput,
    setLastPosition,
    showLogPopover,
    typeFilter,
    updateReadStatusFilterMap,
    useActionsHandler,
    useConversationItemInfo,
    useItemRender,
  } = props;
  const { t } = useLocale(i18n);
  const { scrollerRef, virtuosoActionsRef } = useVirtuosoScrollPosition(
    (snapshot) =>
      setLastPosition(`${typeFilter}-${readStatusFilter}`, snapshot),
  );

  if (typeFilter !== messageTypes.fax || conversations.length === 0) {
    return <BaseConversationsPage ref={ref} {...props} />;
  }

  return (
    <div className="flex h-full flex-col" data-sign="ConversationsPage">
      <div
        className="flex h-full flex-auto flex-col overflow-hidden"
        ref={ref}
      >
        <Filter
          inputPlaceholder={t('searchFax')}
          onSearchInputChange={onSearchInputChange}
          readStatusFilter={readStatusFilter}
          searchInput={searchInput}
          updateReadStatusFilter={(status) =>
            updateReadStatusFilterMap(status, typeFilter)
          }
        />
        <VirtualizedList
          className="flex-auto overflow-auto"
          data={conversations}
          data-sign="conversationList"
          key={`${typeFilter}-${readStatusFilter}`}
          restoreStateFrom={lastPosition || undefined}
          scrollerRef={scrollerRef}
          virtuosoActions={virtuosoActionsRef}
        >
          {(index, conversation) => (
            <ConversationsListItem
              conversation={conversation}
              createNewEntityTooltip={createNewEntityTooltip}
              index={index}
              key={conversation.conversationId}
              showLogPopover={showLogPopover}
              typeFilter={typeFilter}
              useActionsHandler={useActionsHandler}
              useConversationItemInfo={useConversationItemInfo}
              useItemRender={useItemRender}
            />
          )}
        </VirtualizedList>
      </div>
    </div>
  );
});

ConversationsPage.displayName = 'ConversationsPage';
