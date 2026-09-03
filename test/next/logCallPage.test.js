import { JSONSchemaPage } from "@ringcentral-integration/jsonschema-spring-page";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

import { LogCallPage } from "../../next/app/views/LogCallView/LogCallPage";

jest.mock("../../next/app/views/CallHistoryView/CallDetailPage", () => ({
  CallDetailPage: ({
    children,
    currentCallLog,
    footer,
    goBack,
    hideCallerIdInfo,
    scrollCallInfoWithContent,
    useCallHistoryItemInfo,
  }) => {
    const { actions } = useCallHistoryItemInfo(currentCallLog, {
      selectIndex: 0,
      variant: "detail",
    });
    return (
      <div
        data-hide-caller-id-info={Boolean(hideCallerIdInfo)}
        data-scroll-call-info={Boolean(scrollCallInfoWithContent)}
        data-sign="callDetailPage"
      >
        <button type="button" onClick={goBack}>
          Back
        </button>
        <span data-sign="headerActions">
          {actions.map(({ type }) => type).join(",")}
        </span>
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
    saving: false,
    useActionsHandler: jest.fn(),
    useCallHistoryItemInfo: jest.fn(() => ({
      actions: [{ type: "viewLog" }, { type: "call" }],
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
      "data-hide-caller-id-info",
      "true"
    );
    expect(screen.getByTestId("callDetailPage")).toHaveAttribute(
      "data-scroll-call-info",
      "true"
    );
    expect(screen.getByTestId("headerActions")).toHaveTextContent("call");
    expect(screen.getByTestId("headerActions")).not.toHaveTextContent(
      "viewLog"
    );
    expect(screen.getByTestId("logCallFormTitle")).toHaveTextContent(
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

  test("disables and loads the footer button while saving", () => {
    render(<LogCallPage {...createProps({ saving: true })} />);

    const saveButton = screen.getByRole("button", { name: "Store" });
    expect(saveButton).toBeDisabled();
    expect(saveButton).toHaveAttribute("data-loading", "true");
  });
});
