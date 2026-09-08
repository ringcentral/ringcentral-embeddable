import { JSONSchemaPage } from "@ringcentral-integration/jsonschema-spring-page";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

import { LogCallPage } from "../../next/app/views/LogCallView/LogCallPage";
import logCallLabels from "../../next/app/views/LogCallView/i18n/en-US";

jest.mock("../../next/app/views/CallHistoryView/CallDetailPage", () => ({
  CallDetailPage: ({
    children,
    currentCallLog,
    footer,
    goBack,
    headerTitle,
    hideCallerIdInfo,
    scrollCallInfoWithContent,
    showLogCallInfo,
    useActionsHandler,
    useCallHistoryItemInfo,
  }) => {
    const { actions, info } = useCallHistoryItemInfo(currentCallLog, {
      selectIndex: 0,
      variant: "detail",
    });
    const onAction = useActionsHandler(
      currentCallLog,
      info,
      "Call history detail page"
    );
    return (
      <div
        data-hide-caller-id-info={Boolean(hideCallerIdInfo)}
        data-show-log-call-info={Boolean(showLogCallInfo)}
        data-scroll-call-info={Boolean(scrollCallInfoWithContent)}
        data-sign="callDetailPage"
      >
        <button type="button" onClick={goBack}>
          Back
        </button>
        <span data-sign="headerTitle">{headerTitle}</span>
        <span data-sign="headerActions">
          {actions.map(({ label, type }) => `${type}:${label ?? ""}`).join(",")}
        </span>
        {actions.map(({ label, type }) => (
          <button key={type} type="button" onClick={() => onAction(type)}>
            {label ?? type}
          </button>
        ))}
        {children}
        <footer>{footer}</footer>
      </div>
    );
  },
}));

function createCall() {
  return {
    activityMatches: [],
    direction: "Inbound",
    from: { name: "Ada", phoneNumber: "+16505550100" },
    fromMatches: [],
    sessionId: "session-id",
    to: { name: "Me", phoneNumber: "+16505550200" },
    toMatches: [],
    type: "Voice",
  };
}

function createProps(overrides = {}) {
  return {
    call: createCall(),
    customizedPage: {
      id: "$LOG-CALL",
      title: "Salesforce call log",
      schema: { required: ["name"], type: "object" },
      uiSchema: { submitButtonOptions: { submitText: "Store" } },
      formData: { name: "Ada" },
    },
    loading: false,
    logButtonTitle: "Log call",
    onBack: jest.fn(),
    onButtonClick: jest.fn(),
    onFormDataChange: jest.fn(),
    onSubmit: jest.fn(),
    onViewLog: jest.fn(async () => undefined),
    saving: false,
    useActionsHandler: jest.fn(() => jest.fn(async () => undefined)),
    useCallHistoryItemInfo: jest.fn(() => ({
      actions: [
        { label: "Log call", type: "viewLog" },
        { type: "call" },
        { type: "text" },
        { type: "viewEntity" },
      ],
      info: {},
    })),
    ...overrides,
  };
}

describe("LogCallPage", () => {
  beforeEach(() => {
    JSONSchemaPage.mockClear();
  });

  test("uses call details chrome, JSON schema content, and a fixed save footer", () => {
    const props = createProps();
    render(<LogCallPage {...props} />);

    expect(screen.getByTestId("callDetailPage")).toBeInTheDocument();
    expect(screen.getByTestId("callDetailPage")).toHaveAttribute(
      "data-show-log-call-info",
      "true"
    );
    expect(screen.getByTestId("callDetailPage")).toHaveAttribute(
      "data-hide-caller-id-info",
      "true"
    );
    expect(screen.getByTestId("callDetailPage")).toHaveAttribute(
      "data-scroll-call-info",
      "true"
    );
    expect(screen.getByTestId("headerActions")).not.toHaveTextContent(
      "viewEntity"
    );
    expect(screen.getByTestId("headerActions")).not.toHaveTextContent("call");
    expect(screen.getByTestId("headerActions")).not.toHaveTextContent("text");
    expect(screen.getByTestId("headerActions")).not.toHaveTextContent(
      "viewLog"
    );
    expect(screen.getByTestId("headerTitle")).toHaveTextContent(
      "Salesforce call log"
    );
    expect(screen.getByTestId("logCallSaveFooter")).toContainElement(
      screen.getByRole("button", { name: "Store" })
    );
    expect(screen.getByTestId("logCallSaveFooter")).toHaveClass(
      "border-t",
      "border-neutral-b4/50",
      "p-3"
    );
    expect(JSONSchemaPage).toHaveBeenCalledWith(
      expect.objectContaining({
        formData: { name: "Ada" },
        hiddenSubmitButton: true,
        schema: props.customizedPage.schema,
        uiSchema: props.customizedPage.uiSchema,
      }),
      {}
    );

    fireEvent.click(screen.getByRole("button", { name: "Change form" }));
    fireEvent.click(screen.getByRole("button", { name: "Custom action" }));
    fireEvent.click(screen.getByRole("button", { name: "Store" }));
    fireEvent.click(screen.getByRole("button", { name: "Back" }));

    expect(props.onFormDataChange).toHaveBeenCalledWith({ name: "Updated" }, [
      "name",
    ]);
    expect(props.onButtonClick).toHaveBeenCalledWith("custom", {
      name: "Updated",
    });
    expect(props.onSubmit).toHaveBeenCalledWith({ name: "Updated" });
    expect(props.onBack).toHaveBeenCalledTimes(1);
  });

  test("shows the correctly labelled view-log action for an existing call log", () => {
    const props = createProps({
      call: {
        ...createCall(),
        activityMatches: [{ id: "activity-id", type: "callLog" }],
      },
    });
    render(<LogCallPage {...props} />);

    expect(screen.getByTestId("headerActions")).toHaveTextContent(
      "viewLog:viewLogDetails"
    );
    expect(logCallLabels.viewLogDetails).toBe("View log details");
    fireEvent.click(screen.getByRole("button", { name: "viewLogDetails" }));
    expect(props.onViewLog).toHaveBeenCalledTimes(1);
  });

  test("disables and loads the footer button while saving", () => {
    render(<LogCallPage {...createProps({ saving: true })} />);

    const saveButton = screen.getByRole("button", { name: "Store" });
    expect(saveButton).toBeDisabled();
    expect(saveButton).toHaveAttribute("data-loading", "true");
  });
});
