import { render, screen, within } from "@testing-library/react";
import React from "react";

import { CallDetailPage } from "../../next/app/views/CallHistoryView/CallDetailPage";

jest.mock("@ringcentral-integration/micro-core/src/app/components", () => ({
  AppFooterNav: ({ children }) => <footer>{children}</footer>,
  AppHeaderNav: ({ children }) => <header>{children}</header>,
  CopyIconButtonSpring: () => null,
}));

jest.mock("@ringcentral-integration/next-widgets/components", () => ({
  ActionMenuList: () => null,
  PageHeaderBackButton: () => null,
  useHistoryActionButtons: () => [],
}));

jest.mock("@ringcentral/spring-ui", () => ({
  Block: ({ children, ...props }) => <section {...props}>{children}</section>,
  BlockHeader: ({ children, ...props }) => <div {...props}>{children}</div>,
}));

jest.mock(
  "../../next/app/views/CallHistoryView/CallHistorySmartNotesAction",
  () => ({
    insertHistorySmartNotesAction: (buttons) => buttons,
    useHistorySmartNotesAction: () => null,
  })
);

function useCallHistoryItemInfo() {
  return {
    actions: [],
    info: {
      Avatar: () => <span>Avatar</span>,
      DisplayName: () => <span>Ada</span>,
      Status: () => <span>Completed</span>,
      callQueueName: "",
      displayPhoneNumber: "+16505550100",
      formattedPhoneNumber: "+16505550100",
      isConferenceCall: false,
      myCallerId: "+16505550200",
      myCallerIdTitle: "From",
      startTime: "10:00 AM",
    },
  };
}

const sharedProps = {
  currentCallLog: {},
  goBack: jest.fn(),
  useActionsHandler: jest.fn(() => jest.fn()),
  useCallHistoryItemInfo,
};

describe("CallDetailPage layout", () => {
  test("can hide caller ID and scroll time/status with page content", () => {
    const { rerender } = render(
      <CallDetailPage {...sharedProps}>Form content</CallDetailPage>
    );

    expect(screen.getByTestId("callerIdInfo")).toBeInTheDocument();
    expect(screen.queryByTestId("callDetailScrollableContent")).toBeNull();

    rerender(
      <CallDetailPage
        {...sharedProps}
        hideCallerIdInfo
        scrollCallInfoWithContent
      >
        Form content
      </CallDetailPage>
    );

    expect(screen.queryByTestId("callerIdInfo")).toBeNull();
    const scrollableContent = screen.getByTestId("callDetailScrollableContent");
    expect(
      within(scrollableContent).getByTestId("time-and-status")
    ).toBeInTheDocument();
    expect(
      within(scrollableContent).getByText("Form content")
    ).toBeInTheDocument();
  });
});
