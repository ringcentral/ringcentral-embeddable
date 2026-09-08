import {
  ConversationLogger,
  Conversations,
  MessageThread,
} from "@ringcentral-integration/micro-message/src/app/services";
import { ConversationsViewSpring } from "@ringcentral-integration/micro-message/src/app/views/ConversationsViewSpring";
import {
  action,
  injectable,
  optional,
  RcViewModule,
  RouterPlugin,
  type RouteComponentProps,
  state,
  useConnector,
} from "@ringcentral-integration/next-core";
import React, { useRef } from "react";

import { ThirdParty } from "../../services/ThirdParty";
import type {
  ThirdPartyConversation,
  UnknownRecord,
} from "../../services/ThirdParty";

import { LogMessagePage } from "./LogMessagePage";
import type { LoggableConversation } from "./LogMessagePage.helper";

@injectable({
  name: "LogMessageView",
})
export class LogMessageView extends RcViewModule {
  constructor(
    private readonly _conversationLogger: ConversationLogger,
    private readonly _conversations: Conversations,
    private readonly _conversationsView: ConversationsViewSpring,
    private readonly _thirdParty: ThirdParty,
    private readonly _router: RouterPlugin,
    @optional() private readonly _messageThread?: MessageThread
  ) {
    super();
  }

  @state
  private saving = false;

  @action
  private setSaving(saving: boolean): void {
    this.saving = saving;
  }

  private async viewLog(conversationId: string): Promise<void> {
    await this._conversationLogger.logConversation({
      conversationId,
      correspondentEntity: undefined!,
      redirect: true,
      triggerType: "viewLog",
    });
  }

  component({
    match,
  }: RouteComponentProps<{ conversationId: string }>): React.ReactElement {
    const conversationId = match.params.conversationId;
    const { conversation, conversationLog, customizedPage, saving } =
      useConnector(() => {
        const currentConversation = this._getConversation(conversationId);
        const currentConversationId =
          currentConversation?.conversationId ?? conversationId;
        return {
          conversation: currentConversation,
          conversationLog:
            this._conversationLogger.conversationLogMap[currentConversationId],
          customizedPage: this._thirdParty.customizedLogMessagesPage,
          saving: this.saving,
        };
      });
    const conversationRef = useRef(conversation);
    conversationRef.current = conversation;
    const { current: handlers } = useRef({
      onBack: () => this._router.goBack(),
      onButtonClick: (buttonId: string, formData: UnknownRecord) => {
        void this._thirdParty.onClickButtonInCustomizedPage(
          buttonId,
          "button",
          formData
        );
      },
      onFormDataChange: (formData: UnknownRecord, changedKeys: string[]) => {
        const currentConversationId =
          conversationRef.current?.conversationId ?? conversationId;
        const conversationLog =
          this._conversationLogger.conversationLogMap[currentConversationId];
        if (!conversationLog) {
          return;
        }
        void this._thirdParty.onCustomizedLogMessagesPageInputChanged({
          conversation: conversationLog as ThirdPartyConversation,
          formData,
          keys: changedKeys,
        });
      },
      onSubmit: async (formData: UnknownRecord) => {
        const currentConversation = conversationRef.current;
        if (!currentConversation || this.saving) {
          return;
        }
        this.setSaving(true);
        try {
          await this._conversationLogger.logConversation({
            conversationId: currentConversation.conversationId,
            correspondentEntity: undefined!,
            formData,
            redirect: true,
            triggerType: "logForm",
          });
          this._router.goBack();
        } finally {
          this.setSaving(false);
        }
      },
      onViewLog: async () => {
        const conversationId = conversationRef.current?.conversationId;
        if (!conversationId) {
          return;
        }
        await this.viewLog(conversationId);
      },
    });
    return (
      <LogMessagePage
        conversation={conversation}
        conversationLog={conversationLog}
        customizedPage={customizedPage}
        saving={saving}
        useConversationItemInfo={
          this._conversationsView.useConversationItemInfo
        }
        {...handlers}
      />
    );
  }

  private _getConversation(
    conversationId: string
  ): LoggableConversation | undefined {
    const conversation =
      this._conversations.formattedConversationsMap.get(conversationId) ??
      this._messageThread?.getThreadConversation(conversationId);
    if (!conversation) {
      return undefined;
    }
    const resolvedConversationId =
      conversation.conversationId ?? conversationId;
    return {
      ...conversation,
      conversationId: resolvedConversationId,
      conversationLogId: resolvedConversationId,
      conversationMatches:
        this._conversationLogger.dataMapping?.[resolvedConversationId] ??
        conversation.conversationMatches,
    } as LoggableConversation;
  }
}
