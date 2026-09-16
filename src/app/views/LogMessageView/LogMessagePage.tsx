import { JSONSchemaPage } from "@ringcentral-integration/jsonschema-spring-page";
import {
  AppFooterNav,
  AppHeaderNav,
} from "@ringcentral-integration/micro-core/src/app/components";
import { useLocale } from "@ringcentral-integration/micro-core/src/app/hooks";
import type { ConversationLogItem } from "@ringcentral-integration/micro-message/src/app/services/ConversationLogger/ConversationLogger.interface";
import type { ConversationsViewSpring } from "@ringcentral-integration/micro-message/src/app/views/ConversationsViewSpring";
import {
  ActionMenuList,
  PageHeader,
  useHistoryActionButtons,
} from "@ringcentral-integration/next-widgets/components";
import { FaxMd, Smsmd, VoicemailMd } from "@ringcentral/spring-icon";
import { Button, Divider, EmptyState, Icon } from "@ringcentral/spring-ui";
import React, { useMemo, useState } from "react";

import { CallerIdInfoButton } from "../../components/CallerIdInfoButton";
import type { ThirdPartyPage, UnknownRecord } from "../../services/ThirdParty";
import { hasLoggedConversation } from "../ConversationsView/ConversationLogAction";

import {
  areRequiredLogMessageFieldsFilled,
  getChangedLogMessageKeys,
  type LoggableConversation,
  logMessageValuesAreEqual,
  normalizeLogMessageFormData,
  resolveLogMessagePage,
} from "./LogMessagePage.helper";
import i18n from "./i18n";

interface LogMessagePageProps {
  conversation?: LoggableConversation;
  conversationLog?: Record<string, ConversationLogItem>;
  customizedPage?: ThirdPartyPage;
  onBack: () => void;
  onButtonClick: (buttonId: string, formData: UnknownRecord) => void;
  onFormDataChange: (formData: UnknownRecord, changedKeys: string[]) => void;
  onSubmit: (formData: UnknownRecord) => void;
  onViewLog: () => Promise<void>;
  saving: boolean;
  useConversationItemInfo: ConversationsViewSpring["useConversationItemInfo"];
}

interface LogMessageContentProps
  extends Omit<LogMessagePageProps, "conversation" | "customizedPage"> {
  conversation: LoggableConversation;
  formData: UnknownRecord;
  page: ThirdPartyPage;
  saveLabel: string;
  setFormData: (formData: UnknownRecord) => void;
}

