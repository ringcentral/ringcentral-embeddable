import { useLocale } from "@ringcentral-integration/micro-core/src/app/hooks";
import type { CallsListPanelSpringProps } from "@ringcentral-integration/micro-phone/src/app/views/CallsListViewSpring/CallsList.view.interface";
import { ActionMenuList } from "@ringcentral-integration/next-widgets/components";
import { ListItem, ListItemText } from "@ringcentral/spring-ui";
import React, { memo } from "react";

import {
  createRefreshContactActionButton,
  insertRefreshContactActionButton,
} from "../../components/RefreshContactActionButton";
import type { ThirdPartyButton } from "../../services/ThirdParty/ThirdParty.interface";
import type { SmartNotesHistoryCall } from "./SmartNotesHistoryCall";
import i18n from "./i18n";
import { useCallHistoryActionButtons } from "./useCallHistoryActionButtons";

export type CallsListItemProps = {
  additionalCallActions: ThirdPartyButton[];
  call: SmartNotesHistoryCall;
  index: number;
  onAdditionalCallAction: (
    buttonId: string,
    resource: unknown
  ) => Promise<void> | void;
  onRefreshContact: (phoneNumber: string) => Promise<void> | void;
  refreshContactDisabled: boolean;
} & Omit<
  CallsListPanelSpringProps,
  "calls" | "lastPosition" | "setLastPosition" | "viewCallsFilterSelections"
>;

const CallsListItemComponent: React.FC<CallsListItemProps> = ({
  additionalCallActions,
  call,
  index,
  onAdditionalCallAction,
  onRefreshContact,
  refreshContactDisabled,
  useCallHistoryItemInfo,
  useActionsHandler,
  useItemRender,
}) => {
  const { t } = useLocale(i18n);
  const { info, actions } = useCallHistoryItemInfo(call, {
    selectIndex: 0,
    variant: "list",
  });
  const onAction = useActionsHandler(call, info, "Call history list");
  const historyActionButtons = useCallHistoryActionButtons({
    actions,
    additionalActions: additionalCallActions,
    call,
    onAction,
    onAdditionalAction: onAdditionalCallAction,
  });
  const refreshContactButton = createRefreshContactActionButton({
    disabled: refreshContactDisabled,
    label: t("refreshContact"),
    onRefreshContact,
    phoneNumber: info.renderInfo.dialToPhoneNumber,
  });
  const actionButtons = insertRefreshContactActionButton(
    historyActionButtons,
    refreshContactButton,
    "viewLog"
  );

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
