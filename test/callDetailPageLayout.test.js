import { render, screen, within } from "@testing-library/react";
import React from "react";

import { CallDetailPage } from "../src/app/views/CallHistoryView/CallDetailPage";
import callHistoryLabels from "../src/app/views/CallHistoryView/i18n/en-US";
import { SideWidgetTabsShownContext } from "../src/app/views/SideWidgetView/SideWidgetTabsShownContext";

jest.mock("@ringcentral-integration/micro-message/src/app/components", () => ({
  VoicemailPlayer: ({ uri }) => (
    <div data-sign="recordingPlayer" data-uri={uri} />
  ),
}));

jest.mock("@ringcentral-integration/micro-core/src/app/components", () => ({
  AppFooterNav: ({ children }) => <footer>{children}</footer>,
  AppHeaderNav: ({ children }) => <header>{children}</header>,
  CopyIconButtonSpring: () => null,
}));

jest.mock("@ringcentral-integration/micro-core/src/app/hooks", () => ({
  useLocale: () => ({
    currentLocale: "en-US",
    t: (key, values) => (values?.name ? `${key}:${values.name}` : key),
  }),
}));

jest.mock("@ringcentral-integration/next-widgets/components", () => ({
  ActionMenuList: ({ buttons }) => (
    <div data-sign="actionMenuList">
      {buttons.map(({ actionType, label }) => (
        <button data-sign={actionType} key={actionType} type="button">
          {label}
        </button>
      ))}
    </div>
  ),
  PageHeader: ({ children, endAdornment, onBackClick }) => (
    <div>
      <button type="button" onClick={onBackClick}>
        Back
      </button>
      {children}
      {endAdornment}
    </div>
  ),
  PageHeaderBackButton: () => null,
}));

jest.mock("@ringcentral/spring-ui", () => ({
  Block: ({ children, ...props }) => <section {...props}>{children}</section>,
  BlockHeader: ({ children, ...props }) => <div {...props}>{children}</div>,
  Divider: (props) => <hr {...props} />,
  Icon: (props) => <span {...props}>Call icon</span>,
  IconButton: (props) => <button type="button" {...props} />,
  Tooltip: ({ children, title }) => <span title={title}>{children}</span>,
  useEventCallback: (callback) => callback,
}));

jest.mock(
  "@ringcentral-integration/widgets/components/LogBasicInfoV2/i18n",
  () => ({
    __esModule: true,
    default: {
      getString: (key) => key,
    },
  })
);

function createUseCallHistoryItemInfo(actions = []) {
  return () => ({
    actions,
    info: {
      Avatar: () => <span>Avatar</span>,
      DisplayName: () => <span>Ada</span>,
      Status: () => <span>Completed</span>,
      callQueueName: "",
      displayPhoneNumber: "+16505550100",
      duration: "1 min 30 sec",
      formattedPhoneNumber: "+16505550100",
      isConferenceCall: false,
      myCallerId: "+16505550200",
      myCallerIdTitle: "From",
      startTime: "10:00 AM",
    },
  });
}

const sharedProps = {
  currentCallLog: {
    direction: "Inbound",
    from: { name: "Acme Support" },
    result: "Accepted",
  },
  goBack: jest.fn(),
  useActionsHandler: jest.fn(() => jest.fn()),
  useCallHistoryItemInfo: createUseCallHistoryItemInfo(),
};

