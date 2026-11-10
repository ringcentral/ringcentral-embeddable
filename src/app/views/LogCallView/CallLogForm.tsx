import { JSONSchemaPage } from "@ringcentral-integration/jsonschema-spring-page";
import React from "react";

import type { ThirdPartyPage, UnknownRecord } from "../../services/ThirdParty";

import {
  getChangedKeys,
  normalizeFormData,
  valuesAreEqual,
} from "./callLogForm.helper";

interface CallLogFormProps {
  page: ThirdPartyPage;
  formData: UnknownRecord;
  /** A user change, with the keys it changed. */
  onChange: (formData: UnknownRecord, changedKeys: string[]) => void;
  onButtonClick: (buttonId: string, formData: UnknownRecord) => void;
  onSubmit: (formData: UnknownRecord) => void;
}

/**
 * The host's call log form (`$LOG-CALL`), or the default one, without the
 * page around it or its save button.
 */
export function CallLogForm({
  page,
  formData,
  onChange,
  onButtonClick,
  onSubmit,
}: CallLogFormProps): React.ReactElement {
  return (
    <JSONSchemaPage
      schema={page.schema ?? {}}
      uiSchema={page.uiSchema ?? {}}
      formData={formData}
      hiddenSubmitButton
      onFormDataChange={(value: unknown) => {
        const nextFormData = normalizeFormData(value);
        if (valuesAreEqual(formData, nextFormData)) {
          return;
        }
        onChange(nextFormData, getChangedKeys(formData, nextFormData));
      }}
      onButtonClick={(buttonId) => onButtonClick(buttonId, formData)}
      onSubmit={() => onSubmit(formData)}
    />
  );
}
