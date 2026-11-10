import type { UnknownRecord } from "../../services/ThirdParty";

export function normalizeFormData(value: unknown): UnknownRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as UnknownRecord;
}

export function valuesAreEqual(first: unknown, second: unknown): boolean {
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

export function getChangedKeys(
  currentFormData: UnknownRecord,
  nextFormData: UnknownRecord
): string[] {
  return Object.keys(nextFormData).filter(
    (key) => !valuesAreEqual(currentFormData[key], nextFormData[key])
  );
}

export function allRequiredFieldsAreFilled(
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

/** Whether a form schema has a top-level field. */
export function hasFormField(schema: UnknownRecord, key: string): boolean {
  const properties = schema.properties;
  return (
    !!properties &&
    typeof properties === "object" &&
    Object.prototype.hasOwnProperty.call(properties, key)
  );
}