describe("CallDetailPage layout", () => {
  test("drops a title-only header while the side widget tab bar names the page", () => {
    render(
      <SideWidgetTabsShownContext.Provider value>
        <CallDetailPage {...sharedProps} headerTitle="Log to TestService">
          Form content
        </CallDetailPage>
      </SideWidgetTabsShownContext.Provider>
    );

    expect(screen.queryByTestId("detailPageTitle")).toBeNull();
    expect(screen.getByText("Form content")).toBeInTheDocument();
  });

  test("keeps a titled header with actions under the side widget tab bar", () => {
    render(
      <SideWidgetTabsShownContext.Provider value>
        <CallDetailPage
          {...sharedProps}
          headerTitle="Log to TestService"
          useCallHistoryItemInfo={createUseCallHistoryItemInfo([
            { type: "call" },
          ])}
        >
          Form content
        </CallDetailPage>
      </SideWidgetTabsShownContext.Provider>
    );

    expect(screen.getByTestId("detailPageTitle")).toHaveTextContent(
      "Log to TestService"
    );
  });

  test("keeps the log action label for a logged call", () => {
    render(
      <CallDetailPage
        {...sharedProps}
        useCallHistoryItemInfo={createUseCallHistoryItemInfo([
          { type: "createLog", label: "Edit log" },
          { type: "call" },
          { type: "viewLog", label: "View log details" },
        ])}
      >
        Form content
      </CallDetailPage>
    );

    const buttons = within(screen.getByTestId("actionMenuList")).getAllByRole(
      "button"
    );
    expect(buttons.map((button) => button.textContent)).toEqual([
      "Edit log",
      "call",
      "View log details",
    ]);
  });

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

  test("shows legacy-style call information below a titled log-page header", () => {
    render(
      <CallDetailPage
        {...sharedProps}
        headerTitle="Log to TestService"
        showLogCallInfo
      >
        Form content
      </CallDetailPage>
    );

    expect(screen.getByTestId("detailPageTitle")).toHaveTextContent(
      "Log to TestService"
    );
    const callLogInfo = screen.getByTestId("callLogInfo");
    expect(callLogInfo).toHaveTextContent("+16505550100");
    expect(callLogInfo).toHaveTextContent("Accepted");
    expect(callLogInfo).toHaveTextContent("1 min 30 sec");
    expect(callLogInfo).toHaveTextContent("10:00 AM");
    expect(screen.getByTestId("callDirectionIcon")).toBeInTheDocument();
    expect(screen.getByTestId("callCallerIdInfo")).toHaveAccessibleName(
      "callerId:Acme Support"
    );
    expect(callHistoryLabels.callerId).toBe("Caller ID: {name}");
    expect(screen.getByTestId("callLogInfoDivider")).toBeInTheDocument();
    expect(screen.queryByText("Ada")).toBeNull();
    expect(screen.queryByText("Avatar")).toBeNull();
    expect(screen.queryByTestId("time-and-status")).toBeNull();
  });

  test("hides the caller ID action when the remote name is unavailable", () => {
    render(
      <CallDetailPage
        {...sharedProps}
        currentCallLog={{ direction: "Inbound", from: {}, result: "Accepted" }}
        headerTitle="Log to TestService"
        showLogCallInfo
      >
        Form content
      </CallDetailPage>
    );

    expect(screen.queryByTestId("callCallerIdInfo")).toBeNull();
  });

  test("uses the outbound destination name as caller ID", () => {
    render(
      <CallDetailPage
        {...sharedProps}
        currentCallLog={{
          direction: "Outbound",
          result: "Accepted",
          to: { name: "Outbound Caller ID" },
        }}
        headerTitle="Log to TestService"
        showLogCallInfo
      >
        Form content
      </CallDetailPage>
    );

    expect(screen.getByTestId("callCallerIdInfo")).toHaveAccessibleName(
      "callerId:Outbound Caller ID"
    );
  });

  test("shows the recording player only when a recording URI is available", () => {
    const { rerender } = render(
      <CallDetailPage
        {...sharedProps}
        recordingUri="https://media.example.com/recording.wav?access_token=token"
      >
        Form content
      </CallDetailPage>
    );

    const playerContainer = screen.getByTestId("recordingPlayerContainer");
    expect(playerContainer).toHaveAccessibleName("recording");
    expect(playerContainer).toHaveClass("w-full", "min-w-0");
    expect(screen.getByTestId("recordingPlayer")).toHaveAttribute(
      "data-uri",
      "https://media.example.com/recording.wav?access_token=token"
    );

    rerender(<CallDetailPage {...sharedProps}>Form content</CallDetailPage>);

    expect(screen.queryByTestId("recordingPlayerContainer")).toBeNull();
  });
});
