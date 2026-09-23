import { ActionMenuList } from '@ringcentral-integration/next-widgets/components';
import type { CallsListPanelSpringProps } from '@ringcentral-integration/micro-phone/src/app/views/CallsListViewSpring/CallsList.view.interface';
import { ListItem, ListItemText } from '@ringcentral/spring-ui';
import React, { memo } from 'react';

import { LogStatusMessage } from '../../../app/components/LogStatusMessage';
import { useCallHistoryActionButtons } from '../../../app/views/CallHistoryView/useCallHistoryActionButtons';

interface CallHistoryListItemProps {
  call: CallsListPanelSpringProps['calls'][0];
  index: number;
  useCallHistoryItemInfo: CallsListPanelSpringProps['useCallHistoryItemInfo'];
  useActionsHandler: CallsListPanelSpringProps['useActionsHandler'];
  useItemRender?: CallsListPanelSpringProps['useItemRender'];
}

const EMPTY_ADDITIONAL_ACTIONS: [] = [];

const noop = (): void => undefined;

const CallHistoryListItemComponent: React.FC<CallHistoryListItemProps> = ({
  call,
  index,
  useCallHistoryItemInfo,
  useActionsHandler,
  useItemRender,
}) => {
  const { info, actions } = useCallHistoryItemInfo(call, {
    selectIndex: 0,
    variant: 'list',
  });
  const onAction = useActionsHandler(call, info, 'Call history list');
  useItemRender?.(call, index);
  const {
    Avatar,
    DisplayName,
    Status,
    startTime,
    logged,
    answeredByDelegate,
    ringingElsewhere,
  } = info;
  const actionButtons = useCallHistoryActionButtons({
    actions,
    additionalActions: EMPTY_ADDITIONAL_ACTIONS,
    call,
    onAction,
    onAdditionalAction: noop,
  });
  return (
    <ListItem
      key={call.id}
      size="auto"
      className="group"
      classes={{
        content: 'bg-inherit !px-3 !py-2',
      }}
      onClick={() => onAction('viewDetail')}
      data-sign="callsListItem"
    >
      <Avatar />
      <ListItemText
        classes={{
          primaryPrimaryText:
            ringingElsewhere && !answeredByDelegate
              ? 'text-success-f'
              : undefined,
        }}
        primary={
          <div className="flex flex-col items-start gap-0.5 truncate">
            <DisplayName
              displayControl={{
                maybe: true,
                matchCounts: true,
              }}
            />
          </div>
        }
        secondary={
          <div className="flex min-w-0 flex-col items-start gap-0.5">
            {Status ? <Status mode="icon" /> : null}
            <LogStatusMessage
              className="block w-full"
              matches={call.activityMatches}
              multiline
            />
          </div>
        }
      />
      <div className="text-right min-h-11 max-w-[30%]">
        <span
          className="typography-descriptor text-neutral-b2 inline-block max-w-full truncate"
          data-sign="callStartTime"
        >
          {startTime}
        </span>
        {logged}
      </div>
      <ActionMenuList
        buttons={actionButtons}
        displayCount={actionButtons.length}
      />
    </ListItem>
  );
};

const CallHistoryListItem = memo(CallHistoryListItemComponent);

export { CallHistoryListItem };
