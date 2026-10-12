import { render, screen } from "@testing-library/react";
import React from "react";

import { CallsListItem } from "../../src/app/views/CallHistoryView/CallsListItem";

jest.mock("@ringcentral-integration/next-widgets/components", () => ({
  ActionMenuList: ({ buttons }) => (
    <div data-sign="actions">
      {buttons.map(({ actionType }) => actionType).join(",")}
    </div>
  ),
  useHistoryActionButtons: (actions) =>
    actions.map(({ type }) => ({ actionType: type })),
}));

describe("CallsListItem status information", () => {
  test("uses shared status and logged info with the base actions", () => {
    const call = {
      activityMatches: [
        { message: "Waiting for CRM", status: "pending", type: "status" },
      ],
      hasSmartNote: true,
      id: "call-id",
      sessionId: "session-id",
    };
    const Status = jest.fn(() => <span data-sign="status">Notes</span>);
    const useCallHistoryItemInfo = jest.fn(() => ({
      actions: [{ type: "call" }],
      info: {
        Avatar: () => <span>Avatar</span>,
        DisplayName: () => <span>Ada</span>,
        Status,
        answeredByDelegate: false,
        logged: <span data-sign="loggedCall">Logged</span>,
        renderInfo: {},
        ringingElsewhere: false,
        startTime: "Today",
      },
    }));

    render(
      <CallsListItem
        additionalCallActions={[]}
        call={call}
        index={0}
        onAdditionalCallAction={jest.fn()}
        onRefreshContact={jest.fn()}
        refreshContactDisabled={false}
        useActionsHandler={() => jest.fn()}
        useCallHistoryItemInfo={useCallHistoryItemInfo}
      />
    );

    expect(useCallHistoryItemInfo).toHaveBeenCalledWith(call, {
      selectIndex: 0,
      variant: "list",
    });
    expect(Status).toHaveBeenCalledWith({ mode: "icon" }, {});
    expect(screen.getByTestId("callStartTime")).toHaveClass(
      "inline-block",
      "max-w-full",
      "truncate"
    );
    expect(screen.getByTestId("loggedCall")).toHaveTextContent("Logged");
    expect(screen.getByTestId("logStatusMessage")).toHaveTextContent(
      "Waiting for CRM"
    );
    expect(screen.getByTestId("logStatusMessage")).toHaveClass(
      "block",
      "break-words",
      "text-warning-f",
      "whitespace-normal",
      "w-full"
    );
    expect(screen.getByTestId("actions")).toHaveTextContent("call");
  });
});
