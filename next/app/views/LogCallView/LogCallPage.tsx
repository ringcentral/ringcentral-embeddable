import { JSONSchemaPage } from "@ringcentral-integration/jsonschema-spring-page";
import { useLocale } from "@ringcentral-integration/micro-core/src/app/hooks";
import type { HistoryCall } from "@ringcentral-integration/micro-phone/src/app/services";
import type { CallDetailViewPanelProps } from "@ringcentral-integration/micro-phone/src/app/views/CallDetailView/CallDetail.view.interface";
import {
  Button,
  CircularProgressIndicator,
  EmptyState,
} from "@ringcentral/spring-ui";
import React, { useEffect, useMemo, useState } from "react";

import type { CompatibleCall } from "../../services/CallLogger";
import type { ThirdPartyPage, UnknownRecord } from "../../services/ThirdParty";
import { CallDetailPage } from "../CallHistoryView/CallDetailPage";

import i18n from "./i18n";
import { resolveLogCallPage } from "./LogCallPage.helper";

interface LogCallPageProps {
  call: CompatibleCall | null;
  customizedPage?: ThirdPartyPage;
  loading: boolean;
  logButtonTitle: string | null;
  onBack: () => void;
  onButtonClick: (buttonId: string, formData: UnknownRecord) => void;
  onFormDataChange: (formData: UnknownRecord, changedKeys: string[]) => void;
  onSubmit: (formData: UnknownRecord) => void;
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
  const [formData, setFormData] = useState<UnknownRecord>(() =>
    normalizeFormData(page?.formData)
  );
  useEffect(() => {
    setFormData(normalizeFormData(page?.formData));
  }, [page?.formData, page?.id]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <CircularProgressIndicator size="large" color="primary" />
      </div>
    );
  }
  if (!call || !page) {
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
      return {
        ...result,
        actions: result.actions.filter(
          ({ type }) => type !== "viewLog" && type !== "createLog"
        ),
      };
    };

  return (
    <CallDetailPage
      currentCallLog={call as HistoryCall}
      hideCallerIdInfo
      scrollCallInfoWithContent
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
      useActionsHandler={useActionsHandler}
      useCallHistoryItemInfo={useLogCallItemInfo}
    >
      <div className="px-4 pb-4 pt-2">
        {page.title ? (
          <h2
            className="mb-3 truncate typography-subtitle text-neutral-b0"
            data-sign="logCallFormTitle"
          >
            {page.title}
          </h2>
        ) : null}
        <JSONSchemaPage
          schema={schema}
          uiSchema={uiSchema}
          formData={formData}
          hiddenSubmitButton
          onFormDataChange={(value: unknown) => {
            const nextFormData = normalizeFormData(value);
            const changedKeys = getChangedKeys(formData, nextFormData);
            setFormData(nextFormData);
            onFormDataChange(nextFormData, changedKeys);
          }}
          onButtonClick={(buttonId) => onButtonClick(buttonId, formData)}
          onSubmit={() => onSubmit(formData)}
        />
      </div>
    </CallDetailPage>
  );
}
