import type { FormattedConversation } from '@ringcentral-integration/micro-message/src/app/services';
import type { ConversationsPanelSpringProps } from '@ringcentral-integration/micro-message/src/app/views/ConversationsViewSpring/Conversations.view.interface';
import { useConversationActionButtons } from '@ringcentral-integration/micro-message/src/app/views/ConversationsViewSpring/useConversationActionButtons';
import { useThreadInfoDisplay } from '@ringcentral-integration/micro-message/src/app/views/MessageThreadsView/useThreadInfoDisplay';
import { ListItem, ListItemText } from '@ringcentral/spring-ui';
import clsx from 'clsx';
import React, { memo } from 'react';

interface ConversationsListItemProps
  extends Pick<
    ConversationsPanelSpringProps,
    | 'createNewEntityTooltip'
    | 'showLogPopover'
    | 'typeFilter'
    | 'useActionsHandler'
    | 'useConversationItemInfo'
    | 'useItemRender'
  > {
  conversation: FormattedConversation;
  index: number;
}

const FaxConversationsListItem: React.FC<ConversationsListItemProps> = ({
  conversation,
  createNewEntityTooltip,
  index,
  showLogPopover,
  typeFilter,
  useActionsHandler,
  useConversationItemInfo,
  useItemRender,
}) => {
  const { actions, extensionId, info, threadInfo } =
    useConversationItemInfo(conversation);
  const onAction = useActionsHandler(conversation, info, 'Fax list');
  useItemRender?.(conversation, index);
  const {
    Avatar,
    DisplayName,
    Unread,
    creationTime,
    displayDescription,
    displayType,
    logged,
    unreadCounts,
  } = info;
  const { ThreadStatus, queueName } = useThreadInfoDisplay({
    extensionId,
    info: threadInfo,
    onAction,
  });
  const buttons = useConversationActionButtons({
    actions,
    conversation,
    createNewEntityTooltip,
    onAction,
    showLogPopover,
  });

  return (
    <ListItem
      className="group"
      clickable
      classes={{ content: 'bg-inherit !px-3 !py-2' }}
      data-sign="conversationItem"
      onClick={() => onAction('viewDetail')}
      size="auto"
    >
      <Unread className="mr-1 -ml-3" data-sign="unread-conversationItem" />
      <Avatar />
      <ListItemText
        primary={
          <div
            className={clsx('flex items-center gap-1 truncate', {
              'typography-subtitleBold': unreadCounts > 0,
            })}
            data-display-type={displayType}
            data-sign="currentName"
          >
            <DisplayName
              displayControl={{ matchCounts: true, maybe: true }}
            />
          </div>
        }
        secondary={
          queueName ? (
            <div>
              {displayDescription}
              {queueName}
            </div>
          ) : (
            displayDescription
          )
        }
      />
      <div className="min-h-11 text-right">
        <div className="flex items-center gap-1">
          <Unread color="secondary" size="small" type="standard" />
          <ThreadStatus />
          <span
            className="typography-descriptor text-neutral-b2"
            data-sign="conversationItemTime"
          >
            {creationTime}
          </span>
        </div>
        {logged}
      </div>
      {buttons}
    </ListItem>
  );
};

export const ConversationsListItem = memo(FaxConversationsListItem);
