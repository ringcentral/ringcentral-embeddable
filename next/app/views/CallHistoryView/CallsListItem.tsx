import type { CallsListPanelSpringProps } from "@ringcentral-integration/micro-phone/src/app/views/CallsListViewSpring/CallsList.view.interface";
import {
  ActionMenuList,
  useHistoryActionButtons,
} from "@ringcentral-integration/next-widgets/components";
import { ListItem, ListItemText } from "@ringcentral/spring-ui";
import React, { memo } from "react";

import type { SmartNotesHistoryCall } from "./SmartNotesHistoryCall";

export type CallsListItemProps = {
  call: SmartNotesHistoryCall;
  index: number;
} & Omit<
  CallsListPanelSpringProps,
  "calls" | "lastPosition" | "setLastPosition" | "viewCallsFilterSelections"
>;

const CallsListItemComponent: React.FC<CallsListItemProps> = ({
  call,
  index,
  useCallHistoryItemInfo,
  useActionsHandler,
  useItemRender,
}) => {
  const { info, actions } = useCallHistoryItemInfo(call, {
    selectIndex: 0,
    variant: "list",
  });
  const onAction = useActionsHandler(call, info, "Call history list");
  const actionButtons = useHistoryActionButtons(actions, onAction);

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

  return (
    <ListItem
      key={call.id}
      size="auto"
      className="group"
      classes={{ content: "bg-inherit !px-3 !py-2" }}
      onClick={() => onAction("viewDetail")}
      data-sign="callsListItem"
    >
      <Avatar />
      <ListItemText
        classes={{
          primaryPrimaryText:
            ringingElsewhere && !answeredByDelegate
              ? "text-success-f"
              : undefined,
        }}
        primary={
          <div className="flex flex-col items-start gap-0.5 truncate">
            <DisplayName displayControl={{ maybe: true, matchCounts: true }} />
          </div>
        }
        secondary={Status ? <Status mode="icon" /> : undefined}
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
      <ActionMenuList buttons={actionButtons} />
    </ListItem>
  );
};

export const CallsListItem = memo(CallsListItemComponent);