function LogMessageContent({
  conversation,
  conversationLog,
  formData,
  onBack,
  onButtonClick,
  onFormDataChange,
  onSubmit,
  onViewLog,
  page,
  saveLabel,
  saving,
  setFormData,
  useConversationItemInfo,
}: LogMessageContentProps): React.ReactElement {
  const { t } = useLocale(i18n);
  const { info } = useConversationItemInfo(conversation, {
    pageType:
      conversation.type === "Fax"
        ? "fax"
        : conversation.type === "VoiceMail"
        ? "voicemail"
        : "text",
  });
  const { creationTime, formattedPhoneNumber, isInbound } = info;
  const schema = page.schema ?? {};
  const uiSchema = page.uiSchema ?? {};
  const saveButtonLabel = uiSchema.submitButtonOptions?.submitText || saveLabel;
  const messageCount = Object.values(conversationLog ?? {}).reduce(
    (count, item) => count + item.messages.length,
    0
  );
  const conversationIcon =
    conversation.type === "VoiceMail"
      ? VoicemailMd
      : conversation.type === "Fax"
      ? FaxMd
      : Smsmd;
  const conversationNumber =
    formattedPhoneNumber ||
    (conversation.correspondents ?? [])
      .map(({ extensionNumber, phoneNumber }) => phoneNumber || extensionNumber)
      .filter((number): number is string => Boolean(number))
      .join(", ");
  const callerId = (
    isInbound ? conversation.from?.name : conversation.to?.[0]?.name
  )?.trim();
  const conversationType =
    conversation.type === "VoiceMail"
      ? t("voicemail")
      : conversation.type === "Fax"
      ? t("fax")
      : t("sms");
  const viewLogButtons = useHistoryActionButtons(
    hasLoggedConversation(conversation)
      ? [{ label: t("viewLogDetails"), type: "viewLog" as const }]
      : [],
    async (actionType) => {
      if (actionType === "viewLog") {
        await onViewLog();
      }
    }
  );
  return (
    <div className="flex h-full flex-col" data-sign="logMessagePage">
      <AppHeaderNav override resetImmediately>
        <PageHeader
          onBackClick={onBack}
          endAdornment={
            viewLogButtons.length > 0 ? (
              <ActionMenuList
                buttons={viewLogButtons}
                data-sign="logMessageHeaderActions"
                displayCount={1}
                variant="plain"
                propsMap={{ all: { variant: "contained" } }}
              />
            ) : undefined
          }
        >
          <span className="truncate" data-sign="logMessagePageTitle">
            {page.title}
          </span>
        </PageHeader>
      </AppHeaderNav>
      <div className="flex-auto overflow-y-auto">
        <div className="px-4 py-2" data-sign="conversationLogInfo">
          <div
            className="flex min-w-0 items-center justify-between gap-3 pb-2"
            data-sign="conversationLogInfoContent"
          >
            <div className="flex min-w-0 items-center gap-2">
              <Icon
                data-sign="conversationTypeIcon"
                size="medium"
                symbol={conversationIcon}
              />
              <div className="flex min-w-0 flex-col">
                <div className="flex min-w-0 items-center gap-0.5">
                  <p
                    className="min-w-0 truncate typography-mainText text-neutral-b0"
                    data-sign="logMessagePhoneNumber"
                    title={conversationNumber}
                  >
                    {conversationNumber || t("unknown")}
                  </p>
                  <CallerIdInfoButton
                    callerId={callerId}
                    dataSign="conversationCallerIdInfo"
                    title={t("callerId", { name: callerId ?? "" })}
                  />
                </div>
                <p
                  className="typography-descriptor text-neutral-b2"
                  data-sign="conversationType"
                >
                  {conversationType}
                </p>
              </div>
            </div>
            <div className="flex flex-none flex-col text-right text-neutral-b2">
              <div
                className="typography-descriptor"
                data-message-count={messageCount}
                data-sign="logMessageCount"
              >
                {t("totalMessages", { count: messageCount })}
              </div>
              <p
                className="typography-descriptor"
                data-sign="logMessageCreationTime"
              >
                {creationTime}
              </p>
            </div>
          </div>
          <Divider
            className="mb-2"
            data-sign="conversationLogInfoDivider"
            orientation="horizontal"
          />
        </div>
        <div className="px-4 pb-4 pt-2">
          <JSONSchemaPage
            schema={schema}
            uiSchema={uiSchema}
            formData={formData}
            hiddenSubmitButton
            onFormDataChange={(value: unknown) => {
              const nextFormData = normalizeLogMessageFormData(value);
              if (logMessageValuesAreEqual(formData, nextFormData)) {
                return;
              }
              const changedKeys = getChangedLogMessageKeys(
                formData,
                nextFormData
              );
              setFormData(nextFormData);
              onFormDataChange(nextFormData, changedKeys);
            }}
            onButtonClick={(buttonId) => onButtonClick(buttonId, formData)}
            onSubmit={() => onSubmit(formData)}
          />
        </div>
      </div>
      <div
        className="flex-none border-t border-neutral-b4/50 p-3"
        data-sign="logMessageSaveFooter"
      >
        <Button
          fullWidth
          loading={saving}
          disabled={
            saving || !areRequiredLogMessageFieldsFilled(formData, schema)
          }
          data-sign="save-button"
          onClick={() => onSubmit(formData)}
        >
          {saveButtonLabel}
        </Button>
      </div>
      <AppFooterNav />
    </div>
  );
}

export function LogMessagePage({
  conversation,
  conversationLog,
  customizedPage,
  onBack,
  onButtonClick,
  onFormDataChange,
  onSubmit,
  onViewLog,
  saving,
  useConversationItemInfo,
}: LogMessagePageProps): React.ReactElement {
  const { t } = useLocale(i18n);
  const page = useMemo(
    () =>
      conversation
        ? resolveLogMessagePage(conversation, customizedPage, {
            contact: t("contact"),
            editLog: t("editLog"),
            logMessages: t("logMessages"),
            save: t("save"),
            unknown: t("unknown"),
          })
        : null,
    [conversation, customizedPage, t]
  );
  const pageFormData = useMemo(
    () => normalizeLogMessageFormData(page?.formData),
    [page?.formData]
  );
  const [editedFormData, setEditedFormData] = useState<{
    base: UnknownRecord;
    data: UnknownRecord;
  } | null>(null);
  // The host can register its page after this route starts rendering, so the
  // form data has to be derived from the page in the same render as the schema.
  // Otherwise the form reports the defaults it computes for the new schema as a
  // user change, and the host overwrites its own form data with it.
  const formData =
    editedFormData &&
    logMessageValuesAreEqual(editedFormData.base, pageFormData)
      ? editedFormData.data
      : pageFormData;

  if (!conversation || !page) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState title={t("messageNotFound")} />
      </div>
    );
  }
  return (
    <LogMessageContent
      conversation={conversation}
      conversationLog={conversationLog}
      formData={formData}
      onBack={onBack}
      onButtonClick={onButtonClick}
      onFormDataChange={onFormDataChange}
      onSubmit={onSubmit}
      onViewLog={onViewLog}
      page={page}
      saveLabel={t("save")}
      saving={saving}
      setFormData={(nextFormData) =>
        setEditedFormData({ base: pageFormData, data: nextFormData })
      }
      useConversationItemInfo={useConversationItemInfo}
    />
  );
}
