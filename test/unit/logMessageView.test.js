import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

jest.mock("../../src/app/services/ThirdParty", () => ({
  ThirdParty: class ThirdParty {},
}));

jest.mock(
  "@ringcentral-integration/micro-message/src/app/views/ConversationsViewSpring",
  () => ({ ConversationsViewSpring: class ConversationsViewSpring {} })
);

jest.mock("../../src/app/views/SideWidgetView", () => ({
  useSideWidgetBack: jest.requireActual(
    "../../src/app/views/SideWidgetView/useSideWidgetBack"
  ).useSideWidgetBack,
}));

jest.mock("../../src/app/views/LogMessageView/LogMessagePage", () => ({
  LogMessagePage: ({ conversation, onFormDataChange, onSubmit, onViewLog }) => (
    <div>
      <span data-sign="normalizedConversationId">
        {conversation?.conversationId}
      </span>
      <button
        type="button"
        onClick={() =>
          onFormDataChange({ contactId: "contact-2" }, ["contactId"])
        }
      >
        Change
      </button>
      <button
        type="button"
        onClick={() => onSubmit({ contactId: "contact-2", note: "Follow up" })}
      >
        Save
      </button>
      <button type="button" onClick={onViewLog}>
        View log details
      </button>
    </div>
  ),
}));

const {
  LogMessageView,
} = require("../../src/app/views/LogMessageView/LogMessage.view");
const {
  SideWidgetBackContext,
} = require("../../src/app/views/SideWidgetView/SideWidgetBackContext");

describe("LogMessageView", () => {
  test("uses the route id as the match-selection key when the record omits it", () => {
    const view = new LogMessageView(
      {
        conversationLogMap: { "conversation-id": {} },
        dataMapping: {},
      },
      {
        formattedConversationsMap: new Map([
          ["conversation-id", { correspondentMatches: [] }],
        ]),
      },
      { useConversationItemInfo: jest.fn() },
      { customizedLogMessagesPage: undefined },
      { goBack: jest.fn() }
    );

    const Host = () =>
      view.component({
        match: { params: { conversationId: "conversation-id" } },
      });
    render(<Host />);

    expect(screen.getByTestId("normalizedConversationId")).toHaveTextContent(
      "conversation-id"
    );
  });

  test("keeps the legacy input-change and log-form request payloads", async () => {
    const conversation = {
      conversationId: "conversation-id",
      correspondentMatches: [
        { id: "contact-1", name: "Ada" },
        { id: "contact-2", name: "Grace" },
      ],
    };
    const conversationLog = {
      "2026-09-04": { conversationId: "conversation-id" },
    };
    const conversationLogger = {
      conversationLogMap: { "conversation-id": conversationLog },
      dataMapping: {},
      logConversation: jest.fn(async () => {}),
    };
    const conversations = {
      formattedConversationsMap: new Map([["conversation-id", conversation]]),
    };
    const conversationsView = { useConversationItemInfo: jest.fn() };
    const thirdParty = {
      customizedLogMessagesPage: undefined,
      onClickButtonInCustomizedPage: jest.fn(),
      onCustomizedLogMessagesPageInputChanged: jest.fn(async () => {}),
    };
    const router = { goBack: jest.fn() };
    const view = new LogMessageView(
      conversationLogger,
      conversations,
      conversationsView,
      thirdParty,
      router
    );
    const Host = () =>
      view.component({
        match: { params: { conversationId: "conversation-id" } },
      });

    render(<Host />);
    fireEvent.click(screen.getByRole("button", { name: "Change" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(
      thirdParty.onCustomizedLogMessagesPageInputChanged
    ).toHaveBeenCalledWith({
      conversation: conversationLog,
      formData: { contactId: "contact-2" },
      keys: ["contactId"],
    });
    await waitFor(() =>
      expect(conversationLogger.logConversation).toHaveBeenCalledWith({
        conversationId: "conversation-id",
        correspondentEntity: undefined,
        formData: { contactId: "contact-2", note: "Follow up" },
        redirect: true,
        triggerType: "logForm",
      })
    );
    expect(router.goBack).toHaveBeenCalledTimes(1);
  });

  test("resolves a shared thread and logs its current conversation id", async () => {
    const threadConversation = {
      conversationId: "current-thread-id",
      conversationMatches: [],
      correspondentMatches: [],
    };
    const conversationLogger = {
      conversationLogMap: {
        "current-thread-id": {
          "2026-09-07": { conversationId: "current-thread-id" },
        },
      },
      dataMapping: {
        "current-thread-id": [{ id: "activity-id", name: "Activity" }],
      },
      logConversation: jest.fn(async () => {}),
    };
    const view = new LogMessageView(
      conversationLogger,
      { formattedConversationsMap: new Map() },
      { useConversationItemInfo: jest.fn() },
      {
        customizedLogMessagesPage: undefined,
        onClickButtonInCustomizedPage: jest.fn(),
        onCustomizedLogMessagesPageInputChanged: jest.fn(),
      },
      { goBack: jest.fn() },
      { getThreadConversation: jest.fn(() => threadConversation) }
    );
    const Host = () =>
      view.component({
        match: { params: { conversationId: "requested-thread-id" } },
      });

    render(<Host />);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(conversationLogger.logConversation).toHaveBeenCalledWith(
        expect.objectContaining({ conversationId: "current-thread-id" })
      )
    );
  });

  test("opens an existing conversation log without reopening the form", async () => {
    const conversationLogger = {
      conversationLogMap: { "conversation-id": {} },
      dataMapping: { "conversation-id": [{ id: "activity-id" }] },
      logConversation: jest.fn(async () => undefined),
    };
    const view = new LogMessageView(
      conversationLogger,
      {
        formattedConversationsMap: new Map([
          [
            "conversation-id",
            {
              conversationId: "conversation-id",
              conversationMatches: [],
              correspondentMatches: [],
            },
          ],
        ]),
      },
      { useConversationItemInfo: jest.fn() },
      { customizedLogMessagesPage: undefined },
      { goBack: jest.fn() }
    );
    const Host = () =>
      view.component({
        match: { params: { conversationId: "conversation-id" } },
      });

    render(<Host />);
    fireEvent.click(screen.getByRole("button", { name: "View log details" }));

    await waitFor(() =>
      expect(conversationLogger.logConversation).toHaveBeenCalledWith({
        conversationId: "conversation-id",
        correspondentEntity: undefined,
        redirect: true,
        triggerType: "viewLog",
      })
    );
  });

  test("closes its routed side widget tab after saving, instead of going back through history", async () => {
    const conversation = {
      conversationId: "conversation-id",
      correspondentMatches: [],
    };
    const conversationLogger = {
      conversationLogMap: { "conversation-id": {} },
      dataMapping: {},
      logConversation: jest.fn(async () => {}),
    };
    const router = { goBack: jest.fn() };
    const closeTab = jest.fn();
    const view = new LogMessageView(
      conversationLogger,
      {
        formattedConversationsMap: new Map([["conversation-id", conversation]]),
      },
      { useConversationItemInfo: jest.fn() },
      { customizedLogMessagesPage: undefined },
      router
    );
    const Host = () =>
      view.component({
        match: { params: { conversationId: "conversation-id" } },
      });

    render(
      <SideWidgetBackContext.Provider value={closeTab}>
        <Host />
      </SideWidgetBackContext.Provider>
    );
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(closeTab).toHaveBeenCalledTimes(1));
    expect(conversationLogger.logConversation).toHaveBeenCalled();
    expect(router.goBack).not.toHaveBeenCalled();
  });
});
