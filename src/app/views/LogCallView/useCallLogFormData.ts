import { useCallback, useMemo, useState } from "react";

import type { ThirdPartyPage, UnknownRecord } from "../../services/ThirdParty";

import { normalizeFormData, valuesAreEqual } from "./callLogForm.helper";

/**
 * A log form's data: the page's own form data until the user edits it.
 *
 * The host can register its page after the form starts rendering, so the form
 * data is derived from the page in the same render as the schema. Otherwise
 * the form reports the defaults it computes for the new schema as a user
 * change, and the host overwrites its own form data with it. A page the host
 * posts again with other data replaces the edits.
 */
export function useCallLogFormData(page?: ThirdPartyPage | null): {
  formData: UnknownRecord;
  setFormData: (formData: UnknownRecord) => void;
} {
  const pageFormData = useMemo(
    () => normalizeFormData(page?.formData),
    [page?.formData]
  );
  const [editedFormData, setEditedFormData] = useState<{
    base: UnknownRecord;
    data: UnknownRecord;
  } | null>(null);
  const formData =
    editedFormData && valuesAreEqual(editedFormData.base, pageFormData)
      ? editedFormData.data
      : pageFormData;
  const setFormData = useCallback(
    (data: UnknownRecord) => setEditedFormData({ base: pageFormData, data }),
    [pageFormData]
  );
  return { formData, setFormData };
}
