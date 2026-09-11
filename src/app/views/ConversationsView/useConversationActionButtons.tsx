import {
  ConversationLogPopover,
  type UseConversationActionButtonsProps,
} from '@ringcentral-integration/micro-message/src/app/views/ConversationsViewSpring/useConversationActionButtons';
import {
  ActionMenuList,
  type ActionMenuListButtonProps,
  useHistoryActionButtons,
} from '@ringcentral-integration/next-widgets/components';
import { Menu, MenuItem, MenuItemText, MenuList } from '@ringcentral/spring-ui';
import React, { useMemo, useRef, useState } from 'react';

import { insertRefreshContactActionButton } from '../../components/RefreshContactActionButton';

interface UseConversationActionButtonsWithRefreshProps
  extends UseConversationActionButtonsProps {
  refreshContactButton: ActionMenuListButtonProps | null;
}

export function useConversationActionButtons({
  actions,
  conversation,
  createNewEntityTooltip,
  displayCount,
  moreButtonProps,
  onAction,
  refreshContactButton,
  showLogPopover,
  variant,
}: UseConversationActionButtonsWithRefreshProps): React.ReactNode {
  const { conversationMatches: loggedEntities } = conversation;
  const [logPopperOpened, setLogPopperOpened] = useState(false);
  const [keepActions, setKeepActions] = useState(false);
  const [anchor, setMenuAnchor] = useState<Element | null>(null);
  const logRef = useRef(null);

  const historyButtons = useHistoryActionButtons(
    actions,
    (actionType, event) => {
      if (
        (actionType === 'createLog' ||
          actionType === 'selectRecordsForAutoLog') &&
        showLogPopover
      ) {
        setLogPopperOpened(true);
        return;
      }
      if (actionType === 'viewLog') {
        if (loggedEntities?.length === 1) {
          void onAction('viewLog', loggedEntities[0]);
          return;
        }
        setMenuAnchor(event?.currentTarget as Element);
        setKeepActions(true);
        return;
      }
      void onAction(actionType);
    },
  );
  const buttons = insertRefreshContactActionButton(
    historyButtons,
    refreshContactButton,
    'delete',
  );

  const viewCRMLogMenu = useMemo(() => {
    if (loggedEntities?.length <= 1) {
      return null;
    }
    return (
      <Menu
        anchorEl={anchor}
        data-sign="viewCRMLogMenu"
        onClick={(event) => event.stopPropagation()}
        onClose={() => setMenuAnchor(null)}
        onExitComplete={() => setKeepActions(false)}
        open={Boolean(anchor)}
      >
        <MenuList>
          {loggedEntities.map(({ id, name, url }) => (
            <MenuItem
              data-sign={id}
              key={id}
              onClick={(event) => {
                void onAction('viewLog', { id, name, url });
                event.stopPropagation();
              }}
              title={name}
            >
              <MenuItemText className="truncate">{name}</MenuItemText>
            </MenuItem>
          ))}
        </MenuList>
      </Menu>
    );
  }, [anchor, loggedEntities, onAction]);

  return (
    <>
      <ActionMenuList
        buttons={buttons}
        displayCount={displayCount}
        forceActionsOpen={logPopperOpened || keepActions}
        moreButtonProps={moreButtonProps}
        propsMap={
          variant === 'plain'
            ? {
                all: {
                  variant: 'icon',
                },
              }
            : undefined
        }
        refMap={{
          createLog: logRef,
          selectRecordsForAutoLog: logRef,
          viewLog: logRef,
        }}
        variant={variant}
      />
      <ConversationLogPopover
        anchorEl={logRef.current}
        conversation={conversation}
        createNewEntityTooltip={createNewEntityTooltip}
        onClose={() => setLogPopperOpened(false)}
        opened={logPopperOpened}
      />
      {viewCRMLogMenu}
    </>
  );
}
