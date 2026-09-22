import { JSONSchemaPage } from "@ringcentral-integration/jsonschema-spring-page";
import { useLocale } from "@ringcentral-integration/micro-core/src/app/hooks";
import type { HistoryCall } from "@ringcentral-integration/micro-phone/src/app/services";
import type { CallDetailViewPanelProps } from "@ringcentral-integration/micro-phone/src/app/views/CallDetailView/CallDetail.view.interface";
import {
  Button,
  CircularProgressIndicator,
  EmptyState,
} from "@ringcentral/spring-ui";
import React, { useMemo, useState } from "react";

import type { CompatibleCall } from "../../services/CallLogger";
import type { ThirdPartyPage, UnknownRecord } from "../../services/ThirdParty";
import { CallDetailPage } from "../CallHistoryView/CallDetailPage";

import i18n from "./i18n";
import { getLoggedActivity, resolveLogCallPage } from "./LogCallPage.helper";

const HIDDEN_LOG_CALL_HEADER_ACTIONS = new Set([
  "call",
  "createLog",
  "text",
  "viewEntity",
  "viewLog",
]);

interface LogCallPageProps {
  call: CompatibleCall | null;
  customizedPage?: ThirdPartyPage;
  loading: boolean;
  logButtonTitle: string | null;
  onBack: () => void;
  onButtonClick: (buttonId: string, formData: UnknownRecord) => void;
  onFormDataChange: (formData: UnknownRecord, changedKeys: string[]) => void;
  onSubmit: (formData: UnknownRecord) => void;
  onViewLog: () => Promise<void>;
  saving: boolean;
  useActionsHandler: CallDetailViewPanelProps["useActionsHandler"];
  useCallHistoryItemInfo: CallDetailViewPanelProps["useCallHistoryItemInfo"];
}

function normalizeFormData(value: unknown): UnknownRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as UnknownRecord;
}

function valuesAreEqual(first: unknown, second: unknown): boolean {
  if (
    first &&
    second &&
    typeof first === "object" &&
    typeof second === "object"
  ) {
    return JSON.stringify(first) === JSON.stringify(second);
  }
  return first === second;
}

function getChangedKeys(
  currentFormData: UnknownRecord,
  nextFormData: UnknownRecord
): string[] {
  return Object.keys(nextFormData).filter(
    (key) => !valuesAreEqual(currentFormData[key], nextFormData[key])
  );
}

function allRequiredFieldsAreFilled(
  formData: UnknownRecord,
  schema: UnknownRecord
): boolean {
  if (!Array.isArray(schema.required)) {
    return true;
  }
  return schema.required
    .filter((key): key is string => typeof key === "string")
    .every((key) => {
      const value = formData[key];
      return value !== undefined && value !== null && value !== "";
    });
}

export function LogCallPage({
  call,
  customizedPage,
  loading,
  logButtonTitle,
  onBack,
  onButtonClick,
  onFormDataChange,
  onSubmit,
  onViewLog,
  saving,
  useActionsHandler,
  useCallHistoryItemInfo,
}: LogCallPageProps): React.ReactElement {
  const { t } = useLocale(i18n);
  const page = useMemo(
    () =>
      call
        ? resolveLogCallPage(
            call,
            customizedPage,
            {
              addCallLogNote: t("addCallLogNote"),
              contact: t("contact"),
              editLog: t("editLog"),
              logCall: t("logCall"),
              note: t("note"),
              save: t("save"),
            },
            logButtonTitle
          )
        : null,
    [call, customizedPage, logButtonTitle, t]
  );
  const pageFormData = useMemo(
    () => normalizeFormData(page?.formData),
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
    editedFormData && valuesAreEqual(editedFormData.base, pageFormData)
      ? editedFormData.data
      : pageFormData;

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <CircularProgressIndicator size="large" color="primary" />
      </div>
    );
  }
  if (!call || !page) {
    console.warn('[LogCallPage] Showing callNotFound empty state:', {
      hasCall: Boolean(call),
      hasPage: Boolean(page),
      call,
    });
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState title={t("callNotFound")} />
      </div>
    );
  }

  const schema = page.schema ?? {};
  const uiSchema = page.uiSchema ?? {};
  const saveButtonLabel = uiSchema.submitButtonOptions?.submitText || t("save");
  const useLogCallItemInfo: CallDetailViewPanelProps["useCallHistoryItemInfo"] =
    (historyCall, options) => {
      const result = useCallHistoryItemInfo(historyCall, options);
      const viewLogAction = getLoggedActivity(call)
        ? [{ label: t("viewLogDetails"), type: "viewLog" as const }]
        : [];
      return {
        ...result,
        actions: [
          ...viewLogAction,
          ...result.actions.filter(
            ({ type }) => !HIDDEN_LOG_CALL_HEADER_ACTIONS.has(type)
          ),
        ],
      };
    };
  const useLogCallActionsHandler: CallDetailViewPanelProps["useActionsHandler"] =
    (historyCall, info, location) => {
      const onAction = useActionsHandler(historyCall, info, location);
      return async (actionType) => {
        if (actionType === "viewLog") {
          await onViewLog();
          return;
        }
        await onAction(actionType);
      };
    };

  return (
    <CallDetailPage
      currentCallLog={call as HistoryCall}
      headerTitle={page.title}
      hideCallerIdInfo
      scrollCallInfoWithContent
      showLogCallInfo
      footer={
        <div
          className="p-3 border-t border-neutral-b4/50 mt-auto flex-none"
          data-sign="logCallSaveFooter"
        >
          <Button
            fullWidth
            loading={saving}
            disabled={saving || !allRequiredFieldsAreFilled(formData, schema)}
            data-sign="save-button"
            onClick={() => onSubmit(formData)}
          >
            {saveButtonLabel}
          </Button>
        </div>
      }
      goBack={onBack}
      useActionsHandler={useLogCallActionsHandler}
      useCallHistoryItemInfo={useLogCallItemInfo}
    >
      <div className="px-4 pb-4 pt-2">
        <JSONSchemaPage
          schema={schema}
          uiSchema={uiSchema}
          formData={formData}
          hiddenSubmitButton
          onFormDataChange={(value: unknown) => {
            const nextFormData = normalizeFormData(value);
            if (valuesAreEqual(formData, nextFormData)) {
              return;
            }
            const changedKeys = getChangedKeys(formData, nextFormData);
            setEditedFormData({ base: pageFormData, data: nextFormData });
            onFormDataChange(nextFormData, changedKeys);
          }}
          onButtonClick={(buttonId) => onButtonClick(buttonId, formData)}
          onSubmit={() => onSubmit(formData)}
        />
      </div>
    </CallDetailPage>
  );
}
