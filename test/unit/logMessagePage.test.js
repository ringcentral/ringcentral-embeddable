import { JSONSchemaPage } from "@ringcentral-integration/jsonschema-spring-page";
import { AppFooterNav } from "@ringcentral-integration/micro-core/src/app/components";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

import { LogMessagePage } from "../../src/app/views/LogMessageView/LogMessagePage";
import logMessageLabels from "../../src/app/views/LogMessageView/i18n/en-US";

jest.mock("@ringcentral-integration/micro-core/src/app/components", () => ({
  AppFooterNav: jest.fn(() => null),
  AppHeaderNav: ({ children }) => <header>{children}</header>,
  CopyIconButtonSpring: () => <button type="button">Copy</button>,
}));

jest.mock("@ringcentral-integration/micro-core/src/app/hooks", () => ({
  useLocale: () => ({
    t: (key, values) => (values?.name ? `${key}:${values.name}` : key),
  }),
}));

jest.mock("@ringcentral-integration/next-widgets/components", () => ({
  ActionMenuList: ({ buttons, displayCount, propsMap, variant, ...props }) => (
    <div {...props}>
      {buttons.map((button) => (
        <button key={button.type} type="button" onClick={button.onClick}>
          {button.label ?? button.type}
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
  useHistoryActionButtons: (actions, onAction) =>
    actions.map((action) => ({
      ...action,
      onClick: () => onAction(action.type),
    })),
}));

function createConversation() {
  return {
    conversationId: "conversation-id",
    conversationMatches: [],
    correspondentMatches: [],
    direction: "Inbound",
    from: { name: "Acme Support" },
    type: "VoiceMail",
  };
}

function createProps(overrides = {}) {
  return {
    conversation: createConversation(),
    conversationLog: {
      "2026-09-06": { messages: [{ id: "message-1" }] },
      "2026-09-07": {
        messages: [{ id: "message-2" }, { id: "message-3" }],
      },
    },
    customizedPage: {
      id: "$LOG-MESSAGES",
      title: "Salesforce message log",
      schema: { required: ["name"], type: "object" },
      uiSchema: { submitButtonOptions: { submitText: "Store" } },
      formData: { name: "Ada" },
    },
    onBack: jest.fn(),
    onButtonClick: jest.fn(),
    onFormDataChange: jest.fn(),
    onSubmit: jest.fn(),
    onViewLog: jest.fn(async () => undefined),
    saving: false,
    useConversationItemInfo: jest.fn(() => ({
      actions: [],
      info: {
        Avatar: () => <span>Avatar</span>,
        DisplayName: () => <span>Ada Lovelace</span>,
        creationTime: "Today",
        formattedPhoneNumber: "+1 650 555 0100",
        isInbound: true,
        matchedContact: { id: "contact-id" },
      },
    })),
    ...overrides,
  };
}

describe("LogMessagePage", () => {
  beforeEach(() => {
    AppFooterNav.mockClear();
    JSONSchemaPage.mockClear();
  });

  test("renders message context, the custom form, and fixed save action", () => {
    const props = createProps();
    render(<LogMessagePage {...props} />);

    expect(props.useConversationItemInfo).toHaveBeenCalledWith(
      props.conversation,
      { pageType: "voicemail" }
    );
    expect(screen.getByTestId("conversationLogInfoContent")).toContainElement(
      screen.getByText("+1 650 555 0100")
    );
    expect(screen.getByTestId("conversationTypeIcon")).toBeInTheDocument();
    expect(screen.getByTestId("conversationCallerIdInfo")).toHaveAccessibleName(
      "callerId:Acme Support"
    );
    expect(screen.getByTestId("conversationType")).toHaveTextContent(
      "voicemail"
    );
    expect(logMessageLabels.callerId).toBe("Caller ID: {name}");
    expect(logMessageLabels.voicemail).toBe("Voicemail");
    expect(
      screen.getByTestId("conversationLogInfoDivider")
    ).toBeInTheDocument();
    expect(screen.queryByTestId("conversationContactInfo")).toBeNull();
    expect(screen.queryByTestId("conversationMessageInfo")).toBeNull();
    expect(screen.queryByTestId("logMessageContactName")).toBeNull();
    expect(screen.queryByText("Ada Lovelace")).toBeNull();
    expect(screen.queryByText("Avatar")).toBeNull();
    expect(screen.getByTestId("logMessageCreationTime")).toHaveTextContent(
      "Today"
    );
    expect(screen.getByTestId("logMessageCount")).toHaveTextContent(
      "totalMessages"
    );
    expect(screen.getByTestId("logMessageCount")).toHaveAttribute(
      "data-message-count",
      "3"
    );
    expect(screen.getByTestId("logMessagePageTitle")).toHaveTextContent(
      "Salesforce message log"
    );
    expect(screen.getByTestId("logMessageSaveFooter")).toContainElement(
      screen.getByRole("button", { name: "Store" })
    );
    expect(AppFooterNav).toHaveBeenCalledTimes(1);
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

  test("hides caller ID information when the remote name is unavailable", () => {
    const props = createProps({
      conversation: { ...createConversation(), from: {} },
    });

    render(<LogMessagePage {...props} />);

    expect(screen.queryByTestId("conversationCallerIdInfo")).toBeNull();
  });

  test("uses the outbound recipient name as caller ID", () => {
    const props = createProps({
      conversation: {
        ...createConversation(),
        direction: "Outbound",
        from: { name: "Me" },
        to: [{ name: "Outbound Caller ID" }],
      },
      useConversationItemInfo: jest.fn(() => ({
        actions: [],
        info: {
          creationTime: "Today",
          formattedPhoneNumber: "+1 650 555 0100",
          isInbound: false,
        },
      })),
    });

    render(<LogMessagePage {...props} />);

    expect(screen.getByTestId("conversationCallerIdInfo")).toHaveAccessibleName(
      "callerId:Outbound Caller ID"
    );
  });

  test("does not show a header action for an unlogged conversation", () => {
    const props = createProps({
      useConversationItemInfo: jest.fn(() => ({
        actions: [
          { type: "viewEntity" },
          { label: "Log messages", type: "createLog" },
        ],
        info: {
          DisplayName: () => <span>Ada Lovelace</span>,
          creationTime: "Today",
          formattedPhoneNumber: "+1 650 555 0100",
          matchedContact: { id: "contact-id" },
        },
      })),
    });

    render(<LogMessagePage {...props} />);

    expect(screen.queryByTestId("logMessageHeaderActions")).toBeNull();
  });

  test("shows the correctly labelled view-log action for an existing log", () => {
    const props = createProps({
      conversation: {
        ...createConversation(),
        conversationMatches: [{ id: "activity-id" }],
      },
    });

    render(<LogMessagePage {...props} />);

    expect(screen.getByTestId("logMessageHeaderActions")).toHaveTextContent(
      "viewLogDetails"
    );
    expect(logMessageLabels.viewLogDetails).toBe("View log details");
    fireEvent.click(screen.getByRole("button", { name: "viewLogDetails" }));
    expect(props.onViewLog).toHaveBeenCalledTimes(1);
  });

  test("shows the missing state for an unknown conversation", () => {
    render(<LogMessagePage {...createProps({ conversation: undefined })} />);

    expect(screen.getByText("messageNotFound")).toBeInTheDocument();
  });
});
